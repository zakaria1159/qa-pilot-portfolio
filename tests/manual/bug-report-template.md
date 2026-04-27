# Bug Report Template

> Copy this template for every bug you find. File it as a GitHub Issue.
> The goal: anyone reading this can reproduce the bug without asking you questions.

---

## Template

```
**Title:** [BUG] Short plain description — e.g. "Step 2 shows blank screen after slow API response"

**Severity:** Critical / High / Medium / Low
- Critical: blocks all users from completing a core flow
- High: breaks a key feature but workaround exists
- Medium: visible defect, non-blocking
- Low: cosmetic or edge case

**Environment:**
- Browser: Chrome 124 / Safari 17 / Firefox 125
- Device: MacBook Pro 14" / iPhone 15 / Windows 11
- Screen size: 1440×900 / 375×667 (mobile)
- App URL: https://qa-pilot.com
- Date: 2026-04-25

**Steps to Reproduce:**
1. Go to https://qa-pilot.com
2. Click "Test My App"
3. Select "SaaS tool" and "Paying for something"
4. Click "Find What Could Break"
5. Wait for Step 2 to load

**What I Expected:**
Risk analysis appears with severity badge, top risks, and quick wins.

**What I Got:**
Blank white screen. No error message. The loading spinner disappears but no content appears.

**Screenshot / Recording:**
[Attach screenshot here]

**Console Errors:**
[Open DevTools → Console → paste any red errors here]

**Additional Notes:**
This only happens when the network is throttled to Slow 3G. On normal connection it works fine.
```

---

## Filed Bugs Log

| # | Title | Severity | Status | Link |
|---|-------|----------|--------|------|
| 1 | _(example)_ Step 2 blank on slow network | High | Open | — |

> Add a row here each time you file a bug.
