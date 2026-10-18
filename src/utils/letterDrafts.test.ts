import { describe, expect, it } from 'vitest'
import { LETTER_DRAFT_TTL, normalizeLetterDraft, parseLetterDraft, type LetterDraftContent } from './letterDrafts'

function content(): LetterDraftContent {
  return { from: 'Sender', to: 'Recipient', theme: 'romance', message: 'My private letter',
    memories: ['data:image/jpeg;base64,YQ=='], petalMessages: Array(6).fill('A little reminder'),
    petalTitles: Array(6).fill('A title'), petalArtworks: [0, 1, 2, 3, 4, 5],
    surpriseEnabled: true, surpriseTitle: 'Our moment', surpriseMessage: 'You are loved',
    surprisePhotos: ['data:image/png;base64,YQ=='], step: 3, furthestStep: 3 }
}
describe('local letter draft boundary', () => {
  it('preserves the entire non-secret draft and clones reactive arrays', () => {
    const input = content(), result = normalizeLetterDraft(input)!
    expect(result).toEqual(input)
    input.memories.length = 0; input.petalTitles[0] = 'Changed'
    expect(result.memories).toHaveLength(1)
    expect(result.petalTitles[0]).toBe('A title')
  })
  it('allowlists fields and never saves passwords, activation or management credentials', () => {
    const result = normalizeLetterDraft({ ...content(), password: 'secret', confirmation: 'secret',
      activationCode: 'CODE-1234', managementToken: 'manager-secret', accessToken: 'reader-secret' })
    expect(result).toEqual(content())
    expect(JSON.stringify(result)).not.toMatch(/secret|activationCode|managementToken|accessToken|password|confirmation/)
  })
  it('bounds text and steps and rejects malformed media and note arrays', () => {
    expect(normalizeLetterDraft({ ...content(), message: 'a'.repeat(3000), step: 99, furthestStep: 0, theme: 'unknown' }))
      .toMatchObject({ message: 'a'.repeat(2000), step: 3, furthestStep: 3, theme: 'romance' })
    for (const change of [ { memories: ['https://example.invalid/photo.jpg'] }, { memories: Array(4).fill('data:image/png;base64,YQ==') },
      { surprisePhotos: ['data:image/svg+xml;base64,YQ=='] }, { petalTitles: [] }, { petalArtworks: [0, 1, 2, 3, 4, 9] },
      { surpriseEnabled: 'true' }, { from: null }, { memories: ['data:image/png;base64,' + 'A'.repeat(3_000_000)] } ]) {
      expect(normalizeLetterDraft({ ...content(), ...change })).toBeNull()
    }
    expect(normalizeLetterDraft(null)).toBeNull()
  })
  it('isolates QR token AND row identity, validates schema, and expires after seven days', () => {
    const now = 1_800_000_000_000
    const draft = { version: 1, token: 'one', qrId: 'qr-one', savedAt: now, expiresAt: now + LETTER_DRAFT_TTL, content: content() }
    expect(parseLetterDraft(draft, 'one', 'qr-one', now + 1000)?.content).toEqual(content())
    expect(parseLetterDraft(draft, 'two', 'qr-one', now)).toBeNull()
    expect(parseLetterDraft(draft, 'one', 'qr-two', now)).toBeNull()
    expect(parseLetterDraft(draft, 'one', 'qr-one', now + LETTER_DRAFT_TTL)).toBeNull()
    expect(parseLetterDraft({ ...draft, version: 2 }, 'one', 'qr-one', now)).toBeNull()
    expect(parseLetterDraft({ ...draft, expiresAt: Infinity }, 'one', 'qr-one', now)).toBeNull()
    expect(parseLetterDraft({ ...draft, savedAt: now + 1 }, 'one', 'qr-one', now)).toBeNull()
    expect(parseLetterDraft('broken', 'one', 'qr-one', now)).toBeNull()
  })
})
