import { nextTick, type Ref } from 'vue'

interface MemoryLetter { memories: unknown[] }

export function useMemorySlideshow(options: {
  letter: Ref<MemoryLetter | null>
  currentMemory: Ref<number>
  memoryTimer: Ref<number | null>
  hasPhotoUpload: Ref<boolean>
  animateMemoryChange: (direction: 1 | -1) => void
}) {
  let swipeStartX = 0
  let swipeStartY = 0
  let isSwiping = false

  function startMemoryTimer() {
    if (options.memoryTimer.value) clearInterval(options.memoryTimer.value)
    if (!options.hasPhotoUpload.value) {
      options.memoryTimer.value = null
      return
    }
    options.memoryTimer.value = window.setInterval(() => {
      if (options.letter.value && options.letter.value.memories.length > 1) void nextMemory()
    }, 3000)
  }

  async function nextMemory() {
    const memories = options.letter.value?.memories || []
    if (memories.length <= 1) return
    options.currentMemory.value = (options.currentMemory.value + 1) % memories.length
    await nextTick()
    options.animateMemoryChange(1)
  }

  async function prevMemory() {
    const memories = options.letter.value?.memories || []
    if (memories.length <= 1) return
    options.currentMemory.value = (options.currentMemory.value - 1 + memories.length) % memories.length
    await nextTick()
    options.animateMemoryChange(-1)
  }

  async function goToMemory(index: number) {
    if (index === options.currentMemory.value) return
    const direction: 1 | -1 = index > options.currentMemory.value ? 1 : -1
    options.currentMemory.value = index
    startMemoryTimer()
    await nextTick()
    options.animateMemoryChange(direction)
  }

  function onMemoryTouchStart(event: TouchEvent) {
    swipeStartX = event.touches[0].clientX
    swipeStartY = event.touches[0].clientY
    isSwiping = true
  }

  function onMemoryTouchEnd(event: TouchEvent) {
    if (!isSwiping) return
    isSwiping = false
    handleSwipe(swipeStartX - event.changedTouches[0].clientX, Math.abs(swipeStartY - event.changedTouches[0].clientY))
  }

  function onMemoryMouseDown(event: MouseEvent) {
    swipeStartX = event.clientX
    swipeStartY = event.clientY
    isSwiping = true
  }

  function onMemoryMouseUp(event: MouseEvent) {
    if (!isSwiping) return
    isSwiping = false
    handleSwipe(swipeStartX - event.clientX, Math.abs(swipeStartY - event.clientY))
  }

  function handleSwipe(diffX: number, diffY: number) {
    if (Math.abs(diffX) <= 45 || Math.abs(diffX) <= diffY * 1.5) return
    void (diffX > 0 ? nextMemory() : prevMemory())
    startMemoryTimer()
  }

  function cancelMemorySwipe() { isSwiping = false }

  return { startMemoryTimer, nextMemory, prevMemory, goToMemory, onMemoryTouchStart, onMemoryTouchEnd, onMemoryMouseDown, onMemoryMouseUp, cancelMemorySwipe }
}
