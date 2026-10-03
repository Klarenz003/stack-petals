import type { AtlasBox } from './townSprites'
import { characterView } from './townCharacterArt'

export const MILO_BOUQUET_ATLAS='/images/town/milo-bouquet-poses.png'
// Alpha bounds measured from the approved image. The first two columns touch
// between rows 1 and 2; split at their narrowest alpha boundary, not a grid guess.
const frames:AtlasBox[][]=[
  [[128,9,127,186],[342,8,127,185],[553,10,124,184],[767,10,123,184]],
  [[128,195,127,190],[342,193,127,187],[554,197,124,189],[767,198,125,187]],
  [[131,386,123,188],[341,384,121,190],[556,386,123,188],[770,387,123,189]],
  [[135,578,120,186],[345,578,118,179],[558,579,118,186],[772,580,117,186]],
  [[130,767,122,189],[344,767,119,185],[558,768,121,191],[770,767,123,193]],
  [[129,958,124,184],[342,959,123,184],[560,961,123,181],[775,961,128,182]],
  [[125,1149,126,190],[339,1149,125,190],[555,1152,125,187],[774,1151,124,190]],
]
const rows:Record<string,number>={down:0,'down-left':1,'down-right':1,left:2,'up-left':3,up:4,'up-right':5,right:6}

export function miloBouquetFrame(direction:string,running:boolean,step:number){
  const facing=characterView(direction).facing,row=rows[facing]!,phase=Math.abs(step)%2
  // Rear walking frames have opposing feet. Front/profile walk pairs in the
  // concept are similar, so use columns 1 and 3 for clearer stride variation.
  const col=running?2+phase:row>=3&&row<=5?phase:phase*2
  return {source:MILO_BOUQUET_ATLAS,box:frames[row]![col]!,atlasSize:[1024,1536] as [number,number],flip:facing==='down-right',overlay:false}
}
