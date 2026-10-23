// Offline reviewable workspace changes. No network, credentials, or automatic merges.
import {validateWorkspace} from "./workspace.js";
const FORMAT="EasyScript-workspace-patch-v2";
const serialize=x=>JSON.stringify(x);
function validated(source){
 return validateWorkspace(JSON.parse(serialize(source)));
}
export function workspaceFingerprint(workspace){
 const text=serialize(validated(workspace));
 let h=2166136261;
 for(let i=0;i<text.length;i++){
  h^=text.charCodeAt(i);
  h=Math.imul(h,16777619);
 }
 return (h>>>0).toString(16).padStart(8,"0");
}
export function reviewWorkspaceChanges(before,after){
 const b=validated(before),a=validated(after);
 const previous=new Map(b.files.map(f=>[f.id,f])),current=new Map(a.files.map(f=>[f.id,f]));
 const changes=[];
 for(const file of a.files){
  const older=previous.get(file.id);
  if(!older)changes.push({kind:"added",name:file.name,id:file.id});
  else if(serialize(older)!==serialize(file))
   changes.push({kind:"modified",name:file.name,id:file.id,renamed:older.name!==file.name,oldName:older.name});
 }
 for(const file of b.files){
  if(!current.has(file.id))changes.push({kind:"removed",name:file.name,id:file.id});
 }
 return {before:workspaceFingerprint(b),after:workspaceFingerprint(a),changes,
  summary:{added:changes.filter(x=>x.kind==="added").length,
   modified:changes.filter(x=>x.kind==="modified").length,
   removed:changes.filter(x=>x.kind==="removed").length}};
}
export function createWorkspacePatch(before,after){
 const b=validated(before),a=validated(after),review=reviewWorkspaceChanges(b,a);
 return {format:FORMAT,base:review.before,target:review.after,changes:review.changes,workspace:a};
}
export function inspectWorkspacePatch(original,patch){
 if(!patch||patch.format!==FORMAT||typeof patch.base!=="string")
  throw new Error("Not an EasyScript v2 workspace patch");
 const next=validated(patch.workspace);
 if(workspaceFingerprint(next)!==patch.target)
  throw new Error("Patch target checksum mismatch");
 const base=workspaceFingerprint(original);
 return {compatible:base===patch.base,expected:patch.base,actual:base,changes:patch.changes||[],
  target:patch.target};
}
export function applyWorkspacePatch(original,patch){
 const report=inspectWorkspacePatch(original,patch);
 if(!report.compatible)throw new Error("Workspace changed since this patch was created. Import the original backup or resolve conflicts manually.");
 return validated(patch.workspace);
}
export function workspacePatchFileName(workspace){
 return String(workspace.name||"workspace").replace(/[^a-zA-Z0-9_-]/g,"-").slice(0,48)+"-patch-v2.json";
}
