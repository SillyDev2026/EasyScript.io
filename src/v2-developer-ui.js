import {generate,lint,traverse} from "./engine.js";
import {importSourceToBlocks} from "./v2-code-bridge.js";
import {reviewWorkspaceChanges,createWorkspacePatch,inspectWorkspacePatch,applyWorkspacePatch,workspacePatchFileName} from "./v2-workspace-patch.js";
import {socketTreeSummary} from "./v2-expressions.js";
const make=(tag,cls="",value)=>{
 const element=document.createElement(tag);
 if(cls)element.className=cls;
 if(value!==undefined)element.textContent=String(value);
 return element;
};
const addButton=(text,onClick,cls="btn compact ghost")=>{
 const btn=make("button",cls,text);btn.type="button";btn.addEventListener("click",onClick);return btn;
};
function download(filename,content){
 const blob=new Blob([content],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=make("a");
 a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
export function mountV2Studio({getProject,getWorkspace,commitNow,updateWorkspace,switchFile,replaceProject,notify}){
 const section=make("section","v2-dev-suite");
 const head=make("div","v2-dev-head");
 head.append(make("h2","","EasyScript v2 · Developer Workbench"),
  make("p","","Persistent visual sockets · supported source import · offline change review"));
 const tabs=make("div","v2-dev-tabs");
 const area=make("div","v2-dev-body");area.hidden=true;
 section.append(head,tabs,area);
 const after=document.querySelector(".ultra-v13")||document.querySelector(".ultra-expansion");
 if(after)after.after(section);else document.querySelector(".layout").after(section);
 let active="",baseline=null,pendingPatch=null;
 const status=(text,kind="info")=>{const p=make("p","v2-dev-status",text);p.dataset.kind=kind;area.append(p);return p;};
 const line=(text)=>area.append(make("p","v2-dev-description",text));
 function sourceImport(){
  line("Supported subset: Luau/JavaScript print, variables, assignment, increments and comments; Luau also accepts task.wait. Complex functions, events and nested control flow are rejected without changing your project.");
  const textarea=make("textarea","v2-dev-textarea");
  textarea.value=generate(getProject());textarea.spellcheck=false;
  textarea.setAttribute("aria-label","Luau or JavaScript source to convert");
  area.append(textarea);
  const actions=make("div","v2-dev-actions"),out=make("div","v2-dev-report"),preview=make("pre","v2-dev-preview");
  let imported=null;
  const scan=()=>{
   const result=importSourceToBlocks(textarea.value,getProject().language);
   imported=result.ok?result:null;
   out.replaceChildren();preview.textContent="";
   const summary=make("p","",result.ok?
     "Valid: "+result.blocks.length+" supported visual blocks ready.":
     "No changes applied. "+result.errors.length+" unsupported line(s) detected.");
   out.append(summary);
   for(const issue of result.errors.slice(0,35))
    out.append(make("p","v2-dev-diagnostic","Line "+issue.line+": "+issue.message));
   if(result.ok)preview.textContent=result.blocks.map(b=>b.type+" "+Object.entries(b.fields).map(([k,v])=>k+"="+v).join(" ")).join("\n");
   apply.disabled=!result.ok;
  };
  const apply=addButton("Replace current file with converted blocks",()=>{
   if(!imported)return;
   if(!confirm("Replace blocks in the active script? Export a backup first if needed."))return;
   replaceProject({...getProject(),blocks:imported.blocks});
   notify("Converted "+imported.blocks.length+" supported statements into visual blocks");
   render();
  },"btn primary");
  apply.disabled=true;
  actions.append(addButton("Analyze source",scan),addButton("Reset to generated",()=>{textarea.value=generate(getProject());scan();}),apply);
  area.append(actions,out,preview);
  textarea.addEventListener("input",()=>{imported=null;apply.disabled=true;});
  scan();
 }
 function workspacePatch(){
  commitNow();
  const ws=getWorkspace();
  if(!baseline)baseline=structuredClone(ws);
  line("Save a local review baseline, export a patch after editing, or inspect an incoming patch. Patches require the exact starting version; there is no cloud synchronization.");
  const controls=make("div","v2-dev-actions"),report=make("div","v2-dev-report"),picker=make("input","v2-dev-file");
  picker.type="file";picker.accept=".json,application/json";
  picker.setAttribute("aria-label","Import a v2 workspace patch file");
  const redraw=()=>{
   const diff=reviewWorkspaceChanges(baseline,getWorkspace());
   report.replaceChildren();
   report.append(make("p","","Since baseline: "+diff.summary.added+" added, "+diff.summary.modified+" modified, "+diff.summary.removed+" removed."));
   for(const change of diff.changes)report.append(make("p","v2-dev-change",change.kind.toUpperCase()+": "+change.name));
  };
  controls.append(addButton("Set current as baseline",()=>{
    commitNow();baseline=structuredClone(getWorkspace());pendingPatch=null;redraw();notify("Local review baseline updated");
  }),addButton("Download reviewed patch",()=>{
    commitNow();
    const patch=createWorkspacePatch(baseline,getWorkspace());
    download(workspacePatchFileName(getWorkspace()),JSON.stringify(patch,null,2));
    notify("Offline patch exported with conflict checksum");
  }),picker);
  area.append(controls,report);
  const pending=make("div","v2-dev-report");area.append(pending);
  picker.addEventListener("change",async()=>{
   const file=picker.files?.[0];pending.replaceChildren();
   if(!file)return;
   try{
    if(file.size>4_000_000)throw new Error("Patch exceeds 4 MB");
    const incoming=JSON.parse(await file.text());
    commitNow();
    const check=inspectWorkspacePatch(getWorkspace(),incoming);
    pendingPatch=check.compatible?incoming:null;
    pending.append(make("p","",check.compatible?
      "Compatible patch. "+check.changes.length+" reviewed changes.":
      "Conflict: current workspace does not match patch base. It will not be applied."));
    for(const change of check.changes.slice(0,40))pending.append(make("p","v2-dev-change",change.kind+": "+change.name));
    if(check.compatible){
      pending.append(addButton("Apply reviewed patch",()=>{
        if(!pendingPatch||!confirm("Replace the active workspace using this reviewed patch?"))return;
        try{
          commitNow();
          const result=applyWorkspacePatch(getWorkspace(),pendingPatch);
          updateWorkspace(result);switchFile(result.activeId,true);
          baseline=structuredClone(result);pendingPatch=null;notify("Patch applied");render();
        }catch(error){notify("Patch rejected: "+error.message);}
      },"btn primary"));
    }
   }catch(error){pendingPatch=null;pending.append(make("p","",error.message));}
   picker.value="";
  });
  redraw();
 }
 function sockets(){
  const items=[];
  traverse(getProject().blocks,b=>{
   for(const [key,tree] of Object.entries(b.expressions||{})){
    const detail=socketTreeSummary(tree);
    items.push({block:b.type,key,kind:detail.kind,nodes:detail.nodes});
   }
  });
  line(items.length+" stored expression graph(s) in the active file. Graphs survive workspace JSON and ZIP backups, and regenerate when the scripting language changes.");
  const listing=make("div","v2-dev-report");
  if(!items.length)listing.append(make("p","","No visual expressions saved yet. Select ◇ Build next to a block field."));
  for(const item of items){
   listing.append(make("p","v2-dev-change",item.block+" · "+item.key+": "+item.kind+" ("+item.nodes+" sockets)"));
  }
  area.append(listing);
 }
 function overview(){
  const project=getProject(),diagnostics=lint(project),workspace=getWorkspace();
  line("Static preflight. This does not run Roblox Studio, a Luau compiler, or live security checks.");
  const rows=[
   ["Language",project.language],["Workspace files",workspace.files.length],
   ["Top-level blocks",project.blocks.length],
   ["Generated lines",generate(project).split("\n").length-1],
   ["Errors",diagnostics.filter(x=>x.severity==="error").length],
   ["Warnings",diagnostics.filter(x=>x.severity==="warning").length]
  ];
  const grid=make("div","v2-dev-stats");
  for(const [label,value] of rows){
   const card=make("div","v2-dev-stat");
   card.append(make("strong","",value),make("span","",label));grid.append(card);
  }
  area.append(grid);
  for(const issue of diagnostics.slice(0,35))
   status(issue.severity+": "+issue.message,issue.severity);
 }
 const views=[
  ["source","Code → Blocks",sourceImport],["patch","Offline patches",workspacePatch],
  ["sockets","Expression graphs",sockets],["preflight","Project preflight",overview]
 ];
 function render(){
  area.replaceChildren();area.hidden=!active;
  for(const child of tabs.children)child.classList.toggle("active",child.dataset.view===active);
  const fn=views.find(x=>x[0]===active)?.[2];if(fn)fn();
 }
 for(const [key,name] of views){
  const tab=addButton(name,()=>{active=active===key?"":key;render();});
  tab.dataset.view=key;tabs.append(tab);
 }
 return {refresh(){/* Do not overwrite partially edited source text */}};
}
