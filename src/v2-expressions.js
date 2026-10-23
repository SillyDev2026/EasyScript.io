// v2 expression models: validated, persistable nested sockets, with no source execution.
import {newExpression,compileExpression,validateExpression,expressionSlots} from "./expressions.js";
const MAX_FIELDS=30,MAX_NODES=127;
export function checkSocketTree(input,language="luau"){
 let nodes=0;
 function walk(n,depth=0){
  if(++nodes>MAX_NODES||depth>7)throw new Error("Expression graph exceeds maximum size or depth");
  if(!n||typeof n!=="object"||Array.isArray(n))throw new Error("Expected expression socket node");
  const result={kind:String(n.kind||"")};
  if(expressionSlots(result.kind).length){
   for(const key of expressionSlots(result.kind))result[key]=walk(n[key],depth+1);
  }else{
   if(!["raw","number","string","boolean","variable"].includes(result.kind))
     throw new Error("Unknown expression socket: "+result.kind);
   result.value=result.kind==="boolean"?n.value:String(n.value??"").slice(0,400);
  }
  return result;
 }
 const node=walk(input),issues=validateExpression(node,language);
 if(issues.length)throw new Error(issues.join("; "));
 return node;
}
export function storeSocket(block,key,sourceNode,language="luau"){
 if(!block?.fields||!Object.prototype.hasOwnProperty.call(block.fields,key))
   throw new Error("Block has no field named "+key);
 const tree=checkSocketTree(sourceNode,language),generated=compileExpression(tree,language);
 block.expressions={...(block.expressions||{}),[key]:tree};
 block.fields[key]=generated;
 return generated;
}
export function clearSocket(block,key){
 if(!block?.expressions||!Object.prototype.hasOwnProperty.call(block.expressions,key))return false;
 delete block.expressions[key];
 if(!Object.keys(block.expressions).length)delete block.expressions;
 return true;
}
export function validateSocketFields(block,language){
 const diagnostics=[];
 for(const [key,tree] of Object.entries(block.expressions||{})){
  if(!Object.prototype.hasOwnProperty.call(block.fields||{},key)){
   diagnostics.push({id:block.id,severity:"error",message:"Unknown expression socket field "+key});
   continue;
  }
  try{checkSocketTree(tree,language);}
  catch(e){diagnostics.push({id:block.id,severity:"error",message:"Expression "+key+": "+e.message});}
 }
 return diagnostics;
}
export function materializeSocketProject(project){
 let found=false;
 const walk=nodes=>nodes.map(b=>{
  let changed=false,next=b;
  for(const [key,tree] of Object.entries(b.expressions||{})){
   try{
    const generated=compileExpression(checkSocketTree(tree,project.language),project.language);
    if(!changed){next={...b,fields:{...b.fields}};changed=true;found=true;}
    next.fields[key]=generated;
   }catch{/* lint surfaces stale/invalid socket; preserve raw fallback */}
  }
  for(const branch of ["body","then","else"]){
   if(Array.isArray(b[branch])){
    const mapped=walk(b[branch]);
    if(mapped.some((c,i)=>c!==b[branch][i])){
     if(next===b)next={...b};
     next[branch]=mapped;found=true;
    }
   }
  }
  return next;
 });
 const blocks=walk(project.blocks||[]);
 return found?{...project,blocks}:project;
}
export function importSocketFields(block,raw,language){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return;
 let i=0;
 for(const [key,tree] of Object.entries(raw)){
  if(++i>MAX_FIELDS)break;
  if(!Object.prototype.hasOwnProperty.call(block.fields||{},key))continue;
  try{storeSocket(block,key,tree,language);}catch{/* unsafe/stale tree discarded; raw field retained */}
 }
}
export function socketTreeSummary(tree){
 let nodes=0;
 function count(node){
  nodes++;
  for(const slot of expressionSlots(node.kind))count(node[slot]);
 }
 count(tree);
 return {nodes,kind:tree.kind};
}
