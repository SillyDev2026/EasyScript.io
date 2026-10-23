// Pure responsive-layout rules used by the Studio toolbar and regression tests.
// Display CSS uses matching viewport breakpoints; viewport changes never rewrite saved widths.
export const DEFAULT_LAYOUT=Object.freeze({left:19,right:29,scale:100});
export const LIMITS=Object.freeze({left:[15,31],right:[22,42],scale:[85,120],editorMin:27});
export const BREAKPOINTS=Object.freeze({phoneMax:760,tabletMax:1280});
const finite=(value,fallback)=>{
  const number=typeof value==="number"?value:Number(value);
  return Number.isFinite(number)?number:fallback;
};
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
export function normalizeLayoutPrefs(raw={}){
 const src=raw&&typeof raw==="object"?raw:{};
 const scale=Math.round(clamp(finite(src.scale,DEFAULT_LAYOUT.scale),...LIMITS.scale));
 let left=Math.round(clamp(finite(src.left,DEFAULT_LAYOUT.left),...LIMITS.left));
 let right=Math.round(clamp(finite(src.right,DEFAULT_LAYOUT.right),...LIMITS.right));
 const max=100-LIMITS.editorMin;
 if(left+right>max){
   right=Math.max(LIMITS.right[0],max-left);
   if(left+right>max)left=max-right;
 }
 return {left,right,editor:100-left-right,scale};
}
export function layoutMode(viewportWidth){
 const width=finite(viewportWidth,0);
 if(width<=BREAKPOINTS.phoneMax)return "phone";
 if(width<=BREAKPOINTS.tabletMax)return "tablet";
 return "desktop";
}
export function displayedPaneWidths(viewportWidth,prefs){
 const widths=normalizeLayoutPrefs(prefs);
 switch(layoutMode(viewportWidth)){
  case "phone":return {mode:"phone",blocks:100,workspace:100,code:100,visibleOneAtATime:true};
  case "tablet":return {mode:"tablet",blocks:26,workspace:74,code:100,visibleOneAtATime:false};
  default:return {mode:"desktop",blocks:widths.left,workspace:widths.editor,code:widths.right,visibleOneAtATime:false};
 }
}
