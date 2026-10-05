<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { PhFlower, PhDrop, PhCheck } from '@phosphor-icons/vue'
const props = defineProps<{ watered: number[] }>()
const emit = defineEmits<{ water: [index: number] }>()
const active = ref<number | null>(null), progress = ref(0)
let frame = 0, started = 0
function cancel() { cancelAnimationFrame(frame); active.value = null; progress.value = 0 }
function pour(time: number) {
  if (active.value === null) return
  if (!started) started = time
  progress.value = Math.min(1, (time - started) / 900)
  if (progress.value === 1) { const index = active.value; cancel(); emit('water', index); return }
  frame = requestAnimationFrame(pour)
}
function begin(index: number) {
  if (props.watered.includes(index)) return
  cancel(); active.value = index; started = 0; frame = requestAnimationFrame(pour)
}
function pointer(event: PointerEvent, index: number) {
  if (event.button !== 0) return
  const button = event.currentTarget as HTMLElement
  try { button.setPointerCapture(event.pointerId) } catch { /* release events still cancel */ }
  begin(index)
}
function hidden() { if (document.hidden) cancel() }
onMounted(() => { window.addEventListener('blur', cancel); document.addEventListener('visibilitychange', hidden) })
onBeforeUnmount(() => { cancel(); window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', hidden) })
</script>
<template>
  <div class="town-watering">
    <p>Hold a flower to give it a gentle drink. Release to stop. With a keyboard, press Enter to pour.</p>
    <div class="watering-beds">
      <button v-for="index in [0,1,2]" :key="index" :disabled="watered.includes(index)" :class="{ blooming: watered.includes(index), pouring: active === index }" :aria-label="`Water flower ${index+1}`" @pointerdown="pointer($event,index)" @pointerup="cancel" @pointercancel="cancel" @lostpointercapture="cancel" @keydown.enter.prevent="begin(index)" @keydown.space.prevent="!$event.repeat && begin(index)" @keyup.space="cancel">
        <PhDrop v-if="active === index" :size="18" weight="fill" class="watering-drop" />
        <PhFlower :size="42" :weight="watered.includes(index) ? 'fill' : 'duotone'" />
        <span>{{ watered.includes(index) ? 'In bloom' : 'Hold to water' }}</span>
        <span class="watering-track"><i :style="{ width: `${watered.includes(index) ? 100 : active === index ? progress*100 : 0}%` }"></i></span>
        <PhCheck v-if="watered.includes(index)" :size="16" weight="fill" />
      </button>
    </div>
    <p role="status">{{ watered.length }} of 3 flowers cared for.</p>
  </div>
</template>
<style scoped>
.watering-beds{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:24px 0}.watering-beds button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;min-height:154px;border:1px solid #ddd1bf;border-radius:22px;background:#f4efe3;color:#8d9474;touch-action:none;font:600 10px/1.5 Inter,sans-serif;cursor:pointer;padding:20px 8px}.watering-beds button.blooming{background:#eef2e3;color:#b96f8e;border-color:#a6bc93;opacity:1}.watering-beds button.pouring{border-color:#799cba;color:#6c90aa}.watering-track{height:5px;width:80%;background:#dedbcf;border-radius:5px;overflow:hidden}.watering-track i{display:block;height:100%;background:#7da8ac}.watering-drop{position:absolute;top:8px;right:12px;color:#7da8ac}.watering-beds button:focus-visible{outline:3px solid #799cba;outline-offset:3px}
</style>
