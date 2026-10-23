import {searchRobloxAPI,semanticReport,readinessReport,dataSchemaModule,parallelAdvice,mergeWorkspaces,aiPromptBundle,studioSourceManifest} from "./ultra-suite-core.js";
import {registerCustomDefinition,loadCustomDefinitions,saveCustomDefinitions,listCustomDefinitions} from "./custom-blocks.js";
import {DEFINITIONS} from "./engine.js";
import {copyCodeWithFallback,createCopyFallback} from "./code-copy.js";
const el=(tag,cls="",content)=>{
 const e=document.createElement(tag);if(cls)e.className=cls;
 if(content!==undefined)e.textContent=String(content);return e;
};
const button=(text,cb,cls="btn compact ghost")=>{
 const b=el("button",cls,text);b.type="button";b.addEventListener("click",cb);return b;
};
const field=(target,label,defaultValue="",multi=false)=>{
 const wrapper=el("label","ultra-v13-field",label);
 const input=el(multi?"textarea":"input","ultra-v13-input");
 if(multi)input.rows=5;
 input.value=defaultValue;
 wrapper.append(input);target.append(wrapper);return input;
};
function exportText(filename,text){
 const blob=new Blob([text],{type:"text/plain;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 const a=el("a");a.href=url;a.download=filename;document.body.append(a);
 a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
export function mountUltraSuite({getProject,getWorkspace,notify,commitNow,updateWorkspace,switchFile,refreshPalette}){
 const section=el("section","ultra-v13"),head=el("div","ultra-v13-head");
 head.append(el("h2","","Ultra Developer Suite"),el("p","","Advanced local tools · Studio importer · Optional export workflows"));
 const nav=el("div","ultra-v13-nav"),pane=el("div","ultra-v13-pane");pane.hidden=true;
 section.append(head,nav,pane);
 const after=document.querySelector(".ultra-expansion")||document.querySelector(".ultra-plus-section");
 if(after)after.after(section);else document.querySelector(".layout").after(section);
 const copyFallback=createCopyFallback();
 let selected="";
 const copySource=source=>copyCodeWithFallback(source,notify,copyFallback);
 const paragraph=(text)=>{pane.append(el("p","ultra-v13-caption",text));};
 const report=(lines)=>{
  const list=el("div","ultra-v13-list");
  for(const x of lines){
   const item=el("div","ultra-v13-report");
   if(typeof x==="string")item.textContent=x;
   else{
    item.append(el("strong","",x.title||x.name||x.file||x.severity||"Result"));
    item.append(el("span","",x.message||x.text||x.description||""));
   }
   list.append(item);
  }
  if(!lines.length)list.append(el("p","ultra-v13-caption","No issues detected by the available static checks."));
  pane.append(list);
 };
 const codeOutput=(generator,filename)=>{
  const row=el("div","ultra-v13-actions"),preview=el("pre","ultra-v13-source");
  const redraw=()=>{
   try{preview.textContent=generator();}catch(error){preview.textContent="Error: "+error.message;}
  };
  row.append(button("Copy source",()=>copySource(generator())),
    button("Download file",()=>exportText(filename,generator()),"btn compact primary"));
  pane.append(row,preview);redraw();return redraw;
 };
 const tools=[
  ["semantic","Luau analyzer"],["api","API lookup"],["schema","Data schema"],
  ["readiness","Project readiness"],["merge","Merge workspaces"],["parallel","Parallel Luau"],
  ["studio","Studio importer"],["custom","Custom blocks"],["ai","AI prompt"]
 ];
 function semantic(){
  const data=semanticReport(getProject());
  paragraph("Static block-level analysis: "+data.declarations.length+" declarations, "+data.entries.length+" findings. Raw code is not fully type-checked.");
  report(data.entries.map(x=>({title:x.severity.toUpperCase(),message:x.message})));
 }
 function api(){
  paragraph("Offline Roblox API quick reference, not a complete or live Roblox API database.");
  const query=field(pane,"Filter API methods","Raycast");
  const results=el("div","ultra-v13-list");pane.append(results);
  const redraw=()=>{
   results.replaceChildren();
   for(const entry of searchRobloxAPI(query.value,40)){
    const card=el("div","ultra-v13-report");
    card.append(el("strong","",entry.className+"."+entry.member),el("span","",entry.description+" · "+entry.context));
    results.append(card);
   }
   if(!results.children.length)results.append(el("p","ultra-v13-caption","No API matches."));
  };
  query.addEventListener("input",redraw);redraw();
 }
 function schema(){
  paragraph("Generates a versioned ModuleScript with typed default data and a safe field-based migration function. Does not contact DataStores.");
  const name=field(pane,"Module name","PlayerData");
  const rows=field(pane,"Fields (name:type:default, one per line)","Coins:number:0\nWins:number:0\nDisplayName:string:Player\nTutorialDone:boolean:false",true);
  const generator=()=>{
   const lines=rows.value.split("\n").map(s=>s.trim()).filter(Boolean);
   const fields=lines.map(row=>{
    const a=row.split(":");if(a.length<3)throw new Error("Expected name:type:default for each field");
    const type=a[1],raw=a.slice(2).join(":");
    return {name:a[0],type,default:type==="boolean"?raw.trim()==="true":type==="number"?Number(raw):raw};
   });
   return dataSchemaModule(name.value,fields).code;
  };
  const redraw=codeOutput(generator,"EasyScriptSchema.luau");
  name.addEventListener("input",redraw);rows.addEventListener("input",redraw);
 }
 function readiness(){
  commitNow();
  const res=readinessReport(getWorkspace());
  paragraph(res.files+" project files · "+(res.ready?"No blocking static errors":"Blocking static errors found")+". This does not run Roblox Studio.");
  report(res.items.map(i=>({title:i.severity.toUpperCase()+" · "+i.file,message:i.text})));
 }
 function parallel(){
  const analysis=parallelAdvice(getProject());
  paragraph(analysis.disclaimer);
  report(analysis.findings.map(f=>({title:f.severity,message:f.message})));
  codeOutput(()=>analysis.example,"ParallelActorExample.luau");
 }
 function studio(){
  paragraph("Real one-way Roblox Studio importer. Install roblox/EasyScriptImporter.plugin.lua as a Studio plugin, export this source manifest, then paste it into the plugin. Imported Scripts/LocalScripts are disabled.");
  const url="https://github.com/SillyDev2026/EasyScript.io/blob/main/roblox/EasyScriptImporter.plugin.lua";
  const link=el("a","ultra-v13-link","View Studio importer plugin on GitHub ↗");
  link.href=url;link.target="_blank";link.rel="noopener noreferrer";pane.append(link);
  const source=()=>{commitNow();return studioSourceManifest(getWorkspace());};
  codeOutput(source,"EasyScript-source-manifest.json");
 }
 function merge(){
  paragraph("Import a separate EasyScript workspace JSON and append its scripts without overwriting existing files. Conflicting filenames are renamed. Limit: 24 files.");
  const picker=el("input","ultra-v13-input");
  picker.type="file";picker.accept=".json,application/json";
  pane.append(picker);
  const status=el("p","ultra-v13-caption");pane.append(status);
  picker.addEventListener("change",async()=>{
   const file=picker.files?.[0];if(!file)return;
   try{
    if(file.size>4_000_000)throw new Error("Input larger than 4 MB");
    const data=JSON.parse(await file.text());
    commitNow();
    const merged=mergeWorkspaces(getWorkspace(),data);
    status.textContent=merged.added+" new scripts, "+merged.renamed+" renamed conflicts, "+merged.skipped+" skipped at limit.";
    if(!merged.added)return;
    if(!confirm("Merge these "+merged.added+" scripts? Export a workspace backup first if needed."))return;
    updateWorkspace(merged.workspace);switchFile(merged.workspace.activeId,true);
    notify("Added "+merged.added+" scripts to your workspace");
   }catch(err){status.textContent="Merge failed: "+err.message;}
   finally{picker.value="";}
  });
 }
 function custom(){
  paragraph("Create safe declarative blocks with named fields and Luau/JavaScript code templates. Templates use {{field}} placeholders. Blocks remain local to this browser.");
  const id=field(pane,"Block ID (letters, numbers, underscore)","greet");
  const label=field(pane,"Block display name","Greet player");
  const fields=field(pane,"Default fields (JSON object)",'{"message":"\\"Hello\\""}',true);
  const luau=field(pane,"Luau template","print({{message}})",true);
  const javascript=field(pane,"JavaScript template","console.log({{message}});",true);
  const actions=el("div","ultra-v13-actions"),found=el("p","ultra-v13-caption");
  actions.append(button("Register custom block",()=>{
   try{
    if(listCustomDefinitions().length>=30)throw new Error("Maximum 30 custom blocks");
    const kind=registerCustomDefinition({id:id.value,label:label.value,fields:JSON.parse(fields.value),luau:luau.value,javascript:javascript.value},DEFINITIONS);
    saveCustomDefinitions(localStorage);
    refreshPalette();
    notify("Custom block "+kind+" registered in your block palette");
    found.textContent=listCustomDefinitions().length+" custom blocks saved locally.";
   }catch(e){notify("Custom block error: "+e.message);}
  },"btn compact primary"));pane.append(actions,found);
  found.textContent=listCustomDefinitions().length+" custom blocks saved locally.";
 }
 function ai(){
  paragraph("Build an AI review prompt locally. No model calls or data are sent anywhere; only you can choose to share the copied code with an external AI.");
  codeOutput(()=>aiPromptBundle(getProject()),"EasyScript-AI-review-prompt.txt");
 }
 const methods={semantic,api,schema,readiness,merge,parallel,studio,custom,ai};
 function render(){
  pane.replaceChildren();pane.hidden=!selected;
  for(const b of nav.children)b.classList.toggle("active",b.dataset.tool===selected);
  if(selected)methods[selected]();
 }
 for(const [key,title] of tools){
  const b=button(title,()=>{selected=selected===key?"":key;render();});
  b.dataset.tool=key;nav.append(b);
 }
 return {update(){/* preserve user input while editing */}};
}
