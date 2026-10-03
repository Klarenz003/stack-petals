import { describe, expect, it } from 'vitest'
import { activityTarget, canWork, travelDirection, TOWN_ACTIVITIES } from './townActivities'
import { findTownPath, movePlayer, walkable } from './townDemo'
describe('eight-way travel and little town errands',()=>{
  it('faces all eight directions from actual displacement',()=>{
    for(const [x,y,direction] of [[1,0,'right'],[-1,0,'left'],[0,1,'down'],[0,-1,'up'],[1,1,'down-right'],[-1,1,'down-left'],[1,-1,'up-right'],[-1,-1,'up-left']] as const)
      expect(travelDirection({x:0,y:0},{x,y},'down')).toBe(direction)
    expect(travelDirection({x:0,y:0},{x:0,y:0},'up-left')).toBe('up-left')
  })
  it('ignores tiny axis drift instead of flickering into diagonal poses',()=>{
    expect(travelDirection({x:0,y:0},{x:10,y:1},'down')).toBe('right')
  })
  it('uses reachable targets and cannot work remotely or beyond the final step',()=>{
    for(const id of ['lights','blooms','notes'] as const) {
      TOWN_ACTIVITIES[id].targets.forEach((target,step)=>{
        expect(walkable(target)).toBe(true);expect(canWork(id,step,target)).toBe(true)
        expect(canWork(id,step,{x:24,y:30})).toBe(false)
      })
      expect(activityTarget(id,99)).toBeNull();expect(canWork(id,99,{x:853,y:337})).toBe(false)
    }
  })
  it('routes diagonally without cutting building corners',()=>{
    for(const destination of [{x:650,y:305},{x:190,y:550},{x:853,y:337}]){
      const path=findTownPath({x:380,y:340},destination)
      expect(path.length).toBeGreaterThan(0)
      for(let index=1;index<path.length;index++){
        const before=path[index-1]!,after=path[index]!
        expect(walkable(after)).toBe(true)
        if(before.x!==after.x&&before.y!==after.y){expect(walkable({x:before.x,y:after.y})).toBe(true);expect(walkable({x:after.x,y:before.y})).toBe(true)}
      }
    }
    const diagonal=findTownPath({x:324,y:372},{x:396,y:444})
    expect(diagonal.length).toBe(4)
  })
  it('moves both axes in open space and slides along a blocked wall',()=>{
    expect(movePlayer({x:380,y:340},10,10)).toEqual({x:390,y:350})
    const next=movePlayer({x:384,y:180},12,12)
    expect(walkable(next)).toBe(true);expect(next.x).toBe(384);expect(next.y).toBe(192)
  })
})
