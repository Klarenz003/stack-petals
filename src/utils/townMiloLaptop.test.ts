import {describe,it,expect} from 'vitest'
import {miloLaptopFrame,MILO_LAPTOP_ATLAS} from './townMiloLaptop'
import {approvedPose} from './townApprovedArt'
describe('Milo carrying a laptop',()=>{
  it('uses the new sheet for walking and running in all eight directions',()=>{
    for(const direction of ['down','up','left','right','up-left','up-right','down-left','down-right'])for(const running of [true,false]){
      const a=approvedPose('boy',direction,'laptop',true,running,0),b=approvedPose('boy',direction,'laptop',true,running,1)
      expect(a.source).toBe(MILO_LAPTOP_ATLAS);expect(a.box).not.toEqual(b.box);expect(a.overlay).toBe(false)
      for(const pose of [a,b]){const[x,y,w,h]=pose.box;expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);expect(x+w).toBeLessThanOrEqual(1024);expect(y+h).toBeLessThanOrEqual(1536)}
    }
  })
  it('mirrors actual rear/front diagonal frames rather than a profile facing the wrong way',()=>{
    for(const direction of ['up','down'] as const){const left=miloLaptopFrame(`${direction}-left`,true,0),right=miloLaptopFrame(`${direction}-right`,true,0);expect(left.box).toEqual(right.box);expect(left.flip).toBe(false);expect(right.flip).toBe(true)}
  })
  it('preserves idle artwork, the girl, and other tools',()=>{
    expect(approvedPose('boy','down','laptop',false,false,0).source).not.toBe(MILO_LAPTOP_ATLAS)
    expect(approvedPose('girl','down','laptop',true,false,0).source).not.toBe(MILO_LAPTOP_ATLAS)
    expect(approvedPose('boy','down','letter',true,false,0).source).not.toBe(MILO_LAPTOP_ATLAS)
  })
})
