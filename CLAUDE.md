# SPEC.md — Rhino Image Studio (Windows)  
Wersja: 0.2 (MVP Implemented + Refined UI)  
Status: Development / Open Source Preparation

## 1. Streszczenie (Executive Summary)
**Rhino Image Studio** to wtyczka dla Rhinoceros (Windows), która zamienia widok z viewportu (shaded / wireframe / inne display modes) w wysokiej jakości wizualizacje generowane przez modele AI. Użytkownik pracuje w Rhino jak zwykle, a w dockowanym panelu otrzymuje nowoczesny, webowy interfejs do generowania, iteracji, tworzenia wariantów, “multi-angle” i finalnego upscalowania obrazów.

## 2. Status Implementacji (2026-01-17)

### Zrealizowane (MVP)
- [x] **Rhino Plugin**: Panel dokowany, komunikacja z backendem.
- [x] **Backend (.NET 8)**: Obsługa API fal.ai, zarządzanie sekretami, serwowanie UI.
- [x] **Frontend (React)**: Nowy, ciemny interfejs "Studio", panel inspektora, obsługa historii.
- [x] **AI Integration**:
    - Generacja: Gemini / Nano Banana (przez fal.ai).
    - Multi-angle: Qwen (przez fal.ai).
    - Upscaling: RealESRGAN/inne (przez fal.ai).
- [x] **Dokumentacja**: Pełna struktura w folderze `/docs`.

### W trakcie / Planowane
- [ ] Batch processing (wiele widoków naraz).
- [ ] Zaawansowane zarządzanie sesjami (eksport/import).
- [ ] Lokalne modele (opcjonalnie w przyszłości).

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

---

## 5. Dane i Bezpieczeństwo
- **API Keys**: Przechowywane bezpiecznie w lokalnym magazynie sekretów (nie w kodzie).
- **Sesje**: Dane trzymane lokalnie w `src/RhinoImageStudio.Backend/bin/Debug/net8.0-windows/data`.
- **Poufność**: Obrazy są wysyłane do fal.ai tylko na czas generacji.

---

## 6. Notatki Rozwojowe (Internal)
- Decyzja o przejściu na `WebView2` zamiast natywnego Eto.Forms UI była kluczowa dla elastyczności interfejsu.
- Aktualny stack UI: React 18 + Tailwind + Lucide Icons.
- Wymagany refactoring obsługi błędów sieciowych (retry logic).

---

*Pełna dokumentacja użytkownika i dewelopera znajduje się w folderze `/docs`.*
