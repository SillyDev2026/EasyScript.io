# EasyScript.io — Release notes

## v1.0.1 — Reliability and generated-code fixes (2026-10-23)

This is a bug-fix release of EasyScript.io v1.0. All saved-workspace formats, the existing block catalog, and the v1 features remain compatible.

### Fixed

- **Typed expressions:** Empty number inputs no longer silently compile as zero. Invalid boolean values, unsupported languages, reserved variable names, division by zero, and invalid integer ranges produce explicit validation messages.
- **Module returns:** Nested `ModuleScript return` blocks are flagged and converted to safe comments rather than emitting invalid Luau.
- **File extensions:** Workspace files consistently use `.luau` or `.js` based on their actual language, including renamed and imported files.
- **File switching:** Changing a script's language updates the file's kind, export name, and file tabs without losing existing blocks.
- **Generated names:** Part variables and repeat-loop counters now use short readable names instead of internal block IDs.
- **DataStore/service collisions:** Auto-generated DataStore aliases avoid user-declared variables. A diagnostic warns when a script-local name conflicts with the Players or DataStoreService preamble.
- **Variable scopes:** Generated temporary names reserve service references and other declarations to reduce accidental shadowing.
- **Interaction reliability:** Added simulated UI tests for expression creation, invalid-expression feedback, code-copy success, and permission-denied copy fallback.

### Testing

The GitHub Actions CI performs JavaScript syntax checks and Node regression tests for generator output, expressions, ModuleScripts, file imports and exports, ZIP archives, recovery, and simulated UI interactions. The patched release passes 91 automated tests.

### Still not a guarantee

This is not a formal audit of every possible block combination. Automated tests do not replace real browser testing across Android, foldables and desktops, or Roblox Studio runtime testing. LuaU raw expression fields can still contain invalid user code, and generated DataStore/RemoteEvent systems still need production-specific security, retries and authorization. The visual expression composer uses typed nested slots but is not a full Blockly/Scratch drag-to-socket engine.

### Backup advice

Existing projects remain stored in browser localStorage; use **Manage files → Download scripts ZIP** or **Export workspace** before clearing browser data, reinstalling browsers, or transferring devices.
