// tests/e2e/landing.spec.js
import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/QA Copilot|QA/i);
  });

  test('shows the main headline', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('h1')).toContainText('built it with AI');
  });

  test('shows the "Test My App" CTA button', async ({ page }) => {
    const cta = page.getByRole('button', { name: /Test My App/i });
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();
  });

  test('CTA button navigates into the wizard', async ({ page }) => {
    await page.getByRole('button', { name: /Test My App/i }).click();
    await expect(page.getByText(/Tell us what you built/i)).toBeVisible();
  });

  test('shows the "How it works" section with 4 steps', async ({ page }) => {
    await expect(page.getByText('HOW IT WORKS')).toBeVisible();
    await expect(page.getByText('01')).toBeVisible();
    await expect(page.getByText('02')).toBeVisible();
    await expect(page.getByText('03')).toBeVisible();
    await expect(page.getByText('04')).toBeVisible();
  });

  test('shows tool badges (Cursor, Bolt, etc.)', async ({ page }) => {
    await expect(page.getByText('Cursor')).toBeVisible();
    await expect(page.getByText('Bolt')).toBeVisible();
  });

  test('shows "FREE WHILE IN BETA" badge', async ({ page }) => {
    await expect(page.getByText(/FREE WHILE IN BETA/i)).toBeVisible();
  });

  test('mobile layout: headline is visible on 375px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    const box = await h1.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.width).toBeLessThanOrEqual(375);
  });
});
