import { describe, expect, it } from 'vitest'
import { getNextLetterScreen, normalizeLetterScreen } from './letterNavigation'

describe('letter navigation', () => {
  it('skips the memories chapter when unavailable', () => {
    expect(getNextLetterScreen(3, 10, false)).toBe(5)
    expect(normalizeLetterScreen(4, 10, false)).toBe(5)
  })

  it('keeps the memories chapter when available', () => {
    expect(getNextLetterScreen(3, 10, true)).toBe(4)
    expect(normalizeLetterScreen(4, 10, true)).toBe(4)
  })
})
