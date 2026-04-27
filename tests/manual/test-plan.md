# Test Plan — QA Copilot

**Version:** 1.0  
**Date:** 2026-04-25  
**Tester:** [Your Name]  
**App URL:** https://qa-pilot.com  
**Scope:** Full regression of the 4-step QA wizard

---

## 1. App Overview

QA Copilot is a React 19 + Vite SPA that walks solo developers through a structured QA workflow using the Claude API. The app has four wizard steps:

| Step | Name | What it does |
|------|------|--------------|
| 1 | Input | Multi-select form describing the user's app |
| 2 | Analyze | AI risk analysis (severity, top risks, quick wins) |
| 3 | Test | AI-generated test cases across 4 categories; user marks PASS/FAIL |
| 4 | Code | Automation brief + Cursor prompt + downloadable HTML report |

---

## 2. Test Objectives

- Verify the full wizard flow completes successfully end-to-end
- Verify all four wizard steps function independently
- Verify the app handles bad input and edge cases gracefully
- Verify the Claude API integration returns well-structured responses
- Verify the HTML and Markdown report downloads produce valid files
- Verify the app works on mobile viewports

---

## 3. Scope

### In Scope
- Landing page (all UI elements, CTA)
- Step 1: Input form (all 7 questions + URL + free text)
- Step 2: Risk analysis (loading state, severity, risks, editable risks)
- Step 3: Test cases (all 4 categories, PASS/FAIL marking, bug report generation)
- Step 4: Automation brief, cursor prompt, HTML report download
- Session persistence (state survives a page refresh)
- Rate limit handling (429 response shows the conversion modal)
- Mobile layout (375px viewport)

### Out of Scope
- Email capture form deliverability (Upstash/external service)
- Stripe/payment flows (not in this app)
- Cross-browser testing beyond Chrome and mobile Safari

---

## 4. Entry Criteria

Testing begins when:
- [ ] The app is deployed and accessible at https://qa-pilot.com
- [ ] The Claude API key is configured in the Vercel environment
- [ ] Rate limit has been reset (or tested from a new IP)

---

## 5. Exit Criteria

Testing is complete when:
- [ ] All 25 manual regression checks are marked PASS or documented as known failures
- [ ] Any FAIL items have a bug report filed using the bug report template
- [ ] Full wizard run (start to HTML download) completed successfully at least once

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Claude API rate limit hit during testing | High | Blocks all AI-dependent tests | Test from different IP; space out API calls |
| AI returns invalid JSON, wizard crashes | Medium | Step 2/3/4 fail | Retry button exists; note in bug report if retry fails |
| Session state corrupted mid-wizard | Low | User loses progress | Test refresh behavior explicitly |
| Mobile layout breaks on small screens | Medium | Mobile users can't use app | Test at 375px viewport |
| HTML report download blocked by browser | Low | Step 4 deliverable broken | Test on Chrome + Safari |

---

## 7. Test Types Covered

| Type | Tool | Location |
|------|------|----------|
| Manual regression | Human + browser | This document / regression-checklist.md |
| Exploratory | Human + browser | exploratory-charter.md |
| Unit | Vitest | tests/unit/ |
| E2E automation | Playwright | tests/e2e/ |
| API regression | Playwright request | tests/e2e/api-regression.spec.js |
| Flaky test patterns | Playwright | tests/e2e/resilience.spec.js |
