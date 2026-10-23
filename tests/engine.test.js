import test from "node:test";
import assert from "node:assert/strict";
import {DEFINITIONS,newBlock,projectTemplate,sanitizeProject,addBlock,findLocation,traverse,generate,lint,simulate} from "../src/engine.js";

test("block definitions contain supported primitives",()=>{
  assert.equal(Object.keys(DEFINITIONS).length,9);
  assert.ok(DEFINITIONS.if.branches.includes("else"));
});
test("starter template generates valid-looking nested Luau",()=>{
  const p=projectTemplate("starter"),source=generate(p);
  assert.match(source,/local Coins = 100/);
  assert.match(source,/if Coins >= 100 then/);
  assert.match(source,/else/);
  assert.match(source,/end/);
  assert.equal(lint(p).length,0);
});
test("JavaScript output includes async entrypoint and strict comparison",()=>{
  const p=projectTemplate("starter");p.language="javascript";p.blocks[1].fields.operator="==";
  const source=generate(p);
  assert.match(source,/async function main/);
  assert.match(source,/===/);
  assert.match(source,/console\.log/);
  assert.match(source,/main\(\)\.catch\(console\.error\)/);
});
test("nested repeat creates and sets a value without using eval",()=>{
  const p=projectTemplate("counter");
  const result=simulate(p);
  assert.equal(result.error,null);
  assert.deepEqual(result.messages,["10","20","30","40","50"]);
  assert.equal(result.variables.Coins,50);
});
test("functions can be defined and called",()=>{
  const p=projectTemplate("functions");
  assert.match(generate(p),/local function greet/);
  assert.deepEqual(simulate(p).messages,["Welcome to EasyScript!"]);
  p.language="javascript";
  assert.match(generate(p),/async function greet/);
  assert.match(generate(p),/await greet\(\)/);
});
test("invalid identifiers, missing values and calls are diagnosed",()=>{
  const p=projectTemplate("blank");
  const b=addBlock(p,"variable");b.fields.name="bad name";b.fields.value="";
  const c=addBlock(p,"call");c.fields.name="notThere";
  const issues=lint(p);
  assert.ok(issues.some(x=>x.message.startsWith("Invalid identifier")));
  assert.ok(issues.some(x=>x.message.startsWith("Value cannot")));
  assert.ok(issues.some(x=>x.message.startsWith("Undefined function")));
});
test("projects are normalized and unsafe blocks rejected",()=>{
  const project=sanitizeProject({title:"Test",language:"unsupported",blocks:[{id:"unsafe",type:"eval",fields:{}}]});
  assert.equal(project.language,"luau");
  assert.deepEqual(project.blocks,[]);
  assert.equal(project.title,"Test");
});
test("nested blocks are locatable and traversable",()=>{
  const p=projectTemplate("blank");const loop=addBlock(p,"repeat");
  const nested=addBlock(p,"print",loop.id,"body");
  assert.equal(findLocation(p,nested.id).parent,loop.id);
  let count=0;traverse(p.blocks,()=>count++);
  assert.equal(count,2);
});
test("limited preview reports unsupported expressions safely",()=>{
  const p=projectTemplate("blank");const b=addBlock(p,"print");
  b.fields.value="doSomething()";
  const result=simulate(p);
  assert.match(result.error,/Preview cannot evaluate/);
});
