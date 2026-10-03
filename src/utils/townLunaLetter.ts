import type { AtlasBox } from './townSprites'
import { characterView } from './townCharacterArt'

export const LUNA_LETTER_ATLAS='/images/town/luna-letter-poses.png'
// Measured crops from the approved message sheet, not evenly sized guesses.
const frames:AtlasBox[][]=[
  [[37,16,182,197],[252,16,176,197],[465,15,180,198],[682,16,175,197]],
  [[34,223,180,201],[252,223,180,201],[470,223,180,201],[685,224,182,200]],
  [[44,432,173,203],[261,432,172,203],[481,432,176,203],[701,432,163,204]],
  [[46,643,161,196],[258,642,160,197],[470,642,162,197],[691,643,162,196]],
  [[37,849,170,195],[252,849,166,195],[466,849,169,195],[684,850,168,195]],
  [[25,1055,177,201],[243,1055,173,201],[461,1055,171,201],[680,1055,172,201]],
  [[31,1266,170,214],[243,1266,179,215],[460,1266,183,215],[682,1267,181,214]],
  [[30,1490,182,219],[240,1490,186,219],[451,1490,190,221],[671,1490,189,221]],
]
const rows:Record<string,number>={down:0,'down-left':1,left:2,'up-left':3,up:4,'up-right':5,right:6,'down-right':7}

export function lunaLetterFrame(direction:string,running:boolean,step:number){
  const facing=characterView(direction).facing,phase=Math.abs(step)%2
  const col=running?2+phase:phase
  return {source:LUNA_LETTER_ATLAS,box:frames[rows[facing]!]![col]!,
    atlasSize:[887,1774] as [number,number],flip:false,overlay:false}
}
