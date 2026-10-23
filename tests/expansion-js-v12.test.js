import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {DEFINITIONS,projectTemplate,addBlock,generate,lint} from "../src/engine.js";
import {EXPANDED_JS_DEFINITIONS} from "../src/expanded-javascript.js";
test("15 new browser blocks are installed",()=>{
 assert.equal(Object.keys(EXPANDED_JS_DEFINITIONS).length,15);
 assert.equal(Object.keys(DEFINITIONS).length,172);
});
test("new JS blocks compile to syntax-valid JavaScript with existing async main wrapper",()=>{
 for(const type of Object.keys(EXPANDED_JS_DEFINITIONS)){
  const p=projectTemplate("blank");p.language="javascript";
  addBlock(p,type);
  const source=generate(p);
  assert.doesNotThrow(()=>new vm.Script(source),type);
  assert.doesNotMatch(source,/Unsupported block:/,type);
 }
});
test("DOM builder operations generate correct API code",()=>{
 const p=projectTemplate("blank");p.language="javascript";
 for(const type of ["jsCreateElement","jsAppendChild","jsSetStyle","jsGetDataset","jsListenEvent"]){
  addBlock(p,type);
 }
 const code=generate(p);
 assert.match(code,/document.createElement\("div"\)/);
 assert.match(code,/document.body.append\(element\)/);
 assert.match(code,/element.style\["backgroundColor"\] = "red"/);
 assert.match(code,/element.addEventListener\("click", async \(event\) =>/);
 assert.doesNotThrow(()=>new vm.Script(code));
});
test("JS async text fetch includes response status validation",()=>{
 const p=projectTemplate("blank");p.language="javascript";addBlock(p,"jsFetchText");
 const code=generate(p);
 assert.match(code,/await fetch/);
 assert.match(code,/if \(!response.ok\)/);
 assert.doesNotThrow(()=>new vm.Script(code));
});
test("new JavaScript blocks generate Luau-safe comments and warnings",()=>{
 const p=projectTemplate("blank");addBlock(p,"jsCreateElement");
 assert.match(generate(p),/JavaScript-only/);
 assert.ok(lint(p).some(x=>x.severity==="warning"));
});
