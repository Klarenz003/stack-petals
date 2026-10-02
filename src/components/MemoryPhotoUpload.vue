<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { PhCamera, PhX } from '@phosphor-icons/vue'

const props = defineProps<{ modelValue: string[]; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [photos: string[]] }>()
const input = ref<HTMLInputElement | null>(null)
const queue = ref<File[]>([])
const source = ref('')
const zoom = ref(1)
const offset = ref({ x: 0, y: 0 })
const imageRatio = ref(1.5)
const viewport = ref<HTMLElement | null>(null)
const dialog = ref<HTMLElement | null>(null)
const saveButton = ref<HTMLButtonElement | null>(null)
const busy = ref(false)
const ready = ref(false)
const error = ref('')
let dragging = false
let dragStart = { x: 0, y: 0 }
let offsetStart = { x: 0, y: 0 }
let returnFocus: HTMLElement | null = null
let request = 0
const imageStyle = computed(() => ({
  width: imageRatio.value > 1.5 ? `${imageRatio.value / 1.5 * 100}% !important` : '100% !important',
  height: imageRatio.value > 1.5 ? '100% !important' : `${1.5 / imageRatio.value * 100}% !important`,
  left: `calc(50% + ${offset.value.x}px)`, top: `calc(50% + ${offset.value.y}px)`,
  transform: `translate(-50%, -50%) scale(${zoom.value})`,
}))

function cancel() {
  request++; queue.value = []; source.value = ''; ready.value = false; dragging = false
  returnFocus?.focus(); returnFocus = null
}
async function openNext() {
  const file = queue.value.shift()
  if (!file) { cancel(); return }
  const current = ++request
  ready.value = false; zoom.value = 1; offset.value = { x: 0, y: 0 }; imageRatio.value = 1.5
  source.value = ''
  await nextTick()
  try {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
    if (current !== request) return
    source.value = data
    await nextTick(); dialog.value?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
  } catch { if (current === request) { error.value = 'This photo could not be opened. Please choose another image.'; cancel() } }
}
async function addFiles(files: File[]) {
  if (props.disabled || source.value || busy.value) return
  queue.value = files.filter(file => file.type.startsWith('image/')).slice(0, Math.max(0, 3 - props.modelValue.length))
  if (!queue.value.length) return
  error.value = ''; returnFocus = document.activeElement as HTMLElement
  await openNext()
}
async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || []); target.value = ''
  await addFiles(files)
}
function imageLoaded(event: Event) {
  const image = event.target as HTMLImageElement
  imageRatio.value = image.naturalWidth / image.naturalHeight; ready.value = true
}
function clampOffset() {
  if (!viewport.value) return
  const width = viewport.value.clientWidth, height = viewport.value.clientHeight
  const baseWidth = Math.max(width, height * imageRatio.value)
  const baseHeight = Math.max(height, width / imageRatio.value)
  const maxX = (baseWidth * zoom.value - width) / 2, maxY = (baseHeight * zoom.value - height) / 2
  offset.value = { x: Math.max(-maxX, Math.min(maxX, offset.value.x)), y: Math.max(-maxY, Math.min(maxY, offset.value.y)) }
}
function startDrag(event: PointerEvent) {
  if (!ready.value || busy.value) return
  dragging = true; dragStart = { x: event.clientX, y: event.clientY }; offsetStart = { ...offset.value }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function moveDrag(event: PointerEvent) {
  if (!dragging) return
  offset.value = { x: offsetStart.x + event.clientX - dragStart.x, y: offsetStart.y + event.clientY - dragStart.y }
  clampOffset()
}
async function saveCrop() {
  if (!source.value || busy.value || !ready.value || props.disabled) return
  busy.value = true
  const current = request
  try {
    const image = new Image(); image.src = source.value; await image.decode()
    if (current !== request) return
    const canvas = document.createElement('canvas'); canvas.width = 900; canvas.height = 600
    const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas unavailable')
    clampOffset()
    const scale = Math.max(900 / image.naturalWidth, 600 / image.naturalHeight) * zoom.value
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale
    const x = offset.value.x * (900 / (viewport.value?.clientWidth || 900))
    const y = offset.value.y * (600 / (viewport.value?.clientHeight || 600))
    context.drawImage(image, (900 - width) / 2 + x, (600 - height) / 2 + y, width, height)
    if (props.modelValue.length < 3) emit('update:modelValue', [...props.modelValue, canvas.toDataURL('image/jpeg', .86)])
    await nextTick(); await openNext()
  } catch { error.value = 'This photo could not be cropped. Please try another image.'; cancel() }
  finally { busy.value = false }
}
function handleKey(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!busy.value) cancel() }
  if (event.key !== 'Tab') return
  const controls = Array.from(dialog.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)') || [])
  const first = controls[0], last = controls[controls.length - 1]
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
onMounted(() => window.addEventListener('resize', clampOffset))
onBeforeUnmount(() => { request++; window.removeEventListener('resize', clampOffset) })
</script>

<template>
  <div class="memory-photo-upload">
    <div class="upload-zone" :class="{ 'is-disabled': disabled }" role="button" :tabindex="disabled ? -1 : 0" :aria-disabled="disabled" aria-label="Add memory photos, up to three" @click="!disabled && input?.click()" @keydown.enter.prevent="!disabled && input?.click()" @keydown.space.prevent="!disabled && input?.click()" @dragover.prevent @drop.prevent="addFiles(Array.from($event.dataTransfer?.files || []))">
      <input ref="input" type="file" accept="image/*" multiple hidden :disabled="disabled" @change="handleUpload" />
      <div v-if="!modelValue.length" class="upload-empty"><span><PhCamera :size="30" weight="light" aria-hidden="true" /></span><p>Add up to 3 photos</p></div>
      <div v-else class="memory-grid">
        <div v-for="(photo, index) in modelValue" :key="index" class="memory-item">
          <img :src="photo" :alt="`Memory ${index + 1}`" />
          <button type="button" class="memory-remove" :disabled="disabled" :aria-label="`Remove memory photo ${index + 1}`" @keydown.stop @click.stop="emit('update:modelValue', modelValue.filter((_, i) => i !== index))"><PhX :size="14" aria-hidden="true" /></button>
        </div>
      </div>
    </div>
    <p v-if="error" class="memory-upload-error" role="alert">{{ error }}</p>
    <Teleport to="body">
      <div v-if="source" class="memory-crop-overlay" @keydown="handleKey">
        <section ref="dialog" class="memory-crop-modal memory-photo-crop" role="dialog" aria-modal="true" aria-labelledby="memory-crop-title" aria-describedby="memory-crop-help">
          <button class="petal-editor-close" type="button" :disabled="busy" aria-label="Cancel photo crop" @click="cancel"><PhX :size="18" aria-hidden="true" /></button>
          <span class="petals-section-title">Photo memory</span>
          <h3 id="memory-crop-title">Crop this photo</h3>
          <p id="memory-crop-help" class="petal-editor-help">Drag the image to choose what appears in your letter.</p>
          <div ref="viewport" class="memory-crop-viewport" @pointerdown="startDrag" @pointermove="moveDrag" @pointerup="dragging = false" @pointercancel="dragging = false">
            <img :src="source" alt="Photo crop preview" :style="imageStyle" draggable="false" @load="imageLoaded" @error="error = 'This image could not be opened.'; cancel()" />
            <span class="memory-crop-guide" aria-hidden="true"></span>
          </div>
          <label class="memory-crop-zoom">Zoom<input v-model.number="zoom" type="range" min="1" max="2.5" step="0.01" :disabled="!ready || busy" @input="clampOffset" /></label>
          <div class="petal-editor-footer"><span>{{ queue.length ? `${queue.length} more photo${queue.length === 1 ? '' : 's'}` : 'Ready to add' }}</span><button ref="saveButton" class="co-btn-primary" type="button" :disabled="!ready || busy" @click="saveCrop">{{ busy ? 'Saving…' : 'Use this crop' }}</button></div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.upload-zone { padding:22px 18px; border:1px dashed #d8a5a7; border-radius:15px; background:#fffaf9; cursor:pointer; transition:background .2s; }
.upload-zone:hover:not(.is-disabled) { background:#fdf0ef; }.upload-zone:focus-visible { outline:2px solid var(--sp-primary,#5f8872); outline-offset:3px; }.upload-zone.is-disabled { opacity:.5; cursor:not-allowed; }
.upload-empty { display:flex; flex-direction:column; align-items:center; gap:10px; color:#8b7770; }.upload-empty span { color:#b08886; }.upload-empty p { margin:0; font-size:12px; }
.memory-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }.memory-item { position:relative; overflow:hidden; border-radius:12px; }.memory-item img { width:100%; aspect-ratio:1; height:auto; display:block; object-fit:cover; }
.memory-remove { position:absolute; top:5px; right:5px; width:28px; height:28px; padding:0; display:grid; place-items:center; border:1px solid #eadbd6; border-radius:50%; background:#fff; color:#6f6460; cursor:pointer; }
.memory-upload-error { color:#a14f5d; font-size:12px; line-height:1.6; }
.memory-photo-crop { background:#fffaf9; border-color:#eadbd6; }.memory-photo-crop h3 { color:#4f4540; }.memory-photo-crop .memory-crop-viewport img { min-width:0; min-height:0; }
.memory-photo-crop .memory-crop-zoom { color:#6f6460; }.memory-photo-crop input { accent-color:var(--sp-primary,#5f8872); }.memory-photo-crop .co-btn-primary { min-height:44px; padding:12px 18px; border:0; border-radius:12px; background:var(--sp-primary,#5f8872); color:#fff; font:600 12px/1.5 'DM Sans',sans-serif; }.memory-photo-crop .co-btn-primary:disabled { opacity:.5; cursor:wait; }
@media(max-width:480px) { .memory-grid { gap:8px; } }
</style>
