import {describe,it,expect} from 'vitest'
import {lunaHeldIdlePose,LUNA_IDLE_ATLAS} from './townLunaIdle'
import {approvedPose} from './townApprovedArt'
const directions=['down','down-left','left','up-left','up','up-right','right','down-right']
const items=['laptop','bouquet','letter'] as const
describe('Luna held-item idle poses',()=>{
  it('uses 24 distinct measured crops across every direction and held item',()=>{
    const crops=new Set<string>()
    for(const direction of directions)for(const item of items){
      const pose=approvedPose('girl',direction,item,false,false,0),[x,y,w,h]=pose.box
      expect(pose.source).toBe(LUNA_IDLE_ATLAS);expect(pose.overlay).toBe(false);expect(pose.flip).toBe(false)
      expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);expect(w).toBeGreaterThan(0);expect(h).toBeGreaterThan(0)
      expect(x+w).toBeLessThanOrEqual(1536);expect(y+h).toBeLessThanOrEqual(1024);crops.add(pose.box.join(','))
    }
    expect(crops.size).toBe(24)
  })
  it('uses actual rear/right drawings instead of a front pose or mirrored hair clip',()=>{
    for(const item of items){
      expect(lunaHeldIdlePose('up-left',item).box[1]).toBe(276)
      expect(lunaHeldIdlePose('up-right',item).box[1]).toBe(525)
      expect(lunaHeldIdlePose('right',item).box).not.toEqual(lunaHeldIdlePose('left',item).box)
      expect(lunaHeldIdlePose('up',item).box).not.toEqual(lunaHeldIdlePose('down',item).box)
    }
  })
  it('retains existing movement artwork and returns to idle when movement stops',()=>{
    for(const direction of directions)for(const item of items){
      expect(approvedPose('girl',direction,item,true,true,0).source).not.toBe(LUNA_IDLE_ATLAS)
      expect(approvedPose('girl',direction,item,false,true,0)).toEqual(approvedPose('girl',direction,item,false,false,1))
    }
  })
  it('preserves Milo, empty-handed and watering poses',()=>{
    for(const item of items)expect(approvedPose('boy','down',item,false,false,0).source).not.toBe(LUNA_IDLE_ATLAS)
    for(const item of ['idle','watering'] as const)expect(approvedPose('girl','down',item,false,false,0).source).not.toBe(LUNA_IDLE_ATLAS)
  })
})
