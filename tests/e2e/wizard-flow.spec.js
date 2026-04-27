// tests/e2e/wizard-flow.spec.js
//
// THE GOLDEN PATH — tests the complete wizard from landing page to HTML report download.
// This is the most important test in the suite. If this passes, the app is working.
//
// Runtime: ~3-4 minutes (3 real Claude API calls)

import { test, expect } from '@playwright/test';

test('complete wizard flow: landing → Step 4 → HTML download', async ({ page }) => {
  test.setTimeout(240_000);

  // ── Step 0: Land on the home page ─────────────────────────────────────────
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByRole('button', { name: /Test My App/i })).toBeVisible();

  // ── Step 1: Fill in the input form ────────────────────────────────────────
  await page.getByRole('button', { name: /Test My App/i }).click();
  await expect(page.getByText(/Tell us what you built/i)).toBeVisible();

  await page.getByRole('button', { name: /AI-powered tool/i }).click();
  await page.getByRole('button', { name: /Getting AI to generate something/i }).click();
  await page.getByRole('button', { name: /Has active users/i }).click();
  await page.getByPlaceholder('https://yourapp.com').fill('https://qa-pilot.com');

  const step1NextBtn = page.getByRole('button', { name: /Find What Could Break/i });
  await expect(step1NextBtn).toBeEnabled();
  await step1NextBtn.click();

  // ── Step 2: Risk analysis loads ───────────────────────────────────────────
  await expect(page.getByText(/^(High|Medium|Low)$/)).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: 'SEE WHAT TO TEST →' }).click();

  // ── Step 3: Generate test cases ───────────────────────────────────────────
  await expect(page.getByRole('button', { name: 'Generate Checks →' })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('button', { name: 'Generate Checks →' }).click();

  await expect(page.getByText('Happy Path')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Broken Input')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Edge Case')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Security')).toBeVisible({ timeout: 60_000 });

  const firstPassBtn = page.getByRole('button', { name: '✓ PASS' }).first();
  await expect(firstPassBtn).toBeVisible({ timeout: 30_000 });
  await firstPassBtn.click();

  await page.getByRole('button', { name: 'AUTOMATE OR NOT →' }).click();
  const confirmBtn = page.getByRole('button', { name: /continue|yes/i });
  if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await confirmBtn.click();
  }

  // ── Step 4: Automation brief loads ────────────────────────────────────────
  await expect(page.getByText(/automat/i)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/worth automating/i)).toBeVisible({ timeout: 60_000 });

  // ── Download: HTML report triggers a file download ─────────────────────────
  const downloadBtn = page.getByRole('button', { name: /DOWNLOAD HTML REPORT/i });
  await expect(downloadBtn).toBeVisible({ timeout: 30_000 });
  const downloadPromise = page.waitForEvent('download');
  await downloadBtn.click();

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.html$/);
  expect(download.suggestedFilename()).toContain('qa-report');

  console.log(`✅ Golden path complete. Report downloaded: ${download.suggestedFilename()}`);
});
