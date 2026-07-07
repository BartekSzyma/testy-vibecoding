import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('E1: pełny przepływ zamówienia kończy się potwierdzeniem z numerem', async ({ page }) => {
  await page.locator('#katalog button', { hasText: 'Dodaj do koszyka' }).first().click();
  await page.locator('#katalog button', { hasText: 'Dodaj do koszyka' }).nth(1).click();
  await page.fill('#imie', 'Jan');
  await page.fill('#email', 'jan@example.com');
  await page.fill('#adres', 'ul. Zielona 1');
  await page.click('#zloz-zamowienie');
  await expect(page.locator('#potwierdzenie')).toBeVisible();
  await expect(page.locator('#numer-zamowienia')).toContainText('ZAM-');
});

test('E2: e-mail bez @ blokuje zamówienie', async ({ page }) => {
  await page.locator('#katalog button', { hasText: 'Dodaj do koszyka' }).first().click();
  await page.fill('#imie', 'Jan');
  await page.fill('#email', 'jan-bez-malpy');
  await page.fill('#adres', 'ul. Zielona 1');
  await page.click('#zloz-zamowienie');
  await expect(page.locator('#potwierdzenie')).toBeHidden();
  await expect(page.locator('#blad-formularza')).toContainText('email');
});

test('E3: dodanie produktu zwiększa licznik koszyka', async ({ page }) => {
  await expect(page.locator('#licznik-koszyka')).toHaveText('0');
  await page.locator('#katalog button', { hasText: 'Dodaj do koszyka' }).first().click();
  await expect(page.locator('#licznik-koszyka')).toHaveText('1');
});

test('E4: potwierdzenie pokazuje kwotę z rabatem', async ({ page }) => {
  // 5 x Plakat = 200 netto, darmowa dostawa; z VIBE10 doZaplaty = 221,40
  for (let i = 0; i < 5; i += 1) {
    await page.locator('#katalog button', { hasText: 'Dodaj do koszyka' }).nth(2).click();
  }
  await page.fill('#kod-rabatowy', 'VIBE10');
  await page.click('#zastosuj-kod');
  await page.fill('#imie', 'Jan');
  await page.fill('#email', 'jan@example.com');
  await page.fill('#adres', 'ul. Zielona 1');
  await page.click('#zloz-zamowienie');
  await expect(page.locator('#kwota-potwierdzenie')).toHaveText('221,40 zł');
});

test('B3: przy pustym koszyku przycisk zamówienia jest nieaktywny', async ({ page }) => {
  await expect(page.locator('#zloz-zamowienie')).toBeDisabled();
  await page.locator('#katalog button', { hasText: 'Dodaj do koszyka' }).first().click();
  await expect(page.locator('#zloz-zamowienie')).toBeEnabled();
});
