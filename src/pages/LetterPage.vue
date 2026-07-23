<script setup lang="ts">
import { nextTick, ref, onMounted, onUnmounted, watch } from 'vue'
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
const currentMemory = ref(0)
const currentAngle = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const memoryTimer = ref<number | null>(null)
const show360 = ref(false)
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

let letterMusic: HTMLAudioElement | null = null
let loadingTextTimer: number | null = null
let musicUnlockHandler: (() => void) | null = null
let angleFrameImages: Array<HTMLImageElement | null> = []
let anglePreloadRun = 0

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
  startLoadingTextShuffle()
  loadingLoaded.value = 0
  loadingTotal.value = 1

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
  loading.value = false
  stopLoadingTextShuffle()
  startMemoryTimer()
  void startDefaultMusic()
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
  revealedPetals.value[i] = !revealedPetals.value[i]
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
  loadLetter()
  window.addEventListener('resize', renderAngleFrame)
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
      <div class="loading-bloom" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <i></i>
      </div>
      <p class="loading-message">{{ loadingMessage }}</p>
      <div class="letter-loading-bar" aria-hidden="true">
        <span :style="{ width: `${Math.round((loadingLoaded / loadingTotal) * 100)}%` }"></span>
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
        class="letter-screen"
        :style="{ backgroundColor: screenBg('screen1') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <div class="blooming-flower">🌸</div>
          <h1 class="letter-headline">A message<br><em>just for you</em></h1>
          <div class="letter-divider"><span></span>✦<span></span></div>
          <p class="letter-sub">Someone who loves you<br>has something to say</p>
          <button class="letter-btn" @click="nextScreen">Open your letter</button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 2 — Blooming Animation ─────────────────────── -->
      <div
        v-if="currentScreen === 1"
        class="letter-screen"
        :style="{ backgroundColor: screenBg('screen2') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>

          <div class="bloom-wrapper">
            <div class="bloom-ring bloom-ring-1"></div>
            <div class="bloom-ring bloom-ring-2"></div>
            <div class="bloom-ring bloom-ring-3"></div>
            <div class="bloom-center">
              <svg viewBox="0 0 100 100" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="50" cy="20" rx="12" ry="20" fill="#F4C0CE" opacity="0.9"/>
                <ellipse cx="50" cy="20" rx="12" ry="20" fill="#F4C0CE" opacity="0.9" transform="rotate(60 50 50)"/>
                <ellipse cx="50" cy="20" rx="12" ry="20" fill="#F0B4C4" opacity="0.9" transform="rotate(120 50 50)"/>
                <ellipse cx="50" cy="20" rx="12" ry="20" fill="#F4C0CE" opacity="0.9" transform="rotate(180 50 50)"/>
                <ellipse cx="50" cy="20" rx="12" ry="20" fill="#F0B4C4" opacity="0.9" transform="rotate(240 50 50)"/>
                <ellipse cx="50" cy="20" rx="12" ry="20" fill="#F4C0CE" opacity="0.9" transform="rotate(300 50 50)"/>
                <circle cx="50" cy="50" r="14" fill="#FAD4A8"/>
                <circle cx="50" cy="50" r="10" fill="#FFE4B5"/>
              </svg>
            </div>
          </div>

          <h2 class="letter-title" style="margin-top: 32px;">Something special<br><em>is waiting for you...</em></h2>
          <div class="letter-divider"><span></span>✦<span></span></div>
          <p class="letter-sub">Please wait a moment</p>
          <button class="letter-btn-outline" style="margin-top: 24px;" @click="nextScreen">Continue →</button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 3 — Petal Messages ─────────────────────────── -->
      <div
        v-if="currentScreen === 2"
        class="letter-screen"
        :style="{ backgroundColor: screenBg('screen3') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <h2 class="letter-title" style="margin-bottom: 4px;">Your petals</h2>
          <p class="letter-sub" style="margin-bottom: 20px;">Tap a petal to reveal your message</p>

          <div class="petals-flower">
            <svg class="flower-svg" viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="140" cy="60"  rx="32" ry="48" fill="#F4C0CE" opacity="0.88"/>
              <ellipse cx="140" cy="60"  rx="32" ry="48" fill="#F0B4C4" opacity="0.88" transform="rotate(60 140 140)"/>
              <ellipse cx="140" cy="60"  rx="32" ry="48" fill="#F4C0CE" opacity="0.88" transform="rotate(120 140 140)"/>
              <ellipse cx="140" cy="60"  rx="32" ry="48" fill="#F0B4C4" opacity="0.88" transform="rotate(180 140 140)"/>
              <ellipse cx="140" cy="60"  rx="32" ry="48" fill="#F4C0CE" opacity="0.88" transform="rotate(240 140 140)"/>
              <ellipse cx="140" cy="60"  rx="32" ry="48" fill="#F0B4C4" opacity="0.88" transform="rotate(300 140 140)"/>
              <circle cx="140" cy="140" r="30" fill="#FAD4A8"/>
              <circle cx="140" cy="140" r="22" fill="#FFE4B5"/>
            </svg>

            <!-- Petal 1 — Top -->
            <div class="petal-zone petal-z-1" @click="revealPetal(0)">
              <div class="petal-symbol" v-if="!revealedPetals[0]">✦</div>
              <div class="petal-pill" v-else>{{ letter.petal_messages[0] }}</div>
            </div>

            <!-- Petal 2 — Top Right -->
            <div class="petal-zone petal-z-2" @click="revealPetal(1)">
              <div class="petal-symbol" v-if="!revealedPetals[1]">✦</div>
              <div class="petal-pill" v-else>{{ letter.petal_messages[1] }}</div>
            </div>

            <!-- Petal 3 — Bottom Right -->
            <div class="petal-zone petal-z-3" @click="revealPetal(2)">
              <div class="petal-symbol" v-if="!revealedPetals[2]">✦</div>
              <div class="petal-pill" v-else>{{ letter.petal_messages[2] }}</div>
            </div>

            <!-- Petal 4 — Bottom -->
            <div class="petal-zone petal-z-4" @click="revealPetal(3)">
              <div class="petal-symbol" v-if="!revealedPetals[3]">✦</div>
              <div class="petal-pill" v-else>{{ letter.petal_messages[3] }}</div>
            </div>

            <!-- Petal 5 — Bottom Left -->
            <div class="petal-zone petal-z-5" @click="revealPetal(4)">
              <div class="petal-symbol" v-if="!revealedPetals[4]">✦</div>
              <div class="petal-pill" v-else>{{ letter.petal_messages[4] }}</div>
            </div>

            <!-- Petal 6 — Top Left -->
            <div class="petal-zone petal-z-6" @click="revealPetal(5)">
              <div class="petal-symbol" v-if="!revealedPetals[5]">✦</div>
              <div class="petal-pill" v-else>{{ letter.petal_messages[5] }}</div>
            </div>
          </div>

          <button class="letter-btn-outline" style="margin-top: 24px;" @click="nextScreen">Read the letter →</button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 4 — The Letter ──────────────────────────────────────── -->
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
            <div class="envelope-sparkles" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="envelope-icon">💌</div>
            <div class="wax-seal">✦</div>
            <h2 class="letter-title">A letter<br><em>written just for you</em></h2>
            <div class="letter-divider"><span></span>✦<span></span></div>
            <p class="letter-sub">From someone who loves you deeply</p>
            <button class="letter-btn" @click="startLetterReveal">
              Open Letter 💌
            </button>
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
                <button class="letter-btn-outline" style="margin-top: 20px;" @click="nextScreen">
                  See memories →
                </button>
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
          </div>

          <div v-else class="no-memories">
            <p>📸</p>
            <p class="letter-sub">No memories attached</p>
          </div>

          <button class="letter-btn-outline" style="margin-top: 24px;" @click="nextScreen">View your gift →</button>
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
          <div class="letter-divider"><span></span>✦<span></span></div>

          <div class="bouquet-preview" @mousedown.stop @mouseup.stop @touchstart.stop @touchend.stop>
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
            <button v-if="letter.angle_photos && letter.angle_photos.length > 0" class="btn-360" :class="{ preparing: !angleAssetsReady }" :disabled="!angleAssetsReady" @click.stop="open360Viewer">
              <span class="rotate-mark">↻</span>
              <span v-if="angleAssetsReady">View 360</span>
              <span v-else>Preparing 360° View</span>
            </button>
            <p v-else class="letter-sub bouquet-note">Your gift is shown above. 360° view may be added soon.</p>
          </div>

          <button class="letter-btn-outline" style="margin-top: 24px;" @click="nextScreen">Continue →</button>
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
        class="letter-screen"
        :style="{ backgroundColor: screenBg('screen7') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <div class="quote-flower">🌸</div>
          <div class="letter-divider"><span></span>✦<span></span></div>
          <blockquote class="letter-quote">
            "You are loved more than you know, more than words can say, more than any gift can hold."
          </blockquote>
          <div class="letter-divider"><span></span>✦<span></span></div>
          <button class="letter-btn-outline" @click="nextScreen">Continue →</button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 8 — From Sender ─────────────────────────────── -->
      <div
        v-if="currentScreen === 7"
        class="letter-screen"
        :style="{ backgroundColor: screenBg('screen8') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <div class="sender-circle">{{ letter.sender?.charAt(0) }}</div>
          <h2 class="letter-title" style="margin-top: 20px;">From <em>{{ letter.sender }}</em></h2>
          <div class="letter-divider"><span></span>✦<span></span></div>
          <p class="letter-sub">This gift was crafted with love<br>and sent to you with all their heart</p>
          <button class="letter-btn" style="margin-top: 28px;" @click="nextScreen">Finish →</button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 9 — End ─────────────────────────────────────── -->
      <div
        v-if="currentScreen === 8"
        class="letter-screen"
        :style="{ backgroundColor: screenBg('screen9') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <div class="end-flowers">🌸🌷🌺</div>
          <h2 class="letter-title">Thank you for<br><em>being loved</em></h2>
          <div class="letter-divider"><span></span>✦<span></span></div>
          <p class="letter-sub">Keep this letter close to your heart.<br>Scan the QR anytime to revisit.</p>
          <div class="end-brand">
            <p>Crafted by</p>
            <strong>Stack Petals</strong>
          </div>
          <button class="letter-btn-outline" style="margin-top: 20px;" @click="goToScreen(0)">Read again ↺</button>
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
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400;1,600&display=swap');

/* ── Base ─────────────────────────────────────────────────────────── */
.letter-page {
  font-family: 'Lora', serif;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
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
  --screen-pad-bottom-base: clamp(76px, 12dvh, 92px);
  --screen-pad-bottom: calc(var(--screen-pad-bottom-base) + var(--safe-bottom));
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

.letter-screen:has(.bouquet-preview) {
  overflow: hidden;
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
  --screen-pad-bottom-base: clamp(70px, 10dvh, 88px);
}

.memories-screen,
.bouquet-screen {
  --screen-pad-top: clamp(22px, 4.5dvh, 44px);
  --screen-pad-bottom-base: clamp(70px, 10dvh, 88px);
}

/* ── Content ──────────────────────────────────────────────────────── */
.screen-content {
  width: 100%;
  max-width: 480px;
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

.memories-screen .letter-logo,
.bouquet-screen .letter-logo {
  flex: 0 0 auto;
  margin-bottom: clamp(8px, 1.8dvh, 18px);
}

.memories-screen .letter-title,
.bouquet-screen .letter-title {
  flex: 0 0 auto;
  font-size: clamp(26px, 5.4dvh, 32px);
  line-height: 1.16;
  margin-bottom: clamp(4px, 1dvh, 10px);
}

.memories-screen .letter-divider,
.bouquet-screen .letter-divider {
  flex: 0 0 auto;
  margin: clamp(8px, 1.6dvh, 14px) auto;
}

.memories-screen .memory-slideshow,
.bouquet-screen .bouquet-preview {
  align-self: stretch;
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

/* ── Typography ───────────────────────────────────────────────────── */
.letter-logo {
  font-family: 'Lora', serif;
  font-size: clamp(11px, min(3vw, 2dvh), 13px);
  color: #C48090;
  letter-spacing: clamp(2px, 0.7vw, 3px);
  text-transform: uppercase;
  margin-bottom: clamp(10px, 3dvh, 32px);
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
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  max-width: min(100%, 300px);
  min-height: clamp(40px, 6dvh, 46px);
  background: #D4687A;
  color: white;
  border: none;
  border-radius: 28px;
  padding: clamp(10px, 1.8dvh, 14px) clamp(24px, 8vw, 40px);
  font-family: 'Lora', serif;
  font-size: clamp(13px, min(3.8vw, 2.4dvh), 15px);
  line-height: 1.2;
  text-align: center;
  white-space: normal;
  cursor: pointer;
  margin-top: var(--action-space);
  letter-spacing: 0.5px;
  transition: all 0.2s;
}

.letter-btn:hover {
  background: #C4586A;
  transform: translateY(-1px);
}

.letter-btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  max-width: min(100%, 300px);
  min-height: clamp(38px, 5.6dvh, 44px);
  background: transparent;
  color: #D4687A;
  border: 1px solid #E8B4C0;
  border-radius: 28px;
  padding: clamp(9px, 1.6dvh, 12px) clamp(22px, 7vw, 32px);
  font-family: 'Lora', serif;
  font-size: clamp(12px, min(3.6vw, 2.2dvh), 14px);
  line-height: 1.2;
  text-align: center;
  white-space: normal;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: all 0.2s;
}

.letter-btn-outline:hover {
  background: rgba(212, 104, 122, 0.08);
}

/* ── Screen Dots ──────────────────────────────────────────────────── */
.screen-content.center > .letter-btn,
.screen-content.center > .letter-btn-outline,
.letter-reveal-content .letter-btn-outline {
  margin-top: var(--action-space) !important;
}

.screen-dots {
  position: absolute;
  bottom: calc(clamp(12px, 2.6dvh, 22px) + var(--safe-bottom));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 100;
}

.screen-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #E8B4C0;
  cursor: pointer;
  transition: all 0.2s;
}

.screen-dots span.active {
  background: #D4687A;
  width: 18px;
  border-radius: 4px;
}

/* ── Flower ───────────────────────────────────────────────────────── */
.blooming-flower {
  font-size: clamp(64px, min(22vw, 15dvh), 96px);
  margin-bottom: clamp(12px, 3dvh, 28px);
  animation: bloom 2s ease-in-out infinite alternate;
}

@keyframes bloom {
  from { transform: scale(0.9); }
  to   { transform: scale(1.1); }
}

/* ── Petals ───────────────────────────────────────────────────────── */
.petals-flower {
  position: relative;
  width: min(320px, 78vw, 46dvh);
  height: min(320px, 78vw, 46dvh);
  margin: 0 auto;
}

.flower-svg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.petal-zone {
  position: absolute;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}

.petal-z-1 { top: 0;    left: 50%; transform: translateX(-50%); }
.petal-z-2 { top: 18%;  right: 4%; }
.petal-z-3 { bottom: 18%; right: 4%; }
.petal-z-4 { bottom: 0; left: 50%; transform: translateX(-50%); }
.petal-z-5 { bottom: 18%; left: 4%; }
.petal-z-6 { top: 18%;  left: 4%; }

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

/* ── Sender Footer Transition ─────────────────────────────────────── */
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

/* ── Memories ─────────────────────────────────────────────────────── */
.memory-slideshow {
  width: 100%;
  max-width: min(360px, 100%, 44dvh);
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.memory-frame {
  position: relative;
  width: min(100%, 40dvh, 360px);
  max-height: min(360px, 40dvh);
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
  margin-top: clamp(6px, 1.2dvh, 12px);
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

/* ── Bouquet Preview ──────────────────────────────────────────────── */
.bouquet-preview {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto auto;
  align-items: center;
  justify-items: center;
  gap: clamp(6px, 1dvh, 10px);
  width: 100%;
  height: 100%;
  max-width: min(360px, 100%, 38dvh);
  max-height: 100%;
  flex-shrink: 1;
  min-height: 0;
}

.bouquet-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, 35dvh, 330px);
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
  padding: clamp(7px, 1.1dvh, 9px) 18px;
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

.btn-360 {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  min-width: 166px;
  max-width: min(100%, 240px);
  line-height: 1.2;
  white-space: nowrap;
  margin-top: 0;
  padding: 10px 20px;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,240,244,0.76));
  color: #D4687A;
  border: 1.5px solid #E8B4C0;
  border-radius: 28px;
  font-family: 'Lora', serif;
  font-size: 14px;
  cursor: pointer;
  letter-spacing: 0.5px;
  box-shadow: 0 10px 22px rgba(212, 104, 122, 0.12);
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
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
  transform: translateY(-1px);
}

.btn-360:disabled,
.btn-360.preparing {
  cursor: wait;
  color: #B08090;
  border-color: rgba(232, 180, 192, 0.62);
  background:
    linear-gradient(135deg, rgba(255,255,255,0.78), rgba(255,240,244,0.58));
  box-shadow: 0 8px 18px rgba(212, 104, 122, 0.08);
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


/* ── Quote ────────────────────────────────────────────────────────── */
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

/* ── Loading / Not Found ──────────────────────────────────────────── */
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

.loading-flower {
  font-size: 72px;
  margin-bottom: 24px;
  animation: bloom 2s ease-in-out infinite alternate;
}

.loading-bloom {
  position: relative;
  width: 96px;
  height: 96px;
  margin-bottom: 24px;
  filter: drop-shadow(0 16px 22px rgba(212, 104, 122, 0.16));
  animation: loadingBloomFloat 2.8s ease-in-out infinite;
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
  opacity: 0.9;
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
  background: #F8B8C4;
  transform: translate(-50%, -50%);
  box-shadow: inset 0 1px 4px rgba(122,58,74,0.12);
}

.letter-loading p,
.letter-not-found p {
  font-style: italic;
  color: #B08090;
}

.loading-message {
  width: min(320px, 82vw);
  min-height: 44px;
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

/* ── Desktop ────────────────────────────────────────────────────── */
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
  .memory-slideshow { max-width: min(420px, 100%, 44dvh); }
  .memory-frame { width: min(100%, 40dvh, 420px); }
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
    --screen-pad-bottom-base: 56px;
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
    --screen-pad-bottom-base: 48px;
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

  .letter-divider {
    width: min(78%, 320px);
  }

  .letter-btn,
  .letter-btn-outline,
  .btn-360 {
    max-width: min(100%, 260px);
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
    max-width: min(340px, 100%, 38dvh);
  }

  .memory-frame {
    max-height: min(340px, 38dvh);
  }

  .bouquet-preview {
    max-width: min(300px, 100%, 34dvh);
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
    bottom: 14px;
  }
}

@media (max-height: 620px) {
  .letter-screen {
    padding-top: 18px;
    padding-bottom: 54px;
  }

  .letter-message-screen {
    padding-top: 14px;
    padding-bottom: 50px;
  }

  .memories-screen,
  .bouquet-screen {
    padding-top: 14px;
    padding-bottom: 50px;
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
    max-width: min(300px, 100%, 32dvh);
  }

  .memory-frame {
    max-height: min(300px, 32dvh);
  }

  .bouquet-preview {
    max-width: min(260px, 100%, 30dvh);
  }

  .bouquet-screen .letter-title,
  .memories-screen .letter-title {
    font-size: clamp(22px, 4.8dvh, 28px);
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
  }

  .memories-screen .screen-content,
  .bouquet-screen .screen-content {
    padding: 0 clamp(16px, 5vw, 24px);
  }

  .memories-screen .letter-title,
  .bouquet-screen .letter-title {
    font-size: clamp(25px, 8vw, 32px);
  }

  .memory-slideshow {
    max-width: min(100%, 42dvh);
  }

  .memory-frame {
    max-height: 42dvh;
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
}

/* ── Petal Symbol ─────────────────────────────────────────────────── */
.petal-symbol {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid #F4C0CE;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #C48090;
  cursor: pointer;
  transition: all 0.3s ease;
}

.petal-symbol:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(1.1);
}

/* ── Petal Pill ───────────────────────────────────────────────────── */
.petal-pill {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #F4C0CE;
  border-radius: 20px;
  padding: 6px 10px;
  font-size: 10px;
  font-family: 'Lora', serif;
  color: #9A5060;
  text-align: center;
  font-style: italic;
  max-width: 80px;
  line-height: 1.4;
  cursor: pointer;
  animation: pillReveal 0.4s ease;
  box-shadow: 0 2px 8px rgba(212, 104, 122, 0.15);
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
}

.letter-reveal-wrap.opening .envelope-icon {
  animation: envelopeOpen 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.letter-reveal-wrap.opening .wax-seal {
  animation: sealRelease 0.72s ease both;
}

.letter-reveal-wrap.opening .envelope-sparkles span {
  animation-play-state: running;
}

.envelope-sparkles {
  position: absolute;
  inset: -16px 0 auto;
  height: 120px;
  pointer-events: none;
}

.envelope-sparkles span {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.96), rgba(244, 192, 206, 0.7));
  box-shadow: 0 0 14px rgba(255, 255, 255, 0.9);
  opacity: 0;
  animation: envelopeSpark 0.9s ease-out paused;
}

.envelope-sparkles span:nth-child(1) { left: 28%; top: 54%; animation-delay: 0.05s; }
.envelope-sparkles span:nth-child(2) { left: 42%; top: 24%; animation-delay: 0.14s; }
.envelope-sparkles span:nth-child(3) { right: 32%; top: 42%; animation-delay: 0.2s; }
.envelope-sparkles span:nth-child(4) { right: 22%; top: 64%; animation-delay: 0.28s; }

.envelope-icon {
  font-size: 72px;
  margin-bottom: 24px;
  animation: envelopePulse 2s ease-in-out infinite;
}

@keyframes envelopePulse {
  0%, 100% { transform: scale(1) rotate(-3deg); }
  50%       { transform: scale(1.08) rotate(3deg); }
}

@keyframes envelopeOpen {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(-3deg);
    filter: drop-shadow(0 0 0 rgba(255,255,255,0));
  }
  48% {
    opacity: 1;
    transform: translateY(-4px) scale(1.12) rotate(2deg);
    filter: drop-shadow(0 12px 18px rgba(212, 104, 122, 0.24));
  }
  100% {
    opacity: 0;
    transform: translateY(-34px) scale(1.22) rotate(8deg);
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
  font-size: 20px;
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
</style>
