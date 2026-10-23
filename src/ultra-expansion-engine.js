import {DEFINITIONS,traverse,lint,generate} from "./engine.js";
const q=value=>JSON.stringify(String(value??""));
const integer=(value,min,max,defaultValue)=>{
 const n=Number(value);
 return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):defaultValue;
};
const safeName=(name,fallback)=>{
 const clean=String(name??"").trim();
 return /^[A-Za-z_][A-Za-z0-9_]*$/.test(clean)?clean:fallback;
};
export function remoteGuardTemplate({event="GameEvent",max=100,cooldown=0.25}={}){
 event=safeName(event,"GameEvent");
 const limit=integer(max,1,100000,100);
 const seconds=Number.isFinite(Number(cooldown))?Math.min(60,Math.max(0.05,Number(cooldown))):0.25;
 return [
  '-- Server Script · generated RemoteEvent guard',
  'local Players = game:GetService("Players")',
  'local ReplicatedStorage = game:GetService("ReplicatedStorage")',
  'local remote = ReplicatedStorage:WaitForChild('+q(event)+')',
  'local lastCall = {}',
  '',
  'remote.OnServerEvent:Connect(function(player, amount)',
  '    if not player or not player:IsDescendantOf(Players) then return end',
  '    if typeof(amount) ~= "number" or amount ~= amount or amount < 0 or amount > '+limit+' then return end',
  '    local now = os.clock()',
  '    if lastCall[player] and now - lastCall[player] < '+seconds+' then return end',
  '    lastCall[player] = now',
  '    -- TODO: check player permissions and handle the approved action.',
  'end)',
  '',
  'Players.PlayerRemoving:Connect(function(player)',
  '    lastCall[player] = nil',
  'end)',
  ''
 ].join("\n");
}
export function guiTemplate({name="EasyGui",label="Play",width=270,height=90}={}){
 const gui=safeName(name,"EasyGui"),w=integer(width,90,1100,270),h=integer(height,35,700,90);
 return [
  '-- LocalScript · place in StarterPlayerScripts or client context',
  'local Players = game:GetService("Players")',
  'local player = Players.LocalPlayer',
  'local gui = Instance.new("ScreenGui")',
  'gui.Name = '+q(gui),
  'gui.ResetOnSpawn = false',
  'gui.Parent = player:WaitForChild("PlayerGui")',
  '',
  'local frame = Instance.new("Frame")',
  'frame.Size = UDim2.fromOffset('+w+', '+h+')',
  'frame.Position = UDim2.fromScale(0.5, 0.5)',
  'frame.AnchorPoint = Vector2.new(0.5, 0.5)',
  'frame.BackgroundColor3 = Color3.fromRGB(34, 53, 81)',
  'frame.Parent = gui',
  '',
  'local button = Instance.new("TextButton")',
  'button.Size = UDim2.fromScale(1, 1)',
  'button.Text = '+q(String(label).slice(0,100)),
  'button.TextScaled = true',
  'button.Parent = frame',
  '',
  'button.Activated:Connect(function()',
  '    print("Button activated")',
  'end)',
  ''
 ].join("\n");
}
export function simulateDataStore({failurePattern=[false,false,true],retries=3,initial=0,increment=10}={}){
 const attempts=Math.min(10,Math.max(1,integer(retries,1,10,3))),history=[];
 let value=Number(initial)||0,ok=false;
 for(let i=0;i<attempts;i++){
  const failed=Boolean(failurePattern[i]??false);
  history.push({attempt:i+1,status:failed?"failed":"success",value:failed?value:value+(Number(increment)||0)});
  if(!failed){value+=Number(increment)||0;ok=true;break;}
 }
 return {success:ok,value,attempts:history.length,history,
  disclaimer:"Local deterministic retry demonstration only. It does not access Roblox DataStores or simulate request budgets."};
}
export function staticSecurityReport(project){
 const issues=[],counts={blocks:0,remotes:0,datas:0,frames:0,callbacks:0};
 traverse(project.blocks,b=>{
  if(b.disabled)return;
  counts.blocks++;
  if(["remoteReceived","remoteServerFunction","remoteFireServer","remoteOnServerInvoke"].includes(b.type)){
   counts.remotes++;
   issues.push({blockId:b.id,severity:"warning",message:"Remote boundary requires server authorization, validation and rate limiting."});
  }
  if(["datastoreGet","datastoreSet","datastoreUpdate","memoryQueue","memorySortedMap"].includes(b.type)){
   counts.datas++;
   issues.push({blockId:b.id,severity:"warning",message:"Data requests may throttle or fail; handle retry budgets and server-only access."});
  }
  if(["eventHeartbeat","eventRenderStep"].includes(b.type))counts.frames++;
  if((DEFINITIONS[b.type]?.branches||[]).length)counts.callbacks++;
 });
 for(const issue of lint(project).filter(x=>x.severity==="error"))issues.push({blockId:issue.id,severity:"error",message:issue.message});
 const source=generate(project);
 return {counts,issues,generatedLines:source.split("\n").length-1,
  disclaimer:"Static guidance only: neither a live runtime profiler nor a formal security audit."};
}
export function visualTestTemplate({variable="Coins",expected=100}={}){
 const name=safeName(variable,"Coins");
 return [
  '-- Educational Luau assertion; put this in a relevant test Script',
  'local function assertEqual(actual, expected, label)',
  '    assert(actual == expected, (label or "Test") .. ": expected " .. tostring(expected) .. ", got " .. tostring(actual))',
  'end',
  '',
  'local '+name+' = '+integer(expected,-1000000,1000000,100),
  'assertEqual('+name+', '+integer(expected,-1000000,1000000,100)+', '+q(name)+')',
  'print("EasyScript test passed")',
  ''
 ].join("\n");
}
