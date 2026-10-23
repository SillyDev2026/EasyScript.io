import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {VERSION,DEFINITIONS,projectTemplate,addBlock,generate,lint,simulate} from "../src/engine.js";
import {createWorkspace,validateWorkspace,activeFile,addFile,renameFile,duplicateFile,removeFile,chooseFile,commitActive,saveWorkspace,loadWorkspace,bundleSources} from "../src/workspace.js";

function memoryStorage(){
  const data=new Map();
  return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value))};
}
test("v0.5 exports 36 block types and 4 additional templates",()=>{
  assert.equal(VERSION,"0.6.0");
  assert.equal(Object.keys(DEFINITIONS).length,129);
  for(const key of ["list","loop","attributes","join"])assert.ok(projectTemplate(key).blocks.length);
});
test("list template previews deterministic list operations",()=>{
  const p=projectTemplate("list");
  const result=simulate(p);
  assert.equal(result.error,null);
  assert.deepEqual(result.messages,["2"]);
  assert.deepEqual(result.variables.Items,[10,20]);
});
test("math, text and list generators produce Luau and parseable JS",()=>{
  const p=projectTemplate("blank");
  for(const type of ["random","clamp","concat","length","array","append","removeAt","listSize","each","forRange"]){
    addBlock(p,type);
  }
  const lua=generate(p);
  assert.match(lua,/math.random\(1, 6\)/);
  assert.match(lua,/math.clamp\(/);
  assert.match(lua,/table.insert\(Items, 5\)/);
  assert.match(lua,/for _, item in ipairs\(Items\) do/);
  assert.match(lua,/for i = 1, 10, 1 do/);
  p.language="javascript";
  const js=generate(p);
  assert.match(js,/Math.random/);
  assert.match(js,/Math.min/);
  assert.match(js,/Items.push\(5\)/);
  assert.match(js,/for \(const item of Items\)/);
  assert.doesNotThrow(()=>new vm.Script(js));
});
test("loop preview respects finite iteration caps",()=>{
  const p=projectTemplate("loop");
  assert.deepEqual(simulate(p).messages,["1","2","3","4","5","6","7","8","9","10"]);
  p.blocks[0].fields.end="1000";
  assert.match(simulate(p).error,/100 iterations/);
});
test("block context diagnostics identify invalid return and break",()=>{
  const p=projectTemplate("blank");
  addBlock(p,"returnValue");addBlock(p,"breakLoop");addBlock(p,"characterAdded");
  const errors=lint(p).map(x=>x.message);
  assert.ok(errors.some(x=>x.includes("Return must")));
  assert.ok(errors.some(x=>x.includes("Break must")));
  assert.ok(errors.some(x=>x.includes("Character spawned requires")));
});
test("nested function/loop scopes allow return and break",()=>{
  const p=projectTemplate("blank");
  const func=addBlock(p,"function");
  addBlock(p,"returnValue",func.id,"body");
  const loop=addBlock(p,"forRange");
  addBlock(p,"breakLoop",loop.id,"body");
  assert.equal(lint(p).filter(x=>x.severity==="error").length,0);
});
test("Roblox object blocks generate server Luau and JS warnings",()=>{
  const p=projectTemplate("attributes");
  const lua=generate(p);
  assert.match(lua,/:SetAttribute\("Open", true\)/);
  assert.match(lua,/:GetAttribute\("Open"\)/);
  p.language="javascript";
  assert.match(generate(p),/Luau only/);
  assert.ok(lint(p).some(x=>x.severity==="warning"));
  assert.match(simulate(p).error,/Preview does not support/);
});
test("workspace migrates older single-project data safely",()=>{
  const storage=memoryStorage(),p=projectTemplate("counter");
  const ws=loadWorkspace(storage,p);
  assert.equal(ws.files.length,1);
  assert.equal(activeFile(ws).project.title,"Coin Counter");
  saveWorkspace(storage,ws);
  const reloaded=loadWorkspace(storage,projectTemplate("blank"));
  assert.equal(activeFile(reloaded).project.title,"Coin Counter");
});
test("multi-file workspace supports independent script edits and switching",()=>{
  const ws=createWorkspace(projectTemplate("blank"));
  const first=activeFile(ws).id;
  addFile(ws,"Code","JavaScript");
  const second=activeFile(ws);
  assert.equal(second.project.language,"javascript");
  commitActive(ws,projectTemplate("functions"));
  chooseFile(ws,first);
  assert.equal(activeFile(ws).project.title,"Untitled Project");
  chooseFile(ws,second.id);
  assert.equal(activeFile(ws).project.title,"Function Demo");
});
test("file manager can rename, duplicate and delete without name collisions",()=>{
  const ws=createWorkspace();
  const file=addFile(ws,"Inventory","ModuleScript");
  const copy=duplicateFile(ws,file.id);
  assert.notEqual(copy.id,file.id);
  assert.notEqual(copy.name,file.name);
  renameFile(ws,copy.id,file.name);
  assert.notEqual(copy.name,file.name);
  removeFile(ws,copy.id);
  assert.equal(ws.files.length,2);
  removeFile(ws,file.id);
  assert.throws(()=>removeFile(ws,activeFile(ws).id),/at least one/);
});
test("workspace import rejects empty and overly large bundles",()=>{
  assert.throws(()=>validateWorkspace({files:[]}),/between 1/);
  const ws=createWorkspace();
  for(let i=1;i<24;i++)addFile(ws,"file"+i);
  assert.equal(ws.files.length,24);
  assert.throws(()=>addFile(ws,"Overflow"),/limit/);
  assert.equal(validateWorkspace(JSON.parse(JSON.stringify(ws))).files.length,24);
});
test("source manifest includes every file in stable order",()=>{
  const ws=createWorkspace(projectTemplate("starter"));
  addFile(ws,"Inventory","ModuleScript","list");
  const files=bundleSources(ws);
  assert.equal(files.length,2);
  assert.ok(files.every(file=>file.filename.endsWith(".luau")));
  assert.deepEqual(files.map(f=>f.project.title),["My First Script","List Operations"]);
});
