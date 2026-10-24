// Pure viewport-based layout calculations used by controls and CSS geometry.
export const DEFAULT_LAYOUT=Object.freeze({left:19,right:29,scale:100,height:72,dock:"right"});
export const LIMITS=Object.freeze({left:[15,31],right:[22,42],scale:[85,120],height:[45,95],editorMin:27});
export const BREAKPOINTS=Object.freeze({phoneMax:760,tabletMax:1280});
const finite=(value,fallback)=>{
  if(value===null||value===undefined||value==="")return fallback;
  const parsed=typeof value==="number"?value:Number(value);
  return Number.isFinite(parsed)?parsed:fallback;
};
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
export function normalizeLayoutPrefs(raw={}){
  const p=raw&&typeof raw==="object"?raw:{};
  const scale=Math.round(clamp(finite(p.scale,DEFAULT_LAYOUT.scale),...LIMITS.scale));
  const height=Math.round(clamp(finite(p.height,DEFAULT_LAYOUT.height),...LIMITS.height));
  const dock=p.dock==="bottom"?"bottom":"right";
  let left=Math.round(clamp(finite(p.left,DEFAULT_LAYOUT.left),...LIMITS.left));
  let right=Math.round(clamp(finite(p.right,DEFAULT_LAYOUT.right),...LIMITS.right));
  const max=100-LIMITS.editorMin;
  if(left+right>max){
    right=Math.max(LIMITS.right[0],max-left);
    if(left+right>max)left=max-right;
  }
  return {left,right,editor:100-left-right,scale,height,dock};
}
export function layoutMode(viewportWidth){
  const width=finite(viewportWidth,0);
  if(width<=BREAKPOINTS.phoneMax)return "phone";
  if(width<=BREAKPOINTS.tabletMax)return "tablet";
  return "desktop";
}
export function displayedPaneWidths(viewportWidth,prefs={}){
  const p=normalizeLayoutPrefs(prefs),mode=layoutMode(viewportWidth);
  if(mode==="phone")return {mode,blocks:100,workspace:100,code:100,visibleOneAtATime:true,dock:"tabs"};
  if(mode==="tablet")return {mode,blocks:26,workspace:74,code:100,visibleOneAtATime:false,dock:"bottom"};
  if(p.dock==="bottom")return {mode,blocks:p.left,workspace:100-p.left,code:100,visibleOneAtATime:false,dock:"bottom"};
  return {mode,blocks:p.left,workspace:p.editor,code:p.right,visibleOneAtATime:false,dock:"right"};
}
export function layoutVariables(prefs={}){
  const p=normalizeLayoutPrefs(prefs);
  return {
    "--pane-left-fr":p.left+"fr",
    "--pane-editor-fr":p.editor+"fr",
    "--pane-right-fr":p.right+"fr",
    "--pane-bottom-editor-fr":(100-p.left)+"fr",
    "--pane-height-vh":String(p.height),
    "--ui-scale":String(p.scale/100)
  };
}
