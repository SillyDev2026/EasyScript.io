// Shared source formatting. Form inputs are expressions, never independent statements.
// Normalize accidental pasted newlines while preserving the one-statement-per-block layout.
export function inlineExpression(value,fallback="nil"){
  const source=String(value??"").trim().replace(/[\r\n\u2028\u2029]+\s*/g," ").trim();
  return source||fallback;
}
export function safeComment(value){
  return String(value??"").replace(/[\r\n\u2028\u2029]+/g," ").replace(/\s+/g," ").trim();
}
export const LUAU_IDENT=/^[A-Za-z_][A-Za-z0-9_]*$/;
const RESERVED=new Set("and break continue do else elseif end false for function if in local nil not or repeat return then true until while".split(" "));
export function identifierOK(value){
  return LUAU_IDENT.test(String(value??""))&&!RESERVED.has(String(value));
}
export function dottedPathOK(value){
  const path=String(value??"");
  return path.split(".").length<=16&&path.split(".").every(identifierOK);
}
export function expressionWarnings(block){
  const issues=[];
  for(const [key,value] of Object.entries(block.fields||{})){
    if(/[\r\n\u2028\u2029]/.test(String(value))){
      issues.push({id:block.id,severity:"error",message:"Field "+key+" contains a line break. Use a single-line expression; line breaks were flattened for export."});
    }
  }
  return issues;
}
