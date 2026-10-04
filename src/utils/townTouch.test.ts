import { describe, expect, it } from 'vitest'
import { joystickDirection } from './townTouch'

describe('Town touch controls', () => {
  it('has a stable dead zone', () => {
    expect(joystickDirection(5, 5, 50)).toEqual({ x: 0, y: 0 })
    expect(joystickDirection(NaN, 25, 50)).toEqual({ x: 0, y: 0 })
  })
  it('supports every walking direction including diagonals', () => {
    for (const [x,y] of [[0,-40],[40,-40],[40,0],[40,40],[0,40],[-40,40],[-40,0],[-40,-40]]) {
      const direction = joystickDirection(x!,y!,50)
      expect(direction.x || 0).toBe(Math.sign(x!) || 0)
      expect(direction.y || 0).toBe(Math.sign(y!) || 0)
    }
  })
})
