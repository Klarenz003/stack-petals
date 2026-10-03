import { describe, expect, it } from 'vitest'
import { CAT_POSES, DOG_POSES, petRestSpot, petMovement } from './townPets'
import { walkable } from './townDemo'
describe('directional dog movement', () => {
  it('faces its own movement, not the player facing', () => {
    const start = { x: 100, y: 100 }
    expect(petMovement(start, { x: 110, y: 100 }, 'down')).toEqual({ walking: true, direction: 'right' })
    expect(petMovement(start, { x: 90, y: 100 }, 'right')).toEqual({ walking: true, direction: 'left' })
    expect(petMovement(start, { x: 100, y: 90 }, 'left')).toEqual({ walking: true, direction: 'up' })
    expect(petMovement(start, { x: 100, y: 110 }, 'up')).toEqual({ walking: true, direction: 'down' })
  })
  it('stops walking and keeps its last pose at rest or against an obstacle', () => {
    expect(petMovement({ x: 10, y: 10 }, { x: 10, y: 10 }, 'up')).toEqual({ walking: false, direction: 'up' })
  })
  it('has four distinct atlas poses within the source image', () => {
    expect(new Set(Object.values(DOG_POSES).map(box => box.join(','))).size).toBe(3)
    expect(DOG_POSES.right).toEqual(DOG_POSES.left)
    expect(Object.values(DOG_POSES).every(([x,y,w,h]) => x >= 0 && y >= 0 && x+w <= 1536 && y+h <= 1024)).toBe(true)
  })
  it('provides four distinct cat poses within the atlas', () => {
    expect(new Set(Object.values(CAT_POSES).map(box => box.join(','))).size).toBe(3)
    expect(CAT_POSES.right).toEqual(CAT_POSES.left)
    expect(Object.values(CAT_POSES).every(([x,y,w,h]) => x >= 0 && y >= 0 && x+w <= 1536 && y+h <= 1024)).toBe(true)
  })
  it('rests beside the owner with enough separation for both sprites', () => {
    expect(petRestSpot({x:380,y:340},{x:338,y:340})).toEqual({x:324,y:350})
    expect(petRestSpot({x:380,y:340},{x:440,y:340})).toEqual({x:436,y:350})
  })
  it('chooses an available side at map edges and beside buildings', () => {
    for (const owner of [{x:24,y:300},{x:936,y:300},{x:780,y:540},{x:680,y:500}]) {
      const rest = petRestSpot(owner,{x:owner.x-30,y:owner.y})
      expect(walkable(rest)).toBe(true)
      expect(Math.abs(rest.x-owner.x)).toBeGreaterThanOrEqual(50)
    }
  })
})
