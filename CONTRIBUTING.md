# Jak kontrybuować do Rhino Image Studio

Cieszymy się, że chcesz pomóc w rozwoju projektu! Stosujemy standard **Conventional Commits** oraz ściśle określony format Pull Requestów.

## 🛠️ Wymagania wstępne

Aby pracować nad tym projektem, potrzebujesz:
1.  **Windows 10/11** (Wtyczka działa tylko na Windows).
2.  **Rhinoceros 8** (Wymagany do uruchomienia pluginu).
3.  **.NET 8.0 SDK** (Do backendu).
4.  **Node.js 18+** (Do frontendu).

## 🚀 Szybki Start (Development)

Architektura projektu wymaga uruchomienia dwóch procesów: Backendu (API) i środowiska Rhino.

### 1. Pobierz kod
```bash
git clone https://github.com/TwojNick/Rhino-Image-Studio.git
cd Rhino-Image-Studio
```

### 2. Przygotuj Backend (C#)
Backend zarządza komunikacją z AI.
```bash
cd src/RhinoImageStudio.Backend
dotnet restore
dotnet build
```

### 3. Przygotuj Frontend (React)
Frontend jest osadzony w Rhino.
```bash
cd src/RhinoImageStudio.UI
npm install
# Aby zbudować wersję produkcyjną (kopiuje pliki do backendu):
npm run build 
```

### 4. Uruchamianie
1.  **Uruchom Backend**: `cd src/RhinoImageStudio.Backend && dotnet run`
2.  **Zainstaluj Plugin**: W Rhino wpisz `PlugInManager`, kliknij "Install" i wybierz `build/Debug/net48/RhinoImageStudio.rhp`.
3.  **Otwórz Panel**: Wpisz komendę `RhinoImageStudio`.

---

## 📋 Format Tytułu PR (Conventional Commits)

Używamy formatu:
```
<type>(<scope>): <summary>
```

### Types (Wymagane)

| Typ        | Opis                                             | Changelog |
|------------|--------------------------------------------------|-----------|
| `feat`     | Nowa funkcjonalność                              | Tak       |
| `fix`      | Naprawa błędu                                    | Tak       |
| `perf`     | Poprawa wydajności                               | Tak       |
| `test`     | Dodanie lub poprawa testów                       | Nie       |
| `docs`     | Tylko zmiany w dokumentacji                      | Nie       |
| `refactor` | Zmiana kodu (bez fixów i feature'ów)             | Nie       |
| `build`    | System budowania lub zależności                  | Nie       |
| `ci`       | Konfiguracja CI                                  | Nie       |
| `chore`    | Zadania rutynowe, maintenance                    | Nie       |

### Scopes (Opcjonalne, zalecane)

- `UI` - Zmiany w frontendzie (React)
- `Backend` - Zmiany w API (.NET)
- `Plugin` - Zmiany we wtyczce Rhino (.NET 4.8)
- `AI` - Integracje z modelami (fal.ai)
- `Docs` - Dokumentacja

### Zasady Podsumowania (Summary)

- Używaj trybu rozkazującego (angielski): "Add" a nie "Added"
- Wielka litera na początku
- Brak kropki na końcu
- Dodaj suffix `(no-changelog)` aby pominąć w changelogu

### Przykłady

```bash
feat(UI): Add dark mode toggle
fix(Backend): Resolve WebSocket connection timeout
docs: Update installation guide (no-changelog)
feat(AI)!: Upgrade to SDXL model (Breaking Change)
```

---

## 📝 Treść PR (PR Body)

Każdy PR powinien zawierać (szablon jest dostępny w `.github/pull_request_template.md`):

1.  **Summary**: Co robi ten PR i jak to przetestować.
    - Wymagane zdjęcia/video dla zmian w UI.
2.  **Related Issues**: Linki do issues na GitHubie.
    - Używaj słów kluczowych: `closes #123`, `fixes #123`.
3.  **Checklist**:
    - [ ] PR title zgodny z konwencją
    - [ ] Dokumentacja zaktualizowana
    - [ ] Testy (manualne/automatyczne)

---

## ⚠️ Ważne Uwagi

- **Sekrety**: Nigdy nie commituj plików `appsettings.json` z prawdziwymi kluczami API.
- **Backend First**: Frontend (`.UI`) zależy od plików statycznych serwowanych przez Backend. Po dużych zmianach w UI zawsze uruchom `npm run build`.

Dziękujemy za Twój wkład!
