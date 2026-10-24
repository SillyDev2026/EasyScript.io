import {outlineProject,auditProject,generateRobloxSystem,SYSTEM_KINDS} from "./ultra.js";
import {normalizeLayoutPrefs,displayedPaneWidths,DEFAULT_LAYOUT} from "./responsive-layout.js";

const PREFS_KEY="easyscript_studio_v4";
const DEFAULTS={theme:"dark",density:"comfortable",...DEFAULT_LAYOUT,wrap:false,lines:true,focus:false,mobile:"workspace",favorites:[],recent:[]};
const node=(tag,cls,text)=>{
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(text!==undefined)el.textContent=text;
  return el;
};
function readPrefs(){
  try{
    const p=JSON.parse(localStorage.getItem(PREFS_KEY)||"{}");
    return {...DEFAULTS,...p,...normalizeLayoutPrefs(p),
      theme:p.theme==="light"?"light":"dark",
      density:p.density==="compact"?"compact":"comfortable",
      mobile:["blocks","workspace","code"].includes(p.mobile)?p.mobile:"workspace",
      focus:p.focus===true,wrap:p.wrap===true,lines:p.lines!==false,
      favorites:Array.isArray(p.favorites)?p.favorites.filter(x=>typeof x==="string").slice(0,30):[],
      recent:Array.isArray(p.recent)?p.recent.filter(x=>typeof x==="string").slice(0,8):[]};
  }catch{return {...DEFAULTS};}
}
export function mountStudio({getProject,notify,renderPalette}){
  const prefs=readPrefs();
  const savePrefs=()=>{try{localStorage.setItem(PREFS_KEY,JSON.stringify(prefs));}catch{}};
  const shell=document.querySelector(".app-shell");
  const toolbar=node("section","studio-toolbar");
  toolbar.setAttribute("aria-label","Studio display and quick tools");
  toolbar.innerHTML=[
    '<div class="studio-toolbar-top">',
    '<div class="studio-toolbar-title"><strong>Studio controls</strong><span>v2.1 · Adaptive workspace</span><span id="screenMode" class="studio-mode" role="status">Desktop</span></div>',
    '<div class="studio-toolbar-controls">',
    '<label>Theme <select id="themeChoice"><option value="dark">Midnight</option><option value="light">Daylight</option></select></label>',
    '<label>Density <select id="densityChoice"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>',
    '<button id="focusModeBtn" class="btn compact" type="button" aria-pressed="false">Focus mode</button>',
    '<button id="shortcutsBtn" class="btn compact ghost" type="button">Shortcuts ?</button>',
    '</div></div>',
    '<div class="studio-toolbar-bottom">',
    '<label class="studio-size-control">Blocks <input id="leftSize" type="range" min="15" max="31" step="1" aria-label="Blocks pane width percentage"><output id="leftPercent">19%</output></label>',
    '<label class="studio-size-control">Code <input id="rightSize" type="range" min="22" max="42" step="1" aria-label="Code pane width percentage"><output id="rightPercent">29%</output></label>',
    '<span class="studio-editor-share" title="Remaining available workspace width">Editor <output id="centerPercent">52%</output></span>',
    '<label class="studio-scale-control">UI scale <input id="uiScale" type="range" min="85" max="120" step="5" aria-label="Interface size percentage"><output id="uiScalePercent">100%</output></label>',
    '<label class="studio-switch"><input id="lineToggle" type="checkbox"> Line numbers</label>',
    '<label class="studio-switch"><input id="wrapToggle" type="checkbox"> Wrap code</label>',
    '<div class="studio-jump"><input id="blockJump" type="search" placeholder="Find a block in this script…" aria-label="Find block in project" autocomplete="off"><div id="jumpResults" class="jump-results" hidden></div></div>',
    '<button id="resetLayout" class="btn compact ghost" type="button">Reset layout</button>',
    '</div>',
    '<nav class="mobile-nav" aria-label="Mobile workspace views"><button type="button" data-view="blocks">Blocks</button><button type="button" data-view="workspace">Workspace</button><button type="button" data-view="code">Code</button></nav>'
  ].join("");
  shell.querySelector(".layout").before(toolbar);
  const $=id=>document.getElementById(id);

  const scrollToBlock=id=>{
    const el=[...document.querySelectorAll("[data-block-id]")].find(x=>x.dataset.blockId===id);
    if(!el){notify("Block is not visible");return;}
    if(window.matchMedia("(max-width: 760px)").matches){prefs.mobile="workspace";apply();}
    el.scrollIntoView({behavior:"smooth",block:"center"});
    el.classList.add("focused-problem");
    setTimeout(()=>el.classList.remove("focused-problem"),1600);
  };
  const pre=document.querySelector(".code-scroller");
  const gutter=node("div","code-gutter");gutter.setAttribute("aria-hidden","true");
  pre.insertBefore(gutter,$("codeOutput"));

  function updateGutter(){
    const n=Math.min(8000,$("codeOutput").textContent.split("\n").length);
    if(gutter.dataset.lines===String(n))return;
    gutter.textContent=Array.from({length:n},(_,i)=>String(i+1)).join("\n");
    gutter.dataset.lines=String(n);
  }
  function updateMode(){
    const widths=displayedPaneWidths(window.innerWidth,prefs);
    $("screenMode").textContent=widths.mode==="phone"?"Phone · 100% tabs":widths.mode==="tablet"?"Tablet · 2 panels":"Desktop · 3 panels";
    document.body.dataset.layoutMode=widths.mode;
  }
  function apply(){
    Object.assign(prefs,normalizeLayoutPrefs(prefs));
    document.documentElement.dataset.theme=prefs.theme;
    document.body.dataset.density=prefs.density;
    document.body.dataset.focus=String(prefs.focus);
    document.body.dataset.mobileView=prefs.mobile;
    document.documentElement.style.setProperty("--left-pane",prefs.left+"%");
    document.documentElement.style.setProperty("--right-pane",prefs.right+"%");
    document.documentElement.style.setProperty("--ui-scale",String(prefs.scale/100));
    pre.classList.toggle("wrapped-code",prefs.wrap);
    pre.classList.toggle("show-gutter",prefs.lines&&!prefs.wrap);
    $("themeChoice").value=prefs.theme;
    $("densityChoice").value=prefs.density;
    $("leftSize").value=prefs.left;
    $("rightSize").value=prefs.right;
    $("leftPercent").textContent=prefs.left+"%";
    $("rightPercent").textContent=prefs.right+"%";
    $("centerPercent").textContent=(100-prefs.left-prefs.right)+"%";
    $("uiScale").value=prefs.scale;
    $("uiScalePercent").textContent=prefs.scale+"%";
    updateMode();
    $("lineToggle").checked=prefs.lines;
    $("wrapToggle").checked=prefs.wrap;
    $("focusModeBtn").setAttribute("aria-pressed",String(prefs.focus));
    $("focusModeBtn").classList.toggle("active",prefs.focus);
    for(const btn of toolbar.querySelectorAll("[data-view]")){
      btn.classList.toggle("active",btn.dataset.view===prefs.mobile);
      btn.setAttribute("aria-pressed",String(btn.dataset.view===prefs.mobile));
    }
    savePrefs();
  }
  $("themeChoice").addEventListener("change",e=>{prefs.theme=e.target.value==="light"?"light":"dark";apply();});
  $("densityChoice").addEventListener("change",e=>{prefs.density=e.target.value==="compact"?"compact":"comfortable";apply();});
  $("leftSize").addEventListener("input",e=>{prefs.left=Number(e.target.value);apply();});
  $("rightSize").addEventListener("input",e=>{prefs.right=Number(e.target.value);apply();});
  $("uiScale").addEventListener("input",e=>{prefs.scale=Number(e.target.value);apply();});
  $("lineToggle").addEventListener("change",e=>{prefs.lines=e.target.checked;apply();});
  $("wrapToggle").addEventListener("change",e=>{prefs.wrap=e.target.checked;apply();});
  $("focusModeBtn").addEventListener("click",()=>{prefs.focus=!prefs.focus;if(prefs.focus)prefs.mobile="workspace";apply();});
  $("resetLayout").addEventListener("click",()=>{
    Object.assign(prefs,{...DEFAULT_LAYOUT,density:"comfortable",focus:false,wrap:false,lines:true});
    apply();notify("Layout reset");
  });
  toolbar.querySelectorAll("[data-view]").forEach(btn=>btn.addEventListener("click",()=>{
    prefs.mobile=btn.dataset.view;
    if(prefs.focus&&prefs.mobile!=="workspace")prefs.focus=false;
    apply();
  }));
  const help=node("dialog","shortcuts-dialog");
  help.innerHTML='<h2>Keyboard shortcuts</h2><p>Ctrl/Cmd + Z: Undo · Shift + Ctrl/Cmd + Z: Redo · Ctrl/Cmd + S: Save · Ctrl/Cmd + Shift + L: Projects · Ctrl/Cmd + Enter: Simulate</p><p>Tap the star beside a palette block to favorite it. Search project blocks to jump directly to an existing step.</p><form method="dialog"><button class="btn primary">Close</button></form>';
  document.body.append(help);
  $("shortcutsBtn").addEventListener("click",()=>help.showModal());

  const jump=$("blockJump"),results=$("jumpResults");
  function showResults(){
    results.replaceChildren();
    const query=jump.value.trim().toLowerCase();
    if(!query){results.hidden=true;return;}
    const matches=outlineProject(getProject()).filter(b=>(b.label+" "+b.description+" "+b.type).toLowerCase().includes(query)).slice(0,12);
    for(const b of matches){
      const button=node("button","jump-result",b.label+" · "+b.description);
      button.type="button";button.addEventListener("click",()=>{
        results.hidden=true;jump.value="";scrollToBlock(b.id);
      });
      results.append(button);
    }
    if(!matches.length)results.append(node("p","panel-note","No matching blocks"));
    results.hidden=false;
  }
  jump.addEventListener("input",showResults);
  jump.addEventListener("keydown",e=>{if(e.key==="Escape"){results.hidden=true;jump.value="";}});
  document.addEventListener("pointerdown",e=>{if(!e.target.closest(".studio-jump"))results.hidden=true;});

  const ultra=node("section","ultra-section");
  ultra.innerHTML=[
    '<div class="ultra-header"><div><span class="eyebrow">BEYOND THE EDITOR</span><h2>Ultra tools <span class="count-pill">3 tools</span></h2><p>Generate Roblox systems, visualize script flow, and review static performance risks.</p></div>',
    '<div class="ultra-actions"><button class="btn compact" data-ultra="wizard" type="button">⚡ System builder</button><button class="btn compact" data-ultra="map" type="button">◇ Structure map</button><button class="btn compact" data-ultra="audit" type="button">◉ Script audit</button></div></div>',
    '<div id="ultraContent" class="ultra-content" hidden></div>'
  ].join("");
  shell.querySelector(".layout").after(ultra);
  const content=$("ultraContent");
  let activeUltra=null;

  const wizardKind=node("select","wizard-kind");
  for(const item of SYSTEM_KINDS){
    const option=node("option","",item.name);option.value=item.id;wizardKind.append(option);
  }
  function wizardView(){
    content.replaceChildren();
    const intro=node("p","ultra-description","Generate a standalone server script. It does not overwrite your current visual project.");
    const control=node("div","wizard-controls");
    control.append(node("label","ultra-label","System"),wizardKind);
    const fields=node("div","wizard-fields");
    const options=[
      {key:"speed",label:"Walk speed",type:"number",value:"32",min:16,max:100},
      {key:"duration",label:"Duration (sec)",type:"number",value:"5",min:0.5,max:120},
      {key:"stat",label:"Stat name",type:"text",value:"Coins"},
      {key:"amount",label:"Amount",type:"number",value:"10",min:1,max:100000},
      {key:"cooldown",label:"Cooldown (sec)",type:"number",value:"3",min:0.25,max:120}
    ];
    const inputs={};
    for(const item of options){
      const label=node("label","",item.label);
      const input=node("input","");input.type=item.type;input.value=item.value;
      if(item.min!==undefined)input.min=item.min;
      if(item.max!==undefined)input.max=item.max;
      input.setAttribute("aria-label",item.label);
      label.append(input);inputs[item.key]=input;fields.append(label);
    }
    control.append(fields);
    const output=node("pre","wizard-output");
    const toolbar=node("div","wizard-actions");
    const copy=node("button","btn compact","Copy system");
    const download=node("button","btn primary","Download .luau");
    const info=node("p","ultra-description");
    const create=()=>{
      fields.querySelectorAll("label").forEach(label=>{const key=Object.keys(inputs).find(k=>inputs[k]===label.querySelector("input"));
        label.hidden=wizardKind.value==="checkpoint"||
          (wizardKind.value==="speed"&&key!=="speed"&&key!=="duration")||
          (wizardKind.value==="coins"&&key!=="stat"&&key!=="amount"&&key!=="cooldown");
      });
      output.textContent=generateRobloxSystem(wizardKind.value,Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,v.value])));
      info.textContent=wizardKind.value==="checkpoint"?"Place this Script inside a SpawnLocation. Session respawns only; not DataStore persistence.":"Place this Script inside a server-owned Part, and test with multiple players in Studio.";
    };
    wizardKind.onchange=create;
    Object.values(inputs).forEach(input=>input.addEventListener("input",create));
    copy.type="button";copy.addEventListener("click",async()=>{
      try{await navigator.clipboard.writeText(output.textContent);notify("Roblox system copied");}
      catch{notify("Clipboard permission denied");}
    });
    download.type="button";download.addEventListener("click",()=>{
      const blob=new Blob([output.textContent],{type:"text/plain;charset=utf-8"});
      const url=URL.createObjectURL(blob);
      const a=node("a");a.href=url;a.download="EasyScript-"+wizardKind.value+".luau";
      document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    toolbar.append(copy,download);
    content.append(intro,control,info,toolbar,output);create();
  }
  function structureView(){
    content.replaceChildren();
    const nodes=outlineProject(getProject());
    const info=node("p","ultra-description",nodes.length+" visual blocks · Select a block to jump to its position.");
    content.append(info);
    const tree=node("div","structure-tree");
    if(!nodes.length)tree.append(node("p","panel-note","Add blocks to see the hierarchy."));
    for(const entry of nodes){
      const button=node("button","structure-node",entry.label+" · "+entry.description);
      button.style.setProperty("--tree-indent",Math.min(entry.depth,10)*16+"px");
      button.title=entry.branch+" / "+entry.type;
      button.addEventListener("click",()=>scrollToBlock(entry.id));
      tree.append(button);
    }
    content.append(tree);
  }
  function auditView(){
    content.replaceChildren();
    const report=auditProject(getProject());
    const top=node("div","audit-summary");
    for(const [label,value] of [["Health index",report.score+"/100"],["Blocks",report.blocks],["Generated lines",report.lines],["Max nesting",report.maxDepth],["Potential issues",report.errors+report.warnings+report.findings.length]]){
      const cell=node("div","audit-stat");
      cell.append(node("strong","",String(value)),node("span","",label));top.append(cell);
    }
    content.append(top,node("p","ultra-description",report.disclaimer));
    const body=node("div","audit-findings");
    if(!report.findings.length)body.append(node("p","audit-clear","No additional performance heuristics triggered."));
    for(const finding of report.findings){
      const item=node("button","audit-finding");
      item.append(node("strong","",finding.message),node("span","",finding.advice));
      item.disabled=!finding.id;
      if(finding.id)item.addEventListener("click",()=>scrollToBlock(finding.id));
      body.append(item);
    }
    content.append(body);
  }
  function renderUltra(){
    if(activeUltra==="wizard")wizardView();
    if(activeUltra==="map")structureView();
    if(activeUltra==="audit")auditView();
  }
  ultra.querySelectorAll("[data-ultra]").forEach(button=>button.addEventListener("click",()=>{
    const next=button.dataset.ultra;
    activeUltra=activeUltra===next?null:next;
    content.hidden=!activeUltra;
    ultra.querySelectorAll("[data-ultra]").forEach(b=>b.classList.toggle("active",b.dataset.ultra===activeUltra));
    if(activeUltra)renderUltra();
  }));
  let queued=null;
  function update(){
    clearTimeout(queued);
    queued=setTimeout(()=>{
      updateGutter();
      if(activeUltra==="map"||activeUltra==="audit")renderUltra();
      if(jump.value.trim()&&!results.hidden)showResults();
    },160);
  }
  window.addEventListener("resize",updateMode,{passive:true});
  apply();updateGutter();
  return {
    isFavorite:type=>prefs.favorites.includes(type),
    favorites:()=>prefs.favorites.slice(),
    recent:()=>prefs.recent.slice(),
    toggleFavorite:type=>{
      prefs.favorites=prefs.favorites.includes(type)?prefs.favorites.filter(x=>x!==type):[type,...prefs.favorites].slice(0,30);
      savePrefs();renderPalette();
    },
    trackRecent:type=>{
      const next=[type,...prefs.recent.filter(x=>x!==type)].slice(0,8);
      if(next.join(",")===prefs.recent.join(","))return;
      prefs.recent=next;savePrefs();renderPalette();
    },
    update
  };
}
