export const LETTER_ACCESS_PREFIX = 'stack-petals:letter-access:'
export type LetterAccessSession = { token: string; expiresAt: string }

export function passwordError(password: string, confirmation = password): string {
  if (password.trim().length === 0 || Array.from(password).length < 10) return 'Use at least 10 characters. A few memorable words work well.'
  if (new TextEncoder().encode(password).length > 72 || password.includes('\0')) return 'Please use a shorter password (up to 72 bytes).'
  if (password !== confirmation) return 'The passwords do not match yet.'
  return ''
}

export function readAccessSession(id: string): LetterAccessSession | null {
  for (const kind of ['sessionStorage', 'localStorage'] as const) {
    try {
      const storage = window[kind]
      const raw = storage.getItem(LETTER_ACCESS_PREFIX + id)
      if (!raw) continue
      const session = JSON.parse(raw) as LetterAccessSession
      if (/^[a-f0-9]{64}$/.test(session.token) && Date.parse(session.expiresAt) > Date.now()) return session
      storage.removeItem(LETTER_ACCESS_PREFIX + id)
    } catch {
      try { window[kind].removeItem(LETTER_ACCESS_PREFIX + id) } catch { /* optional storage */ }
    }
  }
  return null
}

export function forgetAccessSession(id: string) {
  for (const kind of ['sessionStorage', 'localStorage'] as const) {
    try { window[kind].removeItem(LETTER_ACCESS_PREFIX + id) } catch { /* optional storage */ }
  }
}

export function saveAccessSession(id: string, session: LetterAccessSession, remember: boolean): boolean {
  forgetAccessSession(id)
  try {
    window[remember ? 'localStorage' : 'sessionStorage'].setItem(LETTER_ACCESS_PREFIX + id, JSON.stringify(session))
    return true
  } catch { return false }
}
