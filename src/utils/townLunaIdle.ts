import type { AtlasBox } from './townSprites'
import { characterView } from './townCharacterArt'

export const LUNA_IDLE_ATLAS='/images/town/luna-held-idle.png'
export type LunaHeldItem='laptop'|'bouquet'|'letter'
const columns:Record<LunaHeldItem,number>={laptop:0,bouquet:1,letter:2}
// Measured crops, not uniform cell guesses. The sheet has two angle groups
// per row: laptop/bouquet/letter repeated across six columns. Keep the actual
// right-facing drawings so Luna's flower clip is not needlessly mirrored.
const frames:Record<string,AtlasBox[]>={
  down:[[40,19,224,251],[300,20,216,250],[537,19,221,251]],
  'down-left':[[801,20,213,250],[1045,20,223,250],[1295,19,209,251]],
  left:[[57,276,197,245],[312,276,198,245],[556,276,190,247]],
  'up-left':[[807,276,201,244],[1058,276,206,244],[1326,276,188,244]],
  up:[[30,527,207,225],[285,526,204,225],[529,523,198,229]],
  'up-right':[[784,525,196,226],[1035,525,199,226],[1293,525,201,230]],
  right:[[32,752,193,248],[279,756,204,245],[523,757,191,244]],
  'down-right':[[778,756,213,246],[1025,756,227,246],[1285,756,220,246]],
}

export function lunaHeldIdlePose(direction:string,item:LunaHeldItem){
  return {source:LUNA_IDLE_ATLAS,box:frames[characterView(direction).facing]![columns[item]]!,
    atlasSize:[1536,1024] as [number,number],flip:false,overlay:false}
}
