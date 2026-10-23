// Bounded local workspace recovery. Does not replace explicit JSON backups.
export const RECOVERY_KEY="easyscript_recovery_v1";
const LIMIT=8,INTERVAL=3*60*1000;
function read(storage){
  try{
    const raw=storage.getItem(RECOVERY_KEY);
    const parsed=raw?JSON.parse(raw):[];
    return Array.isArray(parsed)?parsed.filter(x=>x&&Number.isFinite(x.at)&&x.workspace?.files).slice(-LIMIT):[];
  }catch{return [];}
}
export function addRecovery(storage,workspace,now=Date.now(),force=false){
  const items=read(storage),recent=items[items.length-1];
  if(!force&&recent&&now-recent.at<INTERVAL)return false;
  const snapshot=JSON.stringify(workspace);
  if(snapshot.length>2_000_000)return false;
  const next=items.concat([{at:now,workspace:JSON.parse(snapshot)}]).slice(-LIMIT);
  storage.setItem(RECOVERY_KEY,JSON.stringify(next));
  return true;
}
export function listRecovery(storage){
  return read(storage).map(x=>({at:x.at,files:x.workspace.files.length,name:x.workspace.name})).reverse();
}
export function restoreRecovery(storage,at){
  const entry=read(storage).find(x=>x.at===at);
  if(!entry)throw new Error("Recovery snapshot no longer exists");
  return JSON.parse(JSON.stringify(entry.workspace));
}
