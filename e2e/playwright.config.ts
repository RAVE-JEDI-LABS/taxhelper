import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for TaxHelper E2E tests
 *
 * Run with: pnpm test (headless) or pnpm test:headed (with browser)
 */
export default defineConfig({
  testDir: './tests',

  // Run tests in parallel but not too aggressively
  fullyParallel: true,
  workers: process.env.CI ? 1 : 2,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  // Global timeout for each test
  timeout: 60000,

  // Expect timeout (for assertions)
  expect: {
    timeout: 10000,
  },

  use: {
    // Base URL for navigation (default, overridden by projects)
    baseURL: 'http://localhost:3003',

    // Action timeouts - generous to avoid flakiness
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Collect trace on first retry for debugging
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on first retry
    video: 'on-first-retry',

    // Viewport
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors (for local dev)
    ignoreHTTPSErrors: true,
  },

  // Configure projects for different apps
  projects: [
    // Setup project - authenticates and saves state
    {
      name: 'admin-setup',
      testMatch: /admin\.setup\.ts/,
      use: {
        baseURL: 'http://localhost:3003',
      },
    },
    {
      name: 'portal-setup',
      testMatch: /portal\.setup\.ts/,
      use: {
        baseURL: 'http://localhost:3002',
      },
    },

    // Admin portal tests
    {
      name: 'admin',
      testDir: './tests/admin',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3003',
        storageState: '.auth/admin.json',
      },
      dependencies: ['admin-setup'],
    },

    // Customer portal tests
    {
      name: 'portal',
      testDir: './tests/portal',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3002',
        storageState: '.auth/customer.json',
      },
      dependencies: ['portal-setup'],
    },

    // Security tests (no auth state - tests auth boundaries)
    {
      name: 'security',
      testDir: './tests/security',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  // Start local dev servers before running tests
  // Set PLAYWRIGHT_SKIP_WEBSERVER=1 to skip auto-starting servers
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER ? undefined : [
    {
      command: 'cd .. && pnpm dev:backend',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'cd ../admin && pnpm dev',
      url: 'http://localhost:3003',
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'cd ../portal && pnpm dev',
      url: 'http://localhost:3002',
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
