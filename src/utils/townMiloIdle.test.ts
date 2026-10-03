import {describe,it,expect} from 'vitest'
import {miloHeldIdlePose,MILO_IDLE_ATLAS} from './townMiloIdle'
import {approvedPose} from './townApprovedArt'
const directions=['down','down-left','left','up-left','up','up-right','right','down-right']
const items=['laptop','bouquet','letter'] as const
describe('Milo held-item idle poses',()=>{
  it('covers all 24 directional/item combinations with isolated atlas crops',()=>{
    for(const direction of directions)for(const item of items){
      const pose=approvedPose('boy',direction,item,false,false,0),[x,y,w,h]=pose.box
      expect(pose.source).toBe(MILO_IDLE_ATLAS);expect(pose.overlay).toBe(false)
      expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);expect(w).toBeGreaterThan(0);expect(h).toBeGreaterThan(0)
      expect(x+w).toBeLessThanOrEqual(1024);expect(y+h).toBeLessThanOrEqual(1536)
    }
  })
  it('mirrors the correct source orientations without reusing a front pose as a rear pose',()=>{
    for(const item of items){
      for(const direction of ['down','up'] as const){const a=miloHeldIdlePose(`${direction}-left`,item),b=miloHeldIdlePose(`${direction}-right`,item);expect(a.box).toEqual(b.box);expect(a.flip).not.toBe(b.flip)}
      expect(miloHeldIdlePose('up-left',item).box[1]).toBe(618)
      expect(miloHeldIdlePose('up-right',item).flip).toBe(false)
      expect(miloHeldIdlePose('up',item).box[1]).toBeGreaterThanOrEqual(818)
      expect(miloHeldIdlePose('right',item).flip).toBe(true)
    }
  })
  it('switches back to movement sheets while walking/running and stays idle across step changes',()=>{
    for(const direction of directions)for(const item of items){
      expect(approvedPose('boy',direction,item,true,true,0).source).not.toBe(MILO_IDLE_ATLAS)
      expect(approvedPose('boy',direction,item,false,true,0)).toEqual(approvedPose('boy',direction,item,false,false,1))
    }
  })
  it('preserves the girl and empty-handed/watering artwork',()=>{
    for(const item of items)expect(approvedPose('girl','down',item,false,false,0).source).not.toBe(MILO_IDLE_ATLAS)
    for(const item of ['idle','watering'] as const)expect(approvedPose('boy','down',item,false,false,0).source).not.toBe(MILO_IDLE_ATLAS)
  })
})
