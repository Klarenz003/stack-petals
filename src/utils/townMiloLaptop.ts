import type { AtlasBox } from './townSprites'
import { characterView } from './townCharacterArt'

export const MILO_LAPTOP_ATLAS='/images/town/milo-laptop-poses.png'
// The generated rows touch. These per-column cuts follow the narrowest alpha
// boundary, rather than assuming evenly spaced cells or connected components.
const cuts=[
  [0,199,389,582,770,970,1161,1351,1536],
  [0,199,390,583,775,971,1161,1351,1536],
  [0,199,392,583,771,971,1165,1352,1536],
  [0,196,390,582,775,968,1163,1351,1536],
]
const columns=[[75,170],[310,160],[550,170],[790,165]]
const rows:Record<string,number>={down:0,'down-left':1,'down-right':1,left:2,right:6,'up-left':3,'up-right':3,up:4}

export function miloLaptopFrame(direction:string,running:boolean,step:number){
  const facing=characterView(direction).facing
  // Column 1 and 3 have the clearest stride difference for walking. The
  // generated pairs are not a complete authored gait; CSS supplies the bob.
  const col=running?2+(Math.abs(step)%2):(Math.abs(step)%2)*2
  const row=rows[facing]!,boundaries=cuts[col]!,[x,width]=columns[col]!
  const top=boundaries[row]!,bottom=boundaries[row+1]!
  return {source:MILO_LAPTOP_ATLAS,box:[x!,top,width!,bottom-top] as AtlasBox,
    atlasSize:[1024,1536] as [number,number],flip:facing==='up-right'||facing==='down-right',overlay:false}
}
