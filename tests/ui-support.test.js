import test from "node:test";
import assert from "node:assert/strict";
import {projectTemplate} from "../src/engine.js";
import {tokenize} from "../src/highlight.js";
import {LIBRARY_KEY,listSavedProjects,saveProjectSnapshot,openSavedProject,deleteSavedProject} from "../src/library.js";

function fakeStorage(){
  const data=new Map();
  return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};
}
test("project library stores and restores multiple independent snapshots",()=>{
  const storage=fakeStorage(),a=projectTemplate("starter");
  const id=saveProjectSnapshot(storage,a,Date.UTC(2026,9,23));
  a.blocks[0].fields.value="900";
  assert.equal(listSavedProjects(storage).length,1);
  assert.equal(openSavedProject(storage,id).blocks[0].fields.value,"100");
  saveProjectSnapshot(storage,projectTemplate("counter"),Date.UTC(2026,9,24));
  assert.equal(listSavedProjects(storage).length,2);
  assert.equal(deleteSavedProject(storage,id),true);
  assert.equal(deleteSavedProject(storage,id),false);
  assert.equal(listSavedProjects(storage).length,1);
  assert.ok(storage.getItem(LIBRARY_KEY));
});
test("project library rejects invalid payloads",()=>{
  const storage=fakeStorage();
  storage.setItem(LIBRARY_KEY,JSON.stringify({projects:"oops"}));
  assert.throws(()=>listSavedProjects(storage),/invalid/);
});
test("tokenizer preserves input and separates keywords from strings",()=>{
  const src='local text = "if then" -- comment\nprint(text)';
  const tokens=tokenize(src,"luau");
  assert.equal(tokens.map(t=>t.value).join(""),src);
  assert.ok(tokens.some(t=>t.kind==="keyword"&&t.value==="local"));
  assert.ok(tokens.some(t=>t.kind==="string"&&t.value==='"if then"'));
  assert.ok(tokens.some(t=>t.kind==="comment"&&t.value==="-- comment"));
});
test("JS tokenizer does not mistake identifiers for keywords",()=>{
  const src="const defaultValue = 100; console.log(defaultValue);";
  const tokens=tokenize(src,"javascript");
  assert.equal(tokens.map(t=>t.value).join(""),src);
  assert.equal(tokens.find(t=>t.value==="defaultValue").kind,"text");
  assert.equal(tokens.find(t=>t.value==="100").kind,"number");
});
