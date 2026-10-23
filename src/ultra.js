import {DEFINITIONS,generate,lint} from "./engine.js";

export const SYSTEM_KINDS = Object.freeze([
  {id:"speed",name:"Speed Pad",description:"Temporary server-side speed boost"},
  {id:"coins",name:"Coin Pickup",description:"Award a leaderstat on touch with cooldown"},
  {id:"checkpoint",name:"Checkpoint",description:"Respawn at a SpawnLocation"}
]);
const finite=(v,min,max,fallback)=>{
  const n=Number(v);
  return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;
};
export function generateRobloxSystem(kind,options={}){
  const note=["-- EasyScript Ultra · Server Script inside the relevant Part","-- Review and test in Roblox Studio",""];
  let lines=[];
  if(kind==="speed"){
    const speed=finite(options.speed,16,100,32);
    const seconds=finite(options.duration,0.5,120,5);
    lines=[
      'local Players = game:GetService("Players")',
      "local pad = script.Parent",
      "local active = {}",
      "",
      "pad.Touched:Connect(function(hit)",
      '    local character = hit:FindFirstAncestorOfClass("Model")',
      "    if not character then return end",
      '    local humanoid = character:FindFirstChildOfClass("Humanoid")',
      "    local player = Players:GetPlayerFromCharacter(character)",
      "    if not player or not humanoid or humanoid.Health <= 0 or active[humanoid] then return end",
      "    active[humanoid] = true",
      "    local previousSpeed = humanoid.WalkSpeed",
      "    humanoid.WalkSpeed = "+speed,
      "    task.delay("+seconds+", function()",
      "        if humanoid.Parent and humanoid.WalkSpeed == "+speed+" then",
      "            humanoid.WalkSpeed = previousSpeed",
      "        end",
      "        active[humanoid] = nil",
      "    end)",
      "end)"
    ];
  }else if(kind==="coins"){
    const stat=String(options.stat??"Coins").trim().slice(0,60)||"Coins";
    const amount=Math.round(finite(options.amount,1,100000,10));
    const cooldown=finite(options.cooldown,0.25,120,3);
    lines=[
      'local Players = game:GetService("Players")',
      "local pickup = script.Parent",
      "local cooldowns = {}",
      "",
      "pickup.Touched:Connect(function(hit)",
      '    local character = hit:FindFirstAncestorOfClass("Model")',
      "    if not character then return end",
      "    local player = Players:GetPlayerFromCharacter(character)",
      "    if not player or cooldowns[player] then return end",
      '    local stats = player:FindFirstChild("leaderstats")',
      "    local coins = stats and stats:FindFirstChild("+JSON.stringify(stat)+")",
      '    if not coins or not coins:IsA("IntValue") then return end',
      "    cooldowns[player] = true",
      "    coins.Value += "+amount,
      "    task.delay("+cooldown+", function()",
      "        cooldowns[player] = nil",
      "    end)",
      "end)",
      "",
      "Players.PlayerRemoving:Connect(function(player)",
      "    cooldowns[player] = nil",
      "end)"
    ];
  }else if(kind==="checkpoint"){
    lines=[
      'local Players = game:GetService("Players")',
      "local checkpoint = script.Parent",
      'assert(checkpoint:IsA("SpawnLocation"), "Place this Script inside a SpawnLocation")',
      "",
      "checkpoint.Touched:Connect(function(hit)",
      '    local character = hit:FindFirstAncestorOfClass("Model")',
      "    if not character then return end",
      "    local player = Players:GetPlayerFromCharacter(character)",
      "    if player and player.RespawnLocation ~= checkpoint then",
      "        player.RespawnLocation = checkpoint",
      "    end",
      "end)"
    ];
  }else throw new Error("Unknown Roblox system: "+kind);
  return note.concat(lines).join("\n")+"\n";
}

export function outlineProject(project){
  const out=[];
  function walk(list,depth,branch){
    for(const block of list){
      const definition=DEFINITIONS[block.type];
      if(!definition)continue;
      out.push({id:block.id,type:block.type,label:definition.name,depth,branch,
        description:Object.values(block.fields||{}).slice(0,2).join(" · ").slice(0,90)});
      for(const key of definition.branches||[])walk(block[key]||[],depth+1,key);
    }
  }
  walk(project.blocks||[],0,"root");
  return out;
}

export function auditProject(project){
  const blocks=outlineProject(project);
  const code=generate(project);
  const diagnostics=lint(project);
  const findings=[];
  const suggest=(id,severity,message,advice)=>findings.push({id,severity,message,advice});
  if(blocks.length>150)suggest(null,"warning","Large visual workspace","Split logic into functions and export regular backups.");
  if(blocks.some(b=>b.depth>=8))suggest(null,"warning","Deep nesting","Simplify nested conditions or extract functions.");
  let loops=0,events=0;
  for(const block of blocks){
    const raw=findBlock(project.blocks,block.id);
    if(block.type==="while"){
      loops++;
      suggest(block.id,"warning","While loop can run indefinitely","Ensure the condition eventually becomes false; yield during continuous Roblox loops.");
    }
    if(block.type==="repeat"){
      loops++;
      const count=Number(raw?.fields?.count);
      if(Number.isFinite(count)&&count>10000)suggest(block.id,"warning","High repeat count","Cap repeated work or break it across frames.");
    }
    if(block.type==="remoteReceived"){
      events++;
      suggest(block.id,"warning","RemoteEvent trust boundary","Validate client types, ranges, rate limits and authorization on the server.");
    }
    if(block.type==="partTouched"||block.type==="playerJoined")events++;
  }
  const errors=diagnostics.filter(x=>x.severity==="error").length;
  const warnings=diagnostics.filter(x=>x.severity==="warning").length;
  const score=blocks.length?Math.max(0,100-errors*16-warnings*3-findings.length*7):100;
  return {score,blocks:blocks.length,lines:code.split("\n").length-1,characters:code.length,
    maxDepth:Math.max(0,...blocks.map(b=>b.depth)),loops,events,errors,warnings,findings,
    disclaimer:"Static suggestions only; not a runtime FPS, speed, security, or memory benchmark."};
}
function findBlock(list,id){
  for(const block of list){
    if(block.id===id)return block;
    for(const key of DEFINITIONS[block.type]?.branches||[]){
      const nested=findBlock(block[key]||[],id);
      if(nested)return nested;
    }
  }
  return null;
}
