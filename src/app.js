import {VERSION,DEFINITIONS,newBlock,projectTemplate,sanitizeProject,findLocation,addBlock,traverse,generate,lint,simulate} from "./engine.js";

const $ = id => document.getElementById(id);
const STORAGE_KEY = "easyscript_project_v2";
const icons = {print:"▣",variable:"▤",set:"↗",if:"◇",repeat:"⟳",wait:"◷",comment:"≡",function:"ƒ",call:"↳"};
let project = load();
let undoStack = [];
let redoStack = [];
let insertion = {parent:null,branch:"root"};
let activeTab = "code";
let toastTimer = null;
let saveTimer = null;

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("easyscript_project_v1");
    if(saved)return sanitizeProject(JSON.parse(saved));
  } catch(error) {console.warn("Could not restore project",error);}
  return projectTemplate("starter");
}
function snapshot(){return JSON.stringify(project);}
function checkpoint(){
  undoStack.push(snapshot());
  if(undoStack.length>60)undoStack.shift();
  redoStack.length=0;
  updateHistory();
}
function mutate(fn){
  checkpoint();
  fn();
  render();
}
function undo(){
  if(!undoStack.length)return;
  redoStack.push(snapshot());
  project=sanitizeProject(JSON.parse(undoStack.pop()));
  render();
}
function redo(){
  if(!redoStack.length)return;
  undoStack.push(snapshot());
  project=sanitizeProject(JSON.parse(redoStack.pop()));
  render();
}
function updateHistory(){
  $("undoBtn").disabled=!undoStack.length;
  $("redoBtn").disabled=!redoStack.length;
}
function persist(){
  clearTimeout(saveTimer);
  $("saveStatus").textContent="Saving…";
  saveTimer=setTimeout(()=>{
    try{
      localStorage.setItem(STORAGE_KEY,snapshot());
      $("saveStatus").textContent="● Saved locally";
    }catch(error){
      $("saveStatus").textContent="Local save unavailable";
      console.warn("Local storage not available",error);
    }
  },250);
}
function notify(message){
  const toast=$("toast");toast.textContent=message;toast.classList.add("show");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2600);
}
function make(tag,className,textContent) {
  const n=document.createElement(tag);
  if(className)n.className=className;
  if(textContent!==undefined)n.textContent=textContent;
  return n;
}
function iconFor(type){
  const span=make("span","palette-icon "+DEFINITIONS[type].color,icons[type]);
  span.setAttribute("aria-hidden","true");
  return span;
}
function paletteButton(type,onPick){
  const btn=make("button","palette-button");
  btn.type="button";
  btn.append(iconFor(type),make("span","",DEFINITIONS[type].name));
  btn.draggable=true;
  btn.addEventListener("click",()=>onPick(type));
  btn.addEventListener("dragstart",event=>{
    event.dataTransfer.effectAllowed="copy";
    event.dataTransfer.setData("text/plain",JSON.stringify({kind:"new",type}));
  });
  return btn;
}
function palette(){
  const query=$("paletteSearch").value.trim().toLowerCase();
  const parent=$("palette");parent.replaceChildren();
  const groups=[...new Set(Object.values(DEFINITIONS).map(x=>x.group))];
  let total=0;
  for(const group of groups){
    const list=Object.keys(DEFINITIONS).filter(type=>DEFINITIONS[type].group===group&&
      (DEFINITIONS[type].name+" "+group).toLowerCase().includes(query));
    if(!list.length)continue;
    parent.append(make("div","palette-heading",group));
    for(const type of list){
      parent.append(paletteButton(type,t=>mutate(()=>addBlock(project,t))));
      total++;
    }
  }
  if(!total)parent.append(make("p","panel-note","No blocks found."));
}
function actionButton(symbol,title,callback){
  const btn=make("button","tiny-btn",symbol);btn.title=title;btn.type="button";
  btn.setAttribute("aria-label",title);btn.addEventListener("click",callback);return btn;
}
function fieldInput(block,key){
  const label=make("label","",key==="left"?"Compare":key==="right"?"With":key);
  const ctrl=key==="operator"?make("select",""):make("input","");
  if(key==="operator"){
    for(const op of ["==","!=",">","<",">=","<="]){
      const option=make("option","",op);option.value=op;ctrl.append(option);
    }
  }else{
    ctrl.type="text";ctrl.maxLength=400;ctrl.spellcheck=false;
    ctrl.autocomplete="off";ctrl.addEventListener("focus",checkpoint,{once:true});
  }
  ctrl.value=block.fields[key]??"";
  ctrl.setAttribute("aria-label",DEFINITIONS[block.type].name+" "+key);
  ctrl.addEventListener("change",()=>{block.fields[key]=ctrl.value;updateOutputs();persist();});
  ctrl.addEventListener("input",()=>{block.fields[key]=ctrl.value;updateOutputs();persist();});
  if(key==="operator")ctrl.addEventListener("focus",checkpoint,{once:true});
  label.append(ctrl);
  return label;
}
function containsId(block,id){
  let found=false;
  traverse([block],b=>{if(b.id===id)found=true;});
  return found;
}
function moveBlock(sourceId,parentId,branch,index){
  const from=findLocation(project,sourceId);
  if(!from)return;
  if(parentId && containsId(from.block,parentId)){notify("Cannot move a block inside itself");return;}
  const destination=parentId?findLocation(project,parentId)?.block?.[branch]:project.blocks;
  if(!Array.isArray(destination))return;
  mutate(()=>{
    const loc=findLocation(project,sourceId);
    const [block]=loc.list.splice(loc.index,1);
    if(loc.list===destination&&loc.index<index)index--;
    destination.splice(Math.max(0,Math.min(index,destination.length)),0,block);
  });
}
function dropZone(list,parentId,branch,index) {
  const el=make("div","drop-slot");el.style.minHeight="7px";
  el.addEventListener("dragover",event=>{
    event.preventDefault();event.dataTransfer.dropEffect="move";el.classList.add("drop-target");
  });
  el.addEventListener("dragleave",()=>el.classList.remove("drop-target"));
  el.addEventListener("drop",event=>{
    event.preventDefault();event.stopPropagation();
    el.classList.remove("drop-target");
    try {
      const data=JSON.parse(event.dataTransfer.getData("text/plain"));
      if(data.kind==="new"&&DEFINITIONS[data.type])mutate(()=>addBlock(project,data.type,parentId,branch,index));
      if(data.kind==="move")moveBlock(data.id,parentId,branch,index);
    }catch(error){notify("Drop was not recognized");}
  });
  return el;
}
function showAdd(parent=null,branch="root"){
  insertion={parent,branch};
  const list=$("modalChoices");list.replaceChildren();
  for(const type of Object.keys(DEFINITIONS)){
    const btn=make("button","choice-button");btn.type="button";
    btn.append(iconFor(type),make("span","",DEFINITIONS[type].name));
    btn.addEventListener("click",()=>{
      $("addDialog").close();
      mutate(()=>addBlock(project,type,insertion.parent,insertion.branch));
    });
    list.append(btn);
  }
  $("addDialog").showModal();
}
function blockView(block) {
  const definition=DEFINITIONS[block.type];
  const section=make("section","block");section.dataset.tone=definition.color;section.dataset.blockId=block.id;
  section.draggable=true;
  section.addEventListener("dragstart",event=>{
    if(event.target!==section)return;
    event.dataTransfer.effectAllowed="move";
    event.dataTransfer.setData("text/plain",JSON.stringify({kind:"move",id:block.id}));
  });
  const header=make("div","block-heading");
  const title=make("strong","",icons[block.type]+"  "+definition.name);
  const buttons=make("div","block-actions");
  buttons.append(
    actionButton("↑","Move up",()=>{
      const loc=findLocation(project,block.id);
      if(loc&&loc.index>0)mutate(()=>loc.list.splice(loc.index-1,0,...loc.list.splice(loc.index,1)));
    }),
    actionButton("↓","Move down",()=>{
      const loc=findLocation(project,block.id);
      if(loc&&loc.index<loc.list.length-1)mutate(()=>loc.list.splice(loc.index+1,0,...loc.list.splice(loc.index,1)));
    }),
    actionButton("⧉","Duplicate block",()=>{
      const loc=findLocation(project,block.id);
      if(!loc)return;
      mutate(()=>{
        const copy=structuredClone(loc.block);
        const freshIds=b=>{
          b.id=newBlock(b.type).id;
          for(const key of DEFINITIONS[b.type].branches||[])b[key].forEach(freshIds);
        };
        freshIds(copy);loc.list.splice(loc.index+1,0,copy);
      });
    }),
    actionButton("×","Delete block",()=>{
      const loc=findLocation(project,block.id);
      if(loc)mutate(()=>loc.list.splice(loc.index,1));
    })
  );
  header.append(title,buttons);section.append(header);
  const fields=make("div","block-fields");
  for(const key of Object.keys(definition.fields))fields.append(fieldInput(block,key));
  section.append(fields);
  for(const branch of definition.branches||[]){
    const nested=make("div","block-branch");
    const branchHeader=make("div","branch-heading");
    branchHeader.append(
      make("span","",branch==="then"?"If true":branch==="else"?"Otherwise":"Steps"),
      actionButton("+ Add","Add nested block",()=>showAdd(block.id,branch))
    );
    nested.append(branchHeader);
    renderList(block[branch],nested,block.id,branch,true);
    section.append(nested);
  }
  return section;
}
function renderList(blocks,target,parentId=null,branch="root",isNested=false){
  target.append(dropZone(blocks,parentId,branch,0));
  if(!blocks.length)target.append(make("div",isNested?"nested-empty":"empty-workspace",isNested?"Drop a block here or tap + Add":"Your workspace is empty. Choose a block from the library."));
  blocks.forEach((block,index)=>{
    target.append(blockView(block));
    target.append(dropZone(blocks,parentId,branch,index+1));
  });
}
function selectTab(tab){
  activeTab=tab;
  for(const kind of ["code","diagnostics","console"]){
    $(kind+"Pane").classList.toggle("hidden",kind!==tab);
    const control=$(kind+"Tab");
    control.classList.toggle("active",kind===tab);
    control.setAttribute("aria-selected",String(kind===tab));
  }
}
function updateOutputs(){
  let count=0;traverse(project.blocks,()=>count++);
  $("blockCount").textContent=count+" block"+(count===1?"":"s");
  $("footerStats").textContent=count+" blocks · "+(project.language==="javascript"?"JavaScript":"Luau");
  $("languageBadge").textContent=project.language==="javascript"?"JS":"LUAU";
  $("codeFilename").textContent=project.language==="javascript"?"script.js":"script.luau";
  $("codeOutput").textContent=generate(project);
  const problems=lint(project);
  $("issueCount").textContent=String(problems.length);
  const pane=$("diagnosticsPane");pane.replaceChildren();
  if(!problems.length)pane.append(make("p","success","✓ No basic issues found. Test exported code in its target runtime."));
  for(const issue of problems){
    const element=make("div","problem "+issue.severity,issue.severity.toUpperCase()+": "+issue.message);
    pane.append(element);
  }
}
function render(){
  $("projectTitle").value=project.title;
  $("language").value=project.language;
  $("workspace").replaceChildren();
  renderList(project.blocks,$("workspace"));
  updateOutputs();updateHistory();persist();
}
function download(filename,content,type){
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");anchor.href=url;anchor.download=filename;
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2500);
}
function safeFilename(text){
  return String(text||"script").trim().replace(/[^a-z0-9_-]+/gi,"-").replace(/^-+|-+$/g,"").slice(0,60)||"script";
}
function bindActions(){
  $("undoBtn").addEventListener("click",undo);
  $("redoBtn").addEventListener("click",redo);
  document.addEventListener("keydown",event=>{
    if(!(event.ctrlKey||event.metaKey)||event.altKey)return;
    const key=event.key.toLowerCase();
    if(key==="z"){event.preventDefault();event.shiftKey?redo():undo();}
    if(key==="y"){event.preventDefault();redo();}
    if(key==="s"){event.preventDefault();persist();notify("Project saved locally");}
  });
  $("clearBtn").addEventListener("click",()=>{
    if(!project.blocks.length||confirm("Clear every block in this project?"))mutate(()=>project.blocks=[]);
  });
  $("addBlockBtn").addEventListener("click",()=>showAdd());
  $("paletteSearch").addEventListener("input",palette);
  $("projectTitle").addEventListener("focus",checkpoint);
  $("projectTitle").addEventListener("input",event=>{project.title=event.target.value.slice(0,80);persist();});
  $("language").addEventListener("change",event=>{checkpoint();project.language=event.target.value;updateOutputs();persist();updateHistory();});
  $("loadTemplateBtn").addEventListener("click",()=>{
    if(project.blocks.length&&!confirm("Load a template? Your current blocks will be replaced."))return;
    const language=project.language;mutate(()=>{project=projectTemplate($("template").value);project.language=language;});
  });
  $("copyCodeBtn").addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(generate(project));notify("Generated code copied");}
    catch(error){notify("Clipboard blocked — select code and copy manually");}
  });
  $("exportCodeBtn").addEventListener("click",()=>{
    const issues=lint(project).filter(item=>item.severity==="error");
    if(issues.length&&!confirm(issues.length+" basic issue(s) detected. Export anyway?"))return;
    download(safeFilename(project.title)+(project.language==="javascript"?".js":".luau"),generate(project),"text/plain;charset=utf-8");
  });
  $("exportProjectBtn").addEventListener("click",()=>{
    download(safeFilename(project.title)+".easyscript.json",JSON.stringify(project,null,2),"application/json");
    notify("Project exported. Keep this file as a backup.");
  });
  $("importBtn").addEventListener("click",()=>$("filePicker").click());
  $("filePicker").addEventListener("change",async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{
      if(file.size>1_000_000)throw new Error("File is larger than 1 MB");
      const incoming=sanitizeProject(JSON.parse(await file.text()));
      if(project.blocks.length&&!confirm("Import this project and replace the current blocks?"))return;
      mutate(()=>{project=incoming;});
      notify("Project imported");
    }catch(error){notify("Import failed: "+error.message);}
    finally{event.target.value="";}
  });
  $("simulateBtn").addEventListener("click",()=>{
    const result=simulate(project),out=$("consoleOutput");out.replaceChildren();
    if(result.messages.length)for(const message of result.messages)out.append(make("div","",message));
    else out.append(make("div","dim","No print output produced."));
    if(result.error)out.append(make("div","problem error","Preview stopped: "+result.error));
    const state=make("div","dim","\nVariables: "+JSON.stringify(result.variables,null,2));
    out.append(state);selectTab("console");
  });
  for(const tab of ["code","diagnostics","console"])$(tab+"Tab").addEventListener("click",()=>selectTab(tab));
}
bindActions();palette();render();selectTab("code");
console.info("EasyScript.io visual editor v"+VERSION+" initialized");
