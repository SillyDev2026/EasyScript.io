import {inlineExpression,identifierOK} from "./format.js";
export const PROJECT_DEFINITIONS={
  requireModule:{name:"Require ModuleScript",group:"Project · Files",color:"teal",fields:{name:"Inventory",path:"script.Parent.Inventory"}},
  moduleReturn:{name:"Return ModuleScript value",group:"Project · Files",color:"pink",fields:{value:"Inventory"}},
  jsImportModule:{name:"Import JavaScript module",group:"Project · Files",color:"pink",fields:{name:"Inventory",path:"./Inventory.js"}}
};
export function projectBlockCode(block,language,depth){
  const s="    ".repeat(depth),f=block.fields;
  if(block.type==="requireModule"){
    return language==="luau"?
      [s+"local "+f.name+" = require("+inlineExpression(f.path)+")"]:
      [s+"// Roblox ModuleScript require is Luau-only"];
  }
  if(block.type==="moduleReturn"){
    return language==="luau"?[s+"return "+inlineExpression(f.value)]:[s+"// ModuleScript return is Luau-only"];
  }
  if(block.type==="jsImportModule"){
    return language==="javascript"?
      [s+"const "+f.name+" = await import("+JSON.stringify(String(f.path||""))+");"]:
      [s+"-- JavaScript import is only available in JavaScript"];
  }
  return null;
}
export function projectBlockDiagnostics(block,language,context={}){
  if(!(block.type in PROJECT_DEFINITIONS))return [];
  const issues=[],push=(severity,message)=>issues.push({id:block.id,severity,message});
  if(block.type==="requireModule"){
    if(!identifierOK(block.fields.name))push("error","Invalid module local name");
    if(!/^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+$/.test(String(block.fields.path).trim()))push("error","Use a dotted ModuleScript path such as script.Parent.Inventory");
    if(language!=="luau")push("warning","ModuleScript require works only in Roblox Luau");
  }
  if(block.type==="moduleReturn"){
    if(language!=="luau")push("warning","ModuleScript return works only in Luau");
    if(context.kind&&context.kind!=="ModuleScript")push("warning","Place module return inside a ModuleScript");
  }
  if(block.type==="jsImportModule"){
    if(!identifierOK(block.fields.name))push("error","Invalid JavaScript import variable");
    if(!/^\.{1,2}\/[^"'\\\r\n]+\.js$/.test(block.fields.path))push("error","Use a relative JavaScript module path ending in .js");
    if(language!=="javascript")push("warning","JavaScript import is not Luau");
  }
  return issues;
}
