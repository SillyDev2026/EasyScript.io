# EasyScript.io — v0.6.0 Luau-first visual scripting studio

[Launch EasyScript.io](https://sillydev2026.github.io/EasyScript.io/) · [GitHub repository](https://github.com/SillyDev2026/EasyScript.io)

Build Roblox Luau and browser JavaScript using interactive blocks, local files, a responsive IDE, code previews and exports. No backend or account required.

## v0.6: 128 block types

- **36** established blocks for variables, logic, lists, text, flow, Roblox basics and functions.
- **73 new Roblox-focused blocks:** instance hierarchy, players and humanoids, vectors and colors, signals and events, RemoteEvents, UI properties and clicks, safe starter DataStore reads/writes, HTTP JSON, tasks, and globals.
- **19 new JavaScript blocks:** document queries, classes, text updates, localStorage, JSON, async fetch, event handlers and globals.

The block picker now supports language-aware filtering, explicit categories and full-catalog search. All new blocks have target-language output or an explicit unsupported-language comment and diagnostic.

## Cleaner generated code

Assignments and expressions stay on a single physical line.

~~~lua
local Coins = 100
local Color = Color3.fromRGB(255, 100, 50)
local Players = game:GetService("Players")
_G["Coins"] = (_G["Coins"] or 0) + (1)
~~~

Pasted multiline expressions are flattened for output and reported in diagnostics. Nested blocks generate indentation and closing constructs. Misplaced Break/Return blocks emit explanatory comments instead of illegal control flow. Invalid arbitrary raw expressions still require developer review and may fail in Roblox Studio.

**Simple globals:** Set, Read, Increase and Clear shared globals. Luau uses _G["Name"]; JavaScript uses globalThis["Name"]. Luau _G is limited to its runtime context and **does not synchronize server and client**. ModuleScripts and RemoteEvents remain more appropriate for large shared systems.

## Copy code and exports

- Copy current generated source from the output panel, with Ctrl/Cmd + Shift + C shortcut.
- If clipboard access fails (including some mobile browsers), open a selectable, read-only manual copy dialog.
- Copy all source code from the multi-file Explorer with the same fallback.
- Download individual Luau/JavaScript scripts, project backups, 24-file workspace JSON backups, and all-file source manifests.

## 9 additional editable starter packs (20 total)

Luau: Simple Globals, UI Button, Door Prompt, Player DataStore Read, Remote Reply, Vectors & Colors.

JavaScript: DOM Text, Local Storage, Fetch JSON.

These are editable blocks rather than opaque text. Examples are starting points, **not production security patterns**.

## Existing and improved studio features

- 24-file local Explorer with file switching, duplication, naming and deleting.
- Reuse nested block subtrees across scripts.
- Full responsive desktop percentage widths, tablet layout and mobile Blocks / Workspace / Code tabs.
- Light/dark themes, compact mode, focus mode, favorites, recent blocks.
- Syntax-colored code, line numbers, wrapping, diagnostics, limited simulation, local autosave.
- Three Ultra utilities: Roblox System Builder, Script Structure Map and heuristic Script Audit.
- Improved static audit analyzes the block hierarchy in a single traversal, including new warnings for expensive operations in per-frame event handlers.

## Development and verification

Runs as a static GitHub Pages site; Node.js 20+ is recommended for test commands.

~~~bash
git clone https://github.com/SillyDev2026/EasyScript.io.git
cd EasyScript.io
npm run check
npm test
python3 -m http.server 8080
~~~

Visit http://localhost:8080.

CI checks include source syntax checks and generator-wide coverage of **all 128 blocks**, parseable default JavaScript output, one-line assignment formatting, cross-language globals, DataStore temporary naming, legal nested Break/Return, workspace migration and clipboard operations.

## Limitations

- Roblox API blocks only work in the correct Roblox Studio runtime and Script/LocalScript context; test all exports before use.
- Browser simulation is intentionally limited. It is not Roblox and does not run arbitrary code.
- Static diagnostics and heuristic audit are **not a performance profiler, security review, or formal validation**.
- DataStore examples use basic protected calls, but not comprehensive retries, request budgets, data migrations, or durable save policies.
- RemoteEvents require server authorization, validation, and rate limiting.
- This is still a card-and-drop-zone editor, not yet fully socket-connected Scratch/Blockly.
- No hosted AI, cloud login, real-time teamwork, or direct Roblox publishing.
- Browser localStorage can disappear; export JSON backups.
- No license selected yet.

## Key modules

- src/engine.js — script generator, diagnostics and limited simulator
- src/roblox-blocks.js — extensive Roblox Luau catalog
- src/javascript-blocks.js — browser JavaScript catalog
- src/format.js — one-line expression formatting
- src/packs.js — editable starter packs
- src/code-copy.js — copy fallback
- src/app.js — editor controls, category search
- src/workspace.js and src/workspace-ui.js — multi-file projects
- src/studio.js and src/ultra.js — responsive UI and Ultra tools
- tests/ — generator and regression tests
