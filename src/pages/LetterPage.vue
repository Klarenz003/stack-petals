<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/supabaseClient'

// ── Types ──────────────────────────────────────────────────────────
interface Letter {
  id: string
  recipient: string
  sender: string
  message: string
  petal_messages: string[]
  memories: string[]
  angle_photos: string[]
  backgrounds: Record<string, string | null>
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

// ── Screens ────────────────────────────────────────────────────────
const totalScreens = 9

// ── Load Letter ────────────────────────────────────────────────────
async function loadLetter() {
  const { data, error } = await supabase
    .from('letters')
    .select('*')
    .eq('id', route.params.id)
    .eq('published', true)
    .single()

  if (error || !data) {
    notFound.value = true
    loading.value = false
    return
  }

  letter.value = data
  loading.value = false
  startMemoryTimer()
}

// ── Navigation ─────────────────────────────────────────────────────
function nextScreen() {
  if (currentScreen.value < totalScreens - 1) currentScreen.value++
}

function prevScreen() {
  if (currentScreen.value > 0) currentScreen.value--
}

function goToScreen(n: number) {
  currentScreen.value = n
}

// ── Touch / Swipe ──────────────────────────────────────────────────
function onTouchStart(e: TouchEvent) {
  dragStartX.value = e.touches[0].clientX
}

function onTouchEnd(e: TouchEvent) {
  const diff = dragStartX.value - e.changedTouches[0].clientX
  if (Math.abs(diff) > 50) {
    if (diff > 0) nextScreen()
    else prevScreen()
  }
}

// ── Mouse drag (desktop) ───────────────────────────────────────────
function onMouseDown(e: MouseEvent) {
  isDragging.value = true
  dragStartX.value = e.clientX
}

function onMouseUp(e: MouseEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  const diff = dragStartX.value - e.clientX
  if (Math.abs(diff) > 50) {
    if (diff > 0) nextScreen()
    else prevScreen()
  }
}

// ── Petal Reveal ───────────────────────────────────────────────────
function revealPetal(i: number) {
  revealedPetals.value[i] = !revealedPetals.value[i]
}

// ── Memory Slideshow ───────────────────────────────────────────────
function startMemoryTimer() {
  memoryTimer.value = window.setInterval(() => {
    if (letter.value && letter.value.memories.length > 1) {
      currentMemory.value = (currentMemory.value + 1) % letter.value.memories.length
    }
  }, 3000)
}

// ── 360° Drag ─────────────────────────────────────────────────────
let angleStartX = 0
let isDragging360 = false

function on360Start(e: MouseEvent | TouchEvent) {
  isDragging360 = true
  angleStartX = 'touches' in e ? e.touches[0].clientX : e.clientX
}

function on360Move(e: MouseEvent | TouchEvent) {
  if (!isDragging360 || !letter.value) return
  const x = 'touches' in e ? e.touches[0].clientX : e.clientX
  const diff = angleStartX - x
  if (Math.abs(diff) > 15) {
    const total = letter.value.angle_photos.length
    if (diff > 0) {
      currentAngle.value = (currentAngle.value + 1) % total
    } else {
      currentAngle.value = (currentAngle.value - 1 + total) % total
    }
    angleStartX = x
  }
}

function on360End() {
  isDragging360 = false
}

// ── Background ─────────────────────────────────────────────────────
function screenBg(screenKey: string): string {
  const custom = letter.value?.backgrounds?.[screenKey]
  if (custom) return `url(${custom})`
  const gradients: Record<string, string> = {
    screen1: 'linear-gradient(160deg, #FFF0F3 0%, #FFE4EC 100%)',
    screen2: 'linear-gradient(160deg, #FFF5F7 0%, #FFEDF2 100%)',
    screen3: 'linear-gradient(160deg, #FFF0F3 0%, #FFE4EC 100%)',
    screen4: 'linear-gradient(160deg, #FFF5F7 0%, #FFEDF2 100%)',
    screen5: 'linear-gradient(160deg, #FFF0F3 0%, #FFE4EC 100%)',
    screen6: 'linear-gradient(160deg, #FFF5F7 0%, #FFEDF2 100%)',
    screen7: 'linear-gradient(160deg, #FFF0F3 0%, #FFE4EC 100%)',
    screen8: 'linear-gradient(160deg, #FFF5F7 0%, #FFEDF2 100%)',
    screen9: 'linear-gradient(160deg, #FFF0F3 0%, #FFE4EC 100%)',
  }
  return gradients[screenKey] || gradients.screen1
}

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(() => loadLetter())
onUnmounted(() => {
  if (memoryTimer.value) clearInterval(memoryTimer.value)
})
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
      <div class="loading-flower">🌸</div>
      <p>Opening your letter...</p>
    </div>

    <!-- Not Found -->
    <div v-else-if="notFound" class="letter-not-found">
      <div class="loading-flower">💌</div>
      <h2>Letter not found</h2>
      <p>This letter may not be published yet or the link is invalid.</p>
    </div>

    <!-- Letter Screens -->
    <div v-else-if="letter" class="letter-screens">

      <!-- ── SCREEN 1 — Welcome ─────────────────────────────────── -->
      <div
        v-if="currentScreen === 0"
        class="letter-screen"
        :style="{ background: screenBg('screen1') }"
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
        :style="{ background: screenBg('screen2') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <div class="bloom-animation">
            <div class="bloom-circle bloom-1">🌸</div>
            <div class="bloom-circle bloom-2">🌺</div>
            <div class="bloom-circle bloom-3">🌷</div>
          </div>
          <h2 class="letter-title">Something special<br><em>is blooming for you...</em></h2>
          <p class="letter-sub">Please wait a moment</p>
          <button class="letter-btn-outline" @click="nextScreen">Continue →</button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 3 — Petal Messages ─────────────────────────── -->
      <div
        v-if="currentScreen === 2"
        class="letter-screen"
        :style="{ background: screenBg('screen3') }"
      >
        <div class="screen-content">
          <div class="letter-logo">Stack Petals</div>
          <h2 class="letter-title" style="text-align:center; margin-bottom: 8px;">Your petals</h2>
          <p class="letter-sub" style="text-align:center; margin-bottom: 24px;">Tap a petal to reveal your message</p>

          <div class="petals-flower">
            <!-- Flower SVG background -->
            <svg class="flower-svg" viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="140" cy="60"  rx="32" ry="48" fill="#F4C0CE" opacity="0.7"/>
              <ellipse cx="210" cy="95"  rx="32" ry="48" fill="#F0B4C4" opacity="0.7" transform="rotate(60 210 95)"/>
              <ellipse cx="210" cy="185" rx="32" ry="48" fill="#F4C0CE" opacity="0.7" transform="rotate(120 210 185)"/>
              <ellipse cx="140" cy="220" rx="32" ry="48" fill="#F0B4C4" opacity="0.7"/>
              <ellipse cx="70"  cy="185" rx="32" ry="48" fill="#F4C0CE" opacity="0.7" transform="rotate(240 70 185)"/>
              <ellipse cx="70"  cy="95"  rx="32" ry="48" fill="#F0B4C4" opacity="0.7" transform="rotate(300 70 95)"/>
              <circle cx="140" cy="140" r="30" fill="#FAD4A8"/>
              <circle cx="140" cy="140" r="22" fill="#FFE4B5"/>
            </svg>

            <!-- Petal tap zones -->
            <div class="petal-zone petal-z-1" @click="revealPetal(0)">
              <div class="petal-bubble" :class="{ revealed: revealedPetals[0] }">
                <span v-if="!revealedPetals[0]">✦</span>
                <span v-else>{{ letter.petal_messages[0] }}</span>
              </div>
            </div>
            <div class="petal-zone petal-z-2" @click="revealPetal(1)">
              <div class="petal-bubble" :class="{ revealed: revealedPetals[1] }">
                <span v-if="!revealedPetals[1]">✦</span>
                <span v-else>{{ letter.petal_messages[1] }}</span>
              </div>
            </div>
            <div class="petal-zone petal-z-3" @click="revealPetal(2)">
              <div class="petal-bubble" :class="{ revealed: revealedPetals[2] }">
                <span v-if="!revealedPetals[2]">✦</span>
                <span v-else>{{ letter.petal_messages[2] }}</span>
              </div>
            </div>
            <div class="petal-zone petal-z-4" @click="revealPetal(3)">
              <div class="petal-bubble" :class="{ revealed: revealedPetals[3] }">
                <span v-if="!revealedPetals[3]">✦</span>
                <span v-else>{{ letter.petal_messages[3] }}</span>
              </div>
            </div>
            <div class="petal-zone petal-z-5" @click="revealPetal(4)">
              <div class="petal-bubble" :class="{ revealed: revealedPetals[4] }">
                <span v-if="!revealedPetals[4]">✦</span>
                <span v-else>{{ letter.petal_messages[4] }}</span>
              </div>
            </div>
            <div class="petal-zone petal-z-6" @click="revealPetal(5)">
              <div class="petal-bubble" :class="{ revealed: revealedPetals[5] }">
                <span v-if="!revealedPetals[5]">✦</span>
                <span v-else>{{ letter.petal_messages[5] }}</span>
              </div>
            </div>
          </div>

          <button class="letter-btn-outline" style="margin-top: 24px;" @click="nextScreen">Read the letter →</button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 4 — The Letter ──────────────────────────────── -->
      <div
        v-if="currentScreen === 3"
        class="letter-screen"
        :style="{ background: screenBg('screen4') }"
      >
        <div class="screen-content">
          <div class="letter-logo">Stack Petals</div>
          <div class="letter-heart">🤍</div>
          <h2 class="letter-dear">Dear <em>{{ letter.recipient }},</em></h2>
          <div class="letter-divider"><span></span>✦<span></span></div>
          <div class="letter-message-box">
            <p class="letter-message-text">{{ letter.message }}</p>
          </div>
          <div class="letter-divider"><span></span>✦<span></span></div>
          <p class="letter-from">— With love, {{ letter.sender }}</p>
          <button class="letter-btn-outline" style="margin-top: 20px;" @click="nextScreen">See memories →</button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 5 — Memories ────────────────────────────────── -->
      <div
        v-if="currentScreen === 4"
        class="letter-screen"
        :style="{ background: screenBg('screen5') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <h2 class="letter-title">Some of my favorite<br><em>memories with you</em></h2>
          <div class="letter-divider"><span></span>✦<span></span></div>

          <div v-if="letter.memories && letter.memories.length > 0" class="memory-slideshow">
            <div class="memory-frame">
              <img
                v-for="(mem, i) in letter.memories"
                :key="i"
                :src="mem"
                :class="{ active: i === currentMemory }"
                class="memory-slide"
                :alt="`Memory ${i + 1}`"
              />
            </div>
            <div class="memory-dots">
              <span
                v-for="(_, i) in letter.memories"
                :key="i"
                :class="{ active: i === currentMemory }"
                @click="currentMemory = i"
              ></span>
            </div>
          </div>

          <div v-else class="no-memories">
            <p>📸</p>
            <p class="letter-sub">No memories attached</p>
          </div>

          <button class="letter-btn-outline" style="margin-top: 24px;" @click="nextScreen">View your bouquet →</button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 6 — 360° View ───────────────────────────────── -->
      <div
        v-if="currentScreen === 5"
        class="letter-screen"
        :style="{ background: screenBg('screen6') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <h2 class="letter-title">Your bouquet<br><em>in 360°</em></h2>
          <p class="letter-sub" style="margin-bottom: 20px;">Drag left or right to rotate</p>

          <div
            v-if="letter.angle_photos && letter.angle_photos.length > 0"
            class="viewer-360"
            @mousedown="on360Start"
            @mousemove="on360Move"
            @mouseup="on360End"
            @mouseleave="on360End"
            @touchstart="on360Start"
            @touchmove="on360Move"
            @touchend="on360End"
          >
            <img
              :src="letter.angle_photos[currentAngle]"
              :alt="`Angle ${currentAngle + 1}`"
              class="angle-photo"
              draggable="false"
            />
            <div class="viewer-hint">
              <span>←</span> drag to rotate <span>→</span>
            </div>
          </div>

          <div v-else class="no-photos">
            <p>🌸</p>
            <p class="letter-sub">360° view coming soon</p>
          </div>

          <button class="letter-btn-outline" style="margin-top: 24px;" @click="nextScreen">Continue →</button>
        </div>
        <div class="screen-dots">
          <span v-for="i in totalScreens" :key="i" :class="{ active: currentScreen === i - 1 }" @click="goToScreen(i - 1)"></span>
        </div>
      </div>

      <!-- ── SCREEN 7 — Final Quote ─────────────────────────────── -->
      <div
        v-if="currentScreen === 6"
        class="letter-screen"
        :style="{ background: screenBg('screen7') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <div class="quote-flower">🌸</div>
          <div class="letter-divider"><span></span>✦<span></span></div>
          <blockquote class="letter-quote">
            "You are loved more than you know, more than words can say, more than flowers can hold."
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
        :style="{ background: screenBg('screen8') }"
      >
        <div class="screen-content center">
          <div class="letter-logo">Stack Petals</div>
          <div class="sender-circle">{{ letter.sender?.charAt(0) }}</div>
          <h2 class="letter-title" style="margin-top: 20px;">From <em>{{ letter.sender }}</em></h2>
          <div class="letter-divider"><span></span>✦<span></span></div>
          <p class="letter-sub">This bouquet was crafted with love<br>and sent to you with all their heart</p>
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
        :style="{ background: screenBg('screen9') }"
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
  </div>
</template>

