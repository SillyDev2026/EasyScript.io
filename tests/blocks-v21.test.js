import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {DEFINITIONS,VERSION,projectTemplate,addBlock,generate,lint,sanitizeProject} from "../src/engine.js";
import {LUAU_V21_DEFINITIONS} from "../src/luau-v21.js";
import {JS_V21_DEFINITIONS,validJSName} from "../src/javascript-v21.js";
const blank=language=>{const p=projectTemplate("blank");p.language=language;return p;};
test("v2.1 has exactly 77 extra blocks: 39 Luau + 38 JS, for 249 total",()=>{
 assert.equal(VERSION,"2.4.0");
 assert.equal(Object.keys(LUAU_V21_DEFINITIONS).length,39);
 assert.equal(Object.keys(JS_V21_DEFINITIONS).length,38);
 assert.equal(Object.keys(DEFINITIONS).length,249);
 for(const id of Object.keys(LUAU_V21_DEFINITIONS))assert.ok(!Object.hasOwn(JS_V21_DEFINITIONS,id));
});
test("all new Luau blocks emit a concrete source statement and no _G use",()=>{
 for(const id of Object.keys(LUAU_V21_DEFINITIONS)){
  const p=blank("luau");const b=addBlock(p,id);
  const output=generate(p);
  assert.ok(output.length>45,id);
  assert.doesNotMatch(output,/_G(?:\.|\[)/,id);
  assert.doesNotMatch(output,/Unsupported block:/,id);
  assert.doesNotMatch(output,/(?:local|const)\s+[A-Za-z_]\w*\s*=\s*$/m,id);
  assert.ok(lint(p).every(x=>x.severity!=="error"),id+":"+JSON.stringify(lint(p)));
  const saved=sanitizeProject(JSON.parse(JSON.stringify(p)));
  assert.equal(saved.blocks[0].type,id);
 }
});
test("new Luau blocks generate graceful comments in JS rather than invalid foreign code",()=>{
 for(const id of Object.keys(LUAU_V21_DEFINITIONS)){
  const p=blank("javascript");addBlock(p,id);
  const output=generate(p);
  assert.match(output,/Roblox Luau-only block:/,id);
  assert.doesNotThrow(()=>new vm.Script(output),id);
  assert.ok(lint(p).some(x=>x.severity==="warning"),id);
 }
});
test("all new JavaScript blocks compile syntactically under Node vm.Script",()=>{
 for(const id of Object.keys(JS_V21_DEFINITIONS)){
  const p=blank("javascript");addBlock(p,id);
  const output=generate(p);
  assert.doesNotThrow(()=>new vm.Script(output),id+"\n"+output);
  assert.doesNotMatch(output,/Unsupported block:/,id);
  assert.ok(lint(p).every(x=>x.severity!=="error"),id+":"+JSON.stringify(lint(p)));
  assert.equal(sanitizeProject(JSON.parse(JSON.stringify(p))).blocks[0].type,id);
 }
});
test("new JS blocks safely emit Lua comments when used in Luau",()=>{
 for(const id of Object.keys(JS_V21_DEFINITIONS)){
  const p=blank("luau");addBlock(p,id);
  const output=generate(p);
  assert.match(output,/-- JavaScript-only block:/,id);
  assert.ok(lint(p).some(x=>x.severity==="warning"),id);
 }
});
test("nested new callback blocks preserve indentation and syntactic closure",()=>{
 const p=blank("javascript");
 const event=addBlock(p,"js21SubmitEvent");
 addBlock(p,"js21ArrayMap",event.id,"body");
 const loop=addBlock(p,"js21ForEach",event.id,"body");
 addBlock(p,"jsWarn",loop.id,"body").fields.value='"Tick"';
 const observer=addBlock(p,"js21MutationObserver");
 addBlock(p,"jsWarn",observer.id,"body");
 const code=generate(p);
 assert.match(code,/addEventListener\('submit', async \(event\) => \{/);
 assert.match(code,/\.map\(\(item, index\) => item \* 2\)/);
 assert.match(code,/\.forEach\(\(item, index\) => \{/);
 assert.match(code,/observer\.observe\(/);
 assert.doesNotThrow(()=>new vm.Script(code));
});
test("Luau new events and repeated temp variables use explicit local scopes",()=>{
 const p=blank("luau");
 const event=addBlock(p,"luaPromptTriggered");
 addBlock(p,"luaWaitForChild",event.id,"body");
 addBlock(p,"luaGetAttribute",event.id,"body");
 addBlock(p,"luaTaskDelay");
 const output=generate(p);
 assert.match(output,/\.Triggered:Connect\(function\(player\)/);
 assert.match(output,/local child = workspace|local child = script\.Parent/);
 assert.match(output,/task.delay\(1, function\(\)/);
 assert.doesNotMatch(output,/_G(?:\.|\[)/);
});
test("JS identifiers reject reserved keywords but allow standard $ variables",()=>{
 for(const name of ["let","for","import","await","class","return","const","default"]){
  assert.equal(validJSName(name),false,name);
  const p=blank("javascript"),b=addBlock(p,"js21NewMap");b.fields.name=name;
  assert.ok(lint(p).some(x=>x.severity==="error"),name);
 }
 assert.equal(validJSName("$count"),true);
 assert.equal(validJSName("score_2"),true);
 const p=blank("javascript"),b=addBlock(p,"jsQuery");b.fields.name="$element";
 assert.ok(lint(p).every(x=>x.severity!=="error"));
});
test("real-world Roblox API output uses expected methods and event signatures",()=>{
 const p=blank("luau");
 for(const id of ["luaWaitForChild","luaSetAttribute","luaTagged","luaNewCFrame","luaCreateTween","luaFireClient","luaJSONEncode","luaPromptTriggered","luaCharacterAdded","luaTaskDefer"])
  addBlock(p,id);
 const code=generate(p);
 for(const needle of [":WaitForChild(",":SetAttribute(","GetTagged(","CFrame.new(","TweenService",":FireClient(","JSONEncode(","Triggered:Connect(","CharacterAdded:Connect(","task.defer("]){
  assert.ok(code.includes(needle),needle);
 }
});
test("generated assignments stay on one physical line",()=>{
 const p=blank("luau");
 const b=addBlock(p,"luaGetAttribute");
 b.fields.target="workspace\n .Part";
 const code=generate(p);
 assert.doesNotMatch(code,/=\s*\n/);
 assert.ok(lint(p).some(x=>x.severity==="error"&&x.message.includes("line")));
});

test("hoisted Roblox service names cannot be accidentally shadowed by user variables",()=>{
 const players=blank("luau");
 addBlock(players,"playerJoined");
 addBlock(players,"variable").fields.name="Players";
 assert.ok(lint(players).some(x=>x.severity==="error"&&x.message.includes("service handle")));
 const datastore=blank("luau");
 addBlock(datastore,"datastoreGet");
 addBlock(datastore,"variable").fields.name="DataStoreService";
 assert.ok(lint(datastore).some(x=>x.severity==="error"&&x.message.includes("DataStoreService")));
});
test("multiple new blocks with the same declared local trigger a duplicate diagnostic",()=>{
 const p=blank("luau");
 addBlock(p,"luaGetAttribute");
 addBlock(p,"luaGetAttribute");
 assert.ok(lint(p).some(x=>x.severity==="warning"&&x.message.includes("Duplicate local health")));
 const js=blank("javascript");
 addBlock(js,"js21NewSet");addBlock(js,"js21NewSet");
 assert.ok(lint(js).some(x=>x.severity==="warning"&&x.message.includes("Duplicate local unique")));
});
test("eight v2.1 educational templates compile in their correct scripting language",()=>{
 const templates=["luaAttributeWatch","luaTweenDemo","luaPromptDemo","luaJsonDemo",
   "jsArrayDemo","jsMapDemo","jsFormDemo","jsQueryDemo"];
 for(const type of templates){
  const p=projectTemplate(type);
  assert.ok(p.blocks.length>0,type);
  assert.ok(lint(p).every(issue=>issue.severity!=="error"),type+":"+JSON.stringify(lint(p)));
  const generated=generate(p);
  assert.doesNotMatch(generated,/Unsupported block:/,type);
  if(p.language==="javascript")assert.doesNotThrow(()=>new vm.Script(generated),type);
 }
});
