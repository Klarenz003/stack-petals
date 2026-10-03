import {describe,it,expect} from 'vitest'
import {lunaBouquetFrame,LUNA_BOUQUET_ATLAS} from './townLunaBouquet'
import {LUNA_IDLE_ATLAS} from './townLunaIdle'
import {approvedPose} from './townApprovedArt'
const directions=['down','down-left','left','up-left','up','up-right','right','down-right']
describe('Luna carrying flowers',()=>{
  it('uses isolated movement frames for all eight directions without duplicate flowers',()=>{
    for(const direction of directions)for(const running of [false,true]){
      const a=approvedPose('girl',direction,'bouquet',true,running,0),b=approvedPose('girl',direction,'bouquet',true,running,1)
      expect(a.source).toBe(LUNA_BOUQUET_ATLAS);expect(a.box).not.toEqual(b.box);expect(a.overlay).toBe(false)
      for(const pose of [a,b]){const[x,y,w,h]=pose.box;expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);expect(w).toBeGreaterThan(0);expect(h).toBeGreaterThan(0);expect(x+w).toBeLessThanOrEqual(1024);expect(y+h).toBeLessThanOrEqual(1536)}
    }
  })
  it('uses a consistent rear-facing row for both diagonals',()=>{
    const left=lunaBouquetFrame('up-left',true,0),right=lunaBouquetFrame('up-right',true,0)
    expect(left.box).toEqual(right.box);expect(left.box[1]).toBe(924);expect(left.flip).toBe(true);expect(right.flip).toBe(false)
    expect(lunaBouquetFrame('up',true,0).box[1]).toBe(735)
  })
  it('preserves idle flowers, Milo and other tools',()=>{
    for(const direction of directions)expect(approvedPose('girl',direction,'bouquet',false,false,0).source).toBe(LUNA_IDLE_ATLAS)
    expect(approvedPose('boy','down','bouquet',true,false,0).source).not.toBe(LUNA_BOUQUET_ATLAS)
    for(const item of ['idle','laptop','letter','watering'] as const)expect(approvedPose('girl','down',item,true,false,0).source).not.toBe(LUNA_BOUQUET_ATLAS)
  })
})
