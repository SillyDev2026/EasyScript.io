// Conservative static cross-file analysis: no source execution.
import {traverse,generate,lint} from "./engine.js";
const basename=name=>String(name||"").replace(/\.(luau|lua|js)$/i,"");
const identifier=/^[A-Za-z_][A-Za-z0-9_]*$/;
const removeExt=name=>basename(name).toLowerCase();
export function analyzeWorkspace(workspace){
  const files=workspace.files||[],nodes=[],links=[],issues=[];
  const byName=new Map();
  for(const file of files){
    const name=basename(file.name);
    nodes.push({id:file.id,name:file.name,kind:file.kind,language:file.project.language,blocks:file.project.blocks.length});
    const key=name.toLowerCase();
    if(!byName.has(key))byName.set(key,[]);
    byName.get(key).push(file);
    for(const diagnostic of lint(file.project)){
      if(diagnostic.severity==="error")issues.push({fileId:file.id,filename:file.name,severity:"error",message:diagnostic.message});
    }
  }
  for(const file of files){
    traverse(file.project.blocks,block=>{
      if(block.type!=="requireModule"&&block.type!=="jsImportModule")return;
      const target=block.type==="requireModule"?
        String(block.fields.path||"").split(".").pop():String(block.fields.path||"").split("/").pop();
      const matches=byName.get(removeExt(target))||[];
      if(!matches.length){
        issues.push({fileId:file.id,filename:file.name,severity:"warning",message:"Module not in workspace: "+target});
        return;
      }
      if(matches.length>1){
        issues.push({fileId:file.id,filename:file.name,severity:"warning",message:"Ambiguous module: "+target});
        return;
      }
      const to=matches[0];
      if(to.id===file.id){issues.push({fileId:file.id,filename:file.name,severity:"error",message:"File imports itself"});return;}
      if(block.type==="requireModule"&&to.kind!=="ModuleScript"){
        issues.push({fileId:file.id,filename:file.name,severity:"warning",message:to.name+" should be a ModuleScript for require()"});
      }
      if(block.type==="jsImportModule"&&to.project.language!=="javascript"){
        issues.push({fileId:file.id,filename:file.name,severity:"warning",message:"JavaScript import targets Luau file "+to.name});
      }
      links.push({from:file.id,to:to.id,blockId:block.id});
    });
  }
  const adjacency=new Map(files.map(f=>[f.id,[]]));
  for(const link of links)adjacency.get(link.from)?.push(link.to);
  const state=new Map(),seenCycles=new Set();
  function visit(id,stack){
    if(state.get(id)===2)return;
    if(state.get(id)===1){
      const start=stack.indexOf(id),ids=stack.slice(start).concat(id),key=ids.join(">");
      if(!seenCycles.has(key)){
        seenCycles.add(key);
        issues.push({fileId:id,filename:files.find(f=>f.id===id)?.name||"Unknown",
          severity:"error",message:"Circular module dependency: "+ids.map(k=>files.find(f=>f.id===k)?.name||k).join(" → ")});
      }
      return;
    }
    state.set(id,1);
    for(const next of adjacency.get(id)||[])visit(next,stack.concat(id));
    state.set(id,2);
  }
  for(const file of files)visit(file.id,[]);
  return {nodes,links,issues,connectedFiles:new Set(links.flatMap(l=>[l.from,l.to])).size};
}
export function compileWorkspacePreview(workspace){
  const result=analyzeWorkspace(workspace);
  return {files:workspace.files.map(f=>({name:f.name,kind:f.kind,source:generate(f.project)})),issues:result.issues};
}
