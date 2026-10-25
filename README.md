# EasyScript.io v2.4.0 — Fluid Studio Redesign + Script Reliability

[Launch EasyScript.io](https://sillydev2026.github.io/EasyScript.io/) · [Source repository](https://github.com/SillyDev2026/EasyScript.io)

## New percentage-based screen layout

- **Workspace width:** set the whole editor workspace to 85–100% of the available viewport width (default 100%).
- **Horizontal placement:** position the workspace left, center, or right when narrower than the screen.
- **Three-panel widths:** desktop Blocks / Workspace / Code proportions default to 19 / 52 / 29. Grid gaps are deducted before distributing these proportions; panels have no hard-coded pixel widths.
- **Panel height:** 45–95% of the visible viewport height, default 72%, using dynamic viewport-height units.
- **Code placement:** right or below on wide desktop screens; automatic below-editor placement on tablets.
- **Phones and narrow foldables:** one 100%-width Blocks, Workspace or Code view at a time, with touch controls and independent scrolling. Full-width override is intentional for narrow screens.
- **Cleaner UI:** consistent rounded panels, improved contrast and hierarchy, redesigned block cards, more useful mobile spacing, and an expandable Layout & sizing toolbar that keeps advanced controls discoverable without dominating the screen.
- Existing saved layout settings remain available; Reset layout restores the defaults.

Panel geometry and screen positioning are relative to screen width, viewport height and grid proportions. Minimum tap targets and legible text still use scalable rem sizes for accessibility.

## Script fixes

- Safe block IDs are now stable across normal workspace loads, imports, undo/redo and saved project restores, preserving block references and bookmarks.
- Duplicate or unsafe imported IDs are regenerated uniquely.
- Pasting copied blocks or inserting snippets intentionally allocates fresh IDs rather than accidentally duplicating IDs.
- Disabled blocks and their children no longer count in lint diagnostics, preamble dependencies or the simulated function registry.
- Disabled Roblox event trees no longer generate unused Players/DataStoreService setup.
- Additional automated checks cover these changes and percentage-based screen positioning.

## Verification and limitations

Run npm run check and npm test locally. GitHub Actions checks the main branch.

Passing tests does not prove all 249 block combinations run correctly in Roblox Studio or every CSS rendering engine. Actual browser, phone/foldable, and server/client Studio tests are still required to validate full runtime behavior.

---

## Previous v2.3 release notes



[Open EasyScript.io](https://sillydev2026.github.io/EasyScript.io/) · [Source repository](https://github.com/SillyDev2026/EasyScript.io)

## New code presentation features

- **Readable / Compact / Original output** in the Code panel. Readable keeps consistent four-space indentation from the compiler, trims trailing spaces, and separates logical sections. Compact removes extra blank lines; Original preserves the generator's raw layout.
- **Block labels** adds optional top-level comments such as \`-- BLOCK: Create variable\` or \`// BLOCK: Print\`. These labels are comments, not executable statements.
- **Live metrics** shows generated line and character counts.
- **Peek at one block's source** with the ⌘ control on its block card; copy that snippet directly. Nested previews are contextual and may refer to variables/services defined elsewhere in the full script.
- **Saved code-view preferences** remain on the device, independently of editable project data. Switch styles without changing the underlying visual block tree.
- **Unified exports:** Copy Code, Export Code, Copy All Code, ZIP-generated scripts and source-manifest exports use the same selected presentation settings. JSON block backups remain editable original data.

## Reliability fixes

- Fixed conditional-branch scope sharing that could generate an undefined \`leaderstats\` variable in an otherwise valid Roblox \`else\` branch. Each conditional branch now gets independent local state.
- The offline simulator correctly ignores disabled blocks (including disabled function definitions). This matches the generator's disabled-block behavior.
- Per-block copying reuses the clipboard-permission fallback dialog instead of creating a new dialog for every click.
- Presentation is intentionally conservative: it does not rename variables, reorder functions, rewrite expressions, execute source, or remove arbitrary statements. Raw original source remains selectable when using advanced constructs, such as long LuaU strings or JavaScript template literals.
- Added regression coverage for generated Luau/JavaScript source, format preferences, labels, export wiring, independent conditional branches and disabled-block simulation.

## How to use

1. Add visual blocks to the workspace.
2. In **Generated code → Style**, select **Readable**, **Compact**, or **Original**. Toggle **Block labels** if you want comments describing the generated sections.
3. On any block, press **⌘** to preview its source and copy it if needed.
4. Use **Copy Code**, **Export Code**, or **Manage files → Download scripts ZIP** to keep the same presentation style in the exported sources.

## Scope

This release improves the source view, export consistency, and certain generator bugs. It does not claim to fix all possible bugs or validate all Roblox APIs at runtime. Luau must still be tested in Roblox Studio, and browser-specific layouts should be visually checked on actual devices.

---

## Previous v2.2 release notes



[Open the app](https://sillydev2026.github.io/EasyScript.io/) · [Repository](https://github.com/SillyDev2026/EasyScript.io)

## What changed in v2.2

This release addresses the positioning and scaling conflicts left by several generations of CSS. A final, last-loaded stylesheet (\`styles/screen-percent-v22.css\`) owns screen-width layouts, panel heights, code placement and responsive controls.

**Screen-relative controls**

- **Blocks and Code width:** adjustable on desktop using 15–31% and 22–42% controls respectively; Editor width is calculated as the remaining portion. Shares are measured within the usable editor row **after gaps** rather than claiming that the panel occupies that exact percentage of the entire physical screen.
- **Panel height:** new **45–95% of the visible viewport height** slider (default 72%), expressed in CSS dynamic viewport-height units (dvh). Applies to library, editor, source/diagnostics and focused editor panels.
- **Code position:** choose **Right** or **Below** on wide desktop screens. If below, Blocks and Editor share the first row and Code is full width beneath them.
- **UI scale:** existing 85–120% slider remains for text and key control sizes. It is not browser zoom.
- **Reset Layout:** restores 19% Blocks / 52% Editor / 29% Code on desktop, code to the right, 72% viewport-height panels, and 100% UI scale.

**Responsive layout**

- Desktop screens wider than 1280 CSS px: fully proportional three-column layout, or two columns with code below.
- Tablet/unfolded compact windows 761–1280px: 26% Blocks and 74% Editor across the first row, with full-width Code underneath. Docking is automatic at these widths.
- Phone / cover-screen widths up to 760px: **one selected panel at 100% available width**, selected with Blocks / Workspace / Code tabs. Internally scrolling panes use the chosen screen-height percentage.
- On narrow phones, touch controls stack; short-height landscape views can scroll without needing to overlap adjacent panels.
- CSS safe-area padding and keyboard-friendly scrolling remain in place.

**Reliability and QA**

- Invalid, null, empty, Infinity or out-of-bounds saved display settings normalize to safe ranges instead of producing broken grid sizes.
- The layout mode indicator reports the **effective responsive split** when the viewport changes, not just stale slider values.
- Code width and dock controls are disabled or hidden when responsive breakpoints control their position automatically.
- Existing Focus Mode now respects the selected panel-height percentage.
- Regression tests cover the expected width ratios, height units, dock position, mobile/desktop breakpoints, focus sizing, and legacy preference migration.

This is not a claim to have fixed every existing bug. Automated tests do not replace real Chrome/Firefox/Android device visual checks, especially foldable orientation, accessibility scaling, or virtual-keyboard resizing. Test those using the live Pages site once its deployment completes.

---

## Previous v2.1 release notes



**249 built-in blocks total** · **77 new blocks** (39 Roblox Luau + 38 JavaScript) · 17 starter packs · responsive visual scripting.

[Launch EasyScript.io](https://sillydev2026.github.io/EasyScript.io/) · [GitHub source](https://github.com/SillyDev2026/EasyScript.io)

## New in v2.1

### 39 new Roblox Luau blocks

- **Instances:** WaitForChild, FindFirstChildWhichIsA, GetChildren, GetDescendants, IsA, Destroy, Clone, PivotTo, GetPivot, SetAttribute, GetAttribute and attribute-change events.
- **Math, vectors and UI:** CFrame, Vector3 magnitude, unit and lerp, Color3.fromRGB, UDim2 scale, Random.new():NextInteger.
- **Events and Players:** ProximityPrompt.Triggered, UserInputService.InputBegan, Player.CharacterAdded, GetPlayerFromCharacter.
- **Animation:** Create TweenService tween, Play/Cancel tween, Play/Stop AnimationTrack.
- **Networking:** RemoteEvent FireClient / FireAllClients and RemoteFunction InvokeClient / InvokeServer. These need appropriate Script/LocalScript placement and server authorization.
- **Tasks and data:** task.defer, task.delay, JSONEncode / JSONDecode, GetServerTimeNow, tagged instances and tag tests.

Each Roblox block generates actual Luau or an explicit JavaScript-mode unsupported comment. Blocks with yield, privileged API or network boundaries warn about security and runtime limits.

### 38 new JavaScript blocks

- **DOM and events:** closest(), matches(), contains(), hidden, textContent, focus, scrollIntoView, getBoundingClientRect, DocumentFragment, CustomEvent, dispatchEvent, submit and keyboard listeners.
- **Arrays and collections:** map, filter, find, reduce, forEach, Map/Set constructors and methods.
- **Web and asynchronous:** Promise.all, JSON POST fetch, AbortController, URLSearchParams, FormData, crypto.randomUUID, Intl number/date formatting.
- **Performance and observers:** performance.now, numeric clamping, requestAnimationFrame, MutationObserver and IntersectionObserver.

JavaScript generation uses actual JavaScript syntax and supports nested callback bodies, while cross-language use produces comments instead of non-JavaScript code.

### Eight new starter templates

- Luau: Attribute tracking, tween animations, proximity prompts, JSON encode/decode.
- JavaScript: array transformation, Map+Set, form submission, URL query strings.
- **Bug fix:** starter templates retain their native scripting language without requiring a per-template hardcoded list.

### Generator and reliability improvements

- JavaScript variable validation rejects reserved identifiers such as const, for, import and await while accepting JavaScript-valid identifiers with dollar signs.
- Duplicate declared locals in a single block scope trigger warnings.
- Explicit diagnostics prevent user declarations of Players or DataStoreService from shadowing autogenerated Roblox service handles.
- Clean one-line assignments remain the default. Source strings with accidental pasted line breaks are normalized for output and diagnosed.
- Regression coverage checks **all 77 new blocks**, JavaScript syntax compilation via Node, generated Roblox method names, nested event blocks, and new templates.

### Scope and testing limitations

The block catalog and code generator have automated test coverage, but passing tests do not guarantee every block combination works at runtime inside Roblox Studio or a live browser. Generated networking and DataStore code must still be tested with server-side validation, permissions, exception handling and platform quotas.

All earlier v2 workbench tools remain, including persisted expression sockets, conservative code-to-block conversion, reviewed offline workspace patches and the optional Studio profiler scaffold.

---

## Previous v2.0 release notes



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
