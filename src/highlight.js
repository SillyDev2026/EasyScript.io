// Syntax coloring uses textContent; generated code is never treated as HTML.
const LUAU=new Set("and break do else elseif end false for function if in local nil not or repeat return then true until while game Instance task".split(" "));
const JS=new Set("async await break catch class const continue else false for function if let new null return throw true undefined var while".split(" "));
const TOKEN=/--[^\n]*|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\x60(?:\\.|[^\x60\\])*\x60|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b/g;
export function tokenize(source,language="luau"){
  const text=String(source),words=language==="javascript"?JS:LUAU,output=[];
  let start=0;TOKEN.lastIndex=0;
  for(const match of text.matchAll(TOKEN)){
    const offset=match.index;
    if(offset>start)output.push({kind:"text",value:text.slice(start,offset)});
    const token=match[0];
    let kind="text";
    if(token.startsWith("--")||token.startsWith("//"))kind="comment";
    else if(/^["'\x60]/.test(token))kind="string";
    else if(/^\d/.test(token))kind="number";
    else if(words.has(token))kind="keyword";
    else if(/^[A-Za-z_]/.test(token)&&/^(print|console|log|GetService|Instance|Connect|task|wait)$/.test(token))kind="function";
    output.push({kind,value:token});start=offset+token.length;
  }
  if(start<text.length)output.push({kind:"text",value:text.slice(start)});
  return output;
}
export function highlightInto(element,source,language){
  const fragment=document.createDocumentFragment();
  for(const token of tokenize(source,language)){
    if(token.kind==="text")fragment.append(document.createTextNode(token.value));
    else{
      const span=document.createElement("span");
      span.className="syntax-"+token.kind;
      span.textContent=token.value;
      fragment.append(span);
    }
  }
  element.replaceChildren(fragment);
}
