import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DEFAULT_LAYOUT,LIMITS,normalizeLayoutPrefs,layoutMode,layoutVariables,displayedPaneWidths} from "../src/responsive-layout.js";

test("v2.2 default widths share 100% of gap-adjusted grid area and height is 72dvh",()=>{
 const p=normalizeLayoutPrefs();
 const t=displayedPaneWidths(1600,p);
 assert.deepEqual([t.blocks,t.workspace,t.code,t.dock],[19,52,29,"right"]);
 assert.equal(t.blocks+t.workspace+t.code,100);
 const css=layoutVariables(p);
 assert.equal(css["--pane-left-fr"],"19fr");
 assert.equal(css["--pane-editor-fr"],"52fr");
 assert.equal(css["--pane-right-fr"],"29fr");
 assert.equal(css["--pane-height-size"],"72dvh");
 assert.equal(css["--ui-scale"],"1");
});
test("the user can dock code below or to the right without losing selected preferences",()=>{
 const p=normalizeLayoutPrefs({left:25,right:30,height:80,dock:"bottom",scale:110});
 assert.equal(p.height,80);
 assert.equal(p.dock,"bottom");
 assert.equal(p.editor,45);
 assert.deepEqual(displayedPaneWidths(1600,p),{
  mode:"desktop",blocks:25,workspace:75,code:100,visibleOneAtATime:false,dock:"bottom"
 });
 assert.equal(layoutVariables(p)["--pane-bottom-editor-fr"],"75fr");
 assert.equal(displayedPaneWidths(1600,{...p,dock:"right"}).code,30);
});
test("tablets auto-dock code below while phone tabs get full screen width",()=>{
 const pref={left:24,right:40,height:90,dock:"right"};
 assert.deepEqual(displayedPaneWidths(1080,pref),{
  mode:"tablet",blocks:26,workspace:74,code:100,visibleOneAtATime:false,dock:"bottom"
 });
 assert.deepEqual(displayedPaneWidths(580,pref),{
  mode:"phone",blocks:100,workspace:100,code:100,visibleOneAtATime:true,dock:"tabs"
 });
 for(const width of [280,320,375,430,600,760,761,800,1090,1280,1281,1920,2560]){
  const dims=displayedPaneWidths(width,pref);
  assert.ok(dims.blocks>0&&dims.workspace>0&&dims.code>0,width);
  if(dims.mode==="desktop"&&dims.dock==="right")
   assert.equal(dims.blocks+dims.workspace+dims.code,100);
 }
});
test("screen percentage height and dock settings recover from malformed saved settings",()=>{
 for(const p of [{height:-500,dock:"elsewhere",scale:0},{height:Infinity,dock:null},
  {height:"NaN",dock:12},{height:null,left:null,right:"",scale:null},
  {height:10000,left:999,right:999},{height:"83",dock:"bottom"}]){
  const n=normalizeLayoutPrefs(p);
  assert.ok(Number.isInteger(n.height));
  assert.ok(n.height>=LIMITS.height[0]&&n.height<=LIMITS.height[1]);
  assert.ok(["right","bottom"].includes(n.dock));
  assert.equal(n.left+n.editor+n.right,100);
  assert.ok(n.editor>=27);
 }
 assert.deepEqual(normalizeLayoutPrefs(null),{
  left:19,right:29,editor:52,scale:100,height:72,dock:"right"
 });
 assert.equal(normalizeLayoutPrefs({height:null}).height,72);
});
test("new screen geometry is last CSS, uses fr ratios and dynamic viewport height",()=>{
 const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const css=readFileSync(new URL("../styles/screen-percent-v22.css",import.meta.url),"utf8");
 assert.ok(index.includes('href="styles/screen-percent-v22.css"'));
 assert.ok(index.indexOf("screen-percent-v22.css")>index.indexOf("v2-workbench.css"));
 assert.match(css,/grid-template-columns:minmax\(0,var\(--pane-left-fr\)\) minmax\(0,var\(--pane-editor-fr\)\) minmax\(0,var\(--pane-right-fr\)\)/);
 assert.match(css,/height:var\(--pane-height-size\)/);
 assert.match(css,/body\[data-code-dock="bottom"\]/);
 assert.match(css,/@media \(min-width:761px\) and \(max-width:1280px\)/);
 assert.match(css,/@media \(max-width:760px\)/);
 assert.match(css,/@media\(max-width:380px\)/);
 assert.match(css,/grid-template-columns:minmax\(0,26fr\) minmax\(0,74fr\)/);
 let depth=0;
 for(const c of css.replace(/\/\*[\s\S]*?\*\//g,"")){
  if(c==="{")depth++;
  if(c==="}")depth--;
  assert.ok(depth>=0);
 }
 assert.equal(depth,0);
});
test("Studio toolbar controls reflect effective sizes and are wired to layout preferences",()=>{
 const s=readFileSync(new URL("../src/studio.js",import.meta.url),"utf8");
 for(const id of ["panelHeight","panelHeightPercent","codeDock","leftSize","rightSize","centerPercent","resetLayout"]){
  assert.ok(s.includes('id="'+id+'"'),id);
 }
 assert.match(s,/layoutVariables\(prefs\)/);
 assert.match(s,/prefs\.height=Number\(e\.target\.value\)/);
 assert.match(s,/prefs\.dock=e\.target\.value/);
 assert.match(s,/document\.body\.dataset\.codeDock=widths\.dock/);
 assert.match(s,/widths\.workspace\+"%"/);
 assert.match(s,/rightSize"\)\.disabled=widths\.dock!=="right"/);
});
