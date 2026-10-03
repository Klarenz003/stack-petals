import type { AtlasBox } from './townSprites'
import { characterView } from './townCharacterArt'

export const MILO_LETTER_ATLAS='/images/town/milo-letter-poses.png'
// Measured connected alpha bounds: this sheet has a transparent gap around
// all 32 frames, so no arbitrary grid cuts or neighbouring sprites are needed.
const frames:AtlasBox[][]=[
  [[89,13,128,184],[324,13,125,185],[567,12,129,185],[810,13,123,184]],
  [[83,203,128,182],[324,204,129,181],[564,203,130,183],[813,202,129,185]],
  [[85,390,122,184],[326,391,124,180],[569,390,134,184],[815,390,130,182]],
  [[85,580,117,184],[327,580,122,184],[574,580,119,184],[816,580,122,185]],
  [[85,769,124,187],[327,770,124,186],[569,769,127,188],[815,769,126,185]],
  [[84,963,127,185],[325,963,126,185],[574,963,129,182],[815,963,129,181]],
  [[81,1152,124,186],[328,1153,123,186],[569,1153,131,185],[818,1154,126,185]],
  [[81,1346,129,181],[326,1346,127,184],[571,1346,126,180],[814,1346,129,182]],
]
const rows:Record<string,number>={down:0,'down-left':1,left:2,'up-left':3,up:4,'up-right':5,right:6,'down-right':7}

export function miloLetterFrame(direction:string,running:boolean,step:number){
  const row=rows[characterView(direction).facing]!,phase=Math.abs(step)%2
  // The concept's first two front frames have similar strides. Use columns
  // 1 and 3 for the walk variation; run uses 3 and 4 plus the existing bob.
  const col=running?2+phase:phase*2
  return {source:MILO_LETTER_ATLAS,box:frames[row]![col]!,atlasSize:[1024,1536] as [number,number],flip:false,overlay:false}
}
