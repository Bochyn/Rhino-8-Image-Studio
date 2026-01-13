# Rhino Image Studio — UI Redesign Spec (for Cursor AI Agent)

## 0) Goal
Redesign Rhino Image Studio into a modern “creative studio / editor workspace” UI in dark mode (Tailwind grays). Remove the “table/grid with vertical separators” feel. Keep a 3-area workspace (left assets, center canvas, right inspector), but achieve separation via **surface levels (background tones), spacing, rounded corners, subtle borders**, not hard vertical lines.

Reference inspiration: Fenestra’s mode-based workflow (Create/Edit/Enhance/Animate) shows a clear “mode → settings → action” structure for archviz AI tools [1].

---

## 1) Confirmed decisions (updated Q9)
### 1.1 Left panel behavior
- Left panel **can collapse** into an **icon-only rail** (docked), expandable on hover/click into full panel.

### 1.2 Right panel purpose
- Right side is **never** used for “generation history”.
- Right side is strictly an **Inspector / Settings** panel for the active mode + selected model.

### 1.3 Compare slider
- Implement an **A/B compare slider** in the center canvas (before/after comparison).

---

## 2) Layout (App Shell)
### 2.1 Structure
- Top bar (≈56px)
- Main workspace with 3 zones:
  1) Left: Assets panel (collapsible to rail)
  2) Center: Canvas stage (preview + compare tools)
  3) Right: Inspector panel (model-dependent settings + sticky actions)

### 2.2 Remove vertical separators
- Remove `border-left` / `border-right` between columns.
- Use:
  - workspace container padding: 16px
  - gaps between zones: 12–16px
  - each zone as its own “surface” (panel background + rounded corners)

---

## 3) Visual System (Tailwind gray-based dark UI)
### 3.1 Surface levels (recommended tokens)
Use consistent “surface hierarchy”:

- `appBg`: `gray-950` (or `gray-900` if you must stay strictly within 300–900; then adjust panel/card up accordingly)
- `panelBg`: `gray-900`
- `cardBg`: `gray-800`
- `cardHover`: `gray-700/60`
- `borderSubtle`: `gray-700/40` (1px)
- `textPrimary`: `gray-100/200`
- `textSecondary`: `gray-400`
- `textMuted`: `gray-500`
- `accent`: single accent color only for CTA/active/focus (emerald/sky recommended)

### 3.2 Component shapes
- Panels: `rounded-2xl`
- Cards: `rounded-xl`
- Inputs/Buttons: `rounded-lg`
- Keep borders rare and subtle; prefer tonal separation.

---

## 4) Center Canvas (Stage) + Compare Slider (required)
### 4.1 Canvas stage
- Center area background = `appBg`
- The image preview is a “floating canvas card”:
  - `rounded-2xl`
  - subtle border or shadow
  - checkerboard only inside image bounds if needed

### 4.2 Overlay toolbar (top-left or top-right inside stage)
Include quick actions:
- Zoom in/out, Fit, 100%
- Fullscreen
- Download
- Toggle compare mode

Style: “pill” overlay:
- `bg: gray-800/70`, optional `backdrop-blur`
- icon buttons with hover states

### 4.3 Compare slider behavior
- Default: show current selected “Result” image.
- When compare enabled:
  - Left side: “Source” (viewport capture) OR “Previous generation”
  - Right side: “Current result”
- Provide a handle slider to reveal before/after.
- Add labels “Before” and “After” on corners.

---

## 5) Left Panel (Assets) — collapsible rail + gallery
### 5.1 Modes / tabs
Top of left panel:
- `Captures | Generations | Favorites`

### 5.2 Gallery layout
- Prefer grid thumbnails (2 columns) or a vertical strip of cards.
- Each asset card:
  - thumbnail, title (e.g., “Top”, “Perspective 01”), meta (resolution)
  - hover: subtle raise/highlight
  - selected: accent outline or brighter surface

### 5.3 Collapsed rail
- When collapsed:
  - show icons for tabs + “Capture” action
  - clicking expands to full width panel

---

## 6) Right Panel = Inspector (model-dependent UI is mandatory)
### 6.1 Key requirement (must implement)
The Inspector’s settings UI **depends on the selected image generation model**.

- Some sections are **stable across all models**:
  - `Source` (capture selection / replace / info)
  - `Prompt` (text prompt; possibly negative prompt if supported)
- Other sections are **fully dynamic per model**:
  - `Generation` parameters (aspect ratio, images count, format, etc.) vary by model
  - `Advanced` parameters (seed, strength, guidance, etc.) vary by model

This must be implemented as a **schema-driven settings renderer**:
- Each model defines a schema describing:
  - sections (cards)
  - fields
  - defaults
  - constraints
  - conditional visibility
- The UI is rendered from this schema.

### 6.2 Inspector top structure
At top of Inspector:
1) Model selector:
- shows current model name (e.g., Qwen Image, Nano Banana, Flux Kontext, etc.)
- switching model re-renders the dynamic settings cards (Generation/Advanced/etc.)

2) Workflow mode segmented control:
- `Generate | Refine | Camera | Upscale`
- mode changes which schema sections are shown and what the primary CTA does

(Reference: Fenestra communicates multiple workflow “modes” like Create/Edit/Enhance/Animate, each with its own controls [1].)

### 6.3 Cards + accordion (updated)
Render the inspector as a list of **cards**; each card may contain an **accordion** inside.

**Always present cards (stable):**
1) **Source**
   - selected capture preview + “Select/Replace”
   - info: resolution, timestamp, view name

2) **Prompt**
   - prompt textarea
   - optional style presets as chips (if your product supports them globally)
   - optional “Improve prompt” secondary button (if applicable)

**Model-dependent cards (dynamic):**
3) **Generation** (dynamic fields)
   - Examples of possible fields (only if schema includes them):
     - aspect ratio (segmented/chips)
     - number of images (stepper/segmented)
     - output format (segmented JPEG/PNG)
     - denoise/strength
     - reference image inputs
     - control inputs (if any)
     - etc.

4) **Advanced** (dynamic fields; collapsed by default)
   - Examples (only if schema includes them):
     - seed
     - guidance
     - steps
     - sampler
     - safety / precision toggles
     - etc.

### 6.4 Sticky footer actions (always visible)
At bottom of Inspector, sticky action bar:
- Primary CTA label depends on mode:
  - Generate → “Generate”
  - Refine → “Refine”
  - Camera → “Generate Angle” (or “Render Angle”)
  - Upscale → “Upscale”
- Secondary actions:
  - Queue (optional)
  - Save preset (optional)
- CTA is the main accent element.

---

## 7) Schema-driven settings renderer (implementation spec)
### 7.1 Data model (example)
Define something like:

- `models[modelId] = {`
  - `label`
  - `capabilities`: { supportsNegativePrompt, supportsSeed, supportsUpscale, ... }
  - `modes`: {
    - generate: { sections: [...] }
    - refine: { sections: [...] }
    - camera: { sections: [...] }
    - upscale: { sections: [...] }
  }
- `sections`: array of:
  - `{ id, title, type: "card", collapsible?, defaultCollapsed?, fields: [...] }`
- `fields`: typed definitions:
  - `{ id, label, kind: "select"|"slider"|"toggle"|"segmented"|"number"|"text"|"textarea"|"chips", default, min, max, step, options, visibleIf }`

### 7.2 UI renderer rules
- Render stable cards first: Source, Prompt.
- Then render model+mode dynamic sections in schema order.
- Hide unsupported fields entirely (not disabled clutter).
- Keep “Advanced” collapsed by default unless user expands.

### 7.3 Presets
- Allow “Save preset” per model:
  - storing field values by `modelId + mode`
- When switching model, load defaults or last used preset.

---

## 8) Interaction polish (required)
- Hover and focus states:
  - cards highlight on hover
  - inputs show accent focus ring
- Loading states:
  - skeleton thumbnails in left panel
  - progress overlay on canvas during generation
- Reduce border noise:
  - avoid outlines around every control; group within cards with spacing

---

## 9) Deliverables (what to implement)
1) Remove vertical separators; convert panels into rounded surfaces with spacing.
2) Left panel: collapsible rail + asset gallery (tabs).
3) Canvas: floating preview card + overlay toolbar + A/B compare slider.
4) Right inspector: segmented workflow mode + model selector + schema-driven dynamic settings cards + sticky CTA footer.
5) Implement model schemas for at least 3 models (Qwen Image / Nano Banana / Flux Kontext) to demonstrate dynamic “Generation/Advanced” differences.

---

## 10) Clarifications the agent should ask only if needed
- Compare slider source: should “Before” be **viewport capture** or **previous generation** (or selectable)? <- SELECTABLE
- Do you want separate prompts per mode (Generate vs Refine), or shared prompt with mode-specific modifiers? <- SEPARATE 
- Should “Camera” mode expose camera presets (FOV, yaw/pitch offsets), or only prompt-based “new angle”? <- Only prompt base new angle

---