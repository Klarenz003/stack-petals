<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { PhCaretDown, PhCheck, PhSparkle, PhSortAscending, PhSortDescending, PhTextAa } from '@phosphor-icons/vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const options = [
  { value: 'featured', label: 'Featured first', detail: 'Our handpicked highlights', icon: PhSparkle },
  { value: 'price-low', label: 'Price: low to high', detail: 'Start with the little treasures', icon: PhSortAscending },
  { value: 'price-high', label: 'Price: high to low', detail: 'Discover the grand gestures', icon: PhSortDescending },
  { value: 'name', label: 'Name: A to Z', detail: 'Find your favorites alphabetically', icon: PhTextAa },
]
const selected = computed(() => options.find(option => option.value === props.modelValue) || options[0]!)
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const optionElements = ref<HTMLElement[]>([])

async function show(last = false) {
  open.value = true
  await nextTick()
  optionElements.value[last ? options.length - 1 : options.indexOf(selected.value)]?.focus()
}
function close(restore = false) {
  open.value = false
  if (restore) trigger.value?.focus()
}
function choose(index: number) {
  const option = options[index]
  if (option) emit('update:modelValue', option.value)
  close(true)
}
function navigate(event: KeyboardEvent, index: number) {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); return }
  // Return focus before the native Tab action so it continues from the trigger.
  if (event.key === 'Tab') { close(true); return }
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(index); return }
  let next: number | undefined
  if (event.key === 'ArrowDown') next = (index + 1) % options.length
  if (event.key === 'ArrowUp') next = (index + options.length - 1) % options.length
  if (event.key === 'Home') next = 0
  if (event.key === 'End') next = options.length - 1
  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    next = options.findIndex((_, offset) => {
      const candidate = options[(index + offset + 1) % options.length]
      return candidate?.label.toLowerCase().startsWith(event.key.toLowerCase())
    })
    if (next >= 0) next = (index + next + 1) % options.length
    else next = undefined
  }
  if (next !== undefined) { event.preventDefault(); optionElements.value[next]?.focus() }
}
function outside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) close()
}
function focusOut(event: FocusEvent) {
  if (!root.value?.contains(event.relatedTarget as Node | null)) close()
}
onMounted(() => document.addEventListener('pointerdown', outside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', outside))
</script>

<template>
  <div ref="root" class="catalog-sort" @focusout="focusOut">
    <span id="catalog-sort-label" class="catalog-sort__label">Sort by</span>
    <button ref="trigger" type="button" class="catalog-sort__trigger" :class="{ 'is-open': open }" aria-haspopup="listbox" :aria-expanded="open" aria-controls="catalog-sort-options" aria-labelledby="catalog-sort-label catalog-sort-value" @click="open ? close() : show()" @keydown.down.prevent="show()" @keydown.up.prevent="show(true)">
      <component :is="selected.icon" :size="18" weight="duotone" aria-hidden="true" />
      <span id="catalog-sort-value">{{ selected.label }}</span>
      <PhCaretDown :size="13" weight="regular" class="catalog-sort__caret" aria-hidden="true" />
    </button>
    <Transition name="catalog-menu">
      <div v-if="open" class="catalog-sort__panel">
        <div class="catalog-sort__heading">A fresh perspective<span>Arrange the collection your way</span></div>
        <ul id="catalog-sort-options" role="listbox" aria-labelledby="catalog-sort-label" class="catalog-sort__options">
          <li v-for="(option, index) in options" :key="option.value" :ref="element => { if (element) optionElements[index] = element as HTMLElement }" role="option" tabindex="-1" :aria-selected="modelValue === option.value" class="catalog-sort__option" @click="choose(index)" @keydown="navigate($event, index)">
            <span class="catalog-sort__icon"><component :is="option.icon" :size="20" weight="duotone" aria-hidden="true" /></span>
            <span class="catalog-sort__copy"><span>{{ option.label }}</span><small>{{ option.detail }}</small></span>
            <span class="catalog-sort__check" aria-hidden="true"><PhCheck v-if="modelValue === option.value" :size="12" weight="bold" /></span>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.catalog-sort { position:relative; display:flex; align-items:center; gap:12px; flex:none; font-family:inherit; }
.catalog-sort__label { font-size:11px; color:#796b63; white-space:nowrap; }
.catalog-sort__trigger { display:flex; align-items:center; gap:10px; min-height:44px; min-width:196px; padding:11px 14px; border:1px solid #e4d3ca; border-radius:12px; background:#fcf5ef; color:#514a43; font-family:inherit; font-size:12px; font-weight:500; line-height:1.4; cursor:pointer; transition:border-color .2s,background .2s,box-shadow .2s; }
.catalog-sort__trigger > svg { flex:none; color:#5f8872; }
.catalog-sort__trigger:hover,.catalog-sort__trigger.is-open { border-color:#8da995; background:#f4f7f0; box-shadow:0 3px 12px #45634f0a; }
.catalog-sort__trigger:focus-visible { outline:2px solid #5f8872; outline-offset:3px; }
.catalog-sort__caret { margin-left:auto; transition:transform .2s; }
.is-open .catalog-sort__caret { transform:rotate(180deg); }
.catalog-sort__panel { position:absolute; z-index:130; top:calc(100% + 12px); right:0; width:312px; max-width:calc(100vw - 32px); padding:8px; border:1px solid #e4d4cc; border-radius:20px; background:#fffcf8; box-shadow:0 18px 50px #4b39301c,0 3px 10px #4b393008; }
.catalog-sort__heading { padding:12px 12px 15px; margin-bottom:6px; border-bottom:1px solid #eee1d9; color:#486851; font-family:Georgia,serif; font-size:19px; line-height:1.3; }
.catalog-sort__heading span { display:block; margin-top:5px; color:#847369; font:400 11px/1.5 sans-serif; }
.catalog-sort__options { list-style:none; margin:0; padding:0; }
.catalog-sort__option { display:flex; align-items:center; gap:11px; min-height:64px; padding:10px; border-radius:12px; color:#554c45; cursor:pointer; transition:background .15s; }
.catalog-sort__option + .catalog-sort__option { margin-top:3px; }
.catalog-sort__option:hover { background:#fbefeb; }
.catalog-sort__option:focus { outline:2px solid #6b9179; outline-offset:-2px; background:#f3f6ef; }
.catalog-sort__option[aria-selected=true] { background:#eaf1e8; color:#365a43; }
.catalog-sort__icon { flex:none; display:grid; place-items:center; width:36px; height:36px; border:1px solid #e6d8d0; border-radius:11px; color:#aa7880; background:#fff9f5; }
[aria-selected=true] .catalog-sort__icon { border-color:#cbdcca; background:#f8fbf6; color:#5f8872; }
.catalog-sort__copy { display:flex; flex:1; min-width:0; flex-direction:column; gap:4px; font-size:12px; font-weight:600; line-height:1.4; }
.catalog-sort__copy small { font-size:10px; font-weight:400; color:#796e63; }
.catalog-sort__check { flex:none; display:grid; place-items:center; width:20px; height:20px; border-radius:50%; }
[aria-selected=true] .catalog-sort__check { background:#5f8872; color:white; }
.catalog-menu-enter-active,.catalog-menu-leave-active { transition:opacity .16s,transform .16s; transform-origin:top right; }
.catalog-menu-enter-from,.catalog-menu-leave-to { opacity:0; transform:translateY(-5px) scale(.98); }
@media(max-width:700px) {
  .catalog-sort { justify-content:space-between; width:100%; }
  .catalog-sort__trigger { min-width:0; min-height:46px; flex:1; max-width:240px; font-size:13px; }
  .catalog-sort__panel { width:100%; max-width:none; }
}
@media(prefers-reduced-motion:reduce) { .catalog-sort *, .catalog-menu-enter-active,.catalog-menu-leave-active { transition:none; } }
</style>
