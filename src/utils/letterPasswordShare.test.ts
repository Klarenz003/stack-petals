import { describe, expect, it } from 'vitest'
import { letterPasswordSaveText, letterPasswordShareText } from './letterPasswordShare'
describe('private password sharing', () => {
  it('preserves the exact password and avoids putting it in a link', () => {
    const password = '  flowers & moonlight  '
    const text = letterPasswordShareText(password)
    expect(text).toContain('\n\n' + password + '\n\n')
    expect(text).toContain('Keep this message private.')
    expect(text).not.toMatch(/https?:\/\//)
  })
  it('labels saved files as private, not activation codes', () => {
    const text = letterPasswordSaveText('two little flowers')
    expect(text).toContain('two little flowers')
    expect(text).toContain('not the card activation code')
    expect(text).toContain('Keep this file private')
  })
})
