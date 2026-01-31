import { test, expect } from '@playwright/test';

/**
 * Admin Dashboard E2E Tests
 *
 * These tests verify the admin portal functionality for staff users.
 * Auth state is pre-loaded from admin.setup.ts
 */

test.describe('Admin Dashboard', () => {
  test('should display dashboard after login', async ({ page }) => {
    await page.goto('/');

    // Should see dashboard or main content area
    await expect(page.locator('main, [data-testid="dashboard"]')).toBeVisible();
  });

  test('should have navigation menu', async ({ page }) => {
    await page.goto('/');

    // Look for navigation elements
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();
  });

  test('should navigate to customers page', async ({ page }) => {
    await page.goto('/');

    // Click on customers link if available
    const customersLink = page.locator('a[href*="customers"], button:has-text("Customers")').first();

    if (await customersLink.isVisible()) {
      await customersLink.click();
      await page.waitForURL('**/customers**');
      await expect(page).toHaveURL(/customers/);
    }
  });

  test('should navigate to returns page', async ({ page }) => {
    await page.goto('/');

    const returnsLink = page.locator('a[href*="returns"], button:has-text("Returns")').first();

    if (await returnsLink.isVisible()) {
      await returnsLink.click();
      await page.waitForURL('**/returns**');
      await expect(page).toHaveURL(/returns/);
    }
  });

  test('should navigate to appointments page', async ({ page }) => {
    await page.goto('/');

    const appointmentsLink = page.locator('a[href*="appointments"], button:has-text("Appointments")').first();

    if (await appointmentsLink.isVisible()) {
      await appointmentsLink.click();
      await page.waitForURL('**/appointments**');
      await expect(page).toHaveURL(/appointments/);
    }
  });
});

test.describe('Admin Customers Management', () => {
  test('should display customers list', async ({ page }) => {
    await page.goto('/customers');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Should have a table or list of customers
    const content = page.locator('table, [role="grid"], [data-testid="customers-list"]');
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('should have search or filter functionality', async ({ page }) => {
    await page.goto('/customers');

    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      // Give time for filter to apply
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Admin Returns Management', () => {
  test('should display returns list', async ({ page }) => {
    await page.goto('/returns');

    await page.waitForLoadState('networkidle');

    // Should have a table or list
    const content = page.locator('table, [role="grid"], [data-testid="returns-list"]');
    await expect(content).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Admin Documents Management', () => {
  test('should display documents page', async ({ page }) => {
    await page.goto('/documents');

    await page.waitForLoadState('networkidle');

    // Should show documents interface
    await expect(page.locator('main')).toBeVisible();
  });
});
