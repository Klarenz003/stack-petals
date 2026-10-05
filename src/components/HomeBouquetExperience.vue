<script setup lang="ts">
import { PhSparkle, PhEnvelopeOpen } from '@phosphor-icons/vue'
import HomeKeepsakeDemo from '@/components/HomeKeepsakeDemo.vue'

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  clampToDocument,
  isTapGesture,
  createScannerIdleReset,
} from '@/utils/homeBouquetInteraction'

type ScanState = 'idle' | 'scanning' | 'detected' | 'revealed'

const scene = ref<HTMLElement | null>(null)
const phone = ref<HTMLElement | null>(null)
const phoneHome = ref<HTMLElement | null>(null)
const scannerWindow = ref<HTMLElement | null>(null)
const qrHotspot = ref<HTMLElement | null>(null)
const scanState = ref<ScanState>('idle')
const demoOpen = ref(false)
const hasExplored = ref(false)
const hasDragged = ref(false)
const isDragging = ref(false)
const isReturning = ref(false)
const isInView = ref(true)
const isAtHome = ref(true)
const isPhonePositioned = ref(false)
const position = reactive({ x: 0, y: 0 })
const homePosition = reactive({ x: 0, y: 0 })
const drag = reactive({ pointerId: -1, offsetX: 0, offsetY: 0, startX: 0, startY: 0 })
let scanTimer: number | undefined
let detectedTimer: number | undefined
let returnTimer: number | undefined
let returnTransitionTimer: number | undefined
let layoutFrame: number | undefined
let resizeFrame: number | undefined
let resizeObserver: ResizeObserver | undefined
let intersectionObserver: IntersectionObserver | undefined
let isDisposed = false
const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'wheel', 'touchstart'] as const
const idleReset = createScannerIdleReset(() => {
  if (isDisposed || demoOpen.value || isDragging.value) return
  clearScanTimers()
  clearReturnTimers()
  scanState.value = 'idle'
  hasDragged.value = false
  hasExplored.value = false
  returnPhoneHome()
})
function refreshIdleReset() {
  if (scanState.value === 'revealed' && !demoOpen.value && !isDragging.value) idleReset.restart()
  else idleReset.cancel()
}
watch([scanState, demoOpen, isDragging], refreshIdleReset)

const phoneStyle = computed(() => ({
  transform: isPhonePositioned.value
    ? `translate3d(${position.x}px, ${position.y}px, 0)`
    : 'translate3d(-200vw, -200vh, 0)',
}))
const phoneAriaLabel = computed(() => scanState.value === 'revealed'
  ? 'Keepsake unlocked. Open the sample recipient experience.'
  : 'QR scanner phone. Drag over the bouquet QR tag to scan. Use arrow keys to move the scanner when focused.')

function clearScanTimers() {
  window.clearTimeout(scanTimer)
  window.clearTimeout(detectedTimer)
  scanTimer = undefined
  detectedTimer = undefined
}

function clearReturnTimers() {
  window.clearTimeout(returnTimer)
  window.clearTimeout(returnTransitionTimer)
  returnTimer = undefined
  returnTransitionTimer = undefined
}

function clampPosition(x: number, y: number) {
  if (!phone.value || !scene.value) return { x, y }

  return clampToDocument(
    { x, y },
    { width: phone.value.offsetWidth, height: phone.value.offsetHeight },
    {
      width: scene.value.clientWidth,
      height: scene.value.clientHeight,
    },
    0,
  )
}

function setStartPosition(movePhone = !hasDragged.value) {
  if (!scene.value || !phone.value || !phoneHome.value) return
  // Offset coordinates stay correct while the hero's entrance animation scales it.
  const dock = phoneHome.value.parentElement
  if (!dock) return
  const next = clampPosition(dock.offsetLeft + phoneHome.value.offsetLeft, dock.offsetTop + phoneHome.value.offsetTop)
  Object.assign(homePosition, next)
  if (movePhone) Object.assign(position, next)
}

function returnPhoneHome() {
  if (isDragging.value) return
  isReturning.value = true
  isAtHome.value = true
  Object.assign(position, homePosition)
  returnTransitionTimer = window.setTimeout(() => {
    isReturning.value = false
    returnTransitionTimer = undefined
  }, 850)
}

function scheduleReturnHome() {
  window.clearTimeout(returnTimer)
  returnTimer = window.setTimeout(returnPhoneHome, 2000)
}

function intersectionRatio(a: DOMRect, b: DOMRect) {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
  return width * height / Math.max(1, Math.min(a.width * a.height, b.width * b.height))
}

function cancelPendingScan() {
  if (scanState.value !== 'scanning') return
  clearScanTimers()
  scanState.value = 'idle'
}

function completeScan() {
  scanState.value = 'detected'
  detectedTimer = window.setTimeout(() => {
    scanState.value = 'revealed'
    detectedTimer = undefined
  }, 840)
}

function openSurprise() {
  if (scanState.value !== 'revealed') return
  demoOpen.value = true
  hasExplored.value = true
}

function moveScannerWithKeyboard(event: KeyboardEvent) {
  const directions: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  const direction = directions[event.key]
  if (!direction || scanState.value === 'revealed') return
  event.preventDefault()
  clearReturnTimers()
  isReturning.value = false
  hasDragged.value = true
  isAtHome.value = false
  const distance = event.shiftKey ? 30 : 10
  Object.assign(position, clampPosition(position.x + direction[0] * distance, position.y + direction[1] * distance))
  nextTick(checkScannerOverlap)
}

function checkScannerOverlap() {
  if (!scannerWindow.value || !qrHotspot.value || scanState.value === 'revealed') return
  const ratio = intersectionRatio(scannerWindow.value.getBoundingClientRect(), qrHotspot.value.getBoundingClientRect())
  if (ratio >= 0.34) {
    if (scanState.value === 'idle') {
      clearScanTimers()
      scanState.value = 'scanning'
      scanTimer = window.setTimeout(completeScan, 1250)
    }
  } else {
    cancelPendingScan()
  }
}

function onPointerDown(event: PointerEvent) {
  if (!phone.value || !scene.value) return
  event.preventDefault()
  clearReturnTimers()
  isReturning.value = false
  hasDragged.value = true
  isAtHome.value = false
  isDragging.value = true
  drag.pointerId = event.pointerId
  const rect = phone.value.getBoundingClientRect()
  drag.offsetX = event.clientX - rect.left
  drag.offsetY = event.clientY - rect.top
  drag.startX = event.clientX
  drag.startY = event.clientY
  phone.value.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!isDragging.value) return
  event.preventDefault()
  if (!scene.value) return
  const sceneRect = scene.value.getBoundingClientRect()
  const scaleX = sceneRect.width / scene.value.clientWidth
  const scaleY = sceneRect.height / scene.value.clientHeight
  const next = { x: (event.clientX - drag.offsetX - sceneRect.left) / scaleX, y: (event.clientY - drag.offsetY - sceneRect.top) / scaleY }
  Object.assign(position, clampPosition(next.x, next.y))
  nextTick(checkScannerOverlap)
}

function finishDrag(event: PointerEvent) {
  if (event.pointerId !== drag.pointerId) return
  const shouldActivate = event.type !== 'pointercancel' && isTapGesture(
    { x: drag.startX, y: drag.startY },
    { x: event.clientX, y: event.clientY },
  )
  if (phone.value?.hasPointerCapture(event.pointerId)) phone.value.releasePointerCapture(event.pointerId)
  isDragging.value = false
  drag.pointerId = -1
  checkScannerOverlap()
  scheduleReturnHome()
  if (shouldActivate) openSurprise()
}

function onResize() {
  window.cancelAnimationFrame(resizeFrame ?? 0)
  resizeFrame = window.requestAnimationFrame(() => {
    if (!isPhonePositioned.value) return
    setStartPosition(isAtHome.value || isReturning.value)
    if (!isAtHome.value && !isReturning.value) Object.assign(position, clampPosition(position.x, position.y))
    checkScannerOverlap()
  })
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    layoutFrame = window.requestAnimationFrame(() => resolve())
  })
}

function withTimeout(promise: Promise<unknown>, timeout = 1800) {
  return Promise.race([
    promise,
    new Promise<void>((resolve) => window.setTimeout(resolve, timeout)),
  ])
}

async function waitForInitialLayout() {
  const bouquetImage = scene.value?.querySelector<HTMLImageElement>('.bouquet-artwork > img')
  const imageReady = bouquetImage?.complete
    ? Promise.resolve()
    : bouquetImage?.decode?.().catch(() => undefined) ?? Promise.resolve()
  const fontsReady = document.fonts?.ready ?? Promise.resolve()

  await Promise.allSettled([
    withTimeout(imageReady),
    withTimeout(fontsReady),
  ])

  let previous: DOMRect | null = null
  let stableFrames = 0
  for (let frame = 0; frame < 24 && stableFrames < 3; frame += 1) {
    await nextFrame()
    if (!scene.value || isDisposed) return
    const current = scene.value.getBoundingClientRect()
    const stable = previous
      && Math.abs(current.left - previous.left) < 0.5
      && Math.abs(current.top - previous.top) < 0.5
      && Math.abs(current.width - previous.width) < 0.5
      && Math.abs(current.height - previous.height) < 0.5
    stableFrames = stable ? stableFrames + 1 : 0
    previous = current
  }
}

onMounted(async () => {
  await nextTick()
  await waitForInitialLayout()
  if (isDisposed || !scene.value || !phone.value) return
  setStartPosition(true)
  await nextTick()
  await nextFrame()
  if (isDisposed) return
  isPhonePositioned.value = true
  if (scene.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(scene.value)
  }
  if (scene.value && 'IntersectionObserver' in window) {
    intersectionObserver = new IntersectionObserver(([entry]) => { isInView.value = entry?.isIntersecting ?? true }, { threshold: 0.08 })
    intersectionObserver.observe(scene.value)
  }
  window.addEventListener('resize', onResize, { passive: true })
  activityEvents.forEach(event => window.addEventListener(event, refreshIdleReset, { passive: true }))
})

onBeforeUnmount(() => {
  isDisposed = true
  idleReset.cancel()
  activityEvents.forEach(event => window.removeEventListener(event, refreshIdleReset))
  clearScanTimers()
  clearReturnTimers()
  window.cancelAnimationFrame(layoutFrame ?? 0)
  window.cancelAnimationFrame(resizeFrame ?? 0)
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div ref="scene" class="qr-experience" :class="[`scan-${scanState}`, { 'is-dragging': isDragging, 'is-returning': isReturning, 'is-paused': !isInView }]">
    <div class="bouquet-artwork">
      <img src="/images/home-experience/bouquet-qr-guide.png" alt="Blue handcrafted bouquet with a Stack Petals QR keychain and scanning instructions" draggable="false" fetchpriority="high" />
      <span ref="qrHotspot" class="qr-hotspot" aria-hidden="true"></span>
    </div>

    <div class="phone-dock" aria-hidden="true">
      <div ref="phoneHome" class="phone-home"></div>
      <div v-if="!hasDragged && scanState === 'idle'" class="drag-hint">
        <span>Drag phone over QR</span><i></i>
      </div>
    </div>

    <Transition name="scan-success">
      <div v-if="scanState === 'revealed'" class="scan-success-note" aria-live="polite">
        <strong>Keepsake unlocked</strong>
        <span>There’s a story waiting inside</span>
      </div>
    </Transition>
    <div v-if="scanState === 'detected'" class="scan-bloom" aria-hidden="true"><PhSparkle v-for="petal in 5" :key="petal" :size="18" weight="duotone" :style="{ '--bloom-index': petal }" /></div>

      <div
        ref="phone"
        class="draggable-phone"
        :class="[`scan-${scanState}`, { 'is-positioned': isPhonePositioned, 'is-dragging': isDragging, 'is-returning': isReturning }]"
        :style="phoneStyle"
        role="button"
        :aria-label="phoneAriaLabel"
        tabindex="0"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="finishDrag"
        @pointercancel="finishDrag"
        @keydown.enter.prevent="openSurprise"
        @keydown.space.prevent="openSurprise"
        @keydown="moveScannerWithKeyboard"
      >
      <div class="phone-display">
        <Transition name="screen-reveal" mode="out-in">
          <div v-if="scanState !== 'revealed'" key="scanner" class="scanner-screen">
            <div class="camera-grain" aria-hidden="true"></div>
            <div class="scanner-topline"><span class="scanner-live-dot"></span> STACK PETALS SCANNER</div>
            <div ref="scannerWindow" class="scanner-window">
              <i class="corner top-left"></i><i class="corner top-right"></i>
              <i class="corner bottom-left"></i><i class="corner bottom-right"></i>
              <span class="scan-line" aria-hidden="true"></span><span class="scanner-reticle" aria-hidden="true"></span>
            </div>
            <div class="scanner-status" aria-live="polite">
              <strong v-if="scanState === 'detected'">QR Code Detected</strong>
              <strong v-else-if="scanState === 'scanning'">Reading your keepsake...</strong>
              <strong v-else>Scan QR Code</strong>
              <span v-if="scanState === 'idle'">Move phone over the QR tag</span>
              <span v-else-if="scanState === 'scanning'">Hold steady for a moment</span>
              <span v-else>Opening something special</span>
            </div>
          </div>

          <div v-else key="keepsafe" class="keepsafe-screen unlocked-cover">
            <span class="unlocked-brand">STACK PETALS</span>
            <PhSparkle :size="16" weight="duotone" />
            <span class="unlocked-kicker">A gift with a story inside</span>
            <strong>A little gift.<br /><em>A lasting feeling.</em></strong>
            <img src="/images/envelope-clean.png" alt="" draggable="false" />
            <span class="unlocked-open"><PhEnvelopeOpen :size="12" /> {{ hasExplored ? 'Replay the surprise' : 'Open your surprise' }}</span>
            <small>Sample recipient experience</small>
          </div>
        </Transition>
      </div>
        <img class="phone-frame" src="/images/home-experience/phone-frame.png" alt="" draggable="false" aria-hidden="true" />
      </div>
    <HomeKeepsakeDemo v-if="demoOpen" @close="demoOpen = false" />
  </div>
</template>

<style scoped>
.qr-experience { --rose:#cf7285; --phone-width:32%; position:relative; isolation:isolate; width:100%; max-width:640px; aspect-ratio:1.15/1; overflow:visible; border-radius:26px; user-select:none; }
.bouquet-artwork { position:absolute; left:0; top:5%; width:62%; height:auto; aspect-ratio:1138/1382; pointer-events:none; }
.phone-dock { position:absolute; top:12%; right:0; width:var(--phone-width); display:flex; flex-direction:column; align-items:center; gap:18px; pointer-events:none; }
.phone-home { width:100%; aspect-ratio:2/3; flex:none; }
.bouquet-artwork>img { display:block; width:100%; height:100%; object-fit:contain; object-position:left bottom; filter:drop-shadow(0 18px 15px rgba(58,65,101,.15)); animation:bouquetBreath 6s ease-in-out infinite; }
.qr-hotspot { position:absolute; left:47.8%; top:73.2%; width:12%; aspect-ratio:1; border-radius:6px; }

.draggable-phone { position:absolute; left:0; top:0; z-index:10; width:var(--phone-width); aspect-ratio:2/3; overflow:hidden; border-radius:14%/9.5%; touch-action:none; cursor:grab; user-select:none; visibility:hidden; opacity:0; pointer-events:none; will-change:transform; filter:drop-shadow(0 16px 16px rgba(43,37,47,.2)); transition:opacity .18s ease; }
.draggable-phone.is-positioned { visibility:visible; opacity:1; pointer-events:auto; }
.draggable-phone.is-returning { transition:transform .8s cubic-bezier(.22,.72,.24,1),opacity .2s ease,visibility .2s ease; }
.draggable-phone.is-dragging { cursor:grabbing; transition:none; filter:drop-shadow(0 28px 25px rgba(43,37,47,.32)); }
.draggable-phone.scan-revealed:not(.is-dragging) { cursor:pointer; }
.phone-frame { position:absolute; inset:0; z-index:3; display:block; width:100%; height:100%; object-fit:fill; pointer-events:none; }
.phone-display { position:absolute; left:13.8%; top:2.3%; z-index:2; width:72.7%; height:94%; overflow:hidden; border-radius:12%/6.2%; background:transparent; }

.scanner-screen { position:absolute; inset:0; overflow:hidden; color:#fff; background:linear-gradient(180deg,rgba(10,15,20,.24),rgba(13,18,24,.12) 43%,rgba(8,12,17,.3)); box-shadow:inset 0 0 34px rgba(5,8,12,.28); backdrop-filter:saturate(.72) contrast(1.06) brightness(.8); -webkit-backdrop-filter:saturate(.72) contrast(1.06) brightness(.8); }
.camera-grain { position:absolute; inset:0; opacity:.09; background-image:linear-gradient(90deg,transparent 49.5%,rgba(255,255,255,.09) 50%,transparent 50.5%),linear-gradient(transparent 49.5%,rgba(255,255,255,.06) 50%,transparent 50.5%); background-size:21px 21px; }
.scanner-topline { position:absolute; left:0; right:0; top:8%; display:flex; align-items:center; justify-content:center; gap:5px; color:rgba(255,255,255,.72); font:600 5px/1 Inter,sans-serif; letter-spacing:.14em; }
.scanner-live-dot { width:4px; height:4px; border-radius:50%; background:#e5899a; box-shadow:0 0 7px #e5899a; }
.scanner-window { position:absolute; left:15%; top:36%; width:70%; aspect-ratio:1; border-radius:14px; background:rgba(255,255,255,.018); box-shadow:inset 0 0 0 1px rgba(255,255,255,.035); }
.corner { position:absolute; width:23%; height:23%; border-color:#f4b3bf; border-style:solid; border-width:0; filter:drop-shadow(0 0 3px rgba(238,133,153,.7)); transition:border-color .2s ease,filter .2s ease,transform .2s ease; }
.top-left { left:0; top:0; border-left-width:2px; border-top-width:2px; border-radius:10px 0 0; }
.top-right { right:0; top:0; border-right-width:2px; border-top-width:2px; border-radius:0 10px 0 0; }
.bottom-left { left:0; bottom:0; border-left-width:2px; border-bottom-width:2px; border-radius:0 0 0 10px; }
.bottom-right { right:0; bottom:0; border-right-width:2px; border-bottom-width:2px; border-radius:0 0 10px; }
.scan-line { position:absolute; left:7%; right:7%; top:9%; height:1px; background:linear-gradient(90deg,transparent,#f2a4b4 15% 85%,transparent); box-shadow:0 0 10px 2px rgba(237,123,145,.66); animation:scannerLine 2.1s ease-in-out infinite; }
.scanner-reticle { position:absolute; left:50%; top:50%; width:5px; height:5px; border:1px solid rgba(255,255,255,.55); border-radius:50%; transform:translate(-50%,-50%); }
.scanner-status { position:absolute; left:8%; right:8%; bottom:12%; text-align:center; }
.scanner-status strong,.scanner-status span { display:block; }
.scanner-status strong { font:600 10px/1.2 'Cormorant Garamond',serif; letter-spacing:.03em; }
.scanner-status span { margin-top:4px; color:rgba(255,255,255,.58); font:500 5px/1.3 Inter,sans-serif; }
.scan-scanning .corner,.scan-detected .corner { border-color:#ffd5dc; filter:drop-shadow(0 0 7px #ef8499); transform:scale(1.08); }
.scan-scanning .scanner-screen,.scan-detected .scanner-screen { background:linear-gradient(180deg,rgba(10,15,20,.18),rgba(17,20,25,.06) 43%,rgba(8,12,17,.24)); }
.scan-detected .scanner-window { animation:detectedPulse .42s ease both; }

.drag-hint { position:relative; width:100%; display:grid; justify-items:center; color:#79525c; pointer-events:none; animation:hintFloat 2s ease-in-out infinite; }
.drag-hint span { max-width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid rgba(190,108,126,.27); border-radius:999px; background:rgba(255,250,249,.93); font:600 9px/1.4 Inter,sans-serif; text-align:center; text-wrap:balance; letter-spacing:.02em; }
.drag-hint i { width:22px; height:22px; margin-top:5px; border-right:1px solid #c46a7c; border-bottom:1px solid #c46a7c; transform:rotate(135deg); }
.scan-success-note { position:absolute; right:2%; bottom:5%; z-index:9; min-width:156px; padding:10px 13px; border:1px solid rgba(95,136,114,.3); border-radius:12px; background:rgba(250,255,252,.94); color:#466b59; text-align:center; pointer-events:none; }
.scan-success-note strong,.scan-success-note span { display:block; }
.scan-success-note strong { font:700 11px/1.2 Inter,sans-serif; }
.scan-success-note span { margin-top:3px; color:#7b6b6d; font:500 8px/1.2 Inter,sans-serif; }
.scan-success-enter-active,.scan-success-leave-active { transition:opacity .28s ease,transform .28s ease; }
.scan-success-enter-from,.scan-success-leave-to { opacity:0; transform:translateY(8px) scale(.96); }

.keepsafe-screen { position:absolute; inset:0; overflow:hidden; background:#fceced; }
.unlocked-cover { display:flex; flex-direction:column; justify-content:center; align-items:center; gap:6%; padding:18% 8% 10%; text-align:center; color:#985366; background:radial-gradient(ellipse at center,#fff9f4,#f9dfe5); box-sizing:border-box; }
.unlocked-brand { font:600 5px Inter,sans-serif; letter-spacing:.14em; }
.unlocked-kicker { font:600 5px/1.4 Inter,sans-serif; letter-spacing:.06em; text-transform:uppercase; }
.unlocked-cover strong { font:500 clamp(12px,1.25vw,19px)/1.08 'Cormorant Garamond',serif; }
.unlocked-cover em { color:#c57788; }
.unlocked-cover img { width:75%; max-height:25%; object-fit:contain; filter:drop-shadow(0 4px 5px #bb738530); }
.unlocked-open { display:flex; align-items:center; justify-content:center; gap:4px; border:1px solid #d5a2ab; border-radius:999px; padding:6px; font:500 5px/1.3 Inter,sans-serif; background:#fff7f5; }
.unlocked-cover small { font:500 4px/1.4 Inter,sans-serif; color:#816665; }
.scan-detected .scanner-screen { box-shadow:inset 0 0 26px #5f887270; }
.scan-detected .corner { border-color:#c3dfc1; }
.scan-bloom { position:absolute; left:55%; top:60%; z-index:12; pointer-events:none; color:#bc7b8b; }
.scan-bloom svg { position:absolute; animation:scanBloom .84s ease-out both; animation-delay:calc(var(--bloom-index) * .04s); }
@keyframes scanBloom { from { opacity:0; transform:translate(0,0) scale(.3) rotate(0); } 30% { opacity:1; } to { opacity:0; transform:translate(calc(var(--bloom-index) * 15px),calc(var(--bloom-index) * -24px)) scale(1.2) rotate(70deg); } }
.keepsafe-page-image { display:block; width:100%; height:100%; object-fit:cover; object-position:center; pointer-events:none; user-select:none; }
.keepsafe-phone-brand {
  position:absolute;
  top:8.5%;
  left:0;
  right:0;
  z-index:2;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:5px;
  color:#a94e61;
  font:600 7px/1 'Cormorant Garamond',serif;
  letter-spacing:.18em;
  text-align:center;
  text-shadow:0 1px 0 rgba(255,255,255,.9);
  pointer-events:none;
}
.keepsafe-phone-brand span { color:#dd7187; font-size:5px; }
.screen-reveal-enter-active,.screen-reveal-leave-active { transition:opacity .32s ease,transform .32s ease; }
.screen-reveal-enter-from { opacity:0; transform:translateY(8px) scale(.985); }
.screen-reveal-leave-to { opacity:0; transform:translateY(-5px) scale(1.01); }
.is-paused *,.is-paused *::before,.is-paused *::after { animation-play-state:paused!important; }

@keyframes bouquetBreath { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-4px) scale(1.006)} }
@keyframes scannerLine { 0%,100%{top:9%;opacity:.48} 50%{top:89%;opacity:1} }
@keyframes detectedPulse { 0%,100%{background:rgba(255,255,255,.035)} 50%{background:rgba(239,132,153,.18)} }
@keyframes hintFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }

/* Keep the compact/touch composition unchanged; create more air on desktop. */
@media (min-width:961px) {
  .qr-experience { --phone-width:28%; }
}

@media (max-width:620px) {
  .qr-experience { width:100%; max-width:430px; aspect-ratio:1.05/1; border-radius:18px; }
  .bouquet-artwork { top:8%; }
  .phone-dock { top:17%; gap:15px; }
  .qr-hotspot { left:47.8%; top:73.2%; width:12%; }
  .drag-hint span { font-size:8px; padding:7px 8px; }
}

@media (prefers-reduced-motion:reduce) {
  .qr-experience *,.qr-experience *::before,.qr-experience *::after { animation:none!important; transition-duration:.01ms!important; }
}
</style>
