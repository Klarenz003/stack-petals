import type { LetterCapabilities } from './letterCapabilities'

export type LetterChapterId =
  | 'letter-section'
  | 'reasons-section'
  | 'memories-section'
  | 'final-section'

export interface LetterChapter {
  id: LetterChapterId
  title: string
}

/** The single source of truth for chapter order and display names. */
export const LETTER_CHAPTERS: readonly LetterChapter[] = [
  { id: 'letter-section', title: 'THE LETTER' },
  { id: 'reasons-section', title: 'LITTLE THINGS' },
  { id: 'memories-section', title: 'OUR MEMORIES' },
  { id: 'final-section', title: 'ONE LAST THING' },
]

export function getVisibleLetterChapters(capabilities: LetterCapabilities): LetterChapter[] {
  return LETTER_CHAPTERS.filter(
    chapter => capabilities.hasPhotoUpload || chapter.id !== 'memories-section',
  )
}

export function formatChapterIndicator(chapter: LetterChapter, index: number, total: number): string {
  return `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')} — ${chapter.title}`
}
