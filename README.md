# EasyScript.io

**Visual scripting for everyone.** Build scripts from editable blocks, understand the generated code, and export working Luau or JavaScript.

## What is included in v0.2.0

- Nine visual blocks: print, create/update variable, condition, repeat loop, wait, comment, define/call function.
- Nested **if/else**, loops, and functions.
- Luau for Roblox and JavaScript code generation, shown live alongside the blocks.
- Drag and drop on desktop; touch-friendly buttons for editing and reordering.
- Duplicate blocks, undo/redo, search blocks, and four starting templates.
- Basic diagnostics for missing values, invalid names, and undefined functions.
- Limited *safe* logic preview (simulator, no `eval` and no execution of user-generated code).
- Autosave to browser local storage, JSON project import/export, copy and download code.
- Responsive layout for phones, tablets, and computers.
- No backend, account, API key, or build tooling needed.

## Try it

- GitHub repository: https://github.com/SillyDev2026/EasyScript.io
- GitHub Pages URL after Pages is enabled: https://sillydev2026.github.io/EasyScript.io/

To run locally:

```bash
git clone https://github.com/SillyDev2026/EasyScript.io.git
cd EasyScript.io
python3 -m http.server 8080
```

Open http://localhost:8080. A local HTTP server is recommended because the editor loads JavaScript modules.

## Enable GitHub Pages

Open **Settings → Pages** in the repository, choose **Deploy from a branch**, select **main** and **/(root)**, then save. The Pages address is provided by GitHub once deployment succeeds. GitHub Pages setup is not automated by this repository.

## Project layout

```text
index.html         User interface
styles.css         Responsive dark theme
src/engine.js      Project schema, templates, code generators, diagnostics, simulation
src/app.js         Visual workspace and controls
tests/engine.test.js   Engine regression tests
package.json       Test command
```

## Development

Node.js 20+ recommended. No dependencies needed:

```bash
npm test
```

The project is still a browser-only prototype: **no cloud accounts, multiplayer editing, AI service, Roblox runtime, or online execution**. A generated Luau script must be tested in Roblox Studio, and the simulator only understands a deliberately limited expression grammar (simple literals, variables and basic arithmetic). Do not treat generated code as security-reviewed. Local storage can be cleared by the browser, so use **Project** export for backups.

## Roadmap

- **v0.3:** snap-together value blocks; Roblox-oriented templates; safer typed expression handling; stronger test suite.
- **v0.4:** optional Monaco code view, complete project files, GitHub export and history.
- **v0.5+:** optional accounts, collaboration, moderated script sharing, Roblox Studio companion plugin.

## License

No license has been selected yet. Contact the repository owner before redistributing this project's source under your own license.
