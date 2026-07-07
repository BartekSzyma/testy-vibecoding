# Dziennik weryfikacji banku promptów łamiących (Zadanie 11)

Data przebiegu: 2026-07-08. Weryfikacja krok akceptacyjny dla sekcji 8 specu
`docs/superpowers/specs/2026-07-07-dzien12-testy-koszyk-design.md`. Każdy scenariusz
wykonany osobno w mikro-cyklu: zmiana -> uruchomienie właściwego zestawu testów ->
zapis komunikatu -> `git checkout -- . && git clean -fd` -> potwierdzenie czystego
drzewa przed kolejnym scenariuszem. Baseline: 30/30 testów zielonych (22 Vitest +
8 Playwright).

## Tabela wyników

| Scenariusz | Plik zmieniony | Test, który padł | Komunikat / obserwacja | Wariant |
|---|---|---|---|---|
| Smoke | `sklep/index.html` (ścieżka skryptu) | Playwright `smoke.spec.js` -> S1 | Oczekiwano 4 kart produktu, było 0 - moduł `src/ui-new.js` nie istnieje, katalog pozostaje pusty. | B |
| U1 (rabat ilościowy) | `sklep/src/koszyk.js` (`sumaNetto`) | Vitest `jednostkowe.test.js` -> U1 | Oczekiwano 75, było 67,5 - rabat 10% od 3 szt. tego samego produktu obniżył sumę. | B |
| U2 (VAT w dół) | `sklep/src/koszyk.js` (`vat`) | Vitest `jednostkowe.test.js` -> U2 | Oczekiwano 17,25, było 17 - VAT zaokrąglony w dół do pełnych złotych. | B |
| U3 (rabat 15%) | `sklep/src/koszyk.js` (`RABAT`) | Vitest `jednostkowe.test.js` -> U3 | Oczekiwano 10, było 15 - kod VIBE10 zmieniony z 10% na 15%. | A (prompt jest kategorii A, bez wariantu B) |
| U4 (null zamiast 0) | `sklep/src/koszyk.js` (`sumaNetto`) | Vitest `jednostkowe.test.js` -> U4 | Oczekiwano 0, było `null` - pusty koszyk zwraca `null` zamiast liczby 0. | B |
| U5 (VAT 20%) | `sklep/src/koszyk.js` (`STAWKA_VAT`) | Vitest `jednostkowe.test.js` -> U5 | Oczekiwano 6,90, było 6 - stawka VAT zmieniona z 23% na 20%. | B |
| B1 (próg dostawy) | `sklep/src/koszyk.js` (`dostawa`) | Vitest `behawioralne.test.js` -> B1 (próg 200) | Oczekiwano 0 (darmowa dostawa), było 15 - próg zmieniony z `>=` na `>`, więc dokładnie 200 zł netto już się nie kwalifikuje. | A |
| B2 (VIBE10 dla pustego koszyka) | `sklep/src/koszyk.js` (`rabat` / `rabatAktywny`) | Vitest `behawioralne.test.js` -> B2 | Pierwsza próba (B: usunięcie warunku `sumaNettoTowarow > 0` tylko w funkcji `rabat()`) zostawiła test **ZIELONY** - 10% z 0 zł to nadal 0, a flaga `rabatAktywny` liczona jest osobno w `podsumowanie()` i nie zależy od zmiany w `rabat()`. Dopiero A-pewniak (usunięcie warunku `netto > 0` z samej flagi `rabatAktywny`) dał czerwień: oczekiwano `false`, było `true`. | **wymaga pewniaka (A)** |
| B3 (przycisk zawsze aktywny) | `sklep/src/ui.js` (`disabled`) | Playwright `e2e.spec.js` -> B3 | Oczekiwano `disabled`, było `enabled` - przycisk "Złóż zamówienie" ustawiony na zawsze aktywny. | A |
| B4 (rabat z dostawą) | `sklep/src/koszyk.js` (`podsumowanie` - podstawa rabatu) | Vitest `jednostkowe.test.js` i `behawioralne.test.js` -> B4 | Oczekiwano rabatu 10, było 11,5 - rabat liczony od netto+dostawa (115) zamiast od samego netto (100). | B |
| E1 (brak potwierdzenia) | `sklep/src/ui.js` (`zlozZamowienie`) | Playwright `e2e.spec.js` -> E1 | Oczekiwano widocznego `#potwierdzenie`, było `hidden` - po złożeniu zamówienia koszyk jest czyszczony zamiast pokazania ekranu potwierdzenia. | B |
| E2 (usunięta walidacja e-maila) | `sklep/src/walidacja.js` (`walidujEmail`) | Playwright `e2e.spec.js` -> E2 | Oczekiwano `#potwierdzenie` ukryte po złym mailu, było widoczne - walidacja przyjmuje dowolny tekst. | A |
| E3 (reload po dodaniu) | `sklep/src/ui.js` (`dodaj`) | Playwright `e2e.spec.js` -> E3 | Oczekiwano licznika "1", było "0" - `location.reload()` po dodaniu produktu czyści stan koszyka. | B |
| E4 (kwota bazowa na potwierdzeniu) | `sklep/src/ui.js` (`zlozZamowienie` - `#kwota-potwierdzenie`) | Playwright `e2e.spec.js` -> E4 | Oczekiwano "221,40 zł", było "200,00 zł" - potwierdzenie pokazuje `sumaNetto` zamiast `doZaplaty` (bez rabatu i VAT). | B |
| V1 (powiększona suma) | `sklep/index.html` (`#kwota-do-zaplaty` CSS) | Playwright `snapshot.spec.js` -> V1 | Rozmiar obrazu 374x392 vs 374x426 - powiększona i zaczerwieniona kwota zmienia wysokość panelu, różnica pikseli ponad dopuszczalny próg. | B |
| A1 (ikony bez tekstu) | `sklep/src/ui.js` (przycisk "Dodaj do koszyka") | Playwright `dostepnosc.spec.js` -> A1 | Pierwsza próba (B: emoji 🛒 jako `textContent` + zachowany `aria-label`) zostawiła test **ZIELONY** - emoji to nadal tekst, axe liczy go jako nazwę dostępną. Dopiero A-pewniak (prawdziwa ikona SVG bez tekstu i bez `aria-label`) dał czerwień: axe zgłosił naruszenie `button-name` (impact: critical). | **wymaga pewniaka (A)** - patrz uwaga niżej |
| M1 (skrócony komunikat) | `sklep/src/ui.js` (`komunikat-dostawa`) | Ręczny - **automaty zielone (30/30)** | Komunikat skrócony do "Brakuje: 12" (brak waluty, niejasna forma) - żaden automat nie sprawdza treści tego komunikatu, więc suita przechodzi; człowiek: FAIL (niejasny komunikat). | B |
| M2 (kolejność pól) | `sklep/index.html` (formularz zamówienia) | Ręczny - **automaty zielone (30/30)** | Pole adres przeniesione przed imię - testy operują po ID/selektorach, nie po kolejności wizualnej, więc przechodzą; człowiek: FAIL (kolejność nienaturalna: adres -> imię -> e-mail). | B |
| M3 (stała szerokość 600px) | `sklep/index.html` (`#podsumowanie` CSS) | **Niezgodne z założeniem banku** - test V1 (snapshot) też się czerwieni | Patrz uwaga niżej - to jest zgłoszony defekt banku, nie potwierdzenie założenia "automaty zielone". | B - **DEFEKT BANKU** |

## Uwagi i ustalenia wymagające korekty banku/specu

### 1. B2 i A1 - realny scenariusz "prompt B zbyt ostrożny", zgodnie z przewidywaniem specu

Dla obu scenariuszy najpierw honestnie zasymulowano najbardziej prawdopodobną, "wąską"
interpretację prompta (B), a dopiero po potwierdzeniu, że test zostaje zielony,
zastosowano A-pewniak:

- **B2**: modyfikacja samej funkcji `rabat()` (usunięcie warunku niepustego koszyka)
  nie rusza osobno liczonej flagi `rabatAktywny` w `podsumowanie()` - test `behawioralne.test.js`
  sprawdza właśnie tę flagę i zostaje zielony. To dokładnie potwierdza uwagę ze specu
  (sek. 8): "test sprawdza flagę/komunikat, nie samą kwotę". Wniosek: bank poprawnie
  przewidział to ryzyko i poprawnie dostarczył A-pewniak - nie wymaga zmian, ale warto
  podkreślić w materiałach, że to jest **spodziewany** przypadek "AI był ostrożny".
- **A1**: zamiana tekstu przycisku na sam emoji (🛒) **nie łamie** testu a11y, bo emoji
  to wciąż węzeł tekstowy z niepustą treścią - axe liczy go jako poprawną nazwę dostępną
  przycisku. Dopiero usunięcie WSZELKIEGO tekstu (prawdziwa ikona SVG bez tytułu i bez
  `aria-label`) daje czerwień. **Rekomendacja drobnej korekty specu**: dopisać w sek. 8
  przy A1 wprost, że nawet "goły znak graficzny" w formie emoji/tekstu unicode NIE
  wystarczy do złamania testu - pewniak musi używać elementu bez żadnej treści tekstowej
  (SVG/ikona CSS), inaczej uczestnik może się zdziwić, że nawet A-pewniak wychodzi zielono,
  jeśli AI zinterpretuje "sam znak graficzny" jako emoji.

### 2. M3 - defekt banku: automaty NIE zostają zielone

Spec (sek. 8) zakłada, że zmiana "Ustaw stałą szerokość koszyka 600 px" złapie tylko
człowiek na ekranie 375 px, bo "żaden automat (bez snapshotu mobilnego) tego nie zgłasza".
Weryfikacja pokazuje, że to założenie jest **błędne** dla literalnej realizacji prompta:

- Panel `#podsumowanie` jest dokładnie tym elementem, który obejmuje istniejący test
  wizualny V1 (`snapshot.spec.js`, viewport desktopowy 1000x800, bez symulacji telefonu).
- Zmiana z `max-width: 340px` na stałe `width: 600px` zmienia rzeczywisty renderowany
  rozmiar panelu (baseline: 374x392 px -> po zmianie: 634x346 px). Playwright
  `toHaveScreenshot` rzuca twardy błąd przy jakiejkolwiek różnicy wymiarów obrazu,
  niezależnie od progu `maxDiffPixelRatio` i niezależnie od viewportu telefonu.
- Innymi słowy: **każda** zmiana szerokości `#podsumowanie` (większa lub mniejsza niż
  obecna) automatycznie czerwieni V1 na desktopie - nie trzeba w ogóle otwierać strony
  na telefonie, żeby to zauważyć automatem. Zamierzony "twist" (że tylko człowiek to
  złapie) nie działa dla tego konkretnego celu zmiany, bo cel (`#podsumowanie`) pokrywa
  się z elementem objętym już istniejącym testem regresji wizualnej.

**Rekomendacja korekty specu**: zmienić cel scenariusza M3 tak, by nie dotykał
`#podsumowanie` (jedynego elementu ze snapshotem) - np. przenieść na szerokość/układ
`#katalog` (nieobjęty żadnym snapshotem) albo na cały `<body>`/wrapper strony, albo
dodać w prompcie zastrzeżenie "zmień tylko przez media query dla wąskich ekranów, nie
ruszając desktopowego wyglądu panelu podsumowania". Bez takiej korekty M3 w obecnym
brzmieniu nie ilustruje zamierzonej lekcji "zielone testy to nie to samo co dobry
produkt" - bo w praktyce test akurat się czerwieni, tylko nie z powodu, o który chodziło
(nie z powodu telefonu, tylko przypadkowej kolizji z istniejącym testem wizualnym).

## Podsumowanie liczbowe

- Scenariuszy zweryfikowanych realnym przebiegiem: 19 (Smoke, U1-U5, B1-B4, E1-E4, V1,
  A1, M1-M3).
- Poprawnie czerwienią się od razu (B lub A): 15.
- Wymagały A-pewniaka (B zbyt ostrożny, zgodnie z przewidywaniem specu): 2 (B2, A1).
- Ręczne, automaty poprawnie zielone: 2 (M1, M2).
- Defekt banku (automaty NIE zostały zielone wbrew założeniu): 1 (M3).

## Stan końcowy

Po ostatnim scenariuszu drzewo robocze `sklep/` przywrócone do stanu wyjściowego
(`git checkout -- . && git clean -fd`), `git status` w `sklep/` czysty, pełny zestaw
`npm test` zielony: 30/30 (22 Vitest + 8 Playwright).
