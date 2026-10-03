import type { AtlasBox } from './townSprites'
import { characterView } from './townCharacterArt'

export const MILO_IDLE_ATLAS='/images/town/milo-held-idle.png'
export type MiloHeldItem='laptop'|'bouquet'|'letter'
const columns:Record<MiloHeldItem,number>={laptop:0,bouquet:1,letter:2}
// Measured alpha crops from the approved idle concept. The generated sheet
// contains seven rows rather than eight; do not pretend the absent angles exist.
// Mirror the actual left profile/front-left and rear-right to cover all angles.
const frames:AtlasBox[][]=[
  [[221,7,135,205],[444,7,135,205],[668,7,135,207]],
  [[219,216,136,200],[441,216,138,200],[665,216,137,200]],
  [[220,419,137,195],[444,419,136,195],[667,419,137,195]],
  [[218,618,137,197],[441,618,142,200],[665,618,137,200]],
  [[220,818,135,199],[444,819,134,198],[668,818,134,199]],
]
const rows:Record<string,number>={down:0,'down-left':1,'down-right':1,left:2,right:2,'up-left':3,'up-right':3,up:4}

export function miloHeldIdlePose(direction:string,item:MiloHeldItem){
  const facing=characterView(direction).facing
  return {source:MILO_IDLE_ATLAS,box:frames[rows[facing]!]![columns[item]]!,
    atlasSize:[1024,1536] as [number,number],flip:facing==='right'||facing==='down-right'||facing==='up-left',overlay:false}
}
