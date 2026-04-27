import { MODEL } from "./constants";

// ── Token usage tracking ──────────────────────────────────────────────────────

let _onUsage = null;
export const setUsageCallback = (cb) => { _onUsage = cb; };

let _onRateLimit = null;
export const setRateLimitCallback = (cb) => { _onRateLimit = cb; };

// ── Response cleaning ─────────────────────────────────────────────────────────

export const cleanApiResponse = (raw) =>
  String(raw || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .replace(/[​‌‍﻿]/g, "")
    .trim();

// ── Core fetch wrapper ────────────────────────────────────────────────────────

const callClaude = async ({ system, userMessage, maxTokens = 1000 }) => {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  // Read as text first to avoid any encoding issues with emoji/unicode
  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    throw new Error(`Failed to parse API response envelope: ${rawText.slice(0, 200)}`);
  }

  if (res.status === 429) {
    if (_onRateLimit) _onRateLimit();
    throw new Error("rate_limit");
  }
  if (!res.ok) throw new Error(`API ${res.status}: ${data?.error?.message || JSON.stringify(data)}`);

  if (_onUsage && data.usage) _onUsage(data.usage);


  const raw = data.content?.find(b => b.type === "text")?.text || "";
  const clean = cleanApiResponse(raw);

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON parse failed. Raw response:\n", clean);
    throw new Error(`AI returned invalid JSON — try clicking Retry. (${e.message})`);
  }
};

// ── App summary is built in StepInput via buildAppSummaryFromCards ────────────

// ── Shared helpers ────────────────────────────────────────────────────────────

// Extract a labelled field from the appSummary string (e.g. "App stage: Pre-launch")
const extractField = (appSummary, label) => {
  const match = appSummary.match(new RegExp(`${label}:\\s*(.+)`));
  return match?.[1]?.trim() || "";
};

// ── Step 1: What Could Break (Analyze) ───────────────────────────────────────

const fetchAnalysisOverview = (appSummary) =>
  callClaude({
    maxTokens: 200,
    system: `You assess risk level for non-technical developers. Zero jargon.

CRITICAL: Respond with ONLY a raw JSON object. No text before or after. No markdown. No backticks. Start with { and end with }.

Required format:
{
  "summary": "One sentence about this app and what to focus on",
  "severity": "High",
  "severity_reason": "One sentence why"
}

severity must be exactly: Low, Medium, or High.`,
    userMessage: `App info:\n${appSummary}

Stage context: ${extractField(appSummary, "App stage") || "unknown"} — weight your severity rating accordingly.`,
  });

const fetchAnalysisDetail = (appSummary) =>
  callClaude({
    maxTokens: 1600,
    system: `You identify risks and quick wins for non-technical developers. Zero jargon.

CRITICAL: Respond with ONLY a raw JSON object. No text before or after. No markdown. No backticks. Start with { and end with }.

Required format:
{
  "top_risks": [
    {
      "title": "Short risk title under 8 words",
      "detail": "2-3 sentences: what could go wrong, in what scenario, and why it matters for this specific app",
      "impact": "One sentence — what breaks for real users if this fails",
      "fix_hint": "One concrete action to reduce this risk right now",
      "likelihood": "High",
      "emoji": "💳"
    }
  ],
  "probably_missed": ["Specific gap + one sentence on why developers typically miss this"],
  "quick_wins": ["One concrete actionable check they can do in under 5 minutes right now"]
}

likelihood must be exactly: High, Medium, or Low.
top_risks: 3 to 5 items ordered by likelihood descending.
probably_missed: 3 to 4 items. quick_wins: 3 to 4 items.
title under 8 words. detail 2-3 sentences. impact and fix_hint 1 sentence each, specific and concrete.`,
    userMessage: `App info:\n${appSummary}

Stage context: ${extractField(appSummary, "App stage") || "unknown"} — tailor your risks and quick wins to what matters most at this stage.
Developer flagged these as likely fragile: ${extractField(appSummary, "Likely fragile areas") || "none specified"} — ensure these are reflected in top_risks or probably_missed.`,
  });

export const fetchAnalysis = (appSummary, onSectionDone) => {
  fetchAnalysisOverview(appSummary)
    .then(data => onSectionDone("overview", data))
    .catch(e => onSectionDone("overview", null, e.message));

  fetchAnalysisDetail(appSummary)
    .then(data => onSectionDone("detail", data))
    .catch(e => onSectionDone("detail", null, e.message));
};


// ── Step 2: Test cases — async per-category ───────────────────────────────────

const TEST_CASE_SYSTEM = `You write plain-English testing instructions for non-technical developers who have no coding background. Zero QA jargon.

CRITICAL: Respond with ONLY a raw JSON object. No text before or after. No markdown. No backticks. Start with { and end with }.

Required format:
{
  "test_cases": [
    {
      "id": "CHK-001",
      "title": "Plain short title",
      "category": "Happy Path",
      "importance": "Critical",
      "starting_point": "Which page or screen to open before starting — e.g. 'the login page', 'your dashboard', 'the checkout page'",
      "steps": ["Step one", "Step two", "Step three"],
      "test_data": "Only for Broken Input tests: specific values to enter — e.g. 'Email: test@ | Password: leave blank'. Omit for other categories.",
      "what_good_looks_like": "One sentence — what success looks like",
      "what_bad_looks_like": "One sentence — what a bug looks like",
      "tip": "Optional tip under 12 words"
    }
  ]
}

Rules:
- importance must be: Critical, Important, or Nice to Have
- starting_point: always include — tell the user exactly which page/screen to open first. If an App URL is provided in the app info, use the real URL (e.g. "yourapp.com/login"). Otherwise use a plain description (e.g. "the login page")
- steps: 3 to 5 steps depending on flow complexity; multi-step flows like signup or payment need 4-5 steps
- If an App URL is provided, use the real domain in navigation steps — write "go to yourapp.com/signup" not "open your app's sign-up page"
- Each step must be concrete and specific — use real example values, NOT vague descriptions. Write "enter test@ as the email" not "enter an invalid email". Write "leave the password field blank" not "omit a required field"
- test_data: ONLY include for Broken Input category — list the exact values to enter as a simple string
- ONLY include steps a non-technical person can perform in a browser — no DevTools, no terminal, no code
- Every test must directly relate to one of the identified risks or missed areas from the analysis
- No duplicate tests across categories — each category has a distinct focus (see category instructions)
- Everything in plain everyday English`;

const CATEGORY_FOCUS = {
  "Happy Path": `Focus: the core flows that MUST work for users to get value. Cover: sign-up/login, the main action a paying user does, and the most critical risk area from the analysis. Avoid: error handling or edge cases (those belong in other categories).`,
  "Broken Input": `Focus: what happens when users submit bad, empty, or unexpected data. Cover: empty required fields, invalid formats (bad email, wrong file type), and inputs related to the top risks. Avoid: valid/happy flows or security exploits.`,
  "Edge Case": `Focus: real-world situations that break assumptions. Cover: boundary values, timing issues (double-click, slow network visible to user), and the "probably missed" items from the analysis. Avoid: normal flows or deliberate bad input.`,
  "Security": `Focus: access control and data protection that a non-technical user can verify without code. Cover: accessing pages while logged out, verifying one user can't see another user's data, and checking that sensitive info isn't exposed on screen. Avoid: anything requiring DevTools, intercepting requests, or code.`,
};

const STAGE_FOCUS = {
  "Pre-launch":          "This app hasn't launched yet — prioritize tests that catch embarrassing bugs before the first user arrives. Focus on the core flow working end-to-end.",
  "Just launched":       "This app just went live with real users — prioritize tests that protect existing users from breakage. Focus on the happy path and data integrity.",
  "Has active users":    "This app has active users — prioritize tests that guard against regressions and data loss. Assume any breakage affects real paying users right now.",
  "Shipping a new feature": "A new feature is being added — prioritize tests that verify the new feature works AND that it hasn't broken existing flows.",
};

export const fetchCaseCategory = (appSummary, analysis, categoryLabel, idOffset) => {
  const severity  = analysis?.severity || "Medium";
  const testCount = severity === "High" ? 4 : severity === "Low" ? 2 : 3;

  const risks    = analysis?.top_risks?.map(r => `• [${r.likelihood || "Medium"} likelihood] ${r.title}: ${r.detail || ""}${r.impact ? ` User impact: ${r.impact}` : ""}`).join("\n") || "";
  const missed   = analysis?.probably_missed?.join(", ") || "";
  const focus    = CATEGORY_FOCUS[categoryLabel] || "";

  const stage        = extractField(appSummary, "App stage");
  const stageFocus   = STAGE_FOCUS[stage] || "";
  const fragile      = extractField(appSummary, "Likely fragile areas");
  const framework    = extractField(appSummary, "Framework");

  return callClaude({
    maxTokens: 2000,
    system: TEST_CASE_SYSTEM,
    userMessage: `App info:\n${appSummary}

Risk level: ${severity}
Identified risks:
${risks}

Probably missed by the developer: ${missed}
${fragile ? `\nDeveloper flagged these as likely fragile: ${fragile}` : ""}
${stageFocus ? `\nApp stage context: ${stageFocus}` : ""}
${framework ? `\nFramework: ${framework} — use this to write accurate navigation steps (e.g. file-based routes for Next.js, hash routes for React SPA).` : ""}

Category instructions: ${focus}

Generate exactly ${testCount} "${categoryLabel}" test cases that directly address the risks, missed areas, and fragile areas above.
Start IDs at CHK-${String(idOffset).padStart(3, "0")}.`,
  });
};

export const TEST_CATEGORIES = [
  { key: "happy", label: "Happy Path", icon: "✅", color: "#4ade80", idOffset: 1 },
  { key: "broken", label: "Broken Input", icon: "⛔", color: "#f87171", idOffset: 5 },
  { key: "edge", label: "Edge Case", icon: "🔀", color: "#facc15", idOffset: 9 },
  { key: "security", label: "Security", icon: "🔒", color: "#c084fc", idOffset: 13 },
];

export const fetchTestCases = async (appSummary, analysis, onCategoryDone) => {
  // Fire all 4 in parallel — each resolves independently
  TEST_CATEGORIES.map(async (cat) => {
    try {
      const result = await fetchCaseCategory(appSummary, analysis, cat.label, cat.idOffset);
      const cases = result?.test_cases || [];
      onCategoryDone(cat.key, { ...cat, cases, status: "done" });
    } catch (e) {
      onCategoryDone(cat.key, { ...cat, cases: [], error: e.message, status: "error" });
    }
  });

  // Return initial loading state immediately
  return TEST_CATEGORIES.map(cat => ({ ...cat, cases: [], status: "loading" }));
};

// ── Bug report for a specific failed test ────────────────────────────────────

export const fetchBugReport = (appSummary, testCase, failureNote) =>
  callClaude({
    maxTokens: 600,
    system: `You write concise bug reports for non-technical developers to paste into GitHub Issues, Notion, or Linear. Plain English only. No jargon.

CRITICAL: Respond with ONLY a raw JSON object. No text before or after. No markdown. No backticks. Start with { and end with }.

Required format:
{
  "title": "[BUG] Short plain description under 10 words",
  "body": "Full bug report as a plain string. Use \\n for line breaks. Sections: ## What happened, ## What I expected, ## Steps to reproduce (numbered list), ## Device / Browser (leave as: Chrome / Safari / Firefox on Mac / Windows / iPhone)"
}`,
    userMessage: `App: ${appSummary}

Failed check: ${testCase.title}
Category: ${testCase.category} — ${testCase.importance}
Test steps: ${testCase.steps?.join(" → ")}
${failureNote ? `What the tester observed: ${failureNote}` : "No observation recorded — write based on what this test was checking."}

Write a specific bug report for this failure.`,
  });

// ── Cursor fix prompt for a failed test ──────────────────────────────────────

export const fetchCursorFixPrompt = (appSummary, testCase, failureNote) =>
  callClaude({
    maxTokens: 350,
    system: `You write short, paste-ready prompts for Cursor or Claude Code to fix a specific bug. Plain English. Be concrete — name the exact feature, what broke, what the fix should achieve.

CRITICAL: Respond with ONLY a raw JSON object. No markdown. No backticks. Start with { and end with }.

Required format:
{ "prompt": "The full prompt as a single string" }

Rules:
- Open with the app type and tech stack from the app info
- Describe exactly what broke and what should happen instead
- Include the steps to reproduce in one sentence
- End with a clear instruction: "Find and fix the cause."
- 3-5 sentences max. No jargon. No filler.`,
    userMessage: `App info:\n${appSummary}

Failed check: ${testCase.title}
Category: ${testCase.category}
Steps: ${testCase.steps?.join(" → ")}
${failureNote ? `What the tester saw: ${failureNote}` : "No observation recorded — infer from the test steps."}`,
  });

// ── Generate a test case from user's own prompt ───────────────────────────────

export const fetchCustomTestCase = (appSummary, analysis, categoryLabel, userPrompt, testId) => {
  const severity = analysis?.severity || "Medium";
  const risks = analysis?.top_risks?.map(r => `• [${r.likelihood || "Medium"} likelihood] ${r.title}: ${r.detail || ""}${r.impact ? ` User impact: ${r.impact}` : ""}`).join("\n") || "";
  const focus = CATEGORY_FOCUS[categoryLabel] || "";

  return callClaude({
    maxTokens: 700,
    system: TEST_CASE_SYSTEM,
    userMessage: `App info:\n${appSummary}

Risk level: ${severity}
Identified risks:
${risks}

Category: ${categoryLabel}
Category instructions: ${focus}

The user wants to test this specific thing: "${userPrompt}"

Generate exactly 1 "${categoryLabel}" test case that directly addresses what the user described. Use ID ${testId}.`,
  });
};

// ── Single test case regeneration ────────────────────────────────────────────

export const fetchSingleTestCase = (appSummary, analysis, categoryLabel, testId) => {
  const severity = analysis?.severity || "Medium";
  const risks = analysis?.top_risks?.map(r => `• [${r.likelihood || "Medium"} likelihood] ${r.title}: ${r.detail || ""}${r.impact ? ` User impact: ${r.impact}` : ""}`).join("\n") || "";
  const missed = analysis?.probably_missed?.join(", ") || "";
  const focus = CATEGORY_FOCUS[categoryLabel] || "";

  return callClaude({
    maxTokens: 700,
    system: TEST_CASE_SYSTEM,
    userMessage: `App info:\n${appSummary}

Risk level: ${severity}
Identified risks:
${risks}

Probably missed: ${missed}

Category instructions: ${focus}

Generate exactly 1 "${categoryLabel}" test case with ID ${testId}. Make it different from what was there before — try a different angle on the risks.`,
  });
};

// ── Step 4: Automation Brief ──────────────────────────────────────────────────

export const fetchAutomationBrief = (appSummary, analysis, allChecks) =>
  callClaude({
    maxTokens: 1600,
    system: `You are a senior QA engineer advising a non-technical solo developer who built their app with AI tools. They have no QA background and cannot write or run test scripts themselves.

Your job: look at their app and their list of checks, and give them a practical automation brief they can hand to a QA engineer or paste into Cursor/Claude to get tests written.

CRITICAL: Respond with ONLY a raw JSON object. No text before or after. No markdown. No backticks. Start with { and end with }.

Required format:
{
  "verdict": "One plain sentence — overall automation readiness e.g. '3 of your flows are worth automating right now, the rest should stay manual for now'",
  "automate": [
    {
      "id": "CHK-001",
      "title": "Check title from their list",
      "reason": "One sentence — why this is worth automating (e.g. runs on every deploy, catches silent failures)"
    }
  ],
  "keep_manual": [
    {
      "id": "CHK-002",
      "title": "Check title from their list",
      "reason": "One sentence — why manual is better here (e.g. needs visual inspection, changes too often)"
    }
  ],
  "skip_for_now": [
    {
      "id": "CHK-003",
      "title": "Check title from their list",
      "reason": "One sentence — why it's too early (e.g. feature is still changing, low risk right now)"
    }
  ],
  "cursor_prompt": "A ready-to-use prompt they can paste into Cursor or Claude to get their automation written. Should mention the framework (Playwright), list the specific checks to automate by title, mention the app type and tech stack, and ask for runnable test files."
}

automate: the 3-5 checks most worth automating. keep_manual: 3-5 checks better done manually. skip_for_now: remaining checks.
Keep all reasons under 15 words. cursor_prompt should be 4-6 sentences.`,
    userMessage: `App info:\n${appSummary}

Risk level: ${analysis?.severity}
Top risks:
${analysis?.top_risks?.map(r => `• ${r.title}${r.likelihood ? ` [${r.likelihood}]` : ""}${r.impact ? ` — ${r.impact}` : ""}`).join("\n")}

All checks from Step 4:
${allChecks.map(tc => `- ${tc.id}: ${tc.title} (${tc.category}, ${tc.importance})`).join("\n")}`,
  });

// ── Step 5: Bug Reports (Ticket) ─────────────────────────────────────────────

export const fetchTicket = (appSummary, analysis, testCases) =>
  callClaude({
    maxTokens: 1500,
    system: `You are helping a non-technical developer write bug reports they can file in GitHub Issues, Notion, or Linear. Write in plain friendly English — no enterprise jargon.

Return ONLY valid JSON — no markdown, no backticks, no preamble:
{
  "bug_template": {
    "title": "[BUG] Short plain description",
    "labels": ["bug"],
    "body": "Full bug report as a string with \\n for newlines. Include: What happened, What I expected, Steps to reproduce, Device/browser used"
  },
  "qa_checklist": {
    "title": "Testing checklist for [app name]",
    "body": "Full checklist as a string with \\n for newlines and markdown checkboxes [ ]"
  },
  "ship_checklist": {
    "title": "Pre-launch checklist",
    "body": "Plain English list of things to verify before going live, with \\n for newlines and markdown checkboxes [ ]"
  }
}`,
    userMessage: `App info:\n${appSummary}\n\nSeverity: ${analysis?.severity}\nTop risks: ${analysis?.top_risks?.map(r => r.title).join(", ")}\nChecks count: ${testCases?.test_cases?.length}`,
  });