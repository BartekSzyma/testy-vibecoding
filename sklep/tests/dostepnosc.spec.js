import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('A1: przyciski "Dodaj do koszyka" mają dostępną nazwę', async ({ page }) => {
  await page.goto('/');
  const wyniki = await new AxeBuilder({ page })
    .include('#katalog')
    .options({ runOnly: ['button-name'] })
    .analyze();
  expect(wyniki.violations).toEqual([]);
});
