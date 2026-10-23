export const VERSION = "0.3.0";
export const DEFINITIONS = {
  print: { name:"Print", group:"Output", color:"blue", fields:{value:'"Hello world!"'} },
  variable: { name:"Create variable", group:"Variables", color:"purple", fields:{name:"Coins",value:"100"} },
  set: { name:"Set variable", group:"Variables", color:"purple", fields:{name:"Coins",value:"Coins + 1"} },
  if: { name:"If / otherwise", group:"Logic", color:"amber", fields:{left:"Coins",operator:">=",right:"100"}, branches:["then","else"] },
  repeat: { name:"Repeat", group:"Logic", color:"amber", fields:{count:"3"}, branches:["body"] },
  wait: { name:"Wait", group:"Flow", color:"teal", fields:{seconds:"1"} },
  comment: { name:"Comment", group:"Flow", color:"slate", fields:{text:"Explain this step"} },
  function: { name:"Define function", group:"Functions", color:"pink", fields:{name:"greet"}, branches:["body"] },
  call: { name:"Call function", group:"Functions", color:"pink", fields:{name:"greet"} },
  increment: { name:"Change number", group:"Variables", color:"purple", fields:{name:"Coins",amount:"1"} },
  while: { name:"While condition", group:"Logic", color:"amber", fields:{left:"Coins",operator:"<",right:"10"}, branches:["body"] },
  service: { name:"Get Roblox service", group:"Roblox · Services", color:"teal", fields:{alias:"Players",service:"Players"} },
  playerJoined: { name:"Player joined", group:"Roblox · Events", color:"blue", fields:{}, branches:["body"] },
  partTouched: { name:"Part touched", group:"Roblox · Events", color:"blue", fields:{path:"workspace.Door"}, branches:["body"] },
  remoteReceived: { name:"Remote received (server)", group:"Roblox · Events", color:"blue", fields:{path:"game.ReplicatedStorage.MyEvent"}, branches:["body"] },
  leaderstat: { name:"Create leaderstat", group:"Roblox · Players", color:"purple", fields:{name:"Coins",initial:"0"} },
  setProperty: { name:"Set instance property", group:"Roblox · Objects", color:"teal", fields:{target:"workspace.Door",property:"Transparency",value:"0.5"} },
  createPart: { name:"Create anchored part", group:"Roblox · Objects", color:"teal", fields:{name:"MyPart",parent:"workspace"} }
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
  if(template==="leaderstats"){
    p.title="Roblox Leaderstats";p.language="luau";
    const event=newBlock("playerJoined"),stat=newBlock("leaderstat"),msg=newBlock("print");
    msg.fields.value='"Player joined!"';event.body.push(stat,msg);p.blocks.push(event);return p;
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
const expression=(v,fallback="nil")=>String(v??"").trim()||fallback;
const space=n=>"    ".repeat(n);
function condition(block,js) {
  let {left,operator,right}=block.fields;
  operator=operator==="!="?(js?"!==":"~="):operator==="=="&&js?"===":operator;
  if(!["==","===","!=","!==","~=",">","<",">=","<="].includes(operator))operator="==";
  return expression(left) + " " + operator + " " + expression(right);
}
export function generate(project) {
  const js=project.language==="javascript",lines=[js?"// Generated by EasyScript v0.3.0":"-- Generated by EasyScript v0.3.0",""];
  const luaOnly=new Set(["service","playerJoined","partTouched","remoteReceived","leaderstat","setProperty","createPart"]);
  const pathValid=value=>/^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(String(value).trim());
  const quote=value=>JSON.stringify(String(value));

  if(js)lines.push("async function main() {");
  function emit(blocks,level) {
    if(!blocks.length){lines.push(space(level)+(js?"// Add blocks here":"-- Add blocks here"));return;}
    for(const b of blocks) {
      const f=b.fields,s=space(level);
      if(js&&luaOnly.has(b.type)){lines.push(s+"// Roblox-only: "+DEFINITIONS[b.type].name+" (switch to Luau)");continue;}
      switch(b.type) {
        case "print":lines.push(s+(js?"console.log("+expression(f.value,"undefined")+");":"print("+expression(f.value)+")"));break;
        case "variable":lines.push(s+(js?"let ":"local ")+f.name+" = "+expression(f.value,js?"undefined":"nil")+(js?";":""));break;
        case "set":lines.push(s+f.name+" = "+expression(f.value,js?"undefined":"nil")+(js?";":""));break;
        case "increment":lines.push(s+f.name+" += "+expression(f.amount,"1")+(js?";":""));break;
        case "service":lines.push(s+"local "+f.alias+" = game:GetService("+quote(f.service)+")");break;
        case "playerJoined":
          lines.push(s+'game:GetService("Players").PlayerAdded:Connect(function(player)');
          emit(b.body,level+1);lines.push(s+"end)");break;
        case "partTouched":
          lines.push(s+expression(f.path,"workspace.Door")+".Touched:Connect(function(hit)");
          emit(b.body,level+1);lines.push(s+"end)");break;
        case "remoteReceived":
          lines.push(s+expression(f.path,"game.ReplicatedStorage.MyEvent")+".OnServerEvent:Connect(function(player, data)");
          lines.push(space(level+1)+"-- SECURITY: validate player permissions and all client data");
          emit(b.body,level+1);lines.push(s+"end)");break;
        case "leaderstat": {
          const suffix=b.id.replace(/\W/g,"").slice(-12);
          const stats="leaderstats_"+suffix,stat="stat_"+suffix;
          lines.push(s+"local "+stats+' = player:FindFirstChild("leaderstats")');
          lines.push(s+"if not "+stats+" then");
          lines.push(space(level+1)+stats+' = Instance.new("Folder")');
          lines.push(space(level+1)+stats+'.Name = "leaderstats"');
          lines.push(space(level+1)+stats+".Parent = player");
          lines.push(s+"end");
          lines.push(s+"local "+stat+' = Instance.new("IntValue")');
          lines.push(s+stat+".Name = "+quote(f.name));
          lines.push(s+stat+".Value = "+expression(f.initial,"0"));
          lines.push(s+stat+".Parent = "+stats);break;
        }
        case "setProperty":lines.push(s+expression(f.target,"workspace")+
          "."+f.property+" = "+expression(f.value,"nil"));break;
        case "createPart": {
          const name="part_"+b.id.replace(/\W/g,"").slice(-12);
          lines.push(s+"local "+name+' = Instance.new("Part")');
          lines.push(s+name+".Name = "+quote(f.name));
          lines.push(s+name+".Anchored = true");
          lines.push(s+name+".Parent = "+expression(f.parent,"workspace"));break;
        }
        case "wait":lines.push(s+(js?"await new Promise(resolve => setTimeout(resolve, Math.max(0, ("+expression(f.seconds,"0")+")) * 1000));":"task.wait("+expression(f.seconds,"0")+")"));break;
        case "comment":lines.push(s+(js?"// ":"-- ")+String(f.text).replace(/[\r\n]/g," "));break;
        case "call":lines.push(s+(js?"await ":"")+f.name+"();");if(!js)lines[lines.length-1]=s+f.name+"()";break;
        case "function":lines.push(s+(js?"async function ":"local function ")+f.name+"()"+(js?" {":""));emit(b.body,level+1);lines.push(s+(js?"}":"end"));break;
        case "repeat":{
          const varName="__index_"+b.id.replace(/\W/g,"");
          lines.push(s+(js?"for (let "+varName+" = 0; "+varName+" < ("+expression(f.count,"0")+"); "+varName+"++) {":"for "+varName+" = 1, "+expression(f.count,"0")+" do"));
          emit(b.body,level+1);lines.push(s+(js?"}":"end"));break;
        }
        case "while":
          lines.push(s+(js?"while ("+condition(b,true)+") {":"while "+condition(b,false)+" do"));
          emit(b.body,level+1);lines.push(s+(js?"}":"end"));break;
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
  traverse(project.blocks,b=>{
    const f=b.fields;
    const issue=(message,severity="error")=>problems.push({id:b.id,message,severity});
    if(["variable","set","increment","function","call"].includes(b.type)&&!validName(f.name))issue("Invalid identifier: "+f.name);
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
        case "comment":case "function":break;
      }
    }
  }
  try{run(project.blocks);return {messages,variables:Object.fromEntries(values),error:null};}
  catch(error){return {messages,variables:Object.fromEntries(values),error:String(error.message)};}
}
