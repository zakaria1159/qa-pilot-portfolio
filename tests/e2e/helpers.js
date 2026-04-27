// tests/e2e/helpers.js — shared navigation helpers used across spec files
import { expect } from '@playwright/test';

// Navigate from landing to Step 1 and submit the form with a fixed app description.
export async function fillStep1(page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Test My App/i }).click();
  await expect(page.getByRole('heading', { name: /Tell us what you built/i })).toBeVisible();
  await page.getByRole('button', { name: /AI-powered tool/i }).click();
  await page.getByRole('button', { name: /Getting AI to generate something/i }).click();
  await page.getByRole('button', { name: /Has active users/i }).click();
  await page.getByRole('button', { name: 'Find What Could Break →' }).click();
}

// Wait for Step 2's Claude response — the "SEE WHAT TO TEST →" button appears when done.
// More reliable than the severity badge text, which can be wrapped in other elements.
export async function waitForStep2(page) {
  await expect(page.getByRole('button', { name: 'SEE WHAT TO TEST →' })).toBeVisible({ timeout: 60_000 });
}

// Navigate from Step 2 to Step 3, then trigger test case generation.
export async function goToStep3(page) {
  await fillStep1(page);
  await waitForStep2(page);
  await page.getByRole('button', { name: 'SEE WHAT TO TEST →' }).click();
  await expect(page.getByRole('button', { name: 'Generate Checks →' })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('button', { name: 'Generate Checks →' }).click();
}

// Navigate all the way to Step 4.
// Marks one test as PASS first (required to enable "AUTOMATE OR NOT →").
export async function goToStep4(page) {
  await goToStep3(page);
  await expect(page.getByText('Happy Path')).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: '✓ PASS' }).first().click();
  await page.getByRole('button', { name: 'AUTOMATE OR NOT →' }).click();
  const continueBtn = page.getByRole('button', { name: /continue|yes/i });
  if (await continueBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await continueBtn.click();
  }
}
