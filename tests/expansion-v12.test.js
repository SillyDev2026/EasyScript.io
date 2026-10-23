import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {DEFINITIONS,VERSION,projectTemplate,addBlock,generate,lint,sanitizeProject} from "../src/engine.js";
import {EXPANDED_LUAU_DEFINITIONS} from "../src/expanded-luau.js";
import {allBlocks,performBulk,normalizeSelection,setBlockNote,renameVariable,saveSnippet,
 listSnippets,insertSnippet,toggleBookmark,listBookmarks,diagnosticSummary,projectSourceMinimap} from "../src/editor-ops.js";
const memory=()=>{const entries=new Map();return {getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,String(v))};};
test("v1.2 contains 26 more Roblox blocks and 172 total",()=>{
 assert.equal(VERSION,"1.3.0");
 assert.equal(Object.keys(EXPANDED_LUAU_DEFINITIONS).length,26);
 assert.equal(Object.keys(DEFINITIONS).length,172);
});
test("every new API block emits concrete Luau or clear JavaScript-only comments",()=>{
 for(const type of Object.keys(EXPANDED_LUAU_DEFINITIONS)){
  const lua=projectTemplate("blank");addBlock(lua,type);
  const output=generate(lua);
  assert.ok(output.length>45,type);
  assert.doesNotMatch(output,/Unsupported block:/,type);
  assert.doesNotMatch(output,/undefined\s*\(/,type);
  const js=projectTemplate("blank");js.language="javascript";addBlock(js,type);
  assert.match(generate(js),/Roblox-only:/,type);
  assert.doesNotThrow(()=>new vm.Script(generate(js)),type);
 }
});
test("specialized Roblox blocks include correct method calls",()=>{
 const p=projectTemplate("blank");
 for(const type of ["raycast","overlapQuery","humanoidMoveTo","tagAdd","datastoreUpdate","debrisAdd","memoryQueue","memorySortedMap"]){
   addBlock(p,type);
 }
 const code=generate(p);
 for(const method of ["workspace:Raycast","GetPartBoundsInBox","MoveTo","AddTag","UpdateAsync","AddItem","GetQueue","GetSortedMap"])
  assert.ok(code.includes(method),method);
});
test("function arguments and Luau type annotations keep assignments on one line",()=>{
 const p=projectTemplate("blank");
 const variable=addBlock(p,"variable");variable.fields.type="number";
 const fn=addBlock(p,"function");fn.fields.params="n: number, extra: number";fn.fields.returnType="number";
 addBlock(p,"returnValue",fn.id,"body").fields.value="n + extra";
 const call=addBlock(p,"call");call.fields.args="2, 3";
 const code=generate(p);
 assert.match(code,/local Coins: number = 100/);
 assert.match(code,/local function greet\(n: number, extra: number\): number/);
 assert.match(code,/greet\(2, 3\)/);
 assert.doesNotMatch(code,/=\s*\n/);
});
test("invalid typed parameter declarations are linted",()=>{
 const p=projectTemplate("blank"),f=addBlock(p,"function");f.fields.params="n: number, n: number";
 assert.ok(lint(p).some(x=>x.message.includes("duplicate function parameter")));
 p.language="javascript";
 assert.ok(lint(p).some(x=>x.message.includes("Luau parameter")));
});
test("bulk operations select ancestor only and prevent double deletion",()=>{
 const p=projectTemplate("blank"),parent=addBlock(p,"repeat"),child=addBlock(p,"print",parent.id,"body");
 const selection=normalizeSelection(p,[parent.id,child.id]);
 assert.deepEqual(selection,[parent.id]);
 assert.equal(performBulk(p,[parent.id,child.id],"duplicate"),1);
 assert.equal(p.blocks.length,2);
 assert.notEqual(p.blocks[0].id,p.blocks[1].id);
 assert.notEqual(p.blocks[0].body[0].id,p.blocks[1].body[0].id);
 assert.equal(performBulk(p,[parent.id,child.id],"delete"),1);
 assert.equal(p.blocks.length,1);
});
test("disabled blocks persist through importing and do not generate executable code",()=>{
 const p=projectTemplate("blank"),block=addBlock(p,"print");
 block.fields.value='"secret"';
 performBulk(p,[block.id],"disable");
 assert.match(generate(p),/Disabled block:/);
 assert.doesNotMatch(generate(p),/print\("secret"\)/);
 const sanitized=sanitizeProject(JSON.parse(JSON.stringify(p)));
 assert.equal(sanitized.blocks[0].disabled,true);
 performBulk(sanitized,[sanitized.blocks[0].id],"enable");
 assert.match(generate(sanitized),/print\("secret"\)/);
});
test("notes persist with 300-char maximum",()=>{
 const p=projectTemplate("blank"),b=addBlock(p,"comment");
 setBlockNote(p,b.id,"example note");
 const imported=sanitizeProject(JSON.parse(JSON.stringify(p)));
 assert.equal(imported.blocks[0].note,"example note");
 setBlockNote(p,b.id,"a".repeat(450));
 assert.equal(b.note.length,300);
});
test("snippets copy block branches without sharing IDs",()=>{
 const storage=memory(),p=projectTemplate("blank");
 const parent=addBlock(p,"if");addBlock(p,"print",parent.id,"then");
 const snippet=saveSnippet(storage,"Conditional",p,[parent.id]);
 assert.equal(listSnippets(storage).length,1);
 const newProject=projectTemplate("blank");
 assert.equal(insertSnippet(newProject,snippet),1);
 assert.notEqual(newProject.blocks[0].id,parent.id);
 assert.equal(newProject.blocks[0].then.length,1);
});
test("bookmark toggling is scoped to file ID",()=>{
 const storage=memory();
 assert.equal(toggleBookmark(storage,"file_one","b_1"),true);
 assert.equal(toggleBookmark(storage,"file_two","b_1"),true);
 assert.equal(listBookmarks(storage).length,2);
 assert.equal(toggleBookmark(storage,"file_one","b_1"),false);
 assert.equal(listBookmarks(storage).length,1);
});
test("variable rename avoids quoted string values and property access",()=>{
 const p=projectTemplate("blank");
 const v=addBlock(p,"variable");v.fields.name="Coins";
 const b=addBlock(p,"print");b.fields.value='Coins + 2';
 const quote=addBlock(p,"print");quote.fields.value='"Coins"';
 const property=addBlock(p,"print");property.fields.value='table.Coins';
 const result=renameVariable(p,"Coins","Points");
 assert.ok(result.changed>=2);
 assert.equal(v.fields.name,"Points");
 assert.equal(b.fields.value,"Points + 2");
 assert.equal(quote.fields.value,'"Coins"');
 assert.equal(property.fields.value,"table.Coins");
});
test("diagnostics and source minimap are nonexecuting",()=>{
 const p=projectTemplate("blank");addBlock(p,"print");
 const summary=diagnosticSummary(p);
 assert.equal(summary.errors.length,0);
 const lines=projectSourceMinimap(p);
 assert.ok(lines.some(x=>x.text.includes('print(')));
});

test("DataStore UpdateAsync reuses hoisted store once and unique protected-call variables",()=>{
 const p=projectTemplate("blank");
 addBlock(p,"datastoreUpdate");
 addBlock(p,"datastoreUpdate");
 const code=generate(p);
 assert.equal((code.match(/GetDataStore\("PlayerDataV1"\)/g)||[]).length,1);
 assert.match(code,/local playerDataStore = DataStoreService:GetDataStore/);
 assert.match(code,/playerDataStore:UpdateAsync/);
 assert.match(code,/local updateOk, updateResult = pcall/);
 assert.match(code,/local updateOk2, updateResult2 = pcall/);
});
test("multiple pathfinding blocks use independent readable variables",()=>{
 const p=projectTemplate("blank");
 addBlock(p,"pathWaypoints");addBlock(p,"pathWaypoints");
 const code=generate(p);
 assert.match(code,/local path = game:GetService/);
 assert.match(code,/local path2 = game:GetService/);
 assert.match(code,/local pathOk2 = pcall/);
 assert.doesNotMatch(code,/__index_|_mvkvbfda/);
});
