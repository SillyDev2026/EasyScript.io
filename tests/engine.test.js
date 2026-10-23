import test from "node:test";
import assert from "node:assert/strict";
import {DEFINITIONS,newBlock,projectTemplate,sanitizeProject,addBlock,findLocation,traverse,generate,lint,simulate} from "../src/engine.js";

test("block definitions contain supported primitives",()=>{
  assert.equal(Object.keys(DEFINITIONS).length,129);
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

test("new Roblox event templates output server Luau",()=>{
  const lead=projectTemplate("leaderstats"),touch=projectTemplate("touch"),remote=projectTemplate("remote");
  const source=generate(lead);
  assert.match(source,/PlayerAdded:Connect\(function\(player\)/);
  assert.match(source,/Instance.new\("IntValue"\)/);
  assert.match(source,/FindFirstChild\("leaderstats"\)/);
  assert.equal(lint(lead).filter(issue=>issue.severity==="error").length,0);
  assert.match(generate(touch),/\.Touched:Connect\(function\(hit\)/);
  assert.match(generate(remote),/OnServerEvent:Connect/);
  assert.match(generate(remote),/validate player permissions/);
  assert.ok(lint(remote).some(issue=>issue.severity==="warning"));
});
test("while loops and increments work in preview with a safety limit",()=>{
  const p=projectTemplate("blank"),counter=addBlock(p,"variable"),loop=addBlock(p,"while");
  counter.fields.value="0";loop.fields.left="Coins";loop.fields.operator="<";loop.fields.right="3";
  const increase=addBlock(p,"increment",loop.id,"body");increase.fields.name="Coins";increase.fields.amount="1";
  const log=addBlock(p,"print",loop.id,"body");log.fields.value="Coins";
  assert.deepEqual(simulate(p).messages,["1","2","3"]);
  assert.match(generate(p),/while Coins < 3 do/);
  loop.fields.right="10000";
  assert.match(simulate(p).error,/100 iterations/);
});
test("Lua-only blocks do not generate unsupported JS runtime calls",()=>{
  const p=projectTemplate("leaderstats");p.language="javascript";
  const source=generate(p);
  assert.match(source,/Roblox-only: Player joined/);
  assert.doesNotMatch(source,/Instance.new\(/);
  assert.ok(lint(p).some(issue=>issue.message.includes("Luau-only")));
  assert.match(simulate(p).error,/Roblox Studio/);
});
test("Roblox paths, property names and stat contexts are validated",()=>{
  const p=projectTemplate("blank");
  const stat=addBlock(p,"leaderstat");
  const property=addBlock(p,"setProperty");property.fields.target="workspace.Door;print(1)";
  property.fields.property="invalid property";
  const issues=lint(p).filter(i=>i.severity==="error").map(i=>i.message);
  assert.ok(issues.some(s=>s.includes("Player joined")));
  assert.ok(issues.some(s=>s.includes("Invalid target path")));
  assert.ok(issues.some(s=>s.includes("Invalid property name")));
  assert.equal(stat.type,"leaderstat");
});
test("Roblox service and part blocks generate game API code",()=>{
  const p=projectTemplate("blank");
  const service=addBlock(p,"service");service.fields.service="TweenService";service.fields.alias="TweenService";
  const part=addBlock(p,"createPart");part.fields.name='Brick "A"';
  const src=generate(p);
  assert.match(src,/game:GetService\("TweenService"\)/);
  assert.match(src,/Instance.new\("Part"\)/);
  assert.match(src,/Brick \\"A\\"/);
  assert.equal(lint(p).filter(i=>i.severity==="error").length,0);
});
