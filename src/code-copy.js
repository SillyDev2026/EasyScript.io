// Copy-to-clipboard with a selectable manual fallback for restricted browsers.
// Never place generated source in innerHTML.
export async function copyCodeWithFallback(text,notify,showFallback){
  const source=String(text??"");
  if(!source){notify("No generated code to copy.");return false;}
  try{
    if(!navigator.clipboard?.writeText)throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(source);
    notify("Full generated code copied.");
    return true;
  }catch(error){
    showFallback(source);
    notify("Clipboard access was blocked. Select and copy the code below.");
    return false;
  }
}
export function createCopyFallback(){
  const dialog=document.createElement("dialog");
  dialog.className="copy-source-dialog";
  const title=document.createElement("h2");title.textContent="Copy generated code";
  const caption=document.createElement("p");
  caption.textContent="Your browser blocked automatic copying. The full source is selected below; use your device's Copy command.";
  const textarea=document.createElement("textarea");
  textarea.className="copy-source-textarea";textarea.readOnly=true;
  textarea.setAttribute("aria-label","Generated code to copy");
  const actions=document.createElement("div");actions.className="copy-source-actions";
  const select=document.createElement("button");select.className="btn compact";select.textContent="Select all";
  const done=document.createElement("button");done.className="btn primary";done.textContent="Close";
  select.type="button";done.type="button";
  select.addEventListener("click",()=>{textarea.focus();textarea.select();textarea.setSelectionRange(0,textarea.value.length);});
  done.addEventListener("click",()=>dialog.close());
  actions.append(select,done);
  dialog.append(title,caption,textarea,actions);
  document.body.append(dialog);
  return code=>{
    textarea.value=code;
    dialog.showModal();
    textarea.focus();textarea.select();textarea.setSelectionRange(0,textarea.value.length);
  };
}
