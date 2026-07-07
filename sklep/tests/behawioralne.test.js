import { describe, it, expect } from 'vitest';
import { podsumowanie } from '../src/koszyk.js';

describe('B1: darmowa dostawa od progu 200 zł netto', () => {
  it('mając koszyk 200 zł netto (5 x Plakat), gdy liczę dostawę, wtedy jest darmowa', () => {
    const p = podsumowanie([{ id: 'plakat', ilosc: 5 }], '');
    expect(p.netto).toBe(200);
    expect(p.kosztDostawy).toBe(0);
  });
  it('mając koszyk 190 zł netto (4×Plakat + 3×Naklejka), gdy liczę dostawę, wtedy płacę 15 zł', () => {
    const p = podsumowanie([{ id: 'plakat', ilosc: 4 }, { id: 'naklejka', ilosc: 3 }], '');
    expect(p.netto).toBe(190);
    expect(p.kosztDostawy).toBe(15);
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
