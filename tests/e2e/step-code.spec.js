// tests/e2e/step-code.spec.js
import { test, expect } from '@playwright/test';
import { goToStep4 } from './helpers.js';

test.describe('Step 4: Automation Brief', () => {
  test.setTimeout(180_000);

  test('shows the step 4 header', async ({ page }) => {
    await goToStep4(page);
    await expect(page.getByText(/STEP 04|automation|brief/i)).toBeVisible({ timeout: 60_000 });
  });

  test('shows the automation verdict text', async ({ page }) => {
    await goToStep4(page);
    await expect(page.getByText(/automat/i)).toBeVisible({ timeout: 60_000 });
  });

  test('shows "Worth Automating" section', async ({ page }) => {
    await goToStep4(page);
    await expect(page.getByText(/worth automating/i)).toBeVisible({ timeout: 60_000 });
  });

  test('"DOWNLOAD HTML REPORT" button triggers a file download', async ({ page }) => {
    await goToStep4(page);
    await expect(page.getByText(/automat/i)).toBeVisible({ timeout: 60_000 });

    const downloadBtn = page.getByRole('button', { name: /DOWNLOAD HTML REPORT/i });
    await expect(downloadBtn).toBeVisible({ timeout: 30_000 });

    // Register listener BEFORE clicking — must be set up before the click fires
    const downloadPromise = page.waitForEvent('download');
    await downloadBtn.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.html$/);
    expect(download.suggestedFilename()).toContain('qa-report');
  });
});
