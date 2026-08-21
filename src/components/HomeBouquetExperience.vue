<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  REVEAL_RESET_DELAY_MS,
  clampToDocument,
  isTapGesture,
  viewportToDocumentPosition,
} from '@/utils/homeBouquetInteraction'

type ScanState = 'idle' | 'scanning' | 'detected' | 'revealed'

const scene = ref<HTMLElement | null>(null)
const phone = ref<HTMLElement | null>(null)
const scannerWindow = ref<HTMLElement | null>(null)
const qrHotspot = ref<HTMLElement | null>(null)
const scanState = ref<ScanState>('idle')
const hasDragged = ref(false)
const isDragging = ref(false)
const isReturning = ref(false)
const isInView = ref(true)
const isAtHome = ref(true)
const position = reactive({ x: 0, y: 0 })
const homePosition = reactive({ x: 0, y: 0 })
const drag = reactive({ pointerId: -1, offsetX: 0, offsetY: 0, startX: 0, startY: 0 })
let scanTimer: number | undefined
let detectedTimer: number | undefined
let revealedResetTimer: number | undefined
let returnTimer: number | undefined
let returnTransitionTimer: number | undefined
let layoutFrame: number | undefined
let resizeObserver: ResizeObserver | undefined
let intersectionObserver: IntersectionObserver | undefined

const phoneStyle = computed(() => ({ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }))
const phoneAriaLabel = computed(() => scanState.value === 'revealed'
  ? 'Stack Petals keepsafe opened. Tap to visit the Stack Petals process page.'
  : 'Draggable QR scanner phone. Move it over the QR code on the bouquet.')

function clearScanTimers() {
  window.clearTimeout(scanTimer)
  window.clearTimeout(detectedTimer)
  window.clearTimeout(revealedResetTimer)
  scanTimer = undefined
  detectedTimer = undefined
  revealedResetTimer = undefined
}

function clearReturnTimers() {
  window.clearTimeout(returnTimer)
  window.clearTimeout(returnTransitionTimer)
  returnTimer = undefined
  returnTransitionTimer = undefined
}

function clampPosition(x: number, y: number) {
  if (!phone.value) return { x, y }
  const root = document.documentElement
  const body = document.body

  return clampToDocument(
    { x, y },
    { width: phone.value.offsetWidth, height: phone.value.offsetHeight },
    {
      width: Math.max(root.scrollWidth, body.scrollWidth, window.innerWidth),
      height: Math.max(root.scrollHeight, body.scrollHeight, window.innerHeight),
    },
  )
}

function setStartPosition(movePhone = !hasDragged.value) {
  if (!scene.value || !phone.value) return
  const sceneRect = scene.value.getBoundingClientRect()
  const isCompact = sceneRect.width < 650
  const viewportPosition = {
    x: isCompact
      ? sceneRect.right - phone.value.offsetWidth - 2
      : sceneRect.right - phone.value.offsetWidth - 22,
    y: sceneRect.top + sceneRect.height * (isCompact ? 0.06 : 0.12),
  }
  const documentPosition = viewportToDocumentPosition(
    viewportPosition,
    { x: window.scrollX, y: window.scrollY },
  )
  const next = clampPosition(documentPosition.x, documentPosition.y)
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
    revealedResetTimer = window.setTimeout(() => {
      scanState.value = 'idle'
      revealedResetTimer = undefined
    }, REVEAL_RESET_DELAY_MS)
  }, 840)
}

function openProcessPage() {
  if (scanState.value !== 'revealed') return
  window.location.assign('https://stackoverpetals.shop/process')
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
  const next = viewportToDocumentPosition(
    { x: event.clientX - drag.offsetX, y: event.clientY - drag.offsetY },
    { x: window.scrollX, y: window.scrollY },
  )
  Object.assign(position, clampPosition(next.x, next.y))
  checkScannerOverlap()
}

function finishDrag(event: PointerEvent) {
  if (event.pointerId !== drag.pointerId) return
  const shouldOpenProcess = scanState.value === 'revealed' && isTapGesture(
    { x: drag.startX, y: drag.startY },
    { x: event.clientX, y: event.clientY },
  )
  if (phone.value?.hasPointerCapture(event.pointerId)) phone.value.releasePointerCapture(event.pointerId)
  isDragging.value = false
  drag.pointerId = -1
  checkScannerOverlap()
  scheduleReturnHome()
  if (shouldOpenProcess) openProcessPage()
}

function onResize() {
  setStartPosition(isAtHome.value || isReturning.value)
  if (!isAtHome.value && !isReturning.value) Object.assign(position, clampPosition(position.x, position.y))
  checkScannerOverlap()
}

onMounted(async () => {
  await nextTick()
  setStartPosition(true)
  layoutFrame = window.requestAnimationFrame(() => {
    layoutFrame = window.requestAnimationFrame(onResize)
  })
  if (scene.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(scene.value)
  }
  if (scene.value && 'IntersectionObserver' in window) {
    intersectionObserver = new IntersectionObserver(([entry]) => { isInView.value = entry?.isIntersecting ?? true }, { threshold: 0.08 })
    intersectionObserver.observe(scene.value)
  }
  window.addEventListener('resize', onResize, { passive: true })
})

onBeforeUnmount(() => {
  clearScanTimers()
  clearReturnTimers()
  window.cancelAnimationFrame(layoutFrame ?? 0)
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div ref="scene" class="qr-experience" :class="[`scan-${scanState}`, { 'is-dragging': isDragging, 'is-returning': isReturning, 'is-paused': !isInView }]">
    <div class="bouquet-artwork">
      <img src="/images/home-experience/bouquet-qr-guide.png" alt="Blue handcrafted bouquet with a Stack Petals QR keychain and scanning instructions" draggable="false" />
      <span ref="qrHotspot" class="qr-hotspot" aria-hidden="true"></span>
    </div>

    <div v-if="!hasDragged && scanState === 'idle'" class="drag-hint" aria-hidden="true">
      <span>Drag the phone to the QR code</span><i></i>
    </div>

    <Teleport to="body">
      <div
        ref="phone"
        class="draggable-phone"
        :class="[`scan-${scanState}`, { 'is-dragging': isDragging, 'is-returning': isReturning }]"
        :style="phoneStyle"
        :role="scanState === 'revealed' ? 'link' : 'application'"
        :aria-label="phoneAriaLabel"
        tabindex="0"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="finishDrag"
        @pointercancel="finishDrag"
        @keydown.enter.prevent="openProcessPage"
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

          <div v-else key="keepsafe" class="keepsafe-screen">
            <img
              class="keepsafe-page-image"
              src="/images/home-experience/keepsafe-page.png"
              alt="Stack Petals keepsafe preview"
              draggable="false"
            />
            <div class="keepsafe-phone-brand" aria-hidden="true">
              <span>&#10022;</span>
              STACK PETALS
              <span>&#10022;</span>
            </div>
          </div>
        </Transition>
      </div>
        <img class="phone-frame" src="/images/home-experience/phone-frame.png" alt="" draggable="false" aria-hidden="true" />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.qr-experience { --rose:#cf7285; position:relative; width:min(100%,900px); aspect-ratio:1.34/1; overflow:visible; border-radius:26px; user-select:none; }
.bouquet-artwork { position:absolute; left:-1%; bottom:-2%; height:105%; aspect-ratio:1138/1382; pointer-events:none; }
.bouquet-artwork>img { display:block; width:100%; height:100%; object-fit:contain; object-position:left bottom; filter:drop-shadow(0 18px 15px rgba(58,65,101,.15)); animation:bouquetBreath 6s ease-in-out infinite; }
.qr-hotspot { position:absolute; left:47.8%; top:73.2%; width:12%; aspect-ratio:1; border-radius:6px; }

.draggable-phone { position:absolute; left:0; top:0; z-index:5000; width:clamp(226px,16vw,268px); aspect-ratio:2/3; overflow:hidden; border-radius:14%/9.5%; touch-action:none; cursor:grab; user-select:none; will-change:transform; filter:drop-shadow(0 22px 22px rgba(43,37,47,.25)); transition:opacity .2s ease,visibility .2s ease; }
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

.drag-hint { position:absolute; right:3%; bottom:5%; z-index:9; display:grid; justify-items:center; color:#79525c; pointer-events:none; animation:hintFloat 2s ease-in-out infinite; }
.drag-hint span { padding:7px 12px; border:1px solid rgba(190,108,126,.27); border-radius:999px; background:rgba(255,250,249,.93); font:600 8px/1 Inter,sans-serif; letter-spacing:.04em; }
.drag-hint i { width:22px; height:22px; margin-top:5px; border-right:1px solid #c46a7c; border-bottom:1px solid #c46a7c; transform:rotate(135deg); }

.keepsafe-screen { position:absolute; inset:0; overflow:hidden; background:#fceced; }
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

@media (max-width:620px) {
  .qr-experience { width:min(calc(100vw - 40px),430px); aspect-ratio:.82/1; border-radius:18px; }
  .bouquet-artwork { left:-3%; bottom:1%; width:79%; height:auto; aspect-ratio:1138/1382; }
  .qr-hotspot { left:47.8%; top:73.2%; width:12%; }
  .draggable-phone { width:clamp(150px,43vw,178px); }
  .drag-hint { right:2%; bottom:2%; }
  .drag-hint span { font-size:6.5px; padding:6px 9px; }
}

@media (prefers-reduced-motion:reduce) {
  .qr-experience *,.qr-experience *::before,.qr-experience *::after { animation:none!important; transition-duration:.01ms!important; }
}
</style>
