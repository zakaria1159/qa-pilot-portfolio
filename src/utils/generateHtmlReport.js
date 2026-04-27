export function buildHtmlString({ appSummary, analysis, testCategories, results = {}, failureNotes = {}, brief }) {
  const allCases = (testCategories || []).flatMap(c => c.cases || []);
  const passed   = allCases.filter(tc => results[tc.id] === "pass").length;
  const failed   = allCases.filter(tc => results[tc.id] === "fail").length;
  const untested = allCases.filter(tc => !results[tc.id]).length;
  const total    = allCases.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  const date    = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const dateStr = new Date().toISOString().split("T")[0];

  const sevColor = { High: "#ef4444", Medium: "#f59e0b", Low: "#22c55e" }[analysis?.severity] || "#6b7280";
  const sevBg    = { High: "#fef2f2", Medium: "#fffbeb", Low: "#f0fdf4" }[analysis?.severity] || "#f9fafb";

  // ── App summary parsing ─────────────────────────────────────────────────────
  // Only parse the structured key: value lines — stop before the service hints block
  const summaryBlock = (appSummary || "").split("\nService-specific test data:")[0];
  const summaryLines = summaryBlock.split("\n").reduce((acc, line) => {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      if (key && val) acc[key] = val;
    }
    return acc;
  }, {});

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const esc = (str) => String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const resultChip = (res) => {
    if (res === "pass") return `<span class="chip chip-pass">&#10003; Pass</span>`;
    if (res === "fail") return `<span class="chip chip-fail">&#10007; Fail</span>`;
    return `<span class="chip chip-skip">&#8212; Untested</span>`;
  };

  // ── Test categories ──────────────────────────────────────────────────────────
  const categoriesHtml = (testCategories || []).map(cat => {
    if (!cat.cases?.length) return "";
    const catColor = cat.color || "#6b7280";

    const rows = cat.cases.map(tc => {
      const res  = results[tc.id];
      const note = failureNotes[tc.id];
      const isFail = res === "fail";
      const rowClass = res === "pass" ? "row-pass" : isFail ? "row-fail" : "";

      const stepsHtml = isFail && tc.steps?.length ? `
        <ol class="check-steps">
          ${tc.steps.map(s => `<li>${esc(s)}</li>`).join("")}
        </ol>` : "";

      const detailsHtml = isFail ? `
        <div class="check-details">
          ${tc.starting_point ? `
            <div class="check-detail-row">
              <span class="detail-label">START ON</span>
              <span>${esc(tc.starting_point)}</span>
            </div>` : ""}
          ${stepsHtml}
          ${tc.what_bad_looks_like ? `
            <div class="check-bad">
              <span class="detail-label">BUG LOOKS LIKE</span>
              ${esc(tc.what_bad_looks_like)}
            </div>` : ""}
          ${note ? `
            <div class="failure-note">
              <div class="failure-note-label">&#x1F41B; OBSERVED</div>
              ${esc(note)}
            </div>` : ""}
        </div>` : "";

      return `
        <div class="check-row ${rowClass}">
          <div class="check-header">
            <span class="badge" style="background:${catColor}">${esc(tc.id)}</span>
            <span class="check-title">${esc(tc.title)}</span>
            <div class="check-chips">
              <span class="importance importance-${(tc.importance || "").toLowerCase().replace(/\s/g, "-")}">${esc(tc.importance)}</span>
              ${resultChip(res)}
            </div>
          </div>
          ${detailsHtml}
          ${!isFail && tc.tip ? `<div class="check-tip">&#x1F4A1; ${esc(tc.tip)}</div>` : ""}
        </div>`;
    }).join("");

    return `
      <div class="category">
        <div class="category-header" style="border-left:3px solid ${catColor}; padding-left:12px;">
          <span class="category-icon">${esc(cat.icon)}</span>
          <span class="category-label" style="color:${catColor}">${esc(cat.label)}</span>
          <span class="category-count">${cat.cases.length} checks</span>
        </div>
        <div class="check-list">${rows}</div>
      </div>`;
  }).join("");

  // ── Risks ────────────────────────────────────────────────────────────────────
  const likelihoodColor = { High: "#ef4444", Medium: "#f59e0b", Low: "#6b7280" };

  const risksHtml = (analysis?.top_risks || []).map(r => `
    <div class="risk-item">
      <span class="risk-emoji">${r.emoji || "&#x26A0;&#xFE0F;"}</span>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span class="risk-title">${esc(r.title)}</span>
          ${r.likelihood ? `<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:3px;background:${likelihoodColor[r.likelihood]}22;color:${likelihoodColor[r.likelihood]};letter-spacing:0.08em">${esc(r.likelihood).toUpperCase()} RISK</span>` : ""}
        </div>
        ${r.detail ? `<div class="risk-detail">${esc(r.detail)}</div>` : ""}
        ${r.impact   ? `<div style="margin-top:6px;font-size:12px;color:#991b1b;padding:5px 8px;background:#fef2f2;border-radius:3px">&#x1F534; ${esc(r.impact)}</div>` : ""}
        ${r.fix_hint ? `<div style="margin-top:4px;font-size:12px;color:#166534;padding:5px 8px;background:#f0fdf4;border-radius:3px">&#x2192; ${esc(r.fix_hint)}</div>` : ""}
      </div>
    </div>`).join("");

  // ── Automation sections ──────────────────────────────────────────────────────
  const autoSection = (items, icon, label, colorClass) => {
    if (!items?.length) return "";
    const rows = items.map(item => `
      <div class="auto-row">
        <span class="badge" style="background:#4f46e5">${esc(item.id)}</span>
        <div>
          <div class="auto-title">${esc(item.title)}</div>
          <div class="auto-reason">${esc(item.reason)}</div>
        </div>
      </div>`).join("");
    return `
      <div class="auto-section">
        <div class="auto-label ${colorClass}">${icon} ${label} <span class="auto-count">${items.length}</span></div>
        ${rows}
      </div>`;
  };

  // ── Filename ─────────────────────────────────────────────────────────────────
  const appTypeSlug = (summaryLines["App type"] || "app")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const filename = `qa-report-${appTypeSlug}-${dateStr}.html`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QA Report &mdash; ${esc(summaryLines["App type"] || "Your App")}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px; line-height: 1.6; color: #111827; background: #f3f4f6;
    }

    a { color: inherit; text-decoration: none; }

    .page { max-width: 860px; margin: 0 auto; padding: 32px 16px 64px; }

    /* Header */
    .report-header {
      background: #0a0a0f; border-radius: 10px; padding: 32px 36px;
      margin-bottom: 24px; display: flex;
      justify-content: space-between; align-items: flex-start; gap: 24px;
    }
    .report-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .brand-icon {
      width: 28px; height: 28px; background: #c8f060; border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: 13px; color: #0a0a0f; flex-shrink: 0;
    }
    .brand-name { font-size: 13px; font-weight: 700; letter-spacing: 0.1em; color: #e8e6e0; }
    .brand-beta {
      font-size: 9px; color: #c8f060; border: 1px solid rgba(200,240,96,0.4);
      border-radius: 2px; padding: 1px 6px; letter-spacing: 0.1em;
    }
    .report-title { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 6px; }
    .report-subtitle { font-size: 13px; color: #888; }
    .report-meta { text-align: right; flex-shrink: 0; }
    .report-date { font-size: 12px; color: #555; margin-bottom: 6px; }
    .report-app-type {
      font-size: 11px; color: #c8f060; background: rgba(200,240,96,0.1);
      border: 1px solid rgba(200,240,96,0.2); border-radius: 4px;
      padding: 4px 10px; display: inline-block; letter-spacing: 0.05em;
    }

    /* Stats */
    .stats-bar {
      display: grid; grid-template-columns: repeat(4, 1fr);
      background: #fff; border-radius: 10px; border: 1px solid #e5e7eb;
      margin-bottom: 24px; overflow: hidden;
    }
    .stat { padding: 20px 16px; text-align: center; border-right: 1px solid #e5e7eb; }
    .stat:last-child { border-right: none; }
    .stat-value { font-size: 32px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
    .stat-label { font-size: 11px; color: #6b7280; letter-spacing: 0.08em; text-transform: uppercase; }
    .stat-total .stat-value { color: #111827; }
    .stat-pass  .stat-value { color: #22c55e; }
    .stat-fail  .stat-value { color: #ef4444; }
    .stat-skip  .stat-value { color: #9ca3af; }

    /* Progress */
    .progress-wrap {
      background: #fff; border-radius: 10px; border: 1px solid #e5e7eb;
      padding: 16px 20px; margin-bottom: 24px;
      display: flex; align-items: center; gap: 16px;
    }
    .progress-bar-bg { flex: 1; height: 8px; background: #f3f4f6; border-radius: 99px; overflow: hidden; }
    .progress-bar-fill { height: 100%; background: #22c55e; border-radius: 99px; width: ${passRate}%; }
    .progress-label { font-size: 13px; font-weight: 700; color: #22c55e; white-space: nowrap; }

    /* Card */
    .card { background: #fff; border-radius: 10px; border: 1px solid #e5e7eb; padding: 24px; margin-bottom: 20px; }
    .card-title { font-size: 10px; font-weight: 700; color: #6b7280; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 16px; }

    /* Risk */
    .severity-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .severity-pill {
      font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 99px;
      color: ${sevColor}; background: ${sevBg}; border: 1px solid ${sevColor}33; letter-spacing: 0.06em;
    }
    .severity-reason { font-size: 13px; color: #374151; }
    .risk-item { display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .risk-item:last-child { border-bottom: none; }
    .risk-emoji { font-size: 20px; flex-shrink: 0; line-height: 1.3; }
    .risk-title { font-size: 13px; font-weight: 600; color: #111827; }
    .risk-detail { font-size: 12px; color: #6b7280; margin-top: 2px; }

    /* Two col */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .list-item { display: flex; gap: 8px; padding: 6px 0; font-size: 13px; color: #374151; }
    .list-bullet-yellow { color: #f59e0b; flex-shrink: 0; margin-top: 2px; }
    .list-bullet-green  { color: #22c55e; flex-shrink: 0; margin-top: 2px; }

    /* Category */
    .category { margin-bottom: 20px; }
    .category-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .category-icon { font-size: 16px; }
    .category-label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
    .category-count { font-size: 11px; color: #9ca3af; margin-left: auto; }

    /* Check rows */
    .check-list { display: flex; flex-direction: column; gap: 6px; }
    .check-row {
      padding: 12px 14px; border-radius: 6px;
      background: #f9fafb; border: 1px solid #e5e7eb;
    }
    .check-row.row-pass { background: #f0fdf4; border-color: #bbf7d0; }
    .check-row.row-fail { background: #fef2f2; border-color: #fecaca; }

    .check-header {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    }
    .check-title { font-size: 13px; color: #111827; font-weight: 500; flex: 1; min-width: 0; }
    .check-chips { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .check-tip { font-size: 11px; color: #6b7280; margin-top: 6px; }

    /* Failed test details */
    .check-details { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
    .check-detail-row {
      display: flex; gap: 8px; align-items: baseline;
      font-size: 12px; color: #374151;
    }
    .detail-label {
      font-size: 9px; font-weight: 700; color: #9ca3af;
      letter-spacing: 0.1em; white-space: nowrap; flex-shrink: 0; padding-top: 2px;
    }
    .check-steps {
      margin: 0; padding-left: 0; list-style: none;
      display: flex; flex-direction: column; gap: 4px;
    }
    .check-steps li {
      font-size: 12px; color: #374151; padding: 5px 10px;
      background: #fff; border-radius: 3px; border: 1px solid #e5e7eb;
      counter-increment: step-counter;
      display: flex; gap: 8px; align-items: baseline;
    }
    .check-steps li::before {
      content: counter(step-counter);
      font-size: 9px; font-weight: 700; color: #9ca3af;
      flex-shrink: 0; min-width: 14px;
    }
    .check-steps { counter-reset: step-counter; }
    .check-bad {
      font-size: 12px; color: #991b1b; padding: 6px 10px;
      background: #fef2f2; border-radius: 3px;
      display: flex; gap: 8px; align-items: baseline;
    }
    .failure-note {
      padding: 8px 10px; border-radius: 4px;
      background: #fff1f0; border: 1px solid #fecaca;
      font-size: 12px; color: #991b1b; line-height: 1.5;
    }
    .failure-note-label { font-size: 10px; font-weight: 700; color: #dc2626; letter-spacing: 0.08em; margin-bottom: 3px; }

    /* Badges & chips */
    .badge {
      font-size: 9px; font-weight: 700; color: #fff;
      padding: 2px 7px; border-radius: 3px; letter-spacing: 0.06em;
      flex-shrink: 0; white-space: nowrap;
    }
    .chip { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; letter-spacing: 0.04em; white-space: nowrap; }
    .chip-pass { background: #dcfce7; color: #16a34a; }
    .chip-fail { background: #fee2e2; color: #dc2626; }
    .chip-skip { background: #f3f4f6; color: #9ca3af; }
    .importance { font-size: 10px; padding: 2px 7px; border-radius: 3px; white-space: nowrap; }
    .importance-critical     { background: #fee2e2; color: #dc2626; }
    .importance-important    { background: #fef9c3; color: #a16207; }
    .importance-nice-to-have { background: #f3f4f6; color: #6b7280; }

    /* Automation */
    .verdict-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px 16px; font-size: 13px; color: #374151; margin-bottom: 16px; }
    .auto-section { margin-bottom: 16px; }
    .auto-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
    .auto-count { font-weight: 400; color: #9ca3af; }
    .auto-label-green  { color: #16a34a; }
    .auto-label-yellow { color: #b45309; }
    .auto-label-gray   { color: #6b7280; }
    .auto-row { display: flex; gap: 10px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .auto-row:last-child { border-bottom: none; }
    .auto-title { font-size: 13px; font-weight: 500; color: #111827; }
    .auto-reason { font-size: 12px; color: #6b7280; }

    /* Cursor prompt */
    .prompt-box {
      background: #0a0a0f; border-radius: 6px; padding: 16px 18px;
      font-size: 12px; color: #aaa;
      font-family: "SF Mono", "Fira Code", monospace;
      line-height: 1.8; white-space: pre-wrap; word-break: break-word;
    }

    /* App info */
    .info-table { display: flex; flex-direction: column; gap: 6px; }
    .info-row { display: flex; gap: 8px; font-size: 13px; }
    .info-key { color: #9ca3af; min-width: 180px; flex-shrink: 0; }
    .info-val { color: #111827; font-weight: 500; }

    /* Footer */
    .report-footer { text-align: center; margin-top: 40px; font-size: 11px; color: #9ca3af; letter-spacing: 0.06em; line-height: 2; }
    .footer-brand { color: #c8f060; font-weight: 700; }
    .footer-hire { color: #6b7280; }
    .footer-hire a { color: #111827; font-weight: 600; text-decoration: underline; }

    @media print {
      body { background: #fff; }
      .page { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="report-header">
      <div>
        <div class="report-brand">
          <div class="brand-icon">Q</div>
          <span class="brand-name">QA COPILOT</span>
          <span class="brand-beta">BETA</span>
        </div>
        <div class="report-title">QA Report</div>
        <div class="report-subtitle">Full test run &middot; Risk analysis &middot; Automation brief</div>
      </div>
      <div class="report-meta">
        <div class="report-date">${esc(date)}</div>
        ${summaryLines["App type"] ? `<div class="report-app-type">${esc(summaryLines["App type"])}</div>` : ""}
      </div>
    </div>

    <!-- Stats bar -->
    <div class="stats-bar">
      <div class="stat stat-total"><div class="stat-value">${total}</div><div class="stat-label">Total Checks</div></div>
      <div class="stat stat-pass"><div class="stat-value">${passed}</div><div class="stat-label">Passed</div></div>
      <div class="stat stat-fail"><div class="stat-value">${failed}</div><div class="stat-label">Failed</div></div>
      <div class="stat stat-skip"><div class="stat-value">${untested}</div><div class="stat-label">Untested</div></div>
    </div>

    <!-- Progress bar -->
    <div class="progress-wrap">
      <div class="progress-bar-bg"><div class="progress-bar-fill"></div></div>
      <span class="progress-label">${passRate}% pass rate</span>
    </div>

    <!-- App info -->
    ${Object.keys(summaryLines).length ? `
    <div class="card">
      <div class="card-title">App Info</div>
      <div class="info-table">
        ${Object.entries(summaryLines)
          .filter(([, v]) => v && v !== "Not specified" && v !== "none" && v !== "None")
          .map(([k, v]) => `
          <div class="info-row">
            <span class="info-key">${esc(k)}</span>
            <span class="info-val">${esc(v)}</span>
          </div>`).join("")}
      </div>
    </div>` : ""}

    <!-- Risk analysis -->
    ${analysis ? `
    <div class="card">
      <div class="card-title">Risk Analysis</div>
      <div class="severity-row">
        <span class="severity-pill">${esc(analysis.severity)}</span>
        <span class="severity-reason">${esc(analysis.severity_reason)}</span>
      </div>
      ${analysis.summary ? `<p style="font-size:13px;color:#374151;margin-bottom:16px;">${esc(analysis.summary)}</p>` : ""}
      <div style="font-size:10px;font-weight:700;color:#6b7280;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;">Top Risks</div>
      ${risksHtml}
    </div>

    <div class="two-col">
      ${analysis.probably_missed?.length ? `
      <div class="card" style="margin-bottom:0">
        <div class="card-title">Things You Probably Haven't Tested</div>
        ${analysis.probably_missed.map(item => `
          <div class="list-item">
            <span class="list-bullet-yellow">&#x25B8;</span>
            <span>${esc(item)}</span>
          </div>`).join("")}
      </div>` : ""}
      ${analysis.quick_wins?.length ? `
      <div class="card" style="margin-bottom:0">
        <div class="card-title">Quick Wins</div>
        ${analysis.quick_wins.map(item => `
          <div class="list-item">
            <span class="list-bullet-green">&#x2713;</span>
            <span>${esc(item)}</span>
          </div>`).join("")}
      </div>` : ""}
    </div>` : ""}

    <!-- Test checks -->
    ${testCategories?.length ? `
    <div class="card">
      <div class="card-title">Test Checks</div>
      ${categoriesHtml}
    </div>` : ""}

    <!-- Automation brief -->
    ${brief ? `
    <div class="card">
      <div class="card-title">Automation Brief</div>
      ${brief.verdict ? `<div class="verdict-box">${esc(brief.verdict)}</div>` : ""}
      ${autoSection(brief.automate,     "&#x1F916;", "Worth Automating", "auto-label-green")}
      ${autoSection(brief.keep_manual,  "&#x1F441;&#xFE0F;", "Keep Manual", "auto-label-yellow")}
      ${autoSection(brief.skip_for_now, "&#x23ED;&#xFE0F;", "Skip for Now", "auto-label-gray")}
      ${brief.cursor_prompt ? `
      <div style="font-size:10px;font-weight:700;color:#6b7280;letter-spacing:0.1em;text-transform:uppercase;margin:16px 0 8px;">
        Cursor / Claude Code Prompt
      </div>
      <div class="prompt-box">${esc(brief.cursor_prompt)}</div>` : ""}
    </div>` : ""}

    <!-- Footer -->
    <div class="report-footer">
      Generated by <span class="footer-brand">QA COPILOT</span> &middot; ${esc(date)}<br>
      <span class="footer-hire">
        Need help fixing these issues or setting up automated tests?
        <a href="mailto:hello@qacopilot.com">hello@qacopilot.com</a>
      </span>
    </div>

  </div>
</body>
</html>`;

  return html;
}

export function generateHtmlReport(data) {
  const html = buildHtmlString(data);

  const summaryBlock = (data.appSummary || "").split("\nService-specific test data:")[0];
  const summaryLines = summaryBlock.split("\n").reduce((acc, line) => {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      if (key && val) acc[key] = val;
    }
    return acc;
  }, {});
  const dateStr = new Date().toISOString().split("T")[0];
  const appTypeSlug = (summaryLines["App type"] || "app")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const filename = `qa-report-${appTypeSlug}-${dateStr}.html`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
