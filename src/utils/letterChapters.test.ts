import { describe, expect, it } from 'vitest'
import { formatChapterIndicator, getVisibleLetterChapters } from './letterChapters'

describe('letter chapter registry', () => {
  it('keeps the full experience in a stable four-chapter order', () => {
    const chapters = getVisibleLetterChapters({ hasPhotoUpload: true, has360View: true })

    expect(chapters.map(chapter => chapter.id)).toEqual([
      'letter-section',
      'reasons-section',
      'memories-section',
      'final-section',
    ])
    expect(formatChapterIndicator(chapters[3], 3, chapters.length)).toBe('04 / 04 — ONE LAST THING')
  })

  it('removes memories without renumbering the remaining chapters', () => {
    const chapters = getVisibleLetterChapters({ hasPhotoUpload: false, has360View: false })

    expect(chapters.map(chapter => chapter.id)).toEqual([
      'letter-section',
      'reasons-section',
      'final-section',
    ])
    expect(formatChapterIndicator(chapters[2], 2, chapters.length)).toBe('03 / 03 — ONE LAST THING')
  })
})
