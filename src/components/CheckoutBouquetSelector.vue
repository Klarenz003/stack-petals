<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PhArrowClockwise, PhCaretDown, PhFlowerTulip, PhInfo, PhCheck } from '@phosphor-icons/vue'
import type { CartItem } from '@/types'
import { bouquetKey } from '@/utils/letterBouquet'

const props = defineProps<{ items: CartItem[]; modelValue: string; loading: boolean; error?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string]; refresh: [] }>()
const eligible = computed(() => props.items.filter(item => item.has360Viewer))
const selected = computed(() => eligible.value.find(item => bouquetKey(item) === props.modelValue) || eligible.value[0])
const imageFailed = ref(false)
watch(() => selected.value?.image, () => { imageFailed.value = false })
const menuOpen = ref(false)
const menuRoot = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const optionElements = ref<HTMLElement[]>([])
const disabled = computed(() => props.loading || !eligible.value.length)
const isSelected = (item: CartItem) => !!selected.value && bouquetKey(item) === bouquetKey(selected.value)

async function openMenu(last = false) {
  if (disabled.value) return
  menuOpen.value = true
  await nextTick()
  const index = last ? -1 : props.items.findIndex(isSelected)
  const indices = props.items.flatMap((item, i) => item.has360Viewer ? [i] : [])
  const fallback = last ? indices[indices.length - 1] : indices[0]
  optionElements.value[index >= 0 ? index : fallback]?.focus()
}

function closeMenu(restoreFocus = false) {
  menuOpen.value = false
  if (restoreFocus) trigger.value?.focus()
}

function choose(item: CartItem) {
  if (!item.has360Viewer) return
  emit('update:modelValue', bouquetKey(item))
  closeMenu(true)
}

function handleMenuKey(event: KeyboardEvent, index: number) {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeMenu(true); return }
  if (event.key === 'Tab') { closeMenu(); return }
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); const item = props.items[index]; if (item) choose(item); return }
  const indices = props.items.flatMap((item, i) => item.has360Viewer ? [i] : [])
  const position = indices.indexOf(index)
  let target: number | undefined
  if (event.key === 'ArrowDown') target = indices[(position + 1) % indices.length]
  else if (event.key === 'ArrowUp') target = indices[(position - 1 + indices.length) % indices.length]
  else if (event.key === 'Home') target = indices[0]
  else if (event.key === 'End') target = indices[indices.length - 1]
  if (target !== undefined) { event.preventDefault(); optionElements.value[target]?.focus() }
}

function handleOutside(event: PointerEvent) {
  if (!menuRoot.value?.contains(event.target as Node)) closeMenu()
}
function handleFocusOut(event: FocusEvent) {
  if (!menuRoot.value?.contains(event.relatedTarget as Node | null)) closeMenu()
}
watch(disabled, value => { if (value) closeMenu() })
onMounted(() => document.addEventListener('pointerdown', handleOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', handleOutside))
</script>

<template>
  <section class="bouquet-choice" aria-labelledby="bouquet-choice-title" :aria-busy="loading">
    <div class="bouquet-choice__header">
      <span class="bouquet-choice__emblem" aria-hidden="true"><PhArrowClockwise :size="24" weight="light" /></span>
      <div>
        <span class="bouquet-choice__eyebrow">A little extra magic</span>
        <h3 id="bouquet-choice-title">Every angle, a little closer.</h3>
      </div>
    </div>
    <p class="bouquet-choice__intro">Choose the bouquet to bring to life inside your letter.</p>

    <div class="bouquet-choice__selection">
      <div class="bouquet-choice__photo" aria-hidden="true">
        <img v-if="selected?.image && !imageFailed" :src="selected.image" alt="" @error="imageFailed = true" />
        <PhFlowerTulip v-else :size="34" weight="light" />
        <span v-if="selected" class="bouquet-choice__photo-check"><PhCheck :size="11" weight="bold" /></span>
      </div>
      <div class="bouquet-choice__field">
        <label id="checkout-bouquet-label" for="checkout-letter-bouquet">Your 360° bouquet</label>
        <div ref="menuRoot" class="bouquet-choice__select-wrap" @focusout="handleFocusOut">
          <button ref="trigger" id="checkout-letter-bouquet" type="button" class="bouquet-choice__trigger" :class="{ 'is-open': menuOpen }" :disabled="disabled" aria-haspopup="listbox" :aria-expanded="menuOpen" aria-controls="checkout-bouquet-options" aria-labelledby="checkout-bouquet-label checkout-bouquet-value" aria-describedby="checkout-bouquet-help" @click="menuOpen ? closeMenu() : openMenu()" @keydown.down.prevent="openMenu()" @keydown.up.prevent="openMenu(true)" @keydown.esc.stop.prevent="closeMenu()">
            <span id="checkout-bouquet-value">{{ selected?.name || 'No eligible bouquets yet' }}</span>
            <PhCaretDown :size="14" weight="bold" aria-hidden="true" />
          </button>
          <ul v-if="menuOpen" id="checkout-bouquet-options" class="bouquet-choice__menu" role="listbox" aria-labelledby="checkout-bouquet-label">
            <li v-for="(item, index) in items" :key="bouquetKey(item)" :ref="element => { if (element) optionElements[index] = element as HTMLElement }" role="option" tabindex="-1" :aria-selected="isSelected(item)" :aria-disabled="!item.has360Viewer" class="bouquet-choice__option" :class="{ 'is-selected': isSelected(item), 'is-unavailable': !item.has360Viewer }" @click="choose(item)" @keydown="handleMenuKey($event, index)">
              <span class="bouquet-choice__option-icon" aria-hidden="true"><PhFlowerTulip :size="18" weight="light" /></span>
              <span class="bouquet-choice__option-copy"><span>{{ item.name }}</span><small>{{ item.has360Viewer ? 'Available for your letter' : '360° unavailable' }}</small></span>
              <PhCheck v-if="isSelected(item)" :size="16" weight="bold" aria-hidden="true" />
            </li>
          </ul>
        </div>
        <span class="bouquet-choice__status" :class="{ 'is-ready': eligible.length && !loading }" role="status">
          <span aria-hidden="true" class="bouquet-choice__status-dot"></span>
          {{ loading ? 'Checking availability' : eligible.length ? 'One bouquet · selected for your letter' : '360° not available for these products' }}
        </span>
      </div>
    </div>

    <div class="bouquet-choice__footer">
      <p id="checkout-bouquet-help"><PhInfo :size="16" aria-hidden="true" /><span>{{ eligible.length ? 'The 360° experience appears once your bouquet’s photos are ready.' : 'Your bouquet photo will still appear in the letter. A 360° view requires an eligible product.' }}</span></p>
      <button type="button" :disabled="loading" @click="emit('refresh')" aria-label="Refresh bouquet 360 degree eligibility">
        <PhArrowClockwise :size="14" :class="{ 'is-spinning': loading }" aria-hidden="true" />
        {{ loading ? 'Checking…' : 'Refresh' }}
      </button>
    </div>
    <p v-if="error" class="bouquet-choice__error" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.bouquet-choice { position:relative; isolation:isolate; margin-bottom:28px; padding:22px; border:1px solid #eadbd6; border-radius:20px; background:linear-gradient(135deg,#fffaf9,#fdf0ef 70%,#fdf0ef); box-shadow:0 8px 28px #2d282508; color:#2d2825; }
.bouquet-choice::before { content:''; position:absolute; z-index:-1; inset:0; border-radius:inherit; background:radial-gradient(ellipse at 100% 0%,#eadbd666,transparent 60%); pointer-events:none; }
.bouquet-choice__header { display:flex; align-items:center; gap:13px; }
.bouquet-choice__emblem { flex:none; display:grid; place-items:center; width:46px; height:46px; border-radius:15px; border:1px solid #eadbd6; color:#6f6460; background:#fff9; box-shadow:0 3px 10px #2d282506; }
.bouquet-choice__eyebrow { display:block; margin-bottom:5px; font-size:9px; font-weight:700; letter-spacing:.15em; text-transform:uppercase; color:#6f6460; }
.bouquet-choice__header h3 { margin:0; font-family:Georgia,'Times New Roman',serif; font-size:clamp(19px,2vw,23px); font-weight:400; line-height:1.18; letter-spacing:-.025em; color:#2d2825; }
.bouquet-choice__intro { margin:13px 0 18px; font-size:12px; line-height:1.65; color:#6f6460; }
.bouquet-choice__selection { display:flex; align-items:flex-start; gap:15px; padding:15px; border:1px solid #eadbd6; border-radius:15px; background:#fffaf9e0; box-shadow:0 3px 12px #6f646004; }
.bouquet-choice__photo { position:relative; flex:none; display:grid; place-items:center; width:66px; height:76px; border-radius:12px; border:1px solid #eadbd6; background:linear-gradient(145deg,#fffaf9,#fdf0ef); color:#8b7770; }
.bouquet-choice__photo img { width:100%; height:100%; object-fit:contain; padding:5px; border-radius:inherit; }
.bouquet-choice__photo-check { position:absolute; bottom:-5px; right:-5px; width:19px; height:19px; display:grid; place-items:center; border-radius:50%; color:#fff; background:var(--sp-primary, #5f8872); border:2px solid #fff; }
.bouquet-choice__field { flex:1; min-width:0; }
.bouquet-choice__field label { display:block; margin-bottom:7px; font-size:10px; font-weight:600; color:#8b7770; letter-spacing:.06em; text-transform:uppercase; }
.bouquet-choice__select-wrap { position:relative; }
.bouquet-choice__trigger { display:flex; align-items:center; justify-content:space-between; gap:10px; width:100%; min-height:44px; padding:10px 12px; border:1px solid #eadbd6; border-radius:11px; background:#fffaf9; color:#2d2825; font-family:inherit; font-size:13px; font-weight:600; line-height:1.5; text-align:left; cursor:pointer; transition:background .2s,border-color .2s; }
.bouquet-choice__trigger > span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.bouquet-choice__trigger > svg { flex:none; color:var(--sp-primary, #5f8872); transition:transform .2s; }
.bouquet-choice__trigger:hover:not(:disabled), .bouquet-choice__trigger.is-open { background:#fff; border-color:var(--sp-primary, #5f8872); }
.bouquet-choice__trigger.is-open > svg { transform:rotate(180deg); }
.bouquet-choice__trigger:focus-visible { outline:2px solid var(--sp-primary, #5f8872); outline-offset:3px; }
.bouquet-choice__trigger:disabled { color:#8b7770; cursor:default; background:#fdf0ef; }
.bouquet-choice__menu { list-style:none; margin:8px 0 0; padding:5px; max-height:260px; overflow-y:auto; overscroll-behavior:contain; border:1px solid #eadbd6; border-radius:13px; background:#fffaf9; box-shadow:0 8px 22px #2d28250a; scrollbar-width:thin; scrollbar-color:#d8a5a7 transparent; }
.bouquet-choice__option { display:flex; align-items:center; gap:10px; min-height:55px; padding:10px; border-radius:9px; cursor:pointer; color:#4f4540; transition:background .15s; }
.bouquet-choice__option + .bouquet-choice__option { margin-top:3px; }
.bouquet-choice__option:hover:not(.is-unavailable), .bouquet-choice__option:focus-visible { background:#fdf0ef; outline:2px solid var(--sp-primary, #5f8872); outline-offset:-2px; }
.bouquet-choice__option.is-selected { background:#edf3ee; color:var(--sp-primary-strong, #4a6b5a); }
.bouquet-choice__option.is-unavailable { opacity:.55; cursor:not-allowed; }
.bouquet-choice__option-icon { display:grid; place-items:center; flex:none; width:30px; height:34px; border:1px solid #eadbd6; border-radius:8px; background:#fff9; color:#8b7770; }
.bouquet-choice__option-copy { display:flex; flex:1; min-width:0; flex-direction:column; gap:3px; font-size:12px; font-weight:600; line-height:1.45; overflow-wrap:anywhere; }
.bouquet-choice__option-copy small { font-size:10px; font-weight:400; color:#8b7770; }.bouquet-choice__option > svg { flex:none; }
.bouquet-choice__status { display:flex; align-items:center; gap:6px; margin-top:9px; color:#6f6460; font-size:10px; line-height:1.5; }
.bouquet-choice__status-dot { flex:none; width:5px; height:5px; border-radius:50%; background:#8b7770; }
.bouquet-choice__status.is-ready { color:#6f6460; }
.bouquet-choice__status.is-ready .bouquet-choice__status-dot { background:var(--sp-primary, #5f8872); box-shadow:0 0 0 3px #5f887214; }
.bouquet-choice__footer { display:flex; align-items:flex-start; gap:14px; margin-top:16px; }
.bouquet-choice__footer p { display:flex; flex:1; gap:7px; margin:0; color:#6f6460; font-size:10px; line-height:1.7; }
.bouquet-choice__footer p > svg { flex:none; margin-top:1px; color:#8b7770; }
.bouquet-choice__footer button { display:inline-flex; flex:none; align-items:center; justify-content:center; gap:5px; min-height:32px; padding:5px 10px; border:1px solid #eadbd6; border-radius:999px; background:#fff9; color:#6f6460; font-family:inherit; font-size:10px; font-weight:600; cursor:pointer; transition:background .2s,border-color .2s; }
.bouquet-choice__footer button:hover:not(:disabled) { background:#fff; border-color:#8b7770; }
.bouquet-choice__footer button:focus-visible { outline:2px solid var(--sp-primary, #5f8872); outline-offset:3px; }
.bouquet-choice__footer button:disabled { cursor:wait; opacity:.65; }
.bouquet-choice__error { margin:12px 0 0; padding:10px 12px; border-radius:10px; background:#fcecef; color:#a8546e; font-size:11px; line-height:1.6; }
.is-spinning { animation:bouquet-refresh-spin 1.3s linear infinite; }
@keyframes bouquet-refresh-spin { to { transform:rotate(360deg); } }
@media (max-width:480px) { .bouquet-choice { padding:17px; border-radius:17px; }.bouquet-choice__header h3 { font-size:20px; }.bouquet-choice__selection { padding:12px; gap:12px; }.bouquet-choice__photo { width:54px; height:66px; }.bouquet-choice__footer { gap:8px; } }
@media (max-width:480px) { .bouquet-choice__menu { width:calc(100% + 66px); margin-left:-66px; } }
@media (max-width:360px) { .bouquet-choice__footer { flex-direction:column; }.bouquet-choice__footer button { align-self:flex-end; } }
@media (prefers-reduced-motion:reduce) { .is-spinning { animation:none; } }
</style>
