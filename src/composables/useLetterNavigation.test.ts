import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useLetterNavigation } from './useLetterNavigation'

function createNavigation(hasPhotoUpload = true) {
  const currentScreen = ref(0)
  const slideDirection = ref('slide-forward')
  const markLetterEngaged = vi.fn()
  const trackLetterReplay = vi.fn()
  const navigation = useLetterNavigation({
    currentScreen,
    slideDirection,
    totalScreens: 10,
    hasPhotoUpload: ref(hasPhotoUpload),
    forwardPageTransitions: Array.from({ length: 10 }, (_, index) => `screen-${index}`),
    markLetterEngaged,
    trackLetterReplay,
  })
  return { currentScreen, slideDirection, markLetterEngaged, trackLetterReplay, ...navigation }
}

describe('useLetterNavigation', () => {
  it('skips the optional memories screen when photo uploads are disabled', () => {
    const navigation = createNavigation(false)

    navigation.currentScreen.value = 3
    navigation.nextScreen()

    expect(navigation.currentScreen.value).toBe(5)
    expect(navigation.slideDirection.value).toBe('screen-5')
  })

  it('normalizes direct navigation to hidden screens', () => {
    const navigation = createNavigation(false)

    navigation.goToScreen(4)

    expect(navigation.currentScreen.value).toBe(5)
    expect(navigation.slideDirection.value).toBe('screen-5')
  })

  it('tracks replay when leaving the final screen', () => {
    const navigation = createNavigation()
    navigation.currentScreen.value = 9

    navigation.goToScreen(0)

    expect(navigation.currentScreen.value).toBe(0)
    expect(navigation.trackLetterReplay).toHaveBeenCalledOnce()
  })
})
