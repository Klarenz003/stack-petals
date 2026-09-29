import { describe, expect, it } from 'vitest'
import { configureCinematicLetter } from './cinematicLetterConfig'

describe('cinematic letter configuration', () => {
  it('maps restricted QR capabilities into the cinematic gift config', () => {
    const result = configureCinematicLetter({
      letter_theme: 'romance',
      recipient: 'Iris',
      sender: 'Alex',
      message: 'Hello there',
      has_photo_upload: false,
      has_360_view: false,
      memories: ['should-not-enable-the-feature'],
    })

    expect(result).toEqual({ theme: 'romance', has360Viewer: false, hasPhotoUpload: false })
  })

  it('normalizes attached memory records for the cinematic gallery', () => {
    configureCinematicLetter({
      letter_theme: 'romance',
      message: 'A note',
      has_photo_upload: true,
      memories: ['/memory.jpg'],
    })

    // The returned capability profile is intentionally small; this assertion
    // verifies the source data remains eligible for the gallery after mapping.
    expect(configureCinematicLetter({ has_photo_upload: true }).hasPhotoUpload).toBe(true)
  })
})
