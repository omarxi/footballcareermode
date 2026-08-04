# AI Agent Guidelines

## ⚠️ CRITICAL: Preserving Core Architecture

When working on this project (FIFA Career Mode simulation), future AI agents MUST adhere to these strict rules to prevent critical application crashes and regressions:

### 1. `state.js` Initialization Sequence
The `CareerState` constructor and `selectUserClub` methods rely on a specific sequence of initialization functions. **DO NOT DELETE OR RENAME** any of the following core setup functions without updating all references in `bootApp()`, `constructor()`, and `selectUserClub()`:
- `initSquad()`
- `initLeagueTable()` (Creates `this.standings` array; without this, the game crashes instantly)
- `init13TeamUCL()` (or any European competition init)
- `initDomesticCup()`
- `initFixtures()` (MUST be called last to interleave all competition schedules)

### 2. Using Regular Expressions (`re.sub`) for Refactoring
When writing Python scripts to refactor JavaScript code (like replacing large blocks of competition logic):
- **AVOID using greedy/lazy matchers (`.*?`) across multiple functions.**
- If you use `r'functionA\(\)\s*\{.*?\}\s*functionC\(\)\s*\{.*?\}'`, you risk silently deleting `functionB()` that sits between them!
- **Instead:** Use `replace_file_content` (or explicit `replace()` strings in Python) for surgical swaps, or split your regex replacements per function to guarantee you only remove what you intend to remove.

### 3. Competitions Rendering in `app.js`
The UI is strictly separated into tabs (`.tab-btn`). If you add a new sub-tab or competition view (like `renderCompetitionsHub`), you MUST:
- Ensure the render function is called in `bootApp()` so it renders on initial load.
- Ensure the render function is called inside the `initUI()` tab-switch listener when the user navigates to that tab.
- Ensure the render function is called inside `advanceDay()` and `quickSimMatch()` so the DOM updates live as the calendar simulates fixtures.

*By adhering to these rules, you will prevent `ReferenceError: state is not defined` crashes caused by constructor failures.*
