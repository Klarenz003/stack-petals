import { describe, expect, it } from 'vitest'
import { freshStory, restoreStory, isSunshineBouquet, gardenLevel } from './townStory'
describe('a little sunshine story', () => {
  it('starts without a delivery or completed reward', () => { expect(freshStory().stage).toBe('new'); expect(freshStory().completed).toBe(false) })
  it('requires exactly one of each requested colour', () => {
    expect(isSunshineBouquet(['sun', 'pink', 'blue'])).toBe(true)
    expect(isSunshineBouquet(['sun', 'sun', 'pink'])).toBe(false)
    expect(isSunshineBouquet(['sun'])).toBe(false)
  })
  it('repairs invalid saves and incomplete delivery bouquets', () => {
    expect(restoreStory(null)).toEqual(freshStory())
    expect(restoreStory({ stage: 'unknown' })).toEqual(freshStory())
    expect(restoreStory({ stage: 'deliver', stems: ['pink'], bow: Infinity }).stage).toBe('arrange')
    expect(restoreStory({ stage: 'deliver', stems: ['pink', 'blue', 'sun'], wrapping: 'sage', bow: .8 }).stage).toBe('deliver')
    expect(restoreStory({ stage: 'complete', completed: true }).completed).toBe(true)
    expect(restoreStory({ stage: 'complete', completed: false }).stage).toBe('new')
  })
  it('grows a visible garden through kindness milestones', () => { expect([0, 1, 2, 3, 5, 10].map(gardenLevel)).toEqual([0, 1, 1, 2, 3, 3]) })
})
