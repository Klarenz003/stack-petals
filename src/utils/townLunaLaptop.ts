import type { AtlasBox } from './townSprites'
import { characterView } from './townCharacterArt'

export const LUNA_LAPTOP_ATLAS='/images/town/luna-laptop-poses.png'
// Measured per-cell alpha bounds: some generated rows touch. The inconsistent
// fourth row is excluded; mirror the coherent rear-right row for rear-left.
const frames:AtlasBox[][]=[
  [[82,19,159,171],[319,19,156,169],[559,19,161,171],[799,19,160,171]],
  [[83,194,157,172],[326,193,158,171],[570,194,164,172],[809,194,163,172]],
  [[92,366,156,173],[334,367,156,172],[574,366,163,174],[818,366,162,174]],
  [[68,719,164,178],[311,720,163,177],[549,720,168,180],[798,719,167,181]],
  [[67,903,162,181],[309,903,162,178],[549,903,168,179],[801,902,162,177]],
  [[64,1084,156,186],[298,1085,165,185],[547,1089,162,185],[791,1087,166,186]],
  [[61,1282,178,198],[304,1283,181,198],[540,1286,194,197],[788,1286,181,196]],
]
const rows:Record<string,number>={down:0,'down-left':1,left:2,up:3,'up-left':4,'up-right':4,right:5,'down-right':6}

export function lunaLaptopFrame(direction:string,running:boolean,step:number){
  const facing=characterView(direction).facing,phase=Math.abs(step)%2
  // Similar walk pairs in the concept use columns 1 and 3 for a clearer
  // stride variation. Run uses columns 3 and 4 with the existing movement bob.
  const col=running?2+phase:phase*2
  return {source:LUNA_LAPTOP_ATLAS,box:frames[rows[facing]!]![col]!,
    atlasSize:[1024,1536] as [number,number],flip:facing==='up-left',overlay:false}
}
