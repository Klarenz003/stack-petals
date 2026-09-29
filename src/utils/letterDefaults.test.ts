import { describe, expect, it } from 'vitest'
import { DEFAULT_PETAL_MESSAGES, getPetalMessages } from './letterDefaults'

describe('letter defaults', () => {
  it('provides six defaults when no messages exist', () => {
    expect(getPetalMessages([])).toEqual([...DEFAULT_PETAL_MESSAGES])
  })

  it('fills incomplete messages without changing the six-card shape', () => {
    expect(getPetalMessages(['A laugh'])).toEqual([
      'A laugh', 'Your kindness', 'Being you', 'Your heart', 'Your smile', 'The way you care',
    ])
  })
})
