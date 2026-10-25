import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {VERSION,projectTemplate,addBlock,sanitizeProject,traverseEnabled,lint,generate} from "../src/engine.js";
import {createWorkspace,validateWorkspace} from "../src/workspace.js";
import {copyBlockTree,pasteBlockTree} from "../src/clipboard.js";
import {insertSnippet} from "../src/editor-ops.js";
import {DEFAULT_SHELL,normalizeShellPrefs,displayedPaneWidths,normalizeLayoutPrefs} from "../src/responsive-layout.js";

const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))};};

test("v2.4 preserves original safe block IDs through autosave, workspace load and undo",()=>{
 assert.equal(VERSION,"2.4.0");
 const p=projectTemplate("blank");
 const event=addBlock(p,"playerJoined");
 const child=addBlock(p,"print",event.id,"body");
 const raw=JSON.parse(JSON.stringify(p));
 const loaded=sanitizeProject(raw);
 assert.equal(loaded.blocks[0].id,event.id);
 assert.equal(loaded.blocks[0].body[0].id,child.id);
 const ws=createWorkspace(p),again=validateWorkspace(JSON.parse(JSON.stringify(ws)));
 assert.equal(again.files[0].project.blocks[0].id,event.id);
 assert.equal(sanitizeProject(loaded).blocks[0].body[0].id,child.id);
});
test("duplicated/invalid IDs are replaced without losing any nested blocks",()=>{
 const p=projectTemplate("blank"),one=addBlock(p,"print");
 addBlock(p,"print").id=one.id;
 const nested=addBlock(p,"repeat");
 addBlock(p,"print",nested.id,"body").id="bad id ♥";
 const clean=sanitizeProject(JSON.parse(JSON.stringify(p)));
 const ids=[];
 for(const b of clean.blocks){ids.push(b.id);for(const c of b.body||[])ids.push(c.id);}
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(clean.blocks.length,3);
 assert.ok(ids.every(x=>/^[A-Za-z][A-Za-z0-9_-]+$/.test(x)));
});
test("pasted and reused snippets always allocate fresh IDs",()=>{
 const storage=memory(),p=projectTemplate("blank");
 const parent=addBlock(p,"repeat"),child=addBlock(p,"print",parent.id,"body");
 copyBlockTree(storage,parent);
 const copy=pasteBlockTree(storage,p);
 assert.notEqual(copy.id,parent.id);
 assert.notEqual(copy.body[0].id,child.id);
 const example={language:"luau",blocks:[parent]};
 const before=new Set(p.blocks.map(x=>x.id));
 const inserted=insertSnippet(p,example);
 assert.equal(inserted,1);
 assert.equal(new Set(p.blocks.map(x=>x.id)).size,p.blocks.length);
 assert.ok(p.blocks.every(x=>before.has(x.id)||x.id!==parent.id));
});
test("disabled nested Roblox blocks do not add service preambles, lint errors or enabled traversal entries",()=>{
 const p=projectTemplate("blank"),event=addBlock(p,"playerJoined");
 event.disabled=true;
 addBlock(p,"leaderstat",event.id,"body");
 const invalid=addBlock(p,"variable");invalid.fields.name="invalid name";invalid.disabled=true;
 const active=[];traverseEnabled(p.blocks,b=>active.push(b.type));
 assert.deepEqual(active,[]);
 assert.equal(lint(p).filter(x=>x.severity==="error").length,0);
 const source=generate(p);
 assert.doesNotMatch(source,/game:GetService\("Players"\)/);
 assert.doesNotMatch(source,/Instance\.new\("IntValue"\)/);
});
test("screen width and horizontal positioning normalize safely and default to full width",()=>{
 assert.deepEqual(DEFAULT_SHELL,{shellWidth:100,shellAlign:"center"});
 assert.deepEqual(normalizeShellPrefs({}),DEFAULT_SHELL);
 assert.deepEqual(normalizeShellPrefs({shellWidth:91,shellAlign:"left"}),{shellWidth:91,shellAlign:"left"});
 assert.deepEqual(normalizeShellPrefs({shellWidth:30,shellAlign:"invalid"}),{shellWidth:85,shellAlign:"center"});
 assert.deepEqual(normalizeShellPrefs({shellWidth:300,shellAlign:"right"}),{shellWidth:100,shellAlign:"right"});
 for(const val of [null,"",NaN,Infinity,"nope"])assert.equal(normalizeShellPrefs({shellWidth:val}).shellWidth,100);
 const panes=displayedPaneWidths(1600,normalizeLayoutPrefs({left:20,right:30}));
 assert.equal(panes.blocks+panes.workspace+panes.code,100);
});
test("the redesigned shell uses a percentage-width viewport and gap-aware panels",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const css=readFileSync(new URL("../styles/studio-v24.css",import.meta.url),"utf8");
 const studio=readFileSync(new URL("../src/studio.js",import.meta.url),"utf8");
 assert.ok(html.includes('href="styles/studio-v24.css"'));
 assert.ok(html.indexOf("studio-v24.css")>html.indexOf("code-qol-v23.css"));
 assert.match(css,/width:var\(--shell-screen-width\)/);
 assert.match(css,/height:var\(--pane-height-size\)/);
 assert.match(css,/minmax\(0,var\(--pane-left-fr\)\)/);
 assert.match(css,/body\[data-shell-align="left"\]/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/\.studio-advanced>summary/);
 for(const id of ["shellWidth","shellWidthPercent","shellAlign","panelHeight","leftSize","rightSize"])
  assert.ok(studio.includes('id="'+id+'"'),id);
 assert.match(studio,/normalizeShellPrefs\(prefs\)/);
 assert.match(studio,/dataset\.shellAlign=prefs\.shellAlign/);
 let depth=0;
 for(const c of css.replace(/\/\*[\s\S]*?\*\//g,"")){
  if(c==="{")depth++;
  if(c==="}")depth--;
  assert.ok(depth>=0);
 }
 assert.equal(depth,0);
});
