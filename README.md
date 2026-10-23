# EasyScript.io v1.2.0 — Luau + JavaScript expansion

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
