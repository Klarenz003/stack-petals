import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { deleteLetterDraft, loadLetterDraft, normalizeLetterDraft, saveLetterDraft, type LetterDraftContent } from '@/utils/letterDrafts'

export function useLetterDraft(token: string, options: {
  enabled: () => boolean
  snapshot: () => LetterDraftContent
  restore: (draft: LetterDraftContent) => void
}) {
  const loading = ref(true), busy = ref(false), savedAt = ref<number | null>(null)
  const status = ref<'idle' | 'saving' | 'saved' | 'restored' | 'error' | 'cleared'>('idle')
  const storageError = ref('')
  let ready = false, disposed = false, qrId = '', revision = 0, dirty = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: LetterDraftContent | null = null
  let writes: Promise<void> = Promise.resolve()
  function cancelTimer() { clearTimeout(timer); timer = undefined }

  function flush(): Promise<void> {
    cancelTimer()
    const content = pending, currentRevision = revision
    pending = null
    if (!content || !qrId) return writes
    writes = writes.then(async () => {
      const time = await saveLetterDraft(token, qrId, content)
      if (revision === currentRevision) {
        savedAt.value = time; status.value = 'saved'; storageError.value = ''; dirty = false
      }
    }).catch(() => {
      if (revision === currentRevision) {
        status.value = 'error'
        storageError.value = 'Your latest changes could not be saved on this device. Storage may be full or blocked. Keep this tab open and retry before leaving.'
      }
    })
    return writes
  }
  function schedule() {
    if (!ready || busy.value || !options.enabled()) return
    pending = normalizeLetterDraft(options.snapshot())
    dirty = true; revision++; cancelTimer()
    if (!pending) {
      status.value = 'error'; storageError.value = 'This draft could not be saved. Please check your photos and keep this tab open.'
      return
    }
    status.value = 'saving'
    timer = setTimeout(() => { void flush() }, 250)
  }
  watch(options.snapshot, schedule, { deep: true, flush: 'sync' })

  async function initialize(id: string) {
    qrId = id
    try {
      const draft = await loadLetterDraft(token, qrId)
      if (disposed) return
      if (draft) {
        options.restore(draft.content); savedAt.value = draft.savedAt; status.value = 'restored'
      }
    } catch {
      status.value = 'error'
      storageError.value = 'Draft autosave is unavailable in this browser. You can still compose and publish, but keep this tab open to avoid losing your work.'
    } finally { if (!disposed) { ready = true; loading.value = false } }
  }
  function skip() { loading.value = false }

  async function remove(): Promise<boolean> {
    ready = false; busy.value = true; revision++; pending = null; cancelTimer()
    await writes // Drain in-flight saves before deletion, so they cannot recreate the draft.
    try {
      await deleteLetterDraft(token)
      savedAt.value = null; status.value = 'cleared'; storageError.value = ''; dirty = false
      return true
    } catch {
      status.value = 'error'
      storageError.value = 'The saved draft could not be removed. Please retry or clear this site’s data in your browser settings.'
      return false
    } finally { busy.value = false; loading.value = false }
  }
  async function discard(reset: () => void) {
    if (await remove()) reset()
    ready = true
  }
  function retry() { schedule(); return flush() }
  const onPageHide = () => { void flush() }
  const onVisibility = () => { if (document.visibilityState === 'hidden') void flush() }
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    void flush()
    if (dirty) { event.preventDefault(); event.returnValue = '' }
  }
  onMounted(() => {
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onVisibility)
  })
  onBeforeUnmount(() => {
    disposed = true; void flush()
    window.removeEventListener('pagehide', onPageHide)
    window.removeEventListener('beforeunload', onBeforeUnload)
    document.removeEventListener('visibilitychange', onVisibility)
  })
  return { loading, busy, status, savedAt, storageError, initialize, skip, remove, discard, retry }
}
