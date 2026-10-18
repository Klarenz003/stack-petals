export const LETTER_DRAFT_DB = 'stack-petals:letter-drafts'
export const LETTER_DRAFT_TTL = 7 * 24 * 60 * 60 * 1000
const STORE = 'drafts'
const THEMES = ['romance', 'family', 'birthday', 'sympathy', 'friendship', 'graduation']

export interface LetterDraftContent {
  from: string
  to: string
  theme: string
  message: string
  memories: string[]
  petalMessages: string[]
  petalTitles: string[]
  petalArtworks: number[]
  surpriseEnabled: boolean
  surpriseTitle: string
  surpriseMessage: string
  surprisePhotos: string[]
  step: number
  furthestStep: number
}
export interface LetterDraft {
  version: 1
  token: string
  qrId: string
  savedAt: number
  expiresAt: number
  content: LetterDraftContent
}

/** Explicit allowlist: never serialize a component, password or activation credential. */
export function normalizeLetterDraft(value: unknown): LetterDraftContent | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const v = value as Record<string, unknown>
  const stringFields = ['from', 'to', 'theme', 'message', 'surpriseTitle', 'surpriseMessage'] as const
  if (stringFields.some(key => typeof v[key] !== 'string') || typeof v.surpriseEnabled !== 'boolean') return null
  const strings = (key: string, count: number, limit: number) => {
    const list = v[key]
    return Array.isArray(list) && list.length === count && list.every(item => typeof item === 'string')
      ? list.map(item => (item as string).slice(0, limit)) : null
  }
  const photos = (key: string, max: number): string[] | null => {
    const list = v[key]
    return Array.isArray(list) && list.length <= max && list.every(item => typeof item === 'string'
      && item.length <= 3_000_000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(item)) ? [...list] : null
  }
  const petalMessages = strings('petalMessages', 6, 60), petalTitles = strings('petalTitles', 6, 36)
  const memories = photos('memories', 3), surprisePhotos = photos('surprisePhotos', 1)
  if (!petalMessages || !petalTitles || !memories || !surprisePhotos || !Array.isArray(v.petalArtworks)
    || v.petalArtworks.length !== 6 || !v.petalArtworks.every(item => Number.isInteger(item) && item >= 0 && item <= 5)) return null
  const step = typeof v.step === 'number' && Number.isInteger(v.step) ? Math.min(3, Math.max(1, v.step)) : 1
  const furthestStep = typeof v.furthestStep === 'number' && Number.isInteger(v.furthestStep)
    ? Math.min(3, Math.max(step, v.furthestStep)) : step
  return {
    from: (v.from as string).slice(0, 120), to: (v.to as string).slice(0, 120),
    theme: THEMES.includes(v.theme as string) ? v.theme as string : 'romance',
    message: (v.message as string).slice(0, 2000), memories, petalMessages, petalTitles,
    petalArtworks: [...v.petalArtworks], surpriseEnabled: v.surpriseEnabled,
    surpriseTitle: (v.surpriseTitle as string).slice(0, 80), surpriseMessage: (v.surpriseMessage as string).slice(0, 600),
    surprisePhotos, step, furthestStep,
  }
}

export function parseLetterDraft(value: unknown, token: string, qrId: string, now = Date.now()): LetterDraft | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (v.version !== 1 || v.token !== token || v.qrId !== qrId || typeof v.savedAt !== 'number'
    || !Number.isFinite(v.savedAt) || v.savedAt > now || typeof v.expiresAt !== 'number'
    || v.expiresAt !== v.savedAt + LETTER_DRAFT_TTL || v.expiresAt <= now) return null
  const content = normalizeLetterDraft(v.content)
  return content ? { version: 1, token, qrId, savedAt: v.savedAt, expiresAt: v.expiresAt, content } : null
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(LETTER_DRAFT_DB, 1)
    let settled = false
    const timer = window.setTimeout(() => { settled = true; reject(new Error('Draft storage timed out')) }, 4000)
    request.onupgradeneeded = () => {
      if (settled) { request.transaction?.abort(); return }
      const store = request.result.createObjectStore(STORE, { keyPath: 'token' })
      store.createIndex('expiresAt', 'expiresAt')
    }
    request.onsuccess = () => {
      window.clearTimeout(timer)
      if (settled) { request.result.close(); return }
      settled = true
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
    request.onerror = () => {
      window.clearTimeout(timer); settled = true
      reject(request.error ?? new Error('Draft storage unavailable'))
    }
    request.onblocked = () => {
      window.clearTimeout(timer); settled = true; reject(new Error('Draft storage blocked'))
    }
  })
}

async function transaction<T>(action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite'), store = tx.objectStore(STORE)
      // Expired drafts are removed on the next draft-storage visit, not by a background service.
      const expired = store.index('expiresAt').openCursor(IDBKeyRange.upperBound(Date.now()))
      expired.onsuccess = () => { const cursor = expired.result; if (cursor) { cursor.delete(); cursor.continue() } }
      const request = action(store)
      tx.oncomplete = () => resolve(request.result)
      tx.onabort = tx.onerror = () => reject(tx.error ?? new Error('Draft storage unavailable'))
    })
  } finally { db.close() }
}

export async function loadLetterDraft(token: string, qrId: string): Promise<LetterDraft | null> {
  const value: unknown = await transaction(store => store.get(token))
  const draft = parseLetterDraft(value, token, qrId)
  if (value && !draft) await deleteLetterDraft(token)
  return draft
}

export async function saveLetterDraft(token: string, qrId: string, value: LetterDraftContent): Promise<number> {
  const content = normalizeLetterDraft(value)
  if (!token || !qrId || !content) throw new Error('Invalid letter draft')
  const savedAt = Date.now()
  const draft: LetterDraft = { version: 1, token, qrId, savedAt, expiresAt: savedAt + LETTER_DRAFT_TTL, content }
  await transaction(store => store.put(draft))
  return savedAt
}

export async function deleteLetterDraft(token: string): Promise<void> {
  await transaction(store => store.delete(token))
}
