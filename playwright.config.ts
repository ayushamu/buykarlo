import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for BuyKarlo 2.0.
 * The BrowserStack SDK overrides the projects specified here to run them on real cloud devices.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 45 * 1000, // 45 seconds timeout per test
  expect: {
    timeout: 8000,
  },
  fullyParallel: true,
  retries: 1,
  workers: undefined, // Let the system/BrowserStack determine execution concurrency
  reporter: [['html', { open: 'never' }]], // HTML reporter (never open automatically in terminal context)
  
  use: {
    baseURL: 'http://bs-local.com:3000',
    trace: 'off',
    screenshot: 'only-on-failure',
  },

  /* Configure projects to run locally (BrowserStack overrides this with browserstack.yml) */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Spin up dev server automatically if not already running on port 3000 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
