import { describe, expect, it } from 'vitest'
import { getLetterCapabilities, getVisibleChapterIds } from './letterCapabilities'

describe('letter capabilities', () => {
  it('supports the database and legacy field names', () => {
    expect(getLetterCapabilities({ has_photo_upload: false, has_360_view: true })).toEqual({
      hasPhotoUpload: false,
      has360View: true,
    })
    expect(getLetterCapabilities({ hasPhotoUpload: true, has360Viewer: true })).toEqual({
      hasPhotoUpload: true,
      has360View: true,
    })
  })

  it('falls back to attached media for older letters', () => {
    expect(getLetterCapabilities({ memories: ['memory.jpg'], angle_photos: ['001.webp'] })).toEqual({
      hasPhotoUpload: true,
      has360View: true,
    })
  })

  it('removes the memories chapter for limited gifts', () => {
    expect(getVisibleChapterIds({ hasPhotoUpload: false, has360View: false })).toEqual([
      'letter-section', 'reasons-section', 'final-section',
    ])
  })
})
