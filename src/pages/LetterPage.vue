<script setup lang="ts">
import { computed, nextTick, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/supabaseClient'


// ── Types ──────────────────────────────────────────────────────────
interface Letter {
  id: string
  order_id: string
  recipient: string
  sender: string
  message: string
  petal_messages: string[]
  memories: string[]
  angle_photos: string[]
  backgrounds: Record<string, string | null>
  music_url: string
  bouquet_image_url: string
  published: boolean
  template: string
}

// ── State ──────────────────────────────────────────────────────────
const route = useRoute()
const letter = ref<Letter | null>(null)
const loading = ref(true)
const notFound = ref(false)
const currentScreen = ref(0)
const revealedPetals = ref<boolean[]>([false, false, false, false, false, false])
const activePetal = ref<number | null>(null)
const currentMemory = ref(0)
const currentAngle = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const memoryTimer = ref<number | null>(null)
const show360 = ref(false)
const hasViewed360 = ref(false)
const senderVisible = ref(false)
const slideDirection = ref('slide-forward')
const bouquetImage = ref('/images/b5.png')
const musicPlaying = ref(false)
const envelopeOpening = ref(false)
const loadingMessage = ref('Opening your letter...')
const loadingLoaded = ref(0)
const loadingTotal = ref(1)
const angleAssetsReady = ref(false)
const angleFrameSources = ref<string[]>([])
const angleCanvas = ref<HTMLCanvasElement | null>(null)
const petalSparkleKey = ref(0)
const activePetalMessage = computed(() => {
  if (activePetal.value === null) return ''
  return letter.value?.petal_messages?.[activePetal.value] || ''
})

let letterMusic: HTMLAudioElement | null = null
let loadingTextTimer: number | null = null
let musicUnlockHandler: (() => void) | null = null
let angleFrameImages: Array<HTMLImageElement | null> = []
let anglePreloadRun = 0
const MINIMUM_LOADING_MS = 900

function syncVisibleViewportHeight() {
  const visibleHeight = window.visualViewport?.height || window.innerHeight
  document.documentElement.style.setProperty('--letter-viewport-height', `${Math.round(visibleHeight)}px`)
}

const loadingMessages = [
  'Preparing your memories, unwrapping your letter...',
  'Teaching petals where to fall...',
  'Polishing the gift pixels...',
  'Folding a little romance into the page...',
  'Warming up the 360 gift magic...',
  'Tucking your message between soft petals...',
  'Checking every detail before the reveal...',
]

// ── Screens ────────────────────────────────────────────────────────
const totalScreens = 9

// ── Load Letter ────────────────────────────────────────────────────
async function loadLetter() {
  const loadingStartedAt = performance.now()
  startLoadingTextShuffle()
  loadingLoaded.value = 0
  loadingTotal.value = 1
  hasViewed360.value = false

  const { data, error } = await supabase
    .from('letters')
    .select('*')
    .eq('id', route.params.id)
    .eq('published', true)
    .single()

  if (error || !data) {
    notFound.value = true
    loading.value = false
    stopLoadingTextShuffle()
    return
  }

  letter.value = data
  if (data.bouquet_image_url?.trim()) {
    bouquetImage.value = normalizeImageSrc(data.bouquet_image_url)
  } else {
    await loadBouquetImage(data.order_id)
  }
  void preloadLetterAssetsInBackground(data)
  await preloadInitialLetterAssets()
  await waitForMinimumLoadingTime(loadingStartedAt)
  loading.value = false
  stopLoadingTextShuffle()
  startMemoryTimer()
  void startDefaultMusic()
}

function waitForMinimumLoadingTime(startedAt: number) {
  const remaining = MINIMUM_LOADING_MS - (performance.now() - startedAt)
  if (remaining <= 0) return Promise.resolve()
  return new Promise<void>(resolve => window.setTimeout(resolve, remaining))
}

function randomLoadingMessage() {
  return loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
}

function startLoadingTextShuffle() {
  loadingMessage.value = randomLoadingMessage()
  if (loadingTextTimer) clearInterval(loadingTextTimer)
  loadingTextTimer = window.setInterval(() => {
    let nextMessage = randomLoadingMessage()
    if (nextMessage === loadingMessage.value) nextMessage = randomLoadingMessage()
    loadingMessage.value = nextMessage
  }, 1800)
}

function stopLoadingTextShuffle() {
  if (!loadingTextTimer) return
  clearInterval(loadingTextTimer)
  loadingTextTimer = null
}

async function loadBouquetImage(orderId: string) {
  if (!orderId) return

  const { data, error } = await supabase
    .from('orders')
    .select('items')
    .eq('id', orderId)
    .single()

  if (error) {
    console.warn('Bouquet image could not be loaded:', error)
    return
  }

  const firstItem = Array.isArray(data?.items) ? data.items[0] : null
  if (firstItem?.image) bouquetImage.value = normalizeImageSrc(firstItem.image)
}

function normalizeImageSrc(src: string) {
  if (!src) return '/images/b5.png'
  if (/^(https?:|data:|blob:|\/)/.test(src)) return src
  return `/${src}`
}

function preloadImage(src: string, onLoaded?: () => void) {
  return new Promise<void>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      onLoaded?.()
      resolve()
    }

    if (!src) {
      finish()
      return
    }

    const img = new Image()
    img.onload = async () => {
      try {
        await img.decode()
      } catch {
        // Some browsers resolve onload before decode is available. The image is still cached.
      }
      finish()
    }
    img.onerror = finish
    img.loading = 'eager'
    img.decoding = 'async'
    img.src = normalizeImageSrc(src)
  })
}

async function preloadInBatches(srcs: string[], batchSize = 6, onLoaded?: () => void) {
  const uniqueSrcs = [...new Set(srcs.filter(Boolean))]
  for (let i = 0; i < uniqueSrcs.length; i += batchSize) {
    await Promise.all(uniqueSrcs.slice(i, i + batchSize).map(src => preloadImage(src, onLoaded)))
  }
}

async function preloadInitialLetterAssets() {
  const bouquetAssets = [bouquetImage.value]

  loadingLoaded.value = 0
  loadingTotal.value = Math.max(bouquetAssets.filter(Boolean).length, 1)

  const markLoaded = () => {
    loadingLoaded.value = Math.min(loadingLoaded.value + 1, loadingTotal.value)
  }

  await preloadInBatches(bouquetAssets, 1, markLoaded)
}

async function preloadLetterAssetsInBackground(activeLetter: Letter) {
  const memoryAssets = activeLetter.memories || []
  await preloadAngleFrames(activeLetter)
  if (memoryAssets.length > 0) await preloadInBatches(memoryAssets, 4)
}

function loadAngleFrame(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.onload = async () => {
      try {
        await img.decode()
      } catch {
        // The image is already loaded; decode can fail on some browser/cache paths.
      }
      resolve(img)
    }
    img.onerror = () => resolve(null)
    img.loading = 'eager'
    img.decoding = 'async'
    img.src = src
  })
}

async function preloadAngleFrames(activeLetter: Letter) {
  const run = ++anglePreloadRun
  const sources = [...new Set((activeLetter.angle_photos || []).filter(Boolean).map(normalizeImageSrc))]

  angleFrameSources.value = sources
  angleFrameImages = new Array(sources.length).fill(null)
  angleAssetsReady.value = sources.length === 0

  if (sources.length === 0) return

  let nextIndex = 0
  const workerCount = Math.min(3, sources.length)
  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < sources.length) {
      const index = nextIndex
      nextIndex += 1
      const image = await loadAngleFrame(sources[index])
      if (run !== anglePreloadRun) return
      angleFrameImages[index] = image
    }
  })

  await Promise.all(workers)
  if (run !== anglePreloadRun) return
  angleAssetsReady.value = true
  renderAngleFrame()
}

function renderAngleFrame() {
  const canvas = angleCanvas.value
  const total = angleFrameImages.length
  if (!canvas || !total) return

  const image = angleFrameImages[((currentAngle.value % total) + total) % total]
  if (!image) return

  const rect = canvas.getBoundingClientRect()
  const cssWidth = Math.max(rect.width || canvas.clientWidth || 600, 1)
  const cssHeight = Math.max(rect.height || canvas.clientHeight || 600, 1)
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = Math.round(cssWidth * dpr)
  const height = Math.round(cssHeight * dpr)

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, width, height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const naturalWidth = image.naturalWidth || image.width
  const naturalHeight = image.naturalHeight || image.height
  if (!naturalWidth || !naturalHeight) return
  const scale = Math.min(width / naturalWidth, height / naturalHeight)
  const drawWidth = naturalWidth * scale
  const drawHeight = naturalHeight * scale
  const x = (width - drawWidth) / 2
  const y = (height - drawHeight) / 2

  ctx.drawImage(image, x, y, drawWidth, drawHeight)
}

// ── Navigation ─────────────────────────────────────────────────────
function toggleMusic() {
  if (musicPlaying.value) {
    stopSoftMusic()
    return
  }

  void startSoftMusic()
}

async function startDefaultMusic() {
  const started = await startSoftMusic()
  if (!started) attachMusicUnlockListener()
}

function attachMusicUnlockListener() {
  if (typeof window === 'undefined' || musicUnlockHandler) return

  musicUnlockHandler = () => {
    removeMusicUnlockListener()
    void startSoftMusic()
  }

  window.addEventListener('pointerdown', musicUnlockHandler, { once: true })
  window.addEventListener('keydown', musicUnlockHandler, { once: true })
}

function removeMusicUnlockListener() {
  if (!musicUnlockHandler || typeof window === 'undefined') return
  window.removeEventListener('pointerdown', musicUnlockHandler)
  window.removeEventListener('keydown', musicUnlockHandler)
  musicUnlockHandler = null
}

async function startSoftMusic() {
  if (typeof window === 'undefined') return false

  const musicSrc = letter.value?.music_url?.trim() || '/music/lettermusic.mp3'
  if (!letterMusic || letterMusic.src !== new URL(musicSrc, window.location.origin).href) {
    stopSoftMusic()
    letterMusic = new Audio(musicSrc)
  }
  letterMusic.loop = true
  letterMusic.volume = 0.28

  try {
    await letterMusic.play()
    musicPlaying.value = true
    return true
  } catch (error) {
    console.warn('Letter music could not be played yet:', error)
    musicPlaying.value = false
    return false
  }
}

function stopSoftMusic() {
  removeMusicUnlockListener()
  if (!letterMusic) {
    musicPlaying.value = false
    return
  }

  letterMusic.pause()
  letterMusic.currentTime = 0
  musicPlaying.value = false
}

function nextScreen() {
  slideDirection.value = 'slide-forward'
  if (currentScreen.value < totalScreens - 1) currentScreen.value++
}

function prevScreen() {
  slideDirection.value = 'slide-back'
  if (currentScreen.value > 0) currentScreen.value--
}

function goToScreen(n: number) {
  slideDirection.value = n > currentScreen.value ? 'slide-forward' : 'slide-back'
  currentScreen.value = n
}

// ── Touch / Swipe (page navigation) ───────────────────────────────
let swipeStartX = 0
let swipeStartY = 0
let isSwiping = false

function onTouchStart(e: TouchEvent) {
  // Don't start page swipe if touching the 360 viewer
  const target = e.target as HTMLElement
  if (target.closest('.viewer-360') || target.closest('.memory-frame')) return
  swipeStartX = e.touches[0].clientX
  swipeStartY = e.touches[0].clientY
  isSwiping = true
}

function onTouchEnd(e: TouchEvent) {
  if (!isSwiping) return
  isSwiping = false
  const diffX = swipeStartX - e.changedTouches[0].clientX
  const diffY = Math.abs(swipeStartY - e.changedTouches[0].clientY)
  if (Math.abs(diffX) > 80 && Math.abs(diffX) > diffY * 2) {
    if (diffX > 0) nextScreen()
    else prevScreen()
  }
}

function onMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('.viewer-360') || target.closest('.memory-frame')) return
  isDragging.value = true
  dragStartX.value = e.clientX
}

function onMouseUp(e: MouseEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  const diff = dragStartX.value - e.clientX
  if (Math.abs(diff) > 80) {
    if (diff > 0) nextScreen()
    else prevScreen()
  }
}

// ── Petal Reveal ───────────────────────────────────────────────────
function revealPetal(i: number) {
  revealedPetals.value[i] = true
  activePetal.value = i
  petalSparkleKey.value += 1
}

// ── Memory Slideshow ───────────────────────────────────────────────
let memorySwipeStartX = 0
let memorySwipeStartY = 0
let isMemorySwiping = false

function startMemoryTimer() {
  if (memoryTimer.value) clearInterval(memoryTimer.value)
  memoryTimer.value = window.setInterval(() => {
    if (letter.value && letter.value.memories.length > 1) {
      nextMemory()
    }
  }, 3000)
}

function nextMemory() {
  if (!letter.value || letter.value.memories.length <= 1) return
  currentMemory.value = (currentMemory.value + 1) % letter.value.memories.length
}

function prevMemory() {
  if (!letter.value || letter.value.memories.length <= 1) return
  currentMemory.value = (currentMemory.value - 1 + letter.value.memories.length) % letter.value.memories.length
}

function goToMemory(index: number) {
  currentMemory.value = index
  startMemoryTimer()
}

function onMemoryTouchStart(e: TouchEvent) {
  memorySwipeStartX = e.touches[0].clientX
  memorySwipeStartY = e.touches[0].clientY
  isMemorySwiping = true
}

function onMemoryTouchEnd(e: TouchEvent) {
  if (!isMemorySwiping) return
  isMemorySwiping = false
  const diffX = memorySwipeStartX - e.changedTouches[0].clientX
  const diffY = Math.abs(memorySwipeStartY - e.changedTouches[0].clientY)
  if (Math.abs(diffX) > 45 && Math.abs(diffX) > diffY * 1.5) {
    if (diffX > 0) nextMemory()
    else prevMemory()
    startMemoryTimer()
  }
}

function onMemoryMouseDown(e: MouseEvent) {
  memorySwipeStartX = e.clientX
  memorySwipeStartY = e.clientY
  isMemorySwiping = true
}

function onMemoryMouseUp(e: MouseEvent) {
  if (!isMemorySwiping) return
  isMemorySwiping = false
  const diffX = memorySwipeStartX - e.clientX
  const diffY = Math.abs(memorySwipeStartY - e.clientY)
  if (Math.abs(diffX) > 45 && Math.abs(diffX) > diffY * 1.5) {
    if (diffX > 0) nextMemory()
    else prevMemory()
    startMemoryTimer()
  }
}

function cancelMemorySwipe() {
  isMemorySwiping = false
}

// ── 360° Drag (smooth with momentum) ──────────────────────────────
let isDragging360 = false
let lastX = 0
let velocity = 0
let animationFrame: number | null = null
let accumulatedDelta = 0
let angleHoldTimer: number | null = null
let angleHoldDirection = 0
let lastMomentumTime = 0
const ANGLE_FRAME_RATE = 30
const ANGLE_FRAME_INTERVAL = 1000 / ANGLE_FRAME_RATE

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getAngleTotal() {
  return angleFrameSources.value.length || letter.value?.angle_photos?.length || 0
}

function getRotationSensitivity() {
  const total = getAngleTotal()
  return clampNumber(total / 90, 0.16, 0.38)
}

function getHoldFrameRate() {
  return ANGLE_FRAME_RATE
}

function getMomentumFriction() {
  const total = getAngleTotal()
  return clampNumber(0.8 + total / 450, 0.84, 0.93)
}

function stopAngleMomentum() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
  lastMomentumTime = 0
  velocity = 0
  accumulatedDelta = 0
}

function stopAngleHold() {
  if (angleHoldTimer) {
    clearInterval(angleHoldTimer)
    angleHoldTimer = null
  }
  angleHoldDirection = 0
}

function on360Start(e: MouseEvent | TouchEvent) {
  stopAngleHold()
  stopAngleMomentum()
  isDragging360 = true
  const x = 'touches' in e ? e.touches[0].clientX : e.clientX
  lastX = x
}

function on360Move(e: MouseEvent | TouchEvent) {
  if (!isDragging360 || !letter.value) return
  e.stopPropagation()
  const x = 'touches' in e ? e.touches[0].clientX : e.clientX
  const diff = lastX - x
  velocity = diff
  accumulatedDelta += diff * getRotationSensitivity()
  lastX = x

  const total = getAngleTotal()
  if (!total) return
  const steps = Math.round(accumulatedDelta)
  if (Math.abs(steps) >= 1) {
    currentAngle.value = ((currentAngle.value + steps) % total + total) % total
    accumulatedDelta -= steps
  }
}

function on360End() {
  if (!isDragging360) return
  isDragging360 = false
  lastMomentumTime = 0
  applyMomentum()
}

function stepAngle(direction: number) {
  const total = getAngleTotal()
  if (!total) return
  currentAngle.value = ((currentAngle.value + direction) % total + total) % total
}

function open360Viewer() {
  if (!angleAssetsReady.value) return
  hasViewed360.value = true
  show360.value = true
}

function startAngleHold(direction: number) {
  const total = getAngleTotal()
  if (!total) return
  stopAngleHold()
  stopAngleMomentum()
  angleHoldDirection = direction
  stepAngle(direction)
  angleHoldTimer = window.setInterval(() => {
    stepAngle(angleHoldDirection)
  }, 1000 / getHoldFrameRate())
}

function applyMomentum(timestamp = performance.now()) {
  if (!letter.value) return
  if (Math.abs(velocity) < 0.5) {
    velocity = 0
    animationFrame = null
    return
  }
  if (lastMomentumTime && timestamp - lastMomentumTime < ANGLE_FRAME_INTERVAL) {
    animationFrame = requestAnimationFrame(applyMomentum)
    return
  }
  lastMomentumTime = timestamp
  const total = getAngleTotal()
  if (!total) return
  accumulatedDelta += velocity * getRotationSensitivity()
  const steps = Math.round(accumulatedDelta)
  if (Math.abs(steps) >= 1) {
    currentAngle.value = ((currentAngle.value + steps) % total + total) % total
    accumulatedDelta -= steps
  }
  velocity *= getMomentumFriction()
  animationFrame = requestAnimationFrame(applyMomentum)
}

// ── Background ─────────────────────────────────────────────────────
  function screenBg(screenKey: string): string {
  const custom = letter.value?.backgrounds?.[screenKey]
  const gradients: Record<string, string> = {
    screen1: 'rgba(255,240,243,0.3)',
    screen2: 'rgba(255,245,247,0.3)',
    screen3: 'rgba(255,240,243,0.3)',
    screen4: 'rgba(255,245,247,0.3)',
    screen5: 'rgba(255,240,243,0.3)',
    screen6: 'rgba(255,245,247,0.3)',
    screen7: 'rgba(255,240,243,0.3)',
    screen8: 'rgba(255,245,247,0.3)',
    screen9: 'rgba(255,240,243,0.3)',
  }
  const overlay = gradients[screenKey] || gradients.screen1
  if (custom) {
    return custom
  }
  return overlay
}

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(() => {
  syncVisibleViewportHeight()
  loadLetter()
  window.addEventListener('resize', renderAngleFrame)
  window.addEventListener('resize', syncVisibleViewportHeight)
  window.visualViewport?.addEventListener('resize', syncVisibleViewportHeight)
})

watch(show360, async (visible) => {
  if (visible) {
    await nextTick()
    renderAngleFrame()
    return
  }
  isDragging360 = false
  stopAngleHold()
  stopAngleMomentum()
})

watch(currentAngle, () => {
  if (show360.value) renderAngleFrame()
})

onUnmounted(() => {
  if (memoryTimer.value) clearInterval(memoryTimer.value)
  stopLoadingTextShuffle()
  window.removeEventListener('resize', renderAngleFrame)
  window.removeEventListener('resize', syncVisibleViewportHeight)
  window.visualViewport?.removeEventListener('resize', syncVisibleViewportHeight)
  document.documentElement.style.removeProperty('--letter-viewport-height')
  removeMusicUnlockListener()
  stopAngleHold()
  stopAngleMomentum()
  if (envelopeTimer) clearTimeout(envelopeTimer)
  stopSoftMusic()
})

// ── Letter Reveal ──────────────────────────────────────────────────
const letterRevealed = ref(false)
const displayedText = ref('')
const isTyping = ref(false)
let typeInterval: number | null = null
let envelopeTimer: number | null = null

function startLetterReveal() {
  if (envelopeOpening.value || letterRevealed.value) return
  envelopeOpening.value = true

  envelopeTimer = window.setTimeout(() => {
    letterRevealed.value = true
    envelopeOpening.value = false
    isTyping.value = true
    displayedText.value = ''
    senderVisible.value = false

    const fullText = letter.value?.message || ''
    let i = 0

    typeInterval = window.setInterval(() => {
      if (i < fullText.length) {
        displayedText.value += fullText[i]
        i++
      } else {
        isTyping.value = false
        if (typeInterval) {
          clearInterval(typeInterval)
          typeInterval = null
        }
        setTimeout(() => {
          senderVisible.value = true
        }, 600)
      }
    }, 35)
    envelopeTimer = null
  }, 900)
}

watch(() => currentScreen.value, (screen) => {
  if (screen !== 3) {
    letterRevealed.value = false
    displayedText.value = ''
    isTyping.value = false
    senderVisible.value = false
    envelopeOpening.value = false
    if (envelopeTimer) {
      clearTimeout(envelopeTimer)
      envelopeTimer = null
    }
    if (typeInterval) {
      clearInterval(typeInterval)
      typeInterval = null
    }
  }
})

function skipAnimation() {
  if (typeInterval) {
    clearInterval(typeInterval)
    typeInterval = null
  }
  displayedText.value = letter.value?.message || ''
  isTyping.value = false
  setTimeout(() => {
    senderVisible.value = true
  }, 600)
}
</script>

<template>
  <div
    class="letter-page"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
  >

    <!-- Loading -->
    <div v-if="loading" class="letter-loading">
      <div class="letter-loading-card">
        <div class="loading-brand">
          <span></span>
          Stack Petals
          <span></span>
        </div>
        <div class="loading-keepsake" aria-hidden="true">
          <div class="loading-bloom">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <i></i>
          </div>
          <img src="/images/envelope.png" alt="" class="loading-envelope">
        </div>
        <p class="loading-kicker">A little moment is being prepared</p>
        <p class="loading-message">{{ loadingMessage }}</p>
        <div class="letter-loading-bar" aria-hidden="true">
          <span :style="{ width: `${Math.round((loadingLoaded / loadingTotal) * 100)}%` }"></span>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else-if="notFound" class="letter-not-found">
      <div class="loading-flower">💌</div>
      <h2>Letter not found</h2>
      <p>This letter may not be published yet or the link is invalid.</p>
    </div>

    <!-- Letter Screens -->
    <div v-else-if="letter" class="letter-screens">
      <button
        class="music-toggle"
        :class="{ playing: musicPlaying }"
        :aria-label="musicPlaying ? 'Turn off soft music' : 'Turn on soft music'"
        @click.stop="toggleMusic"
        @pointerdown.stop
        @mousedown.stop
        @touchstart.stop
      >
        <span class="music-icon">{{ musicPlaying ? '♪' : '♫' }}</span>
      </button>

      <Transition :name="slideDirection" mode="out-in">
        <div :key="currentScreen" class="letter-screen-wrapper">

      <!-- ── SCREEN 1 — Welcome ─────────────────────────────────── -->
      <div
        v-if="currentScreen === 0"
        class="letter-screen welcome-screen"
        :style="{ backgroundColor: screenBg('screen1') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <div class="welcome-top-divider"><span></span>&#10022;<span></span></div>
          <div class="recipient-keepsake">For {{ letter.recipient }}</div>
          <div class="welcome-heart-line"><span></span>&#9825;<span></span></div>
          <h1 class="letter-headline">A message<br><em>just for you</em></h1>
          <div class="letter-invitation-card" aria-hidden="true">
            <img src="/images/envelope-clean.png" alt="" class="letter-envelope-image" />
          </div>
          <div class="blooming-flower">&#127800;</div>
          <div class="letter-divider"><span></span>&#10022;<span></span></div>
          <p class="letter-sub">Someone who loves you<br>has something to say</p>

          <button class="letter-btn page1-open-btn" aria-label="Open your letter" @click="nextScreen"></button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 2 — Blooming Animation ─────────────────────── -->
      <div
        v-if="currentScreen === 1"
        class="letter-screen dedication-screen"
        :style="{ backgroundColor: screenBg('screen2') }"
      >
        <div class="screen-content center page2-content">
          <div class="letter-logo">Stack Petals</div>
          <div class="page2-logo-divider"><span></span>&#9829;<span></span></div>

          <div class="page2-flower-wrap" aria-hidden="true">
            <img src="/images/page2_flower-clean.png" alt="" class="page2-flower" />
          </div>

          <h2 class="page2-title">Something special<br><em>is waiting for you...</em></h2>
          <div class="page2-divider"><span></span><i>&#9829;</i><span></span></div>
          <p class="page2-sub">Please wait a moment<br>while we prepare your letter &#10022;</p>
          <button class="letter-btn page2-continue" aria-label="Continue" @click="nextScreen"></button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 3 — Petal Messages ─────────────────────────── -->
      <div
        v-if="currentScreen === 2"
        class="letter-screen petal-message-screen"
        :style="{ backgroundColor: screenBg('screen3') }"
      >
        <div class="screen-content center page3-content">
          <div class="letter-logo">Stack Petals</div>
          <div class="page3-logo-divider"><span></span>&#127800;<span></span></div>
          <h2 class="page3-title">Your petals</h2>
          <p class="page3-sub">Tap a petal to reveal your message</p>

          <div class="petals-flower">
            <img src="/images/6petals.png" alt="" class="flower-svg flower-image" />
            <div :key="petalSparkleKey" class="petal-sparkle-burst" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <!-- Petal 1 — Top -->
            <div class="petal-zone petal-z-1" :class="{ revealed: revealedPetals[0], active: activePetal === 0 }" @click="revealPetal(0)">
              <div class="petal-symbol">&#9829;</div>
            </div>

            <!-- Petal 2 — Top Right -->
            <div class="petal-zone petal-z-2" :class="{ revealed: revealedPetals[1], active: activePetal === 1 }" @click="revealPetal(1)">
              <div class="petal-symbol">&#9829;</div>
            </div>

            <!-- Petal 3 — Bottom Right -->
            <div class="petal-zone petal-z-3" :class="{ revealed: revealedPetals[2], active: activePetal === 2 }" @click="revealPetal(2)">
              <div class="petal-symbol">&#9829;</div>
            </div>

            <!-- Petal 4 — Bottom -->
            <div class="petal-zone petal-z-4" :class="{ revealed: revealedPetals[3], active: activePetal === 3 }" @click="revealPetal(3)">
              <div class="petal-symbol">&#9829;</div>
            </div>

            <!-- Petal 5 — Bottom Left -->
            <div class="petal-zone petal-z-5" :class="{ revealed: revealedPetals[4], active: activePetal === 4 }" @click="revealPetal(4)">
              <div class="petal-symbol">&#9829;</div>
            </div>

            <!-- Petal 6 — Top Left -->
            <div class="petal-zone petal-z-6" :class="{ revealed: revealedPetals[5], active: activePetal === 5 }" @click="revealPetal(5)">
              <div class="petal-symbol">&#9829;</div>
            </div>

          </div>

          <div class="petal-message-slot" aria-live="polite">
            <Transition name="petal-message">
              <div v-if="activePetalMessage" class="petal-message-card">
                <span>&#9829;</span>
                {{ activePetalMessage }}
              </div>
            </Transition>
          </div>

          <button class="letter-btn-outline page3-read-btn" aria-label="Read the letter" @click="nextScreen"></button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 4 — The Letter ───────────────────────────── -->
      <div
        v-if="currentScreen === 3"
        class="letter-screen letter-message-screen"
        :style="{ backgroundColor: screenBg('screen4') }"
      >
        <!-- Falling petals while typing -->
        <div class="falling-petals" v-if="isTyping">
          <span class="fall-petal fp-1">🌸</span>
          <span class="fall-petal fp-2">🌸</span>
          <span class="fall-petal fp-3">🌸</span>
          <span class="fall-petal fp-4">🌸</span>
        </div>

        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>

          <!-- Before reveal -->
          <div v-if="!letterRevealed" class="letter-reveal-wrap" :class="{ opening: envelopeOpening }">
            <div class="page4-envelope-stage" aria-hidden="true">
              <img src="/images/page4_circle.png" alt="" class="page4-circle" />
              <img src="/images/page4_envelope-clean.png" alt="" class="page4-envelope" />
            </div>
            <h2 class="page4-title">A letter<br><em>written just for you</em></h2>
            <div class="page4-divider"><span></span>&#10022;<span></span></div>
            <p class="letter-sub">From someone who loves you deeply</p>
            <button class="letter-btn page4-open-btn" aria-label="Open letter" @click="startLetterReveal"></button>
          </div>

          <!-- After reveal — typewriter animation -->
          <div v-else class="letter-reveal-content">
            <div class="letter-heart">🤍</div>
            <h2 class="letter-dear">Dear <em>{{ letter.recipient }},</em></h2>
            <div class="letter-divider"><span></span>✦<span></span></div>
            <div class="letter-message-box" :class="{ 'typing-complete': senderVisible }">
              <div class="letter-lines"></div>
              <p class="letter-message-text">{{ displayedText }}</p>
            </div>

            <!-- Skip button — only shows while typing -->
            <Transition name="soft-fade">
              <button v-if="isTyping" class="skip-btn" @click="skipAnimation">
                 Skip ↓
              </button>
            </Transition>

            <Transition name="sender-reveal">
              <div v-if="senderVisible" class="sender-footer">
                <div class="letter-divider"><span></span>✦<span></span></div>
                <p class="letter-from">— With love, {{ letter.sender }}</p>
                <button class="letter-btn-outline page4-memories-btn" aria-label="See memories" @click="nextScreen"></button>
              </div>
            </Transition>
          </div>
        </div>

        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 5 — Memories ────────────────────────────────── -->
      <div
        v-if="currentScreen === 4"
        class="letter-screen memories-screen"
        :style="{ backgroundColor: screenBg('screen5') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <h2 class="letter-title">Some of my favorite<br><em>memories with you</em></h2>
          <div class="letter-divider"><span></span>✦<span></span></div>

          <div v-if="letter.memories && letter.memories.length > 0" class="memory-slideshow">
            <div
              class="memory-frame"
              :data-label="`Memory ${currentMemory + 1}`"
              @touchstart.stop="onMemoryTouchStart"
              @touchend.stop="onMemoryTouchEnd"
              @touchcancel.stop="cancelMemorySwipe"
              @mousedown.stop="onMemoryMouseDown"
              @mouseup.stop="onMemoryMouseUp"
              @mouseleave="cancelMemorySwipe"
            >
              <img
                v-for="(memory, index) in letter.memories"
                :key="`${memory}-${index}`"
                :src="normalizeImageSrc(memory)"
                :class="['memory-slide', { active: index === currentMemory }]"
                :alt="index === currentMemory ? `Memory ${currentMemory + 1}` : ''"
                :aria-hidden="index !== currentMemory"
                draggable="false"
                decoding="async"
                loading="eager"
              />
            </div>
            <div class="memory-dots">
              <span
                v-for="(_, i) in letter.memories"
                :key="i"
                :class="{ active: i === currentMemory }"
                @click="goToMemory(i)"
              ></span>
            </div>
            <div class="memory-caption">
              <span>Memory {{ currentMemory + 1 }} of {{ letter.memories.length }}</span>
              <p>A small piece of a story worth keeping.</p>
            </div>
          </div>

          <div v-else class="no-memories">
            <p>📸</p>
            <p class="letter-sub">No memories attached</p>
          </div>

          <button class="letter-btn-outline page5-gift-btn" aria-label="View your gift" @click="nextScreen">
            <img src="/images/page5_button-trim.png" alt="" class="page5-gift-btn-img" />
          </button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 6 — 360° View ───────────────────────────────── -->
      <div
        v-if="currentScreen === 5"
        class="letter-screen bouquet-screen"
        :style="{ backgroundColor: screenBg('screen6') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <h2 class="letter-title">Your gift<br><em>up close</em></h2>
          <p class="bouquet-intro">A little showcase before the real one reaches your hands.</p>
          <div class="letter-divider"><span></span>✦<span></span></div>

          <div class="bouquet-preview" @mousedown.stop @mouseup.stop @touchstart.stop @touchend.stop>
            <div class="bouquet-tag">Gift spotlight</div>
            <div class="bouquet-stage">
              <div class="bouquet-halo"></div>
              <div class="bouquet-glass"></div>
              <div class="bouquet-shine"></div>
              <div class="bouquet-sparkles" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <img
                :src="bouquetImage"
                alt="Your gift"
                class="bouquet-main-photo"
              />
              <div class="bouquet-pedestal"></div>
            </div>
            <div class="bouquet-plaque">
              <span>Crafted for</span>
              <strong>{{ letter.recipient }}</strong>
            </div>
            <div class="bouquet-detail-row" aria-hidden="true">
              <span>Handcrafted</span>
              <span>QR keepsake</span>
              <span>Made with love</span>
            </div>
            <button v-if="letter.angle_photos && letter.angle_photos.length > 0" class="btn-360" :class="{ preparing: !angleAssetsReady }" :disabled="!angleAssetsReady" @click.stop="open360Viewer">
              <span class="rotate-mark">↻</span>
              <span v-if="angleAssetsReady">View 360</span>
              <span v-else>Preparing 360° View</span>
            </button>
            <p v-else class="letter-sub bouquet-note">Your gift is shown above. 360° view may be added soon.</p>
          </div>

          <Transition name="page6-unlock">
            <button
              v-if="hasViewed360 || !letter.angle_photos || letter.angle_photos.length === 0"
              class="letter-btn page2-continue page6-continue"
              aria-label="Continue"
              @click="nextScreen"
            ></button>
          </Transition>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── 360° Full Screen Viewer ────────────────────────────────────── -->
      <Teleport to="body">
        <div v-if="show360 && letter.angle_photos && letter.angle_photos.length > 0" class="viewer-fullscreen">
          <button class="viewer-close" @click="show360 = false">✕</button>

          <div class="viewer-header">
            <p class="viewer-kicker">Gift showcase</p>
            <p class="viewer-hint">Drag or hold the arrows to rotate</p>
          </div>

          <div class="viewer-stage-wrap">
            <button
              class="viewer-nav prev"
              aria-label="Previous gift angle"
              @pointerdown.stop.prevent="startAngleHold(-1)"
              @pointerup.stop.prevent="stopAngleHold"
              @pointerleave.stop="stopAngleHold"
              @pointercancel.stop="stopAngleHold"
              @contextmenu.prevent
            >‹</button>
            <div
              class="viewer-360-full"
              @mousedown.stop="on360Start"
              @mousemove.stop="on360Move"
              @mouseup.stop="on360End"
              @mouseleave="on360End"
              @touchstart.stop.prevent="on360Start"
              @touchmove.stop.prevent="on360Move"
              @touchend.stop="on360End"
            >
              <div class="viewer-glow"></div>
              <div class="viewer-glass-dome"></div>
              <div class="viewer-shine"></div>
              <div class="viewer-sparkles" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <canvas
                ref="angleCanvas"
                class="angle-canvas-full"
                aria-label="Gift 360 view"
              ></canvas>
            </div>
            <button
              class="viewer-nav next"
              aria-label="Next gift angle"
              @pointerdown.stop.prevent="startAngleHold(1)"
              @pointerup.stop.prevent="stopAngleHold"
              @pointerleave.stop="stopAngleHold"
              @pointercancel.stop="stopAngleHold"
              @contextmenu.prevent
            >›</button>
          </div>

          <div class="viewer-footer">
            <div class="viewer-caption">
              <span>Crafted for</span>
              <strong>{{ letter.recipient }}</strong>
            </div>
            <p class="viewer-hold-note">Press and hold for a smooth 360 view</p>
          </div>
        </div>
      </Teleport>

      <!-- ── SCREEN 7 — Final Quote ─────────────────────────────── -->
      <div
        v-if="currentScreen === 6"
        class="letter-screen quote-screen"
        :style="{ backgroundColor: screenBg('screen7') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <div class="quote-flower-wrap" aria-hidden="true">
            <img src="/images/page2_flower-trim.png" alt="" class="quote-flower-img" />
          </div>
          <p class="quote-kicker">A little reminder...</p>
          <div class="quote-divider"><span></span><i>&#10048;</i><span></span></div>

          <div class="quote-card">
            <blockquote class="letter-quote">
              &ldquo;You are loved more<br>
              than you know,<br>
              more than words can say,<br>
              more than any gift can hold.&rdquo;
            </blockquote>
          </div>
          <button class="letter-btn page2-continue page7-continue" aria-label="Continue" @click="nextScreen"></button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 8 — From Sender ─────────────────────────────── -->
      <div
        v-if="currentScreen === 7"
        class="letter-screen sender-screen"
        :style="{ backgroundColor: screenBg('screen8') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <div class="sender-keepsake">
            <span class="sender-kicker">Sent with care by</span>
            <div class="sender-circle">{{ letter.sender?.charAt(0) }}</div>
            <h2 class="letter-title">From <em>{{ letter.sender }}</em></h2>
            <div class="letter-divider"><span></span>✦<span></span></div>
            <p class="letter-sub">This gift was crafted with love<br>and sent to you with all their heart</p>
          </div>
          <button class="letter-btn page8-finish-btn" aria-label="Finish" @click="nextScreen"></button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 9 — End ─────────────────────────────────────── -->
      <div
        v-if="currentScreen === 8"
        class="letter-screen end-screen"
        :style="{ backgroundColor: screenBg('screen9') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <div class="end-card">
            <div class="end-flowers">🌸🌷🌺</div>
            <h2 class="letter-title">You are<br><em>so loved</em></h2>
            <div class="letter-divider"><span></span>✦<span></span></div>
            <p class="letter-sub">Keep this letter close to your heart.<br>Scan the QR anytime to revisit.</p>
            <div class="end-brand">
              <p>Crafted by</p>
              <strong>Stack Petals</strong>
            </div>
          </div>
          <div class="end-actions">
            <button class="letter-btn-outline end-primary-action page9-again-btn" aria-label="Read again" @click="goToScreen(0)"></button>
            <div class="end-secondary-actions">
              <button @click="goToScreen(4)">Memories</button>
              <span aria-hidden="true">·</span>
              <button @click="goToScreen(5)">Gift</button>
            </div>
          </div>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

    </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Cormorant+Infant:ital,wght@0,400;0,500;1,400;1,500&family=Great+Vibes&family=Lora:ital,wght@0,400;0,600;1,400;1,600&family=Playfair+Display:wght@400;500;600&display=swap');

/* ── Base ─────────────────────────────────────────────────────────── */
.letter-page {
  font-family: 'Lora', serif;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  height: var(--letter-viewport-height, 100dvh);
  overflow: hidden; /* ← prevent outer scroll */
  position: fixed;
  inset: 0;
  user-select: none;
  display: flex;
  justify-content: center;
  align-items: center;
  background: url(/images/background.png) center/cover no-repeat;
}

.letter-screens {
  container: letter-frame / size;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  height: var(--letter-viewport-height, 100dvh);
  max-width: 480px;
  position: relative;
  margin: 0 auto;
  overflow: hidden;
}

.music-toggle {
  position: absolute;
  top: calc(14px + env(safe-area-inset-top, 0px));
  right: 14px;
  z-index: 180;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(232, 180, 192, 0.72);
  background:
    radial-gradient(circle at 35% 28%, rgba(255,255,255,0.95), rgba(255,240,244,0.74));
  color: #C35A70;
  box-shadow: 0 10px 24px rgba(212, 104, 122, 0.18);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.music-toggle:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(212, 104, 122, 0.24);
}

.music-toggle.playing {
  background:
    radial-gradient(circle at 35% 28%, rgba(255,255,255,0.98), rgba(255,226,235,0.92));
}

.music-toggle.playing::after {
  content: '';
  position: absolute;
  inset: -5px;
  border: 1px solid rgba(212, 104, 122, 0.24);
  border-radius: inherit;
  animation: musicPulse 1.8s ease-out infinite;
}

.music-icon {
  font-family: 'Lora', serif;
  font-size: 18px;
  line-height: 1;
}

@keyframes musicPulse {
  from {
    opacity: 0.75;
    transform: scale(0.86);
  }
  to {
    opacity: 0;
    transform: scale(1.18);
  }
}

.letter-screen {
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --screen-pad-top: clamp(24px, 6dvh, 48px);
  --screen-pad-bottom-base: clamp(88px, 13dvh, 104px);
  --screen-pad-bottom: calc(var(--screen-pad-bottom-base) + var(--safe-bottom));
  --screen-dot-bottom: calc(clamp(14px, 2.6dvh, 22px) + var(--safe-bottom));
  --screen-inline-pad: clamp(18px, 6vw, 32px);
  --screen-content-gap: clamp(8px, 1.4dvh, 14px);
  --screen-reserved-y: calc(var(--screen-pad-top) + var(--screen-pad-bottom));
  --title-size: clamp(26px, min(7vw, 5.4dvh), 32px);
  --sub-size: clamp(13px, min(3.8vw, 2.4dvh), 15px);
  --divider-space: clamp(8px, 1.6dvh, 16px);
  --action-space: clamp(10px, 1.8dvh, 22px);
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-image: url(/images/background.png);
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden;
  padding: var(--screen-pad-top) 0 var(--screen-pad-bottom);
}

.letter-screen::before {
  content: '';
  position: absolute;
  inset: clamp(10px, 2.6vw, 18px);
  border-radius: clamp(22px, 5vw, 34px);
  background:
    linear-gradient(180deg, rgba(255, 247, 248, 0.42), rgba(255, 236, 240, 0.2)),
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.5), transparent 44%);
  border: 1px solid rgba(232, 180, 192, 0.28);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.62),
    0 24px 60px rgba(163, 90, 105, 0.08);
  pointer-events: none;
  z-index: 0;
}

.letter-screen::after {
  content: '';
  position: absolute;
  inset: clamp(18px, 4vw, 30px);
  border-radius: clamp(18px, 4vw, 28px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: inset 0 0 0 1px rgba(212, 104, 122, 0.05);
  pointer-events: none;
  z-index: 1;
}

.letter-screen > * {
  position: relative;
  z-index: 2;
}

.letter-screen:has(.bouquet-preview) {
  overflow: hidden;
}

@supports (height: 100svh) {
  .letter-page {
    height: var(--letter-viewport-height, 100svh);
  }

  .letter-screens {
    height: var(--letter-viewport-height, 100svh);
  }
}

.letter-screen:has(.bouquet-preview) .letter-divider {
  margin: 12px auto;
}

.letter-screen:has(.bouquet-preview) .letter-btn-outline {
  flex-shrink: 0;
  margin-top: 16px !important;
}

.letter-message-screen {
  --screen-pad-top: clamp(22px, 4.5dvh, 44px);
  --screen-pad-bottom-base: clamp(82px, 11dvh, 98px);
}

memories-screen,
.bouquet-screen {
  --screen-pad-top: clamp(22px, 4.5dvh, 44px);
  --screen-pad-bottom-base: clamp(82px, 11dvh, 98px);
}

/* ── Content ──────────────────────────────────────────────────────── */
.screen-content {
  width: 100%;
  max-width: min(500px, 100%);
  max-height: calc(100dvh - var(--screen-reserved-y));
  min-height: 0;
  padding: 0 var(--screen-inline-pad);
  overflow: hidden;
}

.screen-content.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  gap: var(--screen-content-gap);
}

.letter-message-screen .screen-content {
  height: 100%;
  max-height: none;
}

.letter-message-screen .letter-logo {
  flex: 0 0 auto;
  margin-bottom: clamp(8px, 2dvh, 22px);
}

.letter-message-screen .letter-reveal-wrap {
  margin: auto 0;
}

.letter-message-screen .letter-reveal-content {
  flex: 1 1 auto;
  min-height: 0;
}

.letter-message-screen .letter-heart {
  flex: 0 0 auto;
  margin-bottom: clamp(4px, 1.2dvh, 10px);
}

.letter-message-screen .letter-dear {
  flex: 0 0 auto;
  font-size: clamp(22px, 4.2dvh, 26px);
  margin-bottom: clamp(2px, 0.8dvh, 8px);
}

.letter-message-screen .letter-reveal-content > .letter-divider {
  flex: 0 0 auto;
  margin: clamp(6px, 1.4dvh, 12px) auto;
}

.letter-message-screen .letter-message-box {
  height: auto;
  max-height: none;
}

.memories-screen .screen-content,
.bouquet-screen .screen-content {
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr) auto;
  justify-items: center;
  align-content: stretch;
  height: 100%;
  max-height: none;
  justify-content: center;
  gap: 0;
}

.memories-screen .screen-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(7px, 1.05dvh, 12px);
  padding-bottom: clamp(58px, 7.2dvh, 70px);
}

.memories-screen .letter-logo,
.bouquet-screen .letter-logo {
  flex: 0 0 auto;
  margin-bottom: clamp(2px, 0.8dvh, 8px);
}

.memories-screen .letter-title,
.bouquet-screen .letter-title {
  flex: 0 0 auto;
  font-size: clamp(24px, 4.8dvh, 31px);
  line-height: 1.16;
  margin-bottom: 0;
}

.memories-screen .letter-divider,
.bouquet-screen .letter-divider {
  flex: 0 0 auto;
  margin: clamp(8px, 1.6dvh, 16px) auto;
}

.memories-screen .memory-slideshow,
.bouquet-screen .bouquet-preview {
  align-self: center;
  min-height: 0;
}

.memories-screen > .screen-dots,
.bouquet-screen > .screen-dots {
  bottom: clamp(12px, 2.6dvh, 18px);
}

.memories-screen .screen-content > .letter-btn-outline,
.bouquet-screen .screen-content > .letter-btn-outline {
  margin-top: clamp(10px, 1.8dvh, 18px) !important;
}

.page5-gift-btn {
  display: inline-flex;
  position: relative;
  z-index: 6;
  place-self: center;
  align-self: center;
  justify-self: center;
  width: min(64vw, 308px);
  max-width: none;
  height: clamp(52px, 9vw, 90px);
  aspect-ratio: 723 / 211;
  min-height: 0;
  margin: clamp(10px, 1.5dvh, 16px) auto 0 !important;
  padding: 0;
  border: none;
  background: url('/images/page5_button-trim.png') center / 80% 80% no-repeat;
  overflow: visible;
  filter: none;
  box-shadow: none;
  animation: letterButtonAlive 4.8s ease-in-out infinite;
  transform-origin: center;
}

@keyframes page5SoftBreath {
  0%, 100% {
    transform: translateY(0) scale(1);
    filter: none;
  }
  50% {
    transform: translateY(-1px) scale(1.012);
    filter: none;
  }
}

/* Typography */
.letter-logo {
  font-family: 'Lora', serif;
  font-size: clamp(11px, min(3vw, 2dvh), 13px);
  color: #C48090;
  letter-spacing: clamp(2px, 0.7vw, 3px);
  text-transform: uppercase;
  margin-bottom: clamp(10px, 3dvh, 32px);
}

.recipient-keepsake {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: min(280px, 82vw);
  min-height: 30px;
  margin: calc(clamp(8px, 2.2dvh, 22px) * -1) auto clamp(8px, 1.7dvh, 16px);
  padding: 6px 16px;
  border: 1px solid rgba(232, 180, 192, 0.44);
  border-radius: 999px;
  background: rgba(255, 250, 249, 0.58);
  box-shadow: 0 10px 22px rgba(212, 104, 122, 0.08);
  color: #9A5C6B;
  font-size: clamp(12px, min(3.4vw, 1.9dvh), 14px);
  font-style: italic;
  line-height: 1.2;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.letter-headline {
  font-family: 'Lora', serif;
  font-size: clamp(32px, min(10vw, 7dvh), 40px);
  font-weight: 400;
  color: #7A3A4A;
  text-align: center;
  line-height: 1.18;
  margin: 0 0 clamp(8px, 2dvh, 20px);
}

.letter-headline em {
  color: #D4687A;
  font-style: italic;
}

.letter-title {
  font-family: 'Lora', serif;
  font-size: var(--title-size);
  font-weight: 400;
  color: #7A3A4A;
  line-height: 1.2;
  margin: 0 0 clamp(4px, 1.2dvh, 12px);
}

.letter-title em {
  color: #D4687A;
  font-style: italic;
}

.letter-sub {
  font-family: 'Lora', serif;
  font-size: var(--sub-size);
  color: #B08090;
  font-style: italic;
  line-height: 1.55;
  margin: 0;
}

.letter-dear {
  font-family: 'Lora', serif;
  font-size: 26px;
  font-weight: 400;
  color: #7A3A4A;
  margin: 0 0 8px;
}

.letter-dear em {
  color: #D4687A;
  font-style: italic;
}

.letter-from {
  font-family: 'Lora', serif;
  font-size: 16px;
  color: #C48090;
  letter-spacing: 1px;
  margin: 0;
}

.letter-heart {
  font-size: 32px;
  margin-bottom: 12px;
}

/* ── Divider ──────────────────────────────────────────────────────── */
.letter-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: var(--divider-space) auto;
  width: 80%;
  color: #E8B4C0;
  font-size: 12px;
}

.letter-divider span {
  flex: 1;
  height: 0.5px;
  background: #E8B4C0;
}

/* ── Buttons ──────────────────────────────────────────────────────── */
.letter-btn {
  display: inline-flex;
  position: relative;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: min(72vw, 286px);
  max-width: min(100%, 286px);
  min-height: clamp(44px, 6.2dvh, 58px);
  background: url('/images/button-trim.png') center / 80% 80% no-repeat;
  color: white;
  border: none;
  border-radius: 999px;
  padding:
    clamp(10px, 1.8dvh, 14px)
    clamp(56px, 13vw, 74px)
    clamp(10px, 1.8dvh, 14px)
    clamp(28px, 7vw, 42px);
  font-family: 'Cormorant Garamond', 'Lora', serif;
  font-size: clamp(17px, min(4.8vw, 2.55dvh), 22px);
  font-weight: 400;
  line-height: 1.2;
  text-align: center;
  white-space: normal;
  cursor: pointer;
  margin-top: var(--action-space);
  letter-spacing: 0.01em;
  filter: none;
  box-shadow: none;
  animation: letterButtonAlive 4.8s ease-in-out infinite;
  transform-origin: center;
  transition: transform 0.2s ease, opacity 0.2s ease;
  overflow: visible;
}

.letter-btn:hover {
  transform: translate(var(--button-center-nudge, 0), -1px) scale(1.012);
  filter: none;
}

.letter-btn:active {
  transform: translate(var(--button-center-nudge, 0), 0) scale(0.988);
}

.page1-open-btn {
  width: min(62vw, 292px);
  aspect-ratio: 728 / 254;
  min-height: 0;
  padding: 0;
  background: url('/images/page1_button-trim.png') center / 80% 80% no-repeat;
  animation: letterButtonAlive 4.8s ease-in-out infinite;
}

@keyframes page1ButtonBreath {
  0%, 100% {
    transform: translateY(0) scale(1);
    filter: none;
  }
  50% {
    transform: translateY(-1px) scale(1.014);
    filter: none;
  }
}

.letter-btn-outline {
  display: inline-flex;
  position: relative;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: min(68vw, 260px);
  max-width: min(100%, 260px);
  min-height: clamp(42px, 5.8dvh, 54px);
  background: url('/images/button-trim.png') center / 80% 80% no-repeat;
  color: white;
  border: none;
  border-radius: 999px;
  padding:
    clamp(9px, 1.6dvh, 12px)
    clamp(50px, 12vw, 68px)
    clamp(9px, 1.6dvh, 12px)
    clamp(24px, 6vw, 38px);
  font-family: 'Cormorant Garamond', 'Lora', serif;
  font-size: clamp(16px, min(4.4vw, 2.45dvh), 20px);
  font-weight: 400;
  line-height: 1.2;
  text-align: center;
  white-space: normal;
  cursor: pointer;
  letter-spacing: 0.01em;
  filter: none;
  box-shadow: none;
  animation: letterButtonAlive 4.8s ease-in-out infinite;
  transform-origin: center;
  transition: transform 0.2s ease, opacity 0.2s ease;
  overflow: visible;
}

.letter-btn-outline:hover {
  transform: translate(var(--button-center-nudge, 0), -1px) scale(1.012);
  filter: none;
}

.letter-btn-outline:active {
  transform: translate(var(--button-center-nudge, 0), 0) scale(0.988);
}

@keyframes letterButtonAlive {
  0%, 100% { transform: translate(var(--button-center-nudge, 0), 0) scale(1); }
  50% { transform: translate(var(--button-center-nudge, 0), -1px) scale(1.014); }
}

/* ── Screen Dots ──────────────────────────────────────────────────── */
.screen-content.center > .page6-continue,
.screen-content.center > .page7-continue {
  margin-top: clamp(28px, 4dvh, 40px) !important;
}

.screen-dots {
  position: absolute;
  bottom: var(--screen-dot-bottom);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 7px;
  z-index: 100;
  pointer-events: none;
}

.screen-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #E8B4C0;
  cursor: default;
  opacity: 0.64;
  transition: all 0.24s ease;
}

.screen-dots span.active {
  background: #D4687A;
  box-shadow: 0 0 0 4px rgba(212, 104, 122, 0.1);
  opacity: 1;
  width: 20px;
  border-radius: 999px;
}

/* ── Flower ───────────────────────────────────────────────────────── */
.blooming-flower {
  display: none;
  font-size: clamp(64px, min(22vw, 15dvh), 96px);
  margin-bottom: clamp(12px, 3dvh, 28px);
  animation: bloom 2s ease-in-out infinite alternate;
}

@keyframes bloom {
  from { transform: scale(0.9); }
  to   { transform: scale(1.1); }
}

/* ── Petals ───────────────────────────────────────────────────────── */
.letter-invitation-card {
  width: clamp(92px, min(26vw, 16dvh), 124px);
  height: clamp(76px, min(22vw, 13dvh), 100px);
  margin-bottom: clamp(14px, 3dvh, 26px);
  position: relative;
  display: grid;
  place-items: center;
  animation: invitationFloat 3.2s ease-in-out infinite;
  filter: drop-shadow(0 14px 26px rgba(163, 90, 105, 0.16));
}

.letter-invite-paper {
  width: 100%;
  height: 76%;
  border: 1px solid rgba(232, 180, 192, 0.58);
  border-radius: 14px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(255, 239, 243, 0.9)),
    repeating-linear-gradient(0deg, transparent 0 16px, rgba(212, 104, 122, 0.08) 17px 18px);
  overflow: hidden;
  position: relative;
}

.letter-invite-paper::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(140deg, transparent 0 44%, rgba(212, 104, 122, 0.12) 45% 46%, transparent 47%),
    linear-gradient(220deg, transparent 0 44%, rgba(212, 104, 122, 0.1) 45% 46%, transparent 47%);
}

.letter-invite-paper span {
  position: absolute;
  left: 20%;
  right: 20%;
  height: 1px;
  background: rgba(196, 128, 144, 0.28);
  border-radius: 999px;
}

.letter-invite-paper span:nth-child(1) {
  top: 34%;
}

.letter-invite-paper span:nth-child(2) {
  top: 50%;
}

.letter-invite-paper i {
  position: absolute;
  top: 0;
  left: -45%;
  width: 36%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
  transform: skewX(-18deg);
  animation: invitationShine 2.8s ease-in-out infinite;
}

.letter-envelope-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
  user-select: none;
}

.dedication-screen {
  --screen-pad-top: clamp(36px, 6.2dvh, 62px);
  --screen-pad-bottom-base: clamp(72px, 9.8dvh, 90px);
  --screen-content-gap: clamp(5px, 0.9dvh, 10px);
}

.dedication-screen .screen-content {
  max-height: none;
  overflow: visible;
}

.page2-content {
  max-width: min(620px, 100%);
}

.page2-logo-divider,
.page2-divider {
  display: grid;
  grid-template-columns: minmax(48px, 1fr) auto minmax(48px, 1fr);
  align-items: center;
  gap: 12px;
  width: min(310px, 74vw);
  color: #E59BAA;
  line-height: 1;
}

.page2-logo-divider {
  margin: clamp(2px, 0.5dvh, 6px) auto clamp(2px, 0.5dvh, 6px);
  font-size: 13px;
}

.page2-logo-divider span,
.page2-divider span {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 104, 122, 0.36), transparent);
}

.page2-flower-wrap {
  position: relative;
  width: min(55vw, 248px, 25dvh);
  aspect-ratio: 1 / 1;
  margin: clamp(2px, 0.4dvh, 5px) auto clamp(8px, 1.4dvh, 16px);
  display: grid;
  place-items: center;
  filter: drop-shadow(0 20px 28px rgba(163, 90, 105, 0.14));
  animation: page2FlowerFloat 4.8s ease-in-out infinite;
}

.page2-flower-wrap::before,
.page2-flower-wrap::after {
  content: '';
  position: absolute;
  inset: 13%;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 50%;
  opacity: 0.72;
  pointer-events: none;
  animation: page2HaloBreathe 3.8s ease-in-out infinite;
}

.page2-flower-wrap::after {
  inset: 22%;
  border-color: rgba(229, 155, 170, 0.22);
  animation-delay: 1.1s;
}

.page2-flower {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
  user-select: none;
  animation: page2FlowerGlow 3.6s ease-in-out infinite;
}

.page2-title {
  margin: 0;
  color: #7A3A4A;
  font-family: 'Cormorant Infant', 'Cormorant Garamond', serif;
  font-size: clamp(36px, min(10.8vw, 6dvh), 62px);
  font-weight: 500;
  line-height: 0.9;
  letter-spacing: -0.018em;
  text-shadow:
    0 2px 0 rgba(255, 238, 242, 0.82),
    0 9px 18px rgba(122, 58, 74, 0.12);
}

.page2-title em {
  display: inline-block;
  margin-top: clamp(1px, 0.25dvh, 4px);
  color: #D4687A;
  font-family: 'Cormorant Infant', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: clamp(32px, min(9.7vw, 5.4dvh), 56px);
  font-weight: 400;
  line-height: 0.86;
  letter-spacing: -0.012em;
  text-shadow:
    0 1px 0 rgba(255, 246, 248, 0.72),
    0 6px 14px rgba(212, 104, 122, 0.08);
}

.page2-divider {
  width: min(330px, 72vw);
  margin: clamp(8px, 1.3dvh, 14px) auto clamp(4px, 0.75dvh, 8px);
}

.page2-divider i {
  position: relative;
  display: inline-grid;
  place-items: center;
  color: #E59BAA;
  font-style: normal;
  font-size: clamp(18px, 4.4vw, 24px);
  animation: softHeartPulse 2.2s ease-in-out infinite;
}

.page2-divider i::before,
.page2-divider i::after {
  content: '';
  position: absolute;
  width: 28px;
  height: 12px;
  top: 50%;
  background:
    radial-gradient(ellipse at center, rgba(229, 155, 170, 0.55) 0 38%, transparent 42%);
  opacity: 0.5;
}

.page2-divider i::before {
  right: calc(100% + 8px);
  transform: translateY(-50%) rotate(18deg);
}

.page2-divider i::after {
  left: calc(100% + 8px);
  transform: translateY(-50%) rotate(-18deg);
}

.page2-sub {
  margin: 0;
  color: #8F5A66;
  font-family: 'Cormorant Infant', 'Cormorant Garamond', serif;
  font-size: clamp(17px, min(4.4vw, 2.35dvh), 22px);
  font-style: italic;
  font-weight: 500;
  line-height: 1.18;
  letter-spacing: -0.01em;
}

.page2-continue {
  --button-center-nudge: clamp(8px, 1.8vw, 14px);
  width: min(60vw, 268px);
  aspect-ratio: 660 / 238;
  min-height: 0;
  margin-top: clamp(12px, 1.8dvh, 18px) !important;
  padding: 0;
  background: url('/images/page2_button-trim.png') center / 80% 80% no-repeat;
  font-size: clamp(15px, min(4vw, 2.2dvh), 18px);
  animation: letterButtonAlive 4.8s ease-in-out infinite;
}

.page6-continue,
.page7-continue {
  margin-top: clamp(28px, 4dvh, 40px) !important;
}

@keyframes page2FlowerFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-7px) rotate(1.2deg); }
}

@keyframes page2HaloBreathe {
  0%, 100% { transform: scale(0.96); opacity: 0.42; }
  50%      { transform: scale(1.07); opacity: 0.82; }
}

@keyframes page2FlowerGlow {
  0%, 100% { filter: saturate(1) brightness(1); }
  50%      { filter: saturate(1.08) brightness(1.035); }
}

@keyframes softHeartPulse {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.76; }
  50%      { transform: translateY(-1px) scale(1.12); opacity: 1; }
}

@keyframes buttonBreath {
  0%, 100% { transform: translateY(0) scale(1); filter: none; }
  50%      { transform: translateY(-1px) scale(1.014); filter: none; }
}

@media (max-height: 700px) {
  .dedication-screen {
    --screen-pad-top: 22px;
    --screen-pad-bottom-base: 56px;
    --screen-content-gap: 4px;
  }

  .page2-flower-wrap {
    width: min(48vw, 210px, 22dvh);
    margin-bottom: 8px;
  }

  .page2-title {
    font-size: clamp(31px, min(9.6vw, 5.2dvh), 48px);
  }

  .page2-title em {
    font-size: clamp(27px, min(8.4vw, 4.7dvh), 42px);
  }

  .page2-divider {
    margin-top: 6px;
  }

  .page2-sub {
    font-size: clamp(15px, min(4.2vw, 2.2dvh), 19px);
  }

  .page2-continue {
    width: min(56vw, 238px);
    margin-top: 10px !important;
  }
}

.dedication-card {
  position: relative;
  display: grid;
  justify-items: center;
  width: min(100%, 350px);
  padding: clamp(24px, 5dvh, 38px) clamp(20px, 6vw, 34px);
  border: 1px solid rgba(232, 180, 192, 0.4);
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgba(255,255,255,0.76), rgba(255,244,247,0.58)),
    radial-gradient(circle at 50% 0%, rgba(255,255,255,0.88), transparent 52%);
  box-shadow:
    0 22px 54px rgba(122, 58, 74, 0.11),
    inset 0 1px 0 rgba(255,255,255,0.86);
  overflow: hidden;
}

.dedication-card::before {
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(232, 180, 192, 0.18);
  border-radius: 22px;
  pointer-events: none;
}

.dedication-kicker {
  color: #C48090;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.dedication-card strong {
  max-width: 100%;
  margin-top: 10px;
  color: #7A3A4A;
  font-size: clamp(30px, min(9vw, 5.8dvh), 44px);
  font-weight: 400;
  line-height: 1.05;
  overflow-wrap: anywhere;
  text-align: center;
}

.dedication-thread {
  display: grid;
  grid-template-columns: minmax(38px, 1fr) auto minmax(38px, 1fr);
  align-items: center;
  gap: 10px;
  width: min(100%, 230px);
  margin: 16px 0 10px;
  color: #C48090;
  font-size: 12px;
  font-style: italic;
}

.dedication-thread span {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,104,122,0.44), transparent);
}

.dedication-card em {
  max-width: 100%;
  color: #D4687A;
  font-size: clamp(20px, min(6vw, 3.6dvh), 28px);
  line-height: 1.15;
  overflow-wrap: anywhere;
  text-align: center;
}

.dedication-card p {
  max-width: 260px;
  margin: 16px 0 0;
  color: #9A6875;
  font-size: 13px;
  font-style: italic;
  line-height: 1.55;
  text-align: center;
}

.letter-invite-seal {
  position: absolute;
  bottom: 4px;
  left: 50%;
  width: clamp(34px, 9vw, 42px);
  height: clamp(34px, 9vw, 42px);
  border: 1px solid rgba(212, 104, 122, 0.24);
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 34% 30%, #fff8fa, #f2b6c4);
  color: #9A4057;
  font-family: 'Lora', serif;
  font-size: clamp(15px, 4vw, 18px);
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  text-shadow: 0 1px 0 rgba(255,255,255,0.62);
  box-shadow: 0 10px 18px rgba(212, 104, 122, 0.18);
  transform: translateX(-50%);
}

@keyframes invitationFloat {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-7px) rotate(1deg); }
}

@keyframes invitationShine {
  0%, 30% { left: -45%; opacity: 0; }
  45% { opacity: 1; }
  70%, 100% { left: 108%; opacity: 0; }
}

.petal-message-screen {
  --screen-pad-top: clamp(28px, 5dvh, 48px);
  --screen-pad-bottom-base: clamp(72px, 9.5dvh, 90px);
  --screen-content-gap: clamp(4px, 0.75dvh, 8px);
}

.petal-message-screen .screen-content {
  max-height: none;
  overflow: visible;
}

.page3-content {
  max-width: min(640px, 100%);
}

.page3-logo-divider {
  display: grid;
  grid-template-columns: minmax(48px, 1fr) auto minmax(48px, 1fr);
  align-items: center;
  gap: 10px;
  width: min(280px, 68vw);
  margin: clamp(3px, 0.7dvh, 8px) auto clamp(4px, 0.8dvh, 9px);
  color: #E59BAA;
  font-size: 16px;
  line-height: 1;
}

.page3-logo-divider span {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 104, 122, 0.36), transparent);
}

.page3-logo-divider {
  animation: page3DividerDrift 3.4s ease-in-out infinite;
}

.page3-title {
  margin: 0;
  color: #7A3A4A;
  font-family: 'Cormorant Infant', 'Cormorant Garamond', serif;
  font-size: clamp(46px, min(13vw, 7.2dvh), 76px);
  font-weight: 500;
  line-height: 0.9;
  letter-spacing: -0.02em;
  text-shadow:
    0 2px 0 rgba(255, 238, 242, 0.82),
    0 9px 18px rgba(122, 58, 74, 0.12);
}

.page3-sub {
  margin: clamp(2px, 0.55dvh, 6px) 0 clamp(4px, 1dvh, 12px);
  color: #C65F74;
  font-family: 'Cormorant Infant', 'Cormorant Garamond', serif;
  font-size: clamp(23px, min(6.2vw, 3.45dvh), 34px);
  font-style: italic;
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.012em;
}

.petals-flower {
  position: relative;
  width: min(104vw, 680px, 58dvh);
  height: min(104vw, 680px, 58dvh);
  margin: clamp(-28px, -3.5dvh, -12px) auto 0;  /* was: margin: 0 auto; */
  filter: drop-shadow(0 22px 30px rgba(163, 90, 105, 0.13));
  animation: page3FlowerBreathe 5.2s ease-in-out infinite;
}

.flower-svg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.flower-image {
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  animation: page3PetalSheen 4.2s ease-in-out infinite;
}

.petal-zone {
  position: absolute;
  width: clamp(44px, 10.5vw, 70px);
  height: clamp(44px, 10.5vw, 70px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.24s ease, filter 0.24s ease;
}

.petal-z-1 { top: 7.5%; left: 50%; transform: translateX(-50%); }
.petal-z-2 { top: 24.7%; right: 12.2%; }
.petal-z-3 { bottom: 21.8%; right: 12.6%; }
.petal-z-4 { bottom: 6.4%; left: 50%; transform: translateX(-50%); }
.petal-z-5 { bottom: 21.8%; left: 12.6%; }
.petal-z-6 { top: 24.7%; left: 12.2%; }

.petal-z-1 { animation: petalHintTop 2.9s ease-in-out infinite; }
.petal-z-2,
.petal-z-3,
.petal-z-5,
.petal-z-6 { animation: petalHint 3.2s ease-in-out infinite; }
.petal-z-4 { animation: petalHintBottom 3.1s ease-in-out infinite; }
.petal-z-2 { animation-delay: 0.25s; }
.petal-z-3 { animation-delay: 0.5s; }
.petal-z-4 { animation-delay: 0.75s; }
.petal-z-5 { animation-delay: 1s; }
.petal-z-6 { animation-delay: 1.25s; }

.page3-read-btn {
  width: min(62vw, 292px);
  aspect-ratio: 709 / 216;
  min-height: 0;
  margin-top: clamp(8px, 1.3dvh, 14px) !important;
  padding: 0;
  background: url('/images/page3_button-trim.png') center / 80% 80% no-repeat;
  color: #D4687A;
  filter: none;
  box-shadow: none;
  animation: letterButtonAlive 4.8s ease-in-out infinite;
}

@keyframes page3DividerDrift {
  0%, 100% { opacity: 0.72; transform: translateY(0); }
  50%      { opacity: 1; transform: translateY(-1px); }
}

@keyframes page3FlowerBreathe {
  0%, 100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-4px) scale(1.018); }
}

@keyframes page3PetalSheen {
  0%, 100% { filter: saturate(1) brightness(1); }
  50%      { filter: saturate(1.06) brightness(1.025); }
}

@keyframes petalHint {
  0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 0 rgba(212, 104, 122, 0)); }
  50%      { transform: translateY(-2px) scale(1.08); filter: drop-shadow(0 5px 8px rgba(212, 104, 122, 0.16)); }
}

@keyframes petalHintTop {
  0%, 100% { transform: translateX(-50%) translateY(0) scale(1); filter: drop-shadow(0 0 0 rgba(212, 104, 122, 0)); }
  50%      { transform: translateX(-50%) translateY(-2px) scale(1.08); filter: drop-shadow(0 5px 8px rgba(212, 104, 122, 0.16)); }
}

@keyframes petalHintBottom {
  0%, 100% { transform: translateX(-50%) translateY(0) scale(1); filter: drop-shadow(0 0 0 rgba(212, 104, 122, 0)); }
  50%      { transform: translateX(-50%) translateY(2px) scale(1.08); filter: drop-shadow(0 5px 8px rgba(212, 104, 122, 0.16)); }
}

@media (prefers-reduced-motion: reduce) {
  .page2-flower-wrap,
  .page2-flower-wrap::before,
  .page2-flower-wrap::after,
  .page2-flower,
  .page2-divider i,
  .page1-open-btn,
  .page2-continue,
  .page3-logo-divider,
  .petals-flower,
  .flower-image,
  .petal-zone,
  .page3-read-btn,
  .page4-memories-btn,
  .page5-gift-btn {
    animation: none !important;
  }
}

/* ── Letter Message ───────────────────────────────────────────────── */
.letter-message-box {
  --letter-paper-row: 27px;
  --letter-paper-line: 1px;
  --letter-message-font-size: 14px;
  --letter-message-pad-y: 26px;
  --letter-message-pad-x: 22px;
  flex: 1 1 auto;
  min-height: 0;
  background-color: rgba(255, 255, 255, 0.7);
  background-image: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent calc(var(--letter-paper-row) - var(--letter-paper-line)),
    rgba(232, 180, 192, 0.25) calc(var(--letter-paper-row) - var(--letter-paper-line)),
    rgba(232, 180, 192, 0.25) var(--letter-paper-row)
  );
  background-attachment: local;
  background-origin: content-box;
  background-clip: padding-box;
  border: 1px solid #F0C4CF;
  border-radius: 16px;
  padding: var(--letter-message-pad-y) var(--letter-message-pad-x);
  width: 100%;
  height: clamp(220px, 42dvh, 420px);
  max-height: 100%;
  overflow-y: auto;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(180, 112, 126, 0.28) transparent;
  box-shadow: inset 0 1px 3px rgba(212,104,122,0.08),
              0 4px 16px rgba(212,104,122,0.08);
  transition: box-shadow 0.7s ease, transform 0.7s ease, background-color 0.7s ease;
}

.letter-message-box.typing-complete {
  background-color: rgba(255, 255, 255, 0.78);
  box-shadow: inset 0 1px 3px rgba(212,104,122,0.06),
              0 8px 24px rgba(212,104,122,0.12);
  transform: translateY(-2px);
}

.letter-message-box::-webkit-scrollbar {
  width: 6px;
}

.letter-message-box::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 999px;
}

.letter-message-box::-webkit-scrollbar-thumb {
  background: rgba(180, 112, 126, 0.28);
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.55);
  background-clip: padding-box;
}

.letter-message-box::-webkit-scrollbar-thumb:hover {
  background: rgba(180, 112, 126, 0.42);
  background-clip: padding-box;
}

.letter-message-text {
  font-family: 'Lora', serif;
  font-size: var(--letter-message-font-size);
  color: #7A4A54;
  line-height: var(--letter-paper-row);
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  text-align: left;
  margin: 0;
  white-space: pre-line; /* ← change from pre-wrap to pre-line */
  position: relative;
  z-index: 1;
}

.typing-cursor {
  display: inline;
  color: #D4687A;
  font-weight: 300;
  animation: cursorBlink 0.8s ease-in-out infinite;
  margin-left: 1px;
  vertical-align: baseline;
}

/* ── Sender Footer Transition ───────────────────────────────────── */
.sender-footer {
  width: 100%;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: visible;
}

.sender-footer .letter-divider {
  margin: clamp(8px, 1.6dvh, 14px) auto;
}

.sender-footer .letter-from {
  max-width: 100%;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.page4-memories-btn {
  width: min(62vw, 292px);
  aspect-ratio: 728 / 221;
  min-height: 0;
  margin-top: clamp(12px, 2dvh, 20px) !important;
  padding: 0;
  background: url('/images/page4_button2-trim.png') center / 80% 80% no-repeat;
  filter: none;
  box-shadow: none;
  animation: letterButtonAlive 4.8s ease-in-out infinite;
}

@keyframes page4MemoriesBreath {
  0%, 100% {
    transform: translateY(0) scale(1);
    filter: none;
  }
  50% {
    transform: translateY(-1px) scale(1.014);
    filter: none;
  }
}

.sender-reveal-enter-active {
  transition: opacity 0.75s ease, transform 0.75s cubic-bezier(0.22, 1, 0.36, 1), max-height 0.75s ease;
}

.sender-reveal-enter-from {
  opacity: 0;
  max-height: 0;
  transform: translateY(18px);
}

.sender-reveal-enter-to {
  opacity: 1;
  max-height: 220px;
  transform: translateY(0);
}

.sender-reveal-enter-active .letter-divider,
.sender-reveal-enter-active .letter-from,
.sender-reveal-enter-active .letter-btn-outline {
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.sender-reveal-enter-from .letter-divider,
.sender-reveal-enter-from .letter-from,
.sender-reveal-enter-from .letter-btn-outline {
  opacity: 0;
  transform: translateY(10px);
}

.sender-reveal-enter-active .letter-from {
  transition-delay: 0.12s;
}

.sender-reveal-enter-active .letter-btn-outline {
  transition-delay: 0.24s;
}

/* ── Memories ──────────────────────────────────────────────────────── */
.memory-slideshow {
  width: 100%;
  max-width: min(320px, 100%, 34dvh);
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.memory-frame {
  position: relative;
  width: min(100%, 30dvh, 300px);
  max-height: min(300px, 30dvh);
  flex: 0 1 auto;
  border: clamp(8px, 1.6dvh, 12px) solid rgba(255, 255, 255, 0.9);
  border-bottom-width: clamp(30px, 5.2dvh, 44px);
  border-radius: 8px;
  overflow: visible;
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.94);
  box-shadow:
    0 18px 34px rgba(122, 58, 74, 0.16),
    0 2px 0 rgba(255, 255, 255, 0.7) inset;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
  transform: rotate(-1.2deg);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.memory-frame::before {
  content: '';
  position: absolute;
  top: -18px;
  left: 50%;
  width: 72px;
  height: 20px;
  border-radius: 4px;
  background: rgba(255, 238, 244, 0.74);
  border: 1px solid rgba(232, 180, 192, 0.46);
  box-shadow: 0 5px 12px rgba(122, 58, 74, 0.08);
  transform: translateX(-50%) rotate(2deg);
  z-index: 4;
}

.memory-frame::after {
  content: attr(data-label);
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(clamp(8px, 1.3dvh, 12px) * -1 - 8px);
  color: #B08090;
  font-family: 'Lora', serif;
  font-size: clamp(11px, 2.4dvh, 13px);
  font-style: italic;
  letter-spacing: 0.4px;
  text-align: center;
  pointer-events: none;
}

.memory-frame:active {
  cursor: grabbing;
  transform: rotate(0deg) scale(0.985);
  box-shadow: 0 12px 24px rgba(122, 58, 74, 0.14);
}

.memory-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: translateZ(0) scale(1.01);
  backface-visibility: hidden;
  will-change: opacity, transform;
  transition: opacity 0.34s ease, transform 0.34s ease, visibility 0s linear 0.34s;
}

.memory-slide.active {
  opacity: 1;
  visibility: visible;
  transform: translateZ(0) scale(1);
  transition-delay: 0s;
}

.memory-dots {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: clamp(4px, 0.7dvh, 7px);
}

.memory-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #E8B4C0;
  cursor: pointer;
  transition: all 0.2s;
}

.memory-dots span.active {
  background: #D4687A;
  width: 16px;
  border-radius: 4px;
}

.memory-caption {
  width: min(100%, 300px);
  margin-top: clamp(6px, 0.9dvh, 10px);
  padding: clamp(7px, 1dvh, 9px) 14px;
  border: 1px solid rgba(232, 180, 192, 0.32);
  border-radius: 18px;
  background: rgba(255, 250, 249, 0.5);
  box-shadow: 0 10px 22px rgba(212, 104, 122, 0.07);
  text-align: center;
}

.memory-caption span {
  color: #C48090;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.7px;
  text-transform: uppercase;
}

.memory-caption p {
  margin: 3px 0 0;
  color: #9A6875;
  font-size: clamp(12px, min(3.4vw, 1.8dvh), 13px);
  font-style: italic;
  line-height: 1.45;
}

/* ── Bouquet Preview ──────────────────────────────────────────────── */
.bouquet-preview {
  display: grid;
  grid-template-rows: auto auto auto auto auto;
  align-items: center;
  justify-items: center;
  gap: clamp(10px, 1.6dvh, 16px);
  width: 100%;
  height: auto;
  max-width: min(360px, 100%, 38dvh);
  max-height: none;
  flex-shrink: 0;
  margin-bottom: 0;
}

.bouquet-intro {
  max-width: min(310px, 88vw);
  margin: 0 auto !important;
  color: #9A6875;
  font-size: clamp(11px, min(3vw, 1.6dvh), 13px) !important;
  font-style: italic;
  line-height: 1.45;
  text-align: center;
}

.bouquet-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 20px !important;
  margin: 0 !important;
  padding: 3px 12px !important;
  border: 1px solid rgba(232, 180, 192, 0.58);
  border-radius: 999px;
  background: rgba(255, 250, 249, 0.62);
  box-shadow: 0 8px 20px rgba(212, 104, 122, 0.08);
  color: #C48090;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.8px;
  line-height: 1;
  text-transform: uppercase;
}

.bouquet-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, 22dvh, 200px) !important;
  max-width: 100%;
  align-self: center;
  aspect-ratio: 1;
  isolation: isolate;
  animation: bouquetReveal 0.7s ease both, bouquetFloat 5.2s ease-in-out infinite 0.7s;
}

.bouquet-halo {
  position: absolute;
  width: 96%;
  height: 96%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.96) 0%, rgba(255, 238, 244, 0.76) 42%, rgba(255, 238, 244, 0) 72%);
  box-shadow:
    0 24px 64px rgba(212, 104, 122, 0.2),
    inset 0 0 34px rgba(255, 255, 255, 0.66);
  z-index: -4;
}

.bouquet-glass {
  position: absolute;
  inset: 7%;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background:
    linear-gradient(135deg, rgba(255,255,255,0.42), rgba(255,255,255,0.04) 42%, rgba(255,226,235,0.2)),
    radial-gradient(circle at 48% 45%, rgba(255,255,255,0.14), rgba(255,255,255,0) 66%);
  box-shadow:
    inset 10px 12px 26px rgba(255,255,255,0.42),
    inset -14px -20px 30px rgba(212,104,122,0.08);
  pointer-events: none;
  z-index: -2;
}

.bouquet-shine {
  position: absolute;
  top: 13%;
  left: 20%;
  width: 22%;
  height: 58%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255,255,255,0.62), rgba(255,255,255,0));
  filter: blur(1px);
  opacity: 0.7;
  transform: rotate(28deg);
  pointer-events: none;
  z-index: 2;
  animation: none;
}

.bouquet-sparkles {
  display: none;
}

.bouquet-sparkles span {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.96);
  box-shadow: 0 0 12px rgba(255,255,255,0.9), 0 0 20px rgba(244,192,206,0.62);
  animation: bouquetTwinkle 2.8s ease-in-out infinite;
}

.bouquet-sparkles span:nth-child(1) { top: 19%; right: 28%; animation-delay: 0s; }
.bouquet-sparkles span:nth-child(2) { top: 48%; left: 12%; animation-delay: 0.7s; }
.bouquet-sparkles span:nth-child(3) { right: 17%; bottom: 23%; animation-delay: 1.3s; }

.bouquet-main-photo {
  width: min(84%, 310px);
  height: min(84%, 310px);
  object-fit: contain;
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 18px;
  background: rgba(255,255,255,0.22);
  box-shadow:
    0 18px 42px rgba(122, 58, 74, 0.13),
    0 0 0 8px rgba(255,255,255,0.12);
  pointer-events: none;
  filter:
    saturate(1.04)
    drop-shadow(0 24px 24px rgba(122, 58, 74, 0.19));
  transform: translateY(-3px);
  z-index: 1;
}

.bouquet-pedestal {
  position: absolute;
  bottom: 6%;
  width: 62%;
  height: 13%;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(122, 58, 74, 0.22) 0%, rgba(122, 58, 74, 0.09) 44%, rgba(122, 58, 74, 0) 72%);
  filter: blur(3px);
  z-index: -3;
}

.bouquet-plaque {
  width: min(100%, 280px);
  border: 1px solid rgba(232, 180, 192, 0.58);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.58);
  box-shadow: 0 10px 24px rgba(212, 104, 122, 0.1);
  backdrop-filter: blur(8px);
  padding: clamp(4px, 0.7dvh, 6px) 18px !important;
  color: #9A5C6B;
  text-align: center;
}

.bouquet-plaque span {
  display: block;
  font-family: 'Lora', serif;
  font-size: 10px;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: #C48090;
  line-height: 1.1;
}

.bouquet-plaque strong {
  display: block;
  margin-top: 2px;
  font-family: 'Lora', serif;
  font-size: clamp(13px, min(3.6vw, 2.1dvh), 15px);
  font-weight: 600;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bouquet-detail-row {
  display: flex;
  justify-content: center;
  gap: 6px;
  width: min(100%, 330px);
  min-width: 0;
}

.bouquet-detail-row span {
  flex: 1 1 auto;
  min-width: 0;
  border: 1px solid rgba(232, 180, 192, 0.34);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.44);
  color: #A56F7D;
  font-size: clamp(8px, min(2.4vw, 1.4dvh), 11px);
  line-height: 1.1;
  overflow: hidden;
  padding: 4px 8px !important;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-360 {
  position: relative;
  z-index: 2;
  display: inline-flex;
  margin-bottom: clamp(4px, 0.7dvh, 8px) !important;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 30px !important;
  min-width: 166px;
  max-width: min(100%, 240px);
  margin: 0 !important;
  line-height: 1.2;
  white-space: nowrap;
  margin-top: 0;
  padding: 6px 16px !important;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,240,244,0.76));
  color: #D4687A;
  border: 1.5px solid #E8B4C0;
  border-radius: 28px;
  font-family: 'Lora', serif;
  font-size: 14px;
  cursor: pointer;
  letter-spacing: 0.5px;
  box-shadow: none;
  animation: letterButtonAlive 5s ease-in-out infinite;
  transform-origin: center;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, opacity 0.2s ease;
}

.rotate-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(212, 104, 122, 0.1);
  font-size: 14px;
  line-height: 1;
}

.btn-360:hover {
  background:
    linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,226,235,0.86));
  border-color: #D4687A;
  transform: translateY(-1px) scale(1.012);
}

.btn-360:active {
  transform: translateY(0) scale(0.988);
}

.btn-360:disabled,
.btn-360.preparing {
  cursor: wait;
  color: #B08090;
  border-color: rgba(232, 180, 192, 0.62);
  background:
    linear-gradient(135deg, rgba(255,255,255,0.78), rgba(255,240,244,0.58));
  box-shadow: none;
  animation: none;
  transform: none;
}

.btn-360:disabled:hover,
.btn-360.preparing:hover {
  border-color: rgba(232, 180, 192, 0.62);
  background:
    linear-gradient(135deg, rgba(255,255,255,0.78), rgba(255,240,244,0.58));
  transform: none;
}

.btn-360:disabled .rotate-mark,
.btn-360.preparing .rotate-mark {
  animation: none;
  opacity: 0.58;
  background: rgba(180, 128, 144, 0.08);
}

.bouquet-note {
  max-width: 280px;
  margin-top: 8px;
  color: #B08090;
  font-size: 13px;
  line-height: 1.5;
}

@keyframes bouquetReveal {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ── 360° Full Screen Viewer ──────────────────────────────────────── */
.viewer-fullscreen {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at 50% 40%, rgba(255,255,255,0.82) 0%, rgba(255,236,243,0.42) 38%, rgba(255,236,243,0.08) 72%),
    linear-gradient(160deg, rgba(255,247,249,0.88), rgba(255,226,236,0.72));
  backdrop-filter: blur(14px);
  z-index: 9999;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  place-items: center;
  gap: clamp(12px, 2.5dvh, 22px);
  padding: calc(24px + env(safe-area-inset-top, 0px)) clamp(18px, 5vw, 44px) calc(24px + env(safe-area-inset-bottom, 0px));
  touch-action: none;
  overflow: hidden;
}

.viewer-fullscreen::before,
.viewer-fullscreen::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.viewer-fullscreen::before {
  width: min(72vw, 620px);
  height: min(72vw, 620px);
  background: radial-gradient(circle, rgba(255,255,255,0.44), rgba(255,238,244,0.12) 62%, transparent 72%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.viewer-fullscreen::after {
  width: 38vw;
  height: 38vw;
  right: -12vw;
  bottom: -14vw;
  background: radial-gradient(circle, rgba(212,104,122,0.14), transparent 68%);
  filter: blur(4px);
}

.viewer-close {
  position: absolute;
  top: calc(18px + env(safe-area-inset-top, 0px));
  right: clamp(16px, 4vw, 28px);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(232, 180, 192, 0.72);
  color: #D4687A;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  box-shadow: 0 2px 12px rgba(212, 104, 122, 0.15);
  transition: all 0.2s;
}

.viewer-close:hover {
  background: #FFF0F3;
  transform: scale(1.05);
}

.viewer-header {
  position: relative;
  z-index: 2;
  display: grid;
  justify-items: center;
  gap: 6px;
  text-align: center;
}

.viewer-kicker {
  margin: 0;
  color: #C48090;
  font-family: 'Lora', serif;
  font-size: 11px;
  letter-spacing: 2.4px;
  text-transform: uppercase;
}

.viewer-hint {
  font-family: 'Lora', serif;
  font-size: 13px;
  color: #B08090;
  font-style: italic;
  margin: 0;
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(232, 180, 192, 0.42);
  border-radius: 999px;
  padding: 8px 14px;
}

.viewer-stage-wrap {
  position: relative;
  z-index: 1;
  width: min(92vw, 780px);
  min-height: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  justify-items: center;
  gap: clamp(8px, 2vw, 18px);
}

.viewer-360-full {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(76vw, 62dvh, 620px);
  max-width: 620px;
  aspect-ratio: 1;
  cursor: grab;
  touch-action: none;
  background: transparent;
  isolation: isolate;
  animation: floatingBouquet 3.8s ease-in-out infinite;
  contain: layout paint;
  transform: translateZ(0);
}

.viewer-glow,
.viewer-glass-dome,
.viewer-shine,
.viewer-sparkles {
  position: absolute;
  pointer-events: none;
}

.viewer-glow {
  inset: 3%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 46%, rgba(255,255,255,0.96), rgba(255,238,244,0.52) 48%, transparent 73%);
  box-shadow: 0 30px 90px rgba(212, 104, 122, 0.2);
  z-index: -4;
}

.viewer-glass-dome {
  inset: 8%;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.74);
  background:
    linear-gradient(135deg, rgba(255,255,255,0.42), rgba(255,255,255,0.04) 42%, rgba(255,226,235,0.2)),
    radial-gradient(circle at 48% 45%, rgba(255,255,255,0.14), transparent 66%);
  box-shadow:
    inset 12px 14px 28px rgba(255,255,255,0.44),
    inset -16px -22px 34px rgba(212,104,122,0.08);
  z-index: -2;
}

.viewer-shine {
  top: 14%;
  left: 22%;
  width: 18%;
  height: 58%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0));
  transform: rotate(28deg);
  filter: blur(1px);
  z-index: 2;
  opacity: 0.42;
  animation: none;
}

.viewer-sparkles {
  display: none;
}

.viewer-sparkles span {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 14px rgba(255,255,255,0.92), 0 0 22px rgba(244,192,206,0.62);
  animation: bouquetTwinkle 2.8s ease-in-out infinite;
}

.viewer-sparkles span:nth-child(1) { top: 18%; right: 27%; animation-delay: 0.15s; }
.viewer-sparkles span:nth-child(2) { top: 50%; left: 13%; animation-delay: 0.82s; }
.viewer-sparkles span:nth-child(3) { bottom: 22%; right: 18%; animation-delay: 1.45s; }

.viewer-360-full::before {
  content: '';
  position: absolute;
  width: 84%;
  height: 86%;
  border: 1px solid rgba(255, 255, 255, 0.48);
  border-radius: 24px;
  background:
    linear-gradient(145deg, rgba(255,248,250,0.36), rgba(255,229,236,0.12)),
    rgba(255,255,255,0.08);
  box-shadow:
    0 20px 58px rgba(122, 58, 74, 0.14),
    0 0 0 10px rgba(255,255,255,0.06);
  z-index: 0;
}

.viewer-360-full::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 6%;
  width: 54%;
  height: 10%;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(122, 58, 74, 0.22) 0%, rgba(122, 58, 74, 0.08) 48%, rgba(122, 58, 74, 0) 74%);
  filter: blur(4px);
  transform: translateX(-50%);
  z-index: -1;
}

.viewer-360-full:active {
  cursor: grabbing;
}

.angle-canvas-full {
  position: absolute;
  width: 82%;
  height: 84%;
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 18px;
  background: transparent;
  box-shadow:
    0 18px 42px rgba(122, 58, 74, 0.13),
    0 0 0 8px rgba(255,255,255,0.06);
  pointer-events: none;
  user-select: none;
  display: block;
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: contents;
  filter:
    saturate(1.04)
    drop-shadow(0 30px 28px rgba(122, 58, 74, 0.2));
  z-index: 2;
}

.viewer-nav {
  width: clamp(42px, 7vw, 54px);
  height: clamp(42px, 7vw, 54px);
  border-radius: 50%;
  border: 1px solid rgba(232, 180, 192, 0.64);
  background: rgba(255,255,255,0.62);
  color: #C35A70;
  box-shadow: 0 12px 28px rgba(212, 104, 122, 0.14);
  backdrop-filter: blur(8px);
  cursor: pointer;
  font-size: clamp(28px, 5vw, 38px);
  line-height: 1;
  touch-action: none;
  user-select: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
  z-index: 4;
}

.viewer-nav:hover {
  transform: translateY(-1px);
  background: rgba(255,240,244,0.78);
  border-color: rgba(212,104,122,0.72);
}

.viewer-nav:active {
  transform: translateY(0) scale(0.94);
  background: rgba(255,226,233,0.9);
  border-color: rgba(212,104,122,0.9);
}

.viewer-footer {
  position: relative;
  z-index: 2;
  display: grid;
  justify-items: center;
  gap: 12px;
  width: min(100%, 420px);
}

.viewer-caption {
  width: min(100%, 300px);
  border: 1px solid rgba(232, 180, 192, 0.56);
  border-radius: 999px;
  background: rgba(255,255,255,0.58);
  box-shadow: 0 10px 24px rgba(212,104,122,0.1);
  backdrop-filter: blur(8px);
  padding: 8px 18px;
  color: #9A5C6B;
  text-align: center;
}

.viewer-caption span {
  display: block;
  color: #C48090;
  font-family: 'Lora', serif;
  font-size: 10px;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}

.viewer-caption strong {
  display: block;
  margin-top: 2px;
  font-family: 'Lora', serif;
  font-size: 15px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.viewer-hold-note {
  margin: 0;
  color: #B98090;
  font-family: 'Lora', serif;
  font-size: 12px;
  font-style: italic;
  text-align: center;
}

@keyframes floatingBouquet {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}


/* ── Quote ───────────────────────────────────────────────────────── */
.quote-flower {
  font-size: 56px;
  margin-bottom: 16px;
}

.letter-quote {
  font-family: 'Lora', serif;
  font-size: 20px;
  color: #7A3A4A;
  font-style: italic;
  line-height: 1.8;
  text-align: center;
  margin: 0;
  padding: 0 12px;
}

/* ── Sender ───────────────────────────────────────────────────────── */
.sender-circle {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: linear-gradient(135deg, #F4C0CE, #D4687A);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Lora', serif;
  font-size: 36px;
  color: white;
  font-weight: 600;
}

/* ── End Screen ───────────────────────────────────────────────────── */
.end-flowers {
  font-size: 48px;
  margin-bottom: 24px;
  letter-spacing: 4px;
}

.end-brand {
  margin-top: 28px;
  text-align: center;
}

.end-brand p {
  font-family: 'Lora', serif;
  font-size: 11px;
  color: #C48090;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0 0 4px;
}

.end-brand strong {
  font-family: 'Lora', serif;
  font-size: 22px;
  color: #7A3A4A;
  font-weight: 600;
}

/* ── Loading / Not Found ───────────────────────────────────────────── */
.letter-loading,
.letter-not-found {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #FFF0F3 0%, #FFE4EC 100%);
  font-family: 'Lora', serif;
  color: #7A3A4A;
  text-align: center;
  padding: 40px;
}

.letter-loading {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 213, 224, 0.72), transparent 26%),
    radial-gradient(circle at 86% 76%, rgba(255, 226, 232, 0.68), transparent 30%),
    linear-gradient(145deg, #fff6f7 0%, #ffe8ee 54%, #fff7f4 100%);
}

.letter-loading::before {
  content: '';
  position: absolute;
  inset: 18px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 34px;
  box-shadow: inset 0 0 0 1px rgba(226, 152, 168, 0.16);
  pointer-events: none;
}

.letter-loading-card {
  position: relative;
  z-index: 1;
  width: min(420px, 88vw);
  min-height: 430px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(28px, 6vw, 44px);
  border: 1px solid rgba(226, 152, 168, 0.22);
  border-radius: 30px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 248, 249, 0.7));
  box-shadow: 0 26px 70px rgba(122, 58, 74, 0.1);
  animation: loadingCardArrive 520ms ease both;
}

.loading-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #B96578;
  font-size: 13px;
  letter-spacing: 6px;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.loading-brand span {
  width: 34px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(216, 105, 128, 0.42));
}

.loading-brand span:last-child {
  background: linear-gradient(90deg, rgba(216, 105, 128, 0.42), transparent);
}

.loading-keepsake {
  position: relative;
  width: 184px;
  height: 164px;
  display: grid;
  place-items: center;
  margin: 28px 0 18px;
}

.loading-flower {
  font-size: 72px;
  margin-bottom: 24px;
  animation: bloom 2s ease-in-out infinite alternate;
}

.loading-bloom {
  position: relative;
  width: 118px;
  height: 118px;
  filter: drop-shadow(0 16px 22px rgba(212, 104, 122, 0.12));
  animation: loadingBloomFloat 3.4s ease-in-out infinite;
}

.loading-bloom span {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 30px;
  height: 48px;
  border-radius: 999px 999px 14px 14px;
  background:
    radial-gradient(circle at 48% 24%, rgba(255,255,255,0.82), transparent 30%),
    linear-gradient(160deg, #FFD7E0, #D4687A);
  transform-origin: 50% 78%;
  opacity: 0.62;
}

.loading-bloom span:nth-child(1) { transform: translate(-50%, -82%) rotate(0deg); }
.loading-bloom span:nth-child(2) { transform: translate(-50%, -82%) rotate(60deg); }
.loading-bloom span:nth-child(3) { transform: translate(-50%, -82%) rotate(120deg); }
.loading-bloom span:nth-child(4) { transform: translate(-50%, -82%) rotate(180deg); }
.loading-bloom span:nth-child(5) { transform: translate(-50%, -82%) rotate(240deg); }
.loading-bloom span:nth-child(6) { transform: translate(-50%, -82%) rotate(300deg); }

.loading-bloom i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 26px;
  height: 26px;
  border: 4px solid rgba(255,255,255,0.78);
  border-radius: 50%;
  background: #FFE0E7;
  transform: translate(-50%, -50%);
  box-shadow: inset 0 1px 4px rgba(122,58,74,0.12);
}

.loading-envelope {
  position: absolute;
  left: 50%;
  bottom: 8px;
  width: 142px;
  max-width: 74%;
  transform: translateX(-50%);
  object-fit: contain;
  filter: drop-shadow(0 16px 20px rgba(169, 92, 108, 0.14));
  animation: loadingEnvelopeBreathe 2.8s ease-in-out infinite;
}

.letter-loading p,
.letter-not-found p {
  font-style: italic;
  color: #B08090;
}

.loading-kicker {
  margin: 0 0 8px;
  color: #9A5A68 !important;
  font-size: 13px;
  font-style: normal !important;
  letter-spacing: 2.8px;
  line-height: 1.4;
  text-transform: uppercase;
}

.loading-message {
  width: min(320px, 82vw);
  min-height: 44px;
  margin: 0;
  line-height: 1.55;
}

.letter-loading-bar {
  width: min(240px, 68vw);
  height: 8px;
  margin-top: 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(232, 180, 192, 0.52);
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(212, 104, 122, 0.08);
}

.letter-loading-bar span {
  display: block;
  height: 100%;
  min-width: 8px;
  border-radius: inherit;
  background: linear-gradient(90deg, #F4C0CE, #D4687A);
  transition: width 0.28s ease;
}

.loading-dots {
  display: flex;
  gap: 6px;
  margin-top: 14px;
}

.loading-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #D4687A;
  opacity: 0.35;
  animation: loadingDotPulse 1.05s ease-in-out infinite;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.16s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.32s;
}

@keyframes loadingDotPulse {
  0%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  45% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

@keyframes loadingBloomFloat {
  0%, 100% {
    transform: translateY(0) rotate(-2deg);
  }
  50% {
    transform: translateY(-8px) rotate(2deg);
  }
}

@keyframes loadingEnvelopeBreathe {
  0%, 100% {
    transform: translateX(-50%) translateY(0) scale(1);
  }
  50% {
    transform: translateX(-50%) translateY(-4px) scale(1.025);
  }
}

@keyframes loadingCardArrive {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.angle-photo {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  pointer-events: none;
  border-radius: 16px;
  transition: opacity 0.05s ease;
}

.no-photos,
.no-memories {
  text-align: center;
  color: #B08090;
}

/* ── Bloom Animation ──────────────────────────────────────────────── */
.bloom-wrapper {
  position: relative;
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.bloom-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(212, 104, 122, 0.3);
  animation: ringPulse 3s ease-in-out infinite;
}

.bloom-ring-1 {
  width: 100px;
  height: 100px;
  animation-delay: 0s;
}

.bloom-ring-2 {
  width: 130px;
  height: 130px;
  animation-delay: 0.5s;
  border-color: rgba(212, 104, 122, 0.2);
}

.bloom-ring-3 {
  width: 160px;
  height: 160px;
  animation-delay: 1s;
  border-color: rgba(212, 104, 122, 0.1);
}

@keyframes ringPulse {
  0%   { transform: scale(0.95); opacity: 0.8; }
  50%  { transform: scale(1.05); opacity: 0.4; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.bloom-center {
  position: relative;
  z-index: 10;
  animation: flowerSpin 12s linear infinite;
  filter: drop-shadow(0 4px 12px rgba(212, 104, 122, 0.3));
}

@keyframes flowerSpin {
  0%   { transform: rotate(0deg) scale(1); }
  25%  { transform: rotate(5deg) scale(1.05); }
  50%  { transform: rotate(0deg) scale(1); }
  75%  { transform: rotate(-5deg) scale(1.05); }
  100% { transform: rotate(0deg) scale(1); }
}

/* ── Desktop ──────────────────────────────────────────────────────── */
@media (min-width: 768px) {
  .letter-screens {
    max-width: 600px;
    box-shadow: 0 20px 60px rgba(212, 104, 122, 0.15);
    border-radius: 24px;
    overflow: hidden;
    height: 90vh;
    height: 90dvh;
    margin: auto;
  }

  .letter-screen {
    height: 100%;
    border-radius: 24px;
    overflow: hidden;
  }

  .letter-headline { font-size: 48px; }
  .letter-title    { font-size: 32px; }
  .letter-sub      { font-size: 16px; }
  .letter-quote    { font-size: 22px; }
  .petals-flower   { width: 380px; height: 380px; }
  .memory-slideshow { max-width: min(320px, 100%, 34dvh); }
  .memory-frame { width: min(100%, 30dvh, 300px); }
  .bouquet-preview  { max-width: min(420px, 100%, 36dvh); }
  .bouquet-stage { width: min(100%, 34dvh, 360px); }
  .viewer-360-full  { max-width: 700px; }

  .letter-screen-wrapper {
    height: 100%;
    overflow: hidden;
  }
}

@keyframes bouquetFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes glassShine {
  0%, 100% {
    opacity: 0.46;
    transform: translateX(-4px) rotate(28deg);
  }
  50% {
    opacity: 0.78;
    transform: translateX(5px) rotate(28deg);
  }
}

@keyframes bouquetTwinkle {
  0%, 100% {
    opacity: 0.22;
    transform: scale(0.78);
  }
  45% {
    opacity: 1;
    transform: scale(1.16);
  }
}

@container letter-frame (max-height: 700px) {
  .letter-screen {
    --screen-pad-top: 18px;
    --screen-pad-bottom-base: 70px;
    --screen-content-gap: 8px;
    --divider-space: 6px;
    --action-space: 10px;
    --title-size: clamp(23px, 5cqh, 30px);
    --sub-size: clamp(12px, 2.6cqh, 14px);
  }

  .letter-logo {
    margin-bottom: 8px;
  }

  .blooming-flower {
    font-size: clamp(58px, 13cqh, 76px);
  }

  .bloom-wrapper {
    width: min(150px, 24cqh);
    height: min(150px, 24cqh);
  }

  .petals-flower {
    width: min(300px, 72cqw, 42cqh);
    height: min(300px, 72cqw, 42cqh);
  }

  .memory-frame {
    width: min(100%, 36cqh, 340px);
  }

  .bouquet-stage {
    width: min(100%, 32cqh, 300px);
  }

  .bouquet-plaque {
    width: min(100%, 250px);
    padding-top: 6px;
    padding-bottom: 7px;
  }
}

@container letter-frame (max-height: 600px) {
  .letter-screen {
    --screen-pad-top: 12px;
    --screen-pad-bottom-base: 64px;
    --screen-content-gap: 6px;
    --divider-space: 4px;
    --action-space: 8px;
    --title-size: clamp(21px, 4.8cqh, 27px);
  }

  .screen-content {
    --screen-inline-pad: clamp(16px, 5cqw, 24px);
  }

  .letter-btn,
  .letter-btn-outline {
    min-height: 38px;
  }

  .page5-gift-btn {
    width: min(64vw, 300px);
    max-width: none;
    height: clamp(48px, 8.8vw, 88px);
    aspect-ratio: 723 / 211;
    min-height: 0;
    padding: 0;
  }

  .memory-frame {
    width: min(100%, 30cqh, 290px);
  }

  .bouquet-stage {
    width: min(100%, 28cqh, 260px);
  }

  .bouquet-plaque span {
    font-size: 9px;
  }

  .bouquet-plaque strong {
    font-size: 12px;
  }
}

@container letter-frame (max-width: 420px) {
  .letter-screen {
    --screen-inline-pad: clamp(16px, 5cqw, 22px);
    --title-size: clamp(24px, 8cqw, 30px);
  }

  .letter-screen::before {
    inset: 8px;
    border-radius: 24px;
  }

  .letter-screen::after {
    inset: 15px;
    border-radius: 20px;
  }

  .letter-divider {
    width: min(78%, 320px);
  }

  .letter-btn,
  .letter-btn-outline,
  .btn-360 {
    max-width: min(100%, 260px);
  }

  .page5-gift-btn {
    width: min(70cqw, 300px) !important;
    max-width: none !important;
    height: clamp(48px, 18cqw, 88px) !important;
    aspect-ratio: 723 / 211;
    min-height: 0 !important;
    padding: 0 !important;
  }
}

@media (max-height: 700px) {
  .letter-screen {
    padding: 24px 0 60px;
  }

  .letter-message-screen {
    padding: 18px 0 56px;
  }

  .memories-screen,
  .bouquet-screen {
    padding: 18px 0 56px;
  }

  .screen-content {
    max-height: calc(100dvh - 92px);
    padding: 0 24px;
  }

  .screen-content.center {
    gap: 8px;
  }

  .letter-logo {
    margin-bottom: 10px;
  }

  .letter-headline {
    font-size: clamp(32px, 7dvh, 40px);
    margin-bottom: 10px;
  }

  .letter-title {
    font-size: clamp(24px, 5.4dvh, 30px);
  }

  .letter-sub {
    margin-bottom: 8px;
  }

  .letter-divider {
    margin: 8px auto;
  }

  .letter-heart {
    font-size: 28px;
    margin-bottom: 8px;
  }

  .blooming-flower {
    font-size: 76px;
    margin-bottom: 18px;
  }

  .bloom-wrapper {
    width: 150px;
    height: 150px;
  }

  .bloom-ring-1 { width: 80px; height: 80px; }
  .bloom-ring-2 { width: 116px; height: 116px; }
  .bloom-ring-3 { width: 150px; height: 150px; }

  .petals-flower {
    width: min(300px, 76vw, 43dvh);
    height: min(300px, 76vw, 43dvh);
  }

  .letter-message-box {
    height: clamp(190px, 43dvh, 300px);
    --letter-message-pad-y: 22px;
    --letter-message-pad-x: 18px;
  }

  .letter-message-screen .letter-message-box {
    height: auto;
    --letter-message-pad-y: 18px;
    --letter-message-pad-x: 16px;
  }

  .letter-message-screen .sender-footer .letter-divider {
    margin: 6px auto;
  }

  .letter-message-screen .letter-from {
    font-size: 14px;
  }

  .memory-slideshow {
    max-width: min(310px, 100%, 33dvh);
  }

  .memory-frame {
    width: min(100%, 29dvh, 290px);
    max-height: min(290px, 29dvh);
  }

  .bouquet-preview {
    max-width: min(300px, 100%, 34dvh);
  }

  .bouquet-intro {
    display: none;
  }

  .bouquet-screen .letter-title,
  .memories-screen .letter-title {
    font-size: clamp(24px, 5dvh, 30px);
  }

  .bouquet-screen .letter-divider,
  .memories-screen .letter-divider {
    margin: 6px auto;
  }

  .envelope-icon {
    font-size: 56px;
    margin-bottom: 14px;
  }

  .sender-circle {
    width: 74px;
    height: 74px;
  }

  .end-flowers {
    font-size: 36px;
    margin-bottom: 12px;
  }

  .btn-360 {
    min-height: 38px;
    min-width: 150px;
    margin-top: 8px;
    padding: 9px 20px;
    font-size: 13px;
  }

  .bouquet-plaque {
    width: min(100%, 250px);
  }

  .screen-dots {
    bottom: calc(16px + var(--safe-bottom));
  }
}

@media (max-height: 620px) {
  .letter-screen {
    padding-top: 18px;
    padding-bottom: calc(66px + var(--safe-bottom));
  }

  .letter-message-screen {
    padding-top: 14px;
    padding-bottom: calc(62px + var(--safe-bottom));
  }

  .memories-screen,
  .bouquet-screen {
    padding-top: 14px;
    padding-bottom: calc(62px + var(--safe-bottom));
  }

  .screen-content {
    max-height: calc(100dvh - 72px);
  }

  .letter-logo {
    margin-bottom: 6px;
  }

  .letter-divider {
    margin: 6px auto;
  }

  .letter-btn,
  .letter-btn-outline {
    min-height: 40px;
    padding: 10px 24px;
  }

  .petals-flower {
    width: min(260px, 72vw, 38dvh);
    height: min(260px, 72vw, 38dvh);
  }

  .letter-message-box {
    height: clamp(170px, 40dvh, 250px);
    --letter-message-pad-y: 18px;
    --letter-message-pad-x: 16px;
  }

  .letter-message-screen .letter-heart {
    font-size: 24px;
    margin-bottom: 2px;
  }

  .letter-message-screen .letter-dear {
    font-size: 21px;
  }

  .letter-message-screen .letter-reveal-content > .letter-divider {
    margin: 4px auto;
  }

  .letter-message-screen .letter-message-box {
    height: auto;
    --letter-message-pad-y: 14px;
    --letter-message-pad-x: 14px;
  }

  .letter-message-screen .letter-message-text {
    font-size: var(--letter-message-font-size);
    line-height: var(--letter-paper-row);
  }

  .letter-message-screen .letter-from {
    font-size: 13px;
    letter-spacing: 0.5px;
  }

  .letter-message-screen .letter-btn-outline {
    min-height: 38px;
    padding: 9px 22px;
  }

  .memory-slideshow {
    max-width: min(290px, 100%, 31dvh);
  }

  .memory-frame {
    width: min(100%, 28dvh, 280px);
    max-height: min(280px, 28dvh);
  }

  .bouquet-preview {
    max-width: min(260px, 100%, 30dvh);
  }

  .bouquet-detail-row {
    display: none;
  }

  .memories-screen .letter-title,
  .bouquet-screen .letter-title {
  font-size: clamp(24px, 4.8dvh, 31px);
  line-height: 1.16;
  margin-bottom: clamp(4px, 0.8dvh, 8px);   /* was: 0 */
}

  .bouquet-screen .letter-divider,
  .memories-screen .letter-divider {
    margin: 4px auto;
  }

  .btn-360 {
    min-height: 36px;
    min-width: 142px;
    padding: 8px 16px;
    font-size: 12px;
  }

  .rotate-mark {
    width: 20px;
    height: 20px;
    font-size: 12px;
  }
}

@media (max-width: 360px) {
  .screen-content {
    padding: 0 20px;
  }

  .letter-message-box {
    --letter-message-pad-y: 22px;
    --letter-message-pad-x: 16px;
  }
}

@media (max-width: 480px) {
  .letter-message-screen {
    padding-left: 0;
    padding-right: 0;
  }

  .letter-message-screen .screen-content {
    padding: 0 clamp(16px, 5vw, 24px);
  }

  .letter-message-screen .letter-message-box {
    border-radius: 14px;
    --letter-message-pad-y: 20px;
    --letter-message-pad-x: 18px;
  }

  .letter-message-screen .letter-message-text {
    font-size: var(--letter-message-font-size);
    line-height: var(--letter-paper-row);
  }

  .letter-message-screen .letter-from {
    font-size: clamp(13px, 3.6vw, 16px);
  }

  .letter-message-screen .letter-btn-outline {
    max-width: min(100%, 260px);
    margin-bottom: 10px;
  }

  .page5-gift-btn {
    width: min(64vw, 300px);
    max-width: none;
    height: clamp(48px, 8.8vw, 88px);
    aspect-ratio: 723 / 211;
    min-height: 0;
    padding: 0;
  }

  .screen-content.center > .letter-btn,
  .screen-content.center > .letter-btn-outline,
  .letter-reveal-content .letter-btn-outline {
    margin-bottom: 8px;
  }

  .memories-screen .screen-content,
  .bouquet-screen .screen-content {
    padding: 0 clamp(16px, 5vw, 24px);
  }

  .memories-screen .screen-content {
    justify-content: center;
    padding-bottom: clamp(58px, 8dvh, 72px);
  }

  .memories-screen .letter-title,
  .bouquet-screen .letter-title {
    font-size: clamp(25px, 8vw, 32px);
  }

  .memory-slideshow {
    max-width: min(100%, 34dvh, 320px);
  }

  .memory-frame {
    width: min(100%, 30dvh, 300px);
    max-height: min(300px, 30dvh);
  }

  .bouquet-preview {
    max-width: min(100%, 39dvh);
  }

  .btn-360 {
    max-width: 220px;
  }

  .bouquet-plaque {
    width: min(100%, 240px);
  }

  .viewer-fullscreen {
    gap: 10px;
    padding-inline: 14px;
  }

  .viewer-stage-wrap {
    width: 100%;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .viewer-360-full {
    width: min(88vw, 54dvh);
  }

  .viewer-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  .viewer-nav.prev {
    left: 0;
  }

  .viewer-nav.next {
    right: 0;
  }

  .viewer-nav:hover {
    transform: translateY(-50%);
  }

  .viewer-nav:active {
    transform: translateY(-50%) scale(0.94);
  }

  .viewer-caption {
    width: min(100%, 260px);
  }
}

@media (max-width: 480px) and (max-height: 620px) {
  .letter-message-screen .letter-message-box {
    --letter-message-pad-y: 14px;
    --letter-message-pad-x: 14px;
  }

  .letter-message-screen .sender-footer .letter-divider {
    margin: 4px auto;
  }

  .memory-slideshow {
    max-width: min(100%, 30dvh);
  }

  .memory-frame {
    width: min(100%, 27dvh, 270px);
    max-height: 30dvh;
  }

  .bouquet-preview {
    max-width: min(100%, 29dvh);
  }

  .bouquet-plaque {
    display: none;
  }

  .viewer-header {
    gap: 3px;
  }

  .viewer-kicker {
    display: none;
  }

  .viewer-360-full {
    width: min(86vw, 48dvh);
  }

  .viewer-caption {
    display: none;
  }

  .viewer-footer {
    gap: 8px;
  }

  .petal-message-screen .petal-message-card {
  bottom: 100px !important;
  }

  .petal-message-screen .page3-read-btn {
  margin-bottom: 36px !important;
  }
}

/* ── Petal Symbol ─────────────────────────────────────────────────── */
.petal-symbol {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: clamp(14px, 3vw, 19px);
  color: #B65A6C;
  cursor: pointer;
  transition: all 0.3s ease;
}

.petal-symbol:hover {
  transform: scale(1.1);
}

.petal-zone.active .petal-symbol {
  color: #D4687A;
  transform: scale(1.12);
}

.petal-zone.revealed .petal-symbol {
  text-shadow: 0 2px 7px rgba(212, 104, 122, 0.22);
}

/* ── Petal Pill ───────────────────────────────────────────────────── */
.petal-message-card {
  width: min(76vw, 330px);
  min-height: 40px;
  margin: clamp(18px, 3.5dvh, 32px) auto 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(232, 180, 192, 0.72);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 253, 250, 0.95), rgba(255, 239, 244, 0.9));
  box-shadow:
    0 12px 22px rgba(163, 90, 105, 0.13),
    inset 0 1px 0 rgba(255, 255, 255, 0.86);
  color: #8A4050;
  font-family: 'Cormorant Garamond', 'Lora', serif;
  font-size: clamp(15px, min(4vw, 2.35dvh), 20px);
  font-weight: 500;
  line-height: 1.05;
  text-align: center;
  text-wrap: balance;
}

.petal-message-card span {
  color: #D4687A;
  font-size: 0.8em;
  flex: 0 0 auto;
}

.petal-message-enter-active,
.petal-message-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.petal-message-enter-from,
.petal-message-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}

.petal-pill {
  position: absolute;
  width: max-content;
  max-width: min(132px, 30vw);
  min-width: 86px;
  min-height: 32px;
  background:
    linear-gradient(180deg, rgba(255, 253, 250, 0.94), rgba(255, 239, 244, 0.9));
  border: 1px solid rgba(232, 180, 192, 0.72);
  border-radius: 999px;
  padding: 7px 12px;
  font-size: clamp(11px, min(2.75vw, 1.7dvh), 15px);
  font-family: 'Cormorant Garamond', 'Lora', serif;
  font-weight: 600;
  color: #8A4050;
  text-align: center;
  font-style: normal;
  max-width: none;
  line-height: 1.05;
  cursor: pointer;
  animation: pillReveal 0.4s ease;
  box-shadow:
    0 10px 18px rgba(163, 90, 105, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  text-wrap: balance;
  overflow-wrap: anywhere;
  pointer-events: none;
}

.petal-z-1 .petal-pill,
.petal-z-2 .petal-pill,
.petal-z-3 .petal-pill,
.petal-z-4 .petal-pill,
.petal-z-5 .petal-pill,
.petal-z-6 .petal-pill {
  left: 50%;
  transform: translateX(-50%);
}

.petal-z-1 .petal-pill {
  bottom: calc(100% + 2px);
}

.petal-z-2 .petal-pill,
.petal-z-6 .petal-pill {
  bottom: calc(100% - 4px);
}

.petal-z-3 .petal-pill,
.petal-z-5 .petal-pill {
  top: calc(100% - 4px);
}

.petal-z-4 .petal-pill {
  top: calc(100% + 2px);
}

@keyframes pillReveal {
  from { opacity: 0; transform: scale(0.8); }
  to   { opacity: 1; transform: scale(1); }
}

/* ── Letter Reveal ────────────────────────────────────────────────── */
.letter-reveal-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
}

.letter-reveal-wrap.opening .page4-envelope {
  animation: envelopeOpen 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.letter-reveal-wrap.opening .page4-circle {
  animation: sealRelease 0.72s ease both;
}

.page4-envelope-stage {
  position: relative;
  width: min(72vw, 360px, 34dvh);
  aspect-ratio: 1 / 1;
  margin: 0 auto clamp(10px, 1.6dvh, 18px);
  display: grid;
  place-items: center;
  filter: drop-shadow(0 22px 30px rgba(163, 90, 105, 0.13));
}

.page4-circle {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
  user-select: none;
}

.page4-envelope {
  position: absolute;
  width: 62%;
  height: auto;
  object-fit: contain;
  transform: rotate(-7deg);
  animation: envelopePulse 2.3s ease-in-out infinite;
  pointer-events: none;
  user-select: none;
}

.page4-title {
  margin: 0;
  color: #7A3A4A;
  font-family: 'Cormorant Infant', 'Cormorant Garamond', serif;
  font-size: clamp(44px, min(13vw, 7dvh), 74px);
  font-weight: 500;
  line-height: 0.88;
  letter-spacing: -0.02em;
  text-shadow:
    0 2px 0 rgba(255, 238, 242, 0.82),
    0 9px 18px rgba(122, 58, 74, 0.12);
}

.page4-title em {
  display: inline-block;
  margin-top: clamp(2px, 0.4dvh, 6px);
  color: #D4687A;
  font-family: 'Cormorant Infant', 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: clamp(38px, min(11.6vw, 6.4dvh), 66px);
  font-weight: 400;
  line-height: 0.82;
  letter-spacing: -0.014em;
}

.page4-divider {
  display: grid;
  grid-template-columns: minmax(54px, 1fr) auto minmax(54px, 1fr);
  align-items: center;
  gap: 12px;
  width: min(340px, 76vw);
  margin: clamp(10px, 1.6dvh, 18px) auto clamp(6px, 1dvh, 12px);
  color: #E59BAA;
  line-height: 1;
}

.page4-divider span {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 104, 122, 0.36), transparent);
}

.page4-open-btn {
  width: min(62vw, 292px);
  aspect-ratio: 683 / 212;
  min-height: 0;
  margin-top: clamp(12px, 2dvh, 22px) !important;
  padding: 0;
  background: url('/images/page4_ButtonFinal-trim.png') center / 80% 80% no-repeat;
  color: #fff;
  filter: none;
  box-shadow: none;
  animation: letterButtonAlive 4.8s ease-in-out infinite;
  font-size: clamp(18px, min(4.9vw, 2.6dvh), 25px);
  line-height: 1;
  white-space: nowrap;
}

@keyframes envelopePulse {
  0%, 100% { transform: rotate(-7deg) translateY(0) scale(1); }
  50%       { transform: rotate(-5deg) translateY(-5px) scale(1.03); }
}

@keyframes envelopeOpen {
  0% {
    opacity: 1;
    transform: rotate(-7deg) translateY(0) scale(1);
    filter: drop-shadow(0 0 0 rgba(255,255,255,0));
  }
  48% {
    opacity: 1;
    transform: rotate(-3deg) translateY(-4px) scale(1.12);
    filter: drop-shadow(0 12px 18px rgba(212, 104, 122, 0.24));
  }
  100% {
    opacity: 0;
    transform: rotate(6deg) translateY(-34px) scale(1.22);
    filter: drop-shadow(0 18px 24px rgba(255,255,255,0.74));
  }
}

@keyframes sealRelease {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(24px) scale(0.55) rotate(18deg);
  }
}

@keyframes envelopeSpark {
  0% {
    opacity: 0;
    transform: translate3d(0, 12px, 0) scale(0.6);
  }
  34% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate3d(0, -42px, 0) scale(1.15);
  }
}

.letter-reveal-content {
  width: 100%;
  max-height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

/* ── Typewriter ───────────────────────────────────────────────────── */
.typed-char {
  opacity: 0;
  animation: fadeInChar 0.1s forwards;
}

@keyframes fadeInChar {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.typing-cursor {
  display: inline;
  color: #D4687A;
  font-weight: 300;
  animation: cursorBlink 0.8s ease-in-out infinite;
  margin-left: 1px;
  vertical-align: baseline;
}

@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* ── Wax Seal ─────────────────────────────────────────────────────── */
.wax-seal {
  width: 52px;
  height: 52px;
  background: radial-gradient(circle at 40% 35%, #E87890, #C0506A);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Lora', serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  text-shadow: 0 1px 1px rgba(122, 58, 74, 0.22);
  color: rgba(255,255,255,0.9);
  box-shadow: 0 4px 12px rgba(192, 80, 106, 0.4);
  margin: 0 auto 16px;
  border: 2px solid rgba(255,255,255,0.4);
  animation: sealPulse 2s ease-in-out infinite;
}

@keyframes sealPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(192,80,106,0.4); }
  50%       { transform: scale(1.05); box-shadow: 0 6px 20px rgba(192,80,106,0.6); }
}

/* ── Falling Petals ───────────────────────────────────────────────── */
.falling-petals {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
  overflow: hidden;
}

.fall-petal {
  position: absolute;
  font-size: 14px;
  opacity: 0;
  animation: petalFall 4s linear infinite;
}

.fp-1 { left: 15%; animation-delay: 0s; }
.fp-2 { left: 40%; animation-delay: 1s; }
.fp-3 { left: 65%; animation-delay: 2s; }
.fp-4 { left: 85%; animation-delay: 3s; }

@keyframes petalFall {
  0%   { top: -20px; opacity: 0; transform: rotate(0deg) scale(0.8); }
  10%  { opacity: 0.7; }
  90%  { opacity: 0.4; }
  100% { top: 100vh; opacity: 0; transform: rotate(360deg) scale(1.2); }
}

/* ── Typing Cursor ────────────────────────────────────────────────── */
.typing-cursor {
  display: inline;
  color: #D4687A;
  font-weight: 300;
  animation: cursorBlink 0.8s ease-in-out infinite;
  margin-left: 1px;
  font-family: 'Lora', serif;
}

@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* ── Skip Button ──────────────────────────────────────────────────── */
.skip-btn {
  background: transparent;
  border: 1px solid rgba(212, 104, 122, 0.3);
  color: #C48090;
  border-radius: 20px;
  padding: 6px 16px;
  font-family: 'Lora', serif;
  font-size: 12px;
  font-style: italic;
  cursor: pointer;
  margin-top: 12px;
  transition: all 0.2s;
}

.skip-btn:hover {
  background: rgba(212, 104, 122, 0.08);
  border-color: #D4687A;
  color: #D4687A;
}

.soft-fade-enter-active,
.soft-fade-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.soft-fade-enter-from,
.soft-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Screen Transitions ───────────────────────────────────────────── */
.letter-screen-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* Forward (next page) */
.slide-forward-enter-active,
.slide-forward-leave-active {
  transition:
    opacity 0.32s ease,
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.32s ease;
  will-change: opacity, transform, filter;
}

.slide-forward-enter-from {
  opacity: 0;
  transform: translateX(34px) scale(0.985);
  filter: blur(1px);
}

.slide-forward-enter-to {
  opacity: 1;
  transform: translateX(0) scale(1);
  filter: blur(0);
}

.slide-forward-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
  filter: blur(0);
}

.slide-forward-leave-to {
  opacity: 0;
  transform: translateX(-22px) scale(0.992);
  filter: blur(1px);
}

/* Back (previous page) */
.slide-back-enter-active,
.slide-back-leave-active {
  transition:
    opacity 0.32s ease,
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.32s ease;
  will-change: opacity, transform, filter;
}

.slide-back-enter-from {
  opacity: 0;
  transform: translateX(-34px) scale(0.985);
  filter: blur(1px);
}

.slide-back-enter-to {
  opacity: 1;
  transform: translateX(0) scale(1);
  filter: blur(0);
}

.slide-back-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
  filter: blur(0);
}

.slide-back-leave-to {
  opacity: 0;
  transform: translateX(22px) scale(0.992);
  filter: blur(1px);
}
.quote-card,
.sender-keepsake,
.end-card {
  position: relative;
  display: grid;
  justify-items: center;
  width: min(100%, 360px);
  border: 1px solid rgba(232, 180, 192, 0.38);
  border-radius: 26px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.72), rgba(255, 244, 247, 0.52)),
    radial-gradient(circle at 50% 0%, rgba(255,255,255,0.78), transparent 48%);
  box-shadow:
    0 22px 54px rgba(122, 58, 74, 0.11),
    inset 0 1px 0 rgba(255,255,255,0.8);
  overflow: hidden;
  padding: clamp(22px, 4.8dvh, 34px) clamp(18px, 6vw, 30px);
}

.quote-card::before,
.sender-keepsake::before,
.end-card::before {
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(232, 180, 192, 0.18);
  border-radius: 20px;
  pointer-events: none;
}

.quote-card .quote-flower,
.end-card .end-flowers {
  margin-bottom: 12px;
  filter: drop-shadow(0 10px 14px rgba(212, 104, 122, 0.18));
}

.quote-mark {
  height: 32px;
  color: rgba(212, 104, 122, 0.28);
  font-family: Georgia, serif;
  font-size: 68px;
  line-height: 0.7;
}

.quote-card .letter-quote {
  font-size: clamp(18px, min(5.4vw, 3dvh), 22px);
  line-height: 1.7;
  padding: 0;
}

.quote-note {
  margin: 16px 0 0;
  color: #B08090;
  font-size: 12px;
  font-style: italic;
  line-height: 1.45;
}

.sender-keepsake {
  gap: 10px;
}

.sender-kicker {
  color: #C48090;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.sender-keepsake .sender-circle {
  background:
    radial-gradient(circle at 34% 28%, rgba(255,255,255,0.84), transparent 26%),
    linear-gradient(135deg, #F4C0CE, #D4687A);
  border: 4px solid rgba(255,255,255,0.68);
  box-shadow: 0 16px 30px rgba(212, 104, 122, 0.2);
}

.sender-keepsake .letter-title {
  margin-top: 0;
}

.end-card .end-flowers {
  font-size: 42px;                       
  margin-bottom: 8px;                    
}

.end-card .end-flowers {
  margin-bottom: 10px;
}

.end-card .end-brand {
  margin-top: 14px;
}

.end-actions {
  display: grid;
  justify-items: center;
  gap: 10px;
  width: min(100%, 300px);
  margin-top: 20px;
}

.end-actions .letter-btn-outline {
  min-height: 40px;
  min-width: min(210px, 100%);
  padding: 10px 22px;
  font-size: clamp(12px, min(3.4vw, 1.9dvh), 14px);
  white-space: nowrap;
}

.end-secondary-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #C48090;
  font-size: 12px;
}

.end-secondary-actions button {
  border: 0;
  background: transparent;
  color: #B76578;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-style: italic;
  padding: 3px 2px;
}

.end-secondary-actions button:hover {
  color: #D4687A;
  text-decoration: underline;
  text-underline-offset: 4px;
}

@media (max-height: 620px) {
  .recipient-keepsake {
    min-height: 26px;
    margin-bottom: 6px;
    padding: 5px 12px;
    font-size: 11px;
  }

  .quote-card,
  .sender-keepsake,
  .end-card {
    border-radius: 20px;
    padding: 18px 16px;
  }

  .quote-card::before,
  .sender-keepsake::before,
  .end-card::before {
    inset: 8px;
    border-radius: 15px;
  }

  .quote-note {
    display: none;
  }

  .dedication-card p,
  .memory-caption p {
    display: none;
  }

  .end-actions {
    margin-top: 12px;
  }
}

.welcome-screen {
  --screen-pad-top: clamp(22px, 3.8dvh, 36px);
  --screen-pad-bottom-base: clamp(62px, 8.6dvh, 78px);
  --screen-content-gap: clamp(2px, 0.45dvh, 6px);
}

.welcome-screen .screen-content {
  justify-content: center;
  max-height: none;
  overflow: visible;
}

.welcome-screen .letter-logo {
  margin-bottom: 0;
  letter-spacing: clamp(5px, 1.7vw, 9px);
  font-size: clamp(11px, min(3vw, 1.8dvh), 13px);
}

.welcome-top-divider,
.welcome-heart-line {
  display: grid;
  grid-template-columns: minmax(42px, 1fr) auto minmax(42px, 1fr);
  align-items: center;
  gap: 10px;
  width: min(300px, 74vw);
  color: #D4687A;
  line-height: 1;
}

.welcome-top-divider {
  margin: clamp(2px, 0.55dvh, 6px) auto clamp(4px, 0.8dvh, 9px);
  font-size: 12px;
  opacity: 0.72;
}

.welcome-heart-line {
  margin: clamp(4px, 0.75dvh, 8px) auto 0;
  color: #E89AAA;
  font-size: clamp(18px, min(4.8vw, 2.5dvh), 24px);
}

.welcome-top-divider span,
.welcome-heart-line span {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 104, 122, 0.42), transparent);
}

.welcome-screen .recipient-keepsake {
  min-height: clamp(28px, 4dvh, 38px);
  margin: 0 auto;
  padding: 5px 20px;
  border-color: rgba(232, 180, 192, 0.72);
  background:
    linear-gradient(145deg, rgba(255,255,255,0.78), rgba(255,239,243,0.58));
  box-shadow:
    0 14px 30px rgba(212, 104, 122, 0.12),
    inset 0 1px 0 rgba(255,255,255,0.88);
  color: #8F4C5E;
  font-size: clamp(15px, min(4.3vw, 2.35dvh), 20px);
}

.welcome-screen .recipient-keepsake::before,
.welcome-screen .recipient-keepsake::after {
  content: '\2665';
  color: #E8A6B4;
  font-size: 11px;
  margin: 0 10px;
}

.welcome-screen .letter-headline {
  margin: 0 0 clamp(-8px, -0.8dvh, -3px);
  color: #7A3A4A;
  font-family: 'Playfair Display', 'Lora', serif;
  font-size: clamp(44px, min(13.6vw, 7.4dvh), 72px);
  font-weight: 400;
  line-height: 0.9;
  text-shadow:
    0 2px 0 rgba(255, 238, 242, 0.82),
    0 9px 18px rgba(122, 58, 74, 0.14);
}

.welcome-screen .letter-headline em {
  display: inline-block;
  margin-top: clamp(1px, 0.25dvh, 4px);
  color: #D4687A;
  font-family: 'Great Vibes', 'Lora', cursive;
  font-size: clamp(52px, min(16vw, 8.2dvh), 82px);
  font-weight: 400;
  line-height: 0.72;
  text-shadow:
    0 1px 0 rgba(255, 248, 249, 0.8),
    0 8px 18px rgba(212, 104, 122, 0.12);
}

.welcome-screen .letter-invitation-card {
  width: min(70vw, 310px, 29dvh);
  height: auto;
  aspect-ratio: 1.34 / 1;
  margin: clamp(2px, 0.4dvh, 5px) auto clamp(0px, 0.25dvh, 4px);
  filter: drop-shadow(0 22px 30px rgba(163, 90, 105, 0.18));
}

.welcome-screen .letter-envelope-image {
  transform: translateZ(0);
}

.welcome-screen .letter-invite-paper {
  height: 100%;
  border-radius: 8px;
  background:
    linear-gradient(155deg, rgba(255,255,255,0.98), rgba(255,234,240,0.94)),
    repeating-linear-gradient(0deg, transparent 0 22px, rgba(212, 104, 122, 0.06) 23px 24px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.92),
    inset 0 -20px 34px rgba(212,104,122,0.08);
}

.welcome-screen .letter-invite-paper::before {
  background:
    linear-gradient(145deg, transparent 0 49%, rgba(212,104,122,0.18) 50%, transparent 51%),
    linear-gradient(215deg, transparent 0 49%, rgba(212,104,122,0.14) 50%, transparent 51%),
    linear-gradient(0deg, transparent 0 46%, rgba(255,255,255,0.54) 47%, transparent 48%);
}

.welcome-screen .letter-invite-seal {
  bottom: 48%;
  width: clamp(48px, 13vw, 64px);
  height: clamp(48px, 13vw, 64px);
  background:
    radial-gradient(circle at 34% 28%, rgba(255,255,255,0.82), transparent 25%),
    radial-gradient(circle at 50% 52%, #F19AAA, #C45268);
  border: 3px solid rgba(255,255,255,0.6);
  color: rgba(255,255,255,0.94);
  font-size: clamp(22px, 5vw, 30px);
  text-shadow: 0 1px 2px rgba(122, 58, 74, 0.2);
  transform: translate(-50%, 50%);
}

.welcome-screen .letter-divider {
  margin: clamp(-2px, -0.2dvh, 0px) auto 0;
}

.welcome-screen .letter-sub {
  color: #8F5A66;
  font-size: clamp(14px, min(3.8vw, 2dvh), 17px);
  font-style: italic;
  line-height: 1.24;
  margin: 0;
}

.welcome-screen .letter-btn {
  min-width: min(270px, 72vw);
  min-height: clamp(44px, 5.8dvh, 56px);
  margin-top: clamp(8px, 1.2dvh, 12px);
  border: none;
  color: #fff;
  font-size: clamp(17px, min(4.4vw, 2.35dvh), 22px);
  font-weight: 400;
}

.welcome-screen .page1-open-btn {
  width: min(62vw, 292px);
  min-width: 0;
  min-height: 0;
  padding: 0;
}

@media (max-height: 700px) {
  .welcome-screen {
    --screen-pad-top: 16px;
    --screen-pad-bottom-base: 52px;
    --screen-content-gap: 2px;
  }

  .welcome-screen .letter-headline {
    font-size: clamp(34px, min(12vw, 6.2dvh), 50px);
  }

  .welcome-screen .letter-headline em {
    font-size: clamp(42px, min(14vw, 7.2dvh), 58px);
  }

  .welcome-screen .letter-invitation-card {
    width: min(62vw, 252px, 25dvh);
  }

  .welcome-heart-line {
    margin-top: 4px;
  }

  .welcome-screen .letter-sub {
    font-size: 13px;
  }

.welcome-screen .letter-btn {
    min-height: 42px;
  }

  .welcome-screen .page1-open-btn {
    width: min(58vw, 258px);
    min-height: 0;
    padding: 0;
  }
}

@media (max-width: 520px) {
  .petal-message-screen .petals-flower {
    width: min(114vw, 560px, 62dvh);
    height: min(114vw, 560px, 62dvh);
  }

  .petal-message-screen .petal-zone {
    width: clamp(42px, 11vw, 58px);
    height: clamp(42px, 11vw, 58px);
  }

  .petal-pill {
    max-width: min(128px, 31vw);
    min-width: 74px;
    padding: 6px 9px;
  }

  .page3-title {
    font-size: clamp(40px, 12vw, 54px);
  }

  .page3-sub {
    font-size: clamp(21px, 6vw, 28px);
  }
}

@media (max-height: 700px) {
  .petal-message-screen {
    --screen-pad-top: 20px;
    --screen-pad-bottom-base: 58px;
    --screen-content-gap: 4px;
  }

  .petal-message-screen .petals-flower {
    width: min(106vw, 540px, 60dvh);
    height: min(106vw, 540px, 60dvh);
  }

  .page3-title {
    font-size: clamp(34px, min(10vw, 5.4dvh), 52px);
  }

  .page3-sub {
    margin-bottom: 8px;
    font-size: clamp(18px, min(5vw, 3dvh), 26px);
  }

  .page3-read-btn {
    min-height: 42px;
    width: min(58vw, 252px);
    margin-top: 8px !important;
  }

  .page4-envelope-stage {
    width: min(58vw, 280px, 27dvh);
    margin-bottom: 8px;
  }

  .page4-title {
    font-size: clamp(34px, min(10vw, 5.4dvh), 52px);
  }

  .page4-title em {
    font-size: clamp(30px, min(9vw, 4.8dvh), 46px);
  }

  .page4-divider {
    margin: 8px auto 6px;
  }
}

.memories-screen .page5-gift-btn {
  display: inline-flex !important;
  flex: 0 0 auto !important;
  width: min(68vw, 320px, 78cqw) !important;
  height: auto !important;
  aspect-ratio: 723 / 211 !important;
  min-height: 0 !important;
  margin: clamp(10px, 1.5dvh, 16px) auto 0 !important;
  padding: 0 !important;
  border: 0 !important;
  background: url('/images/page5_button-trim.png') center / 20% 20% no-repeat !important;
  opacity: 1 !important;
  visibility: visible !important;
}

/* Final page 5 guard: keep memories centered and the image button visible. */
.memories-screen.letter-screen {
  --screen-pad-top: clamp(18px, 3dvh, 28px);
  --screen-pad-bottom-base: clamp(58px, 8dvh, 72px);
}

.memories-screen .screen-content.center {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  height: 100% !important;
  max-height: none !important;
  gap: clamp(7px, 1.05dvh, 12px) !important;
  padding: 0 clamp(18px, 5vw, 28px) clamp(18px, 2.8dvh, 28px) !important;
}

.memories-screen .letter-logo {
  margin: 0 !important;
}

.memories-screen .letter-title {
  flex: 0 0 auto !important;
  margin: 0 !important;
  font-size: clamp(23px, min(5vw, 4.6dvh), 31px) !important;
  line-height: 1.12 !important;
}

.memories-screen .letter-divider {
  flex: 0 0 auto !important;
  margin: clamp(4px, 0.8dvh, 8px) auto !important;
}

.memories-screen .memory-slideshow {
  flex: 0 0 auto !important;
  width: min(100%, 310px, 34dvh) !important;
  max-width: min(100%, 310px, 34dvh) !important;
  height: auto !important;
  justify-content: center !important;
}

.memories-screen .memory-frame {
  width: min(100%, 280px, 29dvh) !important;
  max-height: min(280px, 29dvh) !important;
}

.memories-screen .memory-caption {
  width: min(100%, 288px) !important;
  margin-top: clamp(6px, 0.8dvh, 10px) !important;
}

.memories-screen .page5-gift-btn {
  display: inline-flex !important;
  flex: 0 0 auto !important;
  width: min(50vw, 210px, 56cqw) !important;
  height: auto !important;
  aspect-ratio: 723 / 211 !important;
  min-height: 0 !important;
  margin: clamp(10px, 1.5dvh, 16px) auto 0 !important;
  padding: 0 !important;
  border: 0 !important;
  background: url('/images/page5_button-trim.png') center / 100% 100% no-repeat !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.memories-screen .page5-gift-btn-img {
  display: none !important;
}

/* Final page 7 guard: polished reminder card with clean, safe symbols. */
.quote-screen.letter-screen {
  --screen-pad-top: clamp(22px, 4dvh, 42px);
  --screen-pad-bottom-base: clamp(62px, 8dvh, 82px);
}

.quote-screen .screen-content {
  max-height: none;
  overflow: visible;
}

.quote-screen .screen-content.center {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  height: 100% !important;
  gap: clamp(8px, 1.2dvh, 14px) !important;
  padding: 0 clamp(18px, 5vw, 32px) clamp(12px, 1.8dvh, 22px) !important;
}

.quote-screen .quote-logo {
  position: relative;
  margin: 0 0 clamp(8px, 1.5dvh, 18px) !important;
  color: #A9556A;
  font-size: clamp(12px, min(3.2vw, 1.9dvh), 16px);
  letter-spacing: 0.34em;
  text-transform: uppercase;
}

.quote-screen .quote-logo::before,
.quote-screen .quote-logo::after {
  content: '';
  position: absolute;
  top: 50%;
  width: clamp(4px, 1vw, 6px);
  height: clamp(4px, 1vw, 6px);
  border-radius: 2px;
  background: #E18499;
  transform: translateY(-50%) rotate(45deg);
}

.quote-screen .quote-logo::before {
  left: clamp(-28px, -5vw, -18px);
}

.quote-screen .quote-logo::after {
  right: clamp(-28px, -5vw, -18px);
}

.quote-flower-wrap {
  position: relative;
  width: min(23vw, 118px, 15dvh);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  margin-bottom: clamp(4px, 0.8dvh, 8px);
  animation: letterButtonAlive 5.8s ease-in-out infinite;
}

.quote-flower-wrap::before {
  content: '';
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  background:
    radial-gradient(circle, rgba(255,255,255,0.82), rgba(255,220,228,0.24) 62%, transparent 72%);
}

.quote-flower-img {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: saturate(1.05);
}

.quote-kicker {
  margin: 0;
  color: #8A3D4E;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(19px, min(5vw, 3dvh), 29px);
  font-style: italic;
  line-height: 1.05;
  text-align: center;
}

.quote-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: min(58vw, 230px);
  color: #D76A82;
  margin: clamp(2px, 0.5dvh, 6px) auto clamp(4px, 0.8dvh, 8px);
}

.quote-divider span {
  height: 1px;
  flex: 1;
  background: linear-gradient(90deg, transparent, rgba(215, 106, 130, 0.58), transparent);
}

.quote-divider i {
  font-style: normal;
  font-size: clamp(14px, min(4vw, 2.3dvh), 19px);
}

.quote-screen .quote-card {
  position: relative;
  width: min(100%, 520px, 72cqw);
  min-height: clamp(145px, 22dvh, 230px);
  display: grid;
  place-items: center;
  padding: clamp(22px, 4dvh, 36px) clamp(22px, 6vw, 46px);
  overflow: hidden;
  border: 1px solid rgba(246, 205, 213, 0.78);
  border-radius: clamp(24px, 5vw, 38px);
  background:
    radial-gradient(circle at 50% 10%, rgba(255,255,255,0.82), transparent 48%),
    linear-gradient(145deg, rgba(255, 244, 247, 0.82), rgba(255, 217, 226, 0.54));
  box-shadow: none !important;
}

.quote-screen .quote-card::before {
  content: '';
  position: absolute;
  inset: 9px;
  border: 1px solid rgba(255,255,255,0.7);
  border-radius: inherit;
  pointer-events: none;
}

.quote-screen .quote-card::after {
  content: '';
  position: absolute;
  inset: auto 14px 12px auto;
  width: clamp(48px, 12vw, 86px);
  height: clamp(48px, 12vw, 86px);
  opacity: 0.62;
  background:
    radial-gradient(ellipse at 30% 78%, transparent 0 42%, rgba(255,255,255,0.9) 44% 48%, transparent 50%),
    radial-gradient(ellipse at 60% 70%, transparent 0 42%, rgba(255,255,255,0.86) 44% 48%, transparent 50%),
    linear-gradient(135deg, transparent 46%, rgba(255,255,255,0.82) 47% 50%, transparent 51%);
  transform: rotate(-18deg);
  pointer-events: none;
}

.quote-screen .letter-quote {
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 0;
  color: #87384A;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(24px, min(6.8vw, 4.2dvh), 42px);
  font-style: italic;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
  text-align: center;
}

.quote-screen .page7-continue {
  width: min(58vw, 300px, 64cqw);
  margin-top: clamp(14px, 2.2dvh, 24px) !important;
}

@media (max-width: 520px) {
  .petal-message-screen .petals-flower {
    width: min(96vw, 500px, 45dvh) !important;
    height: min(96vw, 500px, 45dvh) !important;
    min-width: min(96vw, 500px, 45dvh) !important;
    min-height: min(96vw, 500px, 45dvh) !important;
    max-width: min(96vw, 500px, 45dvh) !important;
    max-height: min(96vw, 500px, 45dvh) !important;
  }
}

@media (max-height: 700px) {
  .petal-message-screen .screen-content.center {
    gap: clamp(2px, 0.45dvh, 5px) !important;
    padding-top: clamp(4px, 1dvh, 10px) !important;
    padding-bottom: clamp(56px, 8dvh, 70px) !important;
  }

  .petal-message-screen .petals-flower {
    width: min(86vw, 460px, 39dvh) !important;
    height: min(86vw, 460px, 39dvh) !important;
    min-width: min(86vw, 460px, 39dvh) !important;
    min-height: min(86vw, 460px, 39dvh) !important;
    max-width: min(86vw, 460px, 39dvh) !important;
    max-height: min(86vw, 460px, 39dvh) !important;
  }

  .petal-message-screen .petal-message-card {
    bottom: clamp(64px, 9dvh, 84px) !important;
  }

  .petal-message-screen .page3-read-btn {
    width: min(52vw, 226px) !important;
    margin-bottom: clamp(30px, 4.2dvh, 40px) !important;
  }
}

.page8-finish-btn {
  width: min(62vw, 292px);
  aspect-ratio: 709 / 216;
  min-height: 0;
  margin-top: clamp(12px, 2dvh, 22px) !important;
  padding: 0;
  background: url('/images/page8_button-trim.png') center / 80% 80% no-repeat;
  color: #fff;
  filter: none;
  box-shadow: none;
  animation: letterButtonAlive 4.8s ease-in-out infinite;
}

.page9-again-btn {
  width: min(58vw, 268px);
  aspect-ratio: 709 / 216;
  min-height: 0;
  padding: 0;
  background: url('/images/page9_button-trim.png') center / 80% 80% no-repeat;
  color: #D4687A;
  filter: none;
  box-shadow: none;
  animation: letterButtonAlive 4.8s ease-in-out infinite;
}

.bouquet-screen .screen-content.center > .letter-btn.page2-continue.page6-continue {
  position: relative !important;
  z-index: 5 !important;
  margin-top: clamp(4px, 0.6dvh, 8px) !important;
}

.page6-unlock-enter-active {
  transition: opacity 360ms ease, filter 360ms ease;
}

.page6-unlock-enter-from {
  opacity: 0;
  filter: blur(3px);
}

.bouquet-screen .screen-content {
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  max-height: 100% !important;
  overflow: visible !important;
  padding-top: clamp(6px, 1dvh, 12px) !important;
  padding-bottom: clamp(10px, 1.5dvh, 18px) !important;
  gap: clamp(4px, 0.8dvh, 8px) !important;
}

.bouquet-screen .letter-divider {
  margin: clamp(2px, 0.4dvh, 4px) auto !important;
}

.bouquet-screen .letter-logo {
  margin-bottom: 0 !important;
}

@media (max-width: 520px) {
  .petal-message-screen .petals-flower {
    width: min(114vw, 560px, 62dvh);
    height: min(114vw, 560px, 62dvh);
  }

  .petal-message-screen .petal-zone {
    width: clamp(42px, 11vw, 58px);
    height: clamp(42px, 11vw, 58px);
  }

  .petal-pill {
    max-width: min(128px, 31vw);
    min-width: 74px;
    padding: 6px 9px;
  }

  .page3-title {
    font-size: clamp(40px, 12vw, 54px);
  }

  .page3-sub {
    font-size: clamp(21px, 6vw, 28px);
  }

  /* add these two rules */
  .petal-message-screen .petal-message-card {
    bottom: clamp(78px, 11dvh, 100px) !important;
  }

  .petal-message-screen .page3-read-btn {
    margin: clamp(6px, 1dvh, 10px) auto clamp(24px, 3.6dvh, 34px) !important;
  }
}

@media (max-height: 720px) {
  .quote-screen .quote-flower-wrap {
    width: min(18vw, 92px, 12dvh);
  }

  .quote-screen .quote-card {
    min-height: clamp(122px, 19dvh, 170px);
    padding-block: clamp(18px, 3dvh, 26px);
  }

  .quote-screen .letter-quote {
    font-size: clamp(22px, min(5.8vw, 3.6dvh), 34px);
    line-height: 1.34;
  }
}

/* Page 3 final layout: keep the petal flower stable while messages reveal. */
.petal-message-screen .screen-content.center {
  position: relative !important;
  justify-content: center !important;
  overflow: visible !important;
  gap: clamp(5px, 0.8dvh, 10px) !important;
  padding-top: clamp(24px, 3.8dvh, 38px) !important;
  padding-bottom: clamp(56px, 7.4dvh, 74px) !important;
}

.petal-message-screen .letter-logo {
  max-width: min(74vw, 260px) !important;
  margin: 0 auto clamp(2px, 0.45dvh, 5px) !important;
  color: #A9556A !important;
  font-size: clamp(8px, min(2.1vw, 1.25dvh), 10px) !important;
  line-height: 1.2 !important;
  letter-spacing: clamp(4px, 0.78vw, 7px) !important;
  white-space: nowrap !important;
  overflow: visible !important;
  text-align: center !important;
}

.petal-message-screen .page3-logo-divider {
  margin: 0 auto clamp(2px, 0.55dvh, 6px) !important;
}

.petal-message-screen .page3-title {
  font-size: clamp(32px, min(8.4vw, 5.35dvh), 50px) !important;
  line-height: 0.98 !important;
  margin-top: clamp(1px, 0.3dvh, 4px) !important;
}

.petal-message-screen .page3-sub {
  font-size: clamp(16px, min(4.35vw, 2.45dvh), 23px) !important;
  line-height: 1.05 !important;
  margin: clamp(1px, 0.3dvh, 3px) 0 clamp(10px, 1.55dvh, 16px) !important;
}

.petal-message-screen .petals-flower {
  flex: 0 0 auto !important;
  width: min(86vw, 520px, 40dvh) !important;
  height: min(86vw, 520px, 40dvh) !important;
  min-width: min(86vw, 520px, 40dvh) !important;
  min-height: min(86vw, 520px, 40dvh) !important;
  max-width: min(86vw, 520px, 40dvh) !important;
  max-height: min(86vw, 520px, 40dvh) !important;
  margin: 0 auto !important;
  contain: layout paint;
}

.petal-message-screen .flower-image {
  width: 100% !important;
  height: 100% !important;
}

.petal-message-screen .petal-sparkle-burst {
  position: absolute;
  inset: 0;
  z-index: 18;
  pointer-events: none;
}

.petal-message-screen .petal-sparkle-burst span {
  position: absolute;
  width: clamp(5px, 1.1vw, 9px);
  height: clamp(5px, 1.1vw, 9px);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.98) 0 28%, rgba(255, 196, 211, 0.9) 30% 54%, transparent 58%);
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.4);
  animation: petalSparklePop 920ms ease-out both;
}

.petal-message-screen .petal-sparkle-burst span:nth-child(1) { left: 50%; top: 22%; animation-delay: 0ms; }
.petal-message-screen .petal-sparkle-burst span:nth-child(2) { left: 76%; top: 40%; animation-delay: 70ms; }
.petal-message-screen .petal-sparkle-burst span:nth-child(3) { left: 70%; top: 67%; animation-delay: 130ms; }
.petal-message-screen .petal-sparkle-burst span:nth-child(4) { left: 50%; top: 78%; animation-delay: 190ms; }
.petal-message-screen .petal-sparkle-burst span:nth-child(5) { left: 28%; top: 66%; animation-delay: 120ms; }
.petal-message-screen .petal-sparkle-burst span:nth-child(6) { left: 24%; top: 39%; animation-delay: 50ms; }

.petal-message-screen .petal-zone {
  z-index: 32 !important;
  border-radius: 999px;
  transition:
    filter 260ms ease,
    transform 260ms ease,
    background-color 260ms ease;
}

.petal-message-screen .petal-zone.revealed {
  filter:
    drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))
    drop-shadow(0 0 12px rgba(216, 105, 128, 0.22));
}

.petal-message-screen .petal-zone.active {
  background:
    radial-gradient(circle at 50% 44%, rgba(255, 255, 255, 0.34), rgba(255, 210, 222, 0.1) 58%, transparent 72%);
  filter:
    drop-shadow(0 0 10px rgba(255, 255, 255, 0.98))
    drop-shadow(0 0 20px rgba(216, 105, 128, 0.35));
  transform: translateZ(0) scale(1.05);
}

.petal-message-screen .petal-zone.active .petal-symbol,
.petal-message-screen .petal-zone.revealed .petal-symbol {
  color: #C85C73;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.95);
}

.petal-message-screen .petal-message-slot {
  position: relative !important;
  flex: 0 0 clamp(34px, 5dvh, 44px) !important;
  width: min(78vw, 330px) !important;
  display: grid !important;
  place-items: center !important;
  margin: clamp(2px, 0.5dvh, 6px) auto 0 !important;
  z-index: 80 !important;
}

.petal-message-screen .petal-message-card {
  position: relative !important;
  inset: auto !important;
  width: 100% !important;
  z-index: 90 !important;
  margin: 0 !important;
  pointer-events: none;
  transform-origin: center bottom;
  box-shadow: 0 10px 24px rgba(145, 73, 89, 0.08);
}

.petal-message-screen .page3-read-btn {
  position: relative !important;
  z-index: 130 !important;
  flex: 0 0 auto !important;
  width: min(54vw, 238px) !important;
  margin: clamp(4px, 0.7dvh, 8px) auto clamp(30px, 4dvh, 42px) !important;
  transform-origin: center;
}

.petal-message-screen > .screen-dots {
  z-index: 25 !important;
  bottom: calc(clamp(10px, 2dvh, 16px) + var(--safe-bottom)) !important;
}

.petal-message-enter-from,
.petal-message-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96) !important;
}

.petal-message-enter-active {
  transition: opacity 420ms ease, transform 520ms cubic-bezier(.2, .8, .2, 1);
}

.petal-message-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

@keyframes petalSparklePop {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.25);
  }
  34% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.15);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -92%) scale(0.72);
  }
}

@media (min-width: 700px) and (max-height: 760px) {
  .petal-message-screen .screen-content.center {
    padding-top: clamp(30px, 4.4dvh, 42px) !important;
    gap: clamp(3px, 0.55dvh, 7px) !important;
  }

  .petal-message-screen .letter-logo {
    font-size: clamp(8px, 1.45dvh, 10px) !important;
    letter-spacing: clamp(5px, 0.72vw, 8px) !important;
    margin-bottom: 0 !important;
  }

  .petal-message-screen .page3-logo-divider {
    margin-bottom: clamp(1px, 0.35dvh, 4px) !important;
  }

  .petal-message-screen .page3-title {
    font-size: clamp(34px, 5.6dvh, 44px) !important;
    line-height: 0.98 !important;
    margin: 0 !important;
  }

  .petal-message-screen .page3-sub {
    font-size: clamp(17px, 2.75dvh, 22px) !important;
    line-height: 1.02 !important;
    margin: clamp(2px, 0.45dvh, 5px) 0 clamp(10px, 1.7dvh, 16px) !important;
  }
}
</style>
