# Exploratory Testing Charters — QA Copilot

Exploratory testing is time-boxed, mission-driven, and unscripted.
Each charter below is one 30-minute session. Take notes as you go.
File a bug report for anything unexpected.

---

## Charter 1: Happy Path Completeness

**Mission:** Complete the full wizard as a first-time user would.  
**Duration:** 30 minutes  
**Risk area:** Core flow, AI response quality

**Setup:**
- Clear localStorage (DevTools → Application → Local Storage → Clear All)
- Use a realistic app description: "A SaaS tool for freelancers to send invoices"
- Select: SaaS tool, Stripe, Has active users, Paying for something

**What to explore:**
- Does the wizard flow feel natural and easy to follow?
- Does the AI output look relevant to a SaaS invoicing tool?
- Are the test cases specific or generic?
- Does the HTML report download and open correctly?

**Note-taking prompt:** What would confuse a non-technical developer?

---

## Charter 2: Broken Input & Edge Cases

**Mission:** Try to break the app by providing empty, invalid, or unusual input.  
**Duration:** 30 minutes  
**Risk area:** Input validation, error handling

**What to explore:**
- Click "Find What Could Break" with only 1 of the 3 required questions answered — does the button stay disabled?
- Enter a malformed URL in the App URL field (e.g. `not-a-url`, `javascript:alert(1)`)
- Enter only spaces in the free-text field — what gets sent to Claude?
- Select then deselect all options in a required question — does the button re-disable?
- Enter a very long free-text description (500+ words) — does the UI handle it?

**Note-taking prompt:** What can a user do that the app doesn't expect?

---

## Charter 3: Session Persistence & Navigation

**Mission:** Test what happens when the user disrupts the normal flow.  
**Duration:** 30 minutes  
**Risk area:** sessionStorage / localStorage, state management

**What to explore:**
- Complete Step 1 → refresh the page — does it return to Step 1 with selections intact?
- Complete Steps 1-2 → close the tab → reopen qa-pilot.com — what state loads?
- Complete Steps 1-2 → press browser Back button — what happens?
- Complete the full wizard → press browser Back from Step 4 — does Step 3 still have PASS/FAIL marks?
- Double-click the "Find What Could Break" button rapidly — does it fire two API calls?
- Click "Find What Could Break" → immediately click it again — does the UI handle duplicate calls?

**Note-taking prompt:** Does the app recover gracefully, or does it show broken/empty states?

---

## Charter 4: Mobile Experience

**Mission:** Test the full wizard on a mobile viewport.  
**Duration:** 30 minutes  
**Risk area:** Responsive layout, touch interactions

**Setup:** In Chrome DevTools, set viewport to iPhone SE (375×667).

**What to explore:**
- Does the landing page headline fit on screen without overflow?
- Are the option cards in Step 1 large enough to tap?
- Does the "How it works" grid collapse to 2×2 (not 4×1)?
- Does Step 2's risk analysis render without horizontal scroll?
- In Step 3, can you tap PASS/FAIL on each test case?
- Does the HTML download work on mobile?

**Note-taking prompt:** Would a user on their phone be able to complete the full wizard?

---

## Charter 5: AI Response Resilience

**Mission:** Observe what the app does when the AI behaves unexpectedly.  
**Duration:** 30 minutes  
**Risk area:** Error states, rate limiting, network failures

**What to explore:**
- Throttle the network to "Slow 3G" in DevTools — do loading states appear? Does the app time out?
- Complete the wizard twice quickly from the same IP — does the rate limit (10/day) trigger? Does the modal appear?
- If the retry button appears after an error — does retrying produce a different result?
- Open two browser tabs and run the wizard simultaneously — does anything break?
- Check the browser console (DevTools) during a normal run — are there any unexpected errors?

**Note-taking prompt:** Does the app fail gracefully, or does it fail silently?
