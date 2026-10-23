import {DEFINITIONS,traverse,lint,generate} from "./engine.js";
import {analyzeWorkspace} from "./project-graph.js";
import {validateWorkspace} from "./workspace.js";

const IDENT=/^[A-Za-z_][A-Za-z0-9_]*$/;
const LUAU_RESERVED=new Set("and break continue do else elseif end false for function if in local nil not or repeat return then true until while".split(" "));
const ident=(value)=>IDENT.test(value)&&!LUAU_RESERVED.has(value);
const quote=s=>JSON.stringify(String(s));
const types=new Set(["number","string","boolean"]);
export const API_CATALOG=[
 ["Players","GetPlayers","Returns all current players","server/client"],
 ["Players","GetPlayerByUserId","Finds player by UserId","server/client"],
 ["Players","PlayerAdded","Player joined signal","server/client"],
 ["DataStoreService","GetDataStore","Open a server-side DataStore","server"],
 ["GlobalDataStore","UpdateAsync","Atomic server-side key update","server"],
 ["RemoteEvent","FireServer","Send client data to server","client"],
 ["RemoteEvent","OnServerEvent","Receive client event; validate data","server"],
 ["RemoteEvent","FireClient","Send server data to one player","server"],
 ["Workspace","Raycast","Cast a ray through the world","server/client"],
 ["Workspace","GetPartBoundsInBox","Query overlapping parts","server/client"],
 ["Humanoid","MoveTo","Moves humanoid toward position","server/client"],
 ["TweenService","Create","Create a tween with TweenInfo","server/client"],
 ["CollectionService","AddTag","Tag an instance","server/client"],
 ["RunService","Heartbeat","Per-frame callback","server/client"],
 ["RunService","RenderStepped","Client rendering callback","client"],
 ["MemoryStoreService","GetQueue","Create/open a queue","server"],
 ["HttpService","JSONEncode","Serialize Lua value as JSON","server/client"],
 ["HttpService","RequestAsync","Issue HTTP request (permissions needed)","server"],
 ["PathfindingService","CreatePath","Create an engine path","server/client"],
 ["Actor","BindToMessageParallel","Bind callback for parallel Luau","studio"]
].map(([className,member,description,context])=>({className,member,description,context}));
export function searchRobloxAPI(query="",limit=30){
 const needle=String(query||"").trim().toLowerCase();
 return API_CATALOG.filter(x=>(x.className+"."+x.member+" "+x.description).toLowerCase().includes(needle))
  .slice(0,Math.min(100,Math.max(1,Number(limit)||30)));
}
export function semanticReport(project){
 const entries=[],declarations=new Map(),reads=new Map(),context=[];
 traverse(project.blocks||[],b=>{
  if(b.disabled)return;
  const f=b.fields||{},local=["variable","function","array","requireModule","datastoreGet"];
  if(local.includes(b.type)&&typeof f.name==="string"){
   const name=f.name;
   if(!declarations.has(name))declarations.set(name,[]);
   declarations.get(name).push(b.id);
  }
  if(["set","increment"].includes(b.type)&&typeof f.name==="string"){
   if(!reads.has(f.name))reads.set(f.name,[]);
   reads.get(f.name).push(b.id);
  }
  if(["while","eventHeartbeat","eventRenderStep"].includes(b.type))context.push({id:b.id,type:b.type});
  if(["remoteReceived","remoteServerFunction"].includes(b.type))
   entries.push({id:b.id,severity:"warning",message:"Untrusted RemoteEvent/RemoteFunction inputs must be checked in server code."});
 });
 for(const [name,ids] of declarations){
  if(!ident(name))entries.push({id:ids[0],severity:"error",message:"Invalid Luau variable name: "+name});
  if(ids.length>1)entries.push({id:ids[1],severity:"warning",message:"Multiple declarations of "+name+"; check shadowing."});
 }
 for(const [name,ids] of reads){
  if(!declarations.has(name))entries.push({id:ids[0],severity:"warning",message:"Assigned "+name+" without an explicit Create variable block."});
 }
 for(const x of context){
  if(x.type==="while")entries.push({id:x.id,severity:"info",message:"While loops require a reachable exit or yielding work."});
  else entries.push({id:x.id,severity:"info",message:"Per-frame events should avoid expensive or yielding work."});
 }
 for(const issue of lint(project).filter(x=>x.severity==="error"))
  entries.push({id:issue.id,severity:"error",message:issue.message});
 return {declarations:[...declarations].map(([name,ids])=>({name,ids})),
  entries,blocks:project.blocks?.length??0,
  disclaimer:"Static block-level checks; raw Luau expressions are not parsed or type-checked."};
}
export function readinessReport(workspace){
 const graph=analyzeWorkspace(workspace),items=[];
 for(const file of workspace.files){
  const errors=lint(file.project).filter(x=>x.severity==="error");
  if(errors.length)items.push({file:file.name,severity:"error",text:errors.length+" block validation error(s)"});
  const code=generate(file.project);
  if(/TODO|SECURITY:/.test(code))items.push({file:file.name,severity:"warning",text:"Review generated TODO/security placeholders"});
  if(file.kind==="ModuleScript"&&!/\breturn\b/.test(code))
   items.push({file:file.name,severity:"warning",text:"ModuleScript has no detected return; check its contract"});
  if(file.kind==="LocalScript"&&/(GetDataStore|UpdateAsync|SetAsync)/.test(code))
   items.push({file:file.name,severity:"error",text:"DataStore operations belong on the server"});
 }
 for(const issue of graph.issues)items.push({file:issue.filename,severity:issue.severity,text:issue.message});
 return {ready:!items.some(x=>x.severity==="error"),items,files:workspace.files.length,
  disclaimer:"Static readiness review only. Does not publish or run Studio tests."};
}
export function dataSchemaModule(name,fields){
 const moduleName=String(name||"PlayerData").trim();
 if(!ident(moduleName))throw new Error("Use a valid Luau module identifier");
 if(!Array.isArray(fields)||fields.length<1||fields.length>40)throw new Error("Schema requires 1–40 fields");
 const seen=new Set(),clean=fields.map(x=>{
  if(!ident(x.name)||seen.has(x.name))throw new Error("Invalid or duplicate schema field: "+x.name);
  if(!types.has(x.type))throw new Error("Unsupported schema field type: "+x.type);
  seen.add(x.name);
  const value=x.type==="number"?Number(x.default):
   x.type==="boolean"?Boolean(x.default):String(x.default??"");
  if(x.type==="number"&&!Number.isFinite(value))throw new Error("Number defaults must be finite");
  return {name:x.name,type:x.type,value};
 });
 const literal=x=>x.type==="string"?quote(x.value):String(x.value);
 const code=[
  "-- EasyScript schema module; save as "+moduleName+".luau",
  "local "+moduleName+" = {}",
  moduleName+".Version = 1",
  moduleName+".Defaults = {",
  ...clean.map(x=>"    "+x.name+" = "+literal(x)+","),
  "}",
  "",
  "function "+moduleName+".Migrate(input)",
  '    local source = type(input) == "table" and input or {}',
  "    local migrated = {}",
  ...clean.map(x=>'    migrated.'+x.name+' = type(source.'+x.name+') == '+quote(x.type)+' and source.'+x.name+' or '+literal(x)),
  "    return migrated",
  "end",
  "",
  "return "+moduleName,""
 ].join("\n");
 return {name:moduleName,fields:clean,code};
}
export function parallelAdvice(project){
 const findings=[];
 traverse(project.blocks||[],b=>{
  if(b.disabled)return;
  if(["datastoreGet","datastoreSet","datastoreUpdate","instanceNew","instanceParent","uiText"].includes(b.type))
   findings.push({id:b.id,severity:"warning",message:"Engine/data mutation or yielding API: avoid placing in parallel Actor execution."});
  if(["forRange","each","repeat"].includes(b.type))
   findings.push({id:b.id,severity:"info",message:"A loop may benefit from profiling; parallelism helps only for CPU-heavy, independently safe tasks."});
 });
 return {findings,example:[
  "-- Actor Script scaffold: only run thread-safe computations in the parallel section.",
  "local actor = script:GetActor()",
  'assert(actor, "Place this Script under an Actor")',
  'actor:BindToMessageParallel("Compute", function(value)',
  '    local result = (tonumber(value) or 0) * 2',
  '    task.synchronize() -- return to serial execution before changing Instances',
  '    print("Result:", result)',
  'end)',""
 ].join("\n"),disclaimer:"Advisory only; no automatic conversion into safe parallel Luau."};
}
export function mergeWorkspaces(base,incoming){
 const destination=validateWorkspace(JSON.parse(JSON.stringify(base)));
 const source=validateWorkspace(JSON.parse(JSON.stringify(incoming)));
 let added=0,renamed=0,skipped=0;
 for(const file of source.files){
  if(destination.files.length>=24){skipped++;continue;}
  let name=file.name;
  const taken=new Set(destination.files.map(f=>f.name.toLowerCase()));
  if(taken.has(name.toLowerCase())){
   const extension=/\.(js|luau)$/i.exec(name)?.[0]||"";
   const stem=extension?name.slice(0,-extension.length):name;
   let n=2;
   while(taken.has(name.toLowerCase())){name=stem+"-imported-"+n+++extension;renamed++;}
  }
  const imported=JSON.parse(JSON.stringify(file));
  imported.id="merged_"+(added+1)+"_"+Date.now().toString(36);
  imported.name=name;
  destination.files.push(imported);added++;
 }
 return {workspace:validateWorkspace(destination),added,renamed,skipped};
}
export function aiPromptBundle(project){
 const code=generate(project).slice(0,20000);
 const problems=lint(project).slice(0,30).map(x=>x.severity+": "+x.message).join("\n");
 return [
  "You are reviewing Roblox Luau/JavaScript code generated by EasyScript.io.",
  "Review correctness, security, Roblox server/client placement, nil checks and performance.",
  "Do not assume that the browser executed this source. Return suggested changes with explanations.",
  "LANGUAGE: "+project.language,
  "TITLE: "+project.title,
  "DIAGNOSTICS:\n"+(problems||"(none)"),
  "SOURCE:\n"+code,
  "Do not include secrets, tokens or personal player data in a prompt shared with a third-party AI service."
 ].join("\n\n");
}
export function studioSourceManifest(workspace){
 const files=validateWorkspace(JSON.parse(JSON.stringify(workspace))).files;
 return JSON.stringify({format:"EasyScript-source-manifest-v1",name:workspace.name,
  files:files.map(f=>({name:f.name,type:f.kind,language:f.project.language,source:generate(f.project)}))},null,2);
}
