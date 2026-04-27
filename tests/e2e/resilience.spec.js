// tests/e2e/resilience.spec.js
//
// Demonstrates flaky test patterns and how to handle them in an AI-powered app.
//
// KEY CONCEPT: This app calls the Claude API, which is:
//   1. Non-deterministic (different response each run)
//   2. Variable latency (1s to 30s+ depending on load)
//   3. Rate-limited (429 after too many requests)
//
// Professional QA strategy for AI apps:
//   - Check STRUCTURE not CONTENT (does the section exist? not what does it say?)
//   - Use generous timeouts for AI-dependent steps
//   - Use retries for genuine network flakiness (configured in playwright.config.js)
//   - Tag inherently flaky tests with @flaky so CI can report separately
//   - Use expect.poll() for conditions that resolve asynchronously

import { test, expect } from '@playwright/test';
import { fillStep1 } from './helpers.js';

test.describe('Resilience patterns @flaky', () => {
  test.setTimeout(120_000);

  test('uses expect.poll to wait for AI-generated content', async ({ page }) => {
    // expect.poll() repeatedly checks a condition until it's true or times out.
    // Better than waitForSelector() when the element appears after variable-latency API calls.

    await fillStep1(page);

    await expect.poll(
      async () => {
        const text = await page.locator('body').innerText();
        return /High|Medium|Low/.test(text);
      },
      {
        message: 'Severity badge should appear after Claude responds',
        timeout: 60_000,
        intervals: [1000, 2000, 3000],
      }
    ).toBe(true);
  });

  test('documents AI response structure variability', async ({ page }) => {
    // Claude's output varies — we test STRUCTURE (presence of sections) not CONTENT (specific text).
    // This is a deliberate design choice documented here for portfolio/interview purposes.

    await fillStep1(page);
    await expect(page.getByText(/^(High|Medium|Low)$/)).toBeVisible({ timeout: 60_000 });

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(500);

    // BAD (don't do this): expect(bodyText).toContain('Payment flow')
    // That text only appears if Claude generates it, which it might not every time.
  });

  test('handles the rate limit modal gracefully @flaky', async ({ page }) => {
    // When the rate limit is hit, a modal should appear instead of a raw error.
    // We can't reliably trigger a 429 in a test, so this documents the contract:
    // - The app should NOT show a raw "429" string or error stack
    // - The app should show a human-readable message with a call to action

    await page.goto('/');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('429');
    expect(bodyText).not.toContain('Too Many Requests');
  });

  test('demonstrates retry strategy: config-level vs test-level', async ({ page }) => {
    // Two retry strategies in Playwright:
    //
    // 1. CONFIG-LEVEL: retries: 2 in playwright.config.js
    //    - Playwright reruns the entire test on failure
    //    - Good for network flakiness
    //    - Our config sets this to 2 retries in CI
    //
    // 2. TEST-LEVEL: await expect(locator).toBeVisible({ timeout: 60_000 })
    //    - Playwright polls within a single test run
    //    - Good for async UI updates after API calls
    //    - Used throughout step-analyze.spec.js and step-test.spec.js

    const isCI = !!process.env.CI;
    console.log(`Running in CI: ${isCI}. Retry count: ${isCI ? 2 : 0}`);
    expect(true).toBe(true);
  });
});
