// Local browser regression check. Start Vite on 5183 and test Chrome with CDP on 9243.
// All data/reporting requests are intercepted; the test closes that Chrome instance.
const fs=require('node:fs'),assert=require('node:assert/strict');const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const tabs=await(await fetch('http://127.0.0.1:9243/json')).json();const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
const send=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}))});
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);if(m.method==='Fetch.requestPaused')send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'},{name:'Access-Control-Allow-Headers',value:'*'},{name:'Access-Control-Allow-Methods',value:'GET,POST,OPTIONS'}],body:Buffer.from('[]').toString('base64')})});
const run=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value};
await send('Runtime.enable');await send('Page.enable');await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});await send('Fetch.enable',{patterns:[{urlPattern:'*rest/v1/*'},{urlPattern:'*functions/v1/*'}]});
await send('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('stack-petals:startup-ready:v1','ready');localStorage.removeItem('stack-petals:town-demo:v1')`});
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:'http://127.0.0.1:5183/town-preview'});
for(let n=0;n<150;n++){if(await run(`!!document.querySelector('.town-dialog-header button')`))break;await delay(100)}await delay(800);
await run(`document.querySelector('.town-dialog-header button').click()`);await delay(300);
for(const [width,height] of [[390,844],[320,740],[768,1024],[844,390]]){
await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await delay(300);
const state=await run(`(()=>{let j=document.querySelector('.town-joystick').getBoundingClientRect(),a=document.querySelector('.town-touch-action').getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth,joystick:j.width,action:a.height,controls:getComputedStyle(document.querySelector('.town-controls')).display,panels:getComputedStyle(document.querySelector('.town-sidebar')).display,columns:getComputedStyle(document.querySelector('.town-play-area')).gridTemplateColumns}})()`);
assert.equal(state.overflow,false);assert.equal(state.joystick,width===844?86:112);assert.ok(state.action>=44);assert.equal(state.controls,'none');assert.equal(state.panels,'none');console.log('PASS layout',width,height,state);
const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(`C:/Users/evasc/AppData/Local/Temp/town-mobile-${width}.png`,Buffer.from(shot.result.data,'base64'));
}
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await run(`scrollTo(0,0)`);await delay(300);
const position=()=>run(`(()=>{const a=document.querySelector('.town-player');return{x:parseFloat(a.style.left),y:parseFloat(a.style.top)}})()`);
const initial=await position();let center=await run(`(()=>{const r=document.querySelector('.town-joystick').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()`);
const touch=(type,x,y)=>send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y,id:1}]});
await touch('touchStart',center.x,center.y);await touch('touchMove',center.x+33,center.y+33);await delay(180);const moving=await position();assert.ok(moving.x>initial.x+5&&moving.y>initial.y+5,'diagonal movement');await touch('touchEnd');await delay(100);const stopped=await position();await delay(160);assert.deepEqual(await position(),stopped);console.log('PASS diagonal movement and release',initial,moving,stopped);
await run(`document.querySelector('.town-touch-run').click()`);assert.equal(await run(`document.querySelector('.town-touch-run').getAttribute('aria-pressed')`),'true');
await touch('touchStart',center.x,center.y);await touch('touchMove',center.x,center.y+33);await delay(120);await touch('touchCancel');await delay(100);const canceled=await position();await delay(150);assert.deepEqual(await position(),canceled);console.log('PASS run toggle and pointer cancellation');
await run(`document.querySelector('.town-hud button').click()`);assert.equal(await run(`!!document.querySelector('.town-pause-overlay')`),true);assert.equal(await run(`document.querySelector('.town-joystick').classList.contains('disabled')`),true);await run(`document.querySelector('.town-pause-overlay button').click()`);
await run(`document.querySelector('.town-mobile-tabs button:last-child').click()`);assert.notEqual(await run(`getComputedStyle(document.querySelector('#town-activities')).display`),'none');await run(`document.querySelector('.town-pocket-tools button:nth-of-type(2)').click()`);assert.equal(await run(`document.querySelector('.town-pocket-tools button:nth-of-type(2)').getAttribute('aria-pressed')`),'true');await run(`document.querySelector('.town-mobile-tabs button:last-child').click()`);
await run(`document.querySelector('.town-map-toggle').click()`);assert.equal(await run(`document.querySelector('.town-map-viewport').classList.contains('town-overview')`),true);await run(`document.querySelector('.town-map-toggle').click()`);
await run(`document.querySelector('.town-mobile-tabs button:first-child').click()`);await run(`document.querySelector('[data-destination="flowers"]').click()`);assert.equal(await run(`getComputedStyle(document.querySelector('.town-sidebar')).display`),'none');
await send('Emulation.setTouchEmulationEnabled',{enabled:false});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await delay(300);assert.equal(await run(`!!document.querySelector('.town-joystick')`),false);assert.notEqual(await run(`getComputedStyle(document.querySelector('.town-controls')).display`),'none');assert.notEqual(await run(`getComputedStyle(document.querySelector('.town-sidebar')).display`),'none');

await run(`document.querySelector('.town-play-toggle').focus({preventScroll:true}); scrollTo(0,130)`);
const oldScroll=await run('scrollY');
await run(`document.querySelector('.town-play-toggle').click()`);await delay(400);
assert.equal(await run(`document.querySelector('.town-demo').classList.contains('town-playmode')`),true);
const native=await run('!!document.fullscreenElement');assert.equal(native,true);console.log('Native fullscreen active:',native);
assert.equal(await run(`document.documentElement.style.overflow`),'hidden');
for(const [width,height] of [[1440,900],[390,844],[320,740],[844,390]]){
 await send('Emulation.setTouchEmulationEnabled',{enabled:width<1000,maxTouchPoints:5});await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});await delay(250);
 const state=await run(`(()=>{const r=document.querySelector('.town-demo').getBoundingClientRect(),e=document.querySelector('.town-play-toggle').getBoundingClientRect(),j=document.querySelector('.town-joystick').getBoundingClientRect(),a=document.querySelector('.town-touch-action').getBoundingClientRect();return{width:r.width,height:r.height,exit:e.bottom<=innerHeight&&e.left>=0,joystick:j.top>=0&&j.bottom<=innerHeight,action:a.top>=0&&a.bottom<=innerHeight,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
 assert.equal(state.width,width);assert.equal(state.height,height);assert.ok(state.exit&&state.joystick&&state.action);assert.equal(state.overflow,false);console.log('PASS play mode',width,height,state);
 const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('C:/Users/evasc/AppData/Local/Temp/town-playmode-'+width+'.png',Buffer.from(shot.result.data,'base64'));
}
await run(`document.querySelector('.town-mobile-tabs button:last-child').click()`);assert.equal(await run(`document.querySelector('.town-joystick').classList.contains('disabled')`),true);
await run(`document.querySelector('.town-mobile-tabs button:last-child').click()`);
await run(`document.querySelector('[aria-label="Town settings"]').click()`);assert.equal(await run(`!!document.querySelector('.town-dialog')`),true);
await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});await delay(100);
assert.equal(await run(`!!document.querySelector('.town-dialog')`),false);assert.equal(await run(`!!document.querySelector('.town-playmode')`),true);
await run(`document.querySelector('.town-play-toggle').click()`);await delay(250);assert.equal(await run(`!!document.querySelector('.town-playmode')`),false);assert.equal(await run('!!document.fullscreenElement'),false);assert.equal(await run(`document.documentElement.style.overflow`),'');
await send('Emulation.setTouchEmulationEnabled',{enabled:false});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await delay(200);
await run(`document.querySelector('.town-demo').requestFullscreen=()=>Promise.reject(new Error('Synthetic denied fullscreen')); scrollTo(0,130)`);const fallbackScroll=await run('scrollY');
await run(`document.querySelector('.town-play-toggle').click()`);await delay(200);assert.equal(await run(`!!document.querySelector('.town-playmode')`),true);assert.equal(await run('!!document.fullscreenElement'),false);
await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});await delay(250);assert.equal(await run(`!!document.querySelector('.town-playmode')`),false);assert.equal(await run('scrollY'),fallbackScroll);assert.equal(await run(`document.documentElement.style.overflow`),'');
await run(`Object.defineProperty(document,'fullscreenEnabled',{configurable:true,value:false});document.querySelector('.town-play-toggle').click()`);await delay(100);assert.equal(await run(`!!document.querySelector('.town-playmode')`),true);await run(`document.querySelector('.town-play-toggle').click()`);await delay(100);
await run(`document.querySelector('.town-play-toggle').click()`);await delay(100);
await run(`document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/')`);await delay(100);assert.equal(await run(`document.documentElement.style.overflow`),'');assert.equal(await run(`!!document.querySelector('.town-playmode')`),false);
console.log('PASS native fullscreen, explicit exit, dialog Escape, denied/unsupported fallback, scroll restoration, fallback Escape, and route cleanup');
assert.equal(errors.length,0);console.log('PASS pause, tools, map, destination panels, desktop restoration, and no runtime exceptions');await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
