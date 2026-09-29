import type { Ref } from 'vue'
import { getNextLetterScreen, normalizeLetterScreen } from '@/utils/letterNavigation'

interface UseLetterNavigationOptions {
  currentScreen: Ref<number>
  slideDirection: Ref<string>
  totalScreens: number
  hasPhotoUpload: Ref<boolean>
  forwardPageTransitions: readonly string[]
  markLetterEngaged: () => void
  trackLetterReplay: () => void | Promise<void>
}

/** Keeps legacy letter screen transitions in one testable, capability-aware composable. */
export function useLetterNavigation(options: UseLetterNavigationOptions) {
  const { currentScreen, slideDirection, totalScreens, hasPhotoUpload, forwardPageTransitions } = options

  function nextScreen() {
    if (currentScreen.value >= totalScreens - 1) return
    options.markLetterEngaged()
    const destination = getNextLetterScreen(currentScreen.value, totalScreens, hasPhotoUpload.value)
    slideDirection.value = forwardPageTransitions[destination] || 'slide-forward'
    currentScreen.value = destination
  }

  function prevScreen() {
    options.markLetterEngaged()
    slideDirection.value = 'magic-back'
    if (currentScreen.value > 0) currentScreen.value--
  }

  function goToScreen(screen: number) {
    const destination = normalizeLetterScreen(screen, totalScreens, hasPhotoUpload.value)
    options.markLetterEngaged()
    if (currentScreen.value === totalScreens - 1 && destination < currentScreen.value) {
      void options.trackLetterReplay()
    }
    slideDirection.value = destination > currentScreen.value
      ? forwardPageTransitions[destination] || 'slide-forward'
      : 'magic-back'
    currentScreen.value = destination
  }

  return { nextScreen, prevScreen, goToScreen }
}
