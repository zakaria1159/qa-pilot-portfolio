# Manual Regression Checklist — QA Copilot

Run this checklist before every major release. Mark each item:
- ✅ PASS — works as expected
- ❌ FAIL — file a bug report
- ⬜ SKIP — can't test (note why)

**Date:** ___________  
**Tester:** ___________  
**Branch / commit:** ___________

---

## Landing Page (3 checks)

| # | Check | Result | Notes |
|---|-------|--------|-------|
| L-01 | Page loads at https://qa-pilot.com with no console errors | ⬜ | |
| L-02 | "Test My App →" button navigates into the wizard (Step 1 appears) | ⬜ | |
| L-03 | On mobile (375px), headline and CTA are fully visible without horizontal scroll | ⬜ | |

---

## Step 1: Input Form (7 checks)

| # | Check | Result | Notes |
|---|-------|--------|-------|
| S1-01 | "Find What Could Break →" button is disabled on page load | ⬜ | |
| S1-02 | Selecting one option in the "App type" question highlights it in green | ⬜ | |
| S1-03 | Button remains disabled after answering only 1 of the 3 required questions | ⬜ | |
| S1-04 | Button enables (turns green) after all 3 required questions are answered | ⬜ | |
| S1-05 | Deselecting an answer in a required question disables the button again | ⬜ | |
| S1-06 | Entering a URL in the optional URL field doesn't break the form | ⬜ | |
| S1-07 | Refreshing the page mid-form restores all selected options from localStorage | ⬜ | |

---

## Step 2: Risk Analysis (6 checks)

| # | Check | Result | Notes |
|---|-------|--------|-------|
| S2-01 | Loading state (spinner or animation) appears while Claude responds | ⬜ | |
| S2-02 | After loading, a severity badge (High/Medium/Low) is visible | ⬜ | |
| S2-03 | At least 3 risk items appear in the "Top Risks" section | ⬜ | |
| S2-04 | Clicking a risk title puts it into an editable state | ⬜ | |
| S2-05 | "Probably missed" and "Quick wins" sections both appear | ⬜ | |
| S2-06 | "Next" button navigates to Step 3 | ⬜ | |

---

## Step 3: Test Cases (6 checks)

| # | Check | Result | Notes |
|---|-------|--------|-------|
| S3-01 | All 4 category sections appear: Happy Path, Broken Input, Edge Case, Security | ⬜ | |
| S3-02 | Each category loads at least 2 test cases | ⬜ | |
| S3-03 | Clicking "Pass" on a test case marks it visually (green highlight or checkmark) | ⬜ | |
| S3-04 | Clicking "Fail" on a test case opens a notes/observation input | ⬜ | |
| S3-05 | After marking a test as Fail and adding a note, a "Generate Bug Report" button appears | ⬜ | |
| S3-06 | "Next" button navigates to Step 4 | ⬜ | |

---

## Step 4: Automation Brief + Download (5 checks)

| # | Check | Result | Notes |
|---|-------|--------|-------|
| S4-01 | Automation brief verdict text appears | ⬜ | |
| S4-02 | "Worth Automating" and "Keep Manual" lists are populated | ⬜ | |
| S4-03 | Cursor/Claude prompt text is visible and selectable | ⬜ | |
| S4-04 | "Download HTML Report" triggers a file download ending in .html | ⬜ | |
| S4-05 | The downloaded HTML file opens in a browser and shows correct test results | ⬜ | |

---

## Regression Result Summary

| Category | Pass | Fail | Skip |
|----------|------|------|------|
| Landing | — | — | — |
| Step 1 | — | — | — |
| Step 2 | — | — | — |
| Step 3 | — | — | — |
| Step 4 | — | — | — |
| **Total** | — | — | — |
