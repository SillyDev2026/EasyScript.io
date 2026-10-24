// EasyScript 2.1 additional Roblox Luau catalog.
// All generated variables are local and function/event bodies are explicit.
import {inlineExpression,identifierOK} from "./format.js";
const blocks={};
const add=(id,name,group,fields,render,branches=[])=>{
 blocks[id]={name,group:"Roblox · "+group,color:"teal",fields,branches,render};
};
const expr=(f,k,fallback="nil")=>inlineExpression(f[k],fallback);
const lit=(f,k)=>JSON.stringify(String(f[k]??""));
const value=(id,name,group,fields,render)=>add(id,name,group,fields,(f,s,emit,b,ctx)=>[s+"local "+f.name+" = "+render(f,ctx)]);
const act=(id,name,group,fields,render)=>add(id,name,group,fields,(f,s,emit,b,ctx)=>[s+render(f,ctx)]);
const event=(id,name,group,fields,signal,params)=>add(id,name,group,fields,(f,s,emit,b)=>{
 return [s+signal(f)+":Connect(function("+params+")",...emit(b.body,s.length/4+1),s+"end)"];
},["body"]);
const local=(ctx,base)=>ctx?.reserve?.(base)||base;
value("luaWaitForChild","Wait for child","Instances",{name:"child",target:"script.Parent",child:"Part",timeout:"5"},
 f=>expr(f,"target")+":WaitForChild("+lit(f,"child")+", "+expr(f,"timeout")+")");
value("luaFindClass","Find child of class","Instances",{name:"found",target:"workspace",className:"Part"},
 f=>expr(f,"target")+":FindFirstChildWhichIsA("+lit(f,"className")+")");
value("luaChildren","Get children list","Instances",{name:"children",target:"workspace"},f=>expr(f,"target")+":GetChildren()");
value("luaDescendants","Get descendants list","Instances",{name:"descendants",target:"workspace"},f=>expr(f,"target")+":GetDescendants()");
value("luaIsA","Check instance class","Instances",{name:"isPart",target:"workspace.Part",className:"BasePart"},
 f=>expr(f,"target")+":IsA("+lit(f,"className")+")");
act("luaDestroy","Destroy instance","Instances",{target:"workspace.Part"},f=>expr(f,"target")+":Destroy()");
value("luaClone","Clone instance","Instances",{name:"copy",source:"workspace.Part"},
 f=>expr(f,"source")+":Clone()");
act("luaPivotTo","Pivot model","Instances",{target:"workspace.Model",cframe:"CFrame.new(0, 5, 0)"},
 f=>expr(f,"target")+":PivotTo("+expr(f,"cframe")+")");
value("luaGetPivot","Get model pivot","Instances",{name:"pivot",target:"workspace.Model"},
 f=>expr(f,"target")+":GetPivot()");
act("luaSetAttribute","Set attribute","Instances",{target:"workspace.Part",attribute:"Health",value:"100"},
 f=>expr(f,"target")+":SetAttribute("+lit(f,"attribute")+", "+expr(f,"value")+")");
value("luaGetAttribute","Read attribute","Instances",{name:"health",target:"workspace.Part",attribute:"Health"},
 f=>expr(f,"target")+":GetAttribute("+lit(f,"attribute")+")");
event("luaAttributeChanged","Attribute changed","Events",{target:"workspace.Part",attribute:"Health"},
 f=>expr(f,"target")+":GetAttributeChangedSignal("+lit(f,"attribute")+")","");
value("luaTagged","List tagged instances","Instances",{name:"tagged",tag:"Enemy"},
 f=>'game:GetService("CollectionService"):GetTagged('+lit(f,"tag")+")");
value("luaHasTag","Has CollectionService tag","Instances",{name:"hasTag",target:"workspace.Part",tag:"Enemy"},
 f=>'game:GetService("CollectionService"):HasTag('+expr(f,"target")+", "+lit(f,"tag")+")");
value("luaNewCFrame","Create CFrame from position","Math",{name:"positionCFrame",x:"0",y:"5",z:"0"},
 f=>"CFrame.new("+expr(f,"x")+", "+expr(f,"y")+", "+expr(f,"z")+")");
value("luaVectorMagnitude","Vector3 magnitude","Math",{name:"distance",vector:"Vector3.new(3, 4, 0)"},
 f=>expr(f,"vector")+".Magnitude");
value("luaVectorUnit","Vector3 unit direction","Math",{name:"direction",vector:"Vector3.new(1, 0, 0)"},
 f=>expr(f,"vector")+".Unit");
value("luaVectorLerp","Lerp Vector3","Math",{name:"blended",from:"Vector3.zero",to:"Vector3.new(0, 10, 0)",alpha:"0.5"},
 f=>expr(f,"from")+":Lerp("+expr(f,"to")+", "+expr(f,"alpha")+")");
value("luaColorFromRGB","Color3 RGB","UI",{name:"accent",red:"80",green:"140",blue:"255"},
 f=>"Color3.fromRGB("+expr(f,"red")+", "+expr(f,"green")+", "+expr(f,"blue")+")");
value("luaUDim2Scale","UDim2 scale coordinates","UI",{name:"size",x:"1",y:"0.5"},
 f=>"UDim2.fromScale("+expr(f,"x")+", "+expr(f,"y")+")");
value("luaCreateTween","Create TweenService tween","Animation",{name:"tween",target:"workspace.Part",duration:"0.6",goals:"{Transparency = 0.5}"},
 f=>'game:GetService("TweenService"):Create('+expr(f,"target")+", TweenInfo.new("+expr(f,"duration")+"), "+expr(f,"goals")+")");
act("luaPlayTween","Play tween","Animation",{tween:"tween"},f=>expr(f,"tween")+":Play()");
act("luaCancelTween","Cancel tween","Animation",{tween:"tween"},f=>expr(f,"tween")+":Cancel()");
act("luaPlayAnimation","Play animation track","Animation",{track:"track",fadeTime:"0.1"},
 f=>expr(f,"track")+":Play("+expr(f,"fadeTime")+")");
act("luaStopAnimation","Stop animation track","Animation",{track:"track",fadeTime:"0.1"},
 f=>expr(f,"track")+":Stop("+expr(f,"fadeTime")+")");
event("luaPromptTriggered","ProximityPrompt triggered","Events",{prompt:"workspace.Part.ProximityPrompt"},
 f=>expr(f,"prompt")+".Triggered","player");
event("luaInputBegan","UserInputService InputBegan (client)","Events",{},
 ()=>'game:GetService("UserInputService").InputBegan',"input, gameProcessed");
event("luaCharacterAdded","Character added for player","Players",{player:"player"},
 f=>expr(f,"player")+".CharacterAdded","character");
value("luaPlayerFromCharacter","Find player for character","Players",{name:"player",character:"character"},
 f=>'game:GetService("Players"):GetPlayerFromCharacter('+expr(f,"character")+")");
act("luaFireClient","Fire RemoteEvent to client (server)","Networking",{remote:"game.ReplicatedStorage.MyEvent",player:"player",value:"true"},
 f=>expr(f,"remote")+":FireClient("+expr(f,"player")+", "+expr(f,"value")+")");
act("luaFireAllClients","Fire RemoteEvent to all clients (server)","Networking",{remote:"game.ReplicatedStorage.MyEvent",value:"true"},
 f=>expr(f,"remote")+":FireAllClients("+expr(f,"value")+")");
act("luaInvokeServer","Invoke RemoteFunction server (client)","Networking",{name:"response",remote:"game.ReplicatedStorage.Request",value:"true"},
 (f,ctx)=>""); // overridden below because result is a declaration
blocks.luaInvokeServer.render=(f,s,emit,b,ctx)=>[
 s+"local "+f.name+" = "+expr(f,"remote")+":InvokeServer("+expr(f,"value")+")"
];
act("luaInvokeClient","Invoke RemoteFunction client (server)","Networking",{name:"response",remote:"game.ReplicatedStorage.Request",player:"player",value:"true"},()=> "");
blocks.luaInvokeClient.render=(f,s)=>[s+"local "+f.name+" = "+expr(f,"remote")+":InvokeClient("+expr(f,"player")+", "+expr(f,"value")+")"];
value("luaJSONDecode","Decode JSON with HttpService","Data",{name:"decoded",source:'"{\\"Coins\\":10}"'},
 f=>'game:GetService("HttpService"):JSONDecode('+expr(f,"source")+")");
value("luaJSONEncode","Encode JSON with HttpService","Data",{name:"encoded",value:"{Coins = 10}"},
 f=>'game:GetService("HttpService"):JSONEncode('+expr(f,"value")+")");
act("luaTaskDefer","Defer Luau callback","Tasks",{},()=> "");
blocks.luaTaskDefer.branches=["body"];blocks.luaTaskDefer.render=(f,s,emit,b)=>[
 s+"task.defer(function()",...emit(b.body,s.length/4+1),s+"end)"
];
act("luaTaskDelay","Run callback after delay","Tasks",{seconds:"1"},()=> "");
blocks.luaTaskDelay.branches=["body"];blocks.luaTaskDelay.render=(f,s,emit,b)=>[
 s+"task.delay("+expr(f,"seconds")+", function()",...emit(b.body,s.length/4+1),s+"end)"
];
value("luaGetServerTime","Server time now","Data",{name:"serverTime"},
 ()=>"workspace:GetServerTimeNow()");
value("luaRandomInteger","Random.new NextInteger","Math",{name:"roll",min:"1",max:"100"},
 f=>"Random.new():NextInteger("+expr(f,"min")+", "+expr(f,"max")+")");
export const LUAU_V21_DEFINITIONS=Object.fromEntries(Object.entries(blocks).map(([id,b])=>[id,{
 name:b.name,group:b.group,color:b.color,fields:b.fields,branches:b.branches
}]));
const USER_FIELDS=new Set(["name"]);
const LITERAL_FIELDS=new Set(["tag","attribute","child","className"]);
export function luauV21Code(block,language,level,emit,context){
 const def=blocks[block.type];
 if(!def)return null;
 const s="    ".repeat(level);
 if(language!=="luau")return [s+"// Roblox Luau-only block: "+def.name];
 return def.render(block.fields,s,emit,block,context);
}
export function luauV21Diagnostics(block,language){
 const def=blocks[block.type];if(!def)return [];
 const issues=[],problem=(severity,message)=>issues.push({id:block.id,severity,message});
 if(language!=="luau")problem("warning",def.name+" requires Roblox Luau");
 for(const [key,value] of Object.entries(block.fields||{})){
  const text=String(value??"");
  if(!text.trim())problem("error","Missing "+key+" for "+def.name);
  if(/[\r\n\u2028\u2029]/.test(text))problem("error","Field "+key+" must be a single line");
  if(USER_FIELDS.has(key)&&!identifierOK(text))problem("error","Invalid local variable identifier: "+text);
  if(LITERAL_FIELDS.has(key)&&text.length>160)problem("error","Literal "+key+" too long");
 }
 if(["luaFireClient","luaFireAllClients","luaInvokeClient","luaInvokeServer"].includes(block.type))
  problem("warning","Remote calls must be authorized and validated on the server");
 if(block.type==="luaVectorUnit")problem("warning","Unit vector of Vector3.zero has undefined direction; check magnitude");
 if(["luaJSONDecode","luaInvokeClient","luaInvokeServer","luaWaitForChild"].includes(block.type))
  problem("warning","This operation can fail or yield; add appropriate error/timeout handling");
 if(block.type==="luaInputBegan")problem("warning","InputBegan is client-only; place in a LocalScript");
 return issues;
}
