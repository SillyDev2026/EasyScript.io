// Educational starter packs built with real block definitions. No code strings or eval.
export const PACKS=[
  {id:"globalCounter",title:"Luau · Script-local counter",language:"luau"},
  {id:"uiButton",title:"Roblox · UI button",language:"luau"},
  {id:"doorPrompt",title:"Roblox · Door prompt",language:"luau"},
  {id:"playerData",title:"Roblox · Leaderstats + DataStore",language:"luau"},
  {id:"remoteReply",title:"Roblox · Client response",language:"luau"},
  {id:"vectors",title:"Roblox · Vectors & colors",language:"luau"},
  {id:"jsPage",title:"JavaScript · DOM text",language:"javascript"},
  {id:"jsStorage",title:"JavaScript · Local storage",language:"javascript"},
  {id:"jsRequest",title:"JavaScript · Fetch JSON",language:"javascript"},
  {id:"luaAttributeWatch",title:"Luau · Attribute tracking",language:"luau"},
  {id:"luaTweenDemo",title:"Luau · Tween animation",language:"luau"},
  {id:"luaPromptDemo",title:"Luau · Prompt interaction",language:"luau"},
  {id:"luaJsonDemo",title:"Luau · JSON encode/decode",language:"luau"},
  {id:"jsArrayDemo",title:"JavaScript · Array transformations",language:"javascript"},
  {id:"jsMapDemo",title:"JavaScript · Map and Set",language:"javascript"},
  {id:"jsFormDemo",title:"JavaScript · Form events",language:"javascript"},
  {id:"jsQueryDemo",title:"JavaScript · URL parameters",language:"javascript"}
];
export function packTemplate(type,make){
  const info=PACKS.find(x=>x.id===type);if(!info)return null;
  const p={schema:1,title:info.title,language:info.language,blocks:[]};
  const b=(kind,fields={})=>{
    const block=make(kind);
    Object.assign(block.fields,fields);
    return block;
  };
  if(type==="globalCounter"){
    p.blocks=[b("globalWrite"),b("globalIncrease"),b("globalRead"),b("print",{value:"Coins"})];
  }else if(type==="uiButton"){
    const clicked=b("uiButtonClick");
    clicked.body.push(b("uiText",{value:'"Clicked!"'}));
    p.blocks=[clicked];
  }else if(type==="doorPrompt"){
    const prompt=b("eventProximity");
    prompt.body.push(
      b("setProperty",{target:"workspace.Door",property:"CanCollide",value:"false"}),
      b("setProperty",{target:"workspace.Door",property:"Transparency",value:"0.65"})
    );
    p.blocks=[prompt];
  }else if(type==="playerData"){
    const player=b("playerJoined");
    player.body.push(
      b("datastoreGet",{name:"savedCoins"}),
      b("leaderstat",{initial:"savedCoins or 0"})
    );
    p.blocks=[player];
  }else if(type==="remoteReply"){
    const server=b("remoteReceived");
    server.body.push(
      b("comment",{text:"Validate data and rate-limit the RemoteEvent before replying."}),
      b("remoteFireClient",{player:"player",value:'"Received!"'})
    );
    p.blocks=[server];
  }else if(type==="vectors"){
    p.blocks=[b("vector3New"),b("cframeNew"),b("colorRGB"),b("vectorDistance")];
  }else if(type==="jsPage"){
    p.blocks=[
      b("jsQuery",{name:"Header",selector:"#title"}),
      b("jsSetText",{target:"Header",value:'"Welcome!"'})
    ];
  }else if(type==="jsStorage"){
    p.blocks=[
      b("jsStorageWrite",{key:"username",value:'"Visitor"'}),
      b("jsStorageRead",{name:"Username",key:"username"}),
      b("print",{value:"Username"})
    ];
  }else if(type==="jsRequest"){
    p.blocks=[
      b("jsFetchJson",{name:"ResponseData",url:'"/api/data"'}),
      b("print",{value:"ResponseData"})
    ];
  }else if(type==="luaAttributeWatch"){
    p.blocks=[
      b("luaGetAttribute",{name:"health",target:"workspace.Part",attribute:"Health"}),
      b("print",{value:"health"}),
      b("luaAttributeChanged",{target:"workspace.Part",attribute:"Health"})
    ];
    p.blocks[2].body.push(b("luaGetAttribute",{name:"updated",target:"workspace.Part",attribute:"Health"}),b("print",{value:"updated"}));
  }else if(type==="luaTweenDemo"){
    p.blocks=[b("luaCreateTween",{name:"tween",target:"workspace.Part",duration:"0.8",goals:"{Transparency = 0.5}"}),b("luaPlayTween",{tween:"tween"})];
  }else if(type==="luaPromptDemo"){
    const event=b("luaPromptTriggered",{prompt:"workspace.Part.ProximityPrompt"});
    event.body.push(b("print",{value:"player.Name"}));
    p.blocks=[event];
  }else if(type==="luaJsonDemo"){
    p.blocks=[b("luaJSONEncode",{name:"encoded",value:"{Coins = 10}"}),
      b("luaJSONDecode",{name:"decoded",source:"encoded"}),b("print",{value:"decoded.Coins"})];
  }else if(type==="jsArrayDemo"){
    p.blocks=[b("variable",{name:"items",value:"[1, 2, 3]"}),
      b("js21ArrayMap",{name:"doubled",array:"items",expression:"item * 2"}),
      b("js21ArrayFilter",{name:"large",array:"doubled",condition:"item > 2"}),
      b("print",{value:"large"})];
  }else if(type==="jsMapDemo"){
    p.blocks=[b("js21NewMap",{name:"itemsMap"}),b("js21MapSet",{target:"itemsMap",key:'"Coins"',value:"50"}),
      b("js21MapGet",{name:"coins",target:"itemsMap",key:'"Coins"'}),
      b("print",{value:"coins"}),b("js21NewSet",{name:"unique"}),
      b("js21SetAdd",{target:"unique",value:"coins"})];
  }else if(type==="jsFormDemo"){
    p.blocks=[b("jsQuery",{name:"form",selector:"#my-form"})];
    const submit=b("js21SubmitEvent",{target:"form"});
    submit.body.push(b("jsWarn",{value:'"Form submitted: preventDefault if handling asynchronously"'}));
    p.blocks.push(submit);
  }else if(type==="jsQueryDemo"){
    p.blocks=[b("js21URLParams",{name:"params",query:"window.location.search"}),
      b("js21URLGet",{name:"page",params:"params",key:"page"}),b("print",{value:"page"})];
  }
  return p;
}
