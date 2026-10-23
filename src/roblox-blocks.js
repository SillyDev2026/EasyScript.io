import {inlineExpression,identifierOK,dottedPathOK} from "./format.js";

// Target-aware blocks. Roblox APIs are Luau-only: never silently emit pretend JS.
const table={};
const register=(id,name,group,fields,build,branches=[])=>{
  table[id]={definition:{name,group:"Roblox · "+group,color:group==="Events"?"blue":group==="UI"?"pink":"teal",fields,branches},build};
};
const e=(f,key,fallback="nil")=>inlineExpression(f[key],fallback);
const q=(f,key)=>JSON.stringify(String(f[key]??""));
const assign=(name,expression,s)=>[s+"local "+name+" = "+expression];
const statements=(...parts)=>parts;
const method=(id,name,group,fields,methodName,args=[])=>register(id,name,group,fields,(f,s)=>[
  s+e(f,"target","workspace")+":"+methodName+"("+args.map(key=>e(f,key)).join(", ")+")"
]);
const getter=(id,name,group,fields,get)=>register(id,name,group,fields,(f,s)=>assign(f.name,get(f),s));
const event=(id,name,group,fields,signal,args="")=>register(id,name,group,fields,
  (f,s,emit,b)=>[s+signal(f)+":Connect(function("+args+")",...emit(b.body,Math.round(s.length/4)+1),s+"end)"],["body"]);

// Beginner-friendly explicit globals: _G is not synchronized across server/client.
register("globalWrite","Set shared global","Globals",{key:"Coins",value:"0"},(f,s)=>[
  s+"_G["+q(f,"key")+"] = "+e(f,"value")
]);
register("globalRead","Read shared global","Globals",{name:"Coins",key:"Coins",fallback:"0"},(f,s)=>assign(f.name,
  "_G["+q(f,"key")+"]",s).concat([s+"if "+f.name+" == nil then "+f.name+" = "+e(f,"fallback","nil")+" end"]));
register("globalIncrease","Increase shared global","Globals",{key:"Coins",amount:"1"},(f,s)=>[
  s+"_G["+q(f,"key")+"] = (_G["+q(f,"key")+"] or 0) + ("+e(f,"amount","0")+")"
]);
register("globalDelete","Clear shared global","Globals",{key:"Coins"},(f,s)=>[s+"_G["+q(f,"key")+"] = nil"]);

// Instance hierarchy
getter("instanceFind","Find child","Instances",{name:"Found",target:"workspace",child:"Part"},f=>
  e(f,"target")+":FindFirstChild("+q(f,"child")+")");
getter("instanceWait","Wait for child","Instances",{name:"Part",target:"workspace",child:"Part",timeout:"5"},f=>
  e(f,"target")+":WaitForChild("+q(f,"child")+", "+e(f,"timeout","5")+")");
getter("instanceClass","Find child of class","Instances",{name:"Found",target:"workspace",className:"Part"},f=>
  e(f,"target")+":FindFirstChildOfClass("+q(f,"className")+")");
getter("instanceChildren","Get children","Instances",{name:"Children",target:"workspace"},f=>e(f,"target")+":GetChildren()");
getter("instanceDescendants","Get descendants","Instances",{name:"All",target:"workspace"},f=>e(f,"target")+":GetDescendants()");
getter("instanceClone","Clone instance","Instances",{name:"Clone",target:"workspace.Door"},f=>e(f,"target")+":Clone()");
getter("instanceAncestor","Find ancestor of class","Instances",{name:"Character",target:"workspace.Door",className:"Model"},f=>
  e(f,"target")+":FindFirstAncestorOfClass("+q(f,"className")+")");
getter("instanceIsA","Check instance class","Instances",{name:"IsPart",target:"workspace.Door",className:"BasePart"},f=>
  e(f,"target")+":IsA("+q(f,"className")+")");
getter("instanceFullName","Get full instance name","Instances",{name:"Path",target:"workspace.Door"},f=>
  e(f,"target")+":GetFullName()");
register("instanceParent","Reparent instance","Instances",{target:"workspace.Door",parent:"workspace"},(f,s)=>[
  s+e(f,"target")+".Parent = "+e(f,"parent")
]);
register("instanceRename","Rename instance","Instances",{target:"workspace.Door",name:"Door2"},(f,s)=>[
  s+e(f,"target")+".Name = "+q(f,"name")
]);
register("instanceNew","Create named instance","Instances",{name:"Created",className:"Folder",parent:"workspace",instanceName:"MyFolder"},(f,s)=>[
  s+"local "+f.name+" = Instance.new("+q(f,"className")+")",
  s+f.name+".Name = "+q(f,"instanceName"),
  s+f.name+".Parent = "+e(f,"parent")
]);
method("instanceClear","Clear all children","Instances",{target:"workspace.Folder"},"ClearAllChildren");
register("instanceSetValue","Set Value object","Instances",{target:"workspace.Counter",value:"100"},(f,s)=>[
  s+e(f,"target")+".Value = "+e(f,"value")
]);

// Player, character, humanoid. These are references within a Roblox script.
getter("playerLocal","Get local player (client)","Players",{name:"Player"},()=>
  'game:GetService("Players").LocalPlayer');
getter("playerCharacter","Get character","Players",{name:"Character",player:"player"},f=>e(f,"player","player")+".Character");
getter("playerHumanoid","Get humanoid","Players",{name:"Humanoid",character:"character"},f=>
  e(f,"character","character")+':FindFirstChildOfClass("Humanoid")');
getter("playerFromCharacter","Get player from character","Players",{name:"Player",character:"character"},f=>
  'game:GetService("Players"):GetPlayerFromCharacter('+e(f,"character","character")+")");
getter("playerCount","Count players","Players",{name:"PlayerCount"},()=>
  '#game:GetService("Players"):GetPlayers()');
getter("playerGetById","Get player by UserId","Players",{name:"Player",userId:"12345"},f=>
  'game:GetService("Players"):GetPlayerByUserId('+e(f,"userId","0")+")");
register("playerKick","Kick player (server)","Players",{player:"player",reason:"Disconnected"},(f,s)=>[
  s+e(f,"player","player")+":Kick("+q(f,"reason")+")"
]);
register("humanoidDamage","Damage humanoid","Players",{humanoid:"humanoid",amount:"10"},(f,s)=>[
  s+e(f,"humanoid","humanoid")+":TakeDamage("+e(f,"amount","0")+")"
]);
register("humanoidHealth","Set humanoid health","Players",{humanoid:"humanoid",health:"100"},(f,s)=>[
  s+e(f,"humanoid","humanoid")+".Health = "+e(f,"health")
]);
register("humanoidSpeed","Set walk speed","Players",{humanoid:"humanoid",speed:"16"},(f,s)=>[
  s+e(f,"humanoid","humanoid")+".WalkSpeed = "+e(f,"speed")
]);
register("humanoidJump","Set jump height","Players",{humanoid:"humanoid",height:"7.2"},(f,s)=>[
  s+e(f,"humanoid","humanoid")+".JumpHeight = "+e(f,"height")
]);
register("humanoidState","Change humanoid state","Players",{humanoid:"humanoid",state:"Jumping"},(f,s)=>[
  s+e(f,"humanoid","humanoid")+":ChangeState(Enum.HumanoidStateType."+f.state+")"
]);

// Constructors and useful math/visual data
getter("vector3New","Make Vector3","Vectors",{name:"Position",x:"0",y:"10",z:"0"},f=>
  "Vector3.new("+e(f,"x")+", "+e(f,"y")+", "+e(f,"z")+")");
getter("vector2New","Make Vector2","Vectors",{name:"Point",x:"0",y:"0"},f=>
  "Vector2.new("+e(f,"x")+", "+e(f,"y")+")");
getter("colorRGB","Color from RGB","Vectors",{name:"Color",r:"255",g:"100",b:"50"},f=>
  "Color3.fromRGB("+e(f,"r")+", "+e(f,"g")+", "+e(f,"b")+")");
getter("colorHSV","Color from HSV","Vectors",{name:"Color",h:"0.5",s:"1",v:"1"},f=>
  "Color3.fromHSV("+e(f,"h")+", "+e(f,"s")+", "+e(f,"v")+")");
getter("cframeNew","Make CFrame","Vectors",{name:"Frame",x:"0",y:"5",z:"0"},f=>
  "CFrame.new("+e(f,"x")+", "+e(f,"y")+", "+e(f,"z")+")");
getter("udim2Scale","Make UDim2 scale","Vectors",{name:"Size",x:"0.5",y:"0.5"},f=>
  "UDim2.fromScale("+e(f,"x")+", "+e(f,"y")+")");
getter("udim2Offset","Make UDim2 offset","Vectors",{name:"Size",x:"100",y:"50"},f=>
  "UDim2.fromOffset("+e(f,"x")+", "+e(f,"y")+")");
getter("vectorDistance","Vector3 distance","Vectors",{name:"Distance",a:"workspace.A.Position",b:"workspace.B.Position"},f=>
  "("+e(f,"a")+" - "+e(f,"b")+").Magnitude");
getter("vectorLerp","Interpolate Vector3","Vectors",{name:"Result",a:"Vector3.zero",b:"Vector3.new(0, 10, 0)",alpha:"0.5"},f=>
  e(f,"a")+":Lerp("+e(f,"b")+", "+e(f,"alpha")+")");
getter("vectorMagnitude","Vector3 magnitude","Vectors",{name:"Magnitude",vector:"Vector3.new(1, 2, 3)"},f=>
  e(f,"vector")+".Magnitude");

// Signals, event listeners
event("eventChildAdded","Child added","Events",{target:"workspace"},f=>e(f,"target")+".ChildAdded","child");
event("eventChildRemoved","Child removed","Events",{target:"workspace"},f=>e(f,"target")+".ChildRemoved","child");
event("eventAttribute","Attribute changed","Events",{target:"workspace.Door",attribute:"Open"},f=>
  e(f,"target")+":GetAttributeChangedSignal("+q(f,"attribute")+")");
event("eventHumanoidDied","Humanoid died","Events",{humanoid:"humanoid"},f=>e(f,"humanoid")+".Died");
event("eventProximity","ProximityPrompt triggered","Events",{prompt:"workspace.Door.ProximityPrompt"},f=>e(f,"prompt")+".Triggered","player");
event("eventClick","ClickDetector clicked","Events",{detector:"workspace.Button.ClickDetector"},f=>e(f,"detector")+".MouseClick","player");
event("eventHeartbeat","RunService Heartbeat","Events",{},()=>'game:GetService("RunService").Heartbeat',"deltaTime");
event("eventRenderStep","RunService RenderStepped (client)","Events",{},()=>'game:GetService("RunService").RenderStepped',"deltaTime");
event("eventTouchedEnded","Touch ended","Events",{part:"workspace.Pad"},f=>e(f,"part")+".TouchEnded","otherPart");

// Networking: server/client caveats shown in lint
register("remoteFireServer","Remote FireServer (client)","Networking",{remote:"game.ReplicatedStorage.GameEvent",value:"100"},(f,s)=>[
  s+e(f,"remote")+":FireServer("+e(f,"value")+")"
]);
register("remoteFireClient","Remote FireClient (server)","Networking",{remote:"game.ReplicatedStorage.GameEvent",player:"player",value:"100"},(f,s)=>[
  s+e(f,"remote")+":FireClient("+e(f,"player")+", "+e(f,"value")+")"
]);
register("remoteFireAll","Remote FireAllClients (server)","Networking",{remote:"game.ReplicatedStorage.GameEvent",value:"100"},(f,s)=>[
  s+e(f,"remote")+":FireAllClients("+e(f,"value")+")"
]);
getter("remoteInvokeServer","Remote InvokeServer (client)","Networking",{name:"Result",remote:"game.ReplicatedStorage.ServerCall",value:"100"},f=>
  e(f,"remote")+":InvokeServer("+e(f,"value")+")");
event("remoteClientEvent","Remote OnClientEvent (client)","Networking",{remote:"game.ReplicatedStorage.GameEvent"},f=>
  e(f,"remote")+".OnClientEvent","value");
register("remoteMakeEvent","Create RemoteEvent (server)","Networking",{name:"Event",parent:'game:GetService("ReplicatedStorage")',eventName:"GameEvent"},(f,s)=>[
  s+"local "+f.name+' = Instance.new("RemoteEvent")',
  s+f.name+".Name = "+q(f,"eventName"),
  s+f.name+".Parent = "+e(f,"parent")
]);

// UI helpers
register("uiText","Set TextLabel text","UI",{target:"script.Parent.TextLabel",value:'"Hello world!"'},(f,s)=>[
  s+e(f,"target")+".Text = "+e(f,"value")
]);
register("uiVisible","Set UI visibility","UI",{target:"script.Parent.Frame",visible:"true"},(f,s)=>[
  s+e(f,"target")+".Visible = "+e(f,"visible")
]);
register("uiSize","Set UI size","UI",{target:"script.Parent.Frame",size:"UDim2.fromScale(0.5, 0.5)"},(f,s)=>[
  s+e(f,"target")+".Size = "+e(f,"size")
]);
register("uiPosition","Set UI position","UI",{target:"script.Parent.Frame",position:"UDim2.fromScale(0.25, 0.25)"},(f,s)=>[
  s+e(f,"target")+".Position = "+e(f,"position")
]);
register("uiColor","Set UI background color","UI",{target:"script.Parent.Frame",color:"Color3.fromRGB(60, 120, 255)"},(f,s)=>[
  s+e(f,"target")+".BackgroundColor3 = "+e(f,"color")
]);
register("uiTween","Tween UI object","UI",{target:"script.Parent.Frame",seconds:"0.3",properties:'{Transparency = 0.5}'},(f,s)=>[
  s+'game:GetService("TweenService"):Create('+e(f,"target")+", TweenInfo.new("+e(f,"seconds")+"), "+e(f,"properties")+"):Play()"
]);
event("uiButtonClick","TextButton clicked","UI",{button:"script.Parent.TextButton"},f=>e(f,"button")+".MouseButton1Click");
event("uiFocusLost","TextBox focus lost","UI",{textbox:"script.Parent.TextBox"},f=>e(f,"textbox")+".FocusLost","enterPressed");

// Data / serialization and scheduling
getter("jsonEncode","JSON encode","Data",{name:"Json",value:"{}"},f=>
  'game:GetService("HttpService"):JSONEncode('+e(f,"value")+")");
getter("jsonDecode","JSON decode","Data",{name:"Data",value:'"{\\"coins\\":10}"'},f=>
  'game:GetService("HttpService"):JSONDecode('+e(f,"value")+")");
getter("getTime","Get server time","Data",{name:"Now"},()=>"workspace:GetServerTimeNow()");
getter("getUnixTime","Get Unix timestamp","Data",{name:"UnixTime"},()=>"os.time()");
register("taskDelay","Delay a task","Data",{seconds:"1"},(f,s,emit,b)=>[
  s+"task.delay("+e(f,"seconds")+", function()",...emit(b.body,Math.round(s.length/4)+1),s+"end)"
],["body"]);
register("taskDefer","Defer a task","Data",{},(f,s,emit,b)=>[
  s+"task.defer(function()",...emit(b.body,Math.round(s.length/4)+1),s+"end)"
],["body"]);
register("warnOutput","Warn to output","Data",{value:'"Something happened"'},(f,s)=>[
  s+"warn("+e(f,"value")+")"
]);
register("assertCondition","Assert condition","Data",{value:"true",message:"Assertion failed"},(f,s)=>[
  s+"assert("+e(f,"value")+", "+q(f,"message")+")"
]);
getter("getAttributeChildren","Get attributes map","Data",{name:"Attributes",target:"workspace.Door"},f=>
  e(f,"target")+":GetAttributes()");

// DataStore practices: async calls must be protected and servers only.
// Generated source explicitly uses pcall and provides ok and result locals.
register("datastoreGet","DataStore GetAsync (server)","Data",{name:"Value",storeName:"PlayerDataV1",key:'tostring(player.UserId)'},(f,s)=>{
  const store=f.name+"Store",ok=f.name+"Ok";
  return [
    s+'local '+store+' = game:GetService("DataStoreService"):GetDataStore('+q(f,"storeName")+")",
    s+"local "+ok+", "+f.name+" = pcall(function()",
    s+"    return "+store+":GetAsync("+e(f,"key")+")",
    s+"end)",
    s+"if not "+ok+" then warn("+f.name+"); "+f.name+" = nil end"
  ];
});
register("datastoreSet","DataStore SetAsync (server)","Data",{storeName:"PlayerDataV1",key:'tostring(player.UserId)',value:"Coins"},(f,s)=>{
  const token="es"+Math.abs(String(f.storeName).length+String(f.key).length);
  return [
    s+"local "+token+'Store = game:GetService("DataStoreService"):GetDataStore('+q(f,"storeName")+")",
    s+"local "+token+"Ok, "+token+"Err = pcall(function()",
    s+"    "+token+"Store:SetAsync("+e(f,"key")+", "+e(f,"value")+")",
    s+"end)",
    s+"if not "+token+"Ok then warn("+token+"Err) end"
  ];
});

// Factories do not use eval and never output implicit newlines inside assignments.
export const ROBLOX_DEFINITIONS=Object.fromEntries(Object.entries(table).map(([k,v])=>[k,v.definition]));
export const ROBLOX_TYPES=new Set(Object.keys(table));
export function robloxCode(block,language,level,emit){
  const entry=table[block.type];
  if(!entry)return null;
  const s="    ".repeat(level);
  if(language==="javascript")return [s+"// Roblox-only block: "+entry.definition.name+" (switch to Luau)"];
  return entry.build(block.fields,s,emit,block);
}
export function robloxDiagnostics(block,language,context={}){
  const entry=table[block.type];if(!entry)return [];
  const issues=[],f=block.fields;
  const issue=(message,severity="error")=>issues.push({id:block.id,message,severity});
  if(language==="javascript")issue("Roblox block is Luau-only: "+entry.definition.name,"warning");
  for(const key of Object.keys(entry.definition.fields)){
    if(/[\r\n]/.test(String(f[key]??"")))issue("Field "+key+" must be a single line");
    if(f[key]===undefined||!String(f[key]).trim())issue("Missing field: "+key);
  }
  const pathFields=new Set(["target","parent","humanoid","player","character","detector","prompt","part","button","textbox","remote"]);
  for(const key of pathFields){
    if(key in f&&!dottedPathOK(f[key])&&!/^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*(?:\([^)]*\))?$/.test(String(f[key])))
      issue("Expression "+key+" requires a dotted Roblox reference (or a simple call).");
  }
  const identifierFields=new Set(["name"]);
  for(const key of identifierFields)if(key in f&&!identifierOK(f[key]))issue("Invalid output name: "+f[key]);
  if(block.type==="humanoidState"&&!identifierOK(f.state))issue("Invalid Humanoid state");
  if(block.type==="globalWrite"||block.type==="globalRead"||block.type==="globalIncrease"||block.type==="globalDelete")
    issue("_G is shared only inside the same Luau execution environment, not across server/client. Prefer ModuleScripts or RemoteEvents for larger systems.","warning");
  if(block.type.startsWith("datastore"))issue("DataStore requests are server-only; handle budgets, retries, schema and successful writes in production.","warning");
  if(["remoteInvokeServer","remoteFireServer","eventRenderStep","playerLocal","remoteClientEvent"].includes(block.type))
    issue("This API should run in a LocalScript on the client.","warning");
  if(["remoteFireClient","remoteFireAll","remoteMakeEvent","datastoreGet","datastoreSet"].includes(block.type))
    issue("This API should run in a server Script, not a LocalScript.","warning");
  if(["uiFocusLost","uiButtonClick"].includes(block.type))
    issue("Most player input and UI actions belong in a LocalScript.","warning");
  return issues;
}
