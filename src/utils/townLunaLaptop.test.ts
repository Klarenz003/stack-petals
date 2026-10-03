import {describe,it,expect} from 'vitest'
import {lunaLaptopFrame,LUNA_LAPTOP_ATLAS} from './townLunaLaptop'
import {LUNA_IDLE_ATLAS} from './townLunaIdle'
import {approvedPose} from './townApprovedArt'
const directions=['down','down-left','left','up-left','up','up-right','right','down-right']
describe('Luna carrying a laptop',()=>{
  it('uses isolated new movement frames in every direction without a second laptop overlay',()=>{
    for(const direction of directions)for(const running of [false,true]){
      const a=approvedPose('girl',direction,'laptop',true,running,0),b=approvedPose('girl',direction,'laptop',true,running,1)
      expect(a.source).toBe(LUNA_LAPTOP_ATLAS);expect(a.box).not.toEqual(b.box);expect(a.overlay).toBe(false)
      for(const pose of [a,b]){const[x,y,w,h]=pose.box;expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);expect(w).toBeGreaterThan(0);expect(h).toBeGreaterThan(0);expect(x+w).toBeLessThanOrEqual(1024);expect(y+h).toBeLessThanOrEqual(1536)}
    }
  })
  it('mirrors a consistent rear-right pose for rear-left rather than sampling the inconsistent row',()=>{
    const left=lunaLaptopFrame('up-left',true,0),right=lunaLaptopFrame('up-right',true,0)
    expect(left.box).toEqual(right.box);expect(left.box[1]).toBe(903);expect(left.flip).toBe(true);expect(right.flip).toBe(false)
    expect(lunaLaptopFrame('up',true,0).box[1]).toBe(720)
  })
  it('preserves the new idle pose, Milo and other tools',()=>{
    for(const direction of directions)expect(approvedPose('girl',direction,'laptop',false,false,0).source).toBe(LUNA_IDLE_ATLAS)
    expect(approvedPose('boy','down','laptop',true,false,0).source).not.toBe(LUNA_LAPTOP_ATLAS)
    for(const item of ['idle','bouquet','letter','watering'] as const)expect(approvedPose('girl','down',item,true,false,0).source).not.toBe(LUNA_LAPTOP_ATLAS)
  })
})
