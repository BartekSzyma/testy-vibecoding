import { test, expect } from '@playwright/test';

test('S1: strona renderuje 4 produkty i konsola nie zgłasza błędu', async ({ page }) => {
  const bledy = [];
  page.on('pageerror', (e) => bledy.push(e.message));
  await page.goto('/');
  await expect(page.locator('#katalog button', { hasText: 'Dodaj do koszyka' })).toHaveCount(4);
  expect(bledy).toEqual([]);
});
