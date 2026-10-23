# EasyScript.io

**Build real scripts visually.** EasyScript is a dependency-free visual scripting studio for beginners and Roblox developers. Combine blocks, adjust fields, watch readable Luau or JavaScript update instantly, then export your work.

**Version:** v0.3.0

## Live website

- GitHub Pages: https://sillydev2026.github.io/EasyScript.io/
- Source repository: https://github.com/SillyDev2026/EasyScript.io

## What's new in v0.3.0

### Roblox-ready creation (Luau)

Nine new blocks added to the original nine primitives:

| Block | Output |
| --- | --- |
| Change number | `Coins += 1` |
| While condition | Guarded while condition with nested body |
| Get Roblox service | `game:GetService(...)` |
| Player joined | `Players.PlayerAdded:Connect(...)` |
| Part touched | `.Touched:Connect(...)` |
| Remote received (server) | `.OnServerEvent:Connect(...)` |
| Create leaderstat | Folder and IntValue under player |
| Set instance property | `workspace.Part.Transparency = 0.5` |
| Create anchored part | `Instance.new("Part")` |

**Three new templates:** Roblox Leaderstats, Touch Detector, and Remote Validation. The original Purchase Check, Coin Counter, Function Demo, and Blank Project templates remain.

### Editor and quality-of-life

- Live, XSS-safe Luau/JavaScript syntax highlighting.
- Click any diagnostic to navigate to the affected visual block.
- Service picker for common Roblox services.
- Improved touch targets and mobile editor layout.
- **My projects** dialog: save, open, and delete up to 40 local project snapshots.
- Keyboard shortcuts: Ctrl/Cmd+S to save, Ctrl/Cmd+Shift+L for project library, Ctrl/Cmd+Enter to simulate, Ctrl/Cmd+Z to undo.
- Drag-and-drop insertion zones; tap controls for mobile.
- JSON import/export and Luau/JavaScript downloads.
- Undo/redo, nested blocks, block duplication, inline fields, live diagnostics.
- Extended unit tests, including generated Roblox code, simulated loops, snapshot safety, and tokenization.

## Usage

1. Choose **Language: Luau · Roblox** to use Roblox-native blocks.
2. Select a template or start a blank project.
3. Drag a block into a drop zone, or tap **Add a block**.
4. Edit each field. Nest blocks inside conditions, functions, loops, or events.
5. Inspect **Generated code** and **Diagnostics**.
6. Save snapshots to **My projects**, download an editable `.easyscript.json` backup, or export `.luau` / `.js` source.
7. Paste Roblox Luau exports into the correct kind of script in Roblox Studio and test them in the Roblox environment.

## Safety and limitations

- **Browser-only:** no accounts, cloud synchronization, collaboration, AI APIs, or online Roblox engine execution.
- **Simulator:** safely interprets a small set of literals, arithmetic, loops and function calls; it does not run your generated code or Roblox APIs. It enforces iteration/step limits.
- **Roblox blocks:** available as generated Luau only; when switching to JavaScript, the generator substitutes informative comments and diagnostics warn about unsupported blocks.
- **RemoteEvents:** client inputs are untrusted. The template and warnings remind developers to validate data and permissions; they do not implement application-specific security checks.
- **Local snapshots:** stored in this browser's localStorage and can disappear if browser data is cleared. Export JSON backups.
- **Visual model:** blocks are reorderable cards with nested drag/drop zones. These are not yet Blockly/Scratch-style connecting sockets.
- **Code generation:** editable expressions are inserted into exported code as source; inspect and test scripts before deploying.
- No source license has been selected; do not assume redistribution permissions.

## Local development

Requires Node.js 20+ for testing. Website itself needs only a static web server.

```bash
git clone https://github.com/SillyDev2026/EasyScript.io.git
cd EasyScript.io
python3 -m http.server 8080
# Open http://localhost:8080
npm run check
npm test
```

## Architecture

```text
index.html              Editor and dialogs
styles.css              Responsive layout
src/app.js              Visual editor and interactions
src/engine.js           Schema, generators, lint and limited simulation
src/highlight.js        Safe token-based syntax highlighting
src/library.js          Multi-project snapshot storage
tests/*.test.js         Node.js regression tests
.github/workflows/ci.yml Automated checks on push
```

## Next milestones

- **v0.4:** socket-based Blockly-style expressions, typed input connectors, and richer script validation.
- **v0.5:** project Explorer with multiple script files, LuaU editor enhancements, and local version diffs.
- **v0.6+:** optional authenticated accounts, GitHub sync, collaborative editing, curated community templates, and a Roblox Studio companion plugin.

**License:** none selected yet.
