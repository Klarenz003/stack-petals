import { describe, expect, it } from 'vitest'
import { getLetterSurprise } from './letterSurprise'
describe('private final surprise', () => {
  it('hides absent and empty surprises', () => {
    for (const value of [null, undefined, [], 'text', {}, { message: '  ' }]) expect(getLetterSurprise(value)).toBeNull()
  })
  it('keeps cropped inline photos and personal text', () => {
    expect(getLetterSurprise({ title: '  Our moment ', message: ' Love you ', photo: 'data:image/jpeg;base64,YQ==' }))
      .toEqual({ title: 'Our moment', message: 'Love you', photo: 'data:image/jpeg;base64,YQ==' })
  })
  it('rejects public photo URLs and disallowed photo capability', () => {
    expect(getLetterSurprise({ message: 'Hello', photo: 'https://public.example/photo.jpg' })?.photo).toBeNull()
    expect(getLetterSurprise({ message: 'Hello', photo: 'data:image/png;base64,YQ==' }, false)?.photo).toBeNull()
  })
  it('provides a title, bounds text and rejects oversized photos', () => {
    const result = getLetterSurprise({ title: '', message: 'x'.repeat(650), photo: 'data:image/jpeg;base64,' + 'A'.repeat(3000000) })
    expect(result?.title).toBe('One more thing: you are loved.')
    expect(result?.message).toHaveLength(600)
    expect(result?.photo).toBeNull()
  })
})
