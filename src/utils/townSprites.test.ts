import { describe, expect, it } from 'vitest'
import { characterFrame } from './townSprites'
describe('single-frame directional characters', () => {
  it('uses isolated atlas rectangles in every direction and movement mode', () => {
    for(const person of ['boy','girl']) for(const direction of ['up','down','left','right']) for(const running of [false,true]) for(const step of [0,1]) {
      const frame = characterFrame(`${person}-${direction}`,true,running,step)!
      const [x,y,w,h] = frame.box
      expect(x+w).toBeLessThanOrEqual(1536); expect(y+h).toBeLessThanOrEqual(1024)
      expect(w).toBeLessThanOrEqual(80);expect(h).toBeLessThanOrEqual(108)
    }
  })
  it('mirrors the verified left profile for right walk and run steps', () => {
    for(const person of ['boy','girl']) for(const running of [false,true]) {
      const left=characterFrame(`${person}-left`,true,running,1)!,right=characterFrame(`${person}-right`,true,running,1)!
      expect(right.box).toEqual(left.box);expect(right.flip).toBe(true);expect(left.flip).toBe(false)
    }
  })
  it('uses run rows only when running and stops on the idle pose', () => {
    expect(characterFrame('girl-right',true,true,1)!.box[1]).toBe(561)
    expect(characterFrame('girl-right',true,false,1)!.box[1]).toBe(456)
    expect(characterFrame('girl-right',false,true,1)!.box[1]).toBe(348)
  })
  it('never includes the adjacent girl in left/right movement crops', () => {
    for (const running of [false,true]) for (const direction of ['left','right']) {
      const [x,,w] = characterFrame(`girl-${direction}`,true,running,1)!.box
      expect(x+w).toBeLessThanOrEqual(710)
    }
  })
  it('supports diagonal facing and isolated holding poses for both characters',()=>{
    for(const person of ['boy','girl'])for(const direction of ['up-left','up-right','down-left','down-right'])for(const action of ['idle','laptop','bouquet','letter','watering'] as const){
      const frame=characterFrame(`${person}-${direction}`,false,false,0,action)!
      expect(frame).not.toBeNull();expect(frame.box[2]).toBeLessThanOrEqual(80);expect(frame.box[3]).toBeLessThanOrEqual(108)
    }
    expect(characterFrame('boy-down',false,false,0,'laptop')!.box[1]).toBe(647)
    expect(characterFrame('girl-down',false,false,0,'letter')!.box[1]).toBe(746)
    expect(characterFrame('girl-down',true,false,1,'letter')!.box).toEqual(characterFrame('girl-down',true,false,1)!.box)
  })
})
