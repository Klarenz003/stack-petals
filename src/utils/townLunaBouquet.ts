import type { AtlasBox } from './townSprites'
import { characterView } from './townCharacterArt'

export const LUNA_BOUQUET_ATLAS='/images/town/luna-bouquet-poses.png'
// Per-cell alpha bounds isolate the touching rows. Exclude the mixed-facing
// fourth row; rear-left mirrors the coherent rear-right row instead.
const frames:AtlasBox[][]=[
  [[70,15,167,179],[297,15,168,178],[546,14,186,182],[800,14,179,181]],
  [[64,196,170,176],[302,196,181,174],[553,198,192,175],[808,196,183,176]],
  [[76,374,166,176],[312,374,173,176],[568,374,182,177],[818,374,178,177]],
  [[57,735,172,185],[297,735,167,183],[545,735,175,186],[799,735,175,185]],
  [[45,924,176,180],[297,924,171,179],[540,924,176,181],[799,924,177,182]],
  [[49,1107,173,184],[295,1107,173,184],[544,1107,173,185],[798,1107,178,186]],
  [[51,1297,201,199],[290,1297,199,196],[531,1297,209,199],[789,1297,194,199]],
]
const rows:Record<string,number>={down:0,'down-left':1,left:2,up:3,'up-left':4,'up-right':4,right:5,'down-right':6}

export function lunaBouquetFrame(direction:string,running:boolean,step:number){
  const facing=characterView(direction).facing,phase=Math.abs(step)%2
  // Columns 1/3 give clearer walking stride variation; 3/4 serve running.
  const col=running?2+phase:phase*2
  return {source:LUNA_BOUQUET_ATLAS,box:frames[rows[facing]!]![col]!,
    atlasSize:[1024,1536] as [number,number],flip:facing==='up-left',overlay:false}
}
