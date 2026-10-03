import {describe,it,expect} from 'vitest'
import {miloLetterFrame,MILO_LETTER_ATLAS} from './townMiloLetter'
import {approvedPose} from './townApprovedArt'
describe('Milo carrying a letter',()=>{
  it('uses isolated measured frames in all eight directions for walking and running',()=>{
    for(const direction of ['down','down-left','left','up-left','up','up-right','right','down-right'])for(const running of [false,true]){
      const a=approvedPose('boy',direction,'letter',true,running,0),b=approvedPose('boy',direction,'letter',true,running,1)
      expect(a.source).toBe(MILO_LETTER_ATLAS);expect(a.box).not.toEqual(b.box);expect(a.overlay).toBe(false)
      for(const pose of [a,b]){const[x,y,w,h]=pose.box;expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);expect(w).toBeGreaterThan(0);expect(h).toBeGreaterThan(0);expect(x+w).toBeLessThanOrEqual(1024);expect(y+h).toBeLessThanOrEqual(1536);expect(pose.flip).toBe(false)}
    }
  })
  it('keeps rear and front diagonal crops in their own directional rows',()=>{
    expect(miloLetterFrame('up-right',true,0).box[1]).toBe(963)
    expect(miloLetterFrame('down-right',true,0).box[1]).toBe(1346)
    expect(miloLetterFrame('up',true,0).box[1]).toBe(769)
  })
  it('preserves idle art, the girl, and other tools',()=>{
    expect(approvedPose('boy','down','letter',false,false,0).source).not.toBe(MILO_LETTER_ATLAS)
    expect(approvedPose('girl','down','letter',true,false,0).source).not.toBe(MILO_LETTER_ATLAS)
    for(const action of ['idle','laptop','bouquet','watering'] as const)expect(approvedPose('boy','down',action,true,false,0).source).not.toBe(MILO_LETTER_ATLAS)
  })
})
