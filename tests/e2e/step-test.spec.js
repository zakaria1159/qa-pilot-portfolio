// tests/e2e/step-test.spec.js
import { test, expect } from '@playwright/test';
import { fillStep1, waitForStep2, goToStep3 } from './helpers.js';

test.describe('Step 3: Test Cases', () => {
  test.setTimeout(150_000);

  test('shows the "Generate Checks →" button on first visit', async ({ page }) => {
    await fillStep1(page);
    await waitForStep2(page);
    await page.getByRole('button', { name: 'SEE WHAT TO TEST →' }).click();
    await expect(page.getByRole('button', { name: 'Generate Checks →' })).toBeVisible({ timeout: 5_000 });
  });

  test('shows all 4 test category labels after generation', async ({ page }) => {
    await goToStep3(page);
    await expect(page.getByText('Happy Path')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Broken Input')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Edge Case')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Security')).toBeVisible({ timeout: 60_000 });
  });

  test('can mark a test as Pass with "✓ PASS"', async ({ page }) => {
    await goToStep3(page);
    await expect(page.getByText('Happy Path')).toBeVisible({ timeout: 60_000 });
    const passBtn = page.getByRole('button', { name: '✓ PASS' }).first();
    await expect(passBtn).toBeVisible({ timeout: 30_000 });
    await passBtn.click();
    await expect(passBtn).toBeVisible();
  });

  test('can mark a test as Fail with "✗ FAIL" and add a note', async ({ page }) => {
    await goToStep3(page);
    await expect(page.getByText('Happy Path')).toBeVisible({ timeout: 60_000 });
    const failBtn = page.getByRole('button', { name: '✗ FAIL' }).first();
    await expect(failBtn).toBeVisible({ timeout: 30_000 });
    await failBtn.click();
    const noteInput = page.getByPlaceholder(/Make sure|Check that/i).first();
    await expect(noteInput).toBeVisible({ timeout: 5_000 });
    await noteInput.fill('The page went blank after clicking submit.');
  });

  test('"AUTOMATE OR NOT →" is disabled until at least one test is marked', async ({ page }) => {
    await goToStep3(page);
    await expect(page.getByText('Happy Path')).toBeVisible({ timeout: 60_000 });
    const nextBtn = page.getByRole('button', { name: 'AUTOMATE OR NOT →' });
    await expect(nextBtn).toBeVisible({ timeout: 5_000 });
    await expect(nextBtn).toBeDisabled();
    await page.getByRole('button', { name: '✓ PASS' }).first().click();
    await expect(nextBtn).toBeEnabled();
  });
});
