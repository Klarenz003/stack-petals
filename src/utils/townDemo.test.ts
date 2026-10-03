import { describe, expect, it } from 'vitest'
import { CHALLENGES, LOCATIONS, doorFor, findTownPath, movePlayer, walkable } from './townDemo'

describe('town demo navigation', () => {
  it('keeps players within the map and outside buildings', () => {
    expect(walkable({ x: -10, y: 300 })).toBe(false)
    expect(walkable({ x: 190, y: 130 })).toBe(false)
    expect(movePlayer({ x: 25, y: 300 }, -10, 0)).toEqual({ x: 25, y: 300 })
    expect(movePlayer({ x: 480, y: 330 }, 10, 0)).toEqual({ x: 490, y: 330 })
  })
  it('finds walkable paths to every location', () => {
    for (const location of LOCATIONS) {
      const path = findTownPath({ x: 480, y: 330 }, doorFor(location))
      expect(path.length).toBeGreaterThan(0)
      expect(path.every(walkable)).toBe(true)
      const end = path[path.length - 1]!
      expect(Math.hypot(end.x - doorFor(location).x, end.y - doorFor(location).y)).toBeLessThan(24)
    }
  })
  it('provides a valid answer for every coding challenge', () => {
    expect(CHALLENGES.every(challenge => challenge.answer >= 0 && challenge.answer < challenge.choices.length)).toBe(true)
  })
})
