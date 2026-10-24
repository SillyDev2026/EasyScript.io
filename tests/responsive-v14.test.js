import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeLayoutPrefs,layoutMode,displayedPaneWidths,DEFAULT_LAYOUT,BREAKPOINTS} from "../src/responsive-layout.js";

test("default percentages distribute desktop library, workspace and code to exactly 100%",()=>{
 const p=normalizeLayoutPrefs({});
 assert.deepEqual(p,{left:19,right:29,editor:52,scale:100,height:72,dock:"right"});
 const widths=displayedPaneWidths(1920,p);
 assert.equal(widths.blocks+widths.workspace+widths.code,100);
 assert.equal(widths.mode,"desktop");
 assert.equal(widths.visibleOneAtATime,false);
});
test("saved custom percentages, scale and reset defaults are normalized",()=>{
 assert.deepEqual(normalizeLayoutPrefs(DEFAULT_LAYOUT),{left:19,right:29,editor:52,scale:100,height:72,dock:"right"});
 assert.deepEqual(normalizeLayoutPrefs({left:24,right:34,scale:115}),{left:24,right:34,editor:42,scale:115,height:72,dock:"right"});
 assert.deepEqual(normalizeLayoutPrefs({left:"25",right:"36",scale:"105"}),{left:25,right:36,editor:39,scale:105,height:72,dock:"right"});
});
test("invalid, missing, NaN and infinite persisted preferences cannot create broken geometry",()=>{
 for(const raw of [null,undefined,{}, {left:"NaN",right:Infinity,scale:"NaN"},
  {left:null,right:null,scale:undefined},{left:-5,right:999,scale:-200}]){
  const out=normalizeLayoutPrefs(raw);
  assert.ok(Number.isFinite(out.left)&&Number.isFinite(out.right)&&Number.isFinite(out.scale));
  assert.ok(out.left>=15&&out.left<=31);
  assert.ok(out.right>=22&&out.right<=42);
  assert.ok(out.editor>=27);
  assert.ok(out.left+out.right+out.editor===100);
  assert.ok(out.scale>=85&&out.scale<=120);
 }
});
test("manual sliders retain at least 27% nominal workspace width",()=>{
 const p=normalizeLayoutPrefs({left:31,right:42,scale:200});
 assert.equal(p.editor,27);
 assert.equal(p.scale,120);
 for(let l=15;l<=31;l++)for(let r=22;r<=42;r++){
  const out=normalizeLayoutPrefs({left:l,right:r});
  assert.equal(out.left+out.editor+out.right,100);
  assert.ok(out.editor>=27);
 }
});
test("foldable cover, phone, tablet and desktop layouts share consistent breakpoints",()=>{
 assert.equal(layoutMode(320),"phone");
 assert.equal(layoutMode(375),"phone");
 assert.equal(layoutMode(600),"phone");
 assert.equal(layoutMode(BREAKPOINTS.phoneMax),"phone");
 assert.equal(layoutMode(BREAKPOINTS.phoneMax+1),"tablet");
 assert.equal(layoutMode(BREAKPOINTS.tabletMax),"tablet");
 assert.equal(layoutMode(BREAKPOINTS.tabletMax+1),"desktop");
 assert.equal(layoutMode(2560),"desktop");
 const phone=displayedPaneWidths(400,DEFAULT_LAYOUT);
 assert.equal(phone.visibleOneAtATime,true);
 assert.deepEqual([phone.blocks,phone.workspace,phone.code],[100,100,100]);
 const tablet=displayedPaneWidths(930,DEFAULT_LAYOUT);
 assert.deepEqual([tablet.blocks,tablet.workspace,tablet.code],[26,74,100]);
});
test("responsive stylesheet loads after legacy rules and includes phone, tablet and landscape handling",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const css=readFileSync(new URL("../styles/responsive-v14.css",import.meta.url),"utf8");
 assert.ok(html.indexOf('href="styles.css"')>=0);
 assert.ok(html.indexOf('href="styles/responsive-v14.css"')>html.indexOf('href="styles.css"'));
 assert.match(css,/@media\s*\(max-width:760px\)/);
 assert.match(css,/@media\s*\(min-width:761px\) and \(max-width:1280px\)/);
 assert.match(css,/@media\s*\(max-width:375px\)/);
 assert.match(css,/@media\s*\(max-height:510px\) and \(min-width:761px\)/);
 assert.match(css,/env\(safe-area-inset-left\)/);
 assert.match(css,/body\[data-mobile-view="code"\] \.layout > \.result-panel/);
 assert.match(css,/max-height:calc\(100dvh/);
});
test("Studio toolbar exposes percentage sliders, center share and size slider",()=>{
 const studio=readFileSync(new URL("../src/studio.js",import.meta.url),"utf8");
 for(const id of ["leftSize","rightSize","centerPercent","uiScale","uiScalePercent","screenMode"]){
  assert.ok(studio.includes('id="'+id+'"'),id);
 }
 assert.match(studio,/setProperty\("--ui-scale"/);
 assert.match(studio,/normalizeLayoutPrefs\(prefs\)/);
 assert.match(studio,/addEventListener\("resize",updateMode/);
});

test("mobile block palette stays single-column even when earlier CSS requested two columns",()=>{
 const css=readFileSync(new URL("../styles/responsive-v14.css",import.meta.url),"utf8");
 assert.match(css,/body\[data-mobile-view="blocks"\] \.palette-groups \{display:block;grid-template-columns:none/);
});
test("mobile switching away from workspace exits focus mode",()=>{
 const studio=readFileSync(new URL("../src/studio.js",import.meta.url),"utf8");
 assert.match(studio,/if\(prefs.focus&&prefs.mobile!=="workspace"\)prefs.focus=false/);
});
test("responsive rules are syntactically balanced and loaded exactly once",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const css=readFileSync(new URL("../styles/responsive-v14.css",import.meta.url),"utf8");
 assert.equal((html.match(/href="styles\/responsive-v14\.css"/g)||[]).length,1);
 const withoutComments=css.replace(/\/\*[\s\S]*?\*\//g,"");
 let depth=0;
 for(const char of withoutComments){
  if(char==="{")depth++;
  if(char==="}")depth--;
  assert.ok(depth>=0,"Unexpected CSS closing brace");
 }
 assert.equal(depth,0,"Unbalanced CSS blocks");
});
