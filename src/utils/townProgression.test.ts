import { describe, expect, it } from 'vitest'
import { townPlaceAvailable } from './townProgression'
describe('Town first-delivery progression', () => {
  it('keeps story destinations available and unlocks optional places afterward', () => {
    for (const id of ['flowers', 'delivery', 'garden'] as const) expect(townPlaceAvailable(id, false)).toBe(true)
    for (const id of ['studio', 'arcade', 'gifts'] as const) {
      expect(townPlaceAvailable(id, false)).toBe(false)
      expect(townPlaceAvailable(id, true)).toBe(true)
    }
  })
})
