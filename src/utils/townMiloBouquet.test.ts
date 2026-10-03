import {describe,it,expect} from 'vitest'
import {miloBouquetFrame,MILO_BOUQUET_ATLAS} from './townMiloBouquet'
import {approvedPose} from './townApprovedArt'
describe('Milo carrying flowers',()=>{
  it('uses isolated generated frames for walking and running in every direction',()=>{
    for(const direction of ['down','down-left','left','up-left','up','up-right','right','down-right'])for(const running of [false,true]){
      const a=approvedPose('boy',direction,'bouquet',true,running,0),b=approvedPose('boy',direction,'bouquet',true,running,1)
      expect(a.source).toBe(MILO_BOUQUET_ATLAS);expect(a.box).not.toEqual(b.box);expect(a.overlay).toBe(false)
      for(const pose of [a,b]){const[x,y,w,h]=pose.box;expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);expect(w).toBeGreaterThan(0);expect(h).toBeGreaterThan(0);expect(x+w).toBeLessThanOrEqual(1024);expect(y+h).toBeLessThanOrEqual(1536)}
    }
  })
  it('uses the real rear-right row and mirrors front-left for front-right',()=>{
    expect(miloBouquetFrame('up-right',true,0).box[1]).toBeGreaterThan(950)
    expect(miloBouquetFrame('up-right',true,0).flip).toBe(false)
    expect(miloBouquetFrame('down-right',true,0).box).toEqual(miloBouquetFrame('down-left',true,0).box)
    expect(miloBouquetFrame('down-right',true,0).flip).toBe(true)
  })
  it('preserves idle poses, other tools and the girl',()=>{
    expect(approvedPose('boy','down','bouquet',false,false,0).source).not.toBe(MILO_BOUQUET_ATLAS)
    expect(approvedPose('girl','down','bouquet',true,false,0).source).not.toBe(MILO_BOUQUET_ATLAS)
    expect(approvedPose('boy','down','laptop',true,false,0).source).not.toBe(MILO_BOUQUET_ATLAS)
    expect(approvedPose('boy','down','idle',true,false,0).source).not.toBe(MILO_BOUQUET_ATLAS)
  })
})
