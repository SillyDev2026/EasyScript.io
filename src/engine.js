export const VERSION = "0.2.0";
export const DEFINITIONS = {
  print: { name:"Print", group:"Output", color:"blue", fields:{value:'"Hello world!"'} },
  variable: { name:"Create variable", group:"Variables", color:"purple", fields:{name:"Coins",value:"100"} },
  set: { name:"Set variable", group:"Variables", color:"purple", fields:{name:"Coins",value:"Coins + 1"} },
  if: { name:"If / otherwise", group:"Logic", color:"amber", fields:{left:"Coins",operator:">=",right:"100"}, branches:["then","else"] },
  repeat: { name:"Repeat", group:"Logic", color:"amber", fields:{count:"3"}, branches:["body"] },
  wait: { name:"Wait", group:"Flow", color:"teal", fields:{seconds:"1"} },
  comment: { name:"Comment", group:"Flow", color:"slate", fields:{text:"Explain this step"} },
  function: { name:"Define function", group:"Functions", color:"pink", fields:{name:"greet"}, branches:["body"] },
  call: { name:"Call function", group:"Functions", color:"pink", fields:{name:"greet"} }
};
let sequence = 0;
export function newBlock(type) {
  const definition = DEFINITIONS[type];
  if (!definition) throw new Error("Unknown block type: " + type);
  const block = {id:"b_" + Date.now().toString(36) + "_" + (++sequence),type,fields:{...definition.fields}};
  for (const branch of definition.branches || []) block[branch] = [];
  return block;
}
export function projectTemplate(template = "starter") {
  const p = {schema:1,title:"My First Script",language:"luau",blocks:[]};
  if (template === "blank") {p.title = "Untitled Project"; return p;}
  if (template === "counter") {
    p.title = "Coin Counter";
    const a = newBlock("variable");a.fields.value = "0";
    const b = newBlock("repeat");b.fields.count = "5";
    const c = newBlock("set");c.fields.value = "Coins + 10";
    const d = newBlock("print");d.fields.value = "Coins";
    b.body.push(c,d);p.blocks.push(a,b);return p;
  }
  if (template === "functions") {
    p.title = "Function Demo";
    const f = newBlock("function"); const out = newBlock("print");
    out.fields.value = '"Welcome to EasyScript!"';f.body.push(out);
    p.blocks.push(f,newBlock("call"));return p;
  }
  const a=newBlock("variable"),b=newBlock("if"),c=newBlock("print"),d=newBlock("print");
  c.fields.value = '"You can buy this!"';d.fields.value = '"Save more coins!"';
  b.then.push(c);b.else.push(d);p.blocks.push(a,b);return p;
}
export function traverse(blocks, fn) {
  for (const block of blocks) {
    fn(block);
    for (const branch of DEFINITIONS[block.type]?.branches || []) traverse(block[branch] || [],fn);
  }
}
export function findLocation(project,id) {
  function walk(list,parent=null,branch="root") {
    for (let index=0;index<list.length;index++) {
      const block=list[index];
      if(block.id===id)return {list,index,block,parent,branch};
      for(const part of DEFINITIONS[block.type]?.branches || []) {
        const found=walk(block[part],block.id,part);if(found)return found;
      }
    }
    return null;
  }
  return walk(project.blocks);
}
export function addBlock(project,type,parentId=null,branch="root",index=null) {
  const list=parentId ? findLocation(project,parentId)?.block?.[branch] : project.blocks;
  if(!Array.isArray(list))throw new Error("Invalid insertion target");
  const b=newBlock(type);list.splice(index===null?list.length:Math.max(0,Math.min(index,list.length)),0,b);return b;
}
export function sanitizeProject(raw) {
  if(!raw||typeof raw!=="object")throw new Error("Invalid project file");
  let count=0;
  function clean(list,depth=0) {
    if(depth>12||!Array.isArray(list))return [];
    return list.slice(0,200).flatMap(b=>{
      if(!b||!DEFINITIONS[b.type]||++count>500)return [];
      const def=DEFINITIONS[b.type];const fields={};
      for(const field of Object.keys(def.fields))fields[field]=String(b.fields?.[field]??def.fields[field]).slice(0,400);
      const out={id:"import_"+(++sequence),type:b.type,fields};
      for(const branch of def.branches||[])out[branch]=clean(b[branch],depth+1);
      return [out];
    });
  }
  return {schema:1,title:String(raw.title||"Untitled Project").slice(0,80),language:raw.language==="javascript"?"javascript":"luau",blocks:clean(raw.blocks)};
}
const ident=/^[A-Za-z_][A-Za-z0-9_]*$/;
const reserved=new Set("and break do else elseif end false for function if in local nil not or repeat return then true until while await async const let var class import export default new this".split(" "));
function validName(n){return ident.test(n)&&!reserved.has(n);}
const expression=(v,fallback="nil")=>String(v??"").trim()||fallback;
const space=n=>"    ".repeat(n);
function condition(block,js) {
  let {left,operator,right}=block.fields;
  operator=operator==="!="?(js?"!==":"~="):operator==="=="&&js?"===":operator;
  if(!["==","===","!=","!==","~=",">","<",">=","<="].includes(operator))operator="==";
  return expression(left) + " " + operator + " " + expression(right);
}
export function generate(project) {
  const js=project.language==="javascript",lines=[js?"// Generated by EasyScript v0.2.0":"-- Generated by EasyScript v0.2.0",""];
  if(js)lines.push("async function main() {");
  function emit(blocks,level) {
    if(!blocks.length){lines.push(space(level)+(js?"// Add blocks here":"-- Add blocks here"));return;}
    for(const b of blocks) {
      const f=b.fields,s=space(level);
      switch(b.type) {
        case "print":lines.push(s+(js?"console.log("+expression(f.value,"undefined")+");":"print("+expression(f.value)+")"));break;
        case "variable":lines.push(s+(js?"let ":"local ")+f.name+" = "+expression(f.value,js?"undefined":"nil")+(js?";":""));break;
        case "set":lines.push(s+f.name+" = "+expression(f.value,js?"undefined":"nil")+(js?";":""));break;
        case "wait":lines.push(s+(js?"await new Promise(resolve => setTimeout(resolve, Math.max(0, ("+expression(f.seconds,"0")+")) * 1000));":"task.wait("+expression(f.seconds,"0")+")"));break;
        case "comment":lines.push(s+(js?"// ":"-- ")+String(f.text).replace(/[\r\n]/g," "));break;
        case "call":lines.push(s+(js?"await ":"")+f.name+"();");if(!js)lines[lines.length-1]=s+f.name+"()";break;
        case "function":lines.push(s+(js?"async function ":"local function ")+f.name+"()"+(js?" {":""));emit(b.body,level+1);lines.push(s+(js?"}":"end"));break;
        case "repeat":{
          const varName="__index_"+b.id.replace(/\W/g,"");
          lines.push(s+(js?"for (let "+varName+" = 0; "+varName+" < ("+expression(f.count,"0")+"); "+varName+"++) {":"for "+varName+" = 1, "+expression(f.count,"0")+" do"));
          emit(b.body,level+1);lines.push(s+(js?"}":"end"));break;
        }
        case "if":
          lines.push(s+(js?"if ("+condition(b,true)+") {":"if "+condition(b,false)+" then"));
          emit(b.then,level+1);
          if(b.else.length){lines.push(s+(js?"} else {":"else"));emit(b.else,level+1);}
          lines.push(s+(js?"}":"end"));break;
      }
    }
  }
  emit(project.blocks,js?1:0);
  if(js)lines.push("}","","main().catch(console.error);");
  return lines.join("\n")+"\n";
}
export function lint(project){
  const problems=[],functions=new Set(),calls=[],declared=new Set();
  traverse(project.blocks,b=>{
    const f=b.fields;
    const issue=(message,severity="error")=>problems.push({id:b.id,message,severity});
    if(["variable","set","function","call"].includes(b.type)&&!validName(f.name))issue("Invalid identifier: "+f.name);
    if(b.type==="variable")declared.add(f.name);
    if(b.type==="function"){if(functions.has(f.name))issue("Function defined more than once: "+f.name);functions.add(f.name);}
    if(b.type==="call")calls.push(b);
    if(["print","variable","set"].includes(b.type)&&!String(f.value).trim())issue("Value cannot be empty");
    if(b.type==="if"&&(!String(f.left).trim()||!String(f.right).trim()))issue("Condition needs both values");
    if(b.type==="wait"&&!String(f.seconds).trim())issue("Wait duration is empty");
    if(b.type==="repeat"&&!String(f.count).trim())issue("Repeat count is empty");
  });
  for(const c of calls)if(!functions.has(c.fields.name))problems.push({id:c.id,message:"Undefined function: "+c.fields.name,severity:"error"});
  traverse(project.blocks,b=>{if(b.type==="set"&&!declared.has(b.fields.name))problems.push({id:b.id,message:"Variable has no create block: "+b.fields.name,severity:"warning"});});
  return problems;
}
export function simulate(project) {
  const messages=[],values=new Map(),functions=new Map();let steps=0;
  function val(input) {
    const t=String(input).trim();
    if(/^"(?:[^"\\]|\\.)*"$/.test(t))return JSON.parse(t);
    if(/^'(?:[^'\\]|\\.)*'$/.test(t))return t.slice(1,-1);
    if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);
    if(t==="true")return true;if(t==="false")return false;
    if(values.has(t))return values.get(t);
    const simple=t.match(/^([A-Za-z_]\w*)\s*([+\-*\/])\s*(-?\d+(?:\.\d+)?)$/);
    if(simple && values.has(simple[1])) {
      const a=Number(values.get(simple[1])),b=Number(simple[3]);
      return simple[2]==="+"?a+b:simple[2]==="-"?a-b:simple[2]==="*"?a*b:b?a/b:NaN;
    }
    throw new Error("Preview cannot evaluate: "+t);
  }
  traverse(project.blocks,b=>{if(b.type==="function")functions.set(b.fields.name,b.body);});
  function run(blocks,depth=0) {
    if(depth>15)throw new Error("Too many nested function calls");
    for(const b of blocks) {
      if(++steps>2000)throw new Error("Simulation step limit reached");
      const f=b.fields;
      switch(b.type){
        case "variable":case "set":values.set(f.name,val(f.value));break;
        case "print":messages.push(String(val(f.value)));break;
        case "if":{
          const a=val(f.left),c=val(f.right);
          const pass=({">":()=>a>c,"<":()=>a<c,">=":()=>a>=c,"<=":()=>a<=c,"==":()=>a==c,"!=":()=>a!=c})[f.operator]?.()??false;
          run(pass?b.then:b.else,depth+1);break;
        }
        case "repeat":{const n=Math.min(100,Math.max(0,Math.floor(Number(val(f.count)))));for(let i=0;i<n;i++)run(b.body,depth+1);break;}
        case "call":if(!functions.has(f.name))throw new Error("Unknown function: "+f.name);run(functions.get(f.name),depth+1);break;
        case "wait":messages.push("[wait "+String(f.seconds)+"s skipped in preview]");break;
        case "comment":case "function":break;
      }
    }
  }
  try{run(project.blocks);return {messages,variables:Object.fromEntries(values),error:null};}
  catch(error){return {messages,variables:Object.fromEntries(values),error:String(error.message)};}
}
