# EasyScript.io — Visual scripting studio v0.5.0

**Build real Luau and JavaScript by combining editable visual blocks.** This project is a static, privacy-friendly browser app with responsive layouts, local file management, and exportable scripts.

**[Open EasyScript.io](https://sillydev2026.github.io/EasyScript.io/)** · [Repository](https://github.com/SillyDev2026/EasyScript.io)

## New in v0.5 — 30+ improvements

### 18 new scripting blocks (36 total)

| Category | New blocks |
|---|---|
| Math | Random integer, Clamp number |
| Text | Join text, Text length |
| Lists | Create list, Append item, Remove item, List size, For each |
| Flow and functions | For number range, Return value, Break loop, Spawn parallel task |
| Roblox events | Player leaving, Character spawned |
| Roblox objects | Set attribute, Read attribute, Destroy instance |

New blocks extend the generated Luau/JavaScript source where appropriate. Roblox-only blocks produce Luau and a warning/comment when JavaScript is selected. The browser simulator supports some new list/text/math/loop expressions but is **not a full Luau runtime**; unsupported blocks now report explicit messages rather than silently doing nothing.

### Workspace Explorer: many files in one project

- Create and switch among **up to 24 files** in one workspace.
- File types: Script, LocalScript, ModuleScript, JavaScript.
- Rename, duplicate, and delete individual files; at least one must remain.
- Scrollable file tabs; Alt + 1 through Alt + 9 switches to the first nine files.
- Each file retains its own blocks, language, and generated code.
- The prior single-script editor autosaves into a new one-file workspace on upgrade.
- Workspace data is stored locally. Export/import a complete **.easyscript-workspace.json** backup.
- Export a **source manifest JSON** that contains generated code for every file, or copy all source text into the clipboard. A source manifest is **not a ZIP** and does not upload files to Roblox.
- Individual project export and snapshots remain available for backward compatibility.

### Editing improvements

- Copy an entire block subtree (including nested conditions or functions) and paste it into a different script file.
- Paste after any block or at the end of the visual script.
- Collapse and expand individual visual blocks to handle longer projects.
- Four new templates: List Operations, Number Range, Roblox Attribute Door, Text Builder.
- Existing template library, live diagnostics, undo/redo, drag/drop, block search, favorites, and themes remain.

### Responsive studio from v0.4

- Percentage-based desktop panel widths and tablet two-column layout.
- Mobile Blocks / Workspace / Code tabs, including folded phone layouts.
- Midnight/Daylight themes, comfortable/compact controls, focus mode.
- Code line numbers, wrapping, layout reset, searchable structure.
- Ultra tools: standalone Roblox System Builder, Structure Map, and a **static heuristic** Script Health Audit.

## Get started

1. Choose a template or click **New file** to create a script.
2. Insert blocks from the left library or use the Add button.
3. Edit values and arrange nested blocks with drag/drop or move controls.
4. Click **Manage files** to rename, duplicate, delete, or export the entire workspace.
5. Use block **Copy** and **Paste** controls to reuse logic across scripts.
6. Export generated code and **test it in the correct Roblox Studio context** (for Roblox LuaU scripts) or JavaScript runtime.

## Development

This is a zero-runtime-dependency static website. Node.js 20+ is recommended for checking and testing.

~~~bash
git clone https://github.com/SillyDev2026/EasyScript.io.git
cd EasyScript.io
python3 -m http.server 8080
# Open http://localhost:8080
npm run check
npm test
~~~

### Project layout

~~~text
index.html
styles.css
src/app.js             Main editor + file switching
src/engine.js          Core primitives, Luau/JS code generator, lint, simulation
src/extended.js        18 new block definitions and generators
src/workspace.js       Versioned local multi-file workspace
src/workspace-ui.js    File Explorer, tabs, bundle import/export
src/clipboard.js       Reusable block subtrees between files
src/library.js         Local project snapshots
src/highlight.js       Text-based, XSS-safe code coloring
src/studio.js          Themes, responsive controls, Ultra UI
src/ultra.js           Three Ultra tools and heuristics
tests/*.test.js        Automated regression and compatibility tests
~~~

## Limitations and safeguards

- No accounts, online cloud sync, multiplayer editing, server execution, AI APIs, GitHub sync, or Roblox Studio plugin.
- Projects are kept in browser localStorage. Clearing site data can erase them; export workspace backups regularly.
- Imports are validated and limited in file count and size. Do not share projects containing private data.
- Roblox event templates and scripts need context-appropriate placement and permissions/security validation in Roblox Studio.
- Code expressions are editable raw source, not sandboxed by static diagnostics; exported scripts must be reviewed before execution.
- The **simulation** is a small local evaluator and explicitly refuses Roblox engine operations.
- The **Ultra audit** is a heuristic checker, not measured FPS, memory, latency, formal verification, or security auditing.
- Visual blocks are movable/nestable cards with drop zones, not yet fully socket-connected Scratch/Blockly nodes.
- No open-source license has been chosen yet.

## Potential next stage

Full socket-based expression blocks; a Roblox Studio companion plugin; integrated multi-file dependency/require graph; optional authenticated cloud collaboration and secure publishing.
