import {DEFINITIONS,sanitizeProject,findLocation} from "./engine.js";

export const BLOCK_CLIPBOARD_KEY="easyscript_block_clipboard_v5";
export function copyBlockTree(storage,block){
  if(!block||!DEFINITIONS[block.type])throw new Error("Invalid block");
  const serialized=JSON.stringify(block);
  if(serialized.length>120_000)throw new Error("Block is too large to copy");
  // Sanitization removes unknown nodes and regenerates IDs when pasted.
  storage.setItem(BLOCK_CLIPBOARD_KEY,serialized);
  return true;
}
export function clipboardAvailable(storage){
  try{return Boolean(storage.getItem(BLOCK_CLIPBOARD_KEY));}
  catch{return false;}
}
export function pasteBlockTree(storage,project,afterId=null){
  const serialized=storage.getItem(BLOCK_CLIPBOARD_KEY);
  if(!serialized)throw new Error("Copy a block first");
  if(serialized.length>120_000)throw new Error("Clipboard block exceeds size limit");
  const sanitized=sanitizeProject({
    language:project.language,
    title:project.title,
    blocks:[JSON.parse(serialized)]
  },{regenerateIds:true});
  const block=sanitized.blocks[0];
  if(!block)throw new Error("No supported block was copied");
  if(afterId){
    const location=findLocation(project,afterId);
    if(!location)throw new Error("Destination block not found");
    location.list.splice(location.index+1,0,block);
  }else project.blocks.push(block);
  return block;
}
export function countBlockTree(block){
  let total=0;
  function walk(item){
    total++;
    for(const branch of DEFINITIONS[item.type]?.branches||[])
      for(const nested of item[branch]||[])walk(nested);
  }
  walk(block);return total;
}
