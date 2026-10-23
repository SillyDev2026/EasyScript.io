import {sanitizeProject,projectTemplate} from "./engine.js";

export const WORKSPACE_KEY="easyscript_workspace_v5";
const LIMIT=24;
const extensions={luau:".luau",javascript:".js"};
function fileId(){
  return "file_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,10);
}
function validName(name,language){
  let value=String(name||"").trim().replace(/[\\/:*?"<>|]/g,"-").slice(0,72);
  if(!value)value="Script";
  if(!/\.(luau|lua|js)$/.test(value))value+=extensions[language]||".luau";
  return value;
}
function uniqueName(files,requested,skip=null){
  const existing=new Set(files.filter(x=>x.id!==skip).map(x=>x.name.toLowerCase()));
  let candidate=requested,number=2;
  while(existing.has(candidate.toLowerCase())){
    const dot=requested.lastIndexOf(".");
    candidate=(dot>0?requested.slice(0,dot):requested)+"-"+number+++(dot>0?requested.slice(dot):"");
  }
  return candidate;
}
function cleanFile(raw){
  const project=sanitizeProject(raw.project);
  return {
    id:typeof raw.id==="string"&&/^file_[a-z0-9_]+$/i.test(raw.id)?raw.id:fileId(),
    name:validName(raw.name,project.language),
    kind:["Script","LocalScript","ModuleScript","JavaScript"].includes(raw.kind)?raw.kind:(project.language==="javascript"?"JavaScript":"Script"),
    project
  };
}
export function createWorkspace(project=projectTemplate("starter")){
  const file=cleanFile({name:"Main",project,kind:project.language==="javascript"?"JavaScript":"Script"});
  return {schema:2,name:"My Workspace",activeId:file.id,files:[file]};
}
export function validateWorkspace(raw){
  if(!raw||typeof raw!=="object"||!Array.isArray(raw.files)||!raw.files.length||raw.files.length>LIMIT)
    throw new Error("Workspace must contain between 1 and "+LIMIT+" files");
  const files=[],usedIds=new Set();
  for(const original of raw.files){
    if(!original||typeof original!=="object")throw new Error("Invalid workspace file");
    const file=cleanFile(original);
    if(usedIds.has(file.id))file.id=fileId();
    usedIds.add(file.id);
    file.name=uniqueName(files,file.name);
    files.push(file);
  }
  const activeId=files.some(f=>f.id===raw.activeId)?raw.activeId:files[0].id;
  return {schema:2,name:String(raw.name||"My Workspace").trim().slice(0,80)||"My Workspace",activeId,files};
}
export function loadWorkspace(storage,legacyProject){
  try{
    const raw=storage.getItem(WORKSPACE_KEY);
    if(raw)return validateWorkspace(JSON.parse(raw));
  }catch(error){console.warn("Workspace recovery fallback",error);}
  return createWorkspace(legacyProject);
}
export function saveWorkspace(storage,workspace){
  storage.setItem(WORKSPACE_KEY,JSON.stringify(workspace));
}
export function activeFile(workspace){
  return workspace.files.find(f=>f.id===workspace.activeId)||workspace.files[0];
}
export function commitActive(workspace,project){
  activeFile(workspace).project=project;
  return workspace;
}
export function addFile(workspace,name,kind="Script",template="blank"){
  if(workspace.files.length>=LIMIT)throw new Error("Workspace file limit reached ("+LIMIT+")");
  const project=projectTemplate(template);
  if(kind==="JavaScript")project.language="javascript";
  else project.language="luau";
  const file=cleanFile({id:fileId(),name,kind,project});
  file.name=uniqueName(workspace.files,file.name);
  workspace.files.push(file);workspace.activeId=file.id;
  return file;
}
export function renameFile(workspace,id,name){
  const file=workspace.files.find(f=>f.id===id);
  if(!file)throw new Error("Unknown file");
  file.name=uniqueName(workspace.files,validName(name,file.project.language),id);
  return file;
}
export function duplicateFile(workspace,id){
  const original=workspace.files.find(f=>f.id===id);
  if(!original)throw new Error("Unknown file");
  if(workspace.files.length>=LIMIT)throw new Error("Workspace file limit reached");
  const file=cleanFile({id:fileId(),name:original.name,kind:original.kind,project:original.project});
  file.name=uniqueName(workspace.files,file.name);
  workspace.files.push(file);workspace.activeId=file.id;
  return file;
}
export function removeFile(workspace,id){
  if(workspace.files.length===1)throw new Error("Keep at least one file in the workspace");
  const index=workspace.files.findIndex(f=>f.id===id);
  if(index<0)throw new Error("Unknown file");
  workspace.files.splice(index,1);
  if(workspace.activeId===id)workspace.activeId=workspace.files[Math.min(index,workspace.files.length-1)].id;
  return activeFile(workspace);
}
export function chooseFile(workspace,id){
  const found=workspace.files.find(f=>f.id===id);
  if(!found)throw new Error("Unknown file");
  workspace.activeId=found.id;
  return found;
}
export function bundleSources(workspace){
  const seen=new Set();
  return workspace.files.map(file=>{
    let name=validName(String(file.name).replace(/\.(luau|lua|js)$/i,""),file.project.language),number=2;
    while(seen.has(name.toLowerCase())){
      const i=name.lastIndexOf(".");
      name=name.slice(0,i)+"-"+number+++name.slice(i);
    }
    seen.add(name.toLowerCase());
    return {filename:name,kind:file.kind,language:file.project.language,project:file.project};
  });
}
