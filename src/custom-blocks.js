// Safe declarative blocks: no scripts, eval, remote execution, or plugin code from imports.
const KEY="easyscript_custom_blocks_v13";
const definitions=new Map();
const valid=/^[A-Za-z_][A-Za-z0-9_]*$/;
const compileName=name=>"custom_"+name;
export function validateCustomDefinition(item){
 if(!item||typeof item!=="object")throw new Error("Custom block must be an object");
 const id=String(item.id||"").trim();
 if(!valid.test(id)||id.length>40)throw new Error("Use a short identifier for the custom block ID");
 const label=String(item.label||"").trim().slice(0,65);
 if(!label)throw new Error("Block needs a display name");
 const fields=item.fields&&typeof item.fields==="object"&&!Array.isArray(item.fields)?item.fields:{};
 const entries=Object.entries(fields);
 if(entries.length>8)throw new Error("Maximum eight fields per custom block");
 const cleaned={};
 for(const [key,value] of entries){
  if(!valid.test(key)||key.length>32)throw new Error("Invalid field identifier: "+key);
  cleaned[key]=String(value??"").slice(0,250);
 }
 const luau=String(item.luau||"").trim(),javascript=String(item.javascript||"").trim();
 if(!luau&&!javascript)throw new Error("At least one language template is required");
 if(luau.length>5000||javascript.length>5000)throw new Error("Source templates cannot exceed 5 KB");
 return {id,label,fields:cleaned,luau,javascript};
}
export function loadCustomDefinitions(storage,DEFINITIONS){
 let arr=[];
 try{const data=JSON.parse(storage.getItem(KEY)||"[]");if(Array.isArray(data))arr=data.slice(0,30);}catch{}
 let loaded=0;
 for(const def of arr){
  try{
   const parsed=validateCustomDefinition(def);
   registerCustomDefinition(parsed,DEFINITIONS);loaded++;
  }catch{}
 }
 return loaded;
}
export function listCustomDefinitions(){return [...definitions.values()].map(x=>structuredClone(x));}
export function registerCustomDefinition(raw,DEFINITIONS){
 const d=validateCustomDefinition(raw),type=compileName(d.id);
 if(Object.prototype.hasOwnProperty.call(DEFINITIONS,type)&&!definitions.has(type))
  throw new Error("Custom block identifier collides with a built-in block");
 definitions.set(type,d);
 DEFINITIONS[type]={name:d.label,group:"Custom blocks",color:"purple",fields:{...d.fields}};
 return type;
}
export function saveCustomDefinitions(storage){
 storage.setItem(KEY,JSON.stringify([...definitions.values()].slice(0,30)));
}
export function customBlockCode(block,language,level){
 const d=definitions.get(block.type);
 if(!d)return null;
 const template=language==="javascript"?d.javascript:d.luau;
 const indent="    ".repeat(level);
 if(!template)return [indent+(language==="javascript"?"// ":"-- ")+"Custom block not supported in this language"];
 const rendered=template.replace(/\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}/g,(_,key)=>
   Object.prototype.hasOwnProperty.call(block.fields||{},key)?String(block.fields[key]).replace(/[\r\n\u2028\u2029]+/g," "):"nil");
 return rendered.split(/\r?\n/).map(line=>indent+line);
}
export function customBlockDiagnostics(block,language){
 const d=definitions.get(block.type);if(!d)return [];
 const issues=[],template=language==="javascript"?d.javascript:d.luau;
 if(!template)issues.push({id:block.id,severity:"warning",message:"Custom block missing "+language+" source template"});
 if(/\{\{[^}]+\}\}/.test(template)&&/\{\{(?![A-Za-z_][A-Za-z0-9_]*\}\})/.test(template))
  issues.push({id:block.id,severity:"warning",message:"Custom source contains unsupported placeholder syntax"});
 return issues;
}
