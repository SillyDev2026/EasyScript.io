import {analyzeWorkspace} from "./project-graph.js";
import {createZip,workspaceZipEntries} from "./zip.js";
import {bundleSources,validateWorkspace} from "./workspace.js";
import {generate} from "./engine.js";
import {listCustomDefinitions} from "./custom-blocks.js";
import {addRecovery,listRecovery,restoreRecovery} from "./recovery.js";

const el=(tag,cls="",value)=>{
  const n=document.createElement(tag);
  if(cls)n.className=cls;
  if(value!==undefined)n.textContent=String(value);
  return n;
};
function downloadZip(name,data){
  const blob=new Blob([data],{type:"application/zip"});
  const url=URL.createObjectURL(blob),anchor=el("a");
  anchor.href=url;anchor.download=name;
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}
export function mountWorkspaceV1({getWorkspace,updateWorkspace,switchFile,notify,commitNow,dialog,bottom}){
  const zip=el("button","btn compact","Download scripts ZIP");
  const graph=el("button","btn compact ghost","Module graph");
  const recovery=el("button","btn compact ghost","Recovery");
  const savePoint=el("button","btn compact ghost","Save restore point");
  for(const b of [zip,graph,recovery,savePoint])b.type="button";
  bottom.append(zip,graph,recovery,savePoint);
  const board=el("div","v1-explorer-board");
  board.hidden=true;dialog.append(board);
  zip.addEventListener("click",()=>{
    try{
      commitNow();
      const ws=getWorkspace();
      const data=createZip(workspaceZipEntries(ws,bundleSources,generate,listCustomDefinitions()));
      downloadZip((ws.name||"EasyScript").replace(/[^a-z0-9_-]/gi,"-").slice(0,50)+".zip",data);
      notify(ws.files.length+" script files and editable backup exported as ZIP");
    }catch(e){notify("ZIP export failed: "+e.message);}
  });
  savePoint.addEventListener("click",()=>{
    try{
      commitNow();
      const added=addRecovery(localStorage,getWorkspace(),Date.now(),true);
      notify(added?"Restore point saved locally":"Workspace too large for a restore point");
      if(!board.hidden&&board.dataset.view==="recovery")renderRecovery();
    }catch(e){notify("Restore point failed: "+e.message);}
  });
  function renderGraph(){
    board.dataset.view="graph";board.hidden=false;board.replaceChildren();
    commitNow();
    const report=analyzeWorkspace(getWorkspace());
    board.append(el("h3","","Module connections"),el("p","panel-note",
      report.nodes.length+" files · "+report.links.length+" connections · "+report.issues.length+" issues. This is static analysis; code is not executed."));
    const files=new Map(report.nodes.map(n=>[n.id,n]));
    const list=el("div","v1-graph-list");
    for(const node of report.nodes){
      const row=el("div","v1-graph-item");
      const open=el("button","v1-graph-open",node.name);
      open.type="button";open.addEventListener("click",()=>{switchFile(node.id);dialog.close();});
      row.append(open,el("span","",node.kind));
      const outgoing=report.links.filter(x=>x.from===node.id);
      for(const link of outgoing)row.append(el("span","v1-graph-link","↳ "+(files.get(link.to)?.name||link.to)));
      list.append(row);
    }
    if(!report.links.length)list.append(el("p","panel-note","Add a Require ModuleScript or Import JavaScript block to connect files."));
    board.append(list);
    if(report.issues.length){
      board.append(el("h3","","Issues"));
      for(const issue of report.issues.slice(0,35)){
        const line=el("p","v1-graph-issue",issue.filename+": "+issue.message);
        line.dataset.severity=issue.severity;board.append(line);
      }
    }
  }
  function renderRecovery(){
    board.dataset.view="recovery";board.hidden=false;board.replaceChildren();
    const saved=listRecovery(localStorage);
    board.append(el("h3","","Local recovery points"),el("p","panel-note",
      "Up to eight rolling snapshots are kept on this device. Export workspace ZIP or JSON for a durable backup."));
    if(!saved.length){board.append(el("p","panel-note","No restore points yet. Select Save restore point."));return;}
    for(const item of saved){
      const row=el("div","v1-graph-item");
      row.append(el("span","",new Date(item.at).toLocaleString()+" · "+item.files+" files"));
      const restore=el("button","btn compact ghost","Restore");
      restore.type="button";
      restore.addEventListener("click",()=>{
        if(!confirm("Restore this local snapshot? Current files will be replaced. Export a ZIP first if needed."))return;
        try{
          commitNow();
          const fresh=validateWorkspace(restoreRecovery(localStorage,item.at));
          updateWorkspace(fresh);switchFile(fresh.activeId,true);
          notify("Recovery snapshot restored");
          dialog.close();
        }catch(e){notify("Recovery failed: "+e.message);}
      });
      row.append(restore);board.append(row);
    }
  }
  graph.addEventListener("click",()=>board.dataset.view==="graph"&&!board.hidden?(board.hidden=true):renderGraph());
  recovery.addEventListener("click",()=>board.dataset.view==="recovery"&&!board.hidden?(board.hidden=true):renderRecovery());
}
