# AGENTS.md — Rhino Image Studio Team Protocols

## 0) Project overview (what this repo is)
Rhino Image Studio is a **Windows-only Rhino 8 plugin** that hosts a **web UI** (React) inside Rhino (WebView2/Eto), backed by a **local ASP.NET Core backend** (localhost) that proxies to **fal.ai** and manages persistence (SQLite + file storage).

**Primary Goal:** Implement the Rhino plugin (C#/.NET + Eto.Forms + React + fal.ai) as defined in `SPEC.md`.

**Single source of truth for architecture/product intent:** `SPEC.md`.

### High-level components
- **Rhino plugin (net48)**: RhinoCommon integration, viewport capture, hosting the panel and bridge to JS.
- **Backend (net8.0-windows)**: local API, job queue/processor, SQLite, file storage, fal.ai client, SSE.
- **UI (React/Vite/TS/Tailwind)**: SPA served by backend and displayed in Rhino via WebView2.

### Repository structure (map)
A detailed, living “map of folders” is maintained here:
- `_journal/notatki/Mapa Katalogów.md`

Use that map when you need:
- to understand **where a feature should live**
- to follow **existing boundaries** (Plugin ↔ Backend ↔ UI ↔ fal.ai)
- to find **key files quickly**

---

## 1) Identity & Mission
You are the **Rhino Image Studio Team** — an elite unit orchestrated by **Sisyphus**. Your mission is to build the application defined in `SPEC.md` using the full power of the Oh My OpenCode ecosystem.

---

## 2) Repo layout (quick index)
> Full details + diagrams: `_journal/notatki/Mapa Katalogów.md`

### Root
- `AGENTS.md` — team protocols / how we work
- `README.md` — build/run (dev) instructions
- `SPEC.md` — product spec + target architecture
- `_journal/` — mandatory work logs (and notes)
- `src/` — all source code (solution + projects)
- `build/` — build artifacts (see `src/Directory.Build.props` for BaseOutputPath)
- `obj/` — MSBuild intermediate outputs

### `src/` (solution)
- `src/RhinoImageStudio.sln`
- `src/RhinoImageStudio.Plugin/` — Rhino plugin (net48)
- `src/RhinoImageStudio.Backend/` — ASP.NET Core backend (net8.0-windows)
- `src/RhinoImageStudio.Shared/` — shared contracts/models (net48;net8.0)
- `src/RhinoImageStudio.UI/` — React UI (Vite + TS + Tailwind)

---

## 3) Build, run, (tests)
This repo is Windows-first.

### Prereqs
- Windows 10/11
- Rhino 8 (Windows)
- .NET 8 SDK
- Node.js 18+ (npm)

### Build (C# solution)
From repo root:
```bash
cd src

dotnet restore RhinoImageStudio.sln
dotnet build RhinoImageStudio.sln
```
Notes:
- Build outputs go to `build/` because `src/Directory.Build.props` sets `BaseOutputPath`.

### Build (UI — production bundle)
```bash
cd src/RhinoImageStudio.UI

npm install
npm run build
```
Notes:
- `npm run build` runs `tsc && vite build`.
- The production UI is served by the backend from `src/RhinoImageStudio.Backend/wwwroot/`.

### Run backend (MUST be started first)
Start backend (this also serves the production frontend from `wwwroot/`):
```bash
cd "D:\Rhino Image Studio\src\RhinoImageStudio.Backend"
dotnet run
```
Verify backend health:
- `http://localhost:17532/api/health`

Alternative (run built artifact):
```bash
cd build/Debug/net8.0-windows

dotnet RhinoImageStudio.Backend.dll
```

### Run UI in browser (smoke test)
With backend running, open:
- `http://localhost:17532/`

### Frontend dev mode (hot reload)
```bash
cd "D:\Rhino Image Studio\src\RhinoImageStudio.UI"

npm run dev
```
Dev server:
- `http://localhost:5173/`

⚠️ In this mode the frontend runs separately from the backend; API calls may require proxy configuration.

### Backend dev mode (watch)
```bash
cd "D:\Rhino Image Studio\src\RhinoImageStudio.Backend"

dotnet watch run
```

### Run plugin in Rhino (manual install)
1. Ensure backend is already running.
2. Build solution (see above).
3. In Rhino 8: `PlugInManager` → **Install...** → select `build\Debug\net48\RhinoImageStudio.rhp`.
4. Restart Rhino if needed.
5. Open panel using command: `ShowImageStudio`.

Other available commands (useful during testing):
- `ImageStudio` — open/toggle the panel
- `ImageStudioCapture` — capture current viewport

### Tests
- Currently there are **no test projects** in the repo.
- Verification baseline (required):
  - backend starts: `dotnet run` in `src/RhinoImageStudio.Backend`
  - health endpoint OK: `GET /api/health`
  - UI loads (served by backend): `http://localhost:17532/` (no JS console errors)
  - rebuild C# solution when you change plugin/backend/shared:
    - `cd "D:\Rhino Image Studio\src" && dotnet build RhinoImageStudio.sln`
  - rebuild UI production bundle when you change frontend:
    - `cd "D:\Rhino Image Studio\src\RhinoImageStudio.UI" && npm run build`
  - manual Rhino smoke test: install plugin → `ShowImageStudio` → Capture triggers backend request

> Canonical tester runbook: `_journal/notatki/Testy.md`

---

## 4) Team Structure (The Sisyphus Squad)
We operate as a specialized collective. **Sisyphus** is the orchestrator; do not attempt to do everything yourself. Delegate ruthlessly to the specialists below based on the configuration:

| Agent | Role & Responsibility in Rhino Image Studio |
|-------|---------------------------------------------|
| **Sisyphus** | **Lead / Orchestrator**. Managing the plan, coordinating sub-agents, and ensuring `SPEC.md` alignment. Uses `google/antigravity-claude-opus-4-5-thinking-max`. |
| **oracle** | **Senior Architect**. Consult on complex C#/.NET patterns, RhinoCommon architecture, threading issues, and difficult refactoring. |
| **frontend-ui-ux-engineer** | **UI Specialist**. Responsible for the **Web UI (React/TypeScript)** and its hosting within **Eto.Forms**. Handles all visual aspects (CSS, layout, components). |
| **librarian** | **Researcher**. The **ONLY** source of truth for external docs. MUST use `Context7` and `websearch` to find documentation for **RhinoCommon**, **Eto.Forms**, and **fal.ai**. |
| **explore** | **Codebase Navigator**. Uses `ast-grep` and `grep` to understand the project structure as it grows. |
| **document-writer** | **Scribe**. Updates `SPEC.md`, writes `README.md`, and maintains technical documentation. |
| **multimodal-looker** | **Visual Analyst**. Analyzes reference images or UI mockups if provided. |

---

## 5) Tooling & capabilities protocols
**CRITICAL:** You have access to a powerful suite of tools. **USE THEM.** Do not rely on training data alone.

### A. Context7 (The Library of Alexandria)
- **Mandatory for API Calls:** Before writing code for RhinoCommon, Eto, or fal.ai, use `context7_resolve-library-id` and `context7_query-docs`.
- **No Hallucinations:** Verify method signatures (e.g., `Rhino.Display.ViewCaptureSettings`) using Context7 or `grep_app_searchGitHub`.

### B. MCP (Model Context Protocol) & External Tools
- **Full Utilization:** Use all enabled MCP servers and tools provided in the environment.
- **Web Search:** Use `websearch_web_search_exa` for latest tech trends or solving obscure .NET errors.
- **GitHub Search:** Use `grep_app_searchGitHub` to find real-world usage examples of Eto.Forms or RhinoCommon.

### C. Helpful local CLI tools (when working in this repo)
- `dotnet` — build/run the C# solution and backend
- `npm` — build the UI
- `gh` — GitHub PRs/issues (when applicable)
- `ast-grep` / `sg` — structural search/refactors
- `grep` / `rg` — text search across repo

---

## 6) Git workflow (branches + PRs)
This repo uses a PR-based workflow.

### Branches
- **`dev`**: the **default branch**. Day-to-day integration happens here.
- **`master`**: the “stable/mainline” branch.
- **Policy:** `dev` should always be kept **equivalent to `master`** (same commits), unless we explicitly decide otherwise.

### Feature development
- Always work on a feature branch:
  - Naming: `feature/<short-kebab-case>` (e.g. `feature/sse-job-progress`)
- Open a PR **into `dev`**.
- Avoid long-lived branches; rebase/merge as agreed by maintainers.

### PR expectations
- Title: clear, action-oriented.
- Description:
  - what changed + why
  - how to verify (commands + manual steps)
  - link to issue/spec section if relevant
- Never commit secrets (API keys, local config).

---

## 7) Workflow for implementing a feature
1. **Plan First:** Sisyphus updates the plan based on `SPEC.md`.
2. **Research:** Librarian checks docs via Context7.
3. **Delegate:** Sisyphus assigns tasks (e.g., "Frontend Agent, build the React component").
4. **Implement:** Builder/Specialist writes code.
5. **Verify:** Run build/tests (see section 3) and do a minimal manual smoke test if relevant.
6. **Journal:** Log the work in `_journal`.
7. **PR:** Work happens on `feature/*` and is delivered via PR into `dev`.

---

## 8) Mandatory Work Journal
To ensure transparency and progress tracking across this multi-agent system:

**Rule:**
After completing any significant unit of work, you **MUST** append a log entry to the `_journal` directory.

**Format:**
- **File:** `_journal/YYYY-MM-DD-<AgentName>.md` (e.g., `_journal/2026-01-12-frontend-ui-ux-engineer.md`)
- **Content:**
  ```markdown
  ## [HH:MM:SS] Task Summary
  - **Action:** Briefly describe what was done.
  - **Files Touched:** List key files modified.
  - **Tools Used:** (e.g., Context7, MCP, etc.)
  - **Status:** Success / Failed / Blocked.
  - **Next:** What should happen next.

  *Signed: <AgentName>*
  ```

---

## 9) Pointers / task-specific guidance
- Product/architecture spec: `SPEC.md`
- Build/run instructions (dev): `README.md`
- Repo structure + flow diagrams: `_journal/notatki/Mapa Katalogów.md`
- Work logs (what changed recently and why): `_journal/`
