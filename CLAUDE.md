# SPEC.md — Rhino Image Studio (Windows)
Wersja: 0.4 (MVP + Model-Aware AR/Resolution)
Status: Development / Open Source Preparation

## 1. Streszczenie (Executive Summary)
**Rhino Image Studio** to wtyczka dla Rhinoceros (Windows), która zamienia widok z viewportu (shaded / wireframe / inne display modes) w wysokiej jakości wizualizacje generowane przez modele AI. Użytkownik pracuje w Rhino jak zwykle, a w dockowanym panelu otrzymuje nowoczesny, webowy interfejs do generowania, iteracji, tworzenia wariantów, "multi-angle" i finalnego upscalowania obrazów.

## 2. Status Implementacji (2026-01-19)

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
- [x] **A/B Comparison**: Porównanie Before/After (viewport vs generacja) ze sliderem.

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
Aplikacja wykorzystuje chmurę fal.ai do przetwarzania:
- **Generation**: `fal-ai/fast-sdxl` lub `google/gemini` (zależnie od konfiguracji).
- **Multi-angle**: `fal-ai/qwen-image-edit-2511-multiple-angles`.
- **Upscaler**: `fal-ai/esrgan`.

### Model-Aware Configuration

**WAŻNE:** Dostępne opcje Aspect Ratio i Resolution są **zależne od wybranego modelu AI**.

Każdy model ma własną konfigurację zdefiniowaną w `src/RhinoImageStudio.UI/src/lib/models.ts`:

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

**Gemini 3 Pro** (aktualny model główny):
- **Aspect Ratios:** `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
- **Resolutions:** `1K` (1024px), `2K` (2048px), `4K` (4096px)

**Viewport Capture synchronizacja:**
- Capture automatycznie używa wymiarów zgodnych z wybranym AR i Resolution w edytorze
- Funkcja `calculateDimensions(aspectRatio, resolution, modelId)` przelicza piksele

**Dodawanie nowych modeli:**
Aby dodać nowy model (np. Flux 2 Pro), zdefiniuj jego opcje AR/Resolution w `models.ts`:
```typescript
const FLUX_ASPECT_RATIOS: AspectRatioOption[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'square_hd', label: 'Square HD', ratio: 1 },
  // ...
];
```

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
| text | `#4b5563` | Główny tekst |
| background | `#f3f4f6` | Tło aplikacji |
| primary | `#1f2937` | Nagłówki, CTA buttons |
| secondary | `#48566a` | Tekst drugorzędny |
| accent | `#9ca4b0` | Stonowane akcenty, ikony |

#### Dark Mode
| Token | Hex | Użycie |
|-------|-----|--------|
| text | `#9ca6b4` | Główny tekst |
| background | `#090a0c` | Tło aplikacji (prawie czarny) |
| primary | `#c8d2e0` | Nagłówki, CTA buttons |
| secondary | `#95a3b7` | Tekst drugorzędny |
| accent | `#4f5763` | Stonowane akcenty, obramowania |

#### Kolory pochodne (Dark Mode)
| Token | Hex | Użycie |
|-------|-----|--------|
| panel-bg | `#0f1115` | Panele boczne |
| card-bg | `#161a1f` | Karty, tile, overlay |
| card-hover | `#1e2329` | Stany hover |
| border | `#252a31` | Obramowania |

### Typografia

**Czcionka:** Sawarabi Gothic (Google Fonts)

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
