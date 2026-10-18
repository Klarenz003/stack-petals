import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, reactive } from 'vue'
import { useLetterDraft } from './useLetterDraft'
import { deleteLetterDraft, loadLetterDraft, saveLetterDraft, type LetterDraftContent } from '@/utils/letterDrafts'

vi.mock('vue', async original => ({ ...await original<typeof import('vue')>(), onMounted: vi.fn(), onBeforeUnmount: vi.fn() }))
vi.mock('@/utils/letterDrafts', async original => ({ ...await original<typeof import('@/utils/letterDrafts')>(),
  loadLetterDraft: vi.fn(), saveLetterDraft: vi.fn(), deleteLetterDraft: vi.fn() }))
const scopes: ReturnType<typeof effectScope>[] = []
const makeContent = (): LetterDraftContent => ({ from: '', to: '', theme: 'romance', message: '', memories: [],
  petalMessages: Array(6).fill('Note'), petalTitles: Array(6).fill('Title'), petalArtworks: [0, 1, 2, 3, 4, 5],
  surpriseEnabled: false, surpriseTitle: 'Surprise', surpriseMessage: '', surprisePhotos: [], step: 1, furthestStep: 1 })
function setup() {
  const content = reactive(makeContent()), flags = reactive({ enabled: true }), restore = vi.fn()
  const scope = effectScope(); scopes.push(scope)
  const draft = scope.run(() => useLetterDraft('card-one', { enabled: () => flags.enabled, snapshot: () => content, restore }))!
  return { content, flags, draft, restore }
}
beforeEach(() => {
  vi.useFakeTimers(); vi.resetAllMocks()
  vi.mocked(loadLetterDraft).mockResolvedValue(null)
  vi.mocked(saveLetterDraft).mockResolvedValue(12345)
  vi.mocked(deleteLetterDraft).mockResolvedValue(undefined)
})
afterEach(() => { scopes.splice(0).forEach(scope => scope.stop()); vi.useRealTimers() })

describe('letter draft autosave lifecycle', () => {
  it('does not overwrite a draft during hydration and restores only the requested card', async () => {
    const saved = makeContent(); saved.message = 'Welcome back'
    vi.mocked(loadLetterDraft).mockResolvedValue({ version: 1, token: 'card-one', qrId: 'qr-one', savedAt: 100,
      expiresAt: 99999, content: saved })
    const { draft, content, restore } = setup()
    content.message = 'Not initialized'
    await draft.initialize('qr-one'); await vi.runAllTimersAsync()
    expect(loadLetterDraft).toHaveBeenCalledWith('card-one', 'qr-one')
    expect(restore).toHaveBeenCalledWith(saved)
    expect(saveLetterDraft).not.toHaveBeenCalled()
    expect(draft.status.value).toBe('restored')
  })
  it('debounces changes and only announces saved after a successful write', async () => {
    const { draft, content } = setup(); await draft.initialize('qr-one')
    content.message = 'One'; content.message = 'Two'
    expect(draft.status.value).toBe('saving')
    expect(saveLetterDraft).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(250)
    expect(saveLetterDraft).toHaveBeenCalledTimes(1)
    expect(saveLetterDraft).toHaveBeenCalledWith('card-one', 'qr-one', expect.objectContaining({ message: 'Two' }))
    expect(draft.status.value).toBe('saved')
  })
  it('never saves disabled/unactivated/published forms', async () => {
    const { draft, content, flags } = setup(); await draft.initialize('qr-one')
    flags.enabled = false; content.message = 'Do not save'
    await vi.runAllTimersAsync()
    expect(saveLetterDraft).not.toHaveBeenCalled()
  })
  it('reports blocked storage and quota failures, then lets the sender retry', async () => {
    vi.mocked(loadLetterDraft).mockRejectedValue(new Error('blocked'))
    const { draft, content } = setup(); await draft.initialize('qr-one')
    expect(draft.loading.value).toBe(false); expect(draft.status.value).toBe('error')
    vi.mocked(saveLetterDraft).mockRejectedValueOnce(new Error('quota'))
    content.message = 'Keep this letter'; await vi.runAllTimersAsync()
    expect(draft.status.value).toBe('error'); expect(draft.savedAt.value).toBeNull()
    await draft.retry()
    expect(draft.status.value).toBe('saved'); expect(draft.storageError.value).toBe('')
  })
  it('drains in-flight writes before deletion and cancels scheduled writes', async () => {
    const { draft, content, flags } = setup(); await draft.initialize('qr-one')
    let release!: (time: number) => void
    vi.mocked(saveLetterDraft).mockImplementationOnce(() => new Promise(resolve => { release = resolve }))
    content.message = 'Writing'; await vi.advanceTimersByTimeAsync(250)
    content.message = 'Pending'; flags.enabled = false
    const removal = draft.remove()
    expect(deleteLetterDraft).not.toHaveBeenCalled()
    release(1000); await removal; await vi.runAllTimersAsync()
    expect(saveLetterDraft).toHaveBeenCalledTimes(1)
    expect(deleteLetterDraft).toHaveBeenCalledOnce()
    expect(draft.status.value).toBe('cleared')
  })
  it('keeps the form intact when deletion fails and resets only after success', async () => {
    const { draft, content } = setup(); await draft.initialize('qr-one')
    const reset = vi.fn()
    vi.mocked(deleteLetterDraft).mockRejectedValueOnce(new Error('blocked'))
    await draft.discard(reset)
    expect(reset).not.toHaveBeenCalled(); expect(draft.status.value).toBe('error')
    await draft.discard(reset)
    expect(reset).toHaveBeenCalledOnce()
    content.message = 'A fresh draft'; await vi.runAllTimersAsync()
    expect(draft.status.value).toBe('saved')
  })
})
