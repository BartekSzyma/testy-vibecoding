# Dzień 12 - Testy i testowanie w vibecodingu (projekt materiałów)

Data: 2026-07-07
Status: projekt do przeglądu (po zewnętrznej recenzji spec: Codex + Kimi, patch naniesiony)

## 1. Cel i odbiorca

Materiał dydaktyczny na Dzień 12 kursu "ALX vibecoding". Uczy **testowania** osoby, które
programują wyłącznie przez rozmowę z narzędziem AI (Claude Code, Codex) i **nie dotykają kodu
ani IDE**. Odbiorca to początkujący, dla którego test to nowe pojęcie.

Główny przekaz: skoro nie czytasz kodu, testy są twoimi oczami. Każda zmiana wprowadzana przez
AI to potencjalna, niezamierzona regresja - testy wychwytują ją, zanim trafi do użytkownika.

Umiejętność do wyćwiczenia: **definiowanie testu słowami** (naturalnym językiem opisujesz, co
ma być prawdą), które AI zamienia na kod testu. Nie uczymy pisania kodu testów ręcznie.

## 2. Podejście

Hybryda "workbook prowadzi, apka w tle":

- **Strona HTML (workbook)** - samodzielny przewodnik w stylu kursu (retro/neon, przewijane
  sekcje). Tłumaczy typy testów, daje bibliotekę promptów do skopiowania i pokazuje, czego
  oczekiwać. Strona niczego realnie nie uruchamia.
- **Realna mini-apka (koszyk) z prawdziwym zestawem testów** - uczestnik faktycznie ją łamie w
  swoim narzędziu AI i widzi prawdziwy czerwony/zielony wynik. To daje autentyczny dreszcz
  "gdybym nie miał testu, wypuściłbym to".

Odrzucone warianty: samo README bez strony (łamie konwencję kursu, mniej angażujące); strona z
żywym podglądem apki w iframe i realnym statusem testów (kruche, przeinżynierowane dla
nie-kodera).

## 3. Struktura plików (co powstaje w `Dzien12/`)

```
Dzien12/
  index.html            <- WORKBOOK: strona-przewodnik (cała lekcja, biblioteka promptów)
  sklep/                <- PRAWDZIWA apka, na której uczestnik pracuje
    index.html          <- UI koszyka (otwierany w przeglądarce)
    src/
      koszyk.js         <- logika: suma, VAT, rabat, dostawa
      walidacja.js      <- walidacja formularza zamówienia
    tests/
      jednostkowe.test.js
      behawioralne.test.js
      e2e.spec.js       <- Playwright
      snapshot.spec.js  <- regresja wizualna
      dostepnosc.spec.js
      snapshot.spec.js-snapshots/  <- baseline zrzutów, COMMITOWANY (nie ignorowany)
    package.json
    playwright.config.js
    vitest.config.js    <- environment: 'jsdom', globals: true (dla logiki + DOM)
    .gitignore          <- node_modules/, test-results/, playwright-report/ (NIE snapshoty)
    README.md           <- "Krok 0": co dokładnie powiedzieć Claude Code, by odpalić
```

`.gitignore` jest warunkiem bezpieczeństwa dla resetu: bez niego `git clean -fd` (patrz sek. 5)
skasowałby `node_modules`, wymuszając ponowną instalację. Baseline zrzutów Playwright jest
świadomie **poza** `.gitignore` - musi być w repo, żeby pierwszy przebieg był zielony.

Workbook jest w pełni samodzielny i niezależny od `sklep/`. Gdy uczestnik zepsuje apkę,
przewodnik dalej działa.

## 4. Specyfikacja apki-koszyka (cele, w które celują testy)

Katalog (stały): Kubek 25 zł, Koszulka 60 zł, Plakat 40 zł, Naklejka 10 zł. Ceny netto.

Reguły biznesowe (celowo bogate, by dało się je testować i łamać):

- **Suma pozycji** = cena netto × ilość, sumowane po całym koszyku -> `sumaNetto`.
- **Rabat**: kod `VIBE10` = -10% od `sumaNetto` towarów; działa tylko przy niepustym koszyku;
  nie obejmuje kosztu dostawy.
- **VAT 23%** doliczany do sumy netto **po rabacie**. Koszyk pokazuje: netto, rabat, kwotę VAT,
  brutto (zaokrąglenie do groszy - idealny cel testu jednostkowego).
- **Darmowa dostawa**: dostawa 15 zł, darmowa gdy `sumaNetto` **≥ 200 zł** (próg na wartości
  netto towarów, liczony **przed** rabatem - rabat nie odbiera prawa do darmowej dostawy).
  Uwaga: próg 200 jest **osiągalny z katalogu przy całkowitych ilościach** (np. 5×Plakat = 200
  netto), więc test brzegowy 190 vs 200 da się zbudować z prawdziwych produktów w UI (e2e).
- **Pusty koszyk**: przycisk "Złóż zamówienie" nieaktywny.
- **Checkout**: formularz (imię, e-mail, adres) z walidacją (pola wymagane, e-mail musi
  zawierać `@`). Po złożeniu -> ekran potwierdzenia z numerem zamówienia i kwotą.

### Algorytm podsumowania (jednoznaczna kolejność - wiążący dla testów)

1. `sumaNetto` = Σ (cena_netto × ilość).
2. `dostawa` = (`sumaNetto` ≥ 200) ? 0 : 15. **Próg sprawdzany na `sumaNetto`, przed rabatem.**
3. `rabat` = (kod == "VIBE10" i `sumaNetto` > 0) ? round2(0,10 × `sumaNetto`) : 0.
4. `nettoPoRabacie` = `sumaNetto` - `rabat`.
5. `vat` = round2(0,23 × `nettoPoRabacie`).
6. `bruttoTowarow` = `nettoPoRabacie` + `vat`.
7. `doZaplaty` = `bruttoTowarow` + `dostawa`.

Zaokrąglanie: `round2` = do 2 miejsc (grosze), pół w górę; stosowane na `rabat`, `vat` i kwotach
prezentowanych. Wartości pośrednie trzymane dokładnie do momentu round2.

Przykład A (bez kodu, poniżej progu): 2×Plakat + 1×Kubek = 80 + 25 = **105** netto.
dostawa 15 (105 < 200); rabat 0; vat = round2(0,23×105) = 24,15; brutto 129,15; **doZaplaty 144,15**.

Przykład B (kod VIBE10, dokładnie na progu): 5×Plakat = **200** netto.
dostawa **0** (200 ≥ 200, liczone przed rabatem); rabat 20,00; nettoPoRabacie 180,00;
vat = 41,40; brutto 221,40; **doZaplaty 221,40**. (Pokazuje, że rabat nie odbiera darmowej dostawy.)

Powiązanie reguł z typami testów: liczby -> jednostkowe; reguły (próg, rabat, pusty koszyk) ->
behawioralne; przepływ dodaj -> zamów -> potwierdzenie -> e2e; wygląd podsumowania -> snapshot;
etykiety/klawiatura/kontrast -> a11y; zrozumiałość komunikatów i layout -> ręczne; "czy w ogóle
się ładuje" -> smoke.

## 5. Mechanika lekcji

### Krok 0 - przygotowanie (raz)

Uczestnik otwiera folder `sklep/` w Claude Code i mówi:
> "Przeczytaj README, przygotuj projekt: zainstaluj zależności, uruchom testy i pokaż, że
> wszystkie są zielone."

Claude Code wykonuje kolejno: `npm install`, `npx playwright install`, wygenerowanie/commit
baseline zrzutów snapshot (patrz niżej), `npm test`, a następnie zapisuje baseline jako commit
git **z tagiem**: `git init` -> `git add -A` -> `git commit -m "zielony start"` ->
`git tag zielony-start`. Uczestnik widzi zielony baseline. Sedno vibecodingu: całą obsługę
techniczną załatwiasz rozmową z AI.

Baseline snapshotów: Playwright `toHaveScreenshot` bez istniejącego zrzutu **domyślnie kończy
się czerwono**. Dlatego materiały dostarczamy z baseline już **zacommitowanym** w
`tests/*-snapshots/` (wygenerowanym na etapie budowy materiałów), a w `playwright.config.js`
ustawiamy `updateSnapshots: 'missing'`. Dzięki temu pierwszy `npm test` u uczestnika jest
zielony, a snapshot czerwieni się dopiero po realnej zmianie wyglądu.

Założenie środowiskowe: Node.js jest zainstalowany (spójne z wcześniejszymi dniami kursu, np.
Dzień 5). README wprost to sprawdza jako pierwszy krok i zawiera sekcję troubleshooting
(sprawdzenie wersji Node, ręczna instalacja przeglądarek Playwright, `PLAYWRIGHT_BROWSERS_PATH`,
uwaga że prowadzący pomaga przy problemach środowiskowych).

### Pętla jednej sekcji (powtarzana przy każdym teście)

1. Przeczytaj koncept na stronie - co to za typ testu i po co.
2. Poznaj gotowy test - opisany po ludzku + jedno zdanie "co sprawdza".
3. Skopiuj PROMPT ŁAMIĄCY do Claude Code -> AI zmienia apkę.
4. Powiedz "uruchom testy" -> CZERWONY. Moment "aha".
5. Przeczytaj komunikat testu - nauka czytania wyniku (oczekiwano X, było Y).
6. PRZYWRÓĆ apkę do zielonego (reset - patrz niżej).
7. Twój ruch - ułóż własny test słowami wg szablonu, poproś Claude Code, by go dopisał,
   uruchom -> zielony. Ten test jest **świadomie jednorazowy** (ćwiczenie formułowania). Jeśli
   uczestnik chce go zachować, przed przejściem dalej mówi: *"zapisz mój test"* -> Claude Code
   robi `git add -A && git commit -m "moj-test-sekcja-X"`. Wtedy staje się częścią historii i
   kolejny reset go nie skasuje.

### Reset / przywracanie

Baseline to otagowany commit `zielony-start` z Kroku 0. Po każdym złamaniu uczestnik mówi:
> "przywróć apkę do zielonego startu"

Pod spodem: `git reset --hard zielony-start && git clean -fd`. Sam `git restore .` **nie
wystarcza** - nie usuwa nowych plików, które prompt łamiący mógł utworzyć (np. `koszyk-new.js`
ze smoke), a te psułyby kolejne iteracje. `git clean -fd` usuwa te pliki, a dzięki `.gitignore`
(sek. 3) **nie** rusza `node_modules` ani raportów. Uwaga na interakcję z krokiem 7: jeśli
uczestnik zacommitował własny test, `reset --hard zielony-start` cofnąłby też ten commit -
dlatego "zapisany" test przenosimy jako osobny commit **na** baseline, a reset kieruje się do
tagu tylko wtedy, gdy chcemy w pełni czysty start; do zwykłego "cofnij psucie" wystarczy powrót
do ostatniego zielonego commita. Reużywamy git z Dnia 3 - kotwica jest niezawodna. Wariant
"cofnij ostatnią zmianę" bywa zawodny.

## 6. Zasada projektowania promptów łamiących (sedno)

Pułapka: jeśli prompt jest "niewinny" i liczymy, że AI *przypadkiem* wprowadzi błąd, dobre AI
może zrobić zmianę poprawnie -> test zostaje zielony -> ćwiczenie się nie udaje. Prompty muszą
łamać **niezawodnie**. Dwie pewne kategorie:

- **(A) Zmiana ustalonej reguły** - prompt wprost prosi o zmianę zachowania, które test koduje.
  Zawsze czerwony. Uczy: test jest strażnikiem uzgodnionego zachowania. Zmiana zamierzona ->
  aktualizujesz test razem z AI; niezamierzona -> test cię uratował.
- **(B) Ukryty efekt uboczny** - prawdopodobna zmiana w miejscu X psuje miejsce Y. Większe
  "wow", mniej gwarantowane.

**Siatka bezpieczeństwa (wiążąca dla implementacji):** dla każdego ćwiczenia dokumentujemy,
który test ma się zaczerwienić. **Każdy prompt kategorii (B) w banku (sek. 8) MUSI mieć obok
dopisany wariant-pewniak kategorii (A)** - bez wyjątku. Jeśli AI wyjątkowo zrobi zmianę
bezpiecznie (zielono), to też lekcja ("AI był ostrożny, brawo - ale nie licz na to zawsze") i
uczestnik sięga po pewniak. Dodatkowa reguła wykryta w recenzji: **prompt jednostkowy musi
celować w funkcję domenową** (`suma`, `vat`, `rabat`, `dostawa`), nie w warstwę prezentacji -
inaczej Vitest importujący czystą logikę zostanie zielony mimo "zepsutego" UI. Prompty czysto
wizualne należą do sekcji e2e/snapshot, nie jednostkowej.

**Gradient trudności** przez 7 sekcji: smoke (oczywisty biały ekran) -> jednostkowe (subtelne
zaokrąglenie) -> behawioralne (próg `>` vs `>=`) -> e2e (rwie się przepływ) -> snapshot
(rozjechany układ) -> a11y (znika etykieta) -> ręczne (twist: tego żaden automat nie złapie).

## 7. Struktura strony HTML (workbook)

Styl spójny z kursem: retro/neon, pixel font (Pixelify Sans), przewijane sekcje pełnej
wysokości, reveal-on-scroll, przyciski "kopiuj", `prefers-reduced-motion`. Polski, pełne
diakrytyki, tylko dywiz `-` (bez em/en dash).

Układ strony:

1. **Hero** - "Dzień 12: Testy - twoja siatka bezpieczeństwa w vibecodingu."
2. **Po co testy, skoro nie patrzysz na kod** - główny argument.
3. **Piramida i mapa testów** - wizual porządkujący 7 typów: klasyczna piramida (dużo tanich
   jednostkowych na dole, mniej behawioralnych, mało drogich e2e na górze), a obok/z boku testy,
   które nie leżą na osi "tanie-drogie": snapshot, a11y i **ręczne**. Nazwa wprost mówi, że to
   rozszerzona piramida kursu, żeby 7 kategorii nie myliło z klasycznymi 3 poziomami.
4. **Krok 0 - przygotuj poligon** - instrukcja z przyciskiem kopiuj.
5. **7 sekcji testów** - jednolita anatomia (niżej).
6. **Złota zasada + checklist + co dalej.**

Anatomia jednej sekcji testu:

- Nagłówek + jedno zdanie "co to i po co" + "kiedy używać".
- Karty testów (3-5 dla trzonu, 1-2 dla dodatków). Każda karta:
  - Nazwa po ludzku (np. "Suma 3 kubków = 75 zł netto").
  - "Co sprawdza" (asercja zdaniem).
  - `[Kopiuj prompt łamiący]`.
  - "Spodziewaj się: test X czerwony, bo..." (rozwijane - najpierw uczestnik zgaduje).
  - `[Kopiuj: przywróć do zielonego startu]`.
- Kreator własnego testu na końcu sekcji: szablon z lukami (behawioralne: *mając ___ / gdy ___ /
  wtedy ___*; jednostkowe: *dla wejścia ___ wynik = ___*), pole tekstowe, `[Zbuduj prompt]`
  skleja gotowe "Dopisz test: ..." do skopiowania.
- Checkbox postępu na sekcję (localStorage).

## 8. Treść 7 sekcji (bank scenariuszy)

Trzon (sekcje 2-4, 7): pełne 3-5 scenariuszy. Dodatki (1, 5, 6): 1-2 mocne scenariusze, by nie
przytłoczyć. Poniżej bank do doszlifowania w implementacji. Konwencja: **(B)** = prompt-efekt
uboczny, **(A-pewniak)** = wariant gwarantujący czerwony, jeśli (B) okaże się zbyt ostrożny.
Wymóg z sek. 6: każdy (B) ma dopisany (A-pewniak); prompty jednostkowe ruszają funkcje domenowe.

Warunek konstrukcyjny apki: **katalog produktów jest renderowany przez JS** (`src/koszyk.js`
wstawia produkty do kontenera `<div id="katalog">`), nie wpisany statycznie w HTML. Bez tego
smoke i część e2e nie dałyby się wiarygodnie złamać.

### Sekcja 1 - Smoke (rozgrzewka)
- Test: "Strona ładuje się, renderuje 4 produkty i konsola nie zgłasza błędu." (asercja: widoczne
  4 karty produktu + brak `pageerror`).
- (B): "Zmień w index.html ścieżkę skryptu z `src/ui.js` na `src/ui-new.js`." -> moduł
  się nie ładuje, katalog pusty. (Uwaga: index.html ładuje `src/ui.js`, nie `koszyk.js`.)
- (A-pewniak): "Usuń z index.html kontener katalogu `<div id='katalog'>`." -> renderer nie ma
  gdzie wstawić produktów, test na 4 karty zawsze czerwony.

### Sekcja 2 - Jednostkowe (3-5) - wszystkie prompty ruszają funkcje domenowe
- U1: "3 × Kubek = 75 zł netto." (B): "Dodaj rabat ilościowy: przy 3+ szt. tego samego produktu
  licz pozycję 10% taniej." -> `suma` zwraca 67,50 zamiast 75. (A-pewniak): "W funkcji sumy
  pozycji dodawaj cenę i ilość zamiast mnożyć." -> 25+3=28 ≠ 75.
- U2: "VAT 23% z 75 netto = 17,25; brutto = 92,25." (B): "Zaokrąglaj kwotę VAT w dół do pełnych
  złotych, żeby ceny ładniej wyglądały." -> oczekiwano 92,25, było 92,00.
- U3: "Kod VIBE10 daje -10% od netto: 100 zł -> rabat 10 zł." (A): "Zmień rabat VIBE10 z 10% na
  15%." -> oczekiwano rabat 10, było 15.
- U4: "Pusty koszyk: `suma()` zwraca liczbę 0." (B): "Gdy koszyk jest pusty, niech funkcja sumy
  zwraca `null` zamiast 0." -> test `typeof suma() === 'number'` / `=== 0` czerwony. (A-pewniak):
  "Niech `suma()` dla pustego koszyka rzuca wyjątek." -> test pada twardo.
- U5: "3 × Naklejka = 30 netto, VAT = 6,90." (B): "Licz VAT jako 20% zamiast 23%, bo to
  prostsze." -> oczekiwano 6,90, było 6,00.

### Sekcja 3 - Behawioralne (BDD, given/when/then, 3-5)
- B1: "Mając koszyk 5×Plakat = **200 zł netto**, gdy liczę dostawę, wtedy jest darmowa (0 zł)."
  (A): "Zmień zasadę: darmowa dostawa dopiero powyżej 200 zł, nie od 200." -> `>` zamiast `>=`,
  czerwony dokładnie na progu 200 (koszyk buduje się z realnych produktów).
- B2: "Mając pusty koszyk, gdy wpisuję kod VIBE10, wtedy rabat NIE jest aktywny (brak komunikatu
  'Rabat naliczony')." (B): "Aktywuj kod VIBE10 także dla pustego koszyka i pokazuj komunikat
  'Rabat naliczony'." -> flaga/komunikat rabatu pojawia się mimo pustego koszyka. (A-pewniak):
  "Usuń warunek niepustego koszyka - VIBE10 zawsze ustawia flagę rabatu na true." (Test sprawdza
  flagę/komunikat, nie samą kwotę - bo 10% z 0 = 0 nie złapałoby zmiany.)
- B3: "Mając pusty koszyk, gdy patrzę na przycisk zamówienia, wtedy jest nieaktywny." (A): "Niech
  przycisk 'Złóż zamówienie' będzie zawsze aktywny."
- B4: "Mając koszyk 100 zł netto + dostawa 15 zł, gdy stosuję VIBE10, wtedy rabat = 10 (od 100),
  nie 11,50 (od 115)." (B): "Licz rabat od całej kwoty razem z dostawą." (A-pewniak): "Do
  podstawy rabatu VIBE10 dolicz koszt dostawy."

### Sekcja 4 - E2E w Playwright (3-5)
- E1: "Dodaj 2 produkty -> dane -> Złóż zamówienie -> **ekran potwierdzenia z numerem**." (B,
  psuje faktyczny przepływ): "Po kliknięciu 'Złóż zamówienie' nie pokazuj ekranu potwierdzenia,
  tylko wyczyść koszyk." -> e2e nie znajduje numeru zamówienia, przepływ się rwie. (A-pewniak):
  "Ustaw ekran potwierdzenia `#potwierdzenie` na stałe ukryty (`display:none`)." -> test na
  widoczne potwierdzenie zawsze czerwony. (Uwaga: zmiana samej etykiety przycisku NIE złamie
  testu, bo test klika po `#zloz-zamowienie` (id), a nie po tekście.)
- E2: "E-mail bez znaku @ blokuje złożenie zamówienia." (A): "Usuń walidację e-maila, przyjmuj
  dowolny tekst."
- E3: "Po dodaniu produktu licznik koszyka rośnie o 1." (B): "Po dodaniu produktu odświeżaj całą
  stronę." -> koszyk się czyści, e2e widzi 0. (A-pewniak): "Po dodaniu produktu ustaw licznik
  koszyka na 0."
- E4: "Ekran potwierdzenia pokazuje kwotę z rabatem." (B): "Na potwierdzeniu pokazuj zawsze
  `sumaNetto`, bez rabatu i VAT." (A-pewniak): "Na potwierdzeniu pokaż zawsze kwotę 0 zł."

### Sekcja 5 - Regresja wizualna / snapshot (1-2)
- V1: "Panel podsumowania zgadza się z zatwierdzonym zrzutem." (B): "Powiększ mocno sumę i zrób
  ją czerwoną, żeby rzucała się w oczy." -> pixel diff, czerwony. (A-pewniak): "Ukryj cały panel
  podsumowania (`display:none`)."
- (opc) V2: "Układ katalogu (siatka) zgodny ze zrzutem." (B): "Ustaw katalog w jednej kolumnie
  zamiast siatki."

### Sekcja 6 - Dostępność / a11y (1-2)
- A1: "Każdy przycisk 'Dodaj do koszyka' ma dostępną nazwę." (B): "Zamień przyciski 'Dodaj do
  koszyka' na same ikony koszyka, bez tekstu - żeby było nowocześnie." (A-pewniak, bo AI często
  samo doda `aria-label`): "Usuń z przycisków 'Dodaj' tekst i atrybut `aria-label`, a w środku
  wstaw ikonę `<svg>` bez żadnego tekstu i bez `aria-label`." -> przycisk nie ma dostępnej nazwy,
  axe zgłasza `button-name`, test czerwony. **Uwaga (zweryfikowane w Task 11):** samo emoji jako
  "znak graficzny" NIE wystarcza - axe traktuje znak emoji jak dostępny tekst i test zostaje
  zielony; dlatego pewniak wymaga `<svg>` bez tekstu.
- (opc) A2: "Cena ma wystarczający kontrast." (B): "Zrób ceny jasnoszare na białym tle,
  elegancko." (A-pewniak): "Ustaw kolor cen na `#eeeeee` na białym tle." -> axe `color-contrast`.

### Sekcja 7 - Ręczne (twist) - checklista człowieka z jawnymi kryteriami PASS/FAIL
Trzy konkretne pozycje do zaznaczenia (PASS = spełnia, FAIL = nie):
- M1: "Komunikat o darmowej dostawie podaje **dokładną brakującą kwotę i walutę** (np. 'Do
  darmowej dostawy brakuje 12,00 zł')." Łamiący (B): "Skróć komunikat o darmowej dostawie do
  'Brakuje: 12'." -> automaty ZIELONE, człowiek: FAIL (brak waluty, niejasne).
- M2: "Kolejność pól formularza jest naturalna: imię -> e-mail -> adres." Łamiący (B): "Przenieś
  pole adres przed imię." -> działa, testy zielone, UX dziwny.
- M3: "Na ekranie szerokości telefonu (375 px) katalog i koszyk nie nachodzą na siebie i nic nie
  wychodzi poza ekran." Łamiący (B): "Dodaj styl tylko dla telefonów - w media query
  `max-width: 480px` ustaw `#podsumowanie` na stałą szerokość 600 px." -> na telefonie panel
  wychodzi poza ekran; snapshot V1 (viewport 1000 px) i reszta automatów pozostają ZIELONE, bo
  reguła nie działa na desktopie. **Uwaga (zweryfikowane w Task 11):** prosta "stała szerokość
  600 px" bez media query psuje też snapshot V1, bo `#podsumowanie` jest pod jego pokryciem -
  dlatego zmiana MUSI być ograniczona do media query telefonu, inaczej scenariusz przestaje być
  "tylko dla człowieka".

Puenta sekcji 7 (i całej strony): zielone testy to nie to samo co dobry produkt. Są rzeczy,
których dopilnuje tylko człowiek.

## 9. Stack techniczny

- Apka: czysty HTML + JS (ES modules), bez frameworka i bez kroku build. Katalog renderowany
  przez JS (warunek z sek. 8).
- Testy jednostkowe i behawioralne: **Vitest** z `vitest.config.js` (`environment: 'jsdom'`,
  `globals: true`) - potrzebne, bo logika importuje moduły ES i dotyka DOM. Behawioralne to styl
  given/when/then w nazwach `describe`/`it` - bez osobnego frameworka BDD (YAGNI).
- E2E, snapshot, a11y: **Playwright**. Snapshot przez `toHaveScreenshot` z
  `updateSnapshots: 'missing'` i **zacommitowanym baseline** (sek. Krok 0); a11y przez
  `@axe-core/playwright`. `playwright.config.js` startuje statyczny serwer (`webServer`) dla apki
  w kontrolowanym viewport.
- `package.json` skrypty: `test:unit` (Vitest), `test:bdd` (Vitest, plik behawioralny),
  `test:e2e`, `test:visual` (snapshot), `test:a11y`, oraz `test` = **uruchamia wszystkie**.
  Workbook instruuje: zawsze mów "uruchom testy" (całość), żeby czerwień snapshot/a11y była
  widoczna - nie tylko wybrany podzbiór.
- Git: `sklep/` inicjowany jako repo w Kroku 0 (`git init` + commit + `git tag zielony-start`)
  dla mechanizmu resetu; `.gitignore` chroni `node_modules`/raporty przed `git clean -fd`.

## 10. Kryteria sukcesu

- Uczestnik bez wiedzy o kodzie przechodzi Krok 0 i widzi zielony baseline, korzystając tylko z
  Claude Code.
- Każdy udokumentowany prompt łamiący faktycznie czerwieni wskazany test (zweryfikowane
  realnym przebiegiem, nie założone).
- Uczestnik potrafi ułożyć własny test słowami w kreatorze i zobaczyć go zielonym.
- Sekcja ręczna czytelnie pokazuje granicę automatyzacji (automaty zielone, człowiek łapie
  problem).
- Strona spójna wizualnie z resztą kursu, po polsku z pełnymi diakrytykami.

## 11. Poza zakresem (YAGNI)

- Testy integracyjne, property-based, wydajnościowe, mutacyjne.
- Osobny framework BDD (Cucumber/Gherkin).
- CI/CD, pokrycie kodu (coverage), raporty HTML z testów.
- Żywy podgląd apki w stronie / realny status testów w workbooku.
- Backend, baza danych, płatności - koszyk jest w całości po stronie przeglądarki.

## 12. Ryzyka i punkty do pilnowania

- **Niezawodność promptów łamiących**: każdy scenariusz trzeba przetestować realnym przebiegiem
  (AI może zaimplementować zmianę bezpiecznie). Stąd obowiązkowa siatka bezpieczeństwa i
  warianty-pewniaki kategorii (A).
- **Bariera środowiska**: Node.js i pobranie przeglądarek Playwright to realne wymagania.
  README i Krok 0 muszą to obsłużyć przez Claude Code; zakładamy Node już zainstalowany. README
  zawiera sekcję troubleshooting (wersja Node, ręczna instalacja przeglądarek,
  `PLAYWRIGHT_BROWSERS_PATH`, wsparcie prowadzącego).
- **Objętość**: 7 sekcji × 3-5 testów to dużo na jeden dzień. Dodatki celowo lżejsze; prowadzący
  może przejść tylko trzon, jeśli brakuje czasu.
- **Kruchość snapshotów**: testy wizualne bywają wrażliwe na system/fonty. Ograniczamy do 1-2
  stabilnych scenariuszy, renderujemy w kontrolowanym viewport Playwright, baseline jest
  **zacommitowany** i generowany na etapie budowy materiałów (nie u uczestnika), a
  `updateSnapshots: 'missing'` chroni pierwszy zielony przebieg.
- **Baseline snapshotu jest per-platforma (Windows-only)**: Playwright zapisuje nazwę zrzutu z
  segmentem systemu (`podsumowanie-win32.png`). Kurs jest windowsowy, więc dla większości
  uczestników baseline pasuje i pierwszy `npm test` jest zielony. Uczestnik na macOS/Linux
  dostanie czerwony snapshot na starcie (brak pliku dla jego platformy) - to inny tryb awarii
  niż różnice fontów. Mitygacja: README ma sekcję troubleshooting z jednorazowym
  `--update-snapshots` dla nie-Windows. Świadomie NIE nadpisujemy `snapshotPathTemplate` (jeden
  wspólny plik i tak rozjechałby się pikselowo między systemami - to nie byłaby poprawa).
- **Git jako zależność resetu**: zakładamy znajomość z Dnia 3; wszystkie komendy git idą przez
  Claude Code, uczestnik nie wpisuje ich ręcznie. Reset = `git reset --hard zielony-start &&
  git clean -fd`; bezpieczeństwo `git clean` opiera się na `.gitignore` (sek. 3) - to trzeba
  zweryfikować realnym przebiegiem, bo błędny `.gitignore` skasowałby `node_modules`.
- **Reliabilność promptów - weryfikacja obowiązkowa**: cały bank (sek. 8) trzeba przejść
  realnym przebiegiem z Claude Code i potwierdzić, że każdy prompt (lub jego A-pewniak)
  faktycznie czerwieni wskazany test; to jest krok akceptacyjny przed użyciem materiałów.
