import { describe, expect, it } from 'vitest'
import { DEFAULT_PETAL_MESSAGES, DEFAULT_GIFT_NOTE_BODIES, getGiftNoteMessages, getPetalMessages } from './letterDefaults'

describe('letter defaults', () => {
  it('provides six complete Gift QR messages within the note limit', () => {
    expect(getGiftNoteMessages([])).toEqual([...DEFAULT_GIFT_NOTE_BODIES])
    expect(DEFAULT_GIFT_NOTE_BODIES.every(note => note.length <= 60 && note.length > 20)).toBe(true)
  })
  it('fills blank Gift QR notes without replacing personal messages', () => {
    const notes = getGiftNoteMessages(['  My own words  ', ' ', null])
    expect(notes[0]).toBe('My own words')
    expect(notes.slice(1)).toEqual(DEFAULT_GIFT_NOTE_BODIES.slice(1))
    expect(getGiftNoteMessages(null)).toHaveLength(6)
  })
  it('provides six defaults when no messages exist', () => {
    expect(getPetalMessages([])).toEqual([...DEFAULT_PETAL_MESSAGES])
  })

  it('fills incomplete messages without changing the six-card shape', () => {
    expect(getPetalMessages(['A laugh'])).toEqual([
      'A laugh', 'Your kindness', 'Being you', 'Your heart', 'Your smile', 'The way you care',
    ])
  })
})
