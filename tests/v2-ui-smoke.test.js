import test from "node:test";
import assert from "node:assert/strict";
import {projectTemplate,addBlock} from "../src/engine.js";
import {createWorkspace} from "../src/workspace.js";
import {mountV2Studio} from "../src/v2-developer-ui.js";

class MockElement {
 constructor(tag){
  this.tag=tag;this.children=[];this.listeners=new Map();this.dataset={};this.style={};
  this.className="";this.textContent="";this.value="";this.disabled=false;this.hidden=false;
  this.classList={toggle(){},add(){},remove(){}};
 }
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=[];this.append(...children);}
 after(node){this.inserted=node;}
 addEventListener(name,listener){
  if(!this.listeners.has(name))this.listeners.set(name,[]);
  this.listeners.get(name).push(listener);
 }
 dispatch(name){for(const cb of this.listeners.get(name)||[])cb({target:this});}
 setAttribute(){}
}
function setup(){
 const old=globalThis.document;
 const root=new MockElement("aside");
 const document={body:new MockElement("body"),createElement:tag=>new MockElement(tag),
  querySelector:()=>root};
 globalThis.document=document;
 return {root,restore:()=>{globalThis.document=old;}};
}
function find(node,predicate,found=[]){
 if(predicate(node))found.push(node);
 for(const child of node.children||[])find(child,predicate,found);
 return found;
}
function workbench(){
 const project=projectTemplate("blank");addBlock(project,"print");
 const workspace=createWorkspace(project);
 let replaced=false;
 const unit=mountV2Studio({getProject:()=>project,getWorkspace:()=>workspace,
  notify:()=>{},commitNow:()=>{},updateWorkspace:()=>{},switchFile:()=>{},
  replaceProject:()=>{replaced=true;}});
 return {unit,workspace,wasReplaced:()=>replaced};
}
test("v2 UI mounts five accessible feature tabs and source analysis without a backend",()=>{
 const fixture=setup();
 try{
  workbench();
  const section=fixture.root.inserted;
  assert.ok(section);
  const tabs=find(section,e=>e.tag==="button"&&e.dataset.view);
  assert.equal(tabs.length,5);
  tabs[0].dispatch("click");
  const input=find(section,e=>e.tag==="textarea")[0];
  const actions=find(section,e=>e.tag==="button"&&e.textContent==="Analyze source");
  assert.ok(input);
  assert.equal(actions.length,1);
  actions[0].dispatch("click");
  assert.ok(find(section,e=>e.tag==="p"&&e.textContent.includes("Valid:")).length>=1);
 }finally{fixture.restore();}
});
test("v2 source importer never applies unsupported content even when button receives a click",()=>{
 const fixture=setup();
 try{
  const app=workbench(),section=fixture.root.inserted;
  find(section,e=>e.tag==="button"&&e.dataset.view==="source")[0].dispatch("click");
  const input=find(section,e=>e.tag==="textarea")[0];
  input.value='workspace.Part:Destroy()\n';
  find(section,e=>e.tag==="button"&&e.textContent==="Analyze source")[0].dispatch("click");
  const apply=find(section,e=>e.tag==="button"&&e.textContent.includes("Replace current file"))[0];
  assert.equal(apply.disabled,true);
  assert.ok(find(section,e=>e.tag==="p"&&e.textContent.includes("unsupported line")).length>0);
  // A disabled DOM button can't receive user clicks; the callback also checks imported===null.
  apply.dispatch("click");
  assert.equal(app.wasReplaced(),false);
 }finally{fixture.restore();}
});
