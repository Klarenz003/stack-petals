/** Original Stack Petals Town composition. No samples, lyrics or external services.
 * Run: node scripts/generate-town-soundtrack.mjs
 * A Little Sunshine — F major, 80 BPM, 24 bars, seamless 72-second loop.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rate = 32000, bpm = 80, beat = 60 / bpm, bars = 24
const duration = bars * 4 * beat, length = Math.round(duration * rate)
const left = new Float64Array(length), right = new Float64Array(length)
const frequency = midi => 440 * 2 ** ((midi - 69) / 12)
let randomState = 8132026
function random() { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296 }
function add(time, seconds, voice, volume, pan = 0) {
  const start = Math.round(time * rate), count = Math.ceil(seconds * rate)
  const l = Math.sqrt((1 - pan) / 2), r = Math.sqrt((1 + pan) / 2)
  for (let i = 0; i < count; i++) {
    const t = i / rate, index = (start + i) % length
    const sample = voice(t, seconds) * volume
    left[index] += sample * l; right[index] += sample * r
  }
}
function piano(midi, time, velocity = .15, pan = 0) {
  const f = frequency(midi)
  add(time, 2.8, t => {
    const attack = Math.min(1, t / .008), decay = Math.exp(-t * 2.2)
    return attack * (Math.sin(2*Math.PI*f*t)*decay + .25*Math.sin(2*Math.PI*f*2.002*t)*Math.exp(-t*4) + .09*Math.sin(2*Math.PI*f*3.006*t)*Math.exp(-t*7))
  }, velocity, pan)
}
function bell(midi, time, velocity = .06, pan = .35) {
  const f = frequency(midi)
  add(time, 3, t => Math.min(1,t/.006) * (Math.sin(2*Math.PI*f*t)*Math.exp(-t*2.5) + .22*Math.sin(2*Math.PI*f*3*t)*Math.exp(-t*5) + .08*Math.sin(2*Math.PI*f*7*t)*Math.exp(-t*8)), velocity, pan)
}
function pad(notes, time) {
  for (const [i,midi] of notes.entries()) {
    const f = frequency(midi)
    add(time, beat*4 + .8, (t, end) => {
      const envelope = Math.min(1,t/.65) * Math.min(1,(end-t)/.8)
      return envelope * (Math.sin(2*Math.PI*f*t) + .35*Math.sin(2*Math.PI*f*1.002*t)) * (.85 + .15*Math.sin(2*Math.PI*.4*t))
    }, .024, (i % 2 ? 1 : -1) * .65)
  }
}
function bass(midi, time) {
  const f=frequency(midi)
  add(time, 1.1, t => Math.min(1,t/.025)*Math.exp(-t*3)*(Math.sin(2*Math.PI*f*t)+.12*Math.sin(2*Math.PI*f*2*t)),.11,0)
}
function brush(time, pan) {
  add(time,.10,t => (random()*2-1)*Math.exp(-t*65)*Math.min(1,t/.003),.015,pan)
}
// Fmaj9, Am7, Dm9, Cadd9, Bbmaj9, Gm9, C6, Fmaj9.
const A = [
  [41,[57,60,64,67]], [45,[55,60,64,69]], [38,[57,60,64,65]], [36,[55,60,62,67]],
  [34,[57,60,62,65]], [43,[58,62,65,69]], [36,[57,60,64,67]], [41,[57,60,64,67]],
]
const B = [A[2],A[4],A[0],A[3],A[5],A[1],A[4],A[3]]
const harmony = [...A,...B,...A.slice(0,7),A[3]]
// Hand-written melody: gaps and held notes keep it calm during dialogue.
const melodyA = [
  [[0,72],[1,69],[2.5,67]], [[0,69],[1.5,72],[3,76]],
  [[0,77],[1,76],[2,72]], [[.5,74],[2,72],[3,67]],
  [[0,65],[1.5,69],[3,72]], [[0,70],[1,69],[2.5,67]],
  [[0,64],[1.5,67],[3,69]], [[0,72],[2,69]],
]
const melodyB = [
  [[0,77],[1.5,81],[3,79]], [[0,77],[2,74]],
  [[0,76],[1,77],[2.5,72]], [[0,74],[2,76]],
  [[.5,74],[1.5,70],[3,69]], [[0,72],[2,69]],
  [[0,65],[1.5,69],[2.5,70]], [[0,67],[2,64]],
]
for (let bar=0;bar<bars;bar++) {
  const start=bar*4*beat, [root,chord]=harmony[bar]
  pad(chord.slice(0,3),start)
  bass(root,start); if(bar%4!==3) bass(root+12,start+2.5*beat)
  // A relaxed, lightly swung broken-chord accompaniment.
  for (let step=0;step<8;step++) {
    const offset=step*.5+(step%2 ? .035 : 0)
    piano(chord[[0,2,1,3,0,2,1,2][step]],start+offset*beat,.055,-.32)
  }
  const melody=bar>=8&&bar<16 ? melodyB[bar-8] : melodyA[bar%8]
  for (const [offset,note] of melody) {
    piano(note,start+offset*beat,.13,.16)
    if((bar+offset)%3===0) bell(note+12,start+offset*beat,.035,.5)
  }
  if(bar%4===0) bell(chord[3]+12,start+3.5*beat,.028,-.4)
  for(let tick=0;tick<4;tick++) brush(start+(tick+.5)*beat,tick%2 ? .45 : -.45)
}
// Circular delay/reverb preserves ringing notes across the loop seam.
const dryL=left.slice(),dryR=right.slice()
for(const [delay,gain] of [[.14,.10],[beat*.75,.14],[beat*1.5,.08],[.47,.06]]) {
  const offset=Math.round(delay*rate)
  for(let i=0;i<length;i++) { const target=(i+offset)%length;left[target]+=dryR[i]*gain;right[target]+=dryL[i]*gain }
}
let peak=0,energy=0
for(let i=0;i<length;i++){peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));energy+=left[i]**2+right[i]**2}
const gain=.72/peak
const bytes=Buffer.alloc(44+length*4)
bytes.write('RIFF',0);bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8)
bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(2,22)
bytes.writeUInt32LE(rate,24);bytes.writeUInt32LE(rate*4,28);bytes.writeUInt16LE(4,32);bytes.writeUInt16LE(16,34)
bytes.write('data',36);bytes.writeUInt32LE(length*4,40)
for(let i=0;i<length;i++){bytes.writeInt16LE(Math.round(left[i]*gain*32767),44+i*4);bytes.writeInt16LE(Math.round(right[i]*gain*32767),46+i*4)}
const output=fileURLToPath(new URL('../public/audio/town/a-little-sunshine.wav',import.meta.url))
mkdirSync(path.dirname(output),{recursive:true});writeFileSync(output,bytes)
console.log(JSON.stringify({output,title:'A Little Sunshine',duration,bpm,sampleRate:rate,channels:2,bytes:bytes.length,peakDb:20*Math.log10(.72),rmsDb:20*Math.log10(Math.sqrt(energy/(length*2))*gain),loop:true},null,2))
