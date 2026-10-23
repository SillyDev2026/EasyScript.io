import {generate} from "./engine.js";
import {activeFile} from "./workspace.js";
import {listSavedProjects,openSavedProject} from "./library.js";
import {copyCodeWithFallback,createCopyFallback} from "./code-copy.js";
import {formatTutorialSource,inspectVariables,inspectServices,scriptChecklist,compareSources,projectMetrics} from "./ultra-plus-engine.js";

const el=(tag,cls="",value)=>{
  const n=document.createElement(tag);if(cls)n.className=cls;
  if(value!==undefined)n.textContent=String(value);
  return n;
};
const choice=(values)=>{
  const select=el("select","ultra-plus-select");
  for(const [value,label] of values){const option=el("option","",label);option.value=value;select.append(option);}
  return select;
};
const download=(filename,code)=>{
  const url=URL.createObjectURL(new Blob([code],{type:"text/plain;charset=utf-8"}));
  const anchor=el("a");anchor.href=url;anchor.download=filename;
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
const item=(name,description)=>{
  const row=el("div","ultra-plus-item");
  row.append(el("strong","",name),el("span","",description));return row;
};
export function mountUltraPlus({getProject,getWorkspace,notify,scrollToBlock}){
  const project=()=>getProject();
  const section=el("section","ultra-plus-section");
  const title=el("div","ultra-plus-head");
  const intro=el("div");
  intro.append(el("span","eyebrow","EASYSCRIPT ULTRA+"),el("h2","","Five more power tools"),
    el("p","","Readable scripts, variable and service inspection, runtime guidance, and version comparison."));
  title.append(intro);
  const buttons=el("div","ultra-plus-buttons");
  const tools=[
    ["style","Code Style Studio"],["symbols","Variable Explorer"],["services","Service Explorer"],
    ["checks","Runtime Checklist"],["diff","Version Compare"]
  ];
  for(const [id,name] of tools){const b=el("button","btn compact",name);b.type="button";b.dataset.tool=id;buttons.append(b);}
  const pane=el("div","ultra-plus-pane");pane.hidden=true;
  section.append(title,buttons,pane);
  const old=document.querySelector(".ultra-section");
  if(old)old.after(section);else document.querySelector(".layout").after(section);
  const fallback=createCopyFallback();
  let active="";
  const makeCopy=(text,filename)=>{
    const actions=el("div","ultra-plus-controls");
    const copy=el("button","btn compact","Copy");copy.type="button";
    copy.addEventListener("click",()=>copyCodeWithFallback(text(),notify,fallback));
    const exportButton=el("button","btn primary","Download source");exportButton.type="button";
    exportButton.addEventListener("click",()=>download(filename(),text()));
    actions.append(copy,exportButton);return actions;
  };
  function renderStyle(){
    const settings=el("div","ultra-plus-controls");
    const indent=choice([["4","4-space indentation"],["2","2-space indentation"],["8","8-space indentation"]]);
    const header=choice([["yes","Include generator header"],["no","Hide generator header"]]);
    const spacing=choice([["readable","Readable spacing"],["compact","Compact spacing"]]);
    settings.append(indent,header,spacing);
    const preview=el("pre","ultra-plus-code");
    const format=()=>formatTutorialSource(generate(project()),{
      indent:Number(indent.value),header:header.value==="yes",spacing:spacing.value
    });
    const redraw=()=>{preview.textContent=format();};
    for(const control of [indent,header,spacing])control.addEventListener("change",redraw);
    pane.append(el("p","ultra-plus-note","Display/export formatting only. Your underlying blocks are unchanged."),settings,
      makeCopy(format,()=>project().language==="javascript"?"EasyScript-formatted.js":"EasyScript-formatted.luau"),preview);
    redraw();
  }
  function renderSymbols(){
    const symbols=inspectVariables(project());
    const summary=el("p","ultra-plus-note",symbols.length+" named values found. References are approximate for raw expressions.");
    const listing=el("div","ultra-plus-list");
    if(!symbols.length)listing.append(item("No named variables","Create a variable or use a block with a named output."));
    for(const variable of symbols){
      const line=item(variable.name,variable.kind+" · "+variable.definitions+" declarations · "+variable.updates+" writes · "+variable.mentions+" references");
      if(variable.blockIds[0]){
        line.classList.add("ultra-plus-clickable");line.tabIndex=0;
        const open=()=>scrollToBlock(variable.blockIds[0]);
        line.addEventListener("click",open);line.addEventListener("keydown",e=>{if(e.key==="Enter")open();});
      }
      listing.append(line);
    }
    pane.append(summary,listing);
  }
  function renderServices(){
    const services=inspectServices(project()),list=el("div","ultra-plus-list");
    pane.append(el("p","ultra-plus-note","Services referenced by generated source. Repeated lookups are counted for review."));
    if(!services.length)list.append(item("No GetService calls","Add a Roblox service or API block to populate this list."));
    for(const x of services)list.append(item(x.name,x.references+" generated reference(s)"));
    pane.append(list);
  }
  function renderChecks(){
    const file=activeFile(getWorkspace()),checks=scriptChecklist(project(),file.kind);
    const metrics=projectMetrics(project());
    pane.append(el("p","ultra-plus-note","Target: "+file.kind+" · "+metrics.blocks+" blocks · "+metrics.codeLines+" code lines. Checks are advisory and do not replace Studio testing."));
    const list=el("div","ultra-plus-list");
    for(const c of checks){
      const entry=item((c.status==="warning"?"⚠ ":c.status==="pass"?"✓ ":"ℹ ")+c.label,c.details);
      entry.dataset.status=c.status;list.append(entry);
    }
    pane.append(list);
  }
  function renderDiff(){
    let saved=[];
    try{saved=listSavedProjects(localStorage);}catch(err){pane.append(item("Local snapshots inaccessible",err.message));return;}
    const hint=el("p","ultra-plus-note","Compare this active script with a snapshot from My projects. Snapshots are stored only on this browser.");
    pane.append(hint);
    if(!saved.length){pane.append(item("No snapshots yet","Use My projects → Save current project, then return here."));return;}
    const picker=choice(saved.map(x=>[x.id,x.title+" · "+new Date(x.createdAt).toLocaleString()]));
    const report=el("div","ultra-plus-diff"),info=el("p","ultra-plus-note");
    const refresh=()=>{
      report.replaceChildren();
      try{
        const previous=openSavedProject(localStorage,picker.value);
        const diff=compareSources(generate(previous),generate(project()));
        info.textContent=diff.changed?diff.removed.length+" removed · "+diff.added.length+" added lines":"No generated code changes.";
        if(diff.truncated)info.textContent+=" Diff truncated at 2,000 lines.";
        for(const line of [...diff.removed,...diff.added]){
          const element=el("div","ultra-plus-diff-line",line.kind==="removed"?"- "+line.text:" + "+line.text);
          element.dataset.kind=line.kind;report.append(element);
        }
      }catch(error){info.textContent="Comparison failed: "+error.message;}
    };
    picker.addEventListener("change",refresh);
    pane.append(picker,info,report);refresh();
  }
  const views={style:renderStyle,symbols:renderSymbols,services:renderServices,checks:renderChecks,diff:renderDiff};
  function render(){
    pane.replaceChildren();pane.hidden=!active;
    for(const button of buttons.children){
      const current=button.dataset.tool===active;
      button.classList.toggle("active",current);button.setAttribute("aria-pressed",String(current));
    }
    if(active)views[active]();
  }
  buttons.addEventListener("click",event=>{
    const button=event.target.closest("[data-tool]");
    if(!button)return;
    active=active===button.dataset.tool?"":button.dataset.tool;
    render();
  });
  let timer=0;
  return {update(){
    if(!active)return;
    clearTimeout(timer);
    timer=setTimeout(render,240);
  }};
}
