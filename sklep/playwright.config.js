import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.js/,
  updateSnapshots: 'missing',
  // Wynik w terminalu + raport HTML (playwright-report/) do obejrzenia po "pokaż raport testów".
  // open: 'never' - raport nie otwiera się sam i nie blokuje terminala.
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:8080',
    viewport: { width: 1000, height: 800 },
    // Zrzut ekranu z chwili błędu - widać go w raporcie HTML przy czerwonym teście.
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx http-server -p 8080 -c-1 .',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
