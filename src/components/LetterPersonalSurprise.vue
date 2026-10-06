<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { PhHeart, PhArrowRight } from '@phosphor-icons/vue'
import type { LetterSurprise } from '@/utils/letterSurprise'
defineProps<{ surprise: LetterSurprise; preview?: boolean }>()
const opened = ref(false)
const content = ref<HTMLElement | null>(null)
async function reveal() { opened.value = true; await nextTick(); content.value?.focus({ preventScroll: true }) }
</script>
<template>
  <section class="personal-surprise" :class="{ 'is-open': opened || preview }" aria-label="A personal surprise from your sender">
    <template v-if="!opened && !preview">
      <span class="personal-surprise-seal"><PhHeart :size="26" weight="duotone" aria-hidden="true" /></span>
      <p class="personal-surprise-overline">SAVED JUST FOR YOU</p>
      <h3>A little moment.<br />A lasting feeling.</h3>
      <p class="personal-surprise-intro">Your sender left something special at the end.</p>
      <button type="button" @click="reveal">One more thing…<PhArrowRight :size="18" aria-hidden="true" /></button>
    </template>
    <div v-else ref="content" class="personal-surprise-content" role="region" aria-label="Your final surprise" tabindex="-1">
      <p class="personal-surprise-overline">A MOMENT TO KEEP</p>
      <figure v-if="surprise.photo" class="personal-surprise-photo"><img :src="surprise.photo" alt="A personal photo chosen by your sender" /></figure>
      <span v-else class="personal-surprise-seal"><PhHeart :size="26" weight="duotone" aria-hidden="true" /></span>
      <h3>{{ surprise.title }}</h3>
      <p class="personal-surprise-message">{{ surprise.message }}</p>
      <span class="personal-surprise-signature">A little piece of my heart, kept with you.</span>
    </div>
  </section>
</template>
<style scoped>
.personal-surprise { position:relative; isolation:isolate; width:100%; max-width:520px; margin:28px auto; padding:clamp(26px,6vw,44px); border:1px solid #dfbeb4; border-radius:24px; background:radial-gradient(ellipse at top,#fae4e8,transparent 65%),#fffaf5; color:#513e3e; text-align:center; box-sizing:border-box; box-shadow:0 16px 44px #95656314; }
.personal-surprise::before { content:""; position:absolute; inset:10px; border:1px solid #ecd6cb; border-radius:16px; pointer-events:none; z-index:-1; }
.personal-surprise-seal { display:grid; place-items:center; width:64px; height:64px; margin:8px auto 22px; border:1px solid #e8bcc5; border-radius:50%; background:#fbeef0; color:#9b5263; }
.personal-surprise .personal-surprise-overline { font:600 9px/1.6 'DM Sans',sans-serif; letter-spacing:.22em; color:#965365; margin:0 0 20px; }
.personal-surprise h3 { font:400 clamp(28px,5vw,38px)/1.15 'Cormorant Garamond',Georgia,serif; margin:0 0 18px; overflow-wrap:anywhere; color:#513e3e; }
.personal-surprise-intro { font:14px/1.8 'DM Sans',sans-serif; color:#76615f; }
.personal-surprise button { display:inline-flex; align-items:center; justify-content:center; gap:14px; min-height:46px; padding:12px 22px; margin-top:12px; border:1px solid #557561; border-radius:999px; background:#557561; color:white; font:600 13px/1.5 'DM Sans',sans-serif; cursor:pointer; }
.personal-surprise button:focus-visible { outline:2px solid #9b5263; outline-offset:4px; }
.personal-surprise-photo { margin:0 0 28px; padding:8px 8px 22px; background:#fffdf9; border:1px solid #ecd6cb; box-shadow:0 8px 24px #805a4d17; transform:rotate(-2deg); }
.personal-surprise-photo img { width:100%; aspect-ratio:3/2; object-fit:cover; display:block; }
.personal-surprise .personal-surprise-message { font:16px/1.85 'DM Sans',sans-serif; color:#624e4c; white-space:pre-wrap; overflow-wrap:anywhere; margin:0; }
.personal-surprise-signature { display:block; margin-top:26px; font:italic 16px/1.5 Georgia,serif; color:#986570; }
.is-open .personal-surprise-content { animation:surprise-unfold .6s ease both; }
@keyframes surprise-unfold { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
@media(prefers-reduced-motion:reduce) { .is-open .personal-surprise-content { animation:none; } }
</style>
