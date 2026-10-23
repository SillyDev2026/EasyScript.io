import test from "node:test";
import assert from "node:assert/strict";
import {mountExpressionComposer} from "../src/expression-ui.js";
import {copyCodeWithFallback,createCopyFallback} from "../src/code-copy.js";

class FakeElement{
  constructor(tag){
    this.tagName=tag.toUpperCase();this.tag=tag;this.children=[];
    this.listeners=new Map();this.attributes=new Map();this.style={setProperty(){}};
    this.classList={add(){},remove(){},toggle(){}};
    this.value="";this.textContent="";this.open=false;this.disabled=false;
  }
  append(...nodes){for(const n of nodes){this.children.push(n);n.parentElement=this;}}
  appendChild(n){this.append(n);return n;}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  get firstChild(){return this.children[0]??null;}
  setAttribute(key,value){this.attributes.set(key,String(value));}
  addEventListener(name,handler){
    if(!this.listeners.has(name))this.listeners.set(name,[]);
    this.listeners.get(name).push(handler);
  }
  dispatch(name){for(const fn of this.listeners.get(name)||[])fn({target:this});}
  showModal(){this.open=true;}
  close(){this.open=false;this.dispatch("close");}
  focus(){}
  select(){this.selected=true;}
  setSelectionRange(){}
}
function fakeDOM(){
  const created=[];
  const document={body:new FakeElement("body"),createElement(name){
    const el=new FakeElement(name);created.push(el);return el;
  }};
  return {document,created};
}
function find(node,cls){
  const found=[];
  function walk(n){if(typeof n.className==="string"&&n.className.split(/\s+/).includes(cls))found.push(n);
    for(const c of n.children||[])walk(c);
  }
  walk(node);return found;
}
test("v1 expression dialog mounts, edits nested typed slots and applies compiled source",()=>{
  const original=globalThis.document;
  const {document}=fakeDOM();globalThis.document=document;
  try{
    let saved="",notification="";
    const composer=mountExpressionComposer({getLanguage:()=>"luau",notify:s=>notification=s});
    composer.open("Coins",text=>{saved=text;});
    const dialog=find(document.body,"expression-dialog")[0];
    assert.equal(dialog.open,true);
    const kind=find(dialog,"expression-kind")[0];
    kind.value="add";kind.dispatch("change");
    const numbers=find(dialog,"expression-value");
    assert.equal(numbers.length,2);
    numbers[0].value="4";numbers[0].dispatch("input");
    numbers[1].value="5";numbers[1].dispatch("input");
    assert.equal(find(dialog,"expression-preview")[0].textContent,"(4 + 5)");
    const save=find(dialog,"expression-controls")[0].children[1];
    assert.equal(save.disabled,false);
    save.dispatch("click");
    assert.equal(saved,"(4 + 5)");
    assert.equal(dialog.open,false);
    assert.match(notification,/inserted/);
  }finally{globalThis.document=original;}
});
test("invalid expression disables Insert and never writes invalid output",()=>{
  const original=globalThis.document;const {document}=fakeDOM();globalThis.document=document;
  try{
    const composer=mountExpressionComposer({getLanguage:()=>"javascript",notify:()=>{}});
    composer.open("1",()=>{throw new Error("invalid insert should not run");});
    const dialog=find(document.body,"expression-dialog")[0];
    const kind=find(dialog,"expression-kind")[0];kind.value="number";kind.dispatch("change");
    const value=find(dialog,"expression-value")[0];value.value="";value.dispatch("input");
    const save=find(dialog,"expression-controls")[0].children[1];
    assert.equal(save.disabled,true);
    assert.match(find(dialog,"expression-feedback")[0].textContent,/nonempty/);
    assert.equal(dialog.open,true);
  }finally{globalThis.document=original;}
});
test("code copy button uses clipboard and reports success",async()=>{
  const previous=globalThis.navigator;
  let copied="";
  Object.defineProperty(globalThis,"navigator",{configurable:true,value:{clipboard:{writeText:async x=>{copied=x;}}}});
  try{
    let notification="";
    const result=await copyCodeWithFallback("local Coins = 10",message=>notification=message,()=>{throw new Error("No fallback expected");});
    assert.equal(result,true);assert.equal(copied,"local Coins = 10");
    assert.match(notification,/copied/);
  }finally{Object.defineProperty(globalThis,"navigator",{configurable:true,value:previous});}
});
test("clipboard denial opens accessible selectable fallback dialog",async()=>{
  const oldDoc=globalThis.document,oldNav=globalThis.navigator;
  const {document}=fakeDOM();globalThis.document=document;
  Object.defineProperty(globalThis,"navigator",{configurable:true,value:{clipboard:{writeText:async()=>{throw new Error("denied");}}}});
  try{
    const fallback=createCopyFallback();
    let notification="";
    const copied=await copyCodeWithFallback("print('hello')",message=>notification=message,fallback);
    assert.equal(copied,false);
    assert.match(notification,/blocked/);
    const dialog=find(document.body,"copy-source-dialog")[0],text=find(dialog,"copy-source-textarea")[0];
    assert.equal(dialog.open,true);
    assert.equal(text.value,"print('hello')");
    assert.equal(text.selected,true);
  }finally{globalThis.document=oldDoc;Object.defineProperty(globalThis,"navigator",{configurable:true,value:oldNav});}
});
