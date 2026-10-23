import test from "node:test";
import assert from "node:assert/strict";
import {projectTemplate,addBlock} from "../src/engine.js";
import {SYSTEM_KINDS,generateRobloxSystem,outlineProject,auditProject} from "../src/ultra.js";

test("three Roblox system wizard choices are declared",()=>{
  assert.deepEqual(SYSTEM_KINDS.map(x=>x.id),["speed","coins","checkpoint"]);
});
test("speed pad generator bounds unsafe numeric inputs and retains server guard",()=>{
  const src=generateRobloxSystem("speed",{speed:99999,duration:-5});
  assert.match(src,/WalkSpeed = 100/);
  assert.match(src,/task.delay\(0.5,/);
  assert.match(src,/active\[humanoid\]/);
  assert.match(src,/Players:GetPlayerFromCharacter/);
});
test("coin wizard quotes user labels instead of inserting executable code",()=>{
  const src=generateRobloxSystem("coins",{stat:'Coins"); error("bad',amount:500000,cooldown:0});
  assert.match(src,/coins.Value \+= 100000/);
  assert.match(src,/task.delay\(0.25,/);
  assert.match(src,/FindFirstChild\("Coins\\\"\); error/);
  assert.doesNotMatch(src,/FindFirstChild\("Coins"\); error/);
});
test("checkpoint scripts validate SpawnLocation type",()=>{
  const src=generateRobloxSystem("checkpoint");
  assert.match(src,/SpawnLocation/);
  assert.match(src,/RespawnLocation = checkpoint/);
  assert.throws(()=>generateRobloxSystem("other"),/Unknown Roblox system/);
});
test("hierarchy outline records nested block order",()=>{
  const p=projectTemplate("blank");
  const event=addBlock(p,"playerJoined");
  const child=addBlock(p,"print",event.id,"body");
  const map=outlineProject(p);
  assert.deepEqual(map.map(b=>b.id),[event.id,child.id]);
  assert.deepEqual(map.map(b=>b.depth),[0,1]);
  assert.equal(map[1].branch,"body");
});
test("audit is explicitly heuristic, returns static concerns, and does not run code",()=>{
  const p=projectTemplate("blank");
  addBlock(p,"while");
  addBlock(p,"remoteReceived");
  const report=auditProject(p);
  assert.equal(report.blocks,2);
  assert.equal(report.loops,1);
  assert.equal(report.events,1);
  assert.ok(report.findings.some(f=>f.message.includes("loop")));
  assert.ok(report.findings.some(f=>f.message.includes("trust")));
  assert.match(report.disclaimer,/not a runtime/);
  assert.ok(report.score<100);
});
