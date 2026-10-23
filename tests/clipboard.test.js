import test from "node:test";
import assert from "node:assert/strict";
import {projectTemplate,addBlock,generate} from "../src/engine.js";
import {copyBlockTree,pasteBlockTree,clipboardAvailable,countBlockTree} from "../src/clipboard.js";

function storage(){
  const d=new Map();
  return {getItem:key=>d.get(key)||null,setItem:(key,value)=>d.set(key,value)};
}
test("copy nested blocks and paste into another script with new IDs",()=>{
  const a=projectTemplate("blank");
  const loop=addBlock(a,"repeat");
  const print=addBlock(a,"print",loop.id,"body");print.fields.value='"From first file"';
  const mem=storage();
  assert.equal(countBlockTree(loop),2);
  copyBlockTree(mem,loop);
  const b=projectTemplate("blank");
  const pasted=pasteBlockTree(mem,b);
  assert.notEqual(pasted.id,loop.id);
  assert.notEqual(pasted.body[0].id,print.id);
  assert.equal(pasted.body[0].fields.value,'"From first file"');
  assert.match(generate(b),/From first file/);
});
test("clipboard insertion after target preserves ordering",()=>{
  const mem=storage(),p=projectTemplate("blank");
  const first=addBlock(p,"print");
  const second=addBlock(p,"comment");
  copyBlockTree(mem,first);
  const pasted=pasteBlockTree(mem,p,first.id);
  assert.equal(p.blocks[1].id,pasted.id);
  assert.equal(p.blocks[2].id,second.id);
});
test("clipboard refuses unsupported and oversized input",()=>{
  const mem=storage(),p=projectTemplate("blank");
  assert.equal(clipboardAvailable(mem),false);
  assert.throws(()=>pasteBlockTree(mem,p),/Copy/);
  assert.throws(()=>copyBlockTree(mem,{type:"not_a_block"}),/Invalid/);
});
