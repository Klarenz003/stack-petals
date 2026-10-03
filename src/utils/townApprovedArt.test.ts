import { describe,expect,it } from 'vitest'
import { approvedPose,APPROVED_ATLAS } from './townApprovedArt'
import { MILO_IDLE_ATLAS } from './townMiloIdle'
import { LUNA_IDLE_ATLAS } from './townLunaIdle'
describe('approved chibi sheet integration',()=>{
  it('keeps every pose crop inside its transparent source atlas',()=>{
    for(const character of ['boy','girl'])for(const direction of ['up','down','left','right','up-left','up-right','down-left','down-right'])for(const action of ['idle','laptop','bouquet','letter','watering'] as const)for(const walking of [true,false])for(const step of [0,1]){
      const {box:[x,y,w,h],atlasSize=[1536,1024]}=approvedPose(character,direction,action,walking,true,step)
      expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);expect(w).toBeGreaterThan(0);expect(h).toBeGreaterThan(0)
      expect(x+w).toBeLessThanOrEqual(atlasSize[0]);expect(y+h).toBeLessThanOrEqual(atlasSize[1])
    }
  })
  it('uses approved front holding and genuinely rear-facing laptop poses',()=>{
    for(const person of ['girl','boy'])for(const action of ['letter','laptop','bouquet'] as const){
      const pose=approvedPose(person,'down',action,false,false,0)
      expect(pose.source).toBe(person==='boy'?MILO_IDLE_ATLAS:LUNA_IDLE_ATLAS);expect(pose.overlay).toBe(false)
    }
    const girl=approvedPose('girl','up-right','laptop',false,false,0),boy=approvedPose('boy','up-left','laptop',false,false,0)
    expect(girl.box[1]).toBe(525);expect(girl.flip).toBe(false);expect(boy.box[1]).toBe(618);expect(boy.flip).toBe(true)
  })
  it('retains true cardinal running frames and isolated generated diagonal poses',()=>{
    expect(approvedPose('boy','right','idle',true,true,1).source).not.toBe(APPROVED_ATLAS)
    expect(approvedPose('boy','right','idle',true,true,1).flip).toBe(true)
    const front=approvedPose('girl','down-right','idle',true,false,1),rear=approvedPose('girl','up-right','idle',true,false,1)
    expect(front.source).toBe(APPROVED_ATLAS);expect(front.box).not.toEqual(rear.box)
  })
})
