# Rhino Image Studio

Rhino Image Studio to zaawansowana wtyczka do programu **Rhinoceros 8** (Windows), która przekształca widoki 3D w wysokiej jakości wizualizacje generowane przez sztuczną inteligencję (AI). Dzięki integracji geometrii 3D z modelami generatywnymi, architekci i projektanci mogą błyskawicznie iterować nad koncepcjami projektowymi.

### Główne funkcje:
*   **Generacja AI**: Tworzenie fotorealistycznych obrazów na podstawie zrzutów ekranu z Rhino i opisów tekstowych (promptów).
*   **Multi-angle Generation**: Automatyczne generowanie spójnych widoków modelu pod różnymi kątami.
*   **Upscaling**: Powiększanie i poprawianie jakości wygenerowanych obrazów do rozdzielczości prezentacyjnych.
*   **Historia sesji**: Przechowywanie wszystkich iteracji, promptów i ustawień w lokalnej bazie danych SQLite.

### Architektura:
Aplikacja składa się z trzech głównych komponentów:
1.  **Plugin Rhino (C#)**: Odpowiada za przechwytywanie widoków (RhinoCommon) i wyświetlanie panelu użytkownika.
2.  **Backend (ASP.NET Core)**: Lokalny serwer API pośredniczący w komunikacji z usługami fal.ai, zarządzający kolejką zadań i bazą danych.
3.  **Interfejs użytkownika (React)**: Nowoczesny panel webowy hostowany wewnątrz Rhino za pomocą Microsoft WebView2.

---

## 2. Wymagania systemowe

Aby uruchomić Rhino Image Studio, Twój system musi spełniać następujące wymagania:
*   **System operacyjny**: Windows 10 lub 11.
*   **Rhinoceros 8**: Zainstalowana wersja programu Rhino.
*   **[.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)**: Wymagany do zbudowania backendu i pluginu.
*   **[Node.js 18+](https://nodejs.org/) i npm**: Wymagane do zbudowania interfejsu użytkownika (React).
*   **Visual Studio 2022** (opcjonalnie) lub **VS Code** do edycji kodu.
*   **Klucz API [fal.ai](https://fal.ai/)**: Niezbędny do korzystania z funkcji AI.

---

## 3. Instalacja krok po kroku

### 3.1. Klonowanie repozytorium
Otwórz terminal (np. PowerShell lub CMD) i pobierz kod źródłowy:
```bash
git clone <repo-url>
cd "Rhino Image Studio"
```

### 3.2. Budowanie projektu C#
Przejdź do folderu źródłowego i zbuduj całe rozwiązanie:
```bash
cd src
dotnet restore RhinoImageStudio.sln
dotnet build RhinoImageStudio.sln
```
**Co robią te komendy?**
*   `dotnet restore`: Pobiera wszystkie niezbędne biblioteki (pakiety NuGet) zdefiniowane w projekcie.
*   `dotnet build`: Kompiluje kod źródłowy. Po wykonaniu tej komendy powstaną pliki wykonywalne w folderze `build\Debug\`.
    *   Plugin: `build\Debug\net48\RhinoImageStudio.rhp`
    *   Backend: `build\Debug\net8.0-windows\RhinoImageStudio.Backend.dll`

### 3.3. Budowanie interfejsu React
Zbuduj frontend, aby pliki statyczne trafiły do backendu:
```bash
cd src/RhinoImageStudio.UI
npm install
npm run build
```
**Wyjaśnienie**: Komenda `npm run build` kompiluje aplikację React i kopiuje gotowe pliki do folderu `src/RhinoImageStudio.Backend/wwwroot/`, skąd będą serwowane przez lokalny backend.

---

## 4. Uruchamianie aplikacji

### 4.1. Uruchomienie backendu (WYMAGANE JAKO PIERWSZE)
Backend musi działać w tle, aby plugin mógł komunikować się z AI.
Otwórz nowy terminal i wpisz:
```bash
cd build\Debug\net8.0-windows
dotnet RhinoImageStudio.Backend.dll
```
*   **Oczekiwany wynik**: Powinieneś zobaczyć komunikat: `Now listening on http://127.0.0.1:17532`.
*   **Uwaga**: Nie zamykaj tego okna terminala podczas pracy z wtyczką!
*   *Alternatywnie (dla programistów)*: Możesz użyć `dotnet run` bezpośrednio w folderze `src/RhinoImageStudio.Backend`.

### 4.2. Instalacja pluginu w Rhino 8
1.  Uruchom **Rhinoceros 8**.
2.  W linii poleceń Rhino wpisz `PlugInManager` i naciśnij Enter.
3.  W oknie, które się pojawi, kliknij przycisk **Install...**.
4.  Przejdź do folderu projektu: `build\Debug\net48\` i wybierz plik `RhinoImageStudio.rhp`.
5.  Upewnij się, że plugin został załadowany (status "Loaded").
6.  Zrestartuj Rhino, aby mieć pewność, że wszystkie komponenty zainicjowały się poprawnie.

### 4.3. Otwieranie panelu Image Studio
*   W linii poleceń Rhino wpisz polecenie: `RhinoImageStudio`.
*   LUB: Przejdź do górnego menu **Panels** i wybierz z listy **Image Studio**.

---

## 5. Konfiguracja klucza API fal.ai

Wszystkie operacje AI są wykonywane przez platformę fal.ai.
1.  Zarejestruj się na stronie [fal.ai](https://fal.ai/).
2.  Przejdź do sekcji **API Keys** w swoim panelu użytkownika i wygeneruj nowy klucz.
3.  W programie Rhino, w otwartym panelu **Image Studio**, przejdź do zakładki **Settings** (ikona koła zębatego).
4.  Wklej swój klucz API w odpowiednie pole i zapisz ustawienia.

---

## 6. Pierwsze użycie - tutorial

1.  **Otwórz model 3D** w Rhino lub stwórz prostą bryłę.
2.  **Ustaw widok**: Wybierz widok Perspective i ustaw model tak, jak chcesz go zobaczyć na wizualizacji (zalecany tryb "Shaded").
3.  **Capture**: Kliknij przycisk **Capture** w panelu Image Studio. Zobaczysz podgląd swojego widoku w oknie wtyczki.
4.  **Prompt**: W polu tekstowym wpisz opis tego, co chcesz uzyskać, np.:
    > *modern villa, forest, cinematic lighting, architectural photography, high detail*
5.  **Generate**: Kliknij przycisk **Generate**.
6.  **Wynik**: Poczekaj kilka sekund (pasek postępu poinformuje Cię o statusie). Gotowy obraz pojawi się w galerii.

---

## 7. Rozwiązywanie problemów (Troubleshooting)

*   **Backend nie startuje**: Upewnij się, że port `17532` nie jest zajęty przez inną aplikację. Sprawdź, czy masz zainstalowane środowisko wykonawcze .NET 8.
*   **Plugin nie ładuje się**: Sprawdź, czy używasz Rhino 8. Wtyczka wymaga .NET Framework 4.8, który jest standardem w Rhino 8 na Windows.
*   **Brak połączenia z fal.ai**: Zweryfikuj poprawność klucza API w ustawieniach i sprawdź połączenie z internetem.
*   **Błąd WebView2**: Jeśli panel jest pusty lub wyświetla błąd, zainstaluj [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

---

## 8. Struktura projektu

*   `src/RhinoImageStudio.Shared/`: Wspólne modele danych i kontrakty (używane przez backend i plugin).
*   `src/RhinoImageStudio.Backend/`: Kod źródłowy serwera ASP.NET Core.
*   `src/RhinoImageStudio.UI/`: Projekt React (frontend).
*   `src/RhinoImageStudio.Plugin/`: Kod źródłowy wtyczki Rhino (.rhp).
*   `build/`: Skompilowane pliki gotowe do użycia.

---

## 9. Licencja

Ten projekt jest udostępniany na licencji **MIT License**. Szczegóły znajdziesz w pliku LICENSE (jeśli został dołączony).
