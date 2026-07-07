import { describe, it, expect } from 'vitest';
import {
  KATALOG, round2, sumaNetto, dostawa, rabat, vat, podsumowanie,
} from '../src/koszyk.js';
import { walidujEmail, walidujZamowienie } from '../src/walidacja.js';

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
