<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PhArrowClockwise, PhCaretDown, PhFlowerTulip, PhInfo, PhCheck } from '@phosphor-icons/vue'
import type { CartItem } from '@/types'
import { bouquetKey } from '@/utils/letterBouquet'

const props = defineProps<{ items: CartItem[]; modelValue: string; loading: boolean; error?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string]; refresh: [] }>()
const eligible = computed(() => props.items.filter(item => item.has360Viewer))
const selected = computed(() => eligible.value.find(item => bouquetKey(item) === props.modelValue) || eligible.value[0])
const imageFailed = ref(false)
watch(() => selected.value?.image, () => { imageFailed.value = false })
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
        <label for="checkout-letter-bouquet">Your 360° bouquet</label>
        <div class="bouquet-choice__select-wrap">
          <select id="checkout-letter-bouquet" :value="modelValue" :disabled="loading || !eligible.length" aria-describedby="checkout-bouquet-help" @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
            <option v-if="!eligible.length" value="">No eligible bouquets yet</option>
            <option v-for="item in items" :key="bouquetKey(item)" :value="bouquetKey(item)" :disabled="!item.has360Viewer">{{ item.name }}{{ item.has360Viewer ? '' : ' — unavailable' }}</option>
          </select>
          <PhCaretDown :size="14" weight="bold" aria-hidden="true" />
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
.bouquet-choice { position:relative; isolation:isolate; margin-bottom:28px; padding:22px; border:1px solid #e6d5df; border-radius:20px; background:linear-gradient(135deg,#fffdfd,#f9f3f7 70%,#f3eef8); box-shadow:0 8px 28px #65446908; color:#57425c; }
.bouquet-choice::before { content:''; position:absolute; z-index:-1; inset:0; border-radius:inherit; background:radial-gradient(ellipse at 100% 0%,#e8dcef66,transparent 60%); pointer-events:none; }
.bouquet-choice__header { display:flex; align-items:center; gap:13px; }
.bouquet-choice__emblem { flex:none; display:grid; place-items:center; width:46px; height:46px; border-radius:15px; border:1px solid #e9dbe7; color:#8c608e; background:#fff9; box-shadow:0 3px 10px #65446906; }
.bouquet-choice__eyebrow { display:block; margin-bottom:5px; font-size:9px; font-weight:700; letter-spacing:.15em; text-transform:uppercase; color:#9b7793; }
.bouquet-choice__header h3 { margin:0; font-family:Georgia,'Times New Roman',serif; font-size:clamp(19px,2vw,23px); font-weight:400; line-height:1.18; letter-spacing:-.025em; color:#644768; }
.bouquet-choice__intro { margin:13px 0 18px; font-size:12px; line-height:1.65; color:#8b778c; }
.bouquet-choice__selection { display:flex; align-items:center; gap:15px; padding:15px; border:1px solid #eadfe8; border-radius:15px; background:#fffdfde0; box-shadow:0 3px 12px #77547004; }
.bouquet-choice__photo { position:relative; flex:none; display:grid; place-items:center; width:66px; height:76px; border-radius:12px; border:1px solid #f0e3e8; background:linear-gradient(145deg,#fcf2f4,#f4edf7); color:#ae849e; }
.bouquet-choice__photo img { width:100%; height:100%; object-fit:contain; padding:5px; border-radius:inherit; }
.bouquet-choice__photo-check { position:absolute; bottom:-5px; right:-5px; width:19px; height:19px; display:grid; place-items:center; border-radius:50%; color:#fff; background:#8d6d92; border:2px solid #fff; }
.bouquet-choice__field { flex:1; min-width:0; }
.bouquet-choice__field label { display:block; margin-bottom:7px; font-size:10px; font-weight:600; color:#a08a9e; letter-spacing:.06em; text-transform:uppercase; }
.bouquet-choice__select-wrap { position:relative; }
.bouquet-choice__select-wrap select { appearance:none; display:block; width:100%; min-height:36px; padding:7px 27px 7px 0; border:0; border-bottom:1px solid #e5d4e1; border-radius:0; outline:none; background:transparent; color:#654b69; font-family:inherit; font-size:13px; font-weight:600; line-height:1.5; cursor:pointer; text-overflow:ellipsis; }
.bouquet-choice__select-wrap select:focus-visible { outline:2px solid #ab86ad; outline-offset:4px; border-radius:4px; }
.bouquet-choice__select-wrap select:disabled { color:#9b8b9f; opacity:1; cursor:default; }
.bouquet-choice__select-wrap > svg { position:absolute; right:0; top:11px; color:#98739b; pointer-events:none; }
.bouquet-choice__status { display:flex; align-items:center; gap:6px; margin-top:9px; color:#9a899d; font-size:10px; line-height:1.5; }
.bouquet-choice__status-dot { flex:none; width:5px; height:5px; border-radius:50%; background:#c5b6c8; }
.bouquet-choice__status.is-ready { color:#8d7091; }
.bouquet-choice__status.is-ready .bouquet-choice__status-dot { background:#9c80a1; box-shadow:0 0 0 3px #9c80a114; }
.bouquet-choice__footer { display:flex; align-items:flex-start; gap:14px; margin-top:16px; }
.bouquet-choice__footer p { display:flex; flex:1; gap:7px; margin:0; color:#9a879a; font-size:10px; line-height:1.7; }
.bouquet-choice__footer p > svg { flex:none; margin-top:1px; color:#b19bae; }
.bouquet-choice__footer button { display:inline-flex; flex:none; align-items:center; justify-content:center; gap:5px; min-height:32px; padding:5px 10px; border:1px solid #e6d8e4; border-radius:999px; background:#fff9; color:#957597; font-family:inherit; font-size:10px; font-weight:600; cursor:pointer; transition:background .2s,border-color .2s; }
.bouquet-choice__footer button:hover:not(:disabled) { background:#fff; border-color:#bfa4c0; }
.bouquet-choice__footer button:focus-visible { outline:2px solid #ab86ad; outline-offset:3px; }
.bouquet-choice__footer button:disabled { cursor:wait; opacity:.65; }
.bouquet-choice__error { margin:12px 0 0; padding:10px 12px; border-radius:10px; background:#fcecef; color:#a8546e; font-size:11px; line-height:1.6; }
.is-spinning { animation:bouquet-refresh-spin 1.3s linear infinite; }
@keyframes bouquet-refresh-spin { to { transform:rotate(360deg); } }
@media (max-width:480px) { .bouquet-choice { padding:17px; border-radius:17px; }.bouquet-choice__header h3 { font-size:20px; }.bouquet-choice__selection { padding:12px; gap:12px; }.bouquet-choice__photo { width:54px; height:66px; }.bouquet-choice__footer { gap:8px; } }
@media (max-width:360px) { .bouquet-choice__footer { flex-direction:column; }.bouquet-choice__footer button { align-self:flex-end; } }
@media (prefers-reduced-motion:reduce) { .is-spinning { animation:none; } }
</style>
