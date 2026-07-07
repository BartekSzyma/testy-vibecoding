# Dzień 12 - Testy w vibecodingu (koszyk + workbook) - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Fallback:** jeśli te sub-skille są niedostępne, wykonaj plan wprost - zadanie po zadaniu, krok po kroku wg checklist Task 1-13, commitując po każdym zadaniu.

**Goal:** Zbudować materiały dydaktyczne Dnia 12: samodzielną stronę-workbook (`Dzien12/index.html`) oraz realną mini-apkę koszyk z zestawem testów (`Dzien12/sklep/`), na której uczestnik łamie apkę promptami do Claude Code i widzi czerwony/zielony wynik.

**Architecture:** Dwa niezależne artefakty. `sklep/` to czysta apka HTML+JS (ES modules, bez builda) z logiką w `src/koszyk.js` i `src/walidacja.js`, UI w `src/ui.js` + `index.html`, oraz testy: Vitest (jednostkowe, behawioralne) i Playwright (e2e, snapshot, a11y). Workbook to samodzielna strona HTML sterowana danymi (tablica `SEKCJE`), która renderuje 7 sekcji z kartami testów, promptami łamiącymi i kreatorem własnego testu. Kolejność: najpierw apka+testy (bo prompty muszą być zweryfikowane realnym przebiegiem), potem workbook używający zweryfikowanych promptów.

**Tech Stack:** HTML5 + JavaScript ES modules, Vitest (jsdom), Playwright Test, @axe-core/playwright, Node.js, git.

## Global Constraints

- Język polski, pełne diakrytyki (ą, ć, ę, ł, ń, ó, ś, ź, ż) we WSZYSTKICH treściach (kod, komentarze, UI, prompty, commity, podpisy).
- Tylko dywiz `-` (U+002D). Zakaz em dash `—`, en dash `–` i wariantów Unicode.
- Pliki w UTF-8. Nazwy plików generowanych artefaktów w ASCII.
- Apka: czysty HTML+JS, ES modules, bez frameworka i bez kroku build.
- Katalog produktów renderowany PRZEZ JS do `<div id="katalog">` (warunek łamania smoke).
- Katalog: Kubek 25, Koszulka 60, Plakat 40, Naklejka 10 (ceny netto, PLN).
- Stałe: `PROG_DARMOWEJ_DOSTAWY = 200` (od wartości netto towarów), `KOSZT_DOSTAWY = 15`, `STAWKA_VAT = 0.23`, `RABAT = 0.10`, `KOD_RABATOWY = 'VIBE10'`.
- Algorytm podsumowania (wiążąca kolejność): sumaNetto -> dostawa(próg na sumaNetto przed rabatem) -> rabat -> nettoPoRabacie -> vat -> bruttoTowarow -> doZaplaty. `round2` = zaokrąglenie do 2 miejsc, pół w górę.
- Vitest: `vitest.config.js` z `environment: 'jsdom'`, `globals: true`.
- Playwright: `updateSnapshots: 'missing'`, baseline zrzutów commitowany, `webServer` w konfiguracji, kontrolowany viewport.
- `.gitignore`: `node_modules/`, `test-results/`, `playwright-report/` (NIE snapshoty).
- Commity częste, po polsku, zakończone linią `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Każdy prompt kategorii (B) w banku ma wariant-pewniak (A). Prompty jednostkowe ruszają funkcje domenowe, nie prezentację.
- **Model git (jeden, wiążący):** katalog roboczy planu to `Dzien12/`. Testy uruchamiaj w podkatalogu przez subshell `(cd sklep && ...)`, żeby nie zmieniać trwałego cwd. **Wszystkie commity idą do repo `Dzien12/`** - NIE tworzymy osobnego repo w `sklep/` podczas budowy. `sklep/` jest wersjonowany jako źródło w repo `Dzien12/`, ale dystrybuowany uczestnikowi jako folder **bez `.git`**; to uczestnik wykonuje `git init` + `git tag zielony-start` w Kroku 0 (patrz README). Reset w trakcie budowy/weryfikacji: `git checkout -- . && git clean -fd` w obrębie `sklep/`.
- **Świadome ograniczenie zakresu (YAGNI):** opcjonalne scenariusze V2 (snapshot siatki katalogu) i A2 (kontrast cen) z sekcji 8 specu NIE są implementowane w tej iteracji - trzon a11y to A1 (button-name), trzon snapshot to V1.

---

## File Structure

```
Dzien12/
  index.html                      # WORKBOOK (Task 12) - samodzielny, sterowany danymi SEKCJE
  sklep/
    index.html                    # UI koszyka (Task 6)
    src/
      koszyk.js                   # logika domenowa (Task 2-3)
      walidacja.js                # walidacja formularza (Task 4)
      ui.js                       # wiązanie UI z logiką, render katalogu (Task 6)
    tests/
      jednostkowe.test.js         # Vitest (Task 2-3)
      behawioralne.test.js        # Vitest given/when/then (Task 4)
      smoke.spec.js               # Playwright smoke: 4 karty + brak pageerror (Task 7)
      e2e.spec.js                 # Playwright e2e + B3 (Task 7)
      snapshot.spec.js            # Playwright toHaveScreenshot (Task 8)
      snapshot.spec.js-snapshots/ # baseline zrzutów (Task 8, commitowany)
      dostepnosc.spec.js          # Playwright + axe (Task 9)
    package.json                  # (Task 1)
    vitest.config.js              # (Task 1)
    playwright.config.js          # (Task 7)
    .gitignore                    # (Task 1)
    README.md                     # Krok 0 + troubleshooting (Task 10)
  docs/superpowers/
    specs/2026-07-07-dzien12-testy-koszyk-design.md   # istnieje
    plans/2026-07-07-dzien12-testy-koszyk.md          # ten plik
```

---

## Task 1: Scaffold projektu `sklep/`

**Files:**
- Create: `sklep/package.json`
- Create: `sklep/vitest.config.js`
- Create: `sklep/.gitignore`
- Create: `sklep/src/.gitkeep`, `sklep/tests/.gitkeep`

**Interfaces:**
- Produces: skrypty npm `test:unit`, `test:bdd`, `test:e2e`, `test:visual`, `test:a11y`, `test`.

- [ ] **Step 1: Utwórz `sklep/package.json`**

```json
{
  "name": "sklep-testy-dzien12",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test:unit": "vitest run tests/jednostkowe.test.js",
    "test:bdd": "vitest run tests/behawioralne.test.js",
    "test:e2e": "playwright test tests/e2e.spec.js",
    "test:visual": "playwright test tests/snapshot.spec.js",
    "test:a11y": "playwright test tests/dostepnosc.spec.js",
    "test": "vitest run && playwright test"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "jsdom": "^25.0.0",
    "@playwright/test": "^1.48.0",
    "@axe-core/playwright": "^4.10.0"
  }
}
```

- [ ] **Step 2: Utwórz `sklep/vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
  },
});
```

- [ ] **Step 3: Utwórz `sklep/.gitignore`**

```
node_modules/
test-results/
playwright-report/
blob-report/
```

- [ ] **Step 4: Utwórz placeholdery katalogów**

Utwórz puste pliki `sklep/src/.gitkeep` i `sklep/tests/.gitkeep`.

- [ ] **Step 5: Zainstaluj zależności i zweryfikuj**

Run: `cd sklep && npm install && npx playwright install chromium && npx vitest run --passWithNoTests`
Expected: instalacja bez błędów; `vitest --passWithNoTests` kończy się zielono mimo braku testów (bez flagi Vitest potrafi zwrócić błąd - stąd `--passWithNoTests`).

- [ ] **Step 6: Commit (do repo `Dzien12/`, bez osobnego repo w sklep)**

```bash
# z katalogu Dzien12; sklep/.gitignore chroni node_modules
git add sklep
git commit -m "Dzien 12 sklep: scaffold projektu (vitest, playwright, npm scripts)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Logika koszyka - sumaNetto, dostawa, rabat, vat, podsumowanie (TDD)

**Files:**
- Create: `sklep/src/koszyk.js`
- Create: `sklep/tests/jednostkowe.test.js`

**Interfaces:**
- Produces:
  - `KATALOG: Array<{id: string, nazwa: string, cena: number}>`
  - `round2(x: number): number`
  - `sumaNetto(pozycje: Array<{id: string, ilosc: number}>): number`
  - `dostawa(sumaNettoTowarow: number): number`
  - `rabat(sumaNettoTowarow: number, kod: string): number`
  - `vat(nettoPoRabacie: number): number`
  - `podsumowanie(pozycje, kod): {netto, kwotaRabatu, nettoPoRabacie, kwotaVat, bruttoTowarow, kosztDostawy, doZaplaty, rabatAktywny}`
  - stałe: `PROG_DARMOWEJ_DOSTAWY`, `KOSZT_DOSTAWY`, `STAWKA_VAT`, `RABAT`, `KOD_RABATOWY`

- [ ] **Step 1: Napisz testy jednostkowe `sklep/tests/jednostkowe.test.js`**

```js
import { describe, it, expect } from 'vitest';
import {
  KATALOG, round2, sumaNetto, dostawa, rabat, vat, podsumowanie,
} from '../src/koszyk.js';

describe('katalog', () => {
  it('U0: ma 4 produkty z cenami netto', () => {
    expect(KATALOG).toHaveLength(4);
    expect(KATALOG.find((p) => p.id === 'kubek').cena).toBe(25);
  });
});

describe('sumaNetto', () => {
  it('U1: 3 x Kubek = 75 zł netto', () => {
    expect(sumaNetto([{ id: 'kubek', ilosc: 3 }])).toBe(75);
  });
  it('U4: pusty koszyk zwraca liczbę 0', () => {
    const wynik = sumaNetto([]);
    expect(wynik).toBe(0);
    expect(typeof wynik).toBe('number');
  });
});

describe('vat', () => {
  it('U2: VAT 23% z 75 netto = 17,25', () => {
    expect(vat(75)).toBe(17.25);
  });
  it('U5: VAT 23% z 30 netto = 6,90', () => {
    expect(vat(30)).toBe(6.9);
  });
});

describe('rabat', () => {
  it('U3: VIBE10 daje 10% od netto: ze 100 -> 10', () => {
    expect(rabat(100, 'VIBE10')).toBe(10);
  });
  it('rabat nie działa dla pustego koszyka', () => {
    expect(rabat(0, 'VIBE10')).toBe(0);
  });
  it('rabat nie działa dla złego kodu', () => {
    expect(rabat(100, 'ZLY')).toBe(0);
  });
});

describe('dostawa', () => {
  it('próg 200 netto -> darmowa (0)', () => {
    expect(dostawa(200)).toBe(0);
  });
  it('poniżej progu -> 15', () => {
    expect(dostawa(190)).toBe(15);
  });
});

describe('podsumowanie', () => {
  it('Przykład A: 105 netto bez kodu -> doZaplaty 144,15', () => {
    const p = podsumowanie(
      [{ id: 'plakat', ilosc: 2 }, { id: 'kubek', ilosc: 1 }],
      '',
    );
    expect(p.netto).toBe(105);
    expect(p.kosztDostawy).toBe(15);
    expect(p.kwotaVat).toBe(24.15);
    expect(p.doZaplaty).toBe(144.15);
  });
  it('Przykład B: 200 netto + VIBE10 -> dostawa 0, doZaplaty 221,40', () => {
    const p = podsumowanie([{ id: 'plakat', ilosc: 5 }], 'VIBE10');
    expect(p.kosztDostawy).toBe(0);
    expect(p.kwotaRabatu).toBe(20);
    expect(p.doZaplaty).toBe(221.4);
  });
  it('B4: rabat liczony od towaru (100), nie od towaru+dostawa', () => {
    const p = podsumowanie([{ id: 'kubek', ilosc: 4 }], 'VIBE10');
    expect(p.netto).toBe(100);
    expect(p.kwotaRabatu).toBe(10);
  });
});
```

- [ ] **Step 2: Uruchom testy - mają NIE przejść**

Run: `cd sklep && npx vitest run tests/jednostkowe.test.js`
Expected: FAIL - "Failed to resolve import '../src/koszyk.js'".

- [ ] **Step 3: Zaimplementuj `sklep/src/koszyk.js`**

```js
export const KATALOG = [
  { id: 'kubek', nazwa: 'Kubek', cena: 25 },
  { id: 'koszulka', nazwa: 'Koszulka', cena: 60 },
  { id: 'plakat', nazwa: 'Plakat', cena: 40 },
  { id: 'naklejka', nazwa: 'Naklejka', cena: 10 },
];

export const PROG_DARMOWEJ_DOSTAWY = 200;
export const KOSZT_DOSTAWY = 15;
export const STAWKA_VAT = 0.23;
export const RABAT = 0.1;
export const KOD_RABATOWY = 'VIBE10';

export function round2(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

export function sumaNetto(pozycje) {
  return pozycje.reduce((suma, pozycja) => {
    const produkt = KATALOG.find((p) => p.id === pozycja.id);
    if (!produkt) return suma;
    return suma + produkt.cena * pozycja.ilosc;
  }, 0);
}

export function dostawa(sumaNettoTowarow) {
  return sumaNettoTowarow >= PROG_DARMOWEJ_DOSTAWY ? 0 : KOSZT_DOSTAWY;
}

export function rabat(sumaNettoTowarow, kod) {
  if (kod === KOD_RABATOWY && sumaNettoTowarow > 0) {
    return round2(RABAT * sumaNettoTowarow);
  }
  return 0;
}

export function vat(nettoPoRabacie) {
  return round2(STAWKA_VAT * nettoPoRabacie);
}

export function podsumowanie(pozycje, kod) {
  const netto = sumaNetto(pozycje);
  const kosztDostawy = dostawa(netto);
  const kwotaRabatu = rabat(netto, kod);
  const nettoPoRabacie = round2(netto - kwotaRabatu);
  const kwotaVat = vat(nettoPoRabacie);
  const bruttoTowarow = round2(nettoPoRabacie + kwotaVat);
  const doZaplaty = round2(bruttoTowarow + kosztDostawy);
  const rabatAktywny = kod === KOD_RABATOWY && netto > 0;
  return {
    netto, kwotaRabatu, nettoPoRabacie, kwotaVat,
    bruttoTowarow, kosztDostawy, doZaplaty, rabatAktywny,
  };
}
```

- [ ] **Step 4: Uruchom testy - mają przejść**

Run: `cd sklep && npx vitest run tests/jednostkowe.test.js`
Expected: PASS (wszystkie bloki zielone).

- [ ] **Step 5: Commit**

```bash
cd sklep && git add src/koszyk.js tests/jednostkowe.test.js
git commit -m "Dzien 12 sklep: logika koszyka + testy jednostkowe (U1-U5)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Walidacja formularza (TDD)

**Files:**
- Create: `sklep/src/walidacja.js`
- Modify: `sklep/tests/jednostkowe.test.js` (dopisz blok)

**Interfaces:**
- Produces:
  - `walidujEmail(email: string): boolean`
  - `walidujZamowienie({imie, email, adres}): {ok: boolean, bledy: string[]}`

- [ ] **Step 1: Dopisz testy do `sklep/tests/jednostkowe.test.js`**

```js
import { walidujEmail, walidujZamowienie } from '../src/walidacja.js';

describe('walidacja', () => {
  it('e-mail bez @ jest niepoprawny', () => {
    expect(walidujEmail('jan.kowalski')).toBe(false);
  });
  it('e-mail z @ jest poprawny', () => {
    expect(walidujEmail('jan@example.com')).toBe(true);
  });
  it('kompletne dane -> ok', () => {
    const w = walidujZamowienie({ imie: 'Jan', email: 'jan@x.pl', adres: 'ul. Zielona 1' });
    expect(w.ok).toBe(true);
  });
  it('brak imienia i zły e-mail -> lista błędów', () => {
    const w = walidujZamowienie({ imie: '', email: 'zle', adres: 'ul. X' });
    expect(w.ok).toBe(false);
    expect(w.bledy).toContain('imie');
    expect(w.bledy).toContain('email');
  });
});
```

- [ ] **Step 2: Uruchom - FAIL**

Run: `cd sklep && npx vitest run tests/jednostkowe.test.js`
Expected: FAIL - "Failed to resolve import '../src/walidacja.js'".

- [ ] **Step 3: Zaimplementuj `sklep/src/walidacja.js`**

```js
export function walidujEmail(email) {
  return typeof email === 'string' && email.includes('@');
}

export function walidujZamowienie({ imie, email, adres }) {
  const bledy = [];
  if (!imie || !imie.trim()) bledy.push('imie');
  if (!walidujEmail(email)) bledy.push('email');
  if (!adres || !adres.trim()) bledy.push('adres');
  return { ok: bledy.length === 0, bledy };
}
```

- [ ] **Step 4: Uruchom - PASS**

Run: `cd sklep && npx vitest run tests/jednostkowe.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd sklep && git add src/walidacja.js tests/jednostkowe.test.js
git commit -m "Dzien 12 sklep: walidacja formularza + testy

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Testy behawioralne (BDD given/when/then)

**Files:**
- Create: `sklep/tests/behawioralne.test.js`

**Interfaces:**
- Consumes: `podsumowanie`, `dostawa` z `koszyk.js`.

- [ ] **Step 1: Napisz `sklep/tests/behawioralne.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { podsumowanie, dostawa } from '../src/koszyk.js';

describe('B1: darmowa dostawa od progu 200 zł netto', () => {
  it('mając koszyk 200 zł netto (5 x Plakat), gdy liczę dostawę, wtedy jest darmowa', () => {
    const p = podsumowanie([{ id: 'plakat', ilosc: 5 }], '');
    expect(p.netto).toBe(200);
    expect(p.kosztDostawy).toBe(0);
  });
  it('mając koszyk tuż poniżej progu, gdy liczę dostawę, wtedy płacę 15 zł', () => {
    expect(dostawa(190)).toBe(15);
  });
});

describe('B2: kod VIBE10 wymaga niepustego koszyka', () => {
  it('mając pusty koszyk, gdy wpisuję VIBE10, wtedy rabat NIE jest aktywny', () => {
    const p = podsumowanie([], 'VIBE10');
    expect(p.rabatAktywny).toBe(false);
  });
  it('mając niepusty koszyk, gdy wpisuję VIBE10, wtedy rabat jest aktywny', () => {
    const p = podsumowanie([{ id: 'kubek', ilosc: 1 }], 'VIBE10');
    expect(p.rabatAktywny).toBe(true);
  });
});

describe('B4: rabat liczony od wartości towarów, nie od dostawy', () => {
  it('mając 100 zł netto + dostawę 15, gdy stosuję VIBE10, wtedy rabat = 10 (nie 11,50)', () => {
    const p = podsumowanie([{ id: 'kubek', ilosc: 4 }], 'VIBE10');
    expect(p.kosztDostawy).toBe(15);
    expect(p.kwotaRabatu).toBe(10);
  });
});
```

- [ ] **Step 2: Uruchom - PASS (logika już istnieje z Task 2)**

Run: `cd sklep && npx vitest run tests/behawioralne.test.js`
Expected: PASS. (Jeśli którykolwiek FAIL - popraw `koszyk.js`, nie test.)

- [ ] **Step 3: Commit**

```bash
cd sklep && git add tests/behawioralne.test.js
git commit -m "Dzien 12 sklep: testy behawioralne BDD (B1, B2, B4)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: UI koszyka - index.html + ui.js

**Files:**
- Create: `sklep/index.html`
- Create: `sklep/src/ui.js`

**Interfaces:**
- Consumes: `KATALOG`, `podsumowanie` z `koszyk.js`; `walidujZamowienie` z `walidacja.js`.
- Produces (kontrakt DOM dla testów e2e/snapshot/a11y):
  - katalog renderowany do `#katalog`; każda karta ma przycisk z tekstem `Dodaj do koszyka` i `data-id`.
  - licznik koszyka: `#licznik-koszyka` (liczba sztuk).
  - panel podsumowania: `#podsumowanie` z `#kwota-do-zaplaty`, `#komunikat-dostawa` oraz `#komunikat-rabat` (tekst "Rabat naliczony" gdy `rabatAktywny`, inaczej pusty).
  - pole kodu: `#kod-rabatowy`; przycisk `#zastosuj-kod`.
  - przycisk `#zloz-zamowienie` (atrybut `disabled` gdy koszyk pusty).
  - formularz: `#imie`, `#email`, `#adres`.
  - ekran potwierdzenia: `#potwierdzenie` (ukryty domyślnie) z `#numer-zamowienia` i `#kwota-potwierdzenie`.
  - komunikat błędu walidacji: `#blad-formularza`.

- [ ] **Step 1: Utwórz `sklep/index.html`**

```html
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sklep - poligon testowy</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f4f4f8; color: #1a1a2e; }
    h1 { font-size: 24px; }
    #katalog { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; max-width: 520px; }
    .karta { background: #fff; border: 1px solid #ccc; border-radius: 8px; padding: 12px; }
    .karta button { margin-top: 8px; padding: 8px 12px; cursor: pointer; }
    #podsumowanie { background: #fff; border: 1px solid #ccc; border-radius: 8px; padding: 16px; max-width: 340px; margin-top: 20px; }
    #kwota-do-zaplaty { font-size: 22px; font-weight: bold; }
    #komunikat-dostawa { color: #a15a00; font-size: 14px; }
    #potwierdzenie[hidden] { display: none; }
    .blad { color: #b00020; }
  </style>
</head>
<body>
  <h1>Sklep - poligon testowy</h1>
  <div id="katalog"></div>

  <section id="podsumowanie">
    <p>Koszyk: <span id="licznik-koszyka">0</span> szt.</p>
    <p id="komunikat-dostawa"></p>
    <label>Kod rabatowy: <input id="kod-rabatowy" type="text"></label>
    <button id="zastosuj-kod">Zastosuj</button>
    <p id="komunikat-rabat"></p>
    <p>Do zapłaty: <span id="kwota-do-zaplaty">0,00 zł</span></p>
    <h2>Zamówienie</h2>
    <label>Imię: <input id="imie" type="text"></label>
    <label>E-mail: <input id="email" type="text"></label>
    <label>Adres: <input id="adres" type="text"></label>
    <p id="blad-formularza" class="blad"></p>
    <button id="zloz-zamowienie" disabled>Złóż zamówienie</button>
  </section>

  <section id="potwierdzenie" hidden>
    <h2>Dziękujemy za zamówienie!</h2>
    <p>Numer zamówienia: <span id="numer-zamowienia"></span></p>
    <p>Kwota: <span id="kwota-potwierdzenie"></span></p>
  </section>

  <script type="module" src="src/ui.js"></script>
</body>
</html>
```

- [ ] **Step 2: Utwórz `sklep/src/ui.js`**

```js
import { KATALOG, podsumowanie, PROG_DARMOWEJ_DOSTAWY } from './koszyk.js';
import { walidujZamowienie } from './walidacja.js';

const koszyk = new Map(); // id -> ilosc
let kod = '';

function formatZl(x) {
  return `${x.toFixed(2).replace('.', ',')} zł`;
}

function pozycje() {
  return [...koszyk.entries()].map(([id, ilosc]) => ({ id, ilosc }));
}

function renderKatalog() {
  const kontener = document.querySelector('#katalog');
  kontener.innerHTML = '';
  for (const produkt of KATALOG) {
    const karta = document.createElement('div');
    karta.className = 'karta';
    karta.innerHTML = `<strong>${produkt.nazwa}</strong><br>${formatZl(produkt.cena)} netto`;
    const przycisk = document.createElement('button');
    przycisk.textContent = 'Dodaj do koszyka';
    przycisk.dataset.id = produkt.id;
    przycisk.addEventListener('click', () => dodaj(produkt.id));
    karta.appendChild(przycisk);
    kontener.appendChild(karta);
  }
}

function dodaj(id) {
  koszyk.set(id, (koszyk.get(id) || 0) + 1);
  renderPodsumowanie();
}

function renderPodsumowanie() {
  const p = podsumowanie(pozycje(), kod);
  const liczbaSzt = [...koszyk.values()].reduce((s, n) => s + n, 0);
  document.querySelector('#licznik-koszyka').textContent = String(liczbaSzt);
  document.querySelector('#kwota-do-zaplaty').textContent = formatZl(p.doZaplaty);
  const brakuje = Math.max(0, PROG_DARMOWEJ_DOSTAWY - p.netto);
  document.querySelector('#komunikat-dostawa').textContent = brakuje > 0
    ? `Do darmowej dostawy brakuje ${formatZl(brakuje)}`
    : 'Masz darmową dostawę!';
  document.querySelector('#komunikat-rabat').textContent = p.rabatAktywny ? 'Rabat naliczony' : '';
  document.querySelector('#zloz-zamowienie').disabled = liczbaSzt === 0;
}

function zastosujKod() {
  kod = document.querySelector('#kod-rabatowy').value.trim();
  renderPodsumowanie();
}

function zlozZamowienie() {
  const dane = {
    imie: document.querySelector('#imie').value,
    email: document.querySelector('#email').value,
    adres: document.querySelector('#adres').value,
  };
  const w = walidujZamowienie(dane);
  const bladEl = document.querySelector('#blad-formularza');
  if (!w.ok) {
    bladEl.textContent = `Popraw pola: ${w.bledy.join(', ')}`;
    return;
  }
  bladEl.textContent = '';
  const p = podsumowanie(pozycje(), kod);
  const numer = `ZAM-${Date.now()}`;
  document.querySelector('#numer-zamowienia').textContent = numer;
  document.querySelector('#kwota-potwierdzenie').textContent = formatZl(p.doZaplaty);
  document.querySelector('#potwierdzenie').hidden = false;
}

document.querySelector('#zastosuj-kod').addEventListener('click', zastosujKod);
document.querySelector('#zloz-zamowienie').addEventListener('click', zlozZamowienie);
renderKatalog();
renderPodsumowanie();
```

- [ ] **Step 3: Sprawdź ręcznie w przeglądarce**

Run: `cd sklep && npx http-server -p 8080 -c-1 .` (lub `npx serve`), otwórz `http://localhost:8080`.
Expected: widać 4 produkty; klik "Dodaj do koszyka" zwiększa licznik i kwotę; kod VIBE10 obniża kwotę; formularz z pustymi polami pokazuje błąd; poprawne dane pokazują potwierdzenie z numerem. Zatrzymaj serwer (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
cd sklep && git add index.html src/ui.js
git commit -m "Dzien 12 sklep: UI koszyka (render katalogu, koszyk, formularz, potwierdzenie)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Konfiguracja Playwright

**Files:**
- Create: `sklep/playwright.config.js`

**Interfaces:**
- Produces: serwer testowy na `http://localhost:8080`, viewport 1000x800, `updateSnapshots: 'missing'`.

- [ ] **Step 1: Utwórz `sklep/playwright.config.js`**

```js
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
```

- [ ] **Step 2: Dodaj `http-server` do devDependencies i zainstaluj**

Run: `cd sklep && npm install --save-dev http-server@^14.1.1`
Expected: instalacja OK.

- [ ] **Step 3: Commit**

```bash
cd sklep && git add playwright.config.js package.json package-lock.json
git commit -m "Dzien 12 sklep: konfiguracja Playwright (webServer, viewport, snapshots missing)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Testy E2E, smoke i B3 (Playwright)

**Files:**
- Create: `sklep/tests/smoke.spec.js`
- Create: `sklep/tests/e2e.spec.js`

**Interfaces:**
- Consumes: kontrakt DOM z Task 5.

- [ ] **Step 0: Napisz `sklep/tests/smoke.spec.js`**

```js
import { test, expect } from '@playwright/test';

test('S1: strona renderuje 4 produkty i konsola nie zgłasza błędu', async ({ page }) => {
  const bledy = [];
  page.on('pageerror', (e) => bledy.push(e.message));
  await page.goto('/');
  await expect(page.locator('#katalog button', { hasText: 'Dodaj do koszyka' })).toHaveCount(4);
  expect(bledy).toEqual([]);
});
```

- [ ] **Step 1: Napisz `sklep/tests/e2e.spec.js`**

```js
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
```

- [ ] **Step 2: Uruchom - PASS**

Run: `cd sklep && npx playwright test tests/smoke.spec.js tests/e2e.spec.js`
Expected: 6 passed (S1 + E1-E4 + B3). (Uwaga: `nth(2)` to Plakat wg kolejności KATALOG: kubek, koszulka, plakat, naklejka.)

- [ ] **Step 3: Commit**

```bash
git add sklep/tests/smoke.spec.js sklep/tests/e2e.spec.js
git commit -m "Dzien 12 sklep: testy smoke, e2e (E1-E4) i B3 (przycisk nieaktywny)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Test regresji wizualnej (snapshot) + baseline

**Files:**
- Create: `sklep/tests/snapshot.spec.js`
- Create (generowany): `sklep/tests/snapshot.spec.js-snapshots/*.png`

- [ ] **Step 1: Napisz `sklep/tests/snapshot.spec.js`**

```js
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
```

- [ ] **Step 2: Wygeneruj i zatwierdź baseline**

Run: `cd sklep && npx playwright test tests/snapshot.spec.js`
Expected: pierwszy przebieg tworzy `podsumowanie.png` w `tests/snapshot.spec.js-snapshots/` i kończy się PASS (dzięki `updateSnapshots: 'missing'`). Drugi przebieg (`npx playwright test tests/snapshot.spec.js`) też PASS - potwierdza stabilność.

- [ ] **Step 3: Commit (baseline WCHODZI do repo)**

```bash
cd sklep && git add tests/snapshot.spec.js "tests/snapshot.spec.js-snapshots"
git commit -m "Dzien 12 sklep: test snapshot podsumowania + zatwierdzony baseline

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Test dostępności (a11y)

**Files:**
- Create: `sklep/tests/dostepnosc.spec.js`

- [ ] **Step 1: Napisz `sklep/tests/dostepnosc.spec.js`**

```js
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
```

- [ ] **Step 2: Uruchom - PASS**

Run: `cd sklep && npx playwright test tests/dostepnosc.spec.js`
Expected: 1 passed (przyciski mają tekst -> mają dostępną nazwę).

- [ ] **Step 3: Commit**

```bash
cd sklep && git add tests/dostepnosc.spec.js
git commit -m "Dzien 12 sklep: test dostępności a11y (button-name)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: README (Krok 0 + troubleshooting) i pełny zielony przebieg

**Files:**
- Create: `sklep/README.md`

- [ ] **Step 1: Utwórz `sklep/README.md`**

````markdown
# Sklep - poligon do nauki testowania

To jest apka-ćwiczenie z Dnia 12. Nie musisz czytać kodu - wszystko robisz przez rozmowę
z Claude Code.

## Krok 0 - przygotuj poligon (raz)

Powiedz Claude Code dokładnie to:

> Przeczytaj README, przygotuj projekt: zainstaluj zależności, uruchom testy i pokaż, że
> wszystkie są zielone. Potem zainicjuj repozytorium git i zapisz to jako punkt "zielony start".

Claude Code wykona:
1. `npm install`
2. `npx playwright install chromium`
3. `npm test` (powinno być zielone - baseline zrzutów jest już w repo)
4. `git init && git add -A && git commit -m "zielony start" && git tag zielony-start`

## Uruchamianie testów

Zawsze mów: **"uruchom testy"** (to uruchamia wszystkie: jednostkowe, behawioralne, e2e,
snapshot, a11y). Nie uruchamiaj tylko wybranego podzbioru - inaczej nie zobaczysz czerwieni
w sekcjach snapshot/a11y.

## Reset - przywróć do zielonego startu

Po każdym ćwiczeniu "łamiącym" powiedz:

> przywróć apkę do zielonego startu

Claude Code wykona `git reset --hard zielony-start && git clean -fd` (wróci do punktu startowego
i usunie pliki utworzone przez prompt łamiący). `node_modules` i raporty są chronione przez
`.gitignore`.

## Zapisywanie własnego testu

W ostatnim kroku każdej sekcji układasz WŁASNY test słowami. Domyślnie jest on jednorazowy -
reset do "zielonego startu" go skasuje. Jeśli chcesz go zachować, ZANIM zresetujesz powiedz:

> zapisz mój test

Claude Code wykona `git add -A && git commit -m "moj-test-sekcja-X"`. Wtedy test wchodzi do
historii i kolejny zwykły reset (do ostatniego zielonego commita) go nie usunie. Pełny
`reset --hard zielony-start` cofa aż do startu - używaj go tylko, gdy chcesz w pełni czysty stan.

## Troubleshooting

- **Brak Node.js:** poproś Claude Code: "sprawdź wersję Node poleceniem `node --version`".
  Potrzebny Node 18+. Jeśli brak - poproś prowadzącego o pomoc z instalacją.
- **`npx playwright install` długo trwa / błąd sieci:** pobranie przeglądarek to jednorazowy
  krok. Przy problemach: "zainstaluj tylko przeglądarkę chromium" (`npx playwright install
  chromium`). W razie ograniczeń sieci zgłoś prowadzącemu.
- **Testy snapshot czerwone na starcie:** baseline jest w repo; jeśli mimo to jest czerwony,
  poproś: "pokaż różnicę w raporcie Playwright" - drobne różnice fontów rozwiązuje prowadzący.
````

- [ ] **Step 2: Pełny zielony przebieg**

Run: `cd sklep && npm test`
Expected: Vitest (jednostkowe + behawioralne) PASS; Playwright (e2e + snapshot + a11y) PASS. Zapisz liczbę testów.

- [ ] **Step 3: Commit**

```bash
cd sklep && git add README.md
git commit -m "Dzien 12 sklep: README z Krokiem 0, uruchamianiem, resetem i troubleshootingiem

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: Weryfikacja banku promptów łamiących (krok akceptacyjny)

**Cel:** potwierdzić realnym przebiegiem, że każdy prompt łamiący (lub jego A-pewniak) faktycznie czerwieni wskazany test. Bez tego materiały nie są gotowe. Wynik zapisujemy do tabeli.

**Files:**
- Create: `docs/superpowers/plans/weryfikacja-promptow.md` (dziennik wyników)

Dla KAŻDEGO scenariusza z sekcji 8 specu wykonaj mikro-cykl (ręcznie, symulując to, co zrobi Claude Code):

- [ ] **Step 1: Zastosuj zmianę opisaną w promptcie** w odpowiednim pliku (`src/koszyk.js`, `src/ui.js`, `index.html` lub teście-zależnym).
- [ ] **Step 2: Uruchom właściwy zestaw** (`npm test` albo konkretny `test:*`).
- [ ] **Step 3: Zanotuj**, który test się zaczerwienił i komunikat (oczekiwano X, było Y).
- [ ] **Step 4:** Jeśli test został ZIELONY (prompt zbyt ostrożny) - zastosuj A-pewniak i potwierdź czerwień; oznacz prompt B jako "wymaga pewniaka".
- [ ] **Step 5:** `(cd sklep && git checkout -- . && git clean -fd)` przed kolejnym scenariuszem - `checkout` cofa zmiany w plikach śledzonych, `git clean -fd` usuwa NOWE pliki utworzone przez prompt (np. `ui-new.js`). Sam `checkout` nie wystarcza.

Lista do przejścia (z sek. 8 specu): Smoke (kontener katalogu), U1 (rabat ilościowy / A: +zamiast*), U2 (VAT w dół), U3 (15%), U4 (null), U5 (VAT 20%), B1 (>200), B2 (VIBE10 zawsze), B3 (przycisk aktywny), B4 (rabat z dostawą), E1 (brak potwierdzenia), E2 (usuń walidację), E3 (reload), E4 (kwota bazowa), V1 (powiększ sumę / A: display none), A1 (usuń tekst+aria), M1/M2/M3 (ręczne - potwierdź, że automaty ZIELONE mimo zmiany).

- [ ] **Step 6: Zapisz dziennik `weryfikacja-promptow.md`** z wynikiem per scenariusz (tabela: scenariusz | plik | test który padł | komunikat | użyty wariant B/A). Jeśli któryś scenariusz nie da się wiarygodnie złamać - popraw prompt w specu i tutaj.

- [ ] **Step 7: Upewnij się, że repo jest znów zielone i czyste**

Run: `cd sklep && git status && npm test`
Expected: `working tree clean`, wszystkie testy PASS.

- [ ] **Step 8: Commit dziennika**

```bash
git add docs/superpowers/plans/weryfikacja-promptow.md
git commit -m "Dzien 12: dziennik weryfikacji promptów łamiących (wszystkie czerwienią testy)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 12: Workbook `Dzien12/index.html` (strona-przewodnik)

**Files:**
- Create: `Dzien12/index.html`

**Uwaga:** to duży artefakt wizualny. Zastosuj skill `frontend-design` i styl kursu (retro/neon, pixel font Pixelify Sans, przewijane sekcje pełnej wysokości, reveal-on-scroll, `prefers-reduced-motion`) - wzór w `../Dzien3/git-jak-zapis-gry.html`. Stronę steruj DANYMI: cała treść 7 sekcji siedzi w tablicy `SEKCJE`, a render generuje karty. Prompty i oczekiwane wyniki bierz z ZWERYFIKOWANEGO banku (Task 11), nie z pamięci.

**Interfaces:**
- Produces: samodzielna strona (bez zależności od `sklep/`), z sekcjami: Hero, "Po co testy", "Piramida i mapa testów", "Krok 0", 7 sekcji testów, "Złota zasada".

> **BRAMA:** Task 12 zaczynasz DOPIERO po Task 11. Jeśli weryfikacja zmieniła którykolwiek prompt/pewniak, zaktualizuj odpowiadające pole w `SEKCJE` poniżej, żeby workbook zgadzał się z tym, co realnie czerwieni testy.

- [ ] **Step 1: Szkielet strony i pełne dane `SEKCJE`**

Zbuduj `Dzien12/index.html` z osadzonym `<script>` zawierającym poniższą (kompletną) strukturę danych:

```js
const KROK0 = 'Przeczytaj README, przygotuj projekt: zainstaluj zależności, uruchom testy i pokaż, że wszystkie są zielone. Potem zainicjuj git i zapisz jako "zielony start".';
const RESET = 'przywróć apkę do zielonego startu';

const SEKCJE = [
  {
    id: 'smoke', tytul: 'Smoke test',
    coToPoco: 'Najprostszy test: czy apka w ogóle się ładuje i nie wywala błędu. Pierwszy krok, buduje pewność.',
    kreator: 'Dopisz test smoke: po otwarciu strony element ___ jest widoczny.',
    karty: [
      { nazwa: 'Strona ładuje się i widać 4 produkty',
        coSprawdza: 'Widać 4 karty produktu i konsola nie zgłasza błędu.',
        promptLamiacy: 'Zmień w index.html ścieżkę skryptu z src/ui.js na src/ui-new.js.',
        oczekiwanie: 'Katalog pusty, test smoke (4 karty) czerwony.',
        pewniak: 'Usuń z index.html kontener katalogu <div id="katalog">.' },
    ],
  },
  {
    id: 'jednostkowe', tytul: 'Testy jednostkowe',
    coToPoco: 'Sprawdzają pojedyncze funkcje liczące (suma, VAT, rabat) w oderwaniu od UI. Tanie i szybkie.',
    kreator: 'Dopisz test jednostkowy: dla wejścia ___ wynik funkcji ___ powinien być ___.',
    karty: [
      { nazwa: '3 × Kubek = 75 zł netto', coSprawdza: 'Suma pozycji = cena × ilość.',
        promptLamiacy: 'Dodaj rabat ilościowy: przy 3+ szt. tego samego produktu licz pozycję 10% taniej.',
        oczekiwanie: 'suma = 67,50 zamiast 75, test U1 czerwony.',
        pewniak: 'W funkcji sumy pozycji dodawaj cenę i ilość zamiast mnożyć.' },
      { nazwa: 'VAT 23% z 75 = 17,25 (brutto 92,25)', coSprawdza: 'vat() = 23% od netto po rabacie.',
        promptLamiacy: 'Zaokrąglaj kwotę VAT w dół do pełnych złotych, żeby ceny ładniej wyglądały.',
        oczekiwanie: 'oczekiwano 17,25, było 17,00.', pewniak: 'Ustaw stawkę VAT na 0.' },
      { nazwa: 'VIBE10 daje -10% od netto: ze 100 -> 10', coSprawdza: 'rabat() = 10% od sumy netto.',
        promptLamiacy: 'Zmień rabat VIBE10 z 10% na 15%.',
        oczekiwanie: 'oczekiwano rabat 10, było 15.', pewniak: 'Ustaw rabat VIBE10 na 50%.' },
      { nazwa: 'Pusty koszyk: suma() = liczba 0', coSprawdza: 'sumaNetto([]) === 0 i jest liczbą.',
        promptLamiacy: 'Gdy koszyk jest pusty, niech funkcja sumy zwraca null zamiast 0.',
        oczekiwanie: 'test typeof / === 0 czerwony.', pewniak: 'Niech suma() dla pustego koszyka rzuca wyjątek.' },
      { nazwa: '3 × Naklejka = 30 netto, VAT 6,90', coSprawdza: 'vat(30) === 6,90.',
        promptLamiacy: 'Licz VAT jako 20% zamiast 23%, bo to prostsze.',
        oczekiwanie: 'oczekiwano 6,90, było 6,00.', pewniak: 'Ustaw stawkę VAT na 10%.' },
    ],
  },
  {
    id: 'behawioralne', tytul: 'Testy behawioralne (BDD)',
    coToPoco: 'Opisują regułę biznesową w języku "mając... gdy... wtedy...". Najbliżej opisu słowami.',
    kreator: 'Dopisz test behawioralny: mając ___, gdy ___, wtedy ___.',
    karty: [
      { nazwa: 'Koszyk 200 zł netto (5×Plakat) -> darmowa dostawa', coSprawdza: 'dostawa = 0 gdy netto ≥ 200.',
        promptLamiacy: 'Zmień zasadę: darmowa dostawa dopiero powyżej 200 zł, nie od 200.',
        oczekiwanie: 'na progu 200 dostawa 15 zamiast 0, test B1 czerwony.',
        pewniak: 'Podnieś próg darmowej dostawy do 500 zł.' },
      { nazwa: 'Pusty koszyk + VIBE10 -> rabat NIE aktywny', coSprawdza: 'podsumowanie([], VIBE10).rabatAktywny === false.',
        promptLamiacy: 'Aktywuj kod VIBE10 także dla pustego koszyka i pokazuj komunikat "Rabat naliczony".',
        oczekiwanie: 'rabatAktywny = true dla pustego koszyka, test B2 czerwony.',
        pewniak: 'Usuń warunek niepustego koszyka - VIBE10 zawsze ustawia flagę rabatu na true.' },
      { nazwa: 'Pusty koszyk -> przycisk zamówienia nieaktywny', coSprawdza: '#zloz-zamowienie ma disabled przy pustym koszyku.',
        promptLamiacy: 'Niech przycisk "Złóż zamówienie" będzie zawsze aktywny.',
        oczekiwanie: 'przycisk aktywny mimo pustego koszyka, test B3 czerwony.',
        pewniak: 'Usuń całą logikę wyłączania przycisku zamówienia.' },
      { nazwa: 'Rabat od towaru (100), nie od towaru+dostawa', coSprawdza: 'kwotaRabatu = 10 dla koszyka 100 netto z VIBE10.',
        promptLamiacy: 'Licz rabat od całej kwoty razem z dostawą.',
        oczekiwanie: 'rabat 11,50 zamiast 10, test B4 czerwony.',
        pewniak: 'Do podstawy rabatu VIBE10 dolicz koszt dostawy.' },
    ],
  },
  {
    id: 'e2e', tytul: 'Testy E2E (Playwright)',
    coToPoco: 'Przechodzą całą apkę jak użytkownik: klikają, wpisują, sprawdzają wynik na ekranie.',
    kreator: 'Dopisz test e2e: gdy kliknę ___ i wpiszę ___, wtedy na ekranie pojawi się ___.',
    karty: [
      { nazwa: 'Dodaj 2 produkty -> dane -> zamówienie -> potwierdzenie', coSprawdza: 'Po złożeniu widać #potwierdzenie z numerem ZAM-.',
        promptLamiacy: 'Po kliknięciu "Złóż zamówienie" nie pokazuj ekranu potwierdzenia, tylko wyczyść koszyk.',
        oczekiwanie: 'brak potwierdzenia, test E1 czerwony.',
        pewniak: 'Ustaw ekran #potwierdzenie na stałe ukryty (display:none).' },
      { nazwa: 'E-mail bez @ blokuje zamówienie', coSprawdza: 'Zły e-mail nie pokazuje potwierdzenia, pokazuje błąd.',
        promptLamiacy: 'Usuń walidację e-maila, przyjmuj dowolny tekst.',
        oczekiwanie: 'potwierdzenie mimo złego e-maila, test E2 czerwony.',
        pewniak: 'Zawsze pomijaj walidację formularza.' },
      { nazwa: 'Dodanie produktu zwiększa licznik', coSprawdza: '#licznik-koszyka rośnie z 0 na 1.',
        promptLamiacy: 'Po dodaniu produktu odświeżaj całą stronę.',
        oczekiwanie: 'licznik wraca do 0, test E3 czerwony.',
        pewniak: 'Po dodaniu produktu ustaw licznik koszyka na 0.' },
      { nazwa: 'Potwierdzenie pokazuje kwotę z rabatem', coSprawdza: '#kwota-potwierdzenie = doZaplaty z rabatem (221,40).',
        promptLamiacy: 'Na potwierdzeniu pokazuj zawsze sumę netto, bez rabatu i VAT.',
        oczekiwanie: 'kwota inna niż 221,40 zł, test E4 czerwony.',
        pewniak: 'Na potwierdzeniu pokaż zawsze 0 zł.' },
    ],
  },
  {
    id: 'snapshot', tytul: 'Regresja wizualna (snapshot)',
    coToPoco: 'Robi zrzut ekranu i porównuje z wzorcem - automat wykrywa, że coś się rozjechało wizualnie.',
    kreator: 'Dopisz test snapshot: wygląd elementu ___ ma zgadzać się z zatwierdzonym zrzutem.',
    karty: [
      { nazwa: 'Panel podsumowania zgodny ze zrzutem', coSprawdza: 'Wygląd #podsumowanie zgadza się z baseline.',
        promptLamiacy: 'Powiększ mocno sumę i zrób ją czerwoną, żeby rzucała się w oczy.',
        oczekiwanie: 'pixel diff, test V1 czerwony.',
        pewniak: 'Ukryj cały panel podsumowania (display:none).' },
    ],
  },
  {
    id: 'a11y', tytul: 'Dostępność (a11y)',
    coToPoco: 'Sprawdza, czy apka jest obsługiwalna dla wszystkich: etykiety przycisków, kontrast, klawiatura.',
    kreator: 'Dopisz test dostępności: element ___ ma mieć dostępną nazwę / wystarczający kontrast.',
    karty: [
      { nazwa: 'Przyciski "Dodaj" mają dostępną nazwę', coSprawdza: 'axe nie zgłasza button-name w #katalog.',
        promptLamiacy: 'Zamień przyciski "Dodaj do koszyka" na same ikony koszyka, bez tekstu - żeby było nowocześnie.',
        oczekiwanie: 'axe zgłasza button-name, test A1 czerwony.',
        pewniak: 'Usuń z przycisków "Dodaj" zarówno tekst, jak i atrybut aria-label - zostaw sam znak graficzny.' },
    ],
  },
  {
    id: 'reczne', tytul: 'Testy ręczne (twist)',
    coToPoco: 'To, czego żaden automat nie złapie. Zielone testy to nie to samo co dobry produkt - tu ocenia człowiek.',
    kreator: 'Dopisz pozycję checklisty ręcznej: sprawdź, czy ___ (PASS = spełnia, FAIL = nie).',
    karty: [
      { nazwa: 'Komunikat o dostawie zrozumiały (kwota + waluta)', coSprawdza: 'CZŁOWIEK: "Do darmowej dostawy brakuje 12,00 zł".',
        promptLamiacy: 'Skróć komunikat o darmowej dostawie do "Brakuje: 12".',
        oczekiwanie: 'Automaty ZIELONE, człowiek: FAIL (brak waluty, niejasne).',
        pewniak: 'Brak - to test ręczny, żaden automat go nie łapie. O to właśnie chodzi.' },
      { nazwa: 'Kolejność pól formularza naturalna', coSprawdza: 'CZŁOWIEK: imię -> e-mail -> adres.',
        promptLamiacy: 'Przenieś pole adres przed imię.',
        oczekiwanie: 'Działa, testy zielone, ale UX dziwny.',
        pewniak: 'Brak - ocena ludzka.' },
      { nazwa: 'Na telefonie (375px) nic nie wychodzi poza ekran', coSprawdza: 'CZŁOWIEK: layout mobilny nie przepełnia się.',
        promptLamiacy: 'Ustaw stałą szerokość koszyka 600 px.',
        oczekiwanie: 'Na telefonie layout wychodzi poza ekran; automat bez snapshotu mobilnego nie zgłasza.',
        pewniak: 'Brak - ocena ludzka.' },
    ],
  },
];
```

- [ ] **Step 2: Render sekcji i kart**

Dodaj funkcję renderującą - dla każdej sekcji nagłówek + opis + karty; każda karta ma:
- nazwę i "co sprawdza",
- przycisk "Kopiuj prompt łamiący" (kopiuje `promptLamiacy` do schowka przez `navigator.clipboard.writeText`),
- rozwijane "Spodziewaj się..." (`oczekiwanie`) - domyślnie zwinięte (`<details>`),
- rozwijany "Wariant-pewniak" (`pewniak`),
- przycisk "Kopiuj: przywróć do zielonego startu" (kopiuje `RESET`).

```js
function render() {
  const root = document.querySelector('#sekcje');
  for (const s of SEKCJE) {
    const sek = document.createElement('section');
    sek.className = 'sekcja reveal';
    sek.innerHTML = `<h2>${s.tytul}</h2><p>${s.coToPoco}</p>`;
    for (const k of s.karty) {
      const karta = document.createElement('div');
      karta.className = 'karta-testu';
      karta.innerHTML = `
        <h3>${k.nazwa}</h3>
        <p><em>Co sprawdza:</em> ${k.coSprawdza}</p>
        <button class="kopiuj" data-tekst="${encodeURIComponent(k.promptLamiacy)}">Kopiuj prompt łamiący</button>
        <details><summary>Spodziewaj się</summary><p>${k.oczekiwanie}</p></details>
        <details><summary>Wariant-pewniak (jeśli AI był ostrożny)</summary><p>${k.pewniak || 'brak'}</p></details>
        <button class="kopiuj" data-tekst="${encodeURIComponent(RESET)}">Kopiuj: przywróć do zielonego startu</button>
        <label class="postep"><input type="checkbox" data-klucz="${s.id}-${k.nazwa}"> zrobione</label>`;
      sek.appendChild(karta);
    }
    root.appendChild(sek);
  }
  podepnijKopiowanie();
  wczytajPostep();
}
```

- [ ] **Step 3: Kopiowanie, postęp (localStorage), reveal-on-scroll, kreator**

```js
function podepnijKopiowanie() {
  document.querySelectorAll('.kopiuj').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(decodeURIComponent(btn.dataset.tekst));
      const stary = btn.textContent;
      btn.textContent = 'Skopiowano!';
      setTimeout(() => { btn.textContent = stary; }, 1200);
    });
  });
}

function wczytajPostep() {
  document.querySelectorAll('.postep input').forEach((cb) => {
    cb.checked = localStorage.getItem(cb.dataset.klucz) === '1';
    cb.addEventListener('change', () => {
      localStorage.setItem(cb.dataset.klucz, cb.checked ? '1' : '0');
    });
  });
}
```

Kreator: pole tekstowe + przycisk "Zbuduj prompt", który skleja `Dopisz test: <tekst uczestnika>` i kopiuje do schowka. Reveal-on-scroll: `IntersectionObserver` dodający klasę `is-visible`, z guardem `prefers-reduced-motion`.

- [ ] **Step 4: Treść stała - Hero, "Po co testy", "Piramida i mapa", "Krok 0", "Złota zasada"**

Dodaj sekcje tekstowe wg sek. 7 specu. W "Krok 0" przycisk kopiuje `KROK0`. "Złota zasada": zielone testy to nie to samo co dobry produkt (puenta z sekcji ręcznej).

- [ ] **Step 5: Sprawdź ręcznie w przeglądarce**

Otwórz `Dzien12/index.html` bezpośrednio (plik lokalny). Expected: 7 sekcji renderuje się z danych; kopiowanie działa; checkboxy zapisują postęp po odświeżeniu; strona czyta się po polsku z pełnymi diakrytykami; brak długich myślników.

- [ ] **Step 6: Commit**

```bash
# z katalogu Dzien12
git add index.html
git commit -m "Dzien 12: workbook - strona-przewodnik po testach (7 sekcji, prompty, kreator)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 13: Domknięcie - test przepływu uczestnika i przegląd całości

Przypomnienie modelu git (Global Constraints): podczas budowy NIE tworzymy repo w `sklep/` - `sklep/` jest wersjonowany w repo `Dzien12/`. Flow uczestnika (`git init` + `git tag zielony-start`) testujemy na KOPII poza repo, żeby nie robić zagnieżdżonego repozytorium.

- [ ] **Step 1: Przetestuj Krok 0 uczestnika na kopii poza repo**

```bash
# skopiuj sklep bez node_modules i .git do katalogu tymczasowego POZA Dzien12
rm -rf /tmp/sklep-test && mkdir -p /tmp/sklep-test
git -C sklep archive --format=tar HEAD | tar -x -C /tmp/sklep-test   # bierze tylko śledzone pliki
cd /tmp/sklep-test && npm install && npx playwright install chromium
git init && git add -A && git commit -m "zielony start" && git tag zielony-start
npm test
```
Expected: `npm test` zielone; `git tag` pokazuje `zielony-start`. Potwierdza, że instrukcja z README działa. Katalog `/tmp/sklep-test` można potem usunąć.

- [ ] **Step 2: Przetestuj reset (symulacja jednego złamania) na tej kopii**

```bash
cd /tmp/sklep-test && rm -f src/ui.js   # symuluje "zepsucie"
npx vitest run --passWithNoTests; echo "---"
git reset --hard zielony-start && git clean -fd   # RESET jak w lekcji
npm test
```
Expected: po resecie apka wraca do stanu zielonego (`npm test` PASS), `git status` czysty.

- [ ] **Step 3: Finalny przegląd**

Sprawdź: `(cd sklep && npm test)` zielone; workbook `Dzien12/index.html` otwiera się i renderuje 7 sekcji; README prowadzi krok po kroku; dziennik weryfikacji promptów (Task 11) kompletny. Zapisz krótkie podsumowanie dla użytkownika (co powstało, jak uruchomić).

---

## Self-Review (wypełnione przy pisaniu planu)

- **Pokrycie specu:** sek. 3 struktura -> Task 1,5,6; sek. 4 reguły+algorytm -> Task 2 (testy U + przykłady A/B); sek. 5 mechanika/reset -> Task 10 README; sek. 6 zasada promptów -> Task 11 weryfikacja; sek. 7 struktura strony -> Task 12; sek. 8 bank -> Task 11 (weryfikacja) + Task 12 (dane); sek. 9 stack -> Task 1,6; sek. 10 kryteria -> Task 10,13; sek. 12 ryzyka -> Task 11 (weryfikacja), Task 10 (troubleshooting).
- **Placeholdery:** kod logiki, testów i UI jest kompletny. Task 12 (workbook) ma teraz PEŁNĄ tablicę `SEKCJE` (7 sekcji, wszystkie karty) - brama każe tylko zsynchronizować ją z wynikami weryfikacji z Task 11, jeśli coś się zmieni.
- **Spójność typów:** nazwy z `koszyk.js` (`sumaNetto`, `dostawa`, `rabat`, `vat`, `podsumowanie`, pola `doZaplaty/kwotaRabatu/rabatAktywny`) użyte spójnie w testach jednostkowych (Task 2), behawioralnych (Task 4) i UI (Task 5). Kontrakt DOM (id-y, w tym `#komunikat-rabat`, `#zloz-zamowienie`, `#potwierdzenie`) spójny między Task 5 a testami smoke/e2e/B3/snapshot/a11y (Task 7-9).
- **Model git:** rozstrzygnięty w Global Constraints - jedno repo `Dzien12/`, `sklep/` bez własnego `.git` podczas budowy, flow uczestnika testowany na kopii poza repo (Task 13). Reset wszędzie: `checkout -- . && git clean -fd`.
- **Po recenzji planu (Codex+Kimi):** dodano test smoke i B3, naprawiono prompt smoke (`ui.js`) i pewniak E1 (`#potwierdzenie`), pełne dane workbooka, komunikat "Rabat naliczony" w UI, `--passWithNoTests`, README "zapisz mój test".
```
