import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {projectTemplate,addBlock,generate,lint} from "../src/engine.js";
import {auditProject} from "../src/ultra.js";

test("misplaced Break and Return become comments, never invalid JavaScript",()=>{
  const p=projectTemplate("blank");p.language="javascript";
  addBlock(p,"breakLoop");addBlock(p,"returnValue");
  const code=generate(p);
  assert.doesNotThrow(()=>new vm.Script(code));
  assert.doesNotMatch(code,/\n\s*break;/);
  assert.ok(lint(p).some(issue=>issue.message.includes("Break must")));
  assert.ok(lint(p).some(issue=>issue.message.includes("Return must")));
});
test("legal nested Break inside loop compiles in JS and Luau",()=>{
  const p=projectTemplate("blank"),loop=addBlock(p,"repeat");
  const ifBlock=addBlock(p,"if",loop.id,"body");
  addBlock(p,"breakLoop",ifBlock.id,"then");
  assert.equal(lint(p).filter(issue=>issue.severity==="error").length,0);
  assert.match(generate(p),/break\n/);
  p.language="javascript";
  assert.doesNotThrow(()=>new vm.Script(generate(p)));
});
test("per-frame costly block triggers targeted optimization warning",()=>{
  const p=projectTemplate("blank"),frame=addBlock(p,"eventHeartbeat");
  addBlock(p,"instanceDescendants",frame.id,"body");
  const report=auditProject(p);
  assert.ok(report.events>=1);
  assert.ok(report.findings.some(item=>item.message.includes("Expensive work")));
  assert.match(report.disclaimer,/Static suggestions/);
});
test("global values have portable semantics and remain explicit",()=>{
  const p=projectTemplate("globalCounter");
  assert.match(generate(p),/local Coins = 0/);
  p.language="javascript";
  assert.match(generate(p),/globalThis\["Coins"\]/);
  assert.doesNotThrow(()=>new vm.Script(generate(p)));
});
