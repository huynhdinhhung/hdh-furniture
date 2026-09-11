import { defineConfig, devices } from '@playwright/test';
const baseURL=process.env.E2E_BASE_URL || 'http://localhost:3000';
const apiURL=process.env.E2E_API_URL || 'http://localhost:4000';
const serverEnv={PORT:new URL(apiURL).port,WEB_ORIGIN:baseURL,API_URL:apiURL,NEXT_DIST_DIR:'.next-e2e'};
export default defineConfig({
  timeout:90000,
  expect:{timeout:15000},
  testDir: './tests/e2e', fullyParallel: true, retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true } },
  ],
  webServer: [
    { command: 'npm run dev -w @hung/api', env:serverEnv, url: apiURL+'/api/v1/health', reuseExistingServer: !process.env.CI, timeout: 120000 },
    { command: 'npm exec -w @hung/web -- next dev --port '+new URL(baseURL).port, env:serverEnv, url: baseURL, reuseExistingServer: !process.env.CI, timeout: 180000 },
  ],
});
