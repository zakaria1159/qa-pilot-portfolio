// tests/e2e/step-input.spec.js
import { test, expect } from '@playwright/test';

async function goToStep1(page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Test My App/i }).click();
  await expect(page.getByRole('heading', { name: /Tell us what you built/i })).toBeVisible();
}

test.describe('Step 1: Input form', () => {

  test('shows the step header', async ({ page }) => {
    await goToStep1(page);
    await expect(page.getByText('STEP 01 / YOUR APP')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Tell us what you built/i })).toBeVisible();
  });

  test('"Find What Could Break" button is disabled initially', async ({ page }) => {
    await goToStep1(page);
    const nextBtn = page.getByRole('button', { name: /Find What Could Break/i });
    await expect(nextBtn).toBeDisabled();
  });

  test('selecting an option card highlights it', async ({ page }) => {
    await goToStep1(page);
    const aiToolCard = page.getByRole('button', { name: /AI-powered tool/i });
    await aiToolCard.click();
    await expect(aiToolCard).toContainText('✓');
  });

  test('button stays disabled after answering only 1 required question', async ({ page }) => {
    await goToStep1(page);
    await page.getByRole('button', { name: /AI-powered tool/i }).click();
    const nextBtn = page.getByRole('button', { name: /Find What Could Break/i });
    await expect(nextBtn).toBeDisabled();
  });

  test('button enables after all 3 required questions are answered', async ({ page }) => {
    await goToStep1(page);
    await page.getByRole('button', { name: /AI-powered tool/i }).click();
    await page.getByRole('button', { name: /Getting AI to generate something/i }).click();
    await page.getByRole('button', { name: /Has active users/i }).click();
    const nextBtn = page.getByRole('button', { name: /Find What Could Break/i });
    await expect(nextBtn).toBeEnabled();
  });

  test('deselecting a required answer disables the button again', async ({ page }) => {
    await goToStep1(page);
    await page.getByRole('button', { name: /AI-powered tool/i }).click();
    await page.getByRole('button', { name: /Getting AI to generate something/i }).click();
    await page.getByRole('button', { name: /Has active users/i }).click();
    const nextBtn = page.getByRole('button', { name: /Find What Could Break/i });
    await expect(nextBtn).toBeEnabled();
    await page.getByRole('button', { name: /AI-powered tool/i }).click();
    await expect(nextBtn).toBeDisabled();
  });

  test('optional URL field accepts input', async ({ page }) => {
    await goToStep1(page);
    const urlInput = page.getByPlaceholder('https://yourapp.com');
    await urlInput.fill('https://myapp.example.com');
    await expect(urlInput).toHaveValue('https://myapp.example.com');
  });

  test('optional free-text area accepts input', async ({ page }) => {
    await goToStep1(page);
    const textarea = page.getByPlaceholder(/e.g. It's a waitlist tool/i);
    await textarea.fill('A SaaS tool for freelancers to send invoices.');
    await expect(textarea).toHaveValue('A SaaS tool for freelancers to send invoices.');
  });
});
