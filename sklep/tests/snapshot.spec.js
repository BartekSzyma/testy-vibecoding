import { test, expect } from '@playwright/test';

test('V1: panel podsumowania zgadza się z zatwierdzonym zrzutem', async ({ page }) => {
  await page.goto('/');
  // deterministyczny stan: 2 x Kubek
  await page.locator('#katalog button', { hasText: 'Dodaj do koszyka' }).first().click();
  await page.locator('#katalog button', { hasText: 'Dodaj do koszyka' }).first().click();
  await expect(page.locator('#podsumowanie')).toHaveScreenshot('podsumowanie.png', {
    maxDiffPixelRatio: 0.01,
  });
});
