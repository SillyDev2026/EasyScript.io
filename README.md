# EasyScript.io v2.0.0 — Visual Development and Project Workflow Upgrade

**Luau-first browser visual scripting** with 172 built-in blocks, a multi-file workspace, responsive layouts, Ultra tools and an optional manual Roblox Studio importer.

[Launch](https://sillydev2026.github.io/EasyScript.io/) · [GitHub repository](https://github.com/SillyDev2026/EasyScript.io)

## Milestones: v1.5 through v2.0

### v1.5–v1.6 — Persisted connected expressions

- Nested typed expression nodes can be dragged between slots or copied/pasted using buttons that also work on touch screens.
- Saved expression trees survive local autosave, workspace backups, ZIP/JSON exports, imports and undo/redo.
- Reopening the expression editor restores the visual tree. Manual edits to the raw field detach the saved tree to prevent stale values from silently reappearing.
- Extra less-than, greater-or-equal, inequality and modulo operators. Common arithmetic and boolean source expressions can be reconstructed as socket trees without executing source.
- Unsupported or unsafe expression structures are rejected or explicitly diagnosed.

### v1.7 — Conservative source-to-block importer

- Open **Developer Workbench → Code → Blocks** and paste source.
- Supports simple Luau/JavaScript variables, assignments, increments, prints, comments, conditions, while/repeat loops and functions. Also supports Luau waits, typed variable declarations, and simple PlayerAdded events.
- Reports exact line numbers for unsupported statements and nesting errors.
- All-or-nothing: errors prevent the current visual project from being replaced; successful conversion still requires confirmation.
- This is a limited parser, **not a lossless Luau or JavaScript AST round-trip**. Complex Roblox APIs and unsupported language constructs cannot be safely reconstructed.

### v1.8–v1.9 — Offline change review and conflict-safe imports

- **Offline patches** saves a local baseline, compares file additions/changes/deletions and exports a shareable JSON patch.
- Incoming patches are inspected before application. Changes are refused if their base content fingerprint does not match the current workspace.
- Fingerprints are not security signatures. There is no hosted GitHub sync, authentication or realtime multiplayer editing.

### v2.0 — Studio runtime profiling scaffold

- The **Studio profiler** tab exports a Luau Profiler ModuleScript and a separate example Script.
- Inside Roblox Studio you may manually wrap selected callbacks with Profiler.measure to measure elapsed time in milliseconds, count, average, maximum and failures.
- The website itself does **not** connect to a running game, inspect remote runtime state or act as a live debugger.

### UI, exporting and verification

- Keeps v1.4 percentage-width desktop layout, tablet split layout, folded/mobile tabs, safe-area padding and adjustable UI scaling.
- Developer Workbench includes code conversion, offline patches, expression graph inspector, static project preflight and the Studio profiler.
- The workspace ZIP exporter includes individual generated Luau/JS files, editable backup and user-defined custom block definitions.

## Getting started

1. Click **◇ Build** beside an expression field. Drag nodes between sockets or use the Copy/Paste buttons, then apply the expression.
2. Open the v2 workbench's Code → Blocks panel to try supported source import. Unsupported source never replaces your existing script.
3. In Offline patches set a baseline, edit some files, export a patch and review the change list before any import.
4. In Studio profiler download the separate ModuleScript and example, inspect both, and run them manually in Roblox Studio.

## Local checks

~~~sh
npm run check
npm test
python3 -m http.server 8080
~~~

## Important boundaries

**This is the v2 browser-app release, not the completion of all previously proposed infrastructure-dependent Ultra systems.** The following remain unimplemented: a full Blockly/Scratch snap-to-socket canvas; universal, lossless bidirectional Luau parsing; live Roblox Studio synchronization/debugging; hosted cloud backups; OAuth GitHub sync; live multiplayer collaboration; and hosted AI coding assistance. These require dedicated infrastructure or much larger language tooling. Existing Studio import is manual and one-way.

All static checks and heuristics require developer review. Roblox scripts require Roblox Studio runtime testing, correct Script/LocalScript placement, secure remotes and DataStore budget/error handling. Export durable ZIP/JSON backups before clearing browser storage.

---

## Previous v1.4 release notes



[Launch EasyScript.io](https://sillydev2026.github.io/EasyScript.io/) · [GitHub source](https://github.com/SillyDev2026/EasyScript.io)

## What's new in v1.4

The original CSS contained several competing breakpoint and height declarations from earlier versions. v1.4 introduces **styles/responsive-v14.css**, loaded after the legacy stylesheet, as the final source of truth for sizing and placement.

- **Wide screens (1281px and up):** three panels arranged by user-selected proportions, default **19% block library / 52% nominal editor / 29% code**. Grid spacing is deducted from the editor track.
- **Tablets and compact desktops (761–1280px):** a responsive **26% blocks / 74% editor** split, with a full-width code/diagnostics panel below.
- **Phones, foldable cover displays and windows up to 760px:** **one 100%-width panel at a time** using the Blocks / Workspace / Code navigation. Mobile panels have independent internal scrolling.
- **Tiny screens down to 320px:** single-column block fields, preserved text labels, a single-column block palette, compact touch-friendly toolbar buttons and safe-area padding.
- **Short-height landscape displays:** flexible scroll containers prevent the editor and source code from being trapped in an undersized viewport.
- **Size controls:** adjustable desktop Blocks and Code percentages, a live calculated Editor share, and a new **85–120% UI size** control for relevant font sizes and touch controls; settings remain in local storage.
- **Responsive sizing everywhere:** project/header controls, file tabs, block fields, code preview, Ultra tools, dialog modals, search, diagnostic lists and exports respect available space without horizontal page overflow.
- **Focus and navigation fixes:** mobile switching to Blocks or Code automatically exits workspace-only Focus Mode; the selected panel always matches the active tab.
- **Reset layout:** restores 19/52/29 desktop proportions, 100% scale, wrap and line-number defaults without destroying scripts or project data.

The UI *scale* control sizes key controls and text; it does **not** change browser zoom or rescale the whole canvas with CSS transforms. On phones, percentage sliders for desktop sidebars are hidden because each active panel already occupies 100% of the available width.

### Verify the layout

Run \`npm run check && npm test\`. New tests cover viewport breakpoints, slider clamping, malformed saved preferences, 100%-width mobile views, CSS order, mobile palette visibility, Focus Mode behavior and screen-safe dialogs.

**Visual QA caveat:** Automated tests cannot certify every screen, font scaling setting or browser combination. Validate the actual site on the target device(s), especially Android browsers and both orientations of foldables.

---

## Previous v1.3 release



**Luau-first visual scripting with 172 built-in block types, nine more local Ultra Suite workflows and a Studio-side importer.**

[Launch EasyScript.io](https://sillydev2026.github.io/EasyScript.io/) · [Repository](https://github.com/SillyDev2026/EasyScript.io)

## New v1.3 Ultra workflows

1. **Static Luau analyzer:** identifies basic declaration problems, duplicate names, warnings about remote inputs and loop risks (not a real Luau type checker).
2. **Offline Roblox API lookup:** searchable curated class/method reference, not a complete live API dump.
3. **Data schema/module generator:** produces a typed-default ModuleScript and a field-by-field migration helper, suitable as a starting point.
4. **Workspace readiness review:** combines file diagnostics, missing/circular ModuleScripts and common source placeholders without running Roblox Studio.
5. **Workspace merge:** append scripts from a second workspace JSON while avoiding filename collisions and respecting the 24-file cap.
6. **Parallel Luau adviser:** highlights potentially unsafe engine/data operations and provides an Actor messaging example; no automatic parallelization.
7. **Roblox Studio source importer:** an actual **manual, one-way** Studio plugin at [roblox/EasyScriptImporter.plugin.lua](roblox/EasyScriptImporter.plugin.lua). It previews a source-manifest JSON and imports Roblox Scripts and LocalScripts **disabled by default** for code review. No live network synchronization.
8. **Custom block SDK:** create and persist up to 30 declarative local blocks with field placeholders and separate Luau/JavaScript output templates. No arbitrary JavaScript execution in the browser.
9. **AI prompt pack:** prepare an optional source-review prompt for manual copy. There is **no hosted AI/model request**.

Custom blocks now travel in the **workspace JSON** and **ZIP exports**. The site continues to work without a backend, login, API key, CDN or cloud service.

### How to use the Roblox Studio importer

- In EasyScript select **Manage files → Export source manifest** (not the workspace backup JSON).
- In Roblox Studio install or create a plugin Script using the code in [EasyScriptImporter.plugin.lua](roblox/EasyScriptImporter.plugin.lua), following Roblox Studio's plugin authoring instructions.
- Open the EasyScript plugin, paste the complete source-manifest JSON, click **Preview**, and then **Import disabled scripts**.
- The importer places server Scripts under ServerScriptService, LocalScripts under StarterPlayerScripts and ModuleScripts under ReplicatedStorage. Review folder layout, security, remote authorization, API permissions and every generated source file before enabling anything.

### Roadmap constraints: not all 26 Ultra features are complete

The **remaining high-complexity items** include a true drag-to-connect Scratch/Blockly block canvas, reliable full bidirectional Luau parsing, a connected live Studio debugger/profiler, cloud GitHub OAuth, online collaborative conflict resolution, authenticated backup services and hosted AI. They require dedicated services or significantly larger parsers, and are **not represented as finished**.

### Safety and limitations

- Studio importer source text can create arbitrary Roblox scripts. Import only projects you trust. Scripts/LocalScripts are initially disabled, but ModuleScripts may run when required by another script.
- Dynamic Luau raw expressions, API calls and server/client boundaries still require testing in Roblox Studio.
- Static analysis, migration, API reference and parallel adviser do not run code or guarantee runtime performance, security or semantic validity.
- A workspace JSON backup is only as safe as the local files you save; clearing browser storage can erase saved projects.
- The custom block SDK compiles templates to source; it does not execute them in the browser. Always inspect exported source before importing to Studio.

---

## Previous v1.2 improvements



**A responsive, browser-only visual scripting editor for Roblox Luau and JavaScript.**

[Open EasyScript.io](https://sillydev2026.github.io/EasyScript.io/) · [GitHub repository](https://github.com/SillyDev2026/EasyScript.io)

## What's new

This release makes substantial progress on the proposed 50 standard + 26 Ultra feature roadmap. It does **not** claim that all 76 requested capabilities are fully implemented: cloud collaboration, direct Studio integration, runtime profiling, AI assistance and full bidirectional Luau parsing require additional systems.

### 172 block types

The catalog now contains **172 editable block types**, including **26 new Luau APIs** and **15 new JavaScript APIs**.

**New Roblox Luau blocks:** raycasting and RaycastParams; overlap box queries; TweenInfo; load animation tracks; play/stop sounds; CollectionService tags; collision group assignment; humanoid MoveTo; a waypoint traversal scaffold; BindableEvents and BindableFunctions; RemoteFunction server/client callbacks; protected DataStore UpdateAsync; MemoryStore queue and sorted map handles; HttpService RequestAsync; Debris cleanup; NumberSequence, ColorSequence and property-change events.

**New JavaScript blocks:** create, append and remove DOM elements; set inline styles, toggle classes, read/write datasets, subscribe to named events, interval callbacks, Date.now, URL pathname, fetch text, URL parsing, history.replaceState and get DOM attributes.

Many APIs require server/client placement, engine permissions, network authorization, defensive nil checks or proper quotas in Roblox Studio. Blocks produce starting-point code, not a validated game architecture. The browser simulator intentionally does not execute Roblox engine calls.

### Stronger typed Luau

- Variable blocks accept an optional Luau type annotation, e.g. \`local Coins: number = 100\`.
- Functions now accept parameter declarations, optional Luau return types and call arguments.
- Diagnostics flag malformed/duplicate parameters and use of Luau annotations in JavaScript.
- New DataStore UpdateAsync blocks reuse hoisted DataStore handles. Multiple pathfinding/DataStore blocks receive readable, collision-safe local names.

### Six interactive editor productivity tools

- **Bulk edit:** select root/nested blocks, duplicate, delete, disable and enable. Disabled state survives JSON project backups.
- **Variable explorer/refactor:** find variables and conservatively rename simple identifiers and expression references. Review the resulting source; dynamic references are not fully understood.
- **Local snippets:** save selected block trees and reinsert copies in compatible projects.
- **Bookmarks and notes:** mark blocks and attach up to 300 characters of developer notes.
- **Diagnostic filters:** view errors, warnings and jump to their blocks.
- **Code minimap:** browse up to 250 non-comment generated source lines.

### Five new offline Ultra Labs

These add to the existing eight Ultra tools, for **13 available Ultra tools/labs** overall.

1. **Remote guard generator** — produces a server-side RemoteEvent handler with type/range validation, per-player cooldown and cleanup; authorization logic remains application-specific.
2. **GUI builder** — generates a ScreenGui + Frame + TextButton example for a LocalScript.
3. **DataStore retry simulator** — local, deterministic success/failure demonstration, not a real DataStore budget simulation.
4. **Static security review** — surfaces potentially risky remotes, data operations and code diagnostics, not a runtime audit.
5. **Luau assertion template** — generates a simple numeric assertion script as a test starting point.

Existing Ultra features: Roblox System Builder, Structure Map, Script Health Audit, Code Style Studio, Variable Explorer, Service Explorer, Runtime Checklist and Version Compare.

### Responsive redesign and quality

- New compact editor toolbar and Ultra Lab sections use grid/flex breakpoints on wide monitors, tablets and folded phones.
- Touch-friendly controls and scrollable modals aim to reduce overflow on compact devices.
- No remote libraries or CDN required for the static app.

## Project support

The 24-file workspace, ZIP script export, project recovery, JSON import/export, expression composer, syntax-colored code, code-copy fallback, snapshots, local autosave, mobile workspace tabs and existing templates remain available.

## Run locally

~~~bash
git clone https://github.com/SillyDev2026/EasyScript.io.git
cd EasyScript.io
npm run check
npm test
python3 -m http.server 8080
~~~

Then open http://localhost:8080.

The CI pipeline checks JS syntax and runs automatic regressions including new Luau/JS emitters, type annotations, copy/paste, selection, bookmarks, snippets, DataStore hoisting, security snippets and deterministic retry simulation.

## Remaining roadmap (not shipped)

- Full visual snap-to-socket Blockly mechanics, AST-backed editable source, and bidirectional code ↔ blocks conversion.
- A Roblox Studio companion plugin, live Studio runtime profiling, debugger connection, true Luau semantic analysis and Studio output synchronization.
- Optional authenticated GitHub sync, cloud storage, real-time collaboration and AI coding assistance.
- Trusted deployment/publishing flows, automatic secure schema migrations, production DataStore budget measurements, real permission review.
- True browser/device cross-testing and Luau runtime validation; CI cannot guarantee every Roblox block combination executes in Studio.

There is **no server**, no login and no hosted AI in this release. Local browser storage is not a durable backup; download your workspace ZIP/JSON before clearing browser data.
