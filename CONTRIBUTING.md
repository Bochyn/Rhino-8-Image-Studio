# Jak kontrybuować do Rhino Image Studio

Cieszymy się, że chcesz pomóc w rozwoju projektu! Oto przewodnik, który pomoże Ci zacząć.

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

## 🤝 Zasady Pull Request (PR)

1.  **Nazewnictwo Branchy**: Używaj formatu `type/opis`, np.:
    - `feature/nowy-slider`
    - `fix/blad-polaczenia`
    - `docs/aktualizacja-readme`
2.  **Opis Zmian**: W opisie PR napisz krótko, co zmieniłeś i dlaczego.
3.  **Screenshoty**: Jeśli zmieniasz wygląd (UI), **koniecznie** dołącz zrzut ekranu "Przed" i "Po".
4.  **Czysty Kod**:
    - Backend: Kod powinien być sformatowany zgodnie ze standardami C#.
    - Frontend: Nie zostawiaj `console.log` w kodzie produkcyjnym.

## ⚠️ Ważne Uwagi

- **Sekrety**: Nigdy nie commituj plików `appsettings.json` z prawdziwymi kluczami API.
- **Backend First**: Frontend (`.UI`) zależy od plików statycznych serwowanych przez Backend. Po dużych zmianach w UI zawsze uruchom `npm run build`.

Dziękujemy za Twój wkład!
