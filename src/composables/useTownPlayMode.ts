import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { townViewport } from '@/utils/townViewport'

export function useTownPlayMode(root: Ref<HTMLElement | null>, resetInput: () => void) {
  const playMode = ref(false), nativeFullscreen = ref(false), changing = ref(false)
  let scrollY = 0, overflow = '', opener: HTMLElement | null = null, disposed = false
  let frame = 0
  let bodyStyles = { position: '', top: '', left: '', width: '' }
  const viewport = window.visualViewport
  function syncViewport() {
    frame = 0
    if (!playMode.value || !root.value) return
    const bounds = townViewport(window.innerWidth,window.innerHeight,viewport)
    const resized = root.value.style.getPropertyValue('--town-visible-width') !== `${bounds.width}px` || root.value.style.getPropertyValue('--town-visible-height') !== `${bounds.height}px`
    for (const [key,value] of Object.entries(bounds)) root.value.style.setProperty(`--town-visible-${key}`,`${value}px`)
    const editing = document.activeElement instanceof HTMLElement && !!document.activeElement.closest('input,textarea,[contenteditable="true"]')
    root.value.dataset.townKeyboardOpen = String(editing && window.innerHeight - bounds.height > 120)
    if (resized || root.value.dataset.townKeyboardOpen === 'true') resetInput()
  }
  function queueViewport() { if (!frame && playMode.value) frame = requestAnimationFrame(syncViewport) }
  function unlockPage() {
    document.documentElement.style.overflow = overflow
    Object.assign(document.body.style,bodyStyles)
    for (const key of ['width','height','top','left']) root.value?.style.removeProperty(`--town-visible-${key}`)
    if (root.value) delete root.value.dataset.townKeyboardOpen
    cancelAnimationFrame(frame); frame = 0
  }
  function restore() {
    if (!playMode.value) return
    playMode.value = false; nativeFullscreen.value = false; resetInput()
    unlockPage()
    void nextTick(() => {
      if (disposed) return
      window.scrollTo({ top: scrollY, behavior: 'instant' })
      opener?.focus({ preventScroll: true })
    })
  }
  async function enter() {
    if (!root.value || playMode.value || changing.value) return
    changing.value = true
    scrollY = window.scrollY; overflow = document.documentElement.style.overflow
    bodyStyles = { position: document.body.style.position, top: document.body.style.top, left: document.body.style.left, width: document.body.style.width }
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    playMode.value = true; resetInput(); document.documentElement.style.overflow = 'hidden'
    Object.assign(document.body.style,{position:'fixed',top:`-${scrollY}px`,left:'0',width:'100%'})
    syncViewport()
    try {
      // Invoke from the user's gesture before yielding, to preserve activation.
      if (document.fullscreenEnabled && root.value.requestFullscreen) {
        await root.value.requestFullscreen()
        nativeFullscreen.value = document.fullscreenElement === root.value
      }
    } catch { /* Denied or unsupported fullscreen uses the edge-to-edge fallback. */ }
    finally { changing.value = false; queueViewport() }
  }
  async function exit() {
    if (changing.value) return
    changing.value = true
    try { if (document.fullscreenElement === root.value && document.exitFullscreen) await document.exitFullscreen() }
    catch { /* Always allow the CSS layout to exit. */ }
    finally { restore(); changing.value = false }
  }
  function fullscreenChanged() {
    if (document.fullscreenElement === root.value) nativeFullscreen.value = true
    else if (nativeFullscreen.value) restore()
    queueViewport()
  }
  onMounted(() => {
    document.addEventListener('fullscreenchange', fullscreenChanged)
    window.addEventListener('resize',queueViewport)
    viewport?.addEventListener('resize',queueViewport)
    viewport?.addEventListener('scroll',queueViewport)
    document.addEventListener('focusin',queueViewport)
    document.addEventListener('focusout',queueViewport)
  })
  onBeforeUnmount(() => {
    disposed = true
    document.removeEventListener('fullscreenchange', fullscreenChanged)
    window.removeEventListener('resize',queueViewport)
    viewport?.removeEventListener('resize',queueViewport)
    viewport?.removeEventListener('scroll',queueViewport)
    document.removeEventListener('focusin',queueViewport)
    document.removeEventListener('focusout',queueViewport)
    cancelAnimationFrame(frame)
    if (playMode.value) {
      unlockPage()
      if (document.fullscreenElement === root.value) void document.exitFullscreen().catch(() => {})
      window.scrollTo({ top: scrollY, behavior: 'instant' })
    }
  })
  return { playMode, nativeFullscreen, changing, enter, exit }
}
