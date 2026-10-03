import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const STORAGE_KEY = 'stack-petals:code-patterns:v1'

/** Decorative preference only: never blocks browsing if storage is unavailable. */
export function useCodePatternPreference() {
  const enabled = ref(true)
  try { enabled.value = localStorage.getItem(STORAGE_KEY) !== 'off' } catch { /* Use the default. */ }
  watch(enabled, value => {
    try { localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off') } catch { /* Still works for this visit. */ }
  })
  function sync(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) {
      try { enabled.value = localStorage.getItem(STORAGE_KEY) !== 'off' } catch { /* Retain this visit's choice. */ }
    }
  }
  onMounted(() => window.addEventListener('storage', sync))
  onBeforeUnmount(() => window.removeEventListener('storage', sync))
  return enabled
}
