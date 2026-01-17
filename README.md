# Rhino Image Studio

**Rhino Image Studio** to zaawansowana wtyczka do **Rhinoceros 8**, która integruje generatywną sztuczną inteligencję (AI) z Twoim workflow projektowym. Przekształcaj proste widoki 3D w fotorealistyczne wizualizacje, warianty i materiały w kilka sekund.

![Status](https://img.shields.io/badge/Status-Development-orange)
![Platform](https://img.shields.io/badge/Platform-Windows-blue)
![Rhino](https://img.shields.io/badge/Rhino-8-green)

## 📚 Dokumentacja

Pełna dokumentacja projektu znajduje się w folderze [`/docs`](docs/index.md).

- **[Pierwsze Kroki](docs/pierwsze-kroki.md)** - Instalacja, wymagania i konfiguracja.
- **[Przewodnik Użytkownika](docs/przewodniki/podstawy.md)** - Jak generować obrazy, używać promptów i funkcji AI.
- **[Rozwiązywanie Problemów](docs/przewodniki/problemy.md)** - Pomoc przy błędach.
- **[Architektura](docs/api/architektura.md)** - Dla deweloperów.

## Szybki Start (Dla Developerów)

```bash
# 1. Pobierz repozytorium
git clone <repo-url>
cd "Rhino Image Studio"

# 2. Zbuduj backend i plugin (C#)
cd src
dotnet build RhinoImageStudio.sln

# 3. Zbuduj frontend (React)
cd RhinoImageStudio.UI
npm install && npm run build

# 4. Uruchom backend (musi działać w tle)
cd ../../build/Debug/net8.0-windows
dotnet RhinoImageStudio.Backend.dll

# 5. Zainstaluj plugin w Rhino (PlugInManager -> Install -> build/Debug/net48/RhinoImageStudio.rhp)
# 6. Uruchom komendę: RhinoImageStudio
```

## Funkcje

- 🎨 **Text-to-Image / Image-to-Image**: Generowanie na podstawie widoku z Rhino.
- 🔄 **Multi-angle**: Generowanie widoków z różnych stron.
- 🔍 **Upscaling**: Zwiększanie rozdzielczości do druku/prezentacji.
- 💾 **Historia**: Pełna historia iteracji zapisywana lokalnie.

## Licencja

MIT License. Zobacz [LICENSE](LICENSE) dla szczegółów.
