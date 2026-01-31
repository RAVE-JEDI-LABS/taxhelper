import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/customer.json');

/**
 * Customer portal authentication setup
 * This runs once before all portal tests and saves the auth state
 */
setup('authenticate as customer', async ({ page }) => {
  // Navigate to portal login
  await page.goto('/login');

  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');

  // Fill in customer login credentials
  await page.locator('input[name="email"], input[type="email"]').fill(process.env.TEST_CUSTOMER_EMAIL || 'customer@example.com');
  await page.locator('input[name="password"], input[type="password"]').fill(process.env.TEST_CUSTOMER_PASSWORD || 'gordonulencpa');

  // Click login button and wait for navigation
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 30000 }).catch(() => {
      return page.waitForURL('**/', { timeout: 10000 });
    }),
    page.locator('button[type="submit"]').click(),
  ]);

  // Verify we're logged in
  await expect(page.locator('[data-testid="user-menu"], [data-testid="dashboard"], main')).toBeVisible({
    timeout: 10000,
  });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
