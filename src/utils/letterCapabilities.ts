export interface LetterCapabilities {
  hasPhotoUpload: boolean
  has360View: boolean
}

import { getVisibleLetterChapters } from './letterChapters'

/** Derive one consistent capability profile for every letter renderer. */
export function getLetterCapabilities(letter: any): LetterCapabilities {
  return {
    hasPhotoUpload: Boolean(letter?.has_photo_upload ?? letter?.hasPhotoUpload ?? letter?.memories?.length),
    has360View: Boolean(letter?.has_360_view ?? letter?.has360Viewer ?? letter?.angle_photos?.length),
  }
}

export function getVisibleChapterIds(capabilities: LetterCapabilities): string[] {
  return getVisibleLetterChapters(capabilities).map(chapter => chapter.id)
}
