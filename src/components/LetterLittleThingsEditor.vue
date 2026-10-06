<script setup lang="ts">
import LetterNoteIcon from './LetterNoteIcon.vue'
import { DEFAULT_PETAL_MESSAGES, DEFAULT_GIFT_NOTE_BODIES } from '@/utils/letterDefaults'
const props = defineProps<{ titles: string[]; messages: string[]; artworks: number[] }>()
const emit = defineEmits<{ 'update:titles': [value: string[]]; 'update:messages': [value: string[]]; 'update:artworks': [value: number[]] }>()
const icons = ['Sun', 'Flower', 'Sparkles', 'Heart', 'Smile', 'Care']
function text(field: 'titles' | 'messages', index: number, event: Event) {
  const values = [...props[field]]; values[index] = (event.target as HTMLInputElement).value
  if (field === 'titles') emit('update:titles', values); else emit('update:messages', values)
}
function choose(index: number, icon: number) { const values = [...props.artworks]; values[index] = icon; emit('update:artworks', values) }
function suggest(index: number) { const values = [...props.messages]; values[index] = DEFAULT_GIFT_NOTE_BODIES[index]; emit('update:messages', values) }
</script>
<template>
  <div class="little-things-grid">
    <section v-for="(defaultTitle, index) in DEFAULT_PETAL_MESSAGES" :key="index" class="little-note" :aria-label="'Little note ' + (index + 1)">
      <header><span class="little-note-art"><LetterNoteIcon :index="artworks[index] ?? index" /></span><span>NOTE {{ String(index + 1).padStart(2, '0') }}<small>{{ icons[artworks[index] ?? index] }} artwork</small></span></header>
      <label class="little-note-field"><span>Title</span><input :value="titles[index]" :aria-label="'Title for note ' + (index + 1)" maxlength="36" :placeholder="defaultTitle" @input="text('titles', index, $event)" /></label>
      <label class="little-note-field"><span>Your words</span><textarea :value="messages[index]" :aria-label="'Body for note ' + (index + 1)" maxlength="60" rows="3" :placeholder="DEFAULT_GIFT_NOTE_BODIES[index]" @input="text('messages', index, $event)"></textarea></label>
      <small class="little-note-count">{{ messages[index]?.length || 0 }} / 60</small>
      <div class="little-note-default"><span v-if="!messages[index]?.trim()">Suggested words will be used.</span><button type="button" :aria-label="'Use suggested words for note ' + (index + 1)" @click="suggest(index)">Use suggested words</button></div>
      <div class="little-note-picker" role="group" :aria-label="'Choose artwork for note ' + (index + 1)"><span>Make it yours</span><div><button v-for="(name, icon) in icons" :key="name" type="button" :title="name" :aria-label="'Use ' + name + ' artwork for note ' + (index + 1)" :aria-pressed="artworks[index] === icon" @click="choose(index, icon)"><LetterNoteIcon :index="icon" /></button></div></div>
    </section>
  </div>
</template>
<style scoped>
.little-things-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin-top:24px; }
.little-note { min-width:0; padding:20px; border:1px solid #ead6cf; border-radius:18px; background:linear-gradient(145deg,#fffdfb,#fff8f6); }
.little-note header { display:flex; align-items:center; gap:12px; margin-bottom:20px; color:#946b6a; font:600 9px/1.7 'DM Sans',sans-serif; letter-spacing:.12em; }
.little-note header small { display:block; font-size:11px; font-weight:400; color:#735f5c; letter-spacing:0; }
.little-note-art { display:grid; place-items:center; width:46px; height:46px; border:1px solid #ebcdd2; border-radius:14px; background:#fbeef0; color:#a25f70; flex:none; }
.little-note-art svg { width:28px; height:28px; }
.little-note-field { display:grid; gap:7px; margin-bottom:14px; }
.little-note-field > span,.little-note-picker > span { color:#735c58; font:600 10px/1.6 'DM Sans',sans-serif; letter-spacing:.04em; }
.little-note-field :is(input,textarea) { width:100%; min-width:0; box-sizing:border-box; padding:11px 12px; border:1px solid #e6d4cd; border-radius:10px; background:#fff; color:#4f3e3b; font:13px/1.7 'DM Sans',sans-serif; }
.little-note-field textarea { resize:vertical; min-height:80px; }
.little-note-field input { font-weight:600; }
.little-note-count { display:block; text-align:right; font:10px/1.5 'DM Sans',sans-serif; color:#8d7069; margin-top:-8px; }
.little-note-default { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:6px; margin-top:8px; color:#6b7766; font:10px/1.6 'DM Sans',sans-serif; }
.little-note-default button { border:0; border-bottom:1px solid #d3b6ae; background:none; padding:4px 0; color:#89615c; font:600 10px/1.6 'DM Sans',sans-serif; cursor:pointer; }
.little-note-picker { margin-top:16px; padding-top:14px; border-top:1px solid #efdfd8; }
.little-note-picker > div { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:5px; margin-top:9px; }
.little-note-picker button { display:grid; place-items:center; width:100%; min-height:40px; padding:7px 2px; border:1px solid #e6d6ce; border-radius:9px; background:#fff; color:#927572; cursor:pointer; }
.little-note-picker button svg { width:24px; height:24px; }
.little-note-picker button[aria-pressed=true] { background:#e8f0e8; border-color:#62836c; color:#41634b; box-shadow:inset 0 0 0 1px #62836c; }
.little-note :is(input,textarea,button):focus-visible { outline:2px solid #62836c; outline-offset:3px; }
@media(max-width:600px) { .little-things-grid { grid-template-columns:1fr; }.little-note-field :is(input,textarea) { font-size:16px; }.little-note-picker button { min-height:44px; } }
</style>
