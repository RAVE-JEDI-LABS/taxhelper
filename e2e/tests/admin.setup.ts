import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/admin.json');

/**
 * Admin authentication setup
 * This runs once before all admin tests and saves the auth state
 */
setup('authenticate as admin', async ({ page }) => {
  // Navigate to admin login
  await page.goto('/login');

  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');

  // Fill in login credentials
  await page.locator('input[name="email"], input[type="email"]').fill(process.env.TEST_ADMIN_EMAIL || 'admin@gordonulencpa.com');
  await page.locator('input[name="password"], input[type="password"]').fill(process.env.TEST_ADMIN_PASSWORD || 'gordonulencpa');

  // Click login button and wait for navigation
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 30000 }).catch(() => {
      // Some apps redirect to root after login
      return page.waitForURL('**/', { timeout: 10000 });
    }),
    page.locator('button[type="submit"]').click(),
  ]);

  // Verify we're logged in by checking for a dashboard element or user menu
  await expect(page.locator('[data-testid="user-menu"], [data-testid="dashboard"], nav')).toBeVisible({
    timeout: 10000,
  });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
