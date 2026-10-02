import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

/** Keep focus in the active dialog and return it to its opener on close. */
export function useDialogFocus(root: Ref<HTMLElement | null>, isOpen: () => boolean, close: () => void) {
  let opener: HTMLElement | null = null
  let previousOverflow = ''
  let active = false
  const focusable = () => Array.from(root.value?.querySelectorAll<HTMLElement>(
    'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
  ) || []).filter(element => element.getClientRects().length > 0)

  function handleKeydown(event: KeyboardEvent) {
    if (!active || !root.value) return
    if (event.key === 'Escape') { event.preventDefault(); close(); return }
    if (event.key !== 'Tab') return
    const items = focusable()
    const first = items[0], last = items[items.length - 1]
    if (!first) { event.preventDefault(); root.value.focus(); return }
    if (event.shiftKey && (document.activeElement === first || !root.value.contains(document.activeElement))) {
      event.preventDefault(); last?.focus()
    } else if (!event.shiftKey && (document.activeElement === last || !root.value.contains(document.activeElement))) {
      event.preventDefault(); first.focus()
    }
  }

  function release() {
    if (!active) return
    active = false
    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = previousOverflow
    if (opener?.isConnected) opener.focus({ preventScroll: true })
  }

  watch(isOpen, async open => {
    if (!open) { release(); return }
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    await nextTick()
    if (!isOpen() || !root.value || active) return
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    active = true
    window.addEventListener('keydown', handleKeydown)
    root.value.focus({ preventScroll: true })
  }, { immediate: true, flush: 'post' })
  onBeforeUnmount(release)
}
