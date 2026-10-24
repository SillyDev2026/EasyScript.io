// EasyScript 2.1: browser and standard JavaScript blocks.
// Rendering is source-only. No code is evaluated in the editor.
import {inlineExpression} from "./format.js";
const blocks={};
const reserved=new Set(("await break case catch class const continue debugger default delete do else export extends false finally for function if import in instanceof let new null return super switch this throw true try typeof var void while with yield "+
"enum implements interface package private protected public static arguments eval").split(" "));
export const validJSName=name=>/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(String(name))&&!reserved.has(String(name));
const add=(id,name,group,fields,render,branches=[])=>{
 blocks[id]={name,group:"JavaScript · "+group,color:"pink",fields,branches,render};
};
const x=(f,key,fallback="undefined")=>inlineExpression(f[key],fallback);
const q=(f,key)=>JSON.stringify(String(f[key]??""));
const read=(id,name,group,fields,code)=>add(id,name,group,fields,(f,s)=>[s+"const "+f.name+" = "+code(f)+";"]);
const action=(id,name,group,fields,code)=>add(id,name,group,fields,(f,s)=>[s+code(f)+";"]);
const callback=(id,name,group,fields,opening,closing)=>add(id,name,group,fields,(f,s,emit,b)=>[
 s+opening(f),...emit(b.body,s.length/4+1),s+closing(f)
],["body"]);
read("js21Closest","Closest matching ancestor","DOM",{name:"ancestor",target:"element",selector:".card"},
 f=>x(f,"target")+".closest("+q(f,"selector")+")");
read("js21Matches","Element matches CSS selector","DOM",{name:"matches",target:"element",selector:".active"},
 f=>x(f,"target")+".matches("+q(f,"selector")+")");
read("js21Contains","Element contains child","DOM",{name:"contains",target:"element",child:"anotherElement"},
 f=>x(f,"target")+".contains("+x(f,"child")+")");
action("js21ToggleHidden","Set element hidden","DOM",{target:"element",hidden:"true"},
 f=>x(f,"target")+".hidden = "+x(f,"hidden"));
action("js21SetHTML","Set safe plain text","DOM",{target:"element",value:'"Hello"'},
 f=>x(f,"target")+".textContent = String("+x(f,"value")+")");
action("js21Focus","Focus element","DOM",{target:"element"},f=>x(f,"target")+".focus()");
action("js21ScrollIntoView","Scroll element into view","DOM",{target:"element"},
 f=>x(f,"target")+".scrollIntoView({behavior: 'smooth', block: 'nearest'})");
read("js21BoundingRect","Get element bounds","DOM",{name:"bounds",target:"element"},
 f=>x(f,"target")+".getBoundingClientRect()");
read("js21NewFragment","Create DocumentFragment","DOM",{name:"fragment"},
 ()=>"document.createDocumentFragment()");
read("js21NewCustomEvent","Create CustomEvent","Events",{name:"signal",eventName:"item-change",detail:"{id: 1}"},
 f=>"new CustomEvent("+q(f,"eventName")+", {detail: "+x(f,"detail")+"})");
action("js21Dispatch","Dispatch DOM event","Events",{target:"element",event:"signal"},
 f=>x(f,"target")+".dispatchEvent("+x(f,"event")+")");
callback("js21SubmitEvent","Listen for form submit","Events",{target:"form"},
 f=>x(f,"target")+".addEventListener('submit', async (event) => {",()=>"});");
callback("js21KeyDown","Listen for keyboard input","Events",{target:"document"},
 f=>x(f,"target")+".addEventListener('keydown', async (event) => {",()=>"});");
callback("js21ForEach","Array forEach callback","Arrays",{array:"items"},
 f=>x(f,"array")+".forEach((item, index) => {",()=>"});");
read("js21ArrayMap","Array map expression","Arrays",{name:"mapped",array:"items",expression:"item * 2"},
 f=>x(f,"array")+".map((item, index) => "+x(f,"expression")+")");
read("js21ArrayFilter","Array filter expression","Arrays",{name:"filtered",array:"items",condition:"item != null"},
 f=>x(f,"array")+".filter((item, index) => "+x(f,"condition")+")");
read("js21ArrayFind","Array find expression","Arrays",{name:"match",array:"items",condition:"item.id === 1"},
 f=>x(f,"array")+".find((item, index) => "+x(f,"condition")+")");
read("js21ArrayReduce","Array reduce","Arrays",{name:"sum",array:"items",expression:"total + item",initial:"0"},
 f=>x(f,"array")+".reduce((total, item) => "+x(f,"expression")+", "+x(f,"initial")+")");
read("js21NewMap","Create Map","Collections",{name:"itemsMap"},()=>"new Map()");
action("js21MapSet","Map set","Collections",{target:"itemsMap",key:'"score"',value:"10"},
 f=>x(f,"target")+".set("+x(f,"key")+", "+x(f,"value")+")");
read("js21MapGet","Map get","Collections",{name:"score",target:"itemsMap",key:'"score"'},
 f=>x(f,"target")+".get("+x(f,"key")+")");
read("js21NewSet","Create Set","Collections",{name:"unique"},()=>"new Set()");
action("js21SetAdd","Add value to Set","Collections",{target:"unique",value:"1"},
 f=>x(f,"target")+".add("+x(f,"value")+")");
read("js21PromiseAll","Await Promise.all","Async",{name:"results",promises:"[Promise.resolve(1)]"},
 f=>"await Promise.all("+x(f,"promises")+")");
read("js21FetchPost","Fetch JSON POST (async)","Async",{name:"responseData",url:'"/api/save"',body:"{score: 1}"},
 f=>"await (async () => { const response = await fetch("+x(f,"url")+", {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify("+x(f,"body")+ ")}); if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })()");
read("js21AbortController","Create AbortController","Async",{name:"abortController"},
 ()=>"new AbortController()");
action("js21Abort","Abort pending requests","Async",{controller:"abortController"},
 f=>x(f,"controller")+".abort()");
read("js21URLParams","Create URLSearchParams","Web",{name:"params",query:'"?page=2"'},
 f=>"new URLSearchParams("+x(f,"query")+")");
read("js21URLGet","Read URL query parameter","Web",{name:"page",params:"params",key:"page"},
 f=>x(f,"params")+".get("+q(f,"key")+")");
read("js21FormData","Create FormData","Web",{name:"formData",form:"form"},
 f=>"new FormData("+x(f,"form")+")");
read("js21UUID","Crypto randomUUID","Web",{name:"id"},
 ()=>"crypto.randomUUID()");
read("js21PerformanceNow","Performance.now","Timing",{name:"started"},
 ()=>"performance.now()");
read("js21Clamp","Clamp number","Math",{name:"clamped",value:"120",min:"0",max:"100"},
 f=>"Math.min("+x(f,"max")+", Math.max("+x(f,"min")+", "+x(f,"value")+"))");
read("js21IntlNumber","Format number with Intl","Web",{name:"formatted",value:"1234.5",locale:"en-US"},
 f=>"new Intl.NumberFormat("+q(f,"locale")+").format("+x(f,"value")+")");
read("js21IntlDate","Format date with Intl","Web",{name:"dateText",date:"new Date()",locale:"en-US"},
 f=>"new Intl.DateTimeFormat("+q(f,"locale")+").format("+x(f,"date")+")");
callback("js21AnimationFrame","Request animation frame","Timing",{},
 ()=>"requestAnimationFrame(async (timestamp) => {",()=>"});");
callback("js21MutationObserver","Observe DOM mutations","Observers",{target:"element"},
 ()=>"const observer = new MutationObserver(async (records) => {",
 f=>"}); observer.observe("+x(f,"target")+", {childList: true, subtree: true});");
callback("js21IntersectionObserver","Observe element visibility","Observers",{target:"element"},
 ()=>"const intersectionObserver = new IntersectionObserver(async (entries) => {",
 f=>"}); intersectionObserver.observe("+x(f,"target")+");");
export const JS_V21_DEFINITIONS=Object.fromEntries(Object.entries(blocks).map(([id,b])=>[id,{
 name:b.name,group:b.group,color:b.color,fields:b.fields,branches:b.branches
}]));
export function jsV21Code(block,language,level,emit){
 const b=blocks[block.type];if(!b)return null;
 const s="    ".repeat(level);
 if(language!=="javascript")return [s+"-- JavaScript-only block: "+b.name];
 return b.render(block.fields,s,emit,block);
}
const OUTPUTS=new Set(Object.keys(blocks).filter(k=>blocks[k].fields.name));
export function jsV21Diagnostics(block,language){
 const b=blocks[block.type];if(!b)return [];
 const issues=[],warn=(message,severity="warning")=>issues.push({id:block.id,severity,message});
 if(language!=="javascript")warn(b.name+" requires JavaScript");
 for(const [key,val] of Object.entries(block.fields||{})){
  const value=String(val??"");
  if(!value.trim())warn("Missing "+key+" for "+b.name,"error");
  if(/[\r\n\u2028\u2029]/.test(value))warn("Multiline "+key+" field not supported","error");
  if(key==="name"&&!validJSName(value))warn("Invalid or reserved JavaScript variable name: "+value,"error");
 }
 if(["js21FetchPost","js21PromiseAll"].includes(block.type))warn("Asynchronous operations may reject; handle errors and CORS where applicable");
 if(["js21MutationObserver","js21IntersectionObserver"].includes(block.type))warn("Disconnect observers when they are no longer needed");
 if(block.type==="js21SetHTML")warn("TextContent is used intentionally; this block does not interpret HTML markup");
 return issues;
}
