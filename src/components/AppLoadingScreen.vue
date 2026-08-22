<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { preloadImageSources } from '@/utils/imagePreloader'

const props = defineProps<{
  assets: string[]
}>()

const emit = defineEmits<{
  ready: []
}>()

const messages = [
  'Gathering petals for your visit...',
  'Arranging something heartfelt...',
  'Polishing every little detail...',
  'Making the moment ready for you...',
]

const completed = ref(0)
const total = ref(Math.max(props.assets.length, 1))
const messageIndex = ref(0)
const isLeaving = ref(false)
let messageTimer: number | null = null

const progress = computed(() => Math.min(100, Math.round((completed.value / total.value) * 100)))

function delay(ms: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, ms))
}

onMounted(async () => {
  const startedAt = performance.now()
  messageTimer = window.setInterval(() => {
    messageIndex.value = (messageIndex.value + 1) % messages.length
  }, 1400)

  const preloadTask = preloadImageSources(props.assets, {
    concurrency: 4,
    onProgress: preloadProgress => {
      total.value = Math.max(preloadProgress.total, 1)
      completed.value = preloadProgress.completed
    },
  })

  await Promise.race([preloadTask, delay(8_000)])
  const minimumWait = Math.max(0, 900 - (performance.now() - startedAt))
  await delay(minimumWait)
  completed.value = total.value
  await delay(180)
  isLeaving.value = true
  await delay(460)
  emit('ready')
})

onBeforeUnmount(() => {
  if (messageTimer !== null) window.clearInterval(messageTimer)
})
</script>

<template>
  <div class="startup-loader" :class="{ 'is-leaving': isLeaving }" role="status" aria-live="polite">
    <div class="startup-loader__paper">
      <div class="startup-loader__flower" aria-hidden="true">
        <span v-for="petal in 6" :key="petal" :style="{ '--petal': petal - 1 }"></span>
        <i></i>
      </div>

      <p class="startup-loader__brand">STACK PETALS</p>
      <h1>Something lovely is taking shape</h1>
      <p class="startup-loader__message">{{ messages[messageIndex] }}</p>

      <div class="startup-loader__track" aria-hidden="true">
        <span :style="{ width: `${progress}%` }"></span>
      </div>
      <small>{{ progress }}%</small>
    </div>
  </div>
</template>

<style scoped>
.startup-loader {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: grid;
  place-items: center;
  padding: 24px;
  overflow: hidden;
  background: #fff5f4 url('/images/background.png') center / cover;
  color: #713b4c;
  opacity: 1;
  transition: opacity 460ms ease, visibility 460ms ease;
}

.startup-loader::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 247, 246, 0.78);
}

.startup-loader.is-leaving {
  opacity: 0;
  visibility: hidden;
}

.startup-loader__paper {
  position: relative;
  width: min(440px, 100%);
  padding: 48px 34px 36px;
  text-align: center;
  border: 1px solid rgba(203, 119, 139, 0.28);
  border-radius: 8px;
  background: rgba(255, 252, 251, 0.92);
  box-shadow: 0 18px 55px rgba(103, 57, 69, 0.1);
}

.startup-loader__flower {
  position: relative;
  width: 76px;
  height: 76px;
  margin: 0 auto 22px;
  animation: flower-breathe 2.4s ease-in-out infinite;
}

.startup-loader__flower span {
  --angle: calc(var(--petal) * 60deg);
  position: absolute;
  top: 8px;
  left: 27px;
  width: 22px;
  height: 34px;
  transform-origin: 11px 30px;
  transform: rotate(var(--angle));
  border: 1px solid rgba(190, 91, 119, 0.34);
  border-radius: 50% 50% 44% 44%;
  background: linear-gradient(180deg, #ffdce4, #ee9eb1);
}

.startup-loader__flower i {
  position: absolute;
  inset: 28px;
  z-index: 2;
  border-radius: 50%;
  background: #f5c36c;
  box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.5);
}

.startup-loader__brand {
  margin: 0 0 13px;
  color: #b65c77;
  font-size: 12px;
  letter-spacing: 0.28em;
}

h1 {
  margin: 0;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(30px, 7vw, 42px);
  font-weight: 500;
  line-height: 1.04;
}

.startup-loader__message {
  min-height: 24px;
  margin: 18px 0 24px;
  color: #966b75;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 17px;
  font-style: italic;
}

.startup-loader__track {
  width: min(270px, 88%);
  height: 5px;
  margin: 0 auto 9px;
  overflow: hidden;
  border-radius: 999px;
  background: #f2dfe1;
}

.startup-loader__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #d57a91, #719b83);
  transition: width 260ms ease;
}

small {
  color: #af838b;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

@keyframes flower-breathe {
  0%, 100% { transform: scale(0.94) rotate(-2deg); }
  50% { transform: scale(1.04) rotate(2deg); }
}

@media (max-width: 520px) {
  .startup-loader { padding: 16px; }
  .startup-loader__paper { padding: 40px 22px 30px; }
}

@media (prefers-reduced-motion: reduce) {
  .startup-loader,
  .startup-loader__track span { transition-duration: 1ms; }
  .startup-loader__flower { animation: none; }
}
</style>
