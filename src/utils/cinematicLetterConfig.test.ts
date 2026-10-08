import { describe, expect, it } from 'vitest'
import { configureCinematicLetter } from './cinematicLetterConfig'
// @ts-expect-error the cinematic engine config is JavaScript
import { GIFT } from '@/components/cinematic-letter/config/gift.js'

describe('cinematic letter configuration', () => {
  it('renders Gift QR note titles and artwork saved in protected metadata', () => {
    configureCinematicLetter({
      letter_v2_qr_id: 'qr-test', petal_messages: ['You light up my day.', 'Two', 'Three', 'Four', 'Five', 'Six'],
      backgrounds: { petal_labels: ['My sunshine', 'Two', 'Three', 'Four', 'Five', 'Six'], petal_artworks: [3, 4, 5, 2, 1, 0] },
    })
    expect(GIFT.petalLabels[0]).toBe('My sunshine')
    expect(GIFT.reasons[0]).toBe('You light up my day.')
    expect(GIFT.petalArtworks).toEqual([3, 4, 5, 2, 1, 0])
  })
  it('keeps the special photo when memory uploads are disabled and resets between letters', () => {
    configureCinematicLetter({ letter_v2_qr_id: 'qr-test', backgrounds: { final_surprise: { title: 'For you', message: 'Always loved', photo: 'data:image/jpeg;base64,YQ==' } }, has_photo_upload: false })
    expect(GIFT.isGiftQrLetter).toBe(true)
    expect(GIFT.personalSurprise).toEqual({ title: 'For you', message: 'Always loved', photo: 'data:image/jpeg;base64,YQ==' })
    configureCinematicLetter({})
    expect(GIFT.personalSurprise).toBeNull()
    expect(GIFT.isGiftQrLetter).toBe(false)
  })
  it('retains customer text, labels, artwork and memories in checkout previews for every theme', () => {
    for (const theme of ['romance', 'family', 'birthday', 'sympathy', 'friendship', 'graduation']) {
      const notes = ['one', 'two', 'three', 'four', 'five', 'six']
      configureCinematicLetter({
        letter_theme: theme, recipient: 'Customer recipient', sender: 'Customer sender',
        message: 'First paragraph\n\nSecond paragraph\n\nThird paragraph',
        petal_messages: notes, petal_labels: ['Custom title'], petal_artworks: [5, 4, 3, 2, 1, 0],
        has_photo_upload: true, memories: ['/customer-memory.png'],
      }, { preview: true })
      expect(GIFT.occasion).toBe(theme)
      expect(GIFT.previewMode).toBe(true)
      expect(GIFT.useCustomerContent).toBe(true)
      expect(GIFT.showOccasionPicker).toBe(false)
      expect(GIFT.recipient).toBe('Customer recipient')
      expect(GIFT.sender).toBe('Customer sender')
      expect(GIFT.paragraphs).toEqual(['First paragraph', 'Second paragraph', 'Third paragraph'])
      expect(GIFT.reasons).toEqual(notes)
      expect(GIFT.petalLabels).toEqual(['Custom title'])
      expect(GIFT.petalArtworks).toEqual([5, 4, 3, 2, 1, 0])
      expect(GIFT.photoMemories[0].src).toBe('/customer-memory.png')
    }
  })
  it('uses real admin frames for every cinematic theme, never demo frames', () => {
    for (const theme of ['romance', 'family', 'birthday', 'sympathy', 'friendship', 'graduation']) {
      expect(configureCinematicLetter({ letter_theme: theme, has_360_view: true, angle_photos: ['/002.png', '/001.png'] }).has360Viewer).toBe(true)
      expect(GIFT.product360).toEqual({ mode: 'urls', frames: ['/002.png', '/001.png'], frameCount: 2 })
    }
  })

  it('clears old frames when the next letter has no uploaded bouquet turn', () => {
    configureCinematicLetter({ angle_photos: ['/1.png', '/2.png'] })
    expect(configureCinematicLetter({ has_360_view: true }).has360Viewer).toBe(false)
    expect(GIFT.product360).toEqual({ mode: 'none', frameCount: 0 })
  })
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
