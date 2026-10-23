import {inlineExpression,identifierOK} from "./format.js";
const defs={};
const register=(id,name,group,fields,build,branches=[])=>{
 defs[id]={name,group:"Roblox · "+group,color:"teal",fields,branches,build};
};
const e=(f,key,alt="nil")=>inlineExpression(f[key],alt);
const q=(f,key)=>JSON.stringify(String(f[key]??""));
const out=(id,name,group,fields,build)=>register(id,name,group,fields,(f,s)=>[s+"local "+f.name+" = "+build(f)]);
const stmt=(id,name,group,fields,build)=>register(id,name,group,fields,(f,s)=>[s+build(f)]);
const ev=(id,name,fields,event,args="")=>register(id,name,"Events",fields,(f,s,emit,b)=>[
 s+event(f)+":Connect(function("+args+")",...emit(b.body,s.length/4+1),s+"end)"
],["body"]);
out("raycast","Raycast","Physics",{name:"hit",origin:"Vector3.zero",direction:"Vector3.new(0, -100, 0)",params:"RaycastParams.new()"},
 f=>"workspace:Raycast("+e(f,"origin")+", "+e(f,"direction")+", "+e(f,"params")+")");
out("raycastParams","RaycastParams builder","Physics",{name:"params",ignoreWater:"true",filterType:"Exclude"},
 f=>"(function() local p = RaycastParams.new(); p.IgnoreWater = "+e(f,"ignoreWater")+"; p.FilterType = Enum.RaycastFilterType."+f.filterType+"; return p end)()");
out("overlapQuery","Overlap box query","Physics",{name:"parts",frame:"CFrame.new()",size:"Vector3.new(10, 10, 10)",params:"OverlapParams.new()"},
 f=>"workspace:GetPartBoundsInBox("+e(f,"frame")+", "+e(f,"size")+", "+e(f,"params")+")");
out("tweenInfo","TweenInfo builder","Animation",{name:"info",duration:"0.5",style:"Quad",direction:"Out"},
 f=>"TweenInfo.new("+e(f,"duration")+", Enum.EasingStyle."+f.style+", Enum.EasingDirection."+f.direction+")");
out("animationLoad","Load animation track","Animation",{name:"track",animator:"animator",animation:"animation"},
 f=>e(f,"animator")+":LoadAnimation("+e(f,"animation")+")");
stmt("soundPlay","Play Sound","Audio",{sound:"workspace.Sound"},f=>e(f,"sound")+":Play()");
stmt("soundStop","Stop Sound","Audio",{sound:"workspace.Sound"},f=>e(f,"sound")+":Stop()");
stmt("tagAdd","Add CollectionService tag","Instances",{target:"workspace.Part",tag:"Interactable"},f=>'game:GetService("CollectionService"):AddTag('+e(f,"target")+", "+q(f,"tag")+")");
stmt("tagRemove","Remove CollectionService tag","Instances",{target:"workspace.Part",tag:"Interactable"},f=>'game:GetService("CollectionService"):RemoveTag('+e(f,"target")+", "+q(f,"tag")+")");
stmt("collisionGroupSet","Set collision group","Physics",{target:"workspace.Part",group:"Default"},f=>e(f,"target")+".CollisionGroup = "+q(f,"group"));
stmt("humanoidMoveTo","Humanoid MoveTo","Players",{humanoid:"humanoid",position:"Vector3.new(0, 5, 0)"},f=>e(f,"humanoid")+":MoveTo("+e(f,"position")+")");
register("pathWaypoints","Pathfinding waypoint loop","Physics",{humanoid:"humanoid",from:"character.PrimaryPart.Position",to:"workspace.Goal.Position"},(f,s,emit,b)=>[
 s+'local path = game:GetService("PathfindingService"):CreatePath()',
 s+"local pathOk = pcall(function()",
 s+"    path:ComputeAsync("+e(f,"from")+", "+e(f,"to")+")",
 s+"end)",
 s+"if pathOk and path.Status == Enum.PathStatus.Success then",
 s+"    for _, waypoint in ipairs(path:GetWaypoints()) do",
 s+"        "+e(f,"humanoid")+":MoveTo(waypoint.Position)",
 s+"        "+e(f,"humanoid")+".MoveToFinished:Wait()",
 ...emit(b.body,s.length/4+2),s+"    end",s+"end"
],["body"]);
out("bindableNew","Create BindableEvent","Events",{name:"signal",parent:"script"},
 f=>'Instance.new("BindableEvent", '+e(f,"parent")+")");
stmt("bindableFire","Fire BindableEvent","Events",{target:"script.Parent.Signal",value:"true"},f=>e(f,"target")+":Fire("+e(f,"value")+")");
ev("bindableEvent","BindableEvent received",{target:"script.Parent.Signal"},f=>e(f,"target")+".Event","value");
register("bindableInvoke","BindableFunction handler","Events",{target:"script.Parent.Request"},(f,s,emit,b)=>[
 s+e(f,"target")+".OnInvoke = function(value)",...emit(b.body,s.length/4+1),s+"end"
],["body"]);
register("remoteServerFunction","RemoteFunction server handler","Networking",{remote:"game.ReplicatedStorage.Request"},(f,s,emit,b)=>[
 s+e(f,"remote")+".OnServerInvoke = function(player, data)",...emit(b.body,s.length/4+1),s+"end"
],["body"]);
register("remoteClientFunction","RemoteFunction client handler","Networking",{remote:"game.ReplicatedStorage.Request"},(f,s,emit,b)=>[
 s+e(f,"remote")+".OnClientInvoke = function(data)",...emit(b.body,s.length/4+1),s+"end"
],["body"]);
register("datastoreUpdate","DataStore UpdateAsync (server)","Data",{store:"playerDataStore",key:"tostring(player.UserId)",value:"newData"},(f,s)=>[
 s+"local updateOk, updateResult = pcall(function()",
 s+"    return "+e(f,"store")+":UpdateAsync("+e(f,"key")+", function(previous)",
 s+"        return "+e(f,"value")+" -- no yields in transform",
 s+"    end)",s+"end)",
 s+'if not updateOk then warn("DataStore update failed:", updateResult) end'
]);
out("memoryQueue","MemoryStore queue","Data",{name:"queue",queueName:"MatchQueue",timeout:"30"},
 f=>'game:GetService("MemoryStoreService"):GetQueue('+q(f,"queueName")+", "+e(f,"timeout")+")");
out("memorySortedMap","MemoryStore sorted map","Data",{name:"rankings",mapName:"Rankings"},
 f=>'game:GetService("MemoryStoreService"):GetSortedMap('+q(f,"mapName")+")");
out("httpRequest","HTTP RequestAsync","Data",{name:"response",url:"https://example.com/api",method:"GET"},
 f=>'game:GetService("HttpService"):RequestAsync({Url = '+q(f,"url")+", Method = "+q(f,"method")+"})");
stmt("debrisAdd","Debris cleanup","Instances",{target:"workspace.Part",seconds:"5"},
 f=>'game:GetService("Debris"):AddItem('+e(f,"target")+", "+e(f,"seconds")+")");
out("numberSequence","NumberSequence","Animation",{name:"transparency",value:"0.5"},f=>"NumberSequence.new("+e(f,"value")+")");
out("colorSequence","ColorSequence","Animation",{name:"gradient",start:"Color3.new(1, 0, 0)",end:"Color3.new(0, 0, 1)"},
 f=>"ColorSequence.new("+e(f,"start")+", "+e(f,"end")+")");
ev("propertyChanged","Property changed event",{target:"workspace.Part",property:"Transparency"},
 f=>e(f,"target")+":GetPropertyChangedSignal("+q(f,"property")+")");
export const EXPANDED_LUAU_DEFINITIONS=Object.fromEntries(Object.entries(defs).map(([id,val])=>[id,{
 name:val.name,group:val.group,color:val.color,fields:val.fields,branches:val.branches
}]));
const validEnum={
 filterType:new Set(["Exclude","Include"]),
 style:new Set(["Linear","Sine","Back","Quad","Quart","Quint","Bounce","Elastic","Exponential","Circular","Cubic"]),
 direction:new Set(["In","Out","InOut"])
};
export function expandedLuauCode(block,language,level,emit){
 const entry=defs[block.type];if(!entry)return null;
 const s="    ".repeat(level);
 if(language!=="luau")return [s+"// Roblox-only: "+entry.name+" (switch to Luau)"];
 return entry.build(block.fields,s,emit,block);
}
export function expandedLuauDiagnostics(block,language){
 const entry=defs[block.type];if(!entry)return [];
 const issues=[],add=(severity,message)=>issues.push({id:block.id,severity,message}),f=block.fields;
 if(language!=="luau")add("warning","Roblox block requires Luau: "+entry.name);
 for(const key of Object.keys(entry.fields)){
  const val=String(f[key]??"");
  if(!val.trim())add("error","Missing "+key);
  if(/[\r\n]/.test(val))add("error","Multiline expression in "+key);
  if(key==="name"&&!identifierOK(val))add("error","Invalid Luau local name "+val);
  if(validEnum[key]&&!validEnum[key].has(val))add("error","Invalid enum value for "+key);
 }
 if(["remoteServerFunction","remoteClientFunction","bindableInvoke"].includes(block.type))
  add("warning","Callback must return a value for callers expecting a result.");
 if(["httpRequest","datastoreUpdate","memoryQueue","memorySortedMap"].includes(block.type))
  add("warning","Server or privileged API: review permissions, quotas and errors.");
 if(block.type==="raycast")add("warning","Raycast result may be nil; check before reading properties.");
 if(block.type==="pathWaypoints")add("warning","Pathfinding can fail or yield; handle blocked paths in production.");
 return issues;
}
