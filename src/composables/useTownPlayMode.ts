import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export function useTownPlayMode(root: Ref<HTMLElement | null>, resetInput: () => void) {
  const playMode = ref(false), nativeFullscreen = ref(false), changing = ref(false)
  let scrollY = 0, overflow = '', opener: HTMLElement | null = null, disposed = false
  function restore() {
    if (!playMode.value) return
    playMode.value = false; nativeFullscreen.value = false; resetInput()
    document.documentElement.style.overflow = overflow
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
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    playMode.value = true; resetInput(); document.documentElement.style.overflow = 'hidden'
    try {
      // Invoke from the user's gesture before yielding, to preserve activation.
      if (document.fullscreenEnabled && root.value.requestFullscreen) {
        await root.value.requestFullscreen()
        nativeFullscreen.value = document.fullscreenElement === root.value
      }
    } catch { /* Denied or unsupported fullscreen uses the edge-to-edge fallback. */ }
    finally { changing.value = false }
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
  }
  onMounted(() => document.addEventListener('fullscreenchange', fullscreenChanged))
  onBeforeUnmount(() => {
    disposed = true
    document.removeEventListener('fullscreenchange', fullscreenChanged)
    if (playMode.value) {
      document.documentElement.style.overflow = overflow
      if (document.fullscreenElement === root.value) void document.exitFullscreen().catch(() => {})
      window.scrollTo({ top: scrollY, behavior: 'instant' })
    }
  })
  return { playMode, nativeFullscreen, changing, enter, exit }
}
