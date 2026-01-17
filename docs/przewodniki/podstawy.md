# Podstawy Użytkowania

Dowiedz się, jak przekształcić widok z Rhino w wizualizację AI w kilku prostych krokach.

## Przegląd Interfejsu

Panel Rhino Image Studio składa się z głównych sekcji:
1.  **Canvas (Podgląd)**: Główny obszar wyświetlający przechwycony widok lub wygenerowany obraz.
2.  **Controls (Panel sterowania)**: Po prawej stronie (lub na dole), gdzie wpisujesz prompty i ustawiasz parametry.
3.  **History (Historia)**: Pasek z miniaturami poprzednich generacji.

---

## Twój Pierwszy Render

### 1. Przygotuj widok w Rhino
Ustaw kamerę w Rhino tak, jak chcesz widzieć finalny obraz.
- Zalecany tryb wyświetlania: **Shaded** lub **Arctic** (dają AI jasną informację o geometrii).
- Unikaj trybu Wireframe dla skomplikowanych modeli (zbyt wiele linii może zmylić model).

### 2. Capture (Przechwytywanie)
W panelu Image Studio kliknij przycisk:
> **📷 Capture Viewport**

Twoja geometria pojawi się w oknie podglądu. To jest "baza", na której AI będzie pracować.

### 3. Opisz wizję (Prompting)
W polu tekstowym "Prompt" opisz, co chcesz zobaczyć.
- **Dobry przykład**: *"Modern concrete villa in a pine forest, rainy mood, cinematic lighting, photorealistic, 8k"*
- **Wskazówka**: Skup się na materiałach, oświetleniu i nastroju. Geometria pochodzi z Rhino, więc nie musisz jej dokładnie opisywać (np. "dom z płaskim dachem").

### 4. Generuj
Kliknij przycisk:
> **✨ Generate**

Pasek postępu pokaże status zadania. Po kilku-kilkunastu sekundach zobaczysz wynik.

### 5. Iteracja (Poprawki)
Nie podoba Ci się wynik?
- Zmień prompt (np. dodaj *"sunny day"* zamiast *"rainy"*).
- Zmień siłę wpływu AI (parametr **Strength** w ustawieniach zaawansowanych).
- Kliknij ponownie **Generate**.

Wszystkie wersje są zapisywane w Historii. Możesz do nich wrócić w każdej chwili.

---

## Funkcje Zaawansowane

### Multi-angle (Wielokrotne kąty)
Ta funkcja pozwala wygenerować spójne widoki tego samego obiektu z różnych stron.
1. Wybierz wygenerowany obraz.
2. Przejdź do trybu **Angles**.
3. Ustaw parametry (np. Azimuth, Elevation).
4. Kliknij Generate.

### Upscaling (Powiększanie)
Aby przygotować obraz do prezentacji:
1. Wybierz najlepszą wersję.
2. Kliknij **Upscale**.
3. Obraz zostanie przetworzony do wyższej rozdzielczości (np. 4K) z dodaniem detali.
