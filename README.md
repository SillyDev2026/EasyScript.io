# EasyScript.io v1.3.0 — Ultra Developer Suite + Roblox Studio Importer

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
