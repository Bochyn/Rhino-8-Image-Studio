# Instalacja i Pierwsze Kroki

Ten przewodnik przeprowadzi Cię przez proces instalacji i uruchomienia Rhino Image Studio.

## 1. Wymagania Systemowe

Aby korzystać z aplikacji, Twój komputer musi spełniać następujące wymagania:

- **System operacyjny**: Windows 10 lub 11.
- **Oprogramowanie**: [Rhinoceros 8](https://www.rhino3d.com/) (zaktualizowany).
- **Klucz API**: Aktywne konto i klucz API na platformie [fal.ai](https://fal.ai/).

### Dla deweloperów (budowanie ze źródeł)
Dodatkowo wymagane są:
- **[.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)** (do backendu i pluginu).
- **[Node.js 18+](https://nodejs.org/)** (do interfejsu React).
- **Git** (do pobrania kodu).

---

## 2. Instalacja (Dla Użytkowników Końcowych)

*Uwaga: Jeśli pobrałeś gotową paczkę (release), pomiń sekcję budowania i przejdź do uruchamiania.*

Obecnie zalecaną metodą jest zbudowanie projektu ze źródeł (zobacz sekcję 3). W przyszłości udostępnimy gotowy instalator `.rhi` lub `.yak`.

---

## 3. Budowanie ze Źródeł (Dla Developerów)

### Krok 1: Pobranie kodu
```bash
git clone <adres-repozytorium>
cd "Rhino Image Studio"
```

### Krok 2: Budowanie Backendu i Pluginu (C#)
```bash
cd src
dotnet restore RhinoImageStudio.sln
dotnet build RhinoImageStudio.sln
```
Spowoduje to utworzenie plików:
- Plugin: `build\Debug\net48\RhinoImageStudio.rhp`
- Backend: `build\Debug\net8.0-windows\RhinoImageStudio.Backend.dll`

### Krok 3: Budowanie Interfejsu (React)
```bash
cd ../src/RhinoImageStudio.UI
npm install
npm run build
```
To skompiluje frontend i skopiuje go do folderu backendu, aby mógł być serwowany lokalnie.

---

## 4. Uruchamianie Aplikacji

System składa się z dwóch części, które muszą działać jednocześnie.

### Krok 1: Uruchom Backend
Backend zarządza komunikacją z AI. Musi działać w tle.
```bash
# W nowym oknie terminala:
cd "D:\Rhino Image Studio\build\Debug\net8.0-windows"
dotnet RhinoImageStudio.Backend.dll
```
Powinieneś zobaczyć: `Now listening on http://127.0.0.1:17532`. **Nie zamykaj tego okna.**

### Krok 2: Zainstaluj Plugin w Rhino
1. Otwórz Rhino 8.
2. Wpisz komendę `PlugInManager`.
3. Kliknij **Install...** i wskaż plik `build\Debug\net48\RhinoImageStudio.rhp`.
4. Upewnij się, że plugin jest na liście i ma status "Loaded".

### Krok 3: Otwórz Panel
Wpisz komendę:
```
RhinoImageStudio
```
Pojawi się panel boczny aplikacji.

---

## 5. Konfiguracja Klucza API

1. Zaloguj się na [fal.ai](https://fal.ai/) i wygeneruj klucz API.
2. W panelu Rhino Image Studio przejdź do zakładki **Settings** (ikona ⚙️).
3. Wklej klucz w pole "Fal.ai API Key".
4. Kliknij **Save**.

Gotowe! Możesz przejść do [Przewodnika Podstawowego](przewodniki/podstawy.md).
