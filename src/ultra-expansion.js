import {remoteGuardTemplate,guiTemplate,simulateDataStore,staticSecurityReport,visualTestTemplate} from "./ultra-expansion-engine.js";
import {copyCodeWithFallback,createCopyFallback} from "./code-copy.js";
const mk=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e;};
export function mountUltraExpansion({getProject,notify}){
 const section=mk("section","ultra-expansion");
 const header=mk("div","ultra-expansion-heading");
 header.append(mk("strong","","Advanced Roblox builders"),mk("span","","Five offline Ultra labs · generated scripts require Roblox Studio testing"));
 const nav=mk("div","ultra-expansion-buttons"),content=mk("div","ultra-expansion-content");
 content.hidden=true;section.append(header,nav,content);
 const after=document.querySelector(".ultra-plus-section")||document.querySelector(".ultra-section");
 if(after)after.after(section);else document.querySelector(".layout").after(section);
 const fallback=createCopyFallback();
 const tools=[["guard","Remote guard"],["gui","GUI builder"],["data","DataStore retries"],["security","Security checks"],["tests","Test script builder"]];
 let active="";
 function field(container,label,value,kind="text"){
  const wrap=mk("label","ultra-lab-field",label),input=mk("input","ultra-lab-input");
  input.type=kind;input.value=String(value);wrap.append(input);container.append(wrap);return input;
 }
 function controls(){const box=mk("div","ultra-lab-controls");content.append(box);return box;}
 function sourceActions(getSource,fileName){
  const preview=mk("pre","ultra-lab-preview"),bar=mk("div","ultra-lab-actions");
  const copy=mk("button","btn compact","Copy generated code"),download=mk("button","btn primary","Download .luau");
  copy.type="button";download.type="button";
  const redraw=()=>{preview.textContent=getSource();};
  copy.addEventListener("click",()=>copyCodeWithFallback(getSource(),notify,fallback));
  download.addEventListener("click",()=>{
   const url=URL.createObjectURL(new Blob([getSource()],{type:"text/plain;charset=utf-8"}));
   const link=mk("a");link.href=url;link.download=fileName;document.body.append(link);
   link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  });
  bar.append(copy,download);content.append(bar,preview);redraw();return redraw;
 }
 function guard(){
  content.append(mk("p","ultra-lab-note","Generate a server-side RemoteEvent handler with type, range and cooldown checks. Replace TODO with permissions."));
  const box=controls(),event=field(box,"RemoteEvent name","GameEvent"),
   limit=field(box,"Maximum numeric amount",100,"number"),cooldown=field(box,"Cooldown seconds",0.25,"number");
  const source=()=>remoteGuardTemplate({event:event.value,max:limit.value,cooldown:cooldown.value});
  const redraw=sourceActions(source,"RemoteGuard.luau");
  for(const input of [event,limit,cooldown])input.addEventListener("input",redraw);
 }
 function gui(){
  content.append(mk("p","ultra-lab-note","Generate a client ScreenGui, centered frame and TextButton with a click event."));
  const box=controls(),name=field(box,"ScreenGui name","EasyGui"),label=field(box,"Button text","Play"),
   w=field(box,"Width",270,"number"),h=field(box,"Height",90,"number");
  const source=()=>guiTemplate({name:name.value,label:label.value,width:w.value,height:h.value});
  const redraw=sourceActions(source,"EasyGui.client.luau");
  for(const input of [name,label,w,h])input.addEventListener("input",redraw);
 }
 function data(){
  content.append(mk("p","ultra-lab-note","Deterministic retry practice. No real Roblox DataStore requests."));
  const box=controls(),count=field(box,"Retry limit",3,"number"),sequence=field(box,"Failure pattern (fail,fail,ok)","fail,fail,ok");
  const output=mk("div","ultra-lab-report");content.append(output);
  const update=()=>{
   const pattern=sequence.value.split(",").slice(0,10).map(x=>x.trim().toLowerCase()!=="ok");
   const report=simulateDataStore({retries:count.value,failurePattern:pattern});
   output.replaceChildren();
   output.append(mk("strong","",report.success?"Simulated success":"Simulated failure"));
   for(const attempt of report.history)output.append(mk("p","","Attempt "+attempt.attempt+": "+attempt.status));
   output.append(mk("p","ultra-lab-note",report.disclaimer));
  };
  count.addEventListener("input",update);sequence.addEventListener("input",update);update();
 }
 function security(){
  const report=staticSecurityReport(getProject());
  content.append(mk("p","ultra-lab-note",report.counts.blocks+" active blocks · "+report.counts.remotes+" remote boundaries · "+report.counts.datas+" data calls"));
  const list=mk("div","ultra-lab-report");
  if(!report.issues.length)list.append(mk("p","","No heuristics were triggered. This is not a security certification."));
  for(const issue of report.issues.slice(0,80))list.append(mk("p","",issue.severity+": "+issue.message));
  list.append(mk("p","ultra-lab-note",report.disclaimer));content.append(list);
 }
 function testCode(){
  content.append(mk("p","ultra-lab-note","Generate a standalone educational Luau assertion script."));
  const box=controls(),name=field(box,"Variable","Coins"),expected=field(box,"Expected number",100,"number");
  const source=()=>visualTestTemplate({variable:name.value,expected:expected.value});
  const redraw=sourceActions(source,"EasyScriptTest.luau");
  name.addEventListener("input",redraw);expected.addEventListener("input",redraw);
 }
 const views={guard,gui,data,security,tests:testCode};
 function render(){
  content.replaceChildren();content.hidden=!active;
  for(const b of nav.children)b.classList.toggle("active",b.dataset.tool===active);
  if(active)views[active]();
 }
 for(const [key,label] of tools){
  const btn=mk("button","btn compact ghost",label);btn.type="button";btn.dataset.tool=key;
  btn.addEventListener("click",()=>{active=active===key?"":key;render();});nav.append(btn);
 }
 return {update(){}};
}
