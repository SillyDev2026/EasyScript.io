import {activeFile,chooseFile,addFile,removeFile,renameFile,duplicateFile,validateWorkspace,createWorkspace,bundleSources} from "./workspace.js";
import {generate} from "./engine.js";
import {polishedProjectSource} from "./code-polish.js";
import {copyCodeWithFallback,createCopyFallback} from "./code-copy.js";
import {mountWorkspaceV1} from "./v1-workspace-ui.js";
import {DEFINITIONS} from "./engine.js";
import {listCustomDefinitions,registerCustomDefinition,saveCustomDefinitions,validateCustomDefinition} from "./custom-blocks.js";

const el=(tag,className="",text)=>{
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=text;
  return node;
};
const download=(filename,content,mime)=>{
  const blob=new Blob([content],{type:mime});
  const url=URL.createObjectURL(blob);
  const a=el("a");a.href=url;a.download=filename;document.body.append(a);
  a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
};
export function mountWorkspaceUI({getWorkspace,switchFile,updateWorkspace,notify,commitNow,refreshPalette=()=>{},getCodePrefs=()=>({style:"readable",labels:false})}){
  const bar=el("nav","file-tabbar");
  bar.setAttribute("aria-label","Project files");
  const tabs=el("div","file-tabs");tabs.setAttribute("role","tablist");tabs.setAttribute("aria-label","Open script files");
  const actions=el("div","file-actions");
  const addButton=el("button","btn compact","＋ New file");
  const manageButton=el("button","btn compact ghost","Manage files");
  addButton.type="button";manageButton.type="button";actions.append(addButton,manageButton);
  bar.append(tabs,actions);
  document.querySelector(".project-bar").after(bar);
  const manualCopy=createCopyFallback();
  const styledCode=project=>polishedProjectSource(project,generate,DEFINITIONS,getCodePrefs());
  const dialog=el("dialog","file-dialog");
  const heading=el("div","file-dialog-heading");
  heading.append(el("h2","","Workspace Explorer"));
  const close=el("button","icon-btn","✕");
  close.type="button";close.setAttribute("aria-label","Close file manager");
  close.addEventListener("click",()=>dialog.close());heading.append(close);
  const hint=el("p","panel-note","Create up to 24 local script files. Each file has its own blocks and language. Export a workspace backup to keep your changes.");
  const nameLabel=el("label","workspace-name-label","Workspace name");
  const nameInput=el("input");nameInput.maxLength=80;nameInput.spellcheck=false;nameInput.setAttribute("aria-label","Workspace name");
  nameLabel.append(nameInput);
  const fileList=el("div","file-manager-list");
  const bottom=el("div","file-dialog-actions");
  const exportButton=el("button","btn compact","Export workspace");
  const importButton=el("button","btn compact ghost","Import workspace");
  const sourcesButton=el("button","btn compact ghost","Export source manifest");
  const copySourcesButton=el("button","btn compact ghost","Copy all code");
  const input=el("input");input.type="file";input.accept=".json,application/json";input.hidden=true;
  bottom.append(exportButton,importButton,sourcesButton,copySourcesButton);
  dialog.append(heading,hint,nameLabel,fileList,bottom,input);
  document.body.append(dialog);

  const safeName=name=>String(name||"Workspace").trim().replace(/[^a-z0-9_-]+/gi,"-").slice(0,50)||"Workspace";
  function refresh(){
    const ws=getWorkspace();
    tabs.replaceChildren();fileList.replaceChildren();
    for(const [i,file] of ws.files.entries()){
      const active=file.id===ws.activeId;
      const tab=el("button","file-tab"+(active?" active":""),file.name);
      tab.setAttribute("role","tab");tab.setAttribute("aria-selected",String(active));
      tab.type="button";tab.title=file.kind+" · "+(i+1);
      tab.addEventListener("click",()=>switchFile(file.id));
      tabs.append(tab);
      const row=el("div","file-row");
      const info=el("div","file-info");
      info.append(el("strong","",file.name),
        el("span","",file.kind+" · "+file.project.language.toUpperCase()+" · "+file.project.blocks.length+" top-level blocks"));
      const controls=el("div","file-row-actions");
      const open=el("button","btn compact","Open");
      const rename=el("button","btn compact ghost","Rename");
      const duplicate=el("button","btn compact ghost","Duplicate");
      const remove=el("button","btn compact ghost","Delete");
      open.addEventListener("click",()=>{switchFile(file.id);dialog.close();});
      rename.addEventListener("click",()=>{
        const value=prompt("Rename script file",file.name);
        if(value===null)return;
        try{commitNow();renameFile(getWorkspace(),file.id,value);updateWorkspace();notify("File renamed");}
        catch(error){notify(error.message);}
      });
      duplicate.addEventListener("click",()=>{
        try{commitNow();const copy=duplicateFile(getWorkspace(),file.id);updateWorkspace();switchFile(copy.id,true);notify("File duplicated");}
        catch(error){notify(error.message);}
      });
      remove.disabled=ws.files.length<2;
      remove.addEventListener("click",()=>{
        if(!confirm("Delete "+file.name+" from this workspace? Export a backup first if needed."))return;
        try{commitNow();removeFile(getWorkspace(),file.id);updateWorkspace();switchFile(getWorkspace().activeId,true);notify("File deleted");}
        catch(error){notify(error.message);}
      });
      controls.append(open,rename,duplicate,remove);row.append(info,controls);fileList.append(row);
    }
    nameInput.value=ws.name;
    addButton.disabled=ws.files.length>=24;
  }
  function newFile(){
    const kinds=["Script","LocalScript","ModuleScript","JavaScript"];
    const kind=prompt("Script type: Script, LocalScript, ModuleScript, or JavaScript","Script");
    if(kind===null)return;
    if(!kinds.includes(kind.trim())){notify("Choose Script, LocalScript, ModuleScript or JavaScript");return;}
    const name=prompt("New file name","NewScript");
    if(name===null)return;
    try{commitNow();const file=addFile(getWorkspace(),name,kind.trim());updateWorkspace();switchFile(file.id,true);notify("New "+kind.trim()+" created");}
    catch(error){notify(error.message);}
  }
  addButton.addEventListener("click",newFile);
  manageButton.addEventListener("click",()=>{refresh();dialog.showModal();});
  nameInput.addEventListener("change",()=>{
    getWorkspace().name=nameInput.value.trim().slice(0,80)||"My Workspace";updateWorkspace();
  });
  exportButton.addEventListener("click",()=>{
    commitNow();const ws=getWorkspace();
    download(safeName(ws.name)+".easyscript-workspace.json",JSON.stringify({...ws,customBlocks:listCustomDefinitions()},null,2),"application/json");
    notify("Workspace backup exported");
  });
  importButton.addEventListener("click",()=>input.click());
  input.addEventListener("change",async()=>{
    const file=input.files?.[0];if(!file)return;
    try{
      if(file.size>4_000_000)throw new Error("Workspace backup exceeds 4 MB");
      const data=JSON.parse(await file.text());
      const incomingCustom=Array.isArray(data.customBlocks)?data.customBlocks.slice(0,30).map(validateCustomDefinition):[];
      if(incomingCustom.length){
        for(const definition of incomingCustom)registerCustomDefinition(definition,DEFINITIONS);
        saveCustomDefinitions(localStorage);
        refreshPalette();
      }
      const ws=validateWorkspace(data);
      if(!confirm("Replace current workspace with "+ws.files.length+" imported files? Export your existing workspace first."))return;
      updateWorkspace(ws);
      switchFile(ws.activeId,true);
      notify("Workspace imported");
      dialog.close();
    }catch(error){notify("Import failed: "+error.message);}
    finally{input.value="";}
  });
  sourcesButton.addEventListener("click",()=>{
    commitNow();const ws=getWorkspace();
    const manifest={format:"EasyScript-source-manifest-v1",name:ws.name,
      files:bundleSources(ws).map(file=>({
        name:file.filename,type:file.kind,language:file.language,source:styledCode(file.project)
      }))};
    download(safeName(ws.name)+"-source-manifest.json",JSON.stringify(manifest,null,2),"application/json");
    notify("Source manifest exported (not a ZIP)");
  });
  copySourcesButton.addEventListener("click",async()=>{
    commitNow();const ws=getWorkspace();
    const output=bundleSources(ws).map(file=>"======== "+file.filename+" ========\n"+styledCode(file.project)).join("\n");
    await copyCodeWithFallback(output,notify,manualCopy);
  });
  mountWorkspaceV1({getWorkspace,updateWorkspace,switchFile,notify,commitNow,dialog,bottom,getCodePrefs});
  document.addEventListener("keydown",event=>{
    if(!event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    if(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement)return;
    const n=Number(event.key);
    if(Number.isInteger(n)&&n>0&&n<=9){
      const file=getWorkspace().files[n-1];
      if(file){event.preventDefault();switchFile(file.id);}
    }
  });
  refresh();
  return {refresh,open:()=>{refresh();dialog.showModal();}};
}
