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

// ── Touch / Swipe (page navigation) ───────────────────────────────
let swipeStartX = 0
let swipeStartY = 0
let isSwiping = false

function onTouchStart(e: TouchEvent) {
  // Don't start page swipe if touching the 360 viewer
  const target = e.target as HTMLElement
  if (target.closest('.viewer-360')) return
  swipeStartX = e.touches[0].clientX
  swipeStartY = e.touches[0].clientY
  isSwiping = true
}

function onTouchEnd(e: TouchEvent) {
  if (!isSwiping) return
  isSwiping = false
  const diffX = swipeStartX - e.changedTouches[0].clientX
  const diffY = Math.abs(swipeStartY - e.changedTouches[0].clientY)
  // Only swipe page if horizontal movement is dominant and large enough
  if (Math.abs(diffX) > 80 && Math.abs(diffX) > diffY * 2) {
    if (diffX > 0) nextScreen()
    else prevScreen()
  }
}

function onMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('.viewer-360')) return
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
  e.stopPropagation() // ← prevents triggering page swipe
  const x = 'touches' in e ? e.touches[0].clientX : e.clientX
  const diff = angleStartX - x
  if (Math.abs(diff) > 5) { // ← lower threshold = faster response
    const total = letter.value.angle_photos.length
    if (diff > 0) {
      currentAngle.value = (currentAngle.value + 1) % total
    } else {
      currentAngle.value = (currentAngle.value - 1 + total) % total
    }
    angleStartX = x // ← reset each step for continuous smooth drag
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
              @mousedown.stop="on360Start"
              @mousemove.stop="on360Move"
              @mouseup.stop="on360End"
              @mouseleave="on360End"
              @touchstart.stop="on360Start"
              @touchmove.stop="on360Move"
              @touchend.stop="on360End"
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

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400;1,600&display=swap');

/* ── Base ─────────────────────────────────────────────────────────── */
.letter-page {
  font-family: 'Lora', serif;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  user-select: none;
}

.letter-screens {
  width: 100%;
  height: 100%;
}

.letter-screen {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow-y: auto;
  padding: 40px 0 60px;
}

/* ── Content ──────────────────────────────────────────────────────── */
.screen-content {
  width: 100%;
  max-width: 420px;
  padding: 0 28px;
}

.screen-content.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* ── Typography ───────────────────────────────────────────────────── */
.letter-logo {
  font-family: 'Lora', serif;
  font-size: 11px;
  color: #C48090;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 28px;
}

.letter-headline {
  font-family: 'Lora', serif;
  font-size: 32px;
  font-weight: 400;
  color: #7A3A4A;
  text-align: center;
  line-height: 1.3;
  margin: 0 0 16px;
}

.letter-headline em {
  color: #D4687A;
  font-style: italic;
}

.letter-title {
  font-family: 'Lora', serif;
  font-size: 24px;
  font-weight: 400;
  color: #7A3A4A;
  line-height: 1.4;
  margin: 0 0 8px;
}

.letter-title em {
  color: #D4687A;
  font-style: italic;
}

.letter-sub {
  font-family: 'Lora', serif;
  font-size: 13px;
  color: #B08090;
  font-style: italic;
  line-height: 1.7;
  margin: 0;
}

.letter-dear {
  font-family: 'Lora', serif;
  font-size: 22px;
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
  font-size: 14px;
  color: #C48090;
  letter-spacing: 1px;
  margin: 0;
}

.letter-heart {
  font-size: 32px;
  margin-bottom: 16px;
}

/* ── Divider ──────────────────────────────────────────────────────── */
.letter-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px auto;
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
  background: #D4687A;
  color: white;
  border: none;
  border-radius: 28px;
  padding: 12px 32px;
  font-family: 'Lora', serif;
  font-size: 14px;
  cursor: pointer;
  margin-top: 24px;
  letter-spacing: 0.5px;
  transition: all 0.2s;
}

.letter-btn:hover {
  background: #C4586A;
  transform: translateY(-1px);
}

.letter-btn-outline {
  background: transparent;
  color: #D4687A;
  border: 1px solid #E8B4C0;
  border-radius: 28px;
  padding: 10px 28px;
  font-family: 'Lora', serif;
  font-size: 13px;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: all 0.2s;
}

.letter-btn-outline:hover {
  background: rgba(212, 104, 122, 0.08);
}

/* ── Screen Dots ──────────────────────────────────────────────────── */
.screen-dots {
  position: fixed;
  bottom: 20px;
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
  font-size: 72px;
  margin-bottom: 24px;
  animation: bloom 2s ease-in-out infinite alternate;
}

@keyframes bloom {
  from { transform: scale(0.9); }
  to   { transform: scale(1.1); }
}

.bloom-animation {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 28px;
}

.bloom-circle {
  position: absolute;
  font-size: 48px;
  animation: float 3s ease-in-out infinite;
}

.bloom-1 { top: 0; left: 50%; transform: translateX(-50%); animation-delay: 0s; }
.bloom-2 { top: 50%; left: 0; transform: translateY(-50%); animation-delay: 0.5s; font-size: 36px; opacity: 0.7; }
.bloom-3 { top: 50%; right: 0; transform: translateY(-50%); animation-delay: 1s; font-size: 36px; opacity: 0.7; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}

/* ── Petals ───────────────────────────────────────────────────────── */
.petals-flower {
  position: relative;
  width: 280px;
  height: 280px;
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

.petal-bubble {
  background: rgba(255,255,255,0.7);
  border: 1px solid #F4C0CE;
  border-radius: 12px;
  padding: 6px 8px;
  font-size: 10px;
  font-family: 'Lora', serif;
  color: #9A5060;
  text-align: center;
  font-style: italic;
  max-width: 72px;
  line-height: 1.4;
  transition: all 0.3s;
  min-width: 28px;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.petal-bubble.revealed {
  background: #FFF0F3;
  border-color: #D4687A;
  color: #7A3A4A;
}

/* ── Letter Message ───────────────────────────────────────────────── */
.letter-message-box {
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid #F0C4CF;
  border-radius: 16px;
  padding: 20px;
  width: 100%;
}

.letter-message-text {
  font-family: 'Lora', serif;
  font-size: 14px;
  color: #7A4A54;
  line-height: 1.9;
  font-style: italic;
  text-align: center;
  margin: 0;
}

/* ── Memories ─────────────────────────────────────────────────────── */
.memory-slideshow {
  width: 100%;
  max-width: 300px;
}

.memory-frame {
  position: relative;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  aspect-ratio: 1;
  background: #F9E8EE;
}

.memory-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.memory-slide.active {
  opacity: 1;
}

.memory-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
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

/* ── 360° Viewer ──────────────────────────────────────────────────── */
.viewer-360 {
  width: 100%;
  max-width: 300px;
  position: relative;
  cursor: grab;
}

.viewer-360:active {
  cursor: grabbing;
}

.angle-photo {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  pointer-events: none;
  border-radius: 16px;
}

.viewer-hint {
  text-align: center;
  font-family: 'Lora', serif;
  font-size: 12px;
  color: #B08090;
  font-style: italic;
  margin-top: 8px;
}

/* ── Quote ────────────────────────────────────────────────────────── */
.quote-flower {
  font-size: 56px;
  margin-bottom: 16px;
}

.letter-quote {
  font-family: 'Lora', serif;
  font-size: 18px;
  color: #7A3A4A;
  font-style: italic;
  line-height: 1.7;
  text-align: center;
  margin: 0;
  padding: 0 12px;
}

/* ── Sender ───────────────────────────────────────────────────────── */
.sender-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #F4C0CE, #D4687A);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Lora', serif;
  font-size: 28px;
  color: white;
  font-weight: 600;
}

/* ── End Screen ───────────────────────────────────────────────────── */
.end-flowers {
  font-size: 40px;
  margin-bottom: 20px;
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
  font-size: 18px;
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
  font-size: 56px;
  margin-bottom: 20px;
  animation: bloom 2s ease-in-out infinite alternate;
}

.letter-loading p,
.letter-not-found p {
  font-style: italic;
  color: #B08090;
}

.angle-photo {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  pointer-events: none;
  border-radius: 16px;
  transition: opacity 0.05s ease; /* ultra fast = smooth feel */
}
</style>