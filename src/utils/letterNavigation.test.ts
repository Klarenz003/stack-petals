import { describe, expect, it } from 'vitest'
import {
  getNextLetterScreen,
  normalizeLetterScreen,
  LETTER_GIFT_SCREEN_INDEX,
  LETTER_MEMORIES_SCREEN_INDEX,
} from './letterNavigation'

describe('letter navigation', () => {
  it('skips the memories chapter when unavailable', () => {
    expect(getNextLetterScreen(3, 10, false)).toBe(LETTER_GIFT_SCREEN_INDEX)
    expect(normalizeLetterScreen(LETTER_MEMORIES_SCREEN_INDEX, 10, false)).toBe(LETTER_GIFT_SCREEN_INDEX)
  })

  it('keeps the memories chapter when available', () => {
    expect(getNextLetterScreen(3, 10, true)).toBe(4)
    expect(normalizeLetterScreen(4, 10, true)).toBe(4)
  })
})
