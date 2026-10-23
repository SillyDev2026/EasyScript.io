import {inlineExpression} from "./format.js";
// Additional visual blocks, with canonical single-line expression handling.
export const EXTRA_DEFINITIONS = {
  random: {name:"Random integer",group:"Math & Numbers",color:"purple",fields:{name:"Roll",min:"1",max:"6"}},
  clamp: {name:"Clamp number",group:"Math & Numbers",color:"purple",fields:{name:"Limited",value:"100",min:"0",max:"50"}},
  concat: {name:"Join text",group:"Text",color:"blue",fields:{name:"Message",left:'"Hello "',right:'"world!"'}},
  length: {name:"Text length",group:"Text",color:"blue",fields:{name:"Length",value:'"Hello"'}},
  array: {name:"Create list",group:"Lists",color:"teal",fields:{name:"Items"}},
  append: {name:"Append to list",group:"Lists",color:"teal",fields:{name:"Items",value:"5"}},
  removeAt: {name:"Remove list item",group:"Lists",color:"teal",fields:{name:"Items",index:"1"}},
  listSize: {name:"List size",group:"Lists",color:"teal",fields:{name:"Size",list:"Items"}},
  each: {name:"For each item",group:"Lists",color:"amber",fields:{item:"item",list:"Items"},branches:["body"]},
  forRange: {name:"For number range",group:"Logic",color:"amber",fields:{index:"i",start:"1",end:"10",step:"1"},branches:["body"]},
  returnValue: {name:"Return value",group:"Functions",color:"pink",fields:{value:"true"}},
  breakLoop: {name:"Break loop",group:"Logic",color:"amber",fields:{}},
  playerLeaving: {name:"Player leaving",group:"Roblox · Events",color:"blue",fields:{},branches:["body"]},
  characterAdded: {name:"Character spawned",group:"Roblox · Events",color:"blue",fields:{},branches:["body"]},
  setAttribute: {name:"Set attribute",group:"Roblox · Objects",color:"teal",fields:{target:"workspace.Door",name:"Open",value:"true"}},
  getAttribute: {name:"Read attribute",group:"Roblox · Objects",color:"teal",fields:{name:"DoorOpen",target:"workspace.Door",attribute:"Open"}},
  destroyInstance: {name:"Destroy instance",group:"Roblox · Objects",color:"teal",fields:{target:"workspace.OldPart"}},
  spawnTask: {name:"Spawn parallel task",group:"Flow",color:"pink",fields:{},branches:["body"]}
};
const pathPattern=/^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*$/;
const identifier=/^[A-Za-z_]\w*$/;
const reserved=new Set("and break do else elseif end false for function if in local nil not or repeat return then true until while await async const let var class import export default new this".split(" "));
export const EXTENSION_ROBLOX_TYPES=new Set(["playerLeaving","characterAdded","setAttribute","getAttribute","destroyInstance"]);
const clean=v=>String(v??"").trim();
const expr=inlineExpression;
const jsExpr=inlineExpression;
const quote=v=>JSON.stringify(String(v).replace(/[\r\n]+/g," "));
export function extensionCode(b,js,level,emit){
  const s="    ".repeat(level),f=b.fields;
  const e=(v)=>js?jsExpr(v):expr(v);
  switch(b.type){
    case "random":return [s+(js?
      "let "+f.name+" = Math.floor(Math.random() * (("+e(f.max)+") - ("+e(f.min)+") + 1)) + ("+e(f.min)+");":
      "local "+f.name+" = math.random("+e(f.min)+", "+e(f.max)+")")];
    case "clamp":return [s+(js?
      "let "+f.name+" = Math.min(("+e(f.max)+"), Math.max(("+e(f.min)+"), ("+e(f.value)+")));":
      "local "+f.name+" = math.clamp("+e(f.value)+", "+e(f.min)+", "+e(f.max)+")")];
    case "concat":return [s+(js?
      "let "+f.name+" = String("+e(f.left)+") + String("+e(f.right)+");":
      "local "+f.name+" = tostring("+e(f.left)+") .. tostring("+e(f.right)+")")];
    case "length":return [s+(js?
      "let "+f.name+" = String("+e(f.value)+").length;":
      "local "+f.name+" = #tostring("+e(f.value)+")")];
    case "array":return [s+(js?"let "+f.name+" = [];":"local "+f.name+" = {}")];
    case "append":return [s+(js?f.name+".push("+e(f.value)+");":"table.insert("+f.name+", "+e(f.value)+")")];
    case "removeAt":return [s+(js?f.name+".splice(("+e(f.index)+") - 1, 1);":"table.remove("+f.name+", "+e(f.index)+")")];
    case "listSize":return [s+(js?"let "+f.name+" = "+f.list+".length;":"local "+f.name+" = #"+f.list)];
    case "each":return [
      s+(js?"for (const "+f.item+" of "+f.list+") {":"for _, "+f.item+" in ipairs("+f.list+") do"),
      ...emit(b.body,level+1),s+(js?"}":"end")
    ];
    case "forRange":{
      const index=f.index,start=e(f.start),end=e(f.end),step=e(f.step);
      return [s+(js?
        "for (let "+index+" = "+start+"; ("+step+") > 0 ? "+index+" <= ("+end+") : "+index+" >= ("+end+"); "+index+" += ("+step+")) {":
        "for "+index+" = "+start+", "+end+", "+step+" do"),
        ...emit(b.body,level+1),s+(js?"}":"end")];
    }
    case "returnValue":return [s+"return "+e(f.value)+(js?";":"")];
    case "breakLoop":return [s+"break"+(js?";":"")];
    case "playerLeaving":return js?[s+"// Luau only: Player leaving"]: [
      s+'game:GetService("Players").PlayerRemoving:Connect(function(player)',
      ...emit(b.body,level+1),s+"end)"];
    case "characterAdded":return js?[s+"// Luau only: Character spawned"]: [
      s+"player.CharacterAdded:Connect(function(character)",...emit(b.body,level+1),s+"end)"];
    case "setAttribute":return js?[s+"// Luau only: Set attribute"]: [
      s+e(f.target)+":SetAttribute("+quote(f.name)+", "+e(f.value)+")"];
    case "getAttribute":return js?[s+"// Luau only: Read attribute"]: [
      s+"local "+f.name+" = "+e(f.target)+":GetAttribute("+quote(f.attribute)+")"];
    case "destroyInstance":return js?[s+"// Luau only: Destroy instance"]: [
      s+e(f.target)+":Destroy()"];
    case "spawnTask":return [
      s+(js?"void (async () => {":"task.spawn(function()"),
      ...emit(b.body,level+1),s+(js?"})().catch(console.error);":"end)")
    ];
    default:return null;
  }
}
export function extensionDiagnostics(block,language,context){
  const f=block.fields,issues=[];
  const issue=(message,severity="error")=>issues.push({id:block.id,message,severity});
  const validName=v=>identifier.test(clean(v))&&!reserved.has(clean(v));
  const nameFields={
    random:["name"],clamp:["name"],concat:["name"],length:["name"],
    array:["name"],append:["name"],removeAt:["name"],listSize:["name","list"],
    each:["item","list"],forRange:["index"],getAttribute:["name"]
  };
  for(const key of nameFields[block.type]||[])if(!validName(f[key]))issue("Invalid identifier in "+block.type+" ("+key+"): "+f[key]);
  for(const key of ["value","min","max","left","right","index","start","end","step"]){
    if(key in f&&!clean(f[key]))issue("Missing "+key+" expression in "+block.type);
  }
  if(block.type==="forRange"&&Number(f.step)===0)issue("Range step cannot be zero");
  if(block.type==="breakLoop"&&!context.inLoop)issue("Break must be inside a loop");
  if(block.type==="returnValue"&&!context.inFunction)issue("Return must be inside a function");
  if(block.type==="characterAdded"&&!context.hasPlayer)issue("Character spawned requires a Player joined/leaving event");
  if(["setAttribute","getAttribute","destroyInstance"].includes(block.type)&&!pathPattern.test(clean(f.target)))issue("Invalid instance path: "+f.target);
  if(["setAttribute","getAttribute"].includes(block.type)&&!clean(f.name??f.attribute))issue("Attribute name is required");
  if(EXTENSION_ROBLOX_TYPES.has(block.type)&&language==="javascript")issue("Roblox block requires Luau: "+block.type,"warning");
  if(block.type==="forRange"&&!Number.isNaN(Number(f.step))&&Number(f.step)<0)issue("Negative ranges require start >= end","warning");
  return issues;
}
export function extraTemplate(type,make){
  const project={schema:1,title:"Untitled Project",language:"luau",blocks:[]};
  if(type==="list"){
    project.title="List Operations";
    const arr=make("array"),a=make("append"),b=make("append"),count=make("listSize"),out=make("print");
    a.fields.value="10";b.fields.value="20";out.fields.value="Size";project.blocks=[arr,a,b,count,out];return project;
  }
  if(type==="loop"){
    project.title="Number Range";const range=make("forRange"),log=make("print");log.fields.value="i";
    range.body.push(log);project.blocks=[range];return project;
  }
  if(type==="attributes"){
    project.title="Roblox Attribute Door";const set=make("setAttribute"),read=make("getAttribute"),out=make("print");
    out.fields.value="DoorOpen";project.blocks=[set,read,out];return project;
  }
  if(type==="join"){
    project.title="Text Builder";const join=make("concat"),output=make("print");output.fields.value="Message";
    project.blocks=[join,output];return project;
  }
  return null;
}
