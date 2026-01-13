# 🧪 Poradnik Testera - Rhino Image Studio

## Przegląd komponentów do testowania

| Komponent | Jak uruchomić | Jak sprawdzić |
|-----------|---------------|---------------|
| **Backend API** | Terminal | `http://localhost:17532/api/health` |
| **Frontend React** | Przeglądarka | `http://localhost:17532/` |
| **Plugin Rhino** | Rhino 8 | Komenda `RhinoImageStudio` |

---

## KROK 1: Test Backend (NAJPIERW!)

### 1.1 Uruchom backend
```bash
cd "D:\Rhino Image Studio\src\RhinoImageStudio.Backend"
dotnet run
```

### 1.2 Oczekiwany output
```
Rhino Image Studio Backend starting on http://localhost:17532
Job Processor started
Now listening on: http://127.0.0.1:17532
```

### 1.3 Weryfikacja w przeglądarce
Otwórz: **http://localhost:17532/api/health**

✅ **Sukces:** Powinieneś zobaczyć odpowiedź JSON (np. `{"status":"healthy"}` lub pusty response 200 OK)

❌ **Błąd:** Jeśli strona nie odpowiada - backend nie działa

---

## KROK 2: Test Frontend (w przeglądarce)

### 2.1 Otwórz UI w przeglądarce
Podczas gdy backend działa, otwórz: **http://localhost:17532/**

### 2.2 Co powinieneś zobaczyć
- Nowoczesny interfejs React
- Panel boczny z opcjami
- Przycisk "Capture" (nieaktywny bez Rhino)
- Pole na prompt tekstowy
- Historia sesji

### 2.3 Sprawdź konsolę deweloperską
1. Naciśnij `F12` w przeglądarce
2. Przejdź do zakładki **Console**
3. Nie powinno być czerwonych błędów JavaScript

✅ **Sukces:** UI ładuje się bez błędów  
❌ **Błąd:** Biała strona lub błędy JS w konsoli

---

## KROK 3: Test Plugin w Rhino 8

### 3.1 Przygotowanie
1. **Zamknij Rhino** jeśli jest otwarty
2. **Przebuduj plugin** (jeśli jeszcze nie):
   ```bash
   cd "D:\Rhino Image Studio\src"
   dotnet build RhinoImageStudio.sln
   ```

### 3.2 Instalacja pluginu
1. Otwórz **Rhino 8**
2. Wpisz: `PlugInManager` → Enter
3. Kliknij **Install...**
4. Znajdź: `D:\Rhino Image Studio\build\Debug\net48\RhinoImageStudio.rhp`
5. Kliknij **Open**
6. Upewnij się, że plugin ma status "Loaded"

### 3.3 Uruchomienie panelu
1. Wpisz w linii poleceń Rhino: `ShowImageStudio`
2. Panel powinien się otworzyć z boku

**Inne dostępne komendy:**
- `ImageStudio` - otwiera sesję
- `ImageStudioCapture` - przechwytuje widok
- `ShowImageStudio` - pokazuje panel

### 3.4 Co powinieneś zobaczyć
- Panel dokowany po prawej stronie
- Interfejs webowy (React UI) wewnątrz panelu
- W linii poleceń Rhino:
  ```
  Rhino Image Studio loading...
  Backend started successfully on http://localhost:17532
  Image Studio panel initialized: http://localhost:17532/index.html
  Rhino Image Studio loaded successfully.
  ```

✅ **Sukces:** Panel się otwiera, UI jest widoczne  
❌ **Błąd:** Pusty panel, błędy WebView2, komunikat o braku backendu

---

## KROK 4: Test pełnego przepływu (End-to-End)

### 4.1 Przygotowanie
1. Backend musi działać w terminalu
2. Rhino 8 otwarty z pluginem
3. Jakikolwiek model 3D w scenie (lub stwórz prosty Box)

### 4.2 Test Capture
1. Ustaw widok perspektywiczny w Rhino
2. W panelu Image Studio kliknij **Capture**
3. Powinieneś zobaczyć podgląd zrzutu ekranu w panelu

### 4.3 Test Generate (wymaga klucza fal.ai!)
1. Wpisz klucz API fal.ai w Settings
2. Wpisz prompt: `modern architecture, forest, sunlight`
3. Kliknij **Generate**
4. Poczekaj na wynik (pasek postępu)

---

## 🔄 Zarządzanie Backend i Frontend

### Zatrzymywanie Backend
W terminalu gdzie działa backend:
- Naciśnij `Ctrl + C`

Lub znajdź i zabij proces:
```bash
# Znajdź proces na porcie 17532
netstat -ano | findstr :17532

# Zabij proces (zamień PID na numer z poprzedniej komendy)
taskkill /PID <numer_pid> /F
```

### Restartowanie Backend
```bash
# Zatrzymaj (Ctrl+C), potem uruchom ponownie:
cd "D:\Rhino Image Studio\src\RhinoImageStudio.Backend"
dotnet run
```

### Frontend - tryb produkcyjny
Frontend jest serwowany przez Backend (pliki w `wwwroot/`).
- **Zatrzymanie:** Zatrzymaj Backend (frontend przestanie działać)
- **Restart:** Zrestartuj Backend

### Frontend - tryb deweloperski (hot reload)

**Uruchomienie:**
```bash
cd "D:\Rhino Image Studio\src\RhinoImageStudio.UI"
npm run dev
```
Dostępny pod: **http://localhost:5173/**

**Zatrzymanie:**
- Naciśnij `Ctrl + C` w terminalu

**Przebudowa produkcyjna:**
```bash
cd "D:\Rhino Image Studio\src\RhinoImageStudio.UI"
npm run build
```
Pliki trafiają do `../RhinoImageStudio.Backend/wwwroot/`

### Pełny reset wszystkiego

```bash
# 1. Zamknij Rhino 8 (żeby odblokować pliki)

# 2. Zabij wszystkie procesy dotnet
taskkill /IM dotnet.exe /F

# 3. Wyczyść cache i przebuduj
cd "D:\Rhino Image Studio\src"
dotnet clean RhinoImageStudio.sln
dotnet build RhinoImageStudio.sln

# 4. Przebuduj frontend
cd "D:\Rhino Image Studio\src\RhinoImageStudio.UI"
npm run build

# 5. Uruchom backend
cd "D:\Rhino Image Studio\src\RhinoImageStudio.Backend"
dotnet run

# 6. Otwórz Rhino 8 i załaduj plugin
```

---

## 🔧 Tryb deweloperski (dla programistów)

### Frontend w trybie dev (hot reload)
```bash
cd "D:\Rhino Image Studio\src\RhinoImageStudio.UI"
npm run dev
```
Otwórz: **http://localhost:5173/**

⚠️ W tym trybie frontend działa osobno od backendu. API calls mogą nie działać bez konfiguracji proxy.

### Backend w trybie watch
```bash
cd "D:\Rhino Image Studio\src\RhinoImageStudio.Backend"
dotnet watch run
```
Automatycznie przeładowuje po zmianach w kodzie.

---

## 📋 Checklist testera

### Przed testami
- [ ] .NET 8 SDK zainstalowany
- [ ] Node.js 18+ zainstalowany
- [ ] Rhino 8 zainstalowany
- [ ] Projekt zbudowany (`dotnet build`)
- [ ] Frontend zbudowany (`npm run build`)

### Testy podstawowe
- [ ] Backend startuje bez błędów
- [ ] `/api/health` odpowiada
- [ ] Frontend ładuje się w przeglądarce
- [ ] Brak błędów JS w konsoli
- [ ] Plugin instaluje się w Rhino
- [ ] Panel otwiera się komendą `RhinoImageStudio`
- [ ] WebView2 wyświetla UI

### Testy funkcjonalne
- [ ] Capture viewport działa
- [ ] Podgląd zrzutu widoczny
- [ ] Prompt można wpisać
- [ ] Settings otwiera się
- [ ] Klucz API można zapisać

### Testy z fal.ai (wymaga klucza)
- [ ] Generate zwraca obraz
- [ ] Progres jest widoczny
- [ ] Historia zapisuje wyniki
- [ ] Upscale działa

---

## 🚨 Częste problemy

| Problem | Rozwiązanie |
|---------|-------------|
| **Niebieski ekran + `sessions.filter is not a function`** | Bug naprawiony 2026-01-13. Przebuduj frontend: `cd src/RhinoImageStudio.UI && npm run build` i zrestartuj backend |
| Backend nie startuje | Sprawdź czy port 17532 jest wolny: `netstat -an \| findstr 17532` |
| Pusty panel w Rhino | Zainstaluj [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) |
| Plugin nie ładuje się | Sprawdź czy masz .NET Framework 4.8, zamknij Rhino i przebuduj |
| GUID Empty error | Przebuduj po zamknięciu Rhino (plik .rhp był zablokowany) |
| Frontend biała strona | Sprawdź czy `npm run build` było wykonane |
| Brak połączenia z API | Upewnij się że backend działa PRZED otwarciem Rhino |
| Port zajęty | `taskkill /PID <pid> /F` lub zmień port w konfiguracji |

---

## 📁 Ważne ścieżki

```
D:\Rhino Image Studio\
├── build\Debug\net48\RhinoImageStudio.rhp     ← Plugin do instalacji
├── build\Debug\net8.0-windows\                 ← Backend (dotnet run)
├── src\RhinoImageStudio.Backend\               ← Kod backendu
├── src\RhinoImageStudio.UI\                    ← Kod frontendu
├── src\RhinoImageStudio.Plugin\                ← Kod pluginu
└── _journal\                                   ← Dziennik pracy
```

---

## 🎯 Szybki test (5 minut)

```bash
# 1. Uruchom backend
cd "D:\Rhino Image Studio\src\RhinoImageStudio.Backend"
start cmd /k "dotnet run"

# 2. Poczekaj 5 sekund, potem otwórz przeglądarkę
start http://localhost:17532/

# 3. Jeśli UI się załadowało - sukces!
```

Jeśli wszystko działa w przeglądarce, możesz przejść do testów w Rhino 8.

---

## 🔑 Komendy szybkiego dostępu

| Akcja | Komenda |
|-------|---------|
| Uruchom backend | `cd "D:\Rhino Image Studio\src\RhinoImageStudio.Backend" && dotnet run` |
| Zatrzymaj backend | `Ctrl + C` |
| Uruchom frontend dev | `cd "D:\Rhino Image Studio\src\RhinoImageStudio.UI" && npm run dev` |
| Zbuduj frontend | `cd "D:\Rhino Image Studio\src\RhinoImageStudio.UI" && npm run build` |
| Zbuduj wszystko | `cd "D:\Rhino Image Studio\src" && dotnet build RhinoImageStudio.sln` |
| Wyczyść i zbuduj | `cd "D:\Rhino Image Studio\src" && dotnet clean && dotnet build` |
| Otwórz UI w przeglądarce | `start http://localhost:17532/` |
| Test health | `start http://localhost:17532/api/health` |
