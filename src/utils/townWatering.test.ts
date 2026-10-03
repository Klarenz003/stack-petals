import {describe,it,expect} from 'vitest'
import {approvedPose} from './townApprovedArt'
import {wateringPose,MILO_WATERING_ATLAS,LUNA_WATERING_ATLAS} from './townWatering'
const directions=['down','down-left','left','up-left','up','up-right','right','down-right']
describe('watering-can poses for both characters',()=>{
  it('supplies idle, walking and running crops in all eight directions',()=>{
    for(const character of ['boy','girl'])for(const direction of directions){
      const poses=[approvedPose(character,direction,'watering',false,false,0),
        ...[false,true].flatMap(running=>[0,1].map(step=>approvedPose(character,direction,'watering',true,running,step)))]
      expect(new Set(poses.map(p=>p.box.join(','))).size).toBe(5)
      for(const pose of poses){
        expect(pose.source).toBe(character==='girl'?LUNA_WATERING_ATLAS:MILO_WATERING_ATLAS)
        expect(pose.overlay).toBe(false);expect(pose.flip).toBe(false)
        const[x,y,w,h]=pose.box,[aw,ah]=pose.atlasSize!
        expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0)
        expect(w).toBeGreaterThan(0);expect(h).toBeGreaterThan(0)
        expect(x+w).toBeLessThanOrEqual(aw);expect(y+h).toBeLessThanOrEqual(ah)
      }
    }
  })
  it('keeps idle fixed regardless of the previous running step',()=>{
    for(const character of ['boy','girl'])for(const direction of directions){
      expect(wateringPose(character,direction,false,true,1)).toEqual(wateringPose(character,direction,false,false,0))
    }
  })
  it('uses separate rear-diagonal artwork with fallback to down for invalid directions',()=>{
    for(const character of ['boy','girl']){
      expect(wateringPose(character,'up-left',true,true,0).box).not.toEqual(wateringPose(character,'up-right',true,true,0).box)
      expect(wateringPose(character,'invalid',false,false,0)).toEqual(wateringPose(character,'down',false,false,0))
      for(const action of ['idle','laptop','letter','bouquet'] as const){
        expect(approvedPose(character,'down',action,true,false,0).source).not.toContain('watering')
      }
    }
  })
})
