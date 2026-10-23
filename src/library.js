// Project snapshots are stored only in this browser. This is not cloud sync.
import {sanitizeProject} from "./engine.js";

export const LIBRARY_KEY="easyscript_library_v3";
const MAX_PROJECTS=40;

function readEntries(storage){
  const raw=storage.getItem(LIBRARY_KEY);
  if(!raw)return [];
  const entries=JSON.parse(raw);
  if(!Array.isArray(entries))throw new Error("Saved project library is invalid");
  return entries.filter(entry=>entry&&typeof entry.id==="string"&&entry.project&&typeof entry.project==="object").slice(-MAX_PROJECTS);
}
export function listSavedProjects(storage){
  return readEntries(storage).map(({id,createdAt,project})=>({
    id,createdAt,title:String(project.title||"Untitled Project").slice(0,80),
    language:project.language==="javascript"?"javascript":"luau",
    topLevelBlocks:Array.isArray(project.blocks)?project.blocks.length:0
  })).reverse();
}
export function saveProjectSnapshot(storage,project,now=Date.now()){
  const entries=readEntries(storage);
  const id="p_"+now.toString(36)+"_"+Math.random().toString(36).slice(2,10);
  entries.push({id,createdAt:new Date(now).toISOString(),project:sanitizeProject(project)});
  storage.setItem(LIBRARY_KEY,JSON.stringify(entries.slice(-MAX_PROJECTS)));
  return id;
}
export function openSavedProject(storage,id){
  const entry=readEntries(storage).find(entry=>entry.id===id);
  if(!entry)throw new Error("Project snapshot not found");
  return sanitizeProject(entry.project);
}
export function deleteSavedProject(storage,id){
  const entries=readEntries(storage);
  const filtered=entries.filter(entry=>entry.id!==id);
  if(filtered.length===entries.length)return false;
  storage.setItem(LIBRARY_KEY,JSON.stringify(filtered));
  return true;
}
