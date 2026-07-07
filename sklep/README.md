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
- **Jesteś na macOS/Linux (nie Windows)?** Baseline zrzutu jest generowany dla Windows
  (`podsumowanie-win32.png`), bo kurs prowadzony jest na Windows. Na innym systemie Playwright
  szuka pliku dla Twojej platformy i test snapshot będzie czerwony na starcie. Jednorazowo
  wygeneruj własny baseline: powiedz Claude Code *"zaktualizuj baseline zrzutów"*
  (`npx playwright test tests/snapshot.spec.js --update-snapshots`), potem `git add` powstałego
  PNG. Od tej pory snapshot działa u Ciebie normalnie.
