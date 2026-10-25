import {DEFINITIONS,findLocation,traverse,sanitizeProject,generate,lint} from "./engine.js";
export const SNIPPETS_KEY="easyscript_snippets_v12";
export const BOOKMARK_KEY="easyscript_bookmarks_v12";
const MAX_SNIPPETS=30;
const safeJSON=(data,defaultValue)=>{try{return JSON.parse(data);}catch{return defaultValue;}};
const validName=name=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
export function allBlocks(project){
 const arr=[];traverse(project.blocks||[],b=>arr.push(b));return arr;
}
function collectIds(block,into){
 into.add(block.id);
 for(const branch of DEFINITIONS[block.type]?.branches||[])
  for(const node of block[branch]||[])collectIds(node,into);
}
export function normalizeSelection(project,ids){
 const wanted=new Set(ids||[]),results=[];
 const visit=nodes=>{
  for(const b of nodes){
   if(wanted.has(b.id)){results.push(b.id);continue;}
   for(const branch of DEFINITIONS[b.type]?.branches||[])visit(b[branch]||[]);
  }
 };
 visit(project.blocks);
 return results;
}
export function performBulk(project,ids,operation){
 const chosen=normalizeSelection(project,ids);
 if(!["duplicate","delete","enable","disable"].includes(operation))throw new Error("Unsupported bulk operation");
 if(!chosen.length)return 0;
 if(operation==="delete"){
   const locations=chosen.map(id=>findLocation(project,id)).filter(Boolean).reverse();
   // Re-resolve after each deletion because positions may change.
   for(const id of [...chosen].reverse()){
    const loc=findLocation(project,id);if(loc)loc.list.splice(loc.index,1);
   }
   return chosen.length;
 }
 if(operation==="duplicate"){
  for(const id of [...chosen].reverse()){
   const loc=findLocation(project,id);
   if(!loc)continue;
   const source=JSON.parse(JSON.stringify(loc.block));
   // New IDs for every descendant, so no duplicate HTML keys.
   const remake=b=>{
     b.id="copy_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,11);
     for(const branch of DEFINITIONS[b.type]?.branches||[])for(const child of b[branch]||[])remake(child);
   };
   remake(source);loc.list.splice(loc.index+1,0,source);
  }
  return chosen.length;
 }
 for(const id of chosen){const loc=findLocation(project,id);if(loc)loc.block.disabled=operation==="disable";}
 return chosen.length;
}
export function setBlockNote(project,id,note){
 const loc=findLocation(project,id);if(!loc)throw new Error("Unknown block");
 loc.block.note=String(note??"").slice(0,300);
 return loc.block;
}
export function listBookmarks(storage){
 const value=safeJSON(storage.getItem(BOOKMARK_KEY),[]);
 return Array.isArray(value)?value.filter(x=>x&&typeof x.id==="string"&&typeof x.fileId==="string").slice(0,100):[];
}
export function toggleBookmark(storage,fileId,id){
 const bookmarks=listBookmarks(storage),index=bookmarks.findIndex(x=>x.fileId===fileId&&x.id===id);
 if(index>=0)bookmarks.splice(index,1);
 else bookmarks.unshift({fileId,id});
 storage.setItem(BOOKMARK_KEY,JSON.stringify(bookmarks.slice(0,100)));
 return index<0;
}
export function listSnippets(storage){
 const items=safeJSON(storage.getItem(SNIPPETS_KEY),[]);
 return Array.isArray(items)?items.filter(x=>x&&Array.isArray(x.blocks)).slice(0,MAX_SNIPPETS):[];
}
export function saveSnippet(storage,title,project,ids){
 const chosen=normalizeSelection(project,ids);
 if(!chosen.length)throw new Error("Select one or more blocks first");
 const blocks=chosen.map(id=>findLocation(project,id)?.block).filter(Boolean);
 const entries=listSnippets(storage),name=String(title||"Snippet").trim().slice(0,60)||"Snippet";
 const snippet={name,language:project.language,blocks:JSON.parse(JSON.stringify(blocks)),created:Date.now()};
 entries.unshift(snippet);
 const serialized=JSON.stringify(entries.slice(0,MAX_SNIPPETS));
 if(serialized.length>500000)throw new Error("Snippet library size limit reached");
 storage.setItem(SNIPPETS_KEY,serialized);
 return snippet;
}
export function insertSnippet(project,snippet){
 if(!snippet?.blocks?.length)throw new Error("Empty snippet");
 if(snippet.language!==project.language)throw new Error("Switch to the snippet's scripting language first");
 const copy=sanitizeProject({title:"snippet",language:project.language,blocks:snippet.blocks},{regenerateIds:true});
 if(!copy.blocks.length)throw new Error("No supported blocks in snippet");
 project.blocks.push(...copy.blocks);
 return copy.blocks.length;
}
const reservedFields=new Set(["name","alias","property","key","className","attribute","child","tag","reason","method","target","path"]);
export function renameVariable(project,from,to){
 from=String(from||"").trim();to=String(to||"").trim();
 if(!validName(from)||!validName(to))throw new Error("Use valid variable identifiers");
 if(from===to)return {changed:0,skipped:0};
 let changed=0,skipped=0;
 const replaceWords=(source)=>{
  // Preserve double/single-quoted strings and Luau/JS line comments.
  let quote="",escape=false,out="",i=0;
  for(;i<source.length;){
   const ch=source[i];
   if(quote){
    out+=ch;
    if(escape)escape=false;
    else if(ch==="\\")escape=true;
    else if(ch===quote)quote="";
    i++;continue;
   }
   if(ch==='"'||ch==="'"){quote=ch;out+=ch;i++;continue;}
   if(source.startsWith("--",i)||source.startsWith("//",i)){out+=source.slice(i);break;}
   if(/[A-Za-z_]/.test(ch)){
    let end=i+1;while(end<source.length&&/[A-Za-z0-9_]/.test(source[end]))end++;
    const token=source.slice(i,end);
    if(token===from&&!(i>0&&source[i-1]===".")&&!(i>0&&source[i-1]===":")){out+=to;changed++;}
    else out+=token;
    i=end;continue;
   }
   out+=ch;i++;
  }
  return out;
 };
 traverse(project.blocks,b=>{
  for(const [key,value] of Object.entries(b.fields||{})){
    if(typeof value!=="string")continue;
    if(key==="name"||key==="alias"||key==="key"){
      if(value===from){b.fields[key]=to;changed++;}
      continue;
    }
    if(reservedFields.has(key)){skipped++;continue;}
    b.fields[key]=replaceWords(value);
  }
 });
 return {changed,skipped};
}
export function diagnosticSummary(project){
 const all=lint(project);
 return {errors:all.filter(x=>x.severity==="error"),warnings:all.filter(x=>x.severity==="warning"),
  all};
}
export function projectSourceMinimap(project){
 const source=generate(project);
 return source.split("\n").map((text,index)=>({line:index+1,text:text.trim()}))
  .filter(x=>x.text&&!/^(--|\/\/)/.test(x.text)).slice(0,250);
}
