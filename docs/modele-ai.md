# Wspierane Modele AI

Rhino Image Studio wykorzystuje różne modele AI do generowania i przetwarzania obrazów. Każdy model ma swoje specyficzne zastosowanie i parametry.

## Przegląd Modeli

| Model | Provider | Zastosowanie | Główne parametry | Referencje |
|-------|----------|--------------|------------------|------------|
| Gemini 2.5 Flash | Google | Generowanie / Edycja | Aspect Ratio | Max 4 |
| Gemini 3 Pro | Google | Generowanie / Edycja | Aspect Ratio, Resolution | Max 4 |
| Qwen Multi-Angle | fal.ai | Zmiana kąta kamery | Rotation, Elevation, Zoom | - |
| Topaz Upscale | fal.ai | Powiększanie | Factor, Model type | - |

---

## Gemini 2.5 Flash

**ID:** `gemini-2.5-flash-image`
**Provider:** Google DeepMind
**Tryby:** Generate, Refine (Edit)

Domyślny model do generowania — szybki i tani. Obsługuje tylko rozdzielczość 1K.

### Możliwości

- Generowanie wielu wariantów (1-4 obrazy)
- Kontrola wpływu input image (strength)
- **Reference Images** — do 4 obrazów referencyjnych (materiały, obiekty, styl)
- Aspect Ratios: takie same jak Gemini 3 Pro (patrz tabela poniżej)
- Rozdzielczość: tylko 1K (1024px)

---

## Gemini 3 Pro (Preview)

**ID:** `gemini-3-pro-image-preview`
**Provider:** Google DeepMind
**Tryby:** Generate, Refine (Edit)

Główny model do generowania wizualizacji architektonicznych. Przekształca viewport capture w fotorealistyczne rendery.

### Dostępne Aspect Ratios

| Wartość | Proporcje | Typowe zastosowanie |
|---------|-----------|---------------------|
| `1:1` | Kwadrat | Instagram, ikony |
| `2:3` | Pionowy | Portret, plakaty |
| `3:2` | Poziomy | Fotografia klasyczna |
| `3:4` | Pionowy | Portrait photo |
| `4:3` | Poziomy | Prezentacje |
| `4:5` | Pionowy | Instagram portrait |
| `5:4` | Poziomy | Print photo |
| `9:16` | Pionowy | Stories, Reels |
| `16:9` | Poziomy | Widescreen, YouTube |
| `21:9` | Ultra-wide | Cinematic |

### Dostępne Rozdzielczości

| Wartość | Piksele | Zastosowanie |
|---------|---------|--------------|
| `1K` | 1024px | Szybki podgląd, iteracje |
| `2K` | 2048px | Prezentacje, web |
| `4K` | 4096px | Druk, finalne rendery |

### Możliwości

- Negative prompt (wykluczanie elementów)
- Generowanie wielu wariantów (1-4 obrazy)
- Kontrola wpływu input image (strength)
- **Reference Images** — do 4 obrazów referencyjnych (materiały, obiekty, styl)

---

## Qwen Multi-Angle

**ID:** `fal-ai/qwen-image-edit-2511-multiple-angles`
**Provider:** fal.ai
**Tryb:** Pan (Move Camera)

Model do generowania widoków obiektu z różnych kątów kamery. Zachowuje spójność wizualną między różnymi perspektywami.

### Parametry

| Parametr | Zakres UI | Zakres API | Domyślna |
|----------|-----------|------------|----------|
| Camera Rotation (H) | -180° do +180° | 0° do 360° | 0° (Front) |
| Camera Elevation (V) | -30° do +90° | -30° do +90° | 0° (Eye Level) |
| Camera Distance | 0 do 10 | 0 do 10 | 5 (Medium) |
| LoRA Scale | 0 do 1 | 0 do 1 | 0.8 |

### Konwersja kątów

UI używa intuicyjnego zakresu -180° do +180° (lewo/prawo), który jest automatycznie konwertowany do formatu API (0° do 360°).

| Pozycja | UI | API |
|---------|-----|-----|
| Front | 0° | 0° |
| Right | 90° | 90° |
| Back | 180° lub -180° | 180° |
| Left | -90° | 270° |

### Quick Presets

Dostępne predefiniowane pozycje kamery:

- **Front** - widok z przodu (0°, 0°)
- **Right** - widok z prawej (90°, 0°)
- **Back** - widok z tyłu (180°, 0°)
- **Left** - widok z lewej (-90°, 0°)
- **3/4 Right** - perspektywa prawy przód (45°, 20°)
- **3/4 Left** - perspektywa lewy przód (-45°, 20°)
- **Top Down** - widok z góry (0°, 90°)
- **Low Angle** - widok z dołu (0°, -30°)

---

## Topaz Upscale

**ID:** `fal-ai/topaz/upscale/image`
**Provider:** fal.ai
**Tryb:** Upscale

Profesjonalne powiększanie obrazów z wykorzystaniem technologii Topaz Labs. Dodaje detale przy zachowaniu ostrości.

### Dostępne Modele

| Model | Zastosowanie |
|-------|--------------|
| Standard V2 | Uniwersalny, domyślny |
| High Fidelity V2 | Maksymalna wierność detali |
| Graphics | Grafika, ilustracje |
| Low Resolution V2 | Bardzo niskie źródło |
| CG | Rendery 3D, CGI |

### Parametry

| Parametr | Wartości | Domyślna |
|----------|----------|----------|
| Factor | 2x, 4x | 2x |
| Face Enhancement | On/Off | Off |
| Output Format | JPEG, PNG | JPEG |

---

## Reference Images (Referencje)

Oba modele Gemini (Flash i Pro) obsługują **obrazy referencyjne** — dodatkowe obrazy, które model AI wykorzystuje jako kontekst wizualny podczas generowania.

### Zastosowania
- Materiały i tekstury (np. drewno, marmur)
- Obiekty do wstawienia (np. meble, pojazdy)
- Styl wizualny (np. zdjęcie inspiracyjne)
- Elementy architektury (np. detale elewacji)

### Jak używać
1. Wybierz model Gemini (Flash lub Pro)
2. Kliknij przycisk **Reference Images** (ikona `ImagePlus`) w toolbarze canvasu
3. Dodaj do 4 obrazów (drag & drop lub kliknij `+`)
4. W prompcie opisz jak model ma użyć referencji, np.:
   *"Modern office interior with the wooden texture from reference applied to walls and the car placed in the center"*
5. Kliknij Generate

### Limity
- Max 4 referencje per projekt
- Max 10MB per plik
- Obsługiwane formaty: JPG, PNG, WebP
- Referencje są zachowywane przy przełączaniu modeli

### Techniczne detale
- Upload: `POST /api/projects/{projectId}/references` (multipart)
- Referencje wysyłane jako `inline_data` parts[] w Gemini API request
- Pliki przechowywane w `%LOCALAPPDATA%/RhinoImageStudio/data/references/`

---

## Wymagania API Keys

### Google Gemini
- Wymagany do trybów: Generate, Refine
- Uzyskaj klucz: [Google AI Studio](https://aistudio.google.com/)
- Zapisz w: Settings → Gemini API Key

### fal.ai
- Wymagany do trybów: Pan (Multi-Angle), Upscale
- Uzyskaj klucz: [fal.ai Console](https://fal.ai/dashboard)
- Zapisz w: Settings → fal.ai API Key

---

## Dodawanie Nowych Modeli

Deweloperzy mogą dodawać nowe modele w pliku `src/RhinoImageStudio.UI/src/lib/models.ts`:

```typescript
export const MODELS: Record<string, ModelInfo> = {
  'new-model-id': {
    id: 'new-model-id',
    provider: 'fal',
    name: 'New Model Name',
    shortName: 'new-model',
    description: 'Description of the model',
    capabilities: {
      supportsNegativePrompt: false,
      supportsSeed: true,
      supportsAspectRatio: true,
      supportsNumImages: false,
      supportsStrength: false,
      supportsReferences: false,
    },
    aspectRatios: [...], // opcjonalne
    resolutions: [...],  // opcjonalne
    maxReferences: 4,    // opcjonalne - max obrazów referencyjnych
  },
};
```

Następnie dodaj model do odpowiedniego trybu w `AVAILABLE_MODELS`.
