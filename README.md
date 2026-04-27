# QA Portfolio — QA Copilot

[![CI](https://github.com/zakaria1159/qa-pilot-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/zakaria1159/qa-pilot-portfolio/actions/workflows/ci.yml)

**Live app:** https://qa-pilot.com  
**Stack under test:** React 19 + Vite, Claude API (claude-sonnet-4-6), deployed on Vercel

This repo is a complete QA portfolio for [QA Copilot](https://qa-pilot.com) — a 4-step AI-powered QA wizard for solo developers. It covers every layer of the test pyramid: manual testing docs, unit tests, E2E automation, API regression, and flaky test handling.

---

## Test Pyramid

```
         /\
        /  \
       / E2E \         Playwright — 8 spec files, ~35 tests
      /--------\       Tests the real app at qa-pilot.com
     / Unit Tests\     Vitest — 3 test files, 31 tests
    /--------------\   Tests pure functions (no browser, no network)
   / Manual Testing \  4 Markdown documents
  /------------------\ Test plan, exploratory charters, bug template, regression checklist
```

---

## Coverage Summary

| Layer | Tool | Files | What's Tested |
|-------|------|-------|---------------|
| Manual | — | 4 docs | Test plan, exploratory charters, bug template, regression checklist |
| Unit | Vitest | 3 files | `cleanApiResponse`, `buildHtmlString`, `buildMarkdownString` |
| E2E (UI) | Playwright | 6 files | Landing page, all 4 wizard steps, full golden path flow |
| E2E (API) | Playwright request | 1 file | `/api/claude` endpoint — method validation, response shape, rate limit |
| Resilience | Playwright | 1 file | `expect.poll`, retry strategy, AI non-determinism patterns |

---

## Tools Used

| Tool | Version | Purpose |
|------|---------|---------|
| [Playwright](https://playwright.dev) | 1.59.x | E2E browser automation + API testing |
| [Vitest](https://vitest.dev) | 4.x | Unit testing (fast, Vite-native) |
| GitHub Actions | — | CI — runs tests on every push |
| Node.js | 20 | Runtime |

---

## How to Run Locally

**Prerequisites:** Node 20, `npm`

```bash
# Install dependencies + Playwright browser
npm install
npx playwright install chromium

# Run unit tests (31 tests, ~2 seconds)
npm run test:unit

# Run E2E tests (requires internet — tests run against qa-pilot.com)
npm run test:e2e

# Open the HTML test report
npm run test:e2e:report
```

---

## Key Design Decisions

### 1. Testing against production, not localhost
All E2E tests run against `https://qa-pilot.com` rather than a local dev server. This tests the real deployed system, including the Vercel API route and rate limiter — closer to how QA engineers work at companies.

### 2. Testing structure, not AI content
The app calls the Claude API, which is non-deterministic. Tests check *structure* ("does a severity badge appear?") not *content* ("does it say 'High risk'?"). This prevents false failures from AI response variability.

### 3. Flaky test documentation
`tests/e2e/resilience.spec.js` explicitly documents the sources of non-determinism in this app and demonstrates three professional mitigation strategies: `expect.poll()`, generous timeouts, and config-level retries.

### 4. Making code testable (SDET skill)
`generateHtmlReport.js` and `generateMarkdownReport.js` originally mixed string generation with browser download triggers. I extracted `buildHtmlString` and `buildMarkdownString` as pure exported functions so they could be unit-tested in Node without mocking browser globals. This is a real-world SDET refactoring pattern.

---

## Manual Testing Docs

- [`tests/manual/test-plan.md`](tests/manual/test-plan.md) — Scope, objectives, risk register, entry/exit criteria
- [`tests/manual/exploratory-charter.md`](tests/manual/exploratory-charter.md) — 5 time-boxed exploration missions
- [`tests/manual/bug-report-template.md`](tests/manual/bug-report-template.md) — GitHub Issues-compatible format
- [`tests/manual/regression-checklist.md`](tests/manual/regression-checklist.md) — 25 manual checks across all 4 wizard steps

---

## CI Report

The HTML Playwright report is uploaded as a GitHub Actions artifact after every CI run.

**To view it:** Actions tab → latest run → Artifacts → `playwright-report` → Download → open `index.html`

---

_Built as a QA portfolio project. Tests run against the live app at https://qa-pilot.com_
