<script setup lang="ts">
import { gsap } from 'gsap'
import { onBeforeUnmount, onMounted, ref, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  label: string
  ariaLabel?: string
  disabled?: boolean
}>(), {
  ariaLabel: '',
  disabled: false,
})

const emit = defineEmits<{
  activate: []
}>()

const attrs = useAttrs()
const root = ref<HTMLButtonElement | null>(null)
const labelEl = ref<HTMLSpanElement | null>(null)
const ornament = ref<HTMLSpanElement | null>(null)
const bloom = ref<HTMLSpanElement | null>(null)
const ring = ref<HTMLSpanElement | null>(null)
const loveSeal = ref<HTMLSpanElement | null>(null)
const sparkles = ref<HTMLSpanElement[]>([])
const releasePetals = ref<HTMLSpanElement[]>([])
const busy = ref(false)

let context: gsap.Context | null = null
let idleTimeline: gsap.core.Timeline | null = null
let activationTimeline: gsap.core.Timeline | null = null
let moveRootX: ((value: number) => gsap.core.Tween) | null = null
let moveRootY: ((value: number) => gsap.core.Tween) | null = null
let moveLabelX: ((value: number) => gsap.core.Tween) | null = null
let moveLabelY: ((value: number) => gsap.core.Tween) | null = null
let moveOrnamentX: ((value: number) => gsap.core.Tween) | null = null
let moveOrnamentY: ((value: number) => gsap.core.Tween) | null = null

function setSparkleRef(element: unknown) {
  if (element instanceof HTMLSpanElement && !sparkles.value.includes(element)) {
    sparkles.value.push(element)
  }
}

function setReleasePetalRef(element: unknown) {
  if (element instanceof HTMLSpanElement && !releasePetals.value.includes(element)) {
    releasePetals.value.push(element)
  }
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function supportsMagneticMotion() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion()
}

function resetMagnet() {
  moveRootX?.(0)
  moveRootY?.(0)
  moveLabelX?.(0)
  moveLabelY?.(0)
  moveOrnamentX?.(0)
  moveOrnamentY?.(0)
}

function handlePointerMove(event: PointerEvent) {
  if (!root.value || !supportsMagneticMotion() || busy.value) return
  const bounds = root.value.getBoundingClientRect()
  const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5
  const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5

  moveRootX?.(offsetX * 8)
  moveRootY?.(offsetY * 5)
  moveLabelX?.(offsetX * 4)
  moveLabelY?.(offsetY * 2.5)
  moveOrnamentX?.(offsetX * 9)
  moveOrnamentY?.(offsetY * 5)
}

function handleActivate() {
  if (!root.value || props.disabled || busy.value) return
  busy.value = true
  idleTimeline?.pause()
  resetMagnet()

  if (prefersReducedMotion()) {
    emit('activate')
    busy.value = false
    return
  }

  const sparklePoints = [
    [-34, -18], [0, -28], [35, -16],
    [-38, 15], [0, 27], [38, 14],
  ]
  const petalPaths = [
    [-72, -27], [-42, -41], [-10, -34], [24, -45], [57, -26],
    [73, 1], [53, 30], [17, 41], [-23, 35], [-57, 20],
  ]

  activationTimeline?.kill()
  activationTimeline = gsap.timeline({
    defaults: { ease: 'power2.out' },
    onComplete: () => {
      emit('activate')
      busy.value = false
      idleTimeline?.restart()
      activationTimeline = null
    },
  })

  activationTimeline
    .to(root.value, { scale: 0.972, duration: 0.1 })
    .to(root.value, { scale: 1.018, duration: 0.2, ease: 'back.out(2.2)' })
    .to(ring.value, { scale: 1.18, opacity: 0, duration: 0.46 }, 0.05)
    .fromTo(
      loveSeal.value,
      { scale: 0.15, opacity: 0, rotation: -20 },
      { scale: 1.06, opacity: 0.92, rotation: 0, duration: 0.24, ease: 'back.out(2.8)' },
      0.06,
    )
    .to(loveSeal.value, { scale: 1.38, opacity: 0, duration: 0.34, ease: 'power2.in' }, 0.25)
    .to(labelEl.value, { y: -2, opacity: 0.48, duration: 0.14 }, 0.06)
    .to(labelEl.value, { y: 0, opacity: 1, duration: 0.24 }, 0.28)
    .to(bloom.value, { scale: 1.12, rotation: -7, duration: 0.18, ease: 'back.out(2)' }, 0.03)
    .to(bloom.value, { scale: 1, rotation: -13, duration: 0.28 }, 0.25)

  sparkles.value.forEach((sparkle, index) => {
    const [x, y] = sparklePoints[index] || [0, -24]
    activationTimeline?.fromTo(
      sparkle,
      { x: 0, y: 0, scale: 0.2, opacity: 0 },
      { x, y, scale: 1, opacity: 1, duration: 0.18, yoyo: true, repeat: 1 },
      0.08 + index * 0.018,
    )
  })

  releasePetals.value.forEach((petal, index) => {
    const [x, y] = petalPaths[index] || [0, -34]
    const originX = -Math.min(root.value!.offsetWidth * 0.38, 96)
    activationTimeline?.fromTo(
      petal,
      { x: originX, y: 0, scale: 0.15, rotation: -35 + index * 17, opacity: 0 },
      {
        x,
        y,
        scale: 0.72 + (index % 3) * 0.16,
        rotation: 75 + index * 31,
        opacity: 0.92,
        duration: 0.4,
      },
      0.06 + index * 0.012,
    )
    activationTimeline?.to(
      petal,
      {
        x: x * 1.13,
        y: y + 13,
        scale: 0.35,
        rotation: 125 + index * 42,
        opacity: 0,
        duration: 0.26,
        ease: 'sine.in',
      },
      0.38 + index * 0.01,
    )
  })

  activationTimeline.to(root.value, { scale: 1, duration: 0.16 }, 0.46)
}

onMounted(() => {
  if (!root.value) return

  context = gsap.context(() => {
    moveRootX = gsap.quickTo(root.value, 'x', { duration: 0.38, ease: 'power3.out' })
    moveRootY = gsap.quickTo(root.value, 'y', { duration: 0.38, ease: 'power3.out' })
    moveLabelX = gsap.quickTo(labelEl.value, 'x', { duration: 0.45, ease: 'power3.out' })
    moveLabelY = gsap.quickTo(labelEl.value, 'y', { duration: 0.45, ease: 'power3.out' })
    moveOrnamentX = gsap.quickTo(ornament.value, 'x', { duration: 0.5, ease: 'power3.out' })
    moveOrnamentY = gsap.quickTo(ornament.value, 'y', { duration: 0.5, ease: 'power3.out' })

    if (!prefersReducedMotion()) {
      idleTimeline = gsap.timeline({ repeat: -1, yoyo: true })
        .to(ring.value, { scale: 1.035, opacity: 0.72, duration: 2.4, ease: 'sine.inOut' }, 0)
        .to(ornament.value, { rotation: 1.8, y: -1.5, duration: 2.4, ease: 'sine.inOut' }, 0)
    }
  }, root.value)
})

onBeforeUnmount(() => {
  activationTimeline?.kill()
  idleTimeline?.kill()
  context?.revert()
})
</script>

<template>
  <button
    v-bind="attrs"
    ref="root"
    class="letter-magic-button"
    :class="{ 'is-disabled': disabled }"
    type="button"
    :aria-label="ariaLabel || label"
    :disabled="disabled || busy"
    @click="handleActivate"
    @pointermove="handlePointerMove"
    @pointerleave="resetMagnet"
    @pointercancel="resetMagnet"
  >
    <span ref="ring" class="magic-ring" aria-hidden="true"></span>
    <span class="magic-surface" aria-hidden="true"></span>
    <span class="magic-shimmer" aria-hidden="true"></span>

    <span ref="bloom" class="magic-bloom magic-bloom-left" aria-hidden="true">
      <i></i><i></i><i></i><b></b>
    </span>

    <span ref="labelEl" class="magic-label">
      <span class="magic-heart" aria-hidden="true">&#9825;</span>
      {{ label }}
      <span class="magic-arrow" aria-hidden="true">&#8594;</span>
    </span>

    <span ref="ornament" class="magic-branch" aria-hidden="true">
      <i></i><i></i><i></i><b></b>
    </span>

    <span class="magic-sparkles" aria-hidden="true">
      <span v-for="index in 6" :key="index" :ref="setSparkleRef"></span>
    </span>

    <span ref="loveSeal" class="magic-love-seal" aria-hidden="true">&#9825;</span>
    <span class="magic-release-petals" aria-hidden="true">
      <span v-for="index in 10" :key="index" :ref="setReleasePetalRef"></span>
    </span>

  </button>
</template>

<style scoped>
.letter-magic-button {
  --magic-rose: #cc6079;
  --magic-wine: #813f50;
  --magic-line: rgba(204, 96, 121, 0.6);
  position: relative;
  isolation: isolate;
  display: grid;
  place-items: center;
  width: min(72vw, 286px);
  min-width: 210px;
  min-height: 58px;
  margin-inline: auto;
  padding: 12px 52px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--magic-wine);
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transform-origin: center;
  will-change: transform;
}

.letter-magic-button:disabled {
  cursor: default;
}

.letter-magic-button.is-disabled {
  opacity: 0.58;
}

.magic-surface,
.magic-ring,
.magic-shimmer {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}

.magic-surface {
  z-index: -3;
  border: 1px solid rgba(214, 118, 141, 0.62);
  background:
    radial-gradient(circle at 28% 15%, rgba(255, 255, 255, 0.96), transparent 31%),
    linear-gradient(105deg, rgba(255, 252, 250, 0.96), rgba(255, 229, 235, 0.92) 56%, rgba(252, 216, 225, 0.94));
}

.magic-ring {
  z-index: -2;
  inset: 4px;
  border: 1px solid rgba(215, 112, 137, 0.36);
  opacity: 0.48;
}

.magic-shimmer {
  z-index: -1;
  inset: 6px;
  overflow: hidden;
}

.magic-shimmer::after {
  content: '';
  position: absolute;
  top: -80%;
  left: -38%;
  width: 24%;
  height: 260%;
  opacity: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  transform: rotate(18deg);
  transition: left 800ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 180ms ease;
}

.letter-magic-button:hover .magic-shimmer::after,
.letter-magic-button:focus-visible .magic-shimmer::after {
  left: 114%;
  opacity: 0.82;
}

.magic-label {
  position: relative;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  white-space: nowrap;
  font: 500 clamp(17px, min(4.6vw, 2.6dvh), 21px)/1 'Cormorant Garamond', serif;
  letter-spacing: 0;
  pointer-events: none;
  will-change: transform;
}

.magic-heart {
  color: #de8398;
  font: 400 14px/1 Georgia, serif;
}

.magic-arrow {
  color: var(--magic-rose);
  font-family: Georgia, serif;
  font-size: 18px;
  transition: transform 260ms ease;
}

.letter-magic-button:hover .magic-arrow,
.letter-magic-button:focus-visible .magic-arrow {
  transform: translateX(4px);
}

.magic-bloom,
.magic-branch {
  position: absolute;
  z-index: 4;
  width: 46px;
  height: 48px;
  pointer-events: none;
  will-change: transform;
}

.magic-bloom {
  left: -5px;
  top: 50%;
  transform: translateY(-50%) rotate(-13deg);
}

.magic-bloom i {
  position: absolute;
  left: 17px;
  top: 13px;
  width: 17px;
  height: 22px;
  border: 1px solid rgba(201, 92, 118, 0.54);
  border-radius: 70% 30% 68% 32%;
  background: rgba(249, 182, 197, 0.76);
  transform-origin: 50% 80%;
}

.magic-bloom i:nth-child(1) { transform: rotate(-58deg) translateY(-5px); }
.magic-bloom i:nth-child(2) { transform: rotate(0deg) translateY(-8px); }
.magic-bloom i:nth-child(3) { transform: rotate(58deg) translateY(-5px); }

.magic-bloom b {
  position: absolute;
  left: 20px;
  top: 21px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #e5ad76;
}

.magic-branch {
  right: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(10deg);
}

.magic-branch::before {
  content: '';
  position: absolute;
  left: 21px;
  top: 5px;
  width: 1px;
  height: 40px;
  background: #b87987;
  transform: rotate(32deg);
  transform-origin: bottom;
}

.magic-branch i {
  position: absolute;
  width: 14px;
  height: 24px;
  border: 1px solid rgba(187, 102, 124, 0.52);
  border-radius: 100% 0 100% 0;
  background: rgba(248, 188, 201, 0.74);
}

.magic-branch i:nth-child(1) { left: 8px; top: 21px; transform: rotate(-24deg); }
.magic-branch i:nth-child(2) { left: 19px; top: 11px; transform: rotate(22deg) scale(0.9); }
.magic-branch i:nth-child(3) { left: 29px; top: 1px; transform: rotate(31deg) scale(0.72); }

.magic-branch b {
  position: absolute;
  left: 8px;
  top: 34px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #dc8297;
}

.magic-sparkles,
.magic-sparkles > span {
  position: absolute;
  left: 50%;
  top: 50%;
  pointer-events: none;
}

.magic-sparkles > span {
  width: 6px;
  height: 6px;
  opacity: 0;
  background: #df8297;
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
}

.magic-love-seal {
  position: absolute;
  z-index: 6;
  left: 50%;
  top: 50%;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(199, 83, 111, 0.64);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 252, 250, 0.98) 0 44%, rgba(249, 187, 201, 0.9) 46% 67%, rgba(255, 241, 244, 0.85) 69%);
  color: #b94f69;
  font: 400 22px/1 Georgia, serif;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.2);
  pointer-events: none;
}

.magic-love-seal::before {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: inherit;
}

.magic-release-petals,
.magic-release-petals > span {
  position: absolute;
  left: 50%;
  top: 50%;
  pointer-events: none;
}

.magic-release-petals {
  z-index: 7;
}

.magic-release-petals > span {
  width: 9px;
  height: 14px;
  border: 1px solid rgba(190, 80, 108, 0.4);
  border-radius: 75% 25% 70% 30%;
  background: radial-gradient(circle at 72% 22%, #fff 0 9%, #f8bbc9 24%, #dd7890 100%);
  opacity: 0;
  transform-origin: 50% 85%;
}

.magic-release-petals > span:nth-child(3n + 2) {
  width: 7px;
  height: 11px;
  background: radial-gradient(circle at 70% 20%, #fff 0 10%, #fbe1e7 32%, #e8a0b1 100%);
}

.magic-release-petals > span:nth-child(3n) {
  width: 8px;
  height: 12px;
  background: radial-gradient(circle at 72% 22%, #fff4f6 0 11%, #ef9aad 30%, #ca5b76 100%);
}

.letter-magic-button:focus-visible {
  outline: 2px solid rgba(184, 76, 101, 0.62);
  outline-offset: 4px;
}

@media (max-width: 380px) {
  .letter-magic-button {
    width: min(76vw, 270px);
    min-width: 196px;
    min-height: 54px;
    padding-inline: 46px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .letter-magic-button,
  .magic-shimmer::after,
  .magic-arrow {
    transition: none;
  }
}
</style>
