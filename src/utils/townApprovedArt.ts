import { characterFrame, type AtlasBox } from './townSprites'
import { characterView } from './townCharacterArt'
import type { TownAction } from './townActivities'
import { miloLaptopFrame } from './townMiloLaptop'
import { miloBouquetFrame } from './townMiloBouquet'
import { miloLetterFrame } from './townMiloLetter'
import { miloHeldIdlePose } from './townMiloIdle'
import { lunaHeldIdlePose } from './townLunaIdle'
import { lunaLaptopFrame } from './townLunaLaptop'
import { lunaBouquetFrame } from './townLunaBouquet'
import { lunaLetterFrame } from './townLunaLetter'
import { wateringPose } from './townWatering'
export const APPROVED_ATLAS='/images/town/chibi-poses-approved.png'
const LEGACY_ATLAS='/images/town/sprite-atlas-clean.png'
const idle={girl:[1048,307,213,246],boy:[1080,560,158,238]} satisfies Record<string,AtlasBox>
const diagonal={
  girl:{'down-left':[49,306,218,242],'down-right':[296,306,217,242],'up-left':[588,308,178,240],'up-right':[798,311,191,237]},
  boy:{'down-left':[68,558,160,240],'down-right':[330,563,149,231],'up-left':[578,560,152,237],'up-right':[839,560,148,238]},
} satisfies Record<string,Record<string,AtlasBox>>
const held={girl:{bouquet:[51,17,226,282],laptop:[312,18,229,281],letter:[561,18,220,280]},boy:{bouquet:[825,9,176,289],laptop:[1080,14,165,284],letter:[1330,13,162,286]}} satisfies Record<string,Record<string,AtlasBox>>
const angled={girl:{bouquet:[50,800,197,218],laptop:[307,801,188,217],letter:[564,800,201,219]},boy:{bouquet:[827,800,151,219],laptop:[1069,800,146,219],letter:[1341,800,145,218]}} satisfies Record<string,Record<string,AtlasBox>>
export type ApprovedPose={source:string;box:AtlasBox;flip:boolean;overlay:boolean;atlasSize?:[number,number]}
/** The approved concept supplies 24 poses, not a complete animation atlas.
 * Retain verified cardinal walk/run frames; never invent missing frames by
 * sampling another pose's cell. SVG viewports preserve the generated pixels. */
export function approvedPose(character:string,direction:string,action:TownAction,walking:boolean,running:boolean,step:number):ApprovedPose {
  const person=character==='girl'?'girl':'boy',view=characterView(direction)
  const make=(box:AtlasBox,flip=false,overlay=false):ApprovedPose=>({source:APPROVED_ATLAS,box,flip,overlay})
  if(action==='watering')return wateringPose(person,direction,walking,running,step)
  if(person==='boy'&&action==='laptop'&&walking)return miloLaptopFrame(direction,running,step)
  if(person==='boy'&&action==='bouquet'&&walking)return miloBouquetFrame(direction,running,step)
  if(person==='boy'&&action==='letter'&&walking)return miloLetterFrame(direction,running,step)
  if(person==='girl'&&action==='laptop'&&walking)return lunaLaptopFrame(direction,running,step)
  if(person==='girl'&&action==='bouquet'&&walking)return lunaBouquetFrame(direction,running,step)
  if(person==='girl'&&action==='letter'&&walking)return lunaLetterFrame(direction,running,step)
  if(person==='boy'&&!walking&&(action==='laptop'||action==='bouquet'||action==='letter'))return miloHeldIdlePose(direction,action)
  if(person==='girl'&&!walking&&(action==='laptop'||action==='bouquet'||action==='letter'))return lunaHeldIdlePose(direction,action)
  if(walking&&!view.diagonal){
    const frame=characterFrame(`${person}-${view.facing}`,true,running,step)!
    return {source:LEGACY_ATLAS,box:frame.box,flip:!!frame.flip,overlay:action!=='idle'}
  }
  if(action==='laptop'&&view.back){
    return make(angled[person].laptop,person==='girl'?view.mirrored:!view.mirrored)
  }
  if(action!=='idle'&&!view.back){
    if(view.diagonal||view.side){
      // Angled bouquet/letter poses face opposite ways for the two characters.
      // The angled laptop poses are rear views; use the front laptop here.
      if(action==='laptop')return make(held[person].laptop,view.mirrored)
      const sourceLeft=(person==='boy'&&action==='bouquet')||(person==='girl'&&action==='letter')
      return make(angled[person][action],sourceLeft?!view.mirrored:view.mirrored)
    }
    return make(held[person][action])
  }
  if(view.diagonal)return make(diagonal[person][view.facing as keyof typeof diagonal.boy],false,action!=='idle')
  if(view.facing==='down')return make(idle[person],false,action!=='idle')
  const frame=characterFrame(`${person}-${view.facing}`,false,false,0)!
  return {source:LEGACY_ATLAS,box:frame.box,flip:!!frame.flip,overlay:action!=='idle'}
}
