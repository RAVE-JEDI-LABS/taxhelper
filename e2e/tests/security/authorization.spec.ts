import { test, expect } from '@playwright/test';

/**
 * Security Authorization Tests
 *
 * These tests verify authorization boundaries between apps.
 * They run WITHOUT pre-authenticated state to test access controls.
 *
 * Ports:
 * - Backend API: 3001
 * - Admin: 3003
 * - Portal: 3002
 */

const API_URL = 'http://localhost:3001';
const ADMIN_URL = 'http://localhost:3003';
const PORTAL_URL = 'http://localhost:3002';

test.describe('Authentication Required', () => {
  test('admin portal should require authentication', async ({ page }) => {
    // Navigate to admin portal without auth
    await page.goto(ADMIN_URL);

    await page.waitForLoadState('networkidle');

    // Should redirect to login or show login form
    const isLoginPage = await page.locator('input[type="password"], form[action*="login"], [data-testid="login-form"]').isVisible({ timeout: 10000 }).catch(() => false);
    const isLoginUrl = page.url().includes('login');

    expect(isLoginPage || isLoginUrl).toBeTruthy();
  });

  test('customer portal should require authentication', async ({ page }) => {
    // Navigate to customer portal without auth
    await page.goto(PORTAL_URL);

    await page.waitForLoadState('networkidle');

    // Should redirect to login or show login form
    const isLoginPage = await page.locator('input[type="password"], form[action*="login"], [data-testid="login-form"]').isVisible({ timeout: 10000 }).catch(() => false);
    const isLoginUrl = page.url().includes('login');

    expect(isLoginPage || isLoginUrl).toBeTruthy();
  });
});

test.describe('API Authorization Boundaries', () => {
  test('API should reject unauthenticated requests', async ({ request }) => {
    // Try to access customers endpoint without auth
    const response = await request.get(`${API_URL}/api/customers`);

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('API should reject unauthenticated returns requests', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/returns`);

    expect(response.status()).toBe(401);
  });

  test('API should reject unauthenticated documents requests', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/documents`);

    expect(response.status()).toBe(401);
  });

  test('API should reject unauthenticated appointments requests', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/appointments`);

    expect(response.status()).toBe(401);
  });
});

test.describe('Direct URL Access', () => {
  test('cannot access admin dashboard directly without auth', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/dashboard`);

    await page.waitForLoadState('networkidle');

    // Should not show dashboard content
    const dashboard = page.locator('[data-testid="dashboard-content"], [data-testid="admin-dashboard"]');
    const isDashboardVisible = await dashboard.isVisible({ timeout: 3000 }).catch(() => false);

    // Either redirected to login or dashboard not shown
    const isLoginUrl = page.url().includes('login');
    expect(isDashboardVisible === false || isLoginUrl).toBeTruthy();
  });

  test('cannot access admin customers page directly without auth', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/customers`);

    await page.waitForLoadState('networkidle');

    // Should redirect to login
    const isLoginUrl = page.url().includes('login');
    const hasLoginForm = await page.locator('input[type="password"]').isVisible({ timeout: 3000 }).catch(() => false);

    expect(isLoginUrl || hasLoginForm).toBeTruthy();
  });

  test('cannot access customer portal dashboard directly without auth', async ({ page }) => {
    await page.goto(`${PORTAL_URL}/dashboard`);

    await page.waitForLoadState('networkidle');

    const isLoginUrl = page.url().includes('login');
    const hasLoginForm = await page.locator('input[type="password"]').isVisible({ timeout: 3000 }).catch(() => false);
    const is404 = await page.locator('h1:has-text("404"), h2:has-text("could not be found")').first().isVisible({ timeout: 1000 }).catch(() => false);

    // Either redirected to login, shows login form, or returns 404 (all acceptable)
    expect(isLoginUrl || hasLoginForm || is404).toBeTruthy();
  });
});

test.describe('Invalid Token Handling', () => {
  test('API rejects invalid bearer token', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/customers`, {
      headers: {
        'Authorization': 'Bearer invalid-token-12345',
      },
    });

    // Should return 401 for invalid token
    expect(response.status()).toBe(401);
  });

  test('API rejects malformed authorization header', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/customers`, {
      headers: {
        'Authorization': 'NotBearer token',
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('Health Check (Public Endpoint)', () => {
  test('health endpoint should be accessible without auth', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/health`);

    // Health check should be public
    expect(response.status()).toBe(200);
  });
});
