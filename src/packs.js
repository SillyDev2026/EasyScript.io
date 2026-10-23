// Educational starter packs built with real block definitions. No code strings or eval.
export const PACKS=[
  {id:"globalCounter",title:"Luau · Simple globals",language:"luau"},
  {id:"uiButton",title:"Roblox · UI button",language:"luau"},
  {id:"doorPrompt",title:"Roblox · Door prompt",language:"luau"},
  {id:"playerData",title:"Roblox · Player DataStore read",language:"luau"},
  {id:"remoteReply",title:"Roblox · Client response",language:"luau"},
  {id:"vectors",title:"Roblox · Vectors & colors",language:"luau"},
  {id:"jsPage",title:"JavaScript · DOM text",language:"javascript"},
  {id:"jsStorage",title:"JavaScript · Local storage",language:"javascript"},
  {id:"jsRequest",title:"JavaScript · Fetch JSON",language:"javascript"}
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
      b("datastoreGet",{name:"SavedCoins"}),
      b("leaderstat",{initial:"SavedCoins or 0"}),
      b("comment",{text:"Add retry and SetAsync/UpdateAsync saving for production; this example only loads."})
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
  }
  return p;
}
