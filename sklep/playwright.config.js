import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.js/,
  updateSnapshots: 'missing',
  use: {
    baseURL: 'http://localhost:8080',
    viewport: { width: 1000, height: 800 },
  },
  webServer: {
    command: 'npx http-server -p 8080 -c-1 .',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
