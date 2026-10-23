import {newExpression,EXPRESSION_KINDS,expressionSlots,expressionType,compileExpression,validateExpression} from "./expressions.js";
import {checkSocketTree} from "./v2-expressions.js";
import {suggestExpressionTree} from "./v2-expression-parser.js";

const mk=(tag,cls,text)=>{
  const n=document.createElement(tag);
  if(cls)n.className=cls;
  if(text!==undefined)n.textContent=text;
  return n;
};
export function mountExpressionComposer({getLanguage,notify}){
  const dialog=mk("dialog","expression-dialog");
  dialog.setAttribute("aria-label","Expression composer");
  const heading=mk("div","expression-heading");
  heading.append(mk("div","", ""),mk("span","expression-hint","Nest values into slots to build an expression without typing raw syntax."));
  const title=mk("h2","","Visual Expression Composer");
  heading.firstChild.append(title);
  const body=mk("div","expression-tree");
  const output=mk("pre","expression-preview");
  const feedback=mk("p","expression-feedback");
  feedback.setAttribute("aria-live","polite");
  const controls=mk("div","expression-controls");
  const save=mk("button","btn primary","Use this expression");
  const close=mk("button","btn compact ghost","Cancel");
  close.type="button";save.type="button";controls.append(close,save);
  dialog.append(heading,body,feedback,output,controls);
  document.body.append(dialog);
  let tree=newExpression(),applyValue=null,copiedNode=null;
  let language="luau";
  function updatePreview(){
    const issues=validateExpression(tree,language);
    if(issues.length){
      feedback.textContent=issues.slice(0,4).join(" · ");
      feedback.classList.add("has-error");
      output.textContent="Resolve the expression issues above.";
      save.disabled=true;return;
    }
    feedback.classList.remove("has-error");
    feedback.textContent=expressionType(tree)+" expression · valid for "+language;
    try{output.textContent=compileExpression(tree,language);save.disabled=false;}
    catch(e){feedback.textContent=e.message;save.disabled=true;}
  }
  function paint(){
    body.replaceChildren();
    function nodeView(node,onChange,depth=0){
      const card=mk("div","expression-node");
      card.style.setProperty("--depth",String(Math.min(depth,6)));
      card.draggable=true;card.title="Drag an expression to another socket, or use Copy/Paste";
      card.addEventListener("dragstart",event=>{
        event.stopPropagation();
        event.dataTransfer?.setData("application/x-easyscript-expression",JSON.stringify(node));
        if(event.dataTransfer)event.dataTransfer.effectAllowed="copy";
      });
      card.addEventListener("dragover",event=>{
        if(!event.dataTransfer?.types?.includes("application/x-easyscript-expression"))return;
        event.preventDefault();event.stopPropagation();card.classList.add("expression-drop-ready");
      });
      card.addEventListener("dragleave",()=>card.classList.remove("expression-drop-ready"));
      card.addEventListener("drop",event=>{
        event.preventDefault();event.stopPropagation();card.classList.remove("expression-drop-ready");
        try{
          const value=event.dataTransfer.getData("application/x-easyscript-expression");
          const updated=JSON.parse(value);
          checkSocketTree(updated,language);
          onChange(updated);paint();
        }catch(e){feedback.textContent="Socket drop rejected: "+e.message;}
      });
      const head=mk("div","expression-node-head");
      const sel=mk("select","expression-kind");
      for(const kind of EXPRESSION_KINDS){
        if(language!=="luau"&&kind.value==="vector3")continue;
        const option=mk("option","",kind.name);option.value=kind.value;sel.append(option);
      }
      sel.value=node.kind;
      sel.setAttribute("aria-label","Expression kind");
      head.append(sel,mk("span","expression-type",expressionType(node)));
      const copy=mk("button","expression-node-action","Copy");
      copy.type="button";copy.title="Copy this expression subtree";
      copy.addEventListener("click",()=>{copiedNode=structuredClone(node);feedback.textContent="Expression subtree copied";});
      const paste=mk("button","expression-node-action","Paste");
      paste.type="button";paste.title="Replace this socket with a copied expression";
      paste.addEventListener("click",()=>{
        if(!copiedNode)return;
        try{const safe=checkSocketTree(copiedNode,language);onChange(structuredClone(safe));paint();}
        catch(e){feedback.textContent=e.message;}
      });
      head.append(copy,paste);
      card.append(head);
      sel.addEventListener("change",()=>{onChange(newExpression(sel.value));paint();});
      if(expressionSlots(node.kind).length){
        for(const slot of expressionSlots(node.kind)){
          const wrapper=mk("div","expression-slot");
          const label=mk("div","expression-slot-label",slot.toUpperCase());
          wrapper.append(label,nodeView(node[slot],updated=>{node[slot]=updated;},depth+1));
          card.append(wrapper);
        }
      }else{
        let input;
        if(node.kind==="boolean"){
          input=mk("select","expression-value");
          for(const value of ["true","false"]){const option=mk("option","",value);option.value=value;input.append(option);}
          input.value=node.value?"true":"false";
          input.addEventListener("change",()=>{node.value=input.value==="true";updatePreview();});
        }else{
          input=mk("input","expression-value");
          input.type=node.kind==="number"?"number":"text";
          if(node.kind==="number")input.step="any";
          input.value=String(node.value??"");
          input.maxLength=400;
          input.setAttribute("aria-label",node.kind+" value");
          input.addEventListener("input",()=>{node.value=input.value;updatePreview();});
        }
        card.append(input);
      }
      return card;
    }
    body.append(nodeView(tree,updated=>{tree=updated;}));
    updatePreview();
  }
  close.addEventListener("click",()=>dialog.close());
  save.addEventListener("click",()=>{
    try{const value=compileExpression(tree,language);applyValue?.(value,structuredClone(tree));dialog.close();notify("Expression inserted into the block");}
    catch(e){feedback.textContent=e.message;}
  });
  dialog.addEventListener("close",()=>{applyValue=null;});
  return {
    open(source,callback,initialTree=null){
      language=getLanguage();
      tree=newExpression("raw");
      tree.value=String(source??"0").slice(0,400);
      if(initialTree){
        try{tree=checkSocketTree(initialTree,language);}
        catch{/* revert to last source expression */}
      }else{
        tree=suggestExpressionTree(source,language)||tree;
      }
      applyValue=callback;
      paint();dialog.showModal();
    }
  };
}
