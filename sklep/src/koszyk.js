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
