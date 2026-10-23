import {inlineExpression,identifierOK} from "./format.js";
// Browser-oriented JavaScript blocks. No pretend Luau equivalents are generated.
const defs={};
const builders={};
const add=(id,name,fields,build,branches=[])=>{
  defs[id]={name,group:"JavaScript · Browser",color:"pink",fields,branches};
  builders[id]=build;
};
const e=(f,k,v="undefined")=>inlineExpression(f[k],v);
const q=(f,k)=>JSON.stringify(String(f[k]??""));
const read=(id,name,fields,expr)=>add(id,name,fields,(f,s)=>[s+"const "+f.name+" = "+expr(f)+";"]);
add("jsGlobalSet","JS set global",{key:"score",value:"0"},(f,s)=>[
  s+"globalThis["+q(f,"key")+"] = "+e(f,"value")+";"
]);
read("jsGlobalGet","JS read global",{name:"Score",key:"score"},f=>"globalThis["+q(f,"key")+"]");
read("jsQuery","DOM query selector",{name:"Element",selector:"#app"},f=>"document.querySelector("+q(f,"selector")+")");
read("jsQueryAll","DOM query all",{name:"Elements",selector:".item"},f=>"document.querySelectorAll("+q(f,"selector")+")");
add("jsSetText","DOM set text",{target:"Element",value:'"Hello world"'},(f,s)=>[s+e(f,"target")+".textContent = "+e(f,"value")+";"]);
add("jsSetValue","DOM input value",{target:"Element",value:'"Hello world"'},(f,s)=>[s+e(f,"target")+".value = "+e(f,"value")+";"]);
add("jsAddClass","DOM add class",{target:"Element",className:"active"},(f,s)=>[s+e(f,"target")+".classList.add("+q(f,"className")+");"]);
add("jsRemoveClass","DOM remove class",{target:"Element",className:"active"},(f,s)=>[s+e(f,"target")+".classList.remove("+q(f,"className")+");"]);
add("jsSetAttribute","DOM set attribute",{target:"Element",attribute:"aria-label",value:'"Button"'},(f,s)=>[
  s+e(f,"target")+".setAttribute("+q(f,"attribute")+", "+e(f,"value")+");"
]);
read("jsJsonParse","Parse JSON",{name:"Data",value:'"{\\"hello\\":true}"'},f=>"JSON.parse("+e(f,"value")+")");
read("jsJsonStringify","Stringify JSON",{name:"Json",value:"{}"},f=>"JSON.stringify("+e(f,"value")+")");
read("jsStorageRead","Read localStorage",{name:"Value",key:"settings"},f=>"localStorage.getItem("+q(f,"key")+")");
add("jsStorageWrite","Write localStorage",{key:"settings",value:'"value"'},(f,s)=>[
  s+"localStorage.setItem("+q(f,"key")+", String("+e(f,"value")+"));"
]);
add("jsStorageRemove","Remove localStorage",{key:"settings"},(f,s)=>[
  s+"localStorage.removeItem("+q(f,"key")+");"
]);
add("jsWarn","Console warning",{value:'"Warning"'},(f,s)=>[s+"console.warn("+e(f,"value")+");"]);
add("jsFetchJson","Fetch JSON (async)",{name:"Data",url:'"/api/data"'},(f,s)=>[
  s+"const "+f.name+" = await (async () => {",
  s+"    const response = await fetch("+e(f,"url")+");",
  s+'    if (!response.ok) throw new Error("HTTP " + response.status);',
  s+"    return response.json();",
  s+"})();"
]);
add("jsClickEvent","DOM click event",{target:"Element"},(f,s,emit,b)=>[
  s+e(f,"target")+".addEventListener(\"click\", async (event) => {",
  ...emit(b.body,Math.round(s.length/4)+1),
  s+"});"
],["body"]);
add("jsSetTimeout","Delay JavaScript task",{milliseconds:"1000"},(f,s,emit,b)=>[
  s+"setTimeout(async () => {",...emit(b.body,Math.round(s.length/4)+1),
  s+"}, "+e(f,"milliseconds")+");"
],["body"]);
export const JS_DEFINITIONS=defs;
export const JS_TYPES=new Set(Object.keys(defs));
export function javascriptCode(block,language,level,emit){
  const builder=builders[block.type];if(!builder)return null;
  const s="    ".repeat(level);
  if(language!=="javascript")return [s+"-- JavaScript-only block: "+defs[block.type].name+" (switch to JavaScript)"];
  return builder(block.fields,s,emit,block);
}
export function javascriptDiagnostics(block,language){
  if(!JS_TYPES.has(block.type))return [];
  const messages=[],issue=(message,severity="error")=>messages.push({id:block.id,message,severity});
  if(language!=="javascript")issue("JavaScript-only block: "+defs[block.type].name,"warning");
  for(const [key,value] of Object.entries(block.fields||{})){
    if(!String(value??"").trim())issue("Missing "+key+" field");
    if(key==="name"&&!identifierOK(value))issue("Invalid JavaScript variable name: "+value);
  }
  if(block.type==="jsFetchJson")issue("Fetch requires network access and a CORS-permitted endpoint.","warning");
  if(["jsQuery","jsQueryAll","jsClickEvent","jsSetText","jsSetValue","jsAddClass","jsRemoveClass","jsSetAttribute"].includes(block.type))
    issue("This block requires a browser DOM; not supported in plain Node.js.","warning");
  return messages;
}
