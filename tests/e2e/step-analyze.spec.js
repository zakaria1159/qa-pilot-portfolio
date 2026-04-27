// tests/e2e/step-analyze.spec.js
import { test, expect } from '@playwright/test';

async function goToStep2(page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Test My App/i }).click();
  await expect(page.getByText(/Tell us what you built/i)).toBeVisible();
  await page.getByRole('button', { name: /AI-powered tool/i }).click();
  await page.getByRole('button', { name: /Getting AI to generate something/i }).click();
  await page.getByRole('button', { name: /Has active users/i }).click();
  await page.getByRole('button', { name: /Find What Could Break/i }).click();
}

test.describe('Step 2: Risk Analysis', () => {
  test.setTimeout(90_000);

  test('shows a loading state while Claude responds', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Test My App/i }).click();
    await page.getByRole('button', { name: /AI-powered tool/i }).click();
    await page.getByRole('button', { name: /Getting AI to generate something/i }).click();
    await page.getByRole('button', { name: /Has active users/i }).click();
    await page.getByRole('button', { name: /Find What Could Break/i }).click();
    await expect(page.getByText(/STEP 02|Analyzing|loading/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows a severity badge after Claude responds', async ({ page }) => {
    await goToStep2(page);
    await expect(
      page.getByText(/^(High|Medium|Low)$/)
    ).toBeVisible({ timeout: 60_000 });
  });

  test('shows at least 3 risk items', async ({ page }) => {
    await goToStep2(page);
    await expect(page.getByText(/^(High|Medium|Low)$/)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/STEP 02/i)).toBeVisible();
  });

  test('shows "Probably missed" section', async ({ page }) => {
    await goToStep2(page);
    await expect(page.getByText(/^(High|Medium|Low)$/)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/probably/i)).toBeVisible({ timeout: 60_000 });
  });

  test('shows "Quick wins" section', async ({ page }) => {
    await goToStep2(page);
    await expect(page.getByText(/^(High|Medium|Low)$/)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/quick/i)).toBeVisible({ timeout: 60_000 });
  });

  test('"SEE WHAT TO TEST →" button is visible after analysis loads', async ({ page }) => {
    await goToStep2(page);
    await expect(page.getByText(/^(High|Medium|Low)$/)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: 'SEE WHAT TO TEST →' })).toBeVisible();
  });
});
