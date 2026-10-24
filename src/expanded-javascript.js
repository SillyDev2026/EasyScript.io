import {inlineExpression} from "./format.js";
import {validJSName} from "./javascript-v21.js";
const catalog={};
const reg=(id,name,fields,render,branches=[])=>{
 catalog[id]={name,group:"JavaScript · Browser",color:"pink",fields,branches,render};
};
const e=(f,key,alt="undefined")=>inlineExpression(f[key],alt);
const q=(f,key)=>JSON.stringify(String(f[key]??""));
const result=(id,name,fields,fn)=>reg(id,name,fields,(f,s)=>[s+"const "+f.name+" = "+fn(f)+";"]);
const stmt=(id,name,fields,fn)=>reg(id,name,fields,(f,s)=>[s+fn(f)+";"]);
result("jsCreateElement","Create HTML element",{name:"element",tag:"div"},f=>"document.createElement("+q(f,"tag")+")");
stmt("jsAppendChild","Append DOM child",{parent:"document.body",child:"element"},f=>e(f,"parent")+".append("+e(f,"child")+")");
stmt("jsRemoveElement","Remove DOM element",{target:"element"},f=>e(f,"target")+".remove()");
stmt("jsSetStyle","Set CSS style property",{target:"element",property:"backgroundColor",value:'"red"'},f=>e(f,"target")+".style["+q(f,"property")+"] = "+e(f,"value"));
stmt("jsToggleClass","Toggle CSS class",{target:"element",className:"active"},f=>e(f,"target")+".classList.toggle("+q(f,"className")+")");
stmt("jsSetDataset","Set data-* property",{target:"element",property:"id",value:'"123"'},f=>e(f,"target")+".dataset["+q(f,"property")+"] = "+e(f,"value"));
result("jsGetDataset","Read data-* property",{name:"id",target:"element",property:"id"},f=>e(f,"target")+".dataset["+q(f,"property")+"]");
reg("jsListenEvent","Listen for DOM event",{target:"element",eventName:"click"},(f,s,emit,b)=>[
 s+e(f,"target")+".addEventListener("+q(f,"eventName")+", async (event) => {",
 ...emit(b.body,s.length/4+1),s+"});"
],["body"]);
reg("jsSetInterval","Repeat timer callback",{milliseconds:"1000"},(f,s,emit,b)=>[
 s+"setInterval(async () => {",...emit(b.body,s.length/4+1),s+"}, "+e(f,"milliseconds")+");"
],["body"]);
result("jsDateNow","Current timestamp (ms)",{name:"now"},()=>"Date.now()");
result("jsLocationPath","Current URL pathname",{name:"pathname"},()=>"window.location.pathname");
result("jsFetchText","Fetch text (async)",{name:"responseText",url:'"/api/text"'},f=>
 "await (async () => { const response = await fetch("+e(f,"url")+"); if (!response.ok) throw new Error('HTTP '+response.status); return response.text(); })()");
result("jsUrlParse","Parse URL",{name:"url",value:'"https://example.com/"'},f=>"new URL("+e(f,"value")+")");
stmt("jsHistoryReplace","Update browser URL",{path:'"/home"'},f=>"history.replaceState(null, '', "+e(f,"path")+")");
result("jsGetAttribute","DOM get attribute",{name:"attribute",target:"element",attribute:"aria-label"},f=>e(f,"target")+".getAttribute("+q(f,"attribute")+")");
export const EXPANDED_JS_DEFINITIONS=Object.fromEntries(Object.entries(catalog).map(([id,item])=>[id,{
 name:item.name,group:item.group,color:item.color,fields:item.fields,branches:item.branches
}]));
export function expandedJSCode(block,language,level,emit){
 const entry=catalog[block.type];if(!entry)return null;
 const s="    ".repeat(level);
 if(language!=="javascript")return [s+"-- JavaScript-only block: "+entry.name];
 return entry.render(block.fields,s,emit,block);
}
export function expandedJSDiagnostics(block,language){
 const entry=catalog[block.type];if(!entry)return [];
 const issues=[],add=(message,severity="error")=>issues.push({id:block.id,message,severity}),f=block.fields;
 if(language!=="javascript")add("This block requires JavaScript","warning");
 for(const key of Object.keys(entry.fields)){
  const value=String(f[key]??"");
  if(!value.trim())add("Field "+key+" cannot be empty");
  if(/[\r\n]/.test(value))add("Multiline value in "+key);
  if(key==="name"&&!validJSName(value))add("Invalid JavaScript identifier: "+value);
 }
 if(["jsListenEvent","jsSetInterval"].includes(block.type))add("Callbacks should handle async errors and avoid unbounded work.","warning");
 if(block.type==="jsFetchText")add("Requires an available endpoint with suitable CORS policy.","warning");
 return issues;
}
