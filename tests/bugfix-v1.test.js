import test from "node:test";
import assert from "node:assert/strict";
import {newExpression,validateExpression,compileExpression} from "../src/expressions.js";
import {projectTemplate,addBlock,generate,lint} from "../src/engine.js";
import {createWorkspace,addFile,activeFile,commitActive,validateWorkspace,bundleSources} from "../src/workspace.js";
import {analyzeWorkspace} from "../src/project-graph.js";
import {createZip} from "../src/zip.js";

test("empty numeric input fails rather than silently becoming zero",()=>{
  for(const value of [""," ","\n"]){
    const expr={kind:"number",value};
    assert.ok(validateExpression(expr).some(e=>e.includes("nonempty")));
    assert.throws(()=>compileExpression(expr));
  }
});
test("a boolean must be an actual boolean, not a truthy string",()=>{
  assert.ok(validateExpression({kind:"boolean",value:"false"}).some(x=>x.includes("Boolean")));
  assert.equal(compileExpression({kind:"boolean",value:false}),"false");
  assert.equal(compileExpression({kind:"boolean",value:true}),"true");
});
test("expression identifiers reject reserved Luau and JS words",()=>{
  assert.ok(validateExpression({kind:"variable",value:"local"},"luau").length);
  assert.ok(validateExpression({kind:"variable",value:"const"},"javascript").length);
  assert.ok(validateExpression({kind:"variable",value:"Coins"},"luau").length===0);
  assert.ok(validateExpression({kind:"variable",value:"Coins"},"javascript").length===0);
});
test("division by zero and invalid random ranges report errors",()=>{
  assert.ok(validateExpression({kind:"divide",left:newExpression("number"),right:newExpression("number")}).length);
  const range=newExpression("random");
  range.left={kind:"number",value:"10"};range.right={kind:"number",value:"1"};
  assert.ok(validateExpression(range).some(x=>x.includes("Random range")));
  range.left.value="1.5";range.right.value="5";
  assert.ok(validateExpression(range).some(x=>x.includes("integer")));
  range.left.value="1";range.right.value="5";
  assert.deepEqual(validateExpression(range),[]);
});
test("unknown languages and deeply nested expression trees are rejected",()=>{
  assert.ok(validateExpression(newExpression("number"),"python").length);
  let expr=newExpression("number");
  for(let i=0;i<9;i++)expr={kind:"not",child:expr};
  assert.ok(validateExpression(expr).some(x=>x.includes("depth")));
});
test("ModuleScript return inside if is flagged and never emitted as nested Luau return",()=>{
  const p=projectTemplate("blank"),condition=addBlock(p,"if");
  addBlock(p,"moduleReturn",condition.id,"then");
  assert.ok(lint(p).some(x=>x.message.includes("ModuleScript return")));
  const code=generate(p);
  assert.match(code,/-- ModuleScript return must be/);
  assert.doesNotMatch(code,/\n\s+return Inventory/);
});
test("old wrong file extensions normalize without losing block data",()=>{
  const ws=createWorkspace(projectTemplate("blank"));
  const js=addFile(ws,"website.luau","JavaScript");
  assert.equal(js.name,"website.js");
  const lua=addFile(ws,"Inventory.js","ModuleScript");
  assert.equal(lua.name,"Inventory.luau");
  const validated=validateWorkspace(JSON.parse(JSON.stringify(ws)));
  assert.equal(validated.files.length,3);
  assert.deepEqual(validated.files.map(f=>f.name),["Main.luau","website.js","Inventory.luau"]);
});
test("switching active script language updates its kind and exported filename",()=>{
  const ws=createWorkspace(projectTemplate("blank"));
  const file=activeFile(ws);
  const oldId=file.id;
  const project=projectTemplate("blank");project.language="javascript";
  addBlock(project,"jsQuery");
  commitActive(ws,project);
  assert.equal(activeFile(ws).kind,"JavaScript");
  assert.equal(activeFile(ws).name,"Main.js");
  assert.equal(activeFile(ws).id,oldId);
  assert.equal(bundleSources(ws)[0].filename,"Main.js");
  project.language="luau";commitActive(ws,project);
  assert.equal(activeFile(ws).name,"Main.luau");
  assert.equal(activeFile(ws).kind,"Script");
  assert.equal(activeFile(ws).project.blocks.length,1);
});
test("renaming matching Lua and JavaScript files does not collide",()=>{
  const ws=createWorkspace(projectTemplate("blank"));
  const a=addFile(ws,"Same","ModuleScript");
  const b=addFile(ws,"Same","JavaScript");
  assert.equal(a.name,"Same.luau");
  assert.equal(b.name,"Same.js");
  const report=analyzeWorkspace(ws);
  assert.equal(report.nodes.length,3);
});
test("ZIP path validation rejects traversal and valid Unicode filenames remain supported",()=>{
  assert.throws(()=>createZip([{name:"scripts/../escape.js",data:"X"}]),/Unsafe/);
  const buf=createZip([{name:"scripts/Über.luau",data:"print('ok')"}]);
  assert.ok(buf instanceof Uint8Array);
});

test("DataStore alias avoids locally declared names and stays unique",()=>{
  const p=projectTemplate("blank");
  addBlock(p,"variable").fields.name="playerDataStore";
  const event=addBlock(p,"playerJoined");
  addBlock(p,"datastoreGet",event.id,"body");
  const code=generate(p);
  assert.match(code,/local playerDataStore2 = DataStoreService:GetDataStore/);
  assert.match(code,/return playerDataStore2:GetAsync/);
  assert.equal((code.match(/local playerDataStore = /g)||[]).length,1);
});
test("source code names readable parts and repeat indices without internal IDs",()=>{
  const p=projectTemplate("blank");
  addBlock(p,"createPart");
  addBlock(p,"repeat");
  const source=generate(p);
  assert.match(source,/local myPart = Instance.new\("Part"\)/);
  assert.match(source,/for index = 1, 3 do/);
  assert.doesNotMatch(source,/part_b_|__index_/);
});
test("script variables may not mask automatic Roblox service locals",()=>{
  const p=projectTemplate("blank");
  addBlock(p,"globalWrite").fields.key="Players";
  addBlock(p,"playerJoined");
  const diagnostics=lint(p);
  assert.ok(diagnostics.some(x=>x.severity==="error"&&x.message.includes("Players")));
});
