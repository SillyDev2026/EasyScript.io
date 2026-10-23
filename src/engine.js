import {EXTRA_DEFINITIONS,extensionCode,extensionDiagnostics,extraTemplate} from "./extended.js";
import {ROBLOX_DEFINITIONS,robloxCode,robloxDiagnostics} from "./roblox-blocks.js";
import {JS_DEFINITIONS,javascriptCode,javascriptDiagnostics} from "./javascript-blocks.js";
import {inlineExpression,expressionWarnings} from "./format.js";
import {packTemplate} from "./packs.js";
import {PROJECT_DEFINITIONS,projectBlockCode,projectBlockDiagnostics} from "./project-blocks.js";
import {EXPANDED_LUAU_DEFINITIONS,expandedLuauCode,expandedLuauDiagnostics} from "./expanded-luau.js";
export const VERSION = "1.2.0";
export const DEFINITIONS = {
  print: { name:"Print", group:"Output", color:"blue", fields:{value:'"Hello world!"'} },
  variable: { name:"Create variable", group:"Variables", color:"purple", fields:{name:"Coins",value:"100",type:""} },
  set: { name:"Set variable", group:"Variables", color:"purple", fields:{name:"Coins",value:"Coins + 1"} },
  if: { name:"If / otherwise", group:"Logic", color:"amber", fields:{left:"Coins",operator:">=",right:"100"}, branches:["then","else"] },
  repeat: { name:"Repeat", group:"Logic", color:"amber", fields:{count:"3"}, branches:["body"] },
  wait: { name:"Wait", group:"Flow", color:"teal", fields:{seconds:"1"} },
  comment: { name:"Comment", group:"Flow", color:"slate", fields:{text:"Explain this step"} },
  function: { name:"Define function", group:"Functions", color:"pink", fields:{name:"greet",params:"",returnType:""}, branches:["body"] },
  call: { name:"Call function", group:"Functions", color:"pink", fields:{name:"greet",args:""} },
  increment: { name:"Change number", group:"Variables", color:"purple", fields:{name:"Coins",amount:"1"} },
  while: { name:"While condition", group:"Logic", color:"amber", fields:{left:"Coins",operator:"<",right:"10"}, branches:["body"] },
  service: { name:"Get Roblox service", group:"Roblox · Services", color:"teal", fields:{alias:"Players",service:"Players"} },
  playerJoined: { name:"Player joined", group:"Roblox · Events", color:"blue", fields:{}, branches:["body"] },
  partTouched: { name:"Part touched", group:"Roblox · Events", color:"blue", fields:{path:"workspace.Door"}, branches:["body"] },
  remoteReceived: { name:"Remote received (server)", group:"Roblox · Events", color:"blue", fields:{path:"game.ReplicatedStorage.MyEvent"}, branches:["body"] },
  leaderstat: { name:"Create leaderstat", group:"Roblox · Players", color:"purple", fields:{name:"Coins",initial:"0"} },
  setProperty: { name:"Set instance property", group:"Roblox · Objects", color:"teal", fields:{target:"workspace.Door",property:"Transparency",value:"0.5"} },
  createPart: { name:"Create anchored part", group:"Roblox · Objects", color:"teal", fields:{name:"MyPart",parent:"workspace"} },
  ...EXTRA_DEFINITIONS,
  ...ROBLOX_DEFINITIONS,
  ...JS_DEFINITIONS,
  ...PROJECT_DEFINITIONS,
  ...EXPANDED_LUAU_DEFINITIONS
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
  const extra=extraTemplate(template,newBlock);if(extra)return extra;
  const packed=packTemplate(template,newBlock);if(packed)return packed;
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
  if(template==="leaderstats"){
    p.title="Roblox Leaderstats";p.language="luau";
    const event=newBlock("playerJoined"),stat=newBlock("leaderstat");
    event.body.push(stat);p.blocks.push(event);return p;
  }
  if(template==="touch"){
    p.title="Roblox Touch Detector";p.language="luau";
    const event=newBlock("partTouched"),msg=newBlock("print");
    msg.fields.value='"Something touched the door!"';event.body.push(msg);p.blocks.push(event);return p;
  }
  if(template==="remote"){
    p.title="Roblox Remote Validation";p.language="luau";
    const event=newBlock("remoteReceived"),msg=newBlock("comment");
    msg.fields.text="SECURITY: Validate all data received from clients before using it";
    event.body.push(msg);p.blocks.push(event);return p;
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
const expression=inlineExpression;
const space=n=>"    ".repeat(n);
function condition(block,js) {
  let {left,operator,right}=block.fields;
  operator=operator==="!="?(js?"!==":"~="):operator==="=="&&js?"===":operator;
  if(!["==","===","!=","!==","~=",">","<",">=","<="].includes(operator))operator="==";
  return expression(left) + " " + operator + " " + expression(right);
}
export function generate(project) {
  const js=project.language==="javascript",lines=[js?"// Generated by EasyScript v1.2.0":"-- Generated by EasyScript v1.0.1",""];
  const stores=new Map(),scriptLocals=new Map(),initialGlobalWrites=new Set();
  let needsPlayers=false;
  const safeSymbol=(v,fallback="value")=>{
    let clean=String(v||"").replace(/[^A-Za-z0-9_]/g,"").replace(/^[^A-Za-z_]+/,"");
    if(!clean)clean=fallback;
    return /^[A-Z0-9_]+$/.test(clean)?clean.toLowerCase():clean.charAt(0).toLowerCase()+clean.slice(1);
  };
  const preambleUsed=new Set(["Players","DataStoreService"]);
  // Generated service aliases must not shadow names declared by user blocks.
  traverse(project.blocks,b=>{
    if(["variable","array","function","requireModule","globalRead","datastoreGet"].includes(b.type)&&b.fields?.name)
      preambleUsed.add(String(b.fields.name));
    if(b.type.startsWith("global")&&b.fields?.key)preambleUsed.add(String(b.fields.key));
    if(b.type==="service"&&b.fields?.alias)preambleUsed.add(String(b.fields.alias));
  });
  const uniqueGlobal=(base,used)=>{
    let name=base,n=2;while(used.has(name))name=base+(n++);
    used.add(name);return name;
  };
  traverse(project.blocks,b=>{
    if(["playerJoined","playerLeaving","leaderstat"].includes(b.type))needsPlayers=true;
    if(["datastoreGet","datastoreSet"].includes(b.type)){
      const name=String(b.fields.storeName||"PlayerDataV1");
      if(!stores.has(name)){
        const base=safeSymbol(name.replace(/V\d+$/i,""),"playerData")+"Store";
        stores.set(name,uniqueGlobal(base,preambleUsed));
      }
    }
    if(b.type.startsWith("global")&&["globalWrite","globalRead","globalIncrease","globalDelete"].includes(b.type)){
      const name=String(b.fields.key||"Coins");
      if(!scriptLocals.has(name))scriptLocals.set(name,null);
    }
  });
  const firstGlobalUse=new Set();
  for(const b of project.blocks){
    const key=String(b.fields?.key||"");
    if(!scriptLocals.has(key)||firstGlobalUse.has(key))continue;
    firstGlobalUse.add(key);
    if(b.type==="globalWrite"){
      scriptLocals.set(key,expression(b.fields.value,"nil"));
      initialGlobalWrites.add(b.id);
    }
  }
  if(!js){
    if(needsPlayers)lines.push('local Players = game:GetService("Players")');
    if(stores.size)lines.push('local DataStoreService = game:GetService("DataStoreService")');
    for(const [name,alias] of stores)lines.push("local "+alias+" = DataStoreService:GetDataStore("+JSON.stringify(name)+")");
    for(const [name,value] of scriptLocals)lines.push("local "+name+" = "+(value??"nil"));
    if(lines.length>2)lines.push("");
  }
  const luaOnly=new Set(["service","playerJoined","partTouched","remoteReceived","leaderstat","setProperty","createPart"]);
  const pathValid=value=>/^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(String(value).trim());
  const quote=value=>JSON.stringify(String(value));

  if(js)lines.push("async function main() {");
  function emit(blocks,level,scope={loop:false,func:false,used:new Set(),leaderstatsName:null}) {
    for(const alias of stores.values())scope.used.add(alias);
    if(needsPlayers)scope.used.add("Players");
    if(stores.size)scope.used.add("DataStoreService");
    for(const b of blocks){
      if(["variable","array","function","datastoreGet","globalRead","requireModule"].includes(b.type)
        &&typeof b.fields?.name==="string")scope.used.add(b.fields.name);
      if(b.type==="service"&&typeof b.fields?.alias==="string")scope.used.add(b.fields.alias);
    }
    const reserve=base=>{
      let key=base,n=2;
      while(scope.used.has(key)){key=base+(n++);}
      scope.used.add(key);return key;
    };
    if(!blocks.length){lines.push(space(level)+(js?"// Add blocks here":"-- Add blocks here"));return;}
    for(let index=0;index<blocks.length;index++) {
      const b=blocks[index],f=b.fields,s=space(level);
      if(!js&&b.type==="moduleReturn"&&(level!==0||index!==blocks.length-1)){
        lines.push(s+"-- ModuleScript return must be the final top-level block.");
        continue;
      }
      if(["breakLoop","returnValue"].includes(b.type)){
        const allowed=b.type==="breakLoop"?scope.loop:scope.func;
        if(!allowed||index!==blocks.length-1){
          lines.push(s+(js?"// ":"-- ")+b.type+" must be last within a "+(b.type==="breakLoop"?"loop":"function")+" body.");
          continue;
        }
      }
      const isLoop=["repeat","while","each","forRange"].includes(b.type);
      const isBranch=b.type==="if";
      const childScope=isBranch?scope:isLoop?{loop:true,func:scope.func,used:new Set(),leaderstatsName:null}:{loop:false,func:true,used:new Set(),leaderstatsName:null};
      const emitChild=(nodes,indent)=>{
        const start=lines.length;emit(nodes,indent,childScope);return lines.splice(start);
      };
      if(js&&luaOnly.has(b.type)){lines.push(s+"// Roblox-only: "+DEFINITIONS[b.type].name+" (switch to Luau)");continue;}
      const extra=extensionCode(b,js,level,emitChild);
      if(extra){lines.push(...extra);continue;}
      const roblox=robloxCode(b,project.language,level,emitChild,{
        stores,initialGlobalWrites,reserve,scope
      });
      if(roblox){lines.push(...roblox);continue;}
      const javascript=javascriptCode(b,project.language,level,emitChild);
      if(javascript){lines.push(...javascript);continue;}
      const projectCode=projectBlockCode(b,project.language,level);
      if(projectCode){lines.push(...projectCode);continue;}
      const expanded=expandedLuauCode(b,project.language,level,emitChild);
      if(expanded){lines.push(...expanded);continue;}
      switch(b.type) {
        case "print":lines.push(s+(js?"console.log("+expression(f.value,"undefined")+");":"print("+expression(f.value)+")"));break;
        case "variable":lines.push(s+(js?"let ":"local ")+f.name+(!js&&f.type?.trim()?": "+f.type.trim():"")+" = "+expression(f.value,js?"undefined":"nil")+(js?";":""));break;
        case "set":lines.push(s+f.name+" = "+expression(f.value,js?"undefined":"nil")+(js?";":""));break;
        case "increment":lines.push(s+f.name+" += "+expression(f.amount,"1")+(js?";":""));break;
        case "service":
          if((needsPlayers&&f.service==="Players"&&f.alias==="Players")||
            (stores.size&&f.service==="DataStoreService"&&f.alias==="DataStoreService"))break;
          lines.push(s+"local "+f.alias+" = game:GetService("+quote(f.service)+")");break;
        case "playerJoined":
          lines.push(s+'Players.PlayerAdded:Connect(function(player)');
          emit(b.body,level+1,childScope);lines.push(s+"end)");break;
        case "partTouched":
          lines.push(s+expression(f.path,"workspace.Door")+".Touched:Connect(function(hit)");
          emit(b.body,level+1,childScope);lines.push(s+"end)");break;
        case "remoteReceived":
          lines.push(s+expression(f.path,"game.ReplicatedStorage.MyEvent")+".OnServerEvent:Connect(function(player, data)");
          lines.push(space(level+1)+"-- SECURITY: validate player permissions and all client data");
          emit(b.body,level+1,childScope);lines.push(s+"end)");break;
        case "leaderstat": {
          let stats=scope.leaderstatsName;
          if(!stats){
            stats=reserve("leaderstats");
            scope.leaderstatsName=stats;
            lines.push(s+"local "+stats+' = Instance.new("Folder")');
            lines.push(s+stats+'.Name = "leaderstats"');
            lines.push(s+stats+".Parent = player");
            lines.push("");
          }
          const stat=reserve(safeSymbol(f.name,"stat"));
          lines.push(s+"local "+stat+' = Instance.new("IntValue")');
          lines.push(s+stat+".Name = "+quote(f.name));
          lines.push(s+stat+".Value = "+expression(f.initial,"0"));
          lines.push(s+stat+".Parent = "+stats);break;
        }
        case "setProperty":lines.push(s+expression(f.target,"workspace")+
          "."+f.property+" = "+expression(f.value,"nil"));break;
        case "createPart": {
          const name=reserve(safeSymbol(f.name,"part"));
          lines.push(s+"local "+name+' = Instance.new("Part")');
          lines.push(s+name+".Name = "+quote(f.name));
          lines.push(s+name+".Anchored = true");
          lines.push(s+name+".Parent = "+expression(f.parent,"workspace"));break;
        }
        case "wait":lines.push(s+(js?"await new Promise(resolve => setTimeout(resolve, Math.max(0, ("+expression(f.seconds,"0")+")) * 1000));":"task.wait("+expression(f.seconds,"0")+")"));break;
        case "comment":lines.push(s+(js?"// ":"-- ")+String(f.text).replace(/[\r\n]/g," "));break;
        case "call":lines.push(s+(js?"await ":"")+f.name+"("+expression(f.args,"")+")"+(js?";":""));break;
        case "function":lines.push(s+(js?"async function ":"local function ")+f.name+"("+expression(f.params,"")+")"+(!js&&f.returnType?.trim()?": "+f.returnType.trim():"")+(js?" {":""));emit(b.body,level+1,childScope);lines.push(s+(js?"}":"end"));break;
        case "repeat":{
          const varName=reserve("index");
          lines.push(s+(js?"for (let "+varName+" = 0; "+varName+" < ("+expression(f.count,"0")+"); "+varName+"++) {":"for "+varName+" = 1, "+expression(f.count,"0")+" do"));
          emit(b.body,level+1,childScope);lines.push(s+(js?"}":"end"));break;
        }
        case "while":
          lines.push(s+(js?"while ("+condition(b,true)+") {":"while "+condition(b,false)+" do"));
          emit(b.body,level+1,childScope);lines.push(s+(js?"}":"end"));break;
        case "if":
          lines.push(s+(js?"if ("+condition(b,true)+") {":"if "+condition(b,false)+" then"));
          emit(b.then,level+1,childScope);
          if(b.else.length){lines.push(s+(js?"} else {":"else"));emit(b.else,level+1,childScope);}
          lines.push(s+(js?"}":"end"));break;
        default:
          lines.push(s+(js?"// ":"-- ")+"Unsupported block: "+b.type);break;
      }
    }
  }
  emit(project.blocks,js?1:0);
  if(js)lines.push("}","","main().catch(console.error);");
  return lines.map(line=>line.replace(/[\r\n\u2028\u2029]+\s*/g," ")).join("\n")+"\n";
}
export function lint(project){
  const problems=[],functions=new Set(),calls=[],declared=new Set();
  const luaOnly=new Set(["service","playerJoined","partTouched","remoteReceived","leaderstat","setProperty","createPart"]);
  const pathValid=value=>/^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(String(value).trim());
  const validPathError=(b,value,label)=>{
    if(!pathValid(value))problems.push({id:b.id,message:"Invalid "+label+" path (use dotted identifiers): "+value,severity:"error"});
  };
  function checkScope(list,insidePlayer=false){
    for(const b of list){
      if(b.type==="leaderstat"&&!insidePlayer)problems.push({id:b.id,message:"Leaderstat must be inside a Player joined event (uses player).",severity:"error"});
      for(const branch of DEFINITIONS[b.type]?.branches||[]){
        checkScope(b[branch]||[],insidePlayer||b.type==="playerJoined");
      }
    }
  }
  checkScope(project.blocks);
  function checkExtended(list,context={inLoop:false,inFunction:false,hasPlayer:false,depth:0}){
    for(let index=0;index<list.length;index++){
      const b=list[index];
      if(b.type==="moduleReturn"&&project.language==="luau"&&(index!==list.length-1||context.depth>0)){
        problems.push({id:b.id,severity:"error",message:"ModuleScript return must be the final top-level block."});
      }
      if(["returnValue","breakLoop"].includes(b.type)&&index!==list.length-1){
        problems.push({id:b.id,message:(b.type==="breakLoop"?"Break":"Return")+" must be the last statement in its block body.",severity:"error"});
      }
      problems.push(...expressionWarnings(b));
      problems.push(...extensionDiagnostics(b,project.language,context));
      problems.push(...robloxDiagnostics(b,project.language,context));
      problems.push(...javascriptDiagnostics(b,project.language,context));
      problems.push(...projectBlockDiagnostics(b,project.language,context));
      problems.push(...expandedLuauDiagnostics(b,project.language));
      for(const key of DEFINITIONS[b.type]?.branches||[]){
        checkExtended(b[key]||[],{
          inLoop:b.type==="function"?false:context.inLoop||["while","repeat","each","forRange"].includes(b.type),
          inFunction:context.inFunction||["function","playerJoined","playerLeaving","characterAdded","partTouched","remoteReceived","spawnTask"].includes(b.type),
          hasPlayer:context.hasPlayer||["playerJoined","playerLeaving"].includes(b.type),
          depth:context.depth+1
        });
      }
    }
  }
  checkExtended(project.blocks);
  let needsPlayersAlias=false,needsStoreAlias=false;
  traverse(project.blocks,b=>{
    if(["playerJoined","playerLeaving","leaderstat"].includes(b.type))needsPlayersAlias=true;
    if(["datastoreGet","datastoreSet"].includes(b.type))needsStoreAlias=true;
  });
  traverse(project.blocks,b=>{
    const f=b.fields;
    if(b.type.startsWith("global")&&["globalWrite","globalRead","globalIncrease","globalDelete"].includes(b.type)){
      if((needsPlayersAlias&&f.key==="Players")||(needsStoreAlias&&f.key==="DataStoreService")){
        problems.push({id:b.id,severity:"error",message:"Script local "+f.key+" conflicts with an automatically generated Roblox service variable. Rename it."});
      }
    }
    const issue=(message,severity="error")=>problems.push({id:b.id,message,severity});
    if(["variable","set","increment","function","call"].includes(b.type)&&!validName(f.name))issue("Invalid identifier: "+f.name);
    if(b.type==="variable"&&f.type?.trim()&&(!/^[A-Za-z_][\w.]*\??$/.test(f.type.trim())||project.language!=="luau"))
      issue("Variable type annotations require a Luau identifier such as number, string or Player.");
    if(b.type==="function"){
      const args=String(f.params||"").trim();
      if(args){
        const parameters=args.split(",").map(x=>x.trim()),names=new Set();
        for(const parameter of parameters){
          const match=/^([A-Za-z_]\w*)(?:\s*:\s*[A-Za-z_][\w.]*\??)?$/.exec(parameter);
          if(!match||names.has(match[1])){issue("Invalid or duplicate function parameter: "+parameter);break;}
          if(project.language==="javascript"&&parameter.includes(":"))issue("Luau parameter types cannot be used in JavaScript.");
          names.add(match[1]);
        }
      }
      if(f.returnType?.trim()&&(project.language!=="luau"||!/^[A-Za-z_]\w*\??$/.test(f.returnType.trim())))
        issue("Function return type needs a valid Luau type name.");
    }
    if(b.type==="service"&&!validName(f.alias))issue("Invalid service alias: "+f.alias);
    if(b.type==="service"&&!/^[A-Za-z][A-Za-z0-9]+$/.test(f.service))issue("Invalid Roblox service name");
    if(b.type==="setProperty"&&!validName(f.property))issue("Invalid property name: "+f.property);
    if(b.type==="partTouched")validPathError(b,f.path,"part");
    if(b.type==="remoteReceived")validPathError(b,f.path,"remote");
    if(b.type==="setProperty")validPathError(b,f.target,"target");
    if(b.type==="createPart")validPathError(b,f.parent,"parent");
    if(["leaderstat","createPart"].includes(b.type)&&!String(f.name).trim())issue("Name cannot be empty");
    if(luaOnly.has(b.type)&&project.language==="javascript")issue("Roblox block is Luau-only: "+DEFINITIONS[b.type].name,"warning");
    if(b.type==="remoteReceived")issue("Always validate RemoteEvent inputs and permissions server-side.","warning");
    if(b.type==="variable")declared.add(f.name);
    if(b.type==="function"){if(functions.has(f.name))issue("Function defined more than once: "+f.name);functions.add(f.name);}
    if(b.type==="call")calls.push(b);
    if(["print","variable","set"].includes(b.type)&&!String(f.value).trim())issue("Value cannot be empty");
    if(b.type==="if"&&(!String(f.left).trim()||!String(f.right).trim()))issue("Condition needs both values");
    if(b.type==="wait"&&!String(f.seconds).trim())issue("Wait duration is empty");
    if(b.type==="repeat"&&!String(f.count).trim())issue("Repeat count is empty");
    if(b.type==="increment"&&!String(f.amount).trim())issue("Increment amount cannot be empty");
    if(b.type==="while"&&(!String(f.left).trim()||!String(f.right).trim()))issue("While condition needs both values");
    if(b.type==="leaderstat"&&!String(f.initial).trim())issue("Leaderstat initial value cannot be empty");
    if(b.type==="setProperty"&&!String(f.value).trim())issue("Property value cannot be empty");
  });
  for(const c of calls)if(!functions.has(c.fields.name))problems.push({id:c.id,message:"Undefined function: "+c.fields.name,severity:"error"});
  traverse(project.blocks,b=>{if(["set","increment"].includes(b.type)&&!declared.has(b.fields.name))problems.push({id:b.id,message:"Variable has no create block: "+b.fields.name,severity:"warning"});});
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
        case "increment":values.set(f.name,Number(values.get(f.name)||0)+Number(val(f.amount)));break;
        case "while":{
          let iterations=0;
          while(true){
            if(++iterations>100)throw new Error("While loop stopped after 100 iterations");
            const a=val(f.left),c=val(f.right);
            const pass=({">":()=>a>c,"<":()=>a<c,">=":()=>a>=c,"<=":()=>a<=c,"==":()=>a==c,"!=":()=>a!=c})[f.operator]?.()??false;
            if(!pass)break;
            run(b.body,depth+1);
          }
          break;
        }
        case "service":case "playerJoined":case "partTouched":case "remoteReceived":case "leaderstat":case "setProperty":case "createPart":
          throw new Error("Roblox blocks need Roblox Studio. Simulation cannot run "+DEFINITIONS[b.type].name+".");
        case "print":messages.push(String(val(f.value)));break;
        case "if":{
          const a=val(f.left),c=val(f.right);
          const pass=({">":()=>a>c,"<":()=>a<c,">=":()=>a>=c,"<=":()=>a<=c,"==":()=>a==c,"!=":()=>a!=c})[f.operator]?.()??false;
          run(pass?b.then:b.else,depth+1);break;
        }
        case "repeat":{const n=Math.min(100,Math.max(0,Math.floor(Number(val(f.count)))));for(let i=0;i<n;i++)run(b.body,depth+1);break;}
        case "call":if(!functions.has(f.name))throw new Error("Unknown function: "+f.name);run(functions.get(f.name),depth+1);break;
        case "wait":messages.push("[wait "+String(f.seconds)+"s skipped in preview]");break;
        case "array":values.set(f.name,[]);break;
        case "append":{
          const list=values.get(f.name);
          if(!Array.isArray(list))throw new Error("List is not initialized: "+f.name);
          list.push(val(f.value));break;
        }
        case "removeAt":{
          const list=values.get(f.name);
          if(!Array.isArray(list))throw new Error("List is not initialized: "+f.name);
          const index=Number(val(f.index));
          if(Number.isInteger(index)&&index>=1&&index<=list.length)list.splice(index-1,1);
          break;
        }
        case "listSize":{
          const list=values.get(f.list);
          if(!Array.isArray(list))throw new Error("List is not initialized: "+f.list);
          values.set(f.name,list.length);break;
        }
        case "concat":values.set(f.name,String(val(f.left))+String(val(f.right)));break;
        case "length":values.set(f.name,String(val(f.value)).length);break;
        case "clamp":values.set(f.name,Math.min(Number(val(f.max)),Math.max(Number(val(f.min)),Number(val(f.value)))));break;
        case "random":{
          const min=Number(val(f.min)),max=Number(val(f.max));
          if(!Number.isInteger(min)||!Number.isInteger(max)||max<min)throw new Error("Random bounds must be integers, with min <= max");
          values.set(f.name,Math.floor(Math.random()*(max-min+1))+min);break;
        }
        case "forRange":{
          const start=Number(val(f.start)),end=Number(val(f.end)),step=Number(val(f.step));
          if(!Number.isFinite(start)||!Number.isFinite(end)||!Number.isFinite(step)||step===0)throw new Error("Invalid range");
          const existing=values.has(f.index),saved=values.get(f.index);
          let iterations=0;
          try{
            for(let i=start;step>0?i<=end:i>=end;i+=step){
              if(++iterations>100)throw new Error("For range limited to 100 iterations");
              values.set(f.index,i);run(b.body,depth+1);
            }
          }finally{if(existing)values.set(f.index,saved);else values.delete(f.index);}
          break;
        }
        case "each":{
          const list=values.get(f.list);
          if(!Array.isArray(list))throw new Error("List is not initialized: "+f.list);
          const old=values.has(f.item),previous=values.get(f.item);
          try{
            for(const item of list.slice(0,100)){
              values.set(f.item,item);run(b.body,depth+1);
            }
          }finally{if(old)values.set(f.item,previous);else values.delete(f.item);}
          break;
        }
        case "comment":case "function":break;
        default:throw new Error("Preview does not support "+(DEFINITIONS[b.type]?.name||b.type)+". Export and test in the target runtime.");
      }
    }
  }
  try{run(project.blocks);return {messages,variables:Object.fromEntries(values),error:null};}
  catch(error){return {messages,variables:Object.fromEntries(values),error:String(error.message)};}
}
