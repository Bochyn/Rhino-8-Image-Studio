# SPEC.md — Rhino Image Studio (Windows)
Wersja: 0.5 (MVP + Inpainting)
Status: Development / Open Source Preparation

## 1. Streszczenie (Executive Summary)
**Rhino Image Studio** to wtyczka dla Rhinoceros (Windows), która zamienia widok z viewportu (shaded / wireframe / inne display modes) w wysokiej jakości wizualizacje generowane przez modele AI. Użytkownik pracuje w Rhino jak zwykle, a w dockowanym panelu otrzymuje nowoczesny, webowy interfejs do generowania, iteracji, tworzenia wariantów, "multi-angle" i finalnego upscalowania obrazów.

## 2. Status Implementacji (2026-02-06)

### Zrealizowane (MVP)
- [x] **Rhino Plugin**: Panel dokowany, komunikacja z backendem.
- [x] **Backend (.NET 8)**: Obsługa API fal.ai, zarządzanie sekretami, serwowanie UI.
- [x] **Frontend (React)**: Nowy, ciemny interfejs "Studio", panel inspektora, obsługa historii.
- [x] **AI Integration**:
    - Generacja: Gemini / Nano Banana (przez fal.ai).
    - Multi-angle: Qwen (przez fal.ai).
    - Upscaling: RealESRGAN/inne (przez fal.ai).
- [x] **Dokumentacja**: Pełna struktura w folderze `/docs`.
- [x] **UI Design System**: Custom blue-gray paleta + Sawarabi Gothic.
- [x] **A/B Comparison**: Rozbudowany slider z regulowaną opacity overlay, wybór dowolnych obrazów A/B z galerii thumbnails.
- [x] **Reference Images**: Upload do 4 referencji (materiały, obiekty, styl) wysyłanych z promptem do Gemini.
- [x] **Generation Archive**: Soft-delete generacji z zakładką "Archived" — przywracanie i permanentne usuwanie.
- [x] **Multi-Mask Inpainting**: Rysowanie masek na canvasie z per-mask instrukcjami, edycja regionów przez Gemini.

### W trakcie / Planowane
- [ ] Batch processing (wiele widoków naraz).
- [ ] Zaawansowane zarządzanie sesjami (eksport/import).
- [ ] Lokalne modele (opcjonalnie w przyszłości).
- [ ] Dodatkowe modele AI (np. Flux 2 Pro).

---

## 3. Architektura Techniczna

### Komponenty
1. **Rhino Plugin (Host)**
   - Integracja z RhinoCommon.
   - Hostuje WebView2.
2. **Lokalny Backend**
   - Proxy do fal.ai (ukrywa API Key).
   - Zarządza stanem aplikacji i plikami.
3. **Web UI**
   - React + Vite + Tailwind.
   - Komunikacja przez REST + SSE (Server-Sent Events).

---

## 4. Modele i Pipeline

### Dostępne modele generacji

| Model | ID | Provider | Rozdzielczości | Referencje | Maski | Domyślny | Koszt |
|-------|----|----------|---------------|------------|-------|----------|-------|
| **Gemini 2.5 Flash** | `gemini-2.5-flash-image` | Gemini API | 1K | Max 4 | Max 2 | Tak | ~$0.04/obraz |
| **Gemini 3 Pro** | `gemini-3-pro-image-preview` | Gemini API | 1K, 2K, 4K | Max 4 | Max 8 | Nie | wyższy |
| **Qwen Multi-Angle** | `fal-ai/qwen-image-edit-2511-multiple-angles` | fal.ai | - | - | - | (tryb Pan) | - |
| **Topaz Upscale** | `fal-ai/topaz/upscale/image` | fal.ai | 2x/4x | - | - | (tryb Upscale) | - |

**Gemini 2.5 Flash** jest domyślnym modelem generacji (tani, szybki, do iteracji). **Gemini 3 Pro** służy do finalnych renderów w wyższych rozdzielczościach (2K/4K).

### Model-Aware Configuration (Panel dostosowuje się do modelu)

**WAŻNE:** Panel edytora (InspectorPanel) **dynamicznie dostosowuje** dostępne opcje Aspect Ratio i Resolution w zależności od wybranego modelu AI. Po zmianie modelu w selektorze, UI automatycznie:
- Aktualizuje dostępne rozdzielczości (Flash: tylko 1K; Pro: 1K/2K/4K)
- Waliduje i resetuje AR/Resolution jeśli aktualne wartości nie są wspierane przez nowy model
- Synchronizuje wymiary Viewport Capture z wybranym AR i Resolution

Każdy model ma własną konfigurację w `src/RhinoImageStudio.UI/src/lib/models.ts`:

```typescript
interface ModelInfo {
  id: string;
  provider: 'fal' | 'gemini';
  name: string;
  capabilities: ModelCapabilities;
  aspectRatios?: AspectRatioOption[];   // Dostępne AR dla modelu
  resolutions?: ResolutionOption[];      // Dostępne rozdzielczości
}
```

**Gemini 2.5 Flash** (`gemini-2.5-flash-image`) - domyślny:
- **Aspect Ratios:** `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
- **Resolutions:** `1K` (1024px) - jedyna dostępna
- **Backend:** NIE wysyłać parametru `imageSize` w Gemini API (powoduje 400 INVALID_ARGUMENT)

**Gemini 3 Pro** (`gemini-3-pro-image-preview`):
- **Aspect Ratios:** te same 10 co Flash
- **Resolutions:** `1K` (1024px), `2K` (2048px), `4K` (4096px)
- **Backend:** parametr `imageSize` jest wymagany

**Dodawanie nowych modeli:**
1. Zdefiniuj konfigurację AR/Resolution w `models.ts` (sekcja `MODELS`)
2. Dodaj model do `AVAILABLE_MODELS` dla odpowiednich trybów (generate/refine)
3. W backendzie: sprawdź czy model wymaga specjalnych parametrów API (jak `imageSize`)
4. Panel edytora automatycznie się dostosuje - nie wymaga zmian w UI

### Przywracanie kontekstu z historii

Po wybraniu generacji z historii, `InspectorPanel` automatycznie przywraca:
- **Prompt** - z pola `Generation.prompt`
- **Model** - z pola `Generation.modelId` (dodane do `GenerationDto`)
- **AR/Resolution** - z pola `Generation.parametersJson` (serializowane przy tworzeniu)
- **Multi-angle** (azimuth/elevation/zoom) - z dedykowanych pól

Parametry generacji zapisywane są w `ParametersJson` jako JSON: `{"aspectRatio":"16:9","resolution":"1K",...}`

### Archiwizacja generacji (Soft-Delete)

Generacje mogą być archiwizowane (soft-delete) zamiast trwale usuwane. Model `Generation` posiada:
- `IsArchived` (bool, default false) — flaga archiwizacji
- `ArchivedAt` (DateTime?) — timestamp archiwizacji

**Endpointy:**
| Endpoint | Metoda | Działanie |
|----------|--------|-----------|
| `DELETE /api/generations/{id}` | Archiwizuj | Ustawia IsArchived=true |
| `PUT /api/generations/{id}/restore` | Przywróć | Ustawia IsArchived=false |
| `DELETE /api/generations/{id}/permanent` | Usuń trwale | Usuwa pliki + rekord (wymaga archived) |
| `GET /api/projects/{id}/generations/archived` | Lista archived | Filtruje IsArchived=true |

Istniejące endpointy listy generacji automatycznie filtrują `!IsArchived`.

**UI:** Zakładka "Archived" (ikona Archive) w AssetsPanel z przyciskami Restore i Permanent Delete.

### Porównanie A/B (Compare Slider)

Rozbudowany slider porównania z regulowaną przezroczystością:
- **Image A** (lewa/baza) i **Image B** (prawa/overlay z opacity) wybierane z galerii thumbnails
- **Opacity slider** (0-100%) reguluje przezroczystość overlay Image B
- **Thumbnail gallery** pod sliderem: dwa rzędy (A/B) miniaturek 48x48px z oznaczeniami C/G
- Domyślne selekcje: B = aktualnie wybrany element, A = źródło (capture/parent generation)
- Aktywacja: przycisk Columns w floating toolbar

### Multi-Mask Inpainting

Funkcja rysowania masek na canvasie z per-mask instrukcjami — Gemini edytuje tylko zamaskowane regiony.

**Architektura:**
- Maski to efemeryczne dane (nie persystowane w DB) — istnieją tylko w sesji edycji
- Frontend rysuje maski na offscreen canvas → eksportuje jako binary PNG (biały = edytuj, czarny = zachowaj)
- Backend buduje augmented prompt z numerowanymi instrukcjami masek
- Maski wysyłane jako dodatkowe `inline_data` parts w Gemini API request

**Limity obrazów Gemini (source + refs + masks):**
- Flash: max 3 obrazy total → `maxMaskLayers: 2`
- Pro: max 14 obrazów total → `maxMaskLayers: 8`
- fal.ai: maski nieobsługiwane

**Model config (`models.ts`):**
```typescript
interface ModelCapabilities {
  supportsMasks: boolean;     // Czy model obsługuje maski
}
interface ModelInfo {
  maxMaskLayers?: number;     // Max warstw masek
  maxTotalImages?: number;    // Max obrazów w jednym request
}
```

**Helper:** `getAvailableMaskSlots(modelId, refCount)` — dynamicznie oblicza dostępne sloty na maski.

**Backend (`GenerateRequest`):**
```csharp
public record MaskLayerData(string MaskImageBase64, string Instruction);
// GenerateRequest rozszerzony o:
List<MaskLayerData>? MaskLayers = null
```

**Walidacja (POST /api/generate):**
- Max 8 masek per request
- Każda maska: wymagane `Instruction` + `MaskImageBase64` (valid base64)
- fal.ai modele odrzucane z maskami
- Łączna liczba obrazów: `(source ? 1 : 0) + refs + masks <= maxTotalImages`

**Frontend komponenty:**
- `BrushEngine.ts` — silnik rysowania z Bezier interpolacją, brush/eraser
- `MaskHistory.ts` — undo/redo per warstwa (20 kroków 1K, 10 kroków 4K)
- `maskUtils.ts` — eksport PNG (alpha→binary), client-side compositing
- `MaskCanvas.tsx` — dual canvas overlay (display + cursor), zoom-aware coordinates, pointer capture
- Sekcja "Mask Layers" w InspectorPanel z kolorowymi indykatorami i mini-promptami

**Wzajemne wykluczanie:** Mask mode i Compare mode nie mogą być aktywne jednocześnie.

---

## 5. Dane i Bezpieczeństwo
- **API Keys**: Przechowywane bezpiecznie w lokalnym magazynie sekretów (nie w kodzie).
- **Sesje**: Dane trzymane lokalnie w `src/RhinoImageStudio.Backend/bin/Debug/net8.0-windows/data`.
- **Poufność**: Obrazy są wysyłane do fal.ai tylko na czas generacji.

---

## 6. Design System (UI Standards)

### Paleta Kolorów

#### Light Mode
| Token | Hex | Użycie |
|-------|-----|--------|
| text | `#282828` | Główny tekst |
| background | `#ededed` | Tło aplikacji |
| primary | `#9e683c` | Nagłówki, CTA buttons (Bronze) |
| secondary | `#90a3a9` | Tekst drugorzędny (Teal-Gray) |
| accent | `#1f2f3c` | High-contrast akcenty (Navy) |
| panel-bg | `#f5f5f5` | Panele boczne |
| card-bg | `#f9f9f9` | Karty, tile |
| card-hover | `#f0f0f0` | Stany hover |
| border | `#d8d8d8` | Obramowania |
| danger | `#774b4a` | Ostrzeżenia, destrukcyjne akcje |

#### Dark Mode
| Token | Hex | Użycie |
|-------|-----|--------|
| text | `#d1d1d1` | Główny tekst |
| background | `#34312c` | Tło aplikacji (ciepła ciemność) |
| primary | `#c28b62` | Nagłówki, CTA buttons (jasny Bronze) |
| secondary | `#586b71` | Tekst drugorzędny (Slate) |
| accent | `#c3d3e0` | Akcenty (Pale Blue) |
| panel-bg | `#2b2925` | Panele boczne |
| card-bg | `#3b3834` | Karty, tile, overlay |
| card-hover | `#44413c` | Stany hover |
| border | `#4a4740` | Obramowania |
| danger | `#774b4a` | Ostrzeżenia, destrukcyjne akcje |

### Typografia

**Czcionka:** Inter (Google Fonts)

| Token | Rozmiar |
|-------|---------|
| xs | 0.625rem |
| sm | 0.750rem |
| base | 1rem |
| lg | 1.125rem |
| xl | 1.333rem |
| 2xl | 1.777rem |
| 3xl | 2.369rem |
| 4xl | 3.158rem |
| 5xl | 4.210rem |

**Wagi:**
- `normal`: 400
- `semibold`: 600
- `bold`: 700

### Użycie w CSS

```css
/* Kolory */
.element {
  color: var(--text);
  background: var(--background);
  border-color: var(--border);
}

/* Tailwind classes */
<div className="bg-background text-primary border-border">
<button className="bg-primary text-background">CTA</button>
```

---

## 7. Notatki Rozwojowe (Internal)
- Decyzja o przejściu na `WebView2` zamiast natywnego Eto.Forms UI była kluczowa dla elastyczności interfejsu.
- Aktualny stack UI: React 18 + Tailwind + Lucide Icons.
- Wymagany refactoring obsługi błędów sieciowych (retry logic).

---

*Pełna dokumentacja użytkownika i dewelopera znajduje się w folderze `/docs`.*
