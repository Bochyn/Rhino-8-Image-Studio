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

## Zarządzanie generacjami

### Archiwizowanie
Najedź na thumbnail generacji w panelu Assets i kliknij ikonę **kosza** — generacja zostanie zarchiwizowana (nie usunięta). Pliki pozostają na dysku.

### Zakładka Archived
Kliknij ikonę **Archive** (pudełko) w zakładkach Assets, aby zobaczyć zarchiwizowane generacje. Dla każdej masz dwie opcje:
- **Restore** (zielona ikona) — przywraca generację do głównej listy
- **Permanent Delete** (czerwona ikona) — trwale usuwa generację i pliki z dysku (nieodwracalne)

---

## Porównanie A/B (Compare)

### Aktywacja
Kliknij ikonę **kolumn** (Columns) w pasku narzędzi nad canvasem. Przycisk pojawia się gdy masz co najmniej 2 obrazy w projekcie.

### Wybór obrazów
Pod sliderem pojawiają się dwa rzędy miniaturek:
- **Rząd A** — kliknij miniaturkę, aby ustawić ją jako Image A (lewa strona / baza)
- **Rząd B** — kliknij miniaturkę, aby ustawić ją jako Image B (prawa strona / overlay)

Miniaturki oznaczone są literami **C** (Capture) lub **G** (Generation).

### Regulacja przezroczystości
Nad sliderem widoczny jest suwak **B Opacity** (0-100%). Pozwala regulować przezroczystość Image B nakładanego na Image A:
- **100%** — standardowe porównanie (lewa: A, prawa: B, ostre cięcie sliderem)
- **50%** — po prawej stronie widoczny blend A i B
- **0%** — po obu stronach widoczny tylko Image A

### Wyjście z trybu porównania
Kliknij ponownie ikonę kolumn w pasku narzędzi.

---

## Funkcje Zaawansowane

### Pan (Move Camera)
Ta funkcja pozwala wygenerować widoki obiektu z różnych kątów kamery, zachowując spójność wizualną.

1. Wybierz capture lub wygenerowany obraz jako źródło.
2. Przejdź do zakładki **Pan** w panelu Editor.
3. Użyj **Quick Presets** (Front, Right, Back, Left, 3/4, Top, Low) lub dostosuj ręcznie:
   - **Camera Rotation** (-180° do +180°): obrót kamery wokół obiektu (lewo/prawo)
   - **Camera Elevation** (-30° do +90°): wysokość kamery (nisko/wysoko)
   - **Camera Distance** (0-10): odległość kamery (Wide/Medium/Close)
4. Kliknij **Move Camera**.

> **Tip:** Przycisk **Reset** przywraca domyślne ustawienia (Front, Eye Level, Medium distance).

### Upscaling (Powiększanie)
Aby przygotować obraz do prezentacji:
1. Wybierz najlepszą wersję.
2. Kliknij **Upscale**.
3. Obraz zostanie przetworzony do wyższej rozdzielczości (np. 4K) z dodaniem detali.
