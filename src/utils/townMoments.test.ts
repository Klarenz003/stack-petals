import { describe, it, expect } from 'vitest'
import { makeCircuit, circuitConnected, circuitPower } from './townCircuit'
import { deliveryBeat, DELIVERY_SCENE_SECONDS, LUNA_NOTES } from './townMoments'
describe('Town moments', () => {
  it('requires a reciprocal wire route from the battery to the lamp', () => {
    const tiles = makeCircuit()
    expect(circuitConnected(tiles)).toBe(false)
    tiles.forEach(tile => { tile.turn = 0 })
    expect(circuitConnected(tiles)).toBe(true)
    expect(circuitPower(tiles).size).toBe(7)
    tiles[4]!.turn = 1
    expect(circuitConnected(tiles)).toBe(false)
    expect(circuitPower(tiles).has(5)).toBe(false)
  })
  it('starts each stop scrambled and permits a solution', () => {
    for (let stop=0;stop<3;stop++) {
      const tiles = makeCircuit(stop)
      expect(circuitConnected(tiles)).toBe(false)
      tiles.forEach(tile => { tile.turn = 0 })
      expect(circuitConnected(tiles)).toBe(true)
    }
    expect(circuitConnected([])).toBe(false)
  })
  it('orders handoff, response and bloom before the thank-you dialog', () => {
    expect(deliveryBeat(0)).toBe('handoff')
    expect(deliveryBeat(1)).toBe('thanks')
    expect(deliveryBeat(2.7)).toBe('garden')
    expect(deliveryBeat(DELIVERY_SCENE_SECONDS)).toBe('garden')
    expect(new Set(LUNA_NOTES.map(note => note.reply)).size).toBe(3)
  })
})
