import {VERSION,DEFINITIONS,newBlock,projectTemplate,sanitizeProject,findLocation,addBlock,traverse,generate,lint,simulate} from "./engine.js";
import {highlightInto} from "./highlight.js";
import {listSavedProjects,saveProjectSnapshot,openSavedProject,deleteSavedProject} from "./library.js";
import {mountStudio} from "./studio.js";
import {mountUltraPlus} from "./ultra-plus.js";
import {loadWorkspace,saveWorkspace,activeFile,commitActive,chooseFile} from "./workspace.js";
import {mountWorkspaceUI} from "./workspace-ui.js";
import {copyBlockTree,pasteBlockTree,clipboardAvailable,countBlockTree} from "./clipboard.js";
import {copyCodeWithFallback,createCopyFallback} from "./code-copy.js";
import {mountExpressionComposer} from "./expression-ui.js";
import {addRecovery} from "./recovery.js";
import {mountEditorPro} from "./editor-pro.js";
import {mountUltraExpansion} from "./ultra-expansion.js";
import {mountUltraSuite} from "./ultra-suite-ui.js";
import {loadCustomDefinitions} from "./custom-blocks.js";

const $ = id => document.getElementById(id);
const STORAGE_KEY = "easyscript_project_v2";
const icons = {print:"▣",variable:"▤",set:"↗",if:"◇",repeat:"⟳",wait:"◷",comment:"≡",function:"ƒ",call:"↳",
  increment:"+1",while:"∞",service:"◈",playerJoined:"♟",partTouched:"◉",remoteReceived:"⇢",
  leaderstat:"★",setProperty:"◆",createPart:"⬡",
  random:"⚄",clamp:"⇥",concat:"Aa",length:"≡",array:"[]",append:"+",removeAt:"−",
  listSize:"#",each:"⋮",forRange:"1…",returnValue:"↰",breakLoop:"■",
  playerLeaving:"↪",characterAdded:"♟",setAttribute:"⚙",getAttribute:"⇠",
  destroyInstance:"✕",spawnTask:"⚡"};
loadCustomDefinitions(localStorage,DEFINITIONS);
let project = load();
let workspace = loadWorkspace(localStorage,project);
project = activeFile(workspace).project;
let workspaceUI = null;
const collapsedBlocks = new Set();
let undoStack = [];
let redoStack = [];
let insertion = {parent:null,branch:"root"};
let activeTab = "code";
let toastTimer = null;
let saveTimer = null;
let studioFeatures = null;
let ultraPlus = null;
let expressionComposer = null;
let editorPro = null;
let ultraExpansion = null;
let ultraSuite = null;
let outputFrame = 0;
function queueOutputs(){
  if(outputFrame)return;
  outputFrame=requestAnimationFrame(()=>{outputFrame=0;updateOutputs();});
}

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
function commitNow(){
  clearTimeout(saveTimer);
  commitActive(workspace,project);
  localStorage.setItem(STORAGE_KEY,snapshot());
  saveWorkspace(localStorage,workspace);
  addRecovery(localStorage,workspace);
}
function switchFile(id,skipCommit=false){
  if(!skipCommit){try{commitNow();}catch(error){notify("Save failed: "+error.message);return;}}
  try{chooseFile(workspace,id);}
  catch(error){notify(error.message);return;}
  project=activeFile(workspace).project;
  undoStack=[];redoStack=[];
  render();workspaceUI?.refresh();
}
function updateWorkspace(next=null){
  if(next){
    workspace=next;
    project=activeFile(workspace).project;
    undoStack=[];redoStack=[];
  }
  try{saveWorkspace(localStorage,workspace);}catch(error){notify("Workspace storage unavailable: "+error.message);}
  if(next)render();
  workspaceUI?.refresh();
}
function persist(){
  commitActive(workspace,project);
  clearTimeout(saveTimer);
  $("saveStatus").textContent="Saving…";
  saveTimer=setTimeout(()=>{
    try{
      localStorage.setItem(STORAGE_KEY,snapshot());
      saveWorkspace(localStorage,workspace);
      addRecovery(localStorage,workspace);
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
  const span=make("span","palette-icon "+DEFINITIONS[type].color,icons[type]||"◈");
  span.setAttribute("aria-hidden","true");
  return span;
}
function paletteButton(type,onPick){
  const btn=make("button","palette-button");
  btn.type="button";
  btn.append(iconFor(type),make("span","",DEFINITIONS[type].name));
  btn.draggable=true;
  btn.addEventListener("click",()=>{studioFeatures?.trackRecent(type);onPick(type);});
  btn.addEventListener("dragstart",event=>{
    event.dataTransfer.effectAllowed="copy";
    event.dataTransfer.setData("text/plain",JSON.stringify({kind:"new",type}));
  });
  return btn;
}
function palette(){
  const query=$("paletteSearch").value.trim().toLowerCase();
  const category=$("paletteCategory").value;
  const matchingGroup=group=>category==="all"||category===group||(category==="relevant"&&(query||!(project.language==="luau"?group.startsWith("JavaScript"):group.startsWith("Roblox"))));
  const parent=$("palette");parent.replaceChildren();
  const groups=[...new Set(Object.values(DEFINITIONS).map(x=>x.group))];
  const matches=type=>(DEFINITIONS[type].name+" "+DEFINITIONS[type].group+" "+type).toLowerCase().includes(query);
  let total=0;
  function addPaletteGroup(title,types){
    if(!matchingGroup(title)&&!["★ Favorites","↶ Recently used"].includes(title))return;
    const filtered=[...new Set(types)].filter(type=>DEFINITIONS[type]&&matches(type));
    if(!filtered.length)return;
    parent.append(make("div","palette-heading",title));
    for(const type of filtered){
      const row=make("div","palette-row");
      const favorite=studioFeatures?.isFavorite(type)||false;
      const pick=paletteButton(type,t=>mutate(()=>addBlock(project,t)));
      const star=make("button","favorite-toggle"+(favorite?" is-favorite":""),favorite?"★":"☆");
      star.type="button";star.title=(favorite?"Remove ":"Add ")+"favorite: "+DEFINITIONS[type].name;
      star.setAttribute("aria-pressed",String(favorite));
      star.setAttribute("aria-label",star.title);
      star.addEventListener("click",()=>studioFeatures?.toggleFavorite(type));
      row.append(pick,star);parent.append(row);total++;
    }
  }
  if(studioFeatures){
    addPaletteGroup("★ Favorites",studioFeatures.favorites());
    addPaletteGroup("↶ Recently used",studioFeatures.recent());
  }
  for(const group of groups)addPaletteGroup(group,Object.keys(DEFINITIONS).filter(type=>DEFINITIONS[type].group===group));
  if(!total)parent.append(make("p","panel-note","No blocks found. Try another search or choose All blocks."));
  $("paletteResults").textContent=total+" block options";
}
function setupCategories(){
  const select=$("paletteCategory"),before=select.value;
  const groups=[...new Set(Object.values(DEFINITIONS).map(x=>x.group))];
  select.replaceChildren();
  for(const [value,label] of [["relevant","Relevant to language"],["all","All blocks"],...groups.map(g=>[g,g])]){
    const option=make("option","",label);option.value=value;select.append(option);
  }
  select.value=[...select.options].some(o=>o.value===before)?before:"relevant";
  select.onchange=palette;
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
  if(block.type==="service"&&key==="service"){
    const original=block.fields[key];
    const services=["Players","ReplicatedStorage","ServerStorage","RunService","TweenService","UserInputService","DataStoreService","Lighting","CollectionService"];
    const select=make("select","");
    for(const name of services){const option=make("option","",name);option.value=name;select.append(option);}
    if(!services.includes(original)){const option=make("option","",String(original));option.value=String(original);select.append(option);}
    select.value=original;
    select.setAttribute("aria-label","Roblox service");
    select.addEventListener("focus",checkpoint,{once:true});
    select.addEventListener("change",()=>{block.fields[key]=select.value;queueOutputs();persist();});
    label.append(select);return label;
  }
  ctrl.value=block.fields[key]??"";
  ctrl.setAttribute("aria-label",DEFINITIONS[block.type].name+" "+key);
  ctrl.addEventListener("change",()=>{block.fields[key]=ctrl.value;queueOutputs();persist();});
  ctrl.addEventListener("input",()=>{block.fields[key]=ctrl.value;queueOutputs();persist();});
  if(key==="operator")ctrl.addEventListener("focus",checkpoint,{once:true});
  label.append(ctrl);
  const expressionKeys=new Set(["value","amount","left","right","initial","seconds","min","max","x","y","z","r","g","b",
    "h","s","v","start","end","step","count","visible","health","speed","height","fallback","alpha","size","position","color"]);
  if(expressionKeys.has(key)&&block.type!=="comment"&&block.type!=="globalRead"){
    const open=make("button","expr-open","◇ Build");
    open.type="button";open.title="Open typed expression blocks";
    open.setAttribute("aria-label","Build expression for "+DEFINITIONS[block.type].name+" "+key);
    open.addEventListener("click",()=>{
      expressionComposer?.open(block.fields[key],value=>{
        checkpoint();block.fields[key]=value;ctrl.value=value;queueOutputs();persist();updateHistory();
      });
    });
    label.append(open);
  }
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
  const search=$("modalBlockSearch");search.value="";
  const modalList=$("modalChoices");
  const showChoices=()=>{
    const query=search.value.trim().toLowerCase();
    modalList.replaceChildren();
    const language=project.language;
    const types=Object.keys(DEFINITIONS).filter(type=>{
      const def=DEFINITIONS[type];
      if(query)return (def.name+" "+def.group+" "+type).toLowerCase().includes(query);
      return language==="luau"?!def.group.startsWith("JavaScript"):!def.group.startsWith("Roblox");
    });
    const fragment=document.createDocumentFragment();
    for(const type of types){
      const btn=make("button","choice-button");btn.type="button";
      btn.append(iconFor(type),make("span","",DEFINITIONS[type].name));
      btn.addEventListener("click",()=>{
        $("addDialog").close();
        studioFeatures?.trackRecent(type);
        mutate(()=>addBlock(project,type,insertion.parent,insertion.branch));
      });
      fragment.append(btn);
    }
    modalList.append(fragment);
    if(!types.length)modalList.append(make("p","panel-note","No matching blocks"));
  };
  search.oninput=showChoices;
  showChoices();
  $("addDialog").showModal();
}
function blockView(block) {
  const definition=DEFINITIONS[block.type];
  const section=make("section","block");section.dataset.tone=definition.color;section.dataset.blockId=block.id;
  section.classList.toggle("block-collapsed",collapsedBlocks.has(block.id));
  section.draggable=true;
  section.addEventListener("dragstart",event=>{
    if(event.target!==section)return;
    event.dataTransfer.effectAllowed="move";
    event.dataTransfer.setData("text/plain",JSON.stringify({kind:"move",id:block.id}));
  });
  const header=make("div","block-heading");
  const title=make("strong","",(icons[block.type]||"◈")+"  "+definition.name);
  const buttons=make("div","block-actions");
  buttons.append(
    actionButton("▸","Collapse or expand block",()=>{
      if(collapsedBlocks.has(block.id))collapsedBlocks.delete(block.id);else collapsedBlocks.add(block.id);
      section.classList.toggle("block-collapsed",collapsedBlocks.has(block.id));
    }),
    actionButton("⎘","Copy block for use in another file",()=>{
      try{copyBlockTree(localStorage,block);notify("Copied "+countBlockTree(block)+" block(s)");}
      catch(error){notify(error.message);}
    }),
    actionButton("⇣","Paste copied block after this block",()=>{
      if(!clipboardAvailable(localStorage)){notify("Copy a block first");return;}
      try{mutate(()=>pasteBlockTree(localStorage,project,block.id));notify("Block pasted");}
      catch(error){notify("Paste failed: "+error.message);}
    }),
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
  highlightInto($("codeOutput"),generate(project),project.language);
  const problems=lint(project);
  $("issueCount").textContent=String(problems.length);
  const pane=$("diagnosticsPane");pane.replaceChildren();
  if(!problems.length)pane.append(make("p","success","✓ No basic issues found. Test exported code in its target runtime."));
  studioFeatures?.update();
  ultraPlus?.update();
  ultraExpansion?.update();
  ultraSuite?.update();
  editorPro?.update();
  for(const issue of problems){
    const element=make("button","problem "+issue.severity,issue.severity.toUpperCase()+": "+issue.message);
    element.type="button";
    element.title="Locate this block in the workspace";
    element.addEventListener("click",()=>{
      const block=[...document.querySelectorAll("[data-block-id]")].find(el=>el.dataset.blockId===issue.id);
      if(!block)return;
      block.scrollIntoView({behavior:"smooth",block:"center"});
      block.classList.add("focused-problem");
      setTimeout(()=>block.classList.remove("focused-problem"),2200);
    });
    pane.append(element);
  }
}
function render(){
  $("projectTitle").value=project.title;
  $("language").value=project.language;
  $("workspace").replaceChildren();
  renderList(project.blocks,$("workspace"));
  if(outputFrame){cancelAnimationFrame(outputFrame);outputFrame=0;}
  updateOutputs();updateHistory();persist();
  workspaceUI?.refresh();
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
function renderLibrary(){
  const list=$("libraryList");list.replaceChildren();
  let projects;
  try{projects=listSavedProjects(localStorage);}
  catch(error){list.append(make("p","panel-note","Project library unavailable: "+error.message));return;}
  $("libraryCount").textContent=projects.length+" saved";
  if(!projects.length){list.append(make("p","panel-note","No snapshots yet. Save your first project below."));return;}
  for(const entry of projects){
    const card=make("article","library-entry");
    const details=make("div","library-entry-details");
    details.append(make("strong","",entry.title),
      make("span","",entry.language.toUpperCase()+" · "+entry.topLevelBlocks+" top-level blocks · "+new Date(entry.createdAt).toLocaleString()));
    const actions=make("div","library-entry-actions");
    const open=make("button","btn compact","Open");
    open.addEventListener("click",()=>{
      if(project.blocks.length&&!confirm("Open this snapshot? Unsaved changes to your current project may be lost."))return;
      try{mutate(()=>{project=openSavedProject(localStorage,entry.id);});$("libraryDialog").close();notify("Snapshot opened");}
      catch(error){notify("Could not open project: "+error.message);}
    });
    const remove=make("button","btn compact ghost","Delete");
    remove.setAttribute("aria-label","Delete "+entry.title);
    remove.addEventListener("click",()=>{
      if(!confirm("Delete this saved snapshot?"))return;
      try{deleteSavedProject(localStorage,entry.id);renderLibrary();}
      catch(error){notify("Delete failed: "+error.message);}
    });
    actions.append(open,remove);card.append(details,actions);list.append(card);
  }
}
function bindActions(){
  $("libraryBtn").addEventListener("click",()=>{renderLibrary();$("libraryDialog").showModal();});
  $("saveSnapshotBtn").addEventListener("click",()=>{
    try{saveProjectSnapshot(localStorage,project);renderLibrary();notify("Snapshot saved to this browser");}
    catch(error){notify("Could not save snapshot: "+error.message);}
  });
  $("undoBtn").addEventListener("click",undo);
  $("redoBtn").addEventListener("click",redo);
  document.addEventListener("keydown",event=>{
    if(!(event.ctrlKey||event.metaKey)||event.altKey)return;
    const key=event.key.toLowerCase();
    const editable=event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement||event.target?.isContentEditable;
    if(key==="z"||key==="y"){
      if(editable)return;
      event.preventDefault();
      if(key==="z"){event.shiftKey?redo():undo();}else redo();
    }
    if(key==="s"){event.preventDefault();try{commitNow();notify("Workspace saved locally");}catch(error){notify("Save failed: "+error.message);}}
    if(key==="l"&&event.shiftKey){event.preventDefault();renderLibrary();$("libraryDialog").showModal();}
    if(key==="enter"){event.preventDefault();$("simulateBtn").click();}
  });
  $("clearBtn").addEventListener("click",()=>{
    if(!project.blocks.length||confirm("Clear every block in this project?"))mutate(()=>project.blocks=[]);
  });
  $("addBlockBtn").addEventListener("click",()=>showAdd());
  const pasteAtEnd=make("button","btn compact ghost","⇣ Paste block");
  pasteAtEnd.title="Paste a copied block into this script";
  pasteAtEnd.addEventListener("click",()=>{
    try{mutate(()=>pasteBlockTree(localStorage,project));notify("Block pasted at end of script");}
    catch(error){notify("Paste failed: "+error.message);}
  });
  $("addBlockBtn").after(pasteAtEnd);
  $("paletteSearch").addEventListener("input",palette);
  $("projectTitle").addEventListener("focus",checkpoint);
  $("projectTitle").addEventListener("input",event=>{project.title=event.target.value.slice(0,80);persist();});
  $("language").addEventListener("change",event=>{checkpoint();project.language=event.target.value;commitActive(workspace,project);updateOutputs();persist();updateHistory();palette();workspaceUI?.refresh();});
  $("loadTemplateBtn").addEventListener("click",()=>{
    if(project.blocks.length&&!confirm("Load a template? Your current blocks will be replaced."))return;
    const language=project.language;
    mutate(()=>{project=projectTemplate($("template").value);
      if(!["leaderstats","touch","remote","globalCounter","uiButton","doorPrompt","playerData","remoteReply","vectors","jsPage","jsStorage","jsRequest"].includes($("template").value))project.language=language;
    });
    notify("Template loaded. Customize each block to get started.");
  });
  const showCopyFallback=createCopyFallback();
  const copyCurrentCode=()=>copyCodeWithFallback(generate(project),notify,showCopyFallback);
  $("copyCodeBtn").addEventListener("click",copyCurrentCode);
  document.addEventListener("keydown",event=>{
    if(!(event.ctrlKey||event.metaKey)||!event.shiftKey||event.key.toLowerCase()!=="c")return;
    if(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement)return;
    event.preventDefault();copyCurrentCode();
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
bindActions();
studioFeatures=mountStudio({getProject:()=>project,notify,renderPalette:palette});
expressionComposer=mountExpressionComposer({getLanguage:()=>project.language,notify});
editorPro=mountEditorPro({
 getProject:()=>project,getWorkspace:()=>workspace,notify,
 mutate:fn=>mutate(()=>fn(project)),
 jump:id=>{
  document.querySelector('[data-view="workspace"]')?.click();
  const el=[...document.querySelectorAll("[data-block-id]")].find(x=>x.dataset.blockId===id);
  el?.scrollIntoView({behavior:"smooth",block:"center"});
 }
});
ultraPlus=mountUltraPlus({getProject:()=>project,getWorkspace:()=>workspace,notify,
  scrollToBlock:id=>{
    document.querySelector('[data-view="workspace"]')?.click();
    const element=[...document.querySelectorAll("[data-block-id]")].find(x=>x.dataset.blockId===id);
    element?.scrollIntoView({behavior:"smooth",block:"center"});
    element?.classList.add("focused-problem");
    if(element)setTimeout(()=>element.classList.remove("focused-problem"),1300);
  }
});
ultraExpansion=mountUltraExpansion({getProject:()=>project,notify});
workspaceUI=mountWorkspaceUI({getWorkspace:()=>workspace,switchFile,updateWorkspace,notify,commitNow});
ultraSuite=mountUltraSuite({
 getProject:()=>project,getWorkspace:()=>workspace,notify,commitNow,updateWorkspace,switchFile,
 refreshPalette:()=>{setupCategories();palette();}
});
setupCategories();palette();render();selectTab("code");
console.info("EasyScript.io visual editor v"+VERSION+" initialized");
