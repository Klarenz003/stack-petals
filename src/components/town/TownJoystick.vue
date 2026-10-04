<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PhArrowsOutCardinal } from '@phosphor-icons/vue'
import { joystickDirection, type TouchDirection } from '@/utils/townTouch'
const props = defineProps<{ disabled: boolean }>()
const emit = defineEmits<{ move: [direction: TouchDirection] }>()
const pad = ref<HTMLElement | null>(null), offset = ref({ x: 0, y: 0 }), active = ref(false)
let pointer: number | null = null
function update(event: PointerEvent) {
  const rect = pad.value?.getBoundingClientRect()
  if (!rect) return
  const radius = rect.width * .31
  const x = event.clientX - rect.left - rect.width / 2, y = event.clientY - rect.top - rect.height / 2
  const length = Math.hypot(x,y), ratio = length > radius ? radius / length : 1
  offset.value = { x: x * ratio, y: y * ratio }
  emit('move', joystickDirection(x,y,radius))
}
function start(event: PointerEvent) {
  if (props.disabled || pointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return
  event.preventDefault()
  pointer = event.pointerId; active.value = true
  try { pad.value?.setPointerCapture(pointer) } catch { /* Window listeners cover capture failures. */ }
  update(event)
}
function move(event: PointerEvent) { if (pointer === event.pointerId && !props.disabled) { event.preventDefault(); update(event) } }
function reset() {
  const captured = pointer
  pointer = null; active.value = false; offset.value = { x: 0, y: 0 }
  try { if (captured !== null && pad.value?.hasPointerCapture(captured)) pad.value.releasePointerCapture(captured) } catch { /* The browser may already have canceled this touch. */ }
  emit('move', { x: 0, y: 0 })
}
function stop(event: PointerEvent) { if (event.pointerId === pointer) reset() }
function outsideMove(event: PointerEvent) { if (pointer === event.pointerId && !pad.value?.hasPointerCapture?.(pointer)) move(event) }
watch(() => props.disabled, disabled => { if (disabled) reset() })
function visibility() { if (document.hidden) reset() }
onMounted(() => { window.addEventListener('blur',reset); window.addEventListener('resize',reset); window.addEventListener('pointerup',stop); window.addEventListener('pointercancel',stop); window.addEventListener('pointermove',outsideMove,{passive:false}); document.addEventListener('visibilitychange',visibility) })
onBeforeUnmount(() => { reset(); window.removeEventListener('blur',reset); window.removeEventListener('resize',reset); window.removeEventListener('pointerup',stop); window.removeEventListener('pointercancel',stop); window.removeEventListener('pointermove',outsideMove); document.removeEventListener('visibilitychange',visibility) })
</script>

<template>
  <div class="town-joystick-wrap">
    <div ref="pad" class="town-joystick" :class="{ active, disabled }" role="group" aria-label="Touch joystick: drag in any direction to walk; release to stop" @pointerdown="start" @pointermove="move" @pointerup="stop" @pointercancel="stop" @lostpointercapture="stop" @contextmenu.prevent>
      <span class="joystick-cross" aria-hidden="true"></span><span class="joystick-knob" :style="{ transform: `translate(${offset.x}px,${offset.y}px)` }"><PhArrowsOutCardinal :size="24" weight="duotone" /></span>
    </div><span class="joystick-caption">Drag to explore</span>
  </div>
</template>

<style scoped>
.town-joystick-wrap{display:flex;flex-direction:column;align-items:center;gap:8px}.town-joystick{position:relative;width:112px;height:112px;border-radius:50%;border:1px solid #d5c9ba;background:radial-gradient(circle,#eee2d5 0 33%,#f9f2e9 34% 64%,#eee5da 65%);box-shadow:inset 0 2px 10px #81644412,0 3px 0 #d4c8b83d;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}.joystick-knob{position:absolute;left:33px;top:33px;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;border:1px solid #c9a5b3;background:linear-gradient(#fff5f6,#f0dce4);box-shadow:0 4px 10px #80536324;color:#935671;pointer-events:none}.joystick-cross{position:absolute;inset:17px;border-radius:50%;border:1px dashed #d7cabb;pointer-events:none}.town-joystick.active{border-color:#b47e92}.town-joystick.disabled{opacity:.45}.joystick-caption{font-size:10px;color:#72645d;letter-spacing:.03em}
</style>
