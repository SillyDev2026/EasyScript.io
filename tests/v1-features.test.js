import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {DEFINITIONS,VERSION,projectTemplate,addBlock,generate,lint} from "../src/engine.js";
import {newExpression,compileExpression,validateExpression,expressionType} from "../src/expressions.js";
import {analyzeWorkspace} from "../src/project-graph.js";
import {createWorkspace,addFile,activeFile,chooseFile,bundleSources} from "../src/workspace.js";
import {createZip,workspaceZipEntries} from "../src/zip.js";
import {addRecovery,listRecovery,restoreRecovery} from "../src/recovery.js";

const store=()=>{const d=new Map();return {getItem:k=>d.get(k)||null,setItem:(k,v)=>d.set(k,String(v))};};
test("v1 ships 131 backward-compatible scripting blocks",()=>{
  assert.equal(VERSION,"2.0.0");
  assert.equal(Object.keys(DEFINITIONS).length,172);
  for(const type of ["requireModule","moduleReturn","jsImportModule"])assert.ok(DEFINITIONS[type]);
});
test("composable numeric slots compile into canonical Luau and JS",()=>{
  const add=newExpression("add");
  add.left={kind:"number",value:"5"};
  add.right={kind:"multiply",left:{kind:"number",value:"2"},right:{kind:"number",value:"3"}};
  assert.deepEqual(validateExpression(add,"luau"),[]);
  assert.equal(compileExpression(add,"luau"),"(5 + (2 * 3))");
  assert.equal(compileExpression(add,"javascript"),"(5 + (2 * 3))");
  assert.equal(expressionType(add),"number");
});
test("typed expression slots detect invalid combinations",()=>{
  const and=newExpression("and");
  assert.ok(validateExpression(and,"luau").some(s=>s.includes("boolean")));
  and.left=newExpression("boolean");and.right=newExpression("boolean");
  assert.deepEqual(validateExpression(and,"luau"),[]);
  assert.equal(compileExpression(and,"luau"),"(true and true)");
  assert.equal(compileExpression(and,"javascript"),"(true && true)");
});
test("numeric, string, variable and vector expression compilation",()=>{
  assert.equal(compileExpression({kind:"string",value:'hi "there"'}),"\"hi \\\"there\\\"\"");
  assert.equal(compileExpression({kind:"variable",value:"Coins"}),"Coins");
  assert.ok(validateExpression({kind:"variable",value:"Coins;print(1)"}).length);
  const vector=newExpression("vector3");
  assert.equal(compileExpression(vector,"luau"),"Vector3.new(0, 0, 0)");
  assert.throws(()=>compileExpression(vector,"javascript"),/Vector3/);
});
test("visual ModuleScript require, return and JS import emit code",()=>{
  const p=projectTemplate("blank");
  addBlock(p,"requireModule");
  const tail=addBlock(p,"moduleReturn");tail.fields.value="Inventory";
  assert.match(generate(p),/local Inventory = require\(script.Parent.Inventory\)/);
  assert.match(generate(p),/return Inventory/);
  assert.doesNotMatch(generate(p),/_G/);
  const js=projectTemplate("blank");js.language="javascript";
  addBlock(js,"jsImportModule");
  assert.match(generate(js),/await import\("\.\/Inventory.js"\)/);
  assert.doesNotThrow(()=>new vm.Script(generate(js)));
});
test("invalid middle ModuleScript return is safely commented and diagnosed",()=>{
  const p=projectTemplate("blank");
  addBlock(p,"moduleReturn");addBlock(p,"print");
  assert.match(generate(p),/ModuleScript return must be/);
  assert.ok(lint(p).some(x=>x.message.includes("ModuleScript return")));
});
test("workspace module graph identifies links and absent modules",()=>{
  const ws=createWorkspace(projectTemplate("blank"));
  const main=activeFile(ws),module=addFile(ws,"Inventory","ModuleScript");
  addBlock(main.project,"requireModule");
  const graph=analyzeWorkspace(ws);
  assert.equal(graph.links.length,1);
  assert.equal(graph.links[0].from,main.id);
  assert.equal(graph.links[0].to,module.id);
  assert.equal(graph.connectedFiles,2);
  addBlock(main.project,"requireModule").fields.path="script.Parent.DoesNotExist";
  assert.ok(analyzeWorkspace(ws).issues.some(x=>x.message.includes("not in workspace")));
});
test("dependency cycle between ModuleScripts is warned",()=>{
  const ws=createWorkspace(projectTemplate("blank"));
  const a=addFile(ws,"ModuleA","ModuleScript");
  const b=addFile(ws,"ModuleB","ModuleScript");
  addBlock(a.project,"requireModule").fields.path="script.Parent.ModuleB";
  addBlock(b.project,"requireModule").fields.path="script.Parent.ModuleA";
  assert.ok(analyzeWorkspace(ws).issues.some(x=>x.message.includes("Circular")));
});
test("ZIP32 exporter includes Lua and JavaScript source plus workspace backup",()=>{
  const ws=createWorkspace(projectTemplate("blank"));
  const js=addFile(ws,"Browser","JavaScript");addBlock(js.project,"jsQuery");
  const entries=workspaceZipEntries(ws,bundleSources,generate);
  assert.equal(entries.length,5);
  const bytes=createZip(entries);
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  assert.equal(view.getUint32(0,true),0x04034b50);
  assert.equal(view.getUint32(bytes.length-22,true),0x06054b50);
  assert.equal(view.getUint16(bytes.length-12,true),5);
  const decoder=new TextDecoder();
  let pos=0;const decoded=new Map();
  for(let i=0;i<entries.length;i++){
    assert.equal(view.getUint32(pos,true),0x04034b50);
    const length=view.getUint16(pos+26,true),size=view.getUint32(pos+18,true);
    const name=decoder.decode(bytes.subarray(pos+30,pos+30+length));
    decoded.set(name,decoder.decode(bytes.subarray(pos+30+length,pos+30+length+size)));
    pos+=30+length+size;
  }
  assert.ok(decoded.has("project.easyscript-workspace.json"));
  assert.ok(decoded.has("scripts/Browser.js"));
  assert.ok(decoded.get("scripts/Browser.js").includes("document.querySelector"));
});
test("ZIP paths reject directory traversal and duplicated names",()=>{
  assert.throws(()=>createZip([{name:"../evil.js",data:"x"}]),/Unsafe/);
  assert.throws(()=>createZip([{name:"a.js",data:"x"},{name:"A.js",data:"y"}]),/Duplicate/);
});
test("auto recovery is bounded, throttled and immutable",()=>{
  const storage=store(),ws=createWorkspace();
  assert.equal(addRecovery(storage,ws,1000),true);
  assert.equal(addRecovery(storage,ws,2000),false);
  ws.name="Changed";
  assert.equal(restoreRecovery(storage,1000).name,"My Workspace");
  assert.equal(addRecovery(storage,ws,500000),true);
  assert.equal(listRecovery(storage).length,2);
  for(let i=0;i<18;i++)addRecovery(storage,ws,600000+i*200000,true);
  assert.equal(listRecovery(storage).length,8);
});
