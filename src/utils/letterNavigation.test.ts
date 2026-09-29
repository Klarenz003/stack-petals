import { describe, expect, it } from 'vitest'
import {
  getNextLetterScreen,
  normalizeLetterScreen,
  LETTER_GIFT_SCREEN_INDEX,
  LETTER_MEMORIES_SCREEN_INDEX,
  LETTER_TOTAL_SCREENS,
  getVisibleLetterScreenIndices,
} from './letterNavigation'

describe('letter navigation', () => {
  it('keeps the legacy letter screen count explicit', () => {
    expect(LETTER_TOTAL_SCREENS).toBe(10)
  })

  it('removes only the memories index for restricted letters', () => {
    expect(getVisibleLetterScreenIndices(10, false)).not.toContain(LETTER_MEMORIES_SCREEN_INDEX)
    expect(getVisibleLetterScreenIndices(10, false)).toHaveLength(9)
    expect(getVisibleLetterScreenIndices(10, true)).toHaveLength(10)
  })

  it('skips the memories chapter when unavailable', () => {
    expect(getNextLetterScreen(3, 10, false)).toBe(LETTER_GIFT_SCREEN_INDEX)
    expect(normalizeLetterScreen(LETTER_MEMORIES_SCREEN_INDEX, 10, false)).toBe(LETTER_GIFT_SCREEN_INDEX)
  })

  it('keeps the memories chapter when available', () => {
    expect(getNextLetterScreen(3, 10, true)).toBe(4)
    expect(normalizeLetterScreen(4, 10, true)).toBe(4)
  })
})
