# EasyScript.io v1.0.0

**A browser-based, Luau-first visual scripting studio** with 131 script blocks, a multi-file project workspace, code generation and responsive mobile editing.

[Launch EasyScript.io](https://sillydev2026.github.io/EasyScript.io/) · [Source on GitHub](https://github.com/SillyDev2026/EasyScript.io)

## What changed between v0.7 and v1.0

### v0.8 foundations: visual expression composition

- **Typed expression composer** beside compatible block fields. Select a number, text, boolean, variable, operator, condition, random value, or Roblox Vector3.
- Build nested values in expandable **operand slots**; the generated expression previews live and is compiled for Luau or JavaScript.
- Type validation flags number/boolean/string mismatches and invalid identifiers. No use of eval or Function.
- The original raw-expression input is retained for existing scripts and advanced code.
- Expressions are inserted as source strings into the current field; the structured editor tree is not yet persisted as a draggable canvas.

### v0.9 foundations: linked multi-file projects and portable bundles

- **Require ModuleScript**, **ModuleScript return**, and **Import JavaScript module** blocks. The catalog now has **131 block types**.
- Workspace dependency analysis shows imports, missing targets, cycles, invalid targets and file diagnostics.
- **Actual ZIP exports**, built in the browser with no CDN. A ZIP contains separate generated Luau/JavaScript files in a scripts/ folder, a manifest, a README and a workspace JSON backup.
- The module graph is static and checks names only; it does not install modules, execute code, or auto-publish to Roblox.

### v1.0 reliability and project completion

- **Local recovery history** stores up to eight rolling snapshots, throttled and size-bounded to avoid interfering with autosave. Reopen them from Manage files → Recovery.
- Improved safeguards for ModuleScript return placement; invalid output is replaced by a diagnostic comment rather than an invalid return statement.
- Syntax checking of every new module in GitHub Actions, plus dedicated tests for expression output, module cycles, recovery and ZIP entry integrity.
- The v0.7 UX is preserved: 24-file explorer, cross-file block clipboard, themes, adaptive three-column sizing, mobile tabs, nested branches, syntax highlighting and copy-code fallbacks.
- All eight Ultra tools remain: System Builder, Structure Map, Script Audit, Code Style, Variable Explorer, Service Explorer, Runtime Checklist and Snapshot Compare.

## Use the new features

1. Open a Luau or JavaScript project and choose a block with an expression input.
2. Select **◇ Build** next to the field. Change the node type, fill its left/right/child slots and select **Use this expression**.
3. To work across files, choose **Manage files** → **New file** and create a ModuleScript or JavaScript file.
4. Add a **Require ModuleScript** or **Import JavaScript module** block; use **Module graph** in Manage files to inspect connections.
5. Choose **Download scripts ZIP** to download individual scripts plus an editable backup.
6. Use **Save restore point** or **Recovery** in Manage files for local restore points, and periodically export ZIP/JSON backups.

## Example: readable Roblox leaderstats

~~~lua
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local coins = Instance.new("IntValue")
    coins.Name = "Coins"
    coins.Value = 0
    coins.Parent = leaderstats
end)
~~~

Script-scoped variables use ordinary locals rather than Luau's _G table. Cross-script state is not implicit: modules and networking require appropriate Roblox Script/LocalScript architecture.

## Development

The app is a static site without JavaScript runtime dependencies or a server. Node.js 20+ is recommended for tests.

~~~bash
git clone https://github.com/SillyDev2026/EasyScript.io.git
cd EasyScript.io
npm run check
npm test
python3 -m http.server 8080
~~~

### New v1 modules

- src/expressions.js — typed expression AST and Luau/JavaScript compilation
- src/expression-ui.js — accessible nested-slot expression dialog
- src/project-blocks.js — ModuleScript and JavaScript import blocks
- src/project-graph.js — missing-module and dependency-cycle diagnostics
- src/zip.js — portable ZIP32 writer and script bundles
- src/recovery.js — size-limited local recovery snapshots
- src/v1-workspace-ui.js — ZIP, module graph and recovery controls
- tests/v1-features.test.js — new v1 regression suite

Existing block engine, project files, Ultra tools and styling remain in their existing modules.

## Important boundaries

- EasyScript does not run Roblox Studio, publish to Roblox, or execute LuaU source in the browser.
- The v1 expression composer uses nested selectable slots. It is **not yet a fully draggable Scratch/Blockly-style connection engine**.
- Expression type checking is basic; raw user-entered expressions are not fully validated or sandboxed.
- The ZIP exporter uses standard uncompressed ZIP32, so files may not shrink in size.
- The static dependency analyzer matches relative names and does not resolve all Roblox runtime instance paths.
- Recovery and regular saved projects use browser storage and can vanish if browser site data is cleared. Always download backups.
- AI assistants, online accounts, cloud synchronization, multiplayer editing, a Roblox Studio companion plugin and GitHub sync are **not implemented** in v1.
- Server-side DataStore and RemoteEvent security depend on your game code; exported examples are educational and must be tested.
- No open-source license has been selected for this repository.
