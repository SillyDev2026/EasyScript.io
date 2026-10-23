# EasyScript.io — v0.4.0

Build Luau and JavaScript visually on desktop, tablets, foldables and phones. The app remains a **static, dependency-free GitHub Pages site**, with local editing, optional browser-only project snapshots and exports.

- **Live site:** https://sillydev2026.github.io/EasyScript.io/
- **Source:** https://github.com/SillyDev2026/EasyScript.io

## 10 studio improvements in v0.4

1. **Percent-based panel sizing:** Adjust the block palette from 16–30% and the output from 23–42% of the wide-screen workspace.
2. **Adaptive mobile workspaces:** Dedicated Blocks / Workspace / Code views on narrow screens, with layouts that also adapt to tablets.
3. **Dark/daylight appearance:** Persistent theme preference, no remote stylesheet.
4. **Compact or comfortable editing:** Choose panel/control density.
5. **Focus mode:** Temporarily hide side panels for extra visual workspace room.
6. **Favorite blocks:** Star commonly used blocks in the palette; remembers them locally.
7. **Recent blocks:** Automatically surfaces recently inserted palette blocks.
8. **Project-wide search:** Find existing blocks by name, type and fields, then jump to them.
9. **Live code line numbers:** Toggle a line-number gutter.
10. **Code wrapping:** Toggle wrapping for narrow screens and long expressions.

Bonus: Built-in shortcut help and reset-layout button, and more efficient render scheduling while typing.

## Three Ultra tools

### 1. Roblox System Builder

Generate **standalone Luau Server Scripts** for a Speed Pad, Coin Pickup, or Checkpoint. Configure speed/duration, stat names, coin amounts and cooldowns. Copy or download the scripts. Scripts contain server-side checks, but must still be reviewed and tested in Roblox Studio.

This feature **does not** convert the generated system into visual blocks or automatically insert it into Roblox Studio.

### 2. Structure Map

An interactive, nested outline of your blocks and their branch hierarchy. Select any entry to jump to its position in the visual editor. This is an outline view, **not** a node-connection graph.

### 3. Script Health & Performance Audit

Static warnings for unbounded `while` loops, large repeat counts, deep nesting, large projects and RemoteEvent security trust boundaries. Shows a heuristic health index, blocks, generated source lines, nesting depth, and event/loop counts. This is **not** an engine benchmark, security audit, or execution profiler.

## Existing editor

18 visual blocks, nested `if` / `while` / `repeat` / `function` / Roblox event branches, generated code and diagnostics, safe limited simulation of supported expressions, local project snapshots, import/export, multiple templates and undo/redo.

## Layout and behavior

- Large screens: three fluid panels whose side-pane widths can be adjusted using percentage sliders.
- Tablet/landscape: two columns with generated output below.
- Narrow/folded mobile: full-width tabbed sections to make blocks and code readable without microscopic columns.
- The layout accounts for viewport width using CSS grid, `clamp()`, `dvh`, and touch-friendly controls. Exact device testing may reveal further refinements.
- Theme, density, favorites and layout preferences are saved **on this browser only**.

## Development

Requires Node.js 20+ to run tests; the website itself requires no package installation or backend.

```bash
git clone https://github.com/SillyDev2026/EasyScript.io.git
cd EasyScript.io
python3 -m http.server 8080
# Then visit http://localhost:8080
npm run check
npm test
```

## Security and limitations

- Avoid placing secrets in exported JavaScript or publicly shared project files.
- LocalStorage is not a permanent backup. Download `.easyscript.json` copies of important projects.
- The simulator is intentionally restricted and **does not** execute Roblox engine APIs or arbitrary exported scripts.
- Roblox system wizard scripts are starting points, not production-ready game security. Test server/client behavior in Roblox Studio.
- AI assistance, multiplayer editing, online persistence, a proper Roblox Studio plugin, socket-connecting blocks, and production performance measurements are not yet implemented.
- **No license is currently selected.** Do not assume redistribution rights.

## File layout

```text
index.html             HTML shell and editor
styles.css             Responsive, percentage-based themes and tools
src/app.js             Main block editor and event handlers
src/engine.js          Blocks, exports, lint and limited simulation
src/studio.js          Studio preferences, palette, mobile views and Ultra UI
src/ultra.js           Pure system generator, outline and static audit
src/library.js         Browser-only project snapshots
src/highlight.js       Safe output token coloring
tests/*.test.js        Node built-in test runner
.github/workflows/ci.yml  GitHub Actions verification
```

## Next direction

v0.5: Full node-connected visual values, separate script files per project and stronger Luau typing assistance. Future online sharing or AI assistance would require a backend and suitable authentication/rate limiting.
