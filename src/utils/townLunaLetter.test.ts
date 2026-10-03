import {describe,it,expect} from 'vitest'
import {lunaLetterFrame,LUNA_LETTER_ATLAS} from './townLunaLetter'
import {LUNA_IDLE_ATLAS} from './townLunaIdle'
import {approvedPose} from './townApprovedArt'
const directions=['down','down-left','left','up-left','up','up-right','right','down-right']
describe('Luna carrying a message',()=>{
  it('uses separate movement frames in all eight directions without duplicate envelopes',()=>{
    for(const direction of directions)for(const running of [false,true]){
      const a=approvedPose('girl',direction,'letter',true,running,0),b=approvedPose('girl',direction,'letter',true,running,1)
      expect(a.source).toBe(LUNA_LETTER_ATLAS);expect(a.box).not.toEqual(b.box);expect(a.overlay).toBe(false)
      expect(a.atlasSize).toEqual([887,1774])
      for(const pose of [a,b]){const[x,y,w,h]=pose.box;expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);expect(w).toBeGreaterThan(0);expect(h).toBeGreaterThan(0);expect(x+w).toBeLessThanOrEqual(887);expect(y+h).toBeLessThanOrEqual(1774)}
    }
  })
  it('uses distinct authored rear diagonals without mirroring',()=>{
    const left=lunaLetterFrame('up-left',true,0),right=lunaLetterFrame('up-right',true,0)
    expect(left.box[1]).toBe(642);expect(right.box[1]).toBe(1055)
    expect(left.flip).toBe(false);expect(right.flip).toBe(false)
    expect(lunaLetterFrame('up',true,0).box[1]).toBe(849)
  })
  it('preserves idle messages, Milo and other tools',()=>{
    for(const direction of directions)expect(approvedPose('girl',direction,'letter',false,false,0).source).toBe(LUNA_IDLE_ATLAS)
    expect(approvedPose('boy','down','letter',true,false,0).source).not.toBe(LUNA_LETTER_ATLAS)
    for(const item of ['idle','laptop','bouquet','watering'] as const)expect(approvedPose('girl','down',item,true,false,0).source).not.toBe(LUNA_LETTER_ATLAS)
  })
})
