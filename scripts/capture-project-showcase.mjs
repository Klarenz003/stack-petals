/** Isolated, demo-data captures. All Supabase/Edge requests are intercepted.
 * Requires Vite and a separate headless Chrome on CDP port 9243.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.join(root,'public/videos/showcase-assets');
fs.mkdirSync(output,{recursive:true});
const base=process.env.FILM_BASE_URL||'http://127.0.0.1:5181';
const cdp=process.env.FILM_CDP_URL||'http://127.0.0.1:9243';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function connect(target){const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();const listeners=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}else for(const fn of listeners)fn(m)});const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,m=>m.error?reject(Error(m.error.message)):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}))});const run=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};return {ws,send,run,listeners}}
const tabs=await(await fetch(cdp+'/json')).json();const app=await connect(tabs.find(t=>t.type==='page'));let encoder;const errors=[];
app.listeners.push(m=>{if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.method==='Fetch.requestPaused'){const url=m.params.request.url;const capabilities=[{id:'showcase-blue',has_360_view:true},{id:'showcase-pink',has_360_view:true}];app.send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'}],body:Buffer.from(JSON.stringify(url.includes('/products?')?capabilities:[])).toString('base64')})}});
const fixture=`[
 {id:'showcase-blue',baseProductId:'showcase-blue',name:'Hello World in Blue',price:'₱1,999.00',salePrice:'₱1,999.00',originalPrice:'₱2,899.00',priceAmount:2899,salePriceAmount:1999,image:'/images/home-experience/bouquet-qr-guide.png',category:'Celebration',badge:'New',stock:10,featured:true,has360Viewer:true,preOrderAllowed:true,prepDays:5},
 {id:'showcase-pink',baseProductId:'showcase-pink',name:'A Little Sunshine',price:'₱899.00',priceAmount:899,image:'/images/b2.png',category:'Romance',badge:'Handcrafted',stock:8,featured:true,has360Viewer:true,preOrderAllowed:true,prepDays:5},
 {id:'showcase-lilac',name:'Git merge lavender + blue',price:'₱899.00',priceAmount:899,image:'/images/b3.png',category:'Sympathy',stock:0,featured:true,preOrderAllowed:true,prepDays:5},
 {id:'showcase-blush',name:'Blush & Bytes',price:'₱1,499.00',priceAmount:1499,image:'/images/b1.png',category:'Romance',stock:8,featured:true,preOrderAllowed:true,prepDays:5}
]`;
async function navigate(route,selector){await app.send('Page.navigate',{url:base+route});await sleep(400);for(let i=0;i<150;i++){if(await app.run(`!!document.querySelector(${JSON.stringify(selector)})`))break;await sleep(100)}if(!await app.run(`!!document.querySelector(${JSON.stringify(selector)})`))throw Error('Missing '+selector);await sleep(500)}
async function shot(name,selector){await app.run('document.fonts.ready');if(selector)await app.run(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start',behavior:'instant'})`);await sleep(350);const r=await app.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(r.data,'base64'));console.log('Captured',name)}
async function captureLetter(){await navigate('/letter-test?theme=romance','#open-button');await sleep(700);await shot('letter');await app.run(`document.querySelector('#open-button').click()`);let ready=false;for(let i=0;i<200;i++){ready=await app.run(`getComputedStyle(document.querySelector('#story')).display!=='none' && getComputedStyle(document.querySelector('#story')).visibility==='visible' && document.querySelector('#curtain').hidden`);if(ready)break;await sleep(100)}if(!ready)throw Error('Letter opening animation did not finish.');await app.run(`document.querySelector('#reasons-section').scrollIntoView({block:'start',behavior:'instant'})`);await sleep(1200);await shot('chapter-two');}
async function cartState(step){await app.run(`(async()=>{const {useCartStore}=await import('/src/stores/cart.ts');const c=useCartStore();c.cartItems=${fixture}.slice(0,2).map(p=>({...p,quantity:1}));c.customer={...c.customer,name:'Milo',email:'milo@example.com',phone:'',deliveryMethod:'pickup',date:'2026-10-10'};c.letterData={...c.letterData,include:true,theme:'romance',fromName:'Milo',recipientName:'Luna',mainMessage:'You make ordinary days feel extraordinary. Here is a little reminder of how much you mean to me. Every petal, every memory, every word is for you.',petalMessages:['Your smile makes everything brighter.','Thank you for your everyday kindness.','Our little adventures mean the world to me.','I love the way you care.','You make a simple day feel special.','Here is to many more little moments.'],memories:['/images/b1.png','/images/b2.png','/images/b3.png'],bouquetKey:'showcase-blue'};c.cartOpen=${step===0};c.checkoutStep=${step};})()`);await sleep(1000)}
try{
 await app.send('Runtime.enable');await app.send('Page.enable');
 await app.send('Fetch.enable',{patterns:[{urlPattern:'*rest/v1/*'},{urlPattern:'*functions/v1/*'},{urlPattern:'*supabase.co/storage/*'}]});
 await app.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.clear();sessionStorage.setItem('stack-petals:startup-ready:v1','ready');`});
 await app.send('Emulation.setDeviceMetricsOverride',{width:430,height:880,deviceScaleFactor:2,mobile:false});
 if(process.argv.includes('--letter-only')){await captureLetter();}else{
 await navigate('/','.hero');
 await app.run(`(()=>{const s=document.createElement('style');s.textContent='.petal-chat,.cart-btn{visibility:hidden!important}';document.head.append(s)})()`);
 await shot('home');
 await navigate('/products','.studio-catalog-tools');
 await app.run(`(async()=>{const {useProductsStore}=await import('/src/stores/products.ts');const s=useProductsStore();s.allProducts=${fixture};s.fetchError='';s.loading=false;})()`);
 await shot('collection','.grid.wide-grid');
 await cartState(0);await shot('cart');
 await cartState(1);await shot('checkout');
 await cartState(3);await shot('composer');
 await app.run(`(async()=>{const {useCartStore}=await import('/src/stores/cart.ts');const c=useCartStore();c.cartOpen=false;c.checkoutStep=0})()`);
 await captureLetter();
 await navigate('/about','.journey-timeline');await shot('about','.about-timeline-section');
 // Capture a real gameplay clip by forwarding Chrome screencast frames to a
 // second page's Canvas + MP4 recorder. Neither page can write to the backend.
 await app.send('Emulation.setDeviceMetricsOverride',{width:1280,height:940,deviceScaleFactor:1,mobile:false});
 await navigate('/town-preview','[data-enter-town]');await app.run(`document.querySelector('[data-enter-town]').click()`);await sleep(800);
 await app.run(`document.querySelector('.town-play-area').scrollIntoView({block:'start',behavior:'instant'})`);await sleep(250);await shot('town');
 const target=await app.send('Target.createTarget',{url:'about:blank'});const updated=await(await fetch(cdp+'/json')).json();encoder=await connect(updated.find(t=>t.id===target.targetId));
 const crop=await app.run(`(()=>{const r=document.querySelector('.town-map-shell').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()`);
 await encoder.run(`(()=>{window.can=document.createElement('canvas');can.width=960;can.height=600;document.body.append(can);window.cx=can.getContext('2d');window.stream=can.captureStream(0);window.chunks=[];window.rec=new MediaRecorder(stream,{mimeType:'video/mp4;codecs=avc1.42001f',videoBitsPerSecond:6000000});rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};window.draw=async s=>{const i=new Image();i.src='data:image/jpeg;base64,'+s;await i.decode();cx.fillStyle='#eee9da';cx.fillRect(0,0,960,600);cx.drawImage(i,${crop.x},${crop.y},${crop.width},${crop.height},0,0,960,600);stream.getVideoTracks()[0].requestFrame()};return true})()`);
 await app.send('Page.bringToFront');
 await app.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 await app.run(`document.querySelector('.town-pause-overlay button')?.click()`);
 let drawing=false,count=0;app.listeners.push(m=>{if(m.method!=='Page.screencastFrame')return;app.send('Page.screencastFrameAck',{sessionId:m.params.sessionId});if(drawing)return;drawing=true;encoder.run('draw('+JSON.stringify(m.params.data)+')').then(()=>count++).finally(()=>drawing=false)});
 await app.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1280,maxHeight:940,everyNthFrame:1});await sleep(300);await encoder.run('rec.start(500)');
 const key=async(k,down)=>app.send('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code:k==='Shift'?'ShiftLeft':'Arrow'+k.slice(5),windowsVirtualKeyCode:{ArrowRight:39,ArrowDown:40,ArrowLeft:37,ArrowUp:38,Shift:16}[k]});
 await app.run(`document.querySelector('.town-map-shell').click()`);
 await key('ArrowRight',true);await sleep(1300);await key('ArrowRight',false);
 await key('ArrowDown',true);await key('Shift',true);await sleep(800);await key('ArrowDown',false);await key('Shift',false);
 await app.run(`[...document.querySelectorAll('.town-pocket-tools button')].find(b=>b.textContent.includes('Laptop')).click()`);
 await key('ArrowLeft',true);await sleep(1300);await key('ArrowLeft',false);
 await app.run(`[...document.querySelectorAll('.town-pocket-tools button')].find(b=>b.textContent.includes('Flowers')).click()`);
 await key('ArrowUp',true);await key('ArrowRight',true);await sleep(1100);await key('ArrowUp',false);await key('ArrowRight',false);
 await app.run(`[...document.querySelectorAll('.town-pocket-tools button')].find(b=>b.textContent.includes('Letter')).click()`);
 await key('ArrowDown',true);await sleep(800);await key('ArrowDown',false);await sleep(300);
 if(await app.run(`!!document.querySelector('.town-pause-overlay')`))throw Error('Town unexpectedly paused during gameplay capture.');
 await app.send('Page.stopScreencast');await encoder.run(`new Promise(resolve=>{rec.onstop=()=>{window.clip=new Blob(chunks,{type:rec.mimeType});resolve(clip.size)};rec.stop()})`);
 const bytes=await encoder.run(`(async()=>{window.bytes=new Uint8Array(await clip.arrayBuffer());return bytes.length})()`);const chunks=[];
 for(let offset=0;offset<bytes;offset+=262144){const s=await encoder.run(`(()=>{let s='';for(const b of bytes.subarray(${offset},${offset+262144}))s+=String.fromCharCode(b);return btoa(s)})()`);chunks.push(Buffer.from(s,'base64'))}
 fs.writeFileSync(path.join(output,'town-gameplay.mp4'),Buffer.concat(chunks));console.log('Recorded Town gameplay:',count,'frames,',bytes,'bytes');
 if(count<20)throw Error('Too few gameplay frames.');if(errors.length)throw Error(errors.join('; '));
 }
}finally{await app.send('Browser.close');app.ws.close();encoder?.ws.close()}
