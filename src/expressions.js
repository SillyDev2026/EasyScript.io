// Typed expression tree composer. No eval/Function, and no executable user text.
const OPERATORS={
  add:{luau:"+",javascript:"+",type:"number",inputs:"number"},
  subtract:{luau:"-",javascript:"-",type:"number",inputs:"number"},
  multiply:{luau:"*",javascript:"*",type:"number",inputs:"number"},
  divide:{luau:"/",javascript:"/",type:"number",inputs:"number"},
  greater:{luau:">",javascript:">",type:"boolean",inputs:"number"},
  equal:{luau:"==",javascript:"===",type:"boolean",inputs:"any"},
  and:{luau:"and",javascript:"&&",type:"boolean",inputs:"boolean"},
  or:{luau:"or",javascript:"||",type:"boolean",inputs:"boolean"}
};
export const EXPRESSION_KINDS=[
  {value:"raw",name:"Existing expression",type:"any"},
  {value:"number",name:"Number",type:"number"},
  {value:"string",name:"Text",type:"string"},
  {value:"boolean",name:"True / false",type:"boolean"},
  {value:"variable",name:"Variable reference",type:"any"},
  ...Object.entries(OPERATORS).map(([value,op])=>({value,name:value.charAt(0).toUpperCase()+value.slice(1),type:op.type})),
  {value:"not",name:"Not",type:"boolean"},
  {value:"length",name:"Text length",type:"number"},
  {value:"random",name:"Random integer",type:"number"},
  {value:"vector3",name:"Vector3 (Roblox only)",type:"vector3"}
];
const IDENT=/^[A-Za-z_][A-Za-z0-9_]*$/;
const sourceText=(value)=>String(value??"").trim().replace(/[\r\n\u2028\u2029]+/g," ");
export const newExpression=(kind="raw")=>{
  if(!EXPRESSION_KINDS.some(x=>x.value===kind))throw new Error("Unknown expression kind");
  if(kind==="raw")return {kind,value:"0"};
  if(kind==="number")return {kind,value:"0"};
  if(kind==="string")return {kind,value:"Hello"};
  if(kind==="boolean")return {kind,value:true};
  if(kind==="variable")return {kind,value:"Coins"};
  if(kind==="not"||kind==="length")return {kind,child:newExpression("variable")};
  if(kind==="random")return {kind,left:newExpression("number"),right:{kind:"number",value:"10"}};
  if(kind==="vector3")return {kind,x:newExpression("number"),y:newExpression("number"),z:newExpression("number")};
  return {kind,left:newExpression("number"),right:newExpression("number")};
};
export function expressionType(node){
  if(!node||typeof node!=="object")return "invalid";
  return EXPRESSION_KINDS.find(x=>x.value===node.kind)?.type??"invalid";
}
export function expressionSlots(kind){
  if(kind==="not"||kind==="length")return ["child"];
  if(kind==="vector3")return ["x","y","z"];
  if(kind==="random"||OPERATORS[kind])return ["left","right"];
  return [];
}
export function validateExpression(node,language="luau"){
  const problems=[];
  function visit(n,depth){
    if(depth>7){problems.push("Maximum expression depth is 7");return;}
    if(!n||!EXPRESSION_KINDS.some(x=>x.value===n.kind)){problems.push("Unknown expression type");return;}
    if(n.kind==="vector3"&&language!=="luau")problems.push("Vector3 needs Roblox Luau");
    if(n.kind==="variable"&&!IDENT.test(sourceText(n.value)))problems.push("Variable names must be identifiers");
    if(n.kind==="number"&&!Number.isFinite(Number(n.value)))problems.push("Numbers must be finite");
    if(n.kind==="raw"&&!sourceText(n.value))problems.push("Raw expression cannot be empty");
    for(const slot of expressionSlots(n.kind)){
      visit(n[slot],depth+1);
      const actual=expressionType(n[slot]);
      const needed=n.kind==="vector3"||n.kind==="random"?"number":n.kind==="length"?"string":n.kind==="not"?"boolean":OPERATORS[n.kind]?.inputs;
      if(actual!=="invalid"&&actual!=="any"&&needed&&needed!=="any"&&actual!==needed)
        problems.push(slot+" needs "+needed+", but has "+actual);
    }
  }
  visit(node,0);
  return problems;
}
export function compileExpression(node,language="luau"){
  const errors=validateExpression(node,language);
  if(errors.length)throw new Error(errors.join("; "));
  function render(n){
    switch(n.kind){
      case "raw":return sourceText(n.value);
      case "number":return String(Number(n.value));
      case "string":return JSON.stringify(String(n.value??""));
      case "boolean":return n.value?"true":"false";
      case "variable":return sourceText(n.value);
      case "not":return "("+(language==="luau"?"not ":"!")+render(n.child)+")";
      case "length":return language==="luau"?"#tostring("+render(n.child)+")":"String("+render(n.child)+").length";
      case "random":return language==="luau"?"math.random("+render(n.left)+", "+render(n.right)+")":
        "(Math.floor(Math.random() * ("+render(n.right)+" - "+render(n.left)+" + 1)) + "+render(n.left)+")";
      case "vector3":return "Vector3.new("+["x","y","z"].map(k=>render(n[k])).join(", ")+")";
      default:{
        const op=OPERATORS[n.kind];
        return "("+render(n.left)+" "+op[language]+" "+render(n.right)+")";
      }
    }
  }
  return render(node);
}
