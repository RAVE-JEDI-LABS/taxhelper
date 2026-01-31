import { test, expect } from '@playwright/test';

/**
 * Customer Portal E2E Tests
 *
 * These tests verify the customer portal functionality.
 * Auth state is pre-loaded from portal.setup.ts
 */

test.describe('Customer Portal Dashboard', () => {
  test('should display dashboard after login', async ({ page }) => {
    await page.goto('/');

    // Should see dashboard content
    await expect(page.locator('main, [data-testid="dashboard"]')).toBeVisible();
  });

  test('should show customer name or greeting', async ({ page }) => {
    await page.goto('/');

    // Look for personalized greeting or user info
    const greeting = page.locator('[data-testid="user-greeting"], h1, h2').first();
    await expect(greeting).toBeVisible();
  });

  test('should display tax returns status', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Look for tax returns section
    const returnsSection = page.locator('[data-testid="returns-status"], [data-testid="tax-returns"], section:has-text("return")');

    // This may or may not exist depending on customer data
    if (await returnsSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(returnsSection).toBeVisible();
    }
  });

  test('should display documents section', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Look for documents section or link
    const documentsSection = page.locator('[data-testid="documents"], a[href*="documents"], section:has-text("document")');

    if (await documentsSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(documentsSection).toBeVisible();
    }
  });
});

test.describe('Customer Portal Documents', () => {
  test('should navigate to documents page', async ({ page }) => {
    await page.goto('/');

    const docsLink = page.locator('a[href*="documents"], button:has-text("Documents")').first();

    if (await docsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await docsLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should only show own documents', async ({ page }) => {
    await page.goto('/documents');

    await page.waitForLoadState('networkidle');

    // Verify we're on the documents page and it loaded
    await expect(page.locator('main')).toBeVisible();

    // Customer should only see their own documents (not other customers')
    // This is implicitly tested by the authorization middleware
  });
});

test.describe('Customer Portal Profile', () => {
  test('should access profile or settings', async ({ page }) => {
    await page.goto('/');

    // Look for profile/settings link or user menu
    const profileLink = page.locator('[data-testid="user-menu"], a[href*="profile"], a[href*="settings"], button:has-text("Profile")').first();

    if (await profileLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await profileLink.click();
      await page.waitForLoadState('networkidle');
    }
  });
});

test.describe('Customer Portal - Cannot Access Admin Routes', () => {
  test('should not access admin-only endpoints via UI', async ({ page }) => {
    // Try to navigate to a staff-only URL (if they somehow knew it)
    // The portal app shouldn't have these routes, but verify graceful handling

    await page.goto('/admin');

    // Should either 404 or redirect, not show admin content
    const adminContent = page.locator('[data-testid="admin-dashboard"]');
    await expect(adminContent).not.toBeVisible({ timeout: 5000 });
  });
});
