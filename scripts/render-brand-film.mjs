/** Reproducible Chrome/Canvas export. No cloud video service or customer data.
 * Start Vite, then Chrome with --headless=new --autoplay-policy=no-user-gesture-required
 * --remote-debugging-port=9243. Run node scripts/render-brand-film.mjs [preview|render|verify]
 * Optional: FILM_BASE_URL, FILM_CDP_URL environment variables.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const base=process.env.FILM_BASE_URL||'http://127.0.0.1:5181';
const cdp=process.env.FILM_CDP_URL||'http://127.0.0.1:9243';
const mode=process.argv[2]||'preview';
const showcase=process.argv.includes('--showcase');
const filmName=showcase?'stack-petals-project-showcase':'stack-petals-brand-film';
const duration=showcase?60:30;
const tabs=await(await fetch(cdp+'/json')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();const errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text)});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,m=>m.error?reject(Error(m.error.message)):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}))});
const run=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try {
 await send('Runtime.enable');await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1080,height:2080,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:base+'/videos/'+filmName+'.html'});
 for(let i=0;i<200;i++){if(await run('!!window.filmReady'))break;if(errors.length)throw Error(errors.join('; '));await sleep(100)}
 if(!await run('!!window.filmReady'))throw Error('Film assets did not finish loading.');
 if(mode==='preview'){
  for(const t of showcase?[3,9,16,22,28,34,40,46,51,58]:[2,4.7,6.5,10.5,14,16.5,19,21.5,25,28.5]){
   const result=await run(`(()=>{brandFilm.render(${t});return document.querySelector('canvas').toDataURL('image/png').split(',')[1]})()`);
   const directory=path.join(os.tmpdir(),'stack-petals-film-frames');fs.mkdirSync(directory,{recursive:true});
   const output=path.join(directory,filmName+'-frame-'+t+'.png');
   fs.writeFileSync(output,Buffer.from(result,'base64'));console.log('Frame',t,'saved');
   if(showcase&&t===58)fs.writeFileSync(path.join(root,'public/videos/'+filmName+'-poster.png'),Buffer.from(result,'base64'));
  }
 } else if(mode==='render') {
  console.log('Rendering',duration,'second 1080×1920 MP4 with audio…');
  const meta=await run('brandFilm.start(true)');console.log('Recorded',meta);
  const bytes=await run(`(async()=>{window.filmBytes=new Uint8Array(await filmBlob.arrayBuffer());return filmBytes.length})()`);
  const parts=[];
  for(let offset=0;offset<bytes;offset+=262144){const part=await run(`(()=>{let s='';const a=filmBytes.subarray(${offset},${offset+262144});for(let i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s)})()`);parts.push(Buffer.from(part,'base64'))}
  const output=path.join(root,'public/videos/'+filmName+'.mp4');
  if(fs.existsSync(output))throw Error('Existing MP4 found. Choose a new filename or explicitly remove the previous export.');
  fs.writeFileSync(output,Buffer.concat(parts));console.log('Saved',output,bytes,'bytes');
 } else if(mode==='verify') {
  const meta=await run(`(async()=>{const v=document.createElement('video');v.muted=true;v.src='/videos/${filmName}.mp4';document.body.append(v);await new Promise((resolve,reject)=>{v.onloadedmetadata=resolve;v.onerror=()=>reject(Error('MP4 decode failed'))});await v.play();await new Promise(r=>setTimeout(r,1200));const meta={duration:v.duration,width:v.videoWidth,height:v.videoHeight,playedSeconds:v.currentTime,decodedFrames:v.getVideoPlaybackQuality().totalVideoFrames,audioDecodedBytes:v.webkitAudioDecodedByteCount};v.pause();return meta})()`);
  if(meta.width!==1080||meta.height!==1920||Math.abs(meta.duration-duration)>.75)throw Error('Unexpected export metadata: '+JSON.stringify(meta));
  if(meta.playedSeconds<.5||meta.decodedFrames<5||meta.audioDecodedBytes===0)throw Error('Export playback/audio verification failed: '+JSON.stringify(meta));
  console.log('PASS MP4 metadata',meta);
 } else throw Error('Unknown mode: '+mode);
 if(errors.length)throw Error(errors.join('; '));
} finally {await send('Browser.close');ws.close()}
