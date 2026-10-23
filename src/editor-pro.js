import {allBlocks,performBulk,setBlockNote,toggleBookmark,listBookmarks,
 listSnippets,saveSnippet,insertSnippet,renameVariable,diagnosticSummary,projectSourceMinimap} from "./editor-ops.js";
import {inspectVariables} from "./ultra-plus-engine.js";
const make=(tag,cls,text)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(text!==undefined)node.textContent=String(text);
 return node;
};
const button=(label,handler)=>{
 const b=make("button","btn compact ghost",label);b.type="button";b.addEventListener("click",handler);return b;
};
export function mountEditorPro({getProject,getWorkspace,mutate,notify,jump}){
 const section=make("section","pro-toolbar");
 const top=make("div","pro-header");
 top.append(make("strong","","Workspace Tools"),make("span","","Bulk edit · Refactor · Snippets · Bookmarks · Code navigation"));
 const buttons=make("div","pro-actions");
 const popup=make("dialog","pro-dialog");
 const heading=make("div","pro-dialog-header");
 const title=make("h2","","Workspace tools");
 heading.append(title,button("Close",()=>popup.close()));
 const body=make("div","pro-dialog-body");popup.append(heading,body);
 document.body.append(popup);
 section.append(top,buttons);
 const layout=document.querySelector(".layout");
 const toolbar=document.querySelector(".studio-toolbar");
 if(toolbar)toolbar.after(section);else layout.before(section);
 let current="",selected=new Set(),lastFile=null;
 const currentFile=()=>getWorkspace().activeId;
 const validateFile=()=>{
  if(currentFile()!==lastFile){selected.clear();lastFile=currentFile();}
 };
 function selectedBlocks(){
  validateFile();
  return allBlocks(getProject()).filter(x=>selected.has(x.id));
 }
 function open(name,render){
  current=name;title.textContent=name;
  body.replaceChildren();render();if(!popup.open)popup.showModal();
 }
 const msg=text=>{notify(text);};
 function renderBulk(){
  validateFile();body.replaceChildren();
  const controls=make("div","pro-row");
  controls.append(button("Select all",()=>{
    for(const b of allBlocks(getProject()))selected.add(b.id);
    renderBulk();
  }),button("Clear selection",()=>{selected.clear();renderBulk();}),
  make("span","pro-count",selected.size+" selected"));
  body.append(controls);
  const list=make("div","pro-scroll-list");
  for(const block of allBlocks(getProject()).slice(0,500)){
   const row=make("label","pro-check-row");
   const check=make("input");check.type="checkbox";check.checked=selected.has(block.id);
   check.addEventListener("change",()=>{check.checked?selected.add(block.id):selected.delete(block.id);});
   row.append(check,make("span","",block.type+(block.disabled?" · disabled":"")+(block.note?" · 📝":"")));
   list.append(row);
  }
  body.append(list);
  const actions=make("div","pro-row");
  for(const [label,operation] of [["Duplicate","duplicate"],["Disable","disable"],["Enable","enable"],["Delete","delete"]]){
   actions.append(button(label,()=>{
     if(!selected.size){msg("Choose blocks first");return;}
     if(operation==="delete"&&!confirm("Delete "+selected.size+" selected blocks?"))return;
     let count=0;
     mutate(p=>{count=performBulk(p,selected,operation);});
     if(["delete","duplicate"].includes(operation))selected.clear();
     msg(count+" block(s) "+operation+"d");
     renderBulk();
   }));
  }
  body.append(actions);
 }
 function renderVariables(){
  body.replaceChildren();body.append(make("p","panel-note","Renames supported visual identifiers and simple raw-expression references. Review changes in generated code; dynamic references are not fully understood."));
  const vars=inspectVariables(getProject());
  const from=make("select","pro-select");
  for(const v of vars){
   const opt=make("option","",v.name);opt.value=v.name;from.append(opt);
  }
  if(!vars.length)body.append(make("p","panel-note","No variables detected."));
  const to=make("input","pro-input");to.placeholder="New variable name";to.maxLength=64;
  const controls=make("div","pro-row");
  controls.append(from,to,button("Rename",()=>{
   if(!from.value||!to.value.trim())return msg("Choose a variable and a new name");
   let result;
   try{
    mutate(p=>{result=renameVariable(p,from.value,to.value.trim());});
    msg("Renamed "+result.changed+" references. Review generated code.");
    renderVariables();
   }catch(e){msg("Rename failed: "+e.message);}
  }));
  body.append(controls);
  const list=make("div","pro-scroll-list");
  for(const v of vars){const row=button(v.name+" · "+v.kind+" · "+v.mentions+" references",()=>jump(v.blockIds[0]));row.className="pro-list-action";list.append(row);}
  body.append(list);
 }
 function renderSnippets(){
  body.replaceChildren();
  const controls=make("div","pro-row");
  const name=make("input","pro-input");name.placeholder="Snippet name";name.maxLength=60;
  controls.append(name,button("Save selected",()=>{
    try{const snip=saveSnippet(localStorage,name.value,getProject(),selected);msg("Saved snippet: "+snip.name);renderSnippets();}
    catch(e){msg(e.message);}
  }));
  body.append(make("p","panel-note","Select blocks in Bulk edit first; save them as reusable local snippets."),controls);
  const list=make("div","pro-scroll-list");
  for(const snippet of listSnippets(localStorage)){
   const row=make("div","pro-snippet-row");
   row.append(make("span","",snippet.name+" · "+snippet.blocks.length+" root blocks"),
     button("Insert",()=>{
       try{let count=0;mutate(p=>{count=insertSnippet(p,snippet);});msg("Inserted "+count+" block(s)");}
       catch(e){msg(e.message);}
     }));
   list.append(row);
  }
  if(!list.children.length)list.append(make("p","panel-note","No snippets saved on this device yet."));
  body.append(list);
 }
 function renderBookmarks(){
  validateFile();body.replaceChildren();
  const list=make("div","pro-scroll-list");
  const fileId=currentFile(),bookmarks=listBookmarks(localStorage).filter(x=>x.fileId===fileId);
  for(const b of allBlocks(getProject()).slice(0,500)){
   const row=make("div","pro-snippet-row");
   const bookmarked=bookmarks.some(x=>x.id===b.id);
   row.append(button(bookmarked?"★":"☆",()=>{
     toggleBookmark(localStorage,fileId,b.id);renderBookmarks();
   }),button(b.type,()=>{jump(b.id);popup.close();}),
     button("Note",()=>{
       const note=prompt("Notes for "+b.type+" (300 chars)",b.note||"");
       if(note===null)return;
       mutate(p=>{setBlockNote(p,b.id,note);});
       renderBookmarks();
     }));
   list.append(row);
  }
  body.append(make("p","panel-note","Star useful blocks and attach local developer notes. Tap a block name to find it."),list);
 }
 function renderDiagnostics(){
  body.replaceChildren();
  const issues=diagnosticSummary(getProject());
  const select=make("select","pro-select");
  for(const [key,label] of [["all","All"],["error","Errors"],["warning","Warnings"]]){
   const opt=make("option","",label);opt.value=key;select.append(opt);
  }
  const list=make("div","pro-scroll-list");
  const update=()=>{
   list.replaceChildren();
   for(const issue of issues.all.filter(x=>select.value==="all"||select.value===x.severity)){
    const b=button(issue.severity.toUpperCase()+": "+issue.message,()=>{if(issue.id){jump(issue.id);popup.close();}});
    b.className="pro-list-action";list.append(b);
   }
   if(!list.children.length)list.append(make("p","panel-note","No matching diagnostics."));
  };
  select.addEventListener("change",update);
  body.append(make("p","panel-note",issues.errors.length+" errors · "+issues.warnings.length+" warnings"),select,list);
  update();
 }
 function renderMinimap(){
  body.replaceChildren();
  const list=make("div","pro-scroll-list");
  const lines=projectSourceMinimap(getProject());
  for(const item of lines){
    const row=make("div","pro-mini-line");
    row.append(make("span","",String(item.line)),make("code","",item.text.slice(0,170)));
    list.append(row);
  }
  body.append(make("p","panel-note","Source overview of the first 250 non-comment lines. Generate and export code from the main editor."),list);
 }
 const views=[
  ["Bulk edit",renderBulk],["Variables",renderVariables],["Snippets",renderSnippets],
  ["Bookmarks & notes",renderBookmarks],["Diagnostics",renderDiagnostics],["Code minimap",renderMinimap]
 ];
 for(const [name,render] of views){
  buttons.append(button(name,()=>open(name,render)));
 }
 return {update(){
   validateFile();
   if(!popup.open)return;
   // Preserve in-progress text input when project changes; user can reopen tool to refresh.
 }};
}
