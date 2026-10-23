// Conservative tokenizer + precedence parser. Never runs parsed source.
import {checkSocketTree} from "./v2-expressions.js";
const BINARY={
 "or":["or",1],"||":["or",1],
 "and":["and",2],"&&":["and",2],
 "==":["equal",3],"===":["equal",3],
 "~=":["notEqual",3],"!=":["notEqual",3],"!==":["notEqual",3],
 ">":["greater",4],"<":["less",4],">=":["greaterEqual",4],"<=":["lessEqual",4],
 "+":["add",5],"-":["subtract",5],
 "*":["multiply",6],"/":["divide",6],"%":["modulo",6]
};
const tokenPattern=/\s*(?:(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|("(?:\\.|[^"\\])*")|([A-Za-z_][A-Za-z0-9_]*)|(===|!==|==|~=|!=|>=|<=|&&|\|\||[()+\-*/%<>!]))/y;
function tokenize(source){
 const tokens=[];let i=0;
 while(i<source.length){
  tokenPattern.lastIndex=i;
  const m=tokenPattern.exec(source);
  if(!m){if(!source.slice(i).trim())break;throw new Error("Unsupported expression token at character "+(i+1));}
  i=tokenPattern.lastIndex;
  const value=m[1]||m[2]||m[3]||m[4];
  tokens.push({value,kind:m[1]?"number":m[2]?"string":m[3]?"identifier":"symbol"});
  if(tokens.length>120)throw new Error("Too many expression tokens");
 }
 return tokens;
}
export function parseExpressionToTree(source,language="luau"){
 if(language!=="luau"&&language!=="javascript")throw new Error("Unsupported language");
 source=String(source??"").trim();
 if(!source||source.length>400)throw new Error("Expression needs 1–400 characters");
 const tokens=tokenize(source);let index=0;
 const peek=()=>tokens[index]?.value;
 const consume=()=>tokens[index++];
 const expect=x=>{if(peek()!==x)throw new Error("Expected "+x);consume();};
 function primary(depth){
  if(depth>7)throw new Error("Expression nesting exceeds seven levels");
  const token=consume();
  if(!token)throw new Error("Missing expression operand");
  if(token.value==="("){const inner=parse(0,depth+1);expect(")");return inner;}
  if(token.value==="!"||token.value==="not"){
   if(token.value==="!"&&language==="luau")throw new Error("Luau uses not");
   return {kind:"not",child:primary(depth+1)};
  }
  if(token.value==="-"){
   const next=primary(depth+1);
   if(next.kind==="number")return {kind:"number",value:String(-Number(next.value))};
   return {kind:"subtract",left:{kind:"number",value:"0"},right:next};
  }
  if(token.kind==="number")return {kind:"number",value:token.value};
  if(token.kind==="string")return {kind:"string",value:JSON.parse(token.value)};
  if(token.value==="true"||token.value==="false")return {kind:"boolean",value:token.value==="true"};
  if(token.kind==="identifier")return {kind:"variable",value:token.value};
  throw new Error("Unsupported expression operand "+token.value);
 }
 function parse(precedence,depth){
  let left=primary(depth);
  while(index<tokens.length){
   const op=peek(),rule=BINARY[op];
   if(!rule||rule[1]<precedence)break;
   if(language==="luau"&&(op==="==="||op==="!=="||op==="&&"||op==="||"||op==="!="))
    throw new Error("Operator "+op+" is not Luau");
   if(language==="javascript"&&(op==="and"||op==="or"||op==="~="))
    throw new Error("Operator "+op+" is not JavaScript");
   consume();
   const right=parse(rule[1]+1,depth+1);
   left={kind:rule[0],left,right};
  }
  return left;
 }
 const tree=parse(0,0);
 if(index!==tokens.length)throw new Error("Unexpected trailing expression token "+peek());
 return checkSocketTree(tree,language);
}
export function suggestExpressionTree(source,language){
 try{return parseExpressionToTree(source,language);}
 catch{return null;}
}
