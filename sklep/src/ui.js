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
