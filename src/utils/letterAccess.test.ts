import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LETTER_ACCESS_PREFIX, forgetAccessSession, passwordError, readAccessSession, saveAccessSession } from './letterAccess'

function storage() {
  const items = new Map<string, string>()
  return { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => items.set(key, value), removeItem: (key: string) => items.delete(key) }
}
beforeEach(() => vi.stubGlobal('window', { localStorage: storage(), sessionStorage: storage() }))
afterEach(() => vi.unstubAllGlobals())

describe('private letter browser credentials', () => {
  it('validates length, Unicode byte limit and confirmation without trimming passwords', () => {
    expect(passwordError('tiny')).not.toBe('')
    expect(passwordError('a'.repeat(73))).not.toBe('')
    expect(passwordError('é'.repeat(37))).not.toBe('')
    expect(passwordError('a'.repeat(72))).toBe('')
    expect(passwordError('a'.repeat(10) + '\0')).not.toBe('')
    expect(passwordError('two little flowers', 'two little flowers ')).not.toBe('')
    expect(passwordError('  two little flowers  ')).toBe('')
  })
  it('stores only an expiring token and isolates letters', () => {
    const session = { token: 'a'.repeat(64), expiresAt: new Date(Date.now() + 30 * 86400000).toISOString() }
    expect(saveAccessSession('one', session, true)).toBe(true)
    expect(readAccessSession('one')).toEqual(session)
    expect(readAccessSession('two')).toBeNull()
    expect(window.sessionStorage.getItem(LETTER_ACCESS_PREFIX + 'one')).toBeNull()
    expect(Object.keys(JSON.parse(window.localStorage.getItem(LETTER_ACCESS_PREFIX + 'one')!))).toEqual(['token', 'expiresAt'])
  })
  it('does not persist non-remembered access beyond session storage', () => {
    saveAccessSession('one', { token: 'b'.repeat(64), expiresAt: new Date(Date.now() + 100000).toISOString() }, false)
    expect(window.localStorage.getItem(LETTER_ACCESS_PREFIX + 'one')).toBeNull()
    expect(readAccessSession('one')).not.toBeNull()
    forgetAccessSession('one')
    expect(readAccessSession('one')).toBeNull()
  })
  it('clears expired, malformed and invalid tokens', () => {
    saveAccessSession('one', { token: 'b'.repeat(64), expiresAt: new Date(Date.now() - 1000).toISOString() }, true)
    expect(readAccessSession('one')).toBeNull()
    window.localStorage.setItem(LETTER_ACCESS_PREFIX + 'one', JSON.stringify({ token: 'short', expiresAt: '2999-01-01' }))
    expect(readAccessSession('one')).toBeNull()
    window.localStorage.setItem(LETTER_ACCESS_PREFIX + 'one', '{')
    expect(readAccessSession('one')).toBeNull()
  })
  it('still permits an unlock when browser storage is denied', () => {
    vi.stubGlobal('window', { get localStorage() { throw Error('denied') }, get sessionStorage() { throw Error('denied') } })
    expect(readAccessSession('one')).toBeNull()
    expect(saveAccessSession('one', { token: 'a'.repeat(64), expiresAt: '2999-01-01' }, true)).toBe(false)
    expect(() => forgetAccessSession('one')).not.toThrow()
  })
})
