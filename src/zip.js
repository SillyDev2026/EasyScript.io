// Portable ZIP32 "store" encoder (no compression or external dependencies).
// Valid in modern browsers and Node 20+. Safe for small exported projects.
const encoder=new TextEncoder();
function crc32(bytes){
  let crc=0xffffffff;
  for(const byte of bytes){
    crc^=byte;
    for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}
function nameSafe(path){
  const parts=String(path).replace(/\\/g,"/").split("/");
  if(!parts.length||parts.some(x=>!x||x==="."||x===".."||/[\x00-\x1f:<>|?*]/.test(x)))
    throw new Error("Unsafe ZIP entry path: "+path);
  return parts.join("/");
}
export function createZip(entries){
  if(!Array.isArray(entries)||entries.length<1||entries.length>100)
    throw new Error("ZIP needs 1–100 files");
  const payload=[],central=[];
  let offset=0,totalSize=0;
  const names=new Set();
  const addU16=(view,pos,val)=>view.setUint16(pos,val,true);
  const addU32=(view,pos,val)=>view.setUint32(pos,val>>>0,true);
  for(const entry of entries){
    const name=nameSafe(entry.name);
    if(names.has(name.toLowerCase()))throw new Error("Duplicate ZIP filename: "+name);
    names.add(name.toLowerCase());
    const nameBytes=encoder.encode(name);
    if(nameBytes.length>65535)throw new Error("ZIP filename too long");
    const bytes=typeof entry.data==="string"?encoder.encode(entry.data):entry.data;
    if(!(bytes instanceof Uint8Array))throw new Error("ZIP entry must contain text or bytes");
    totalSize+=bytes.byteLength;
    if(totalSize>25_000_000)throw new Error("Workspace ZIP is larger than 25 MB");
    const crc=crc32(bytes);
    const local=new Uint8Array(30+nameBytes.length);
    const v=new DataView(local.buffer);
    addU32(v,0,0x04034b50);addU16(v,4,20);addU16(v,6,0x800);
    addU16(v,8,0);addU32(v,14,crc);addU32(v,18,bytes.length);
    addU32(v,22,bytes.length);addU16(v,26,nameBytes.length);
    local.set(nameBytes,30);
    payload.push(local,bytes);
    const directory=new Uint8Array(46+nameBytes.length);
    const d=new DataView(directory.buffer);
    addU32(d,0,0x02014b50);addU16(d,4,20);addU16(d,6,20);addU16(d,8,0x800);
    addU32(d,16,crc);addU32(d,20,bytes.length);addU32(d,24,bytes.length);
    addU16(d,28,nameBytes.length);addU32(d,42,offset);
    directory.set(nameBytes,46);central.push(directory);
    offset+=local.length+bytes.length;
  }
  const dirSize=central.reduce((a,b)=>a+b.length,0);
  const end=new Uint8Array(22),z=new DataView(end.buffer);
  addU32(z,0,0x06054b50);addU16(z,8,entries.length);addU16(z,10,entries.length);
  addU32(z,12,dirSize);addU32(z,16,offset);
  const result=new Uint8Array(offset+dirSize+end.length);
  let pos=0;
  for(const p of [...payload,...central,end]){result.set(p,pos);pos+=p.length;}
  return result;
}
export function workspaceZipEntries(workspace,bundleSources,generate){
  const scripts=bundleSources(workspace);
  const manifest={format:"EasyScript v1.0 portable bundle",name:workspace.name,
    files:scripts.map(file=>({name:file.filename,kind:file.kind,language:file.language}))};
  return [
    {name:"project.easyscript-workspace.json",data:JSON.stringify(workspace,null,2)},
    {name:"manifest.json",data:JSON.stringify(manifest,null,2)},
    {name:"README.txt",data:"EasyScript.io v1.0 export.\nScripts are source files, not a Roblox place file.\nImport script contents into the correct Script / LocalScript / ModuleScript location in Roblox Studio.\n"},
    ...scripts.map(file=>({name:"scripts/"+file.filename,data:generate(file.project)}))
  ];
}
