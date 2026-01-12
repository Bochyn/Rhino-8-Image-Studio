# SPEC.md — Rhino Image Studio (Windows)  
Wersja: 0.1 (koncept + wymagania MVP rozbudowanego)  
Status: Draft dla inwestorów + CTO

## 1. Streszczenie (Executive Summary)
**Rhino Image Studio** to wtyczka dla Rhinoceros (Windows), która zamienia widok z viewportu (shaded / wireframe / inne display modes) w wysokiej jakości wizualizacje generowane przez modele AI. Użytkownik pracuje w Rhino jak zwykle, a w dockowanym panelu otrzymuje nowoczesny, webowy interfejs do generowania, iteracji, tworzenia wariantów, “multi-angle” i finalnego upscalowania obrazów.

Kluczowa wartość: **super szybka ścieżka od modelu 3D do “wow” wizualizacji** bez klasycznego renderingu, z pełną historią i wersjonowaniem.

---

## 2. Główna idea produktu
1. Użytkownik ma scenę 3D w Rhino.
2. Wtyczka robi **kontrolowany capture viewportu** (bitmapa).
3. Obraz trafia do pipeline’u modeli na **fal.ai**:
   - generacja/edycja obrazu w stylu “Nano Banana” (modele Gemini) — szybkie iteracje, edycje promptem, praca konwersacyjna [2]
   - opcjonalnie: generowanie tej samej sceny z różnych kątów (azimuth/elevation) przez `fal-ai/qwen-image-edit-2511-multiple-angles` [3]
   - opcjonalnie: upscaler / final polish (również przez fal.ai)
4. Wyniki wracają do aplikacji jako obrazy + metadane i są zapisywane w sesji.
5. Użytkownik iteruje: prompt + ustawienia → kolejne wersje → wybór najlepszej → eksport.

W efekcie Rhino staje się “źródłem geometrii i kamery”, a Rhino Image Studio jest **studiem do AI-wizualizacji**.

---

## 3. Docelowy użytkownik i zastosowania
**Użytkownicy:**
- architekci, archviz, projektanci wnętrz
- designerzy produktu / industrial
- koncepcja + szybkie moodboardy
- zespoły projektowe potrzebujące szybkiej komunikacji wizualnej

**Zastosowania:**
- szybkie wizualizacje “look & feel” z modelu
- warianty stylu: dzień/noc, pogoda, materiały, otoczenie, nastrój
- “marketing shots” na bazie geometrii
- generowanie ujęć z alternatywnych kątów (multi-angle) bez przebudowy sceny [3]

---

## 4. Zakres platformy
- **Tylko Windows** (Rhino for Windows)
- Wtyczka Rhino + lokalny backend (na start)
- Webowy panel UI osadzony w Rhino

---

## 5. UX / UI — doświadczenie użytkownika (Wow-first)
### 5.1. Forma UI
- Dockowany panel w Rhino (side panel).
- Wygląd i zachowanie jak nowoczesna aplikacja webowa (SPA).
- Interakcje “zero tarcia”: szybkość, miniatury, historia, A/B, one-click actions.

### 5.2. Główne ekrany / moduły UI
**A) Home / Sessions**
- lista sesji (ostatnie, przypięte)
- tworzenie nowej sesji (nazwa, opis)
- szybkie wznowienie pracy

**B) Studio (kluczowy ekran)**
Układ typu: *Sources* / *Canvas* / *Controls* / *Timeline*

1) **Sources (wejścia)**
- “Capture Viewport”
- wybór: rozdzielczość (np. 1024/1536/2048/…)
- wybór display mode: Shaded / Wireframe / Rendered itd.
- lista capture’ów (miniatury) z metadanymi (nazwa widoku, czas, tryb)

2) **Canvas (podgląd)**
- duży podgląd obrazu wynikowego
- tryb “Before/After” (slider) – viewport capture vs generacja
- tryb A/B/C/D (warianty obok siebie)

3) **Controls (sterowanie)**
- pole prompt (z template/presetami)
- preset stylu (archviz day, night, fog, watercolor, cyberpunk…)
- tryb: “Fast” vs “Pro” (mapowane na model/ustawienia)
- podstawowe parametry:
  - aspect ratio (1:1, 16:9, 4:5…)
  - liczba wariantów
  - “preserve camera/perspective” (jako reguła promptu)
  - “do not change geometry silhouette” (reguła promptu)

4) **Timeline / History**
- karty kolejnych iteracji:
  - prompt
  - parametry modelu
  - miniatura wyniku
  - stage (Generate/Refine/Angles/Upscale)
- klik w kartę przywraca stan (prompt + parametry + obraz)

### 5.3. “Wow features” w MVP rozbudowanym
- **One-click pipeline**: Capture → Generate → Angles → Upscale → Export
- **Multi-angle**: suwak azimuth/elevation + presety; generowanie spójnych kątów [3]
- **Refine**: “keep everything, change only…” (szybka iteracja multi-turn) [2]
- **Versioning**: drzewko iteracji (parent/child) + powrót do dowolnej wersji
- **Batch**: generuj z wielu viewów (np. Perspective + Top + Section) jako seria

---

## 6. Funkcje produktu (MVP rozbudowane)
### 6.1. Capture z Rhino
- przechwycenie aktywnego viewportu do bitmapy (kontrolowane parametrami)
- wsparcie dla wielu display mode
- zapis do storage jako asset wejściowy

### 6.2. Generacja / edycja obrazów (fal.ai — Gemini)
- generacja z tekstu lub tekst+obraz
- edycja “mask-free” (opisowa): dodaj/usuń/zmień elementy, styl, grading
- iteracja “multi-turn” (rozmowa / kolejne doprecyzowania) [2]
- wsparcie wysokiej rozdzielczości (zależnie od modelu)

### 6.3. Multi-angle (fal.ai — Qwen multiple angles)
- generowanie tej samej sceny z innych kątów:
  - azimuth (poziomy)
  - elevation (pionowy)
  - zoom/distance
- UI: presety + suwaki + miniatury wyników [3]

### 6.4. Upscale / Postprocess (fal.ai)
- upscaler jako osobny stage w pipeline
- opcjonalnie: podstawowy postprocess (wyostrzenie, ziarno, kontrast) — w ramach pipeline’u

### 6.5. Eksport i integracja z workflow
- export do:
  - PNG/JPG (różne rozdzielczości)
  - paczka wariantów
- zapis metadanych (prompt, model, parametry) razem z outputem
- “Copy to clipboard” (opcjonalnie)

---

## 7. Dane, historia i “Sync”
### 7.1. Czy potrzebujemy bazy danych?
**Tak.** Historia promptów, parametry modeli, relacje wersji, job queue i statusy wymagają trwałego, spójnego przechowywania metadanych. Pliki obrazów idą do file storage, a metadane do SQLite.

### 7.2. Model przechowywania
- **File storage**: obrazy jako pliki na dysku (captures/results/thumbs/exports)
- **SQLite**: metadane + relacje + job queue
- Sesje niezależne od plików .3dm (użytkownik może mieć wiele sesji niezależnie od modelu)

### 7.3. Konfiguracja aplikacji (global config)
- Przechowywana w folderze aplikacji (np. `%AppData%\RhinoImageStudio\config.json`)
- Zawiera m.in.:
  - ustawienia UI (np. ostatni panel, theme)
  - domyślne presety promptów
  - domyślne parametry capture
  - adres/port lokalnego backendu
  - tryb logowania i diagnostyka

---

## 8. Architektura techniczna (dla CTO)
### 8.1. Komponenty
1) **Rhino Plugin (Host)**
- integracja z RhinoCommon (capture viewportu)
- host panelu UI
- uruchamianie i kontrola lokalnego backendu
- integracja z filesystem + session management

2) **Lokalny Backend (Proxy + Orchestrator)**
- jedyny komponent posiadający sekret (API key do fal.ai)
- wystawia lokalne API dla Web UI i pluginu
- zarządza job queue:
  - kolejka, cancel, retry, status, progres
- obsługuje upload/download assetów
- normalizuje odpowiedzi modeli, zapisuje metadane do DB

3) **Web UI (TypeScript SPA)**
- nowoczesny frontend (React/Vue/Svelte)
- UX: timeline, gallery, compare, job progress
- komunikuje się z lokalnym backendem po HTTP (localhost)

> UI hostowane w Rhino dzięki kontenerowi opartemu o Eto. Eto jest cross-platform frameworkiem .NET i nadaje się jako warstwa UI-hostingu [1].

### 8.2. API / komunikacja
- Web UI → Backend: HTTP/JSON (localhost)
- Backend → fal.ai: HTTPS (z API key)
- Backend → UI: polling lub push (WebSocket/SSE) dla statusów jobów

### 8.3. Bezpieczeństwo klucza fal.ai
- klucz nie znajduje się w front-endzie ani w pluginie
- klucz jest przechowywany przez backend lokalny (w bezpiecznym storage/config)
- UI nigdy nie widzi sekretu

### 8.4. Job system (wymóg UX)
- wszystkie operacje długie = Job:
  - capture
  - generate/refine
  - angles
  - upscale
  - export
- atrybuty job:
  - status (queued/running/succeeded/failed/canceled)
  - progress
  - error message
  - timestamps
- UI prezentuje kolejkę i umożliwia cancel/retry

---

## 9. Pipeline i “stages”
### 9.1. Stage: Generate (Gemini)
- wejście: (opcjonalnie) capture + prompt
- wyjście: 1..N wariantów
- zapis: generation + outputs w DB

Gemini wspiera tekst, obraz oraz iteracyjne dopracowanie w wielu turach [2].

### 9.2. Stage: Refine (Gemini, multi-turn)
- wejście: poprzedni wynik + nowy prompt
- wyjście: nowy wynik
- relacja wersji: parent → child

### 9.3. Stage: Multi-angle (Qwen multiple angles)
- wejście: obraz + parametry (azimuth/elevation/zoom)
- wyjście: zestaw ujęć z innych kątów [3]

### 9.4. Stage: Upscale
- wejście: wybrany wynik
- wyjście: final high-res

---

## 10. Parametry techniczne (kluczowe ustawienia)
### 10.1. Capture
- target resolution (np. 1024–4096 px, zależnie od wydajności)
- display mode (Shaded/Wireframe/Rendered/…)
- format zapisu: PNG (preferowane) / JPG
- opcjonalnie: transparent background (jeśli tryb na to pozwoli)

### 10.2. Generacja (modele “Nano Banana / Nano Banana Pro”)
- model selection: szybki vs pro (zależnie od koszt/latencja)
- aspect ratio + docelowy rozmiar wyjścia
- liczba wariantów
- prompt templates i reguły spójności (kamera, geometria)

Modele Gemini: generacja/edycja obrazów, także multi-turn (chat) [2].

### 10.3. Multi-angle
- azimuth (°)
- elevation (°)
- zoom/distance
- prompt (opcjonalny) [3]

---

## 11. Wymagania niefunkcjonalne
- Stabilność: brak blokowania UI Rhino (asynchroniczne joby)
- Wydajność: caching wyników i thumbnaili
- Odporność: retry po błędach sieci
- Obserwowalność: logi lokalne + tryb debug
- Rozszerzalność: łatwe dodanie nowych stage’y i modeli fal.ai

---

## 12. Roadmap (wysokopoziomowo)
### Faza 1 — MVP rozbudowane (lokalne)
- dock panel + Web UI
- capture viewport → generate/refine (Gemini na fal.ai)
- multi-angle stage [3]
- upscaler stage
- sesje + historia (SQLite) + storage na dysku
- eksport + metadane

### Faza 2 — “Pro workflow”
- batch z wielu viewów
- porównania, rating wariantów, smart presets
- automatyczne “style reference” (dodatkowe wejściowe obrazy)

### Faza 3 — Sync / Cloud (przyszłość)
- opcjonalny backend chmurowy (logowanie, cross-device)
- przeniesienie części zadań i billing per user

---

## 13. Dlaczego to jest wiarygodne technologicznie
- UI hostowane przez .NET/Eto (spójne z ekosystemem Rhino), z możliwością osadzenia webowego interfejsu; Eto jest frameworkiem do budowy UI w .NET [1].
- Generacja i iteracje obrazów są naturalnym use-case dla modeli Gemini: text+image, edycja i wieloturowe dopracowanie [2].
- Multi-angle jest dostępne jako gotowy model na fal.ai i opisuje generowanie tej samej sceny z innych kątów przez parametry azimuth/elevation [3].

---

## 14. Otwarte decyzje (do ustalenia)
1) Dokładny wybór technologii WebView w Rhino (Eto WebView vs WebView2 hosting w panelu).
2) Dokładny format “session portability”:
   - folder per sesja (łatwe przenoszenie) vs globalny storage + DB.
3) Polityka cache i deduplikacji (sha256 assetów).
4) Model kosztów i limitów (gdy przejdziemy z “lokalne” do “cloud”).


Dokumentacje to use context 7:

Poniżej lista **nazw dokumentacji / stron / tematów do wyszukania** (jako hasła), które będą potrzebne do realizacji Rhino Image Studio. Oparłem się na tym, że UI będzie hostowane przez Eto (panel) [1], generacja/iteracja obrazów będzie szła przez modele Gemini (w tym multi-turn) [2], a multi-angle przez fal.ai Qwen multiple angles [3]. Reszta to „context 7” w sensie: Rhino Developer / RhinoCommon / fal.ai docs, które i tak musisz mieć pod ręką.

## A) Rhino (Context 7: Rhino Developer / RhinoCommon)
1) **RhinoCommon API documentation**
2) **Rhino Developer Docs**
3) **RhinoCommon – Panels / DockBar / Dockable Panels**
4) **RhinoCommon – Eto UI integration (Eto.Forms in Rhino)**
5) **RhinoCommon – View capture / ViewCapture / ViewCaptureSettings / CaptureToBitmap**
6) **RhinoCommon – DisplayModeDescription / Display Modes (Shaded/Wireframe/Rendered)**
7) **RhinoCommon – Commands (creating custom commands)**
8) **RhinoCommon – Plug-in architecture (Rhino.PlugIns)**
9) **RhinoCommon – Document events (RhinoDoc events)**
10) **RhinoCommon – File paths & persistent settings (PlugIn.Settings / PersistentSettings)**
11) **RhinoCommon – Bitmap / image handling (System.Drawing vs Rhino.Display / Eto.Drawing considerations)**
12) **RhinoCommon – Threading rules (UI thread / InvokeOnUiThread / modeless UI safety)**
13) **RhinoCommon – Embedded resources / serving local files (if UI assets are packaged)**

## B) Eto / UI hosting (Context 7: Eto.Forms)
1) **Eto.Forms documentation / GitHub (picoe/Eto)** [1]  
2) **Eto.Forms WebView control** (jeśli użyjesz wbudowanego WebView)
3) **Eto.Forms WPF platform / Eto.Wpf** (bo Rhino for Windows często hostuje WPF) [1]
4) (Jeśli HTML UI w Eto) **Eto.HtmlRenderer** (jako alternatywa do WebView, gdyby WebView było problematyczne) [1]


## C) fal.ai (Context 7: Fal AI)
1) **fal.ai Documentation (API basics)**
2) **fal.ai Authentication / API keys / environment variables**
3) **fal.ai File upload (image upload / URLs / hosting assets)**  
4) **fal.ai Queue / async jobs / webhooks (jeśli dostępne)**
5) **fal.ai Pricing / cost per megapixel / cost estimation**
6) **fal-ai/qwen-image-edit-2511-multiple-angles** [3]
   - **Azimuth / Elevation / Zoom (Distance)** [3]
   - **Input schema / output schema** [3]
6) fal-ai/nano-banana-pro/edit
7) **fal.ai model list for: upscalers** (np. “upscale”, “super resolution”, konkretne nazwy modeli, zależnie co wybierzecie)
8) **fal.ai model list for: Gemini image models** (bo chcesz wszystko spiąć przez fal.ai)

## D) Lokalny backend + storage + DB (Context 7: ogólne, do wyszukania)
To nie wynika bezpośrednio z podanych źródeł, ale jest potrzebne do dowiezienia produktu:
1) **SQLite (file-based DB) + migrations strategy**
2) **Localhost HTTP server in .NET (self-hosted API)**
3) **WebSockets / Server-Sent Events for job progress**
4) **Windows secure storage for secrets (DPAPI / Windows Credential Manager)**
5) **Packaging: Rhino plugin deployment + bundled local backend**
6) **CORS / localhost security for embedded Web UI**

Jeśli chcesz, dopiszę tę listę w formie “Checklist for CTO” (kolejność wdrożenia + kryteria wyboru WebView: Eto WebView vs WebView2), ale potrzebuję jednej decyzji: czy Web UI ma być ładowane z **lokalnych plików (packaged SPA)** czy zawsze z **localhost (serwowane przez backend)**.

---
Koniec dokumentu.