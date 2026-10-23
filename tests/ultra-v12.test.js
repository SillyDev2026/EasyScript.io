import test from "node:test";
import assert from "node:assert/strict";
import {projectTemplate,addBlock} from "../src/engine.js";
import {remoteGuardTemplate,guiTemplate,simulateDataStore,staticSecurityReport,visualTestTemplate} from "../src/ultra-expansion-engine.js";
test("Remote guard validates numeric inputs, cooldowns and player cleanup",()=>{
 const src=remoteGuardTemplate({event:"ShopRequest",max:450,cooldown:0.6});
 assert.match(src,/WaitForChild\("ShopRequest"\)/);
 assert.match(src,/amount > 450/);
 assert.match(src,/now - lastCall\[player\] < 0.6/);
 assert.match(src,/Players.PlayerRemoving:Connect/);
 assert.match(src,/TODO: check player permissions/);
 assert.doesNotMatch(src,/_G/);
});
test("Remote guard clamps numeric bounds and quotes names",()=>{
 const src=remoteGuardTemplate({event:'Invalid")',max:999999999,cooldown:-1});
 assert.match(src,/WaitForChild\("GameEvent"\)/);
 assert.match(src,/amount > 100000/);
 assert.match(src,/now - lastCall\[player\] < 0.05/);
});
test("ScreenGui generator creates client UI with properly sized anchored frame",()=>{
 const src=guiTemplate({name:"ShopUI",label:"Buy now",width:420,height:160});
 assert.match(src,/local player = Players.LocalPlayer/);
 assert.match(src,/gui.Name = "ShopUI"/);
 assert.match(src,/frame.Size = UDim2.fromOffset\(420, 160\)/);
 assert.match(src,/button.Text = "Buy now"/);
 assert.match(src,/button.Activated:Connect/);
});
test("DataStore failure simulator shows retries and never performs network calls",()=>{
 const result=simulateDataStore({failurePattern:[true,true,false],retries:5,initial:5,increment:10});
 assert.equal(result.success,true);
 assert.equal(result.value,15);
 assert.equal(result.attempts,3);
 assert.deepEqual(result.history.map(x=>x.status),["failed","failed","success"]);
 const failed=simulateDataStore({failurePattern:[true,true,true],retries:2});
 assert.equal(failed.success,false);
 assert.equal(failed.attempts,2);
});
test("static security report flags unsafe remotes and DataStores without running code",()=>{
 const p=projectTemplate("blank");
 addBlock(p,"remoteReceived");
 addBlock(p,"datastoreUpdate");
 const report=staticSecurityReport(p);
 assert.equal(report.counts.remotes,1);
 assert.equal(report.counts.datas,1);
 assert.ok(report.issues.some(x=>x.message.includes("rate limiting")));
 assert.ok(report.issues.some(x=>x.message.includes("throttle")));
 assert.ok(report.disclaimer.includes("Static"));
});
test("test script generator avoids inserting invalid identifiers",()=>{
 const src=visualTestTemplate({variable:"score",expected:12});
 assert.match(src,/local score = 12/);
 assert.match(src,/assertEqual\(score, 12, "score"\)/);
 const fallback=visualTestTemplate({variable:'a")',expected:"oops"});
 assert.match(fallback,/local Coins = 100/);
});
