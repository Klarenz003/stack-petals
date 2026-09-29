<script setup lang="ts">
import LetterMagicButton from '@/components/LetterMagicButton.vue'
import LetterScreenDots from '@/components/LetterScreenDots.vue'

defineProps<{ backgroundColor: string; screenIndices: number[]; activeScreen: number }>()
const emit = defineEmits<{ next: []; select: [screen: number] }>()
</script>

<template>
  <div class="letter-screen dedication-screen" :style="{ backgroundColor }">
    <div class="screen-content center page2-content">
      <div class="page2-logo-divider"><span></span>&#9829;<span></span></div>
      <div class="page2-flower-wrap" aria-hidden="true"><img src="/images/page2_flower-clean.png" alt="" class="page2-flower" /></div>
      <h2 class="page2-title">Something special<br><em>is waiting for you...</em></h2>
      <div class="page2-divider"><span></span><i>&#9829;</i><span></span></div>
      <p class="page2-sub">Please wait a moment<br>while we prepare your letter &#10022;</p>
      <LetterMagicButton class="letter-magic-action page2-magic-action" label="Continue" @activate="emit('next')" />
    </div>
    <LetterScreenDots :screen-indices="screenIndices" :active-screen="activeScreen" @select="emit('select', $event)" />
  </div>
</template>

<style>
.dedication-screen { --screen-pad-top: clamp(36px, 6.2dvh, 62px); --screen-pad-bottom-base: clamp(72px, 9.8dvh, 90px); --screen-content-gap: clamp(5px, .9dvh, 10px); }
.dedication-screen .screen-content { max-height: none; overflow: visible; }
.page2-content { max-width: min(620px, 100%); }
.page2-logo-divider, .page2-divider { display: grid; grid-template-columns: minmax(48px,1fr) auto minmax(48px,1fr); align-items: center; gap: 12px; width: min(310px,74vw); color: #E59BAA; line-height: 1; }
.page2-logo-divider { margin: clamp(2px,.5dvh,6px) auto; font-size: 13px; }
.page2-logo-divider span, .page2-divider span { height: 1px; background: linear-gradient(90deg,transparent,rgba(212,104,122,.36),transparent); }
.page2-flower-wrap { position: relative; width: min(55vw,248px,25dvh); aspect-ratio: 1; margin: clamp(2px,.4dvh,5px) auto clamp(8px,1.4dvh,16px); display: grid; place-items: center; filter: drop-shadow(0 20px 28px rgba(163,90,105,.14)); animation: page2FlowerFloat 4.8s ease-in-out infinite; }
.page2-flower-wrap::before, .page2-flower-wrap::after { content: ''; position: absolute; inset: 13%; border: 1px solid rgba(255,255,255,.72); border-radius: 50%; opacity: .72; pointer-events: none; animation: page2HaloBreathe 3.8s ease-in-out infinite; }
.page2-flower-wrap::after { inset: 22%; border-color: rgba(229,155,170,.22); animation-delay: 1.1s; }
.page2-flower { width: 100%; height: 100%; object-fit: contain; display: block; pointer-events: none; user-select: none; animation: page2FlowerGlow 3.6s ease-in-out infinite; }
.page2-title { margin: 0; color: #7A3A4A; font-family: 'Cormorant Infant','Cormorant Garamond',serif; font-size: clamp(36px,min(10.8vw,6dvh),62px); font-weight: 500; line-height: .9; letter-spacing: -.018em; text-shadow: 0 2px 0 rgba(255,238,242,.82),0 9px 18px rgba(122,58,74,.12); }
.page2-title em { display: inline-block; margin-top: clamp(1px,.25dvh,4px); color: #D4687A; font-family: inherit; font-style: italic; font-size: clamp(32px,min(9.7vw,5.4dvh),56px); font-weight: 400; line-height: .86; }
.page2-divider { width: min(330px,72vw); margin: clamp(8px,1.3dvh,14px) auto clamp(4px,.75dvh,8px); }
.page2-divider i { position: relative; display: inline-grid; place-items: center; color: #E59BAA; font-style: normal; font-size: clamp(18px,4.4vw,24px); animation: softHeartPulse 2.2s ease-in-out infinite; }
.page2-sub { margin: 0; color: #8F5A66; font-family: 'Cormorant Infant','Cormorant Garamond',serif; font-size: clamp(17px,min(4.4vw,2.35dvh),22px); font-style: italic; line-height: 1.18; }
@keyframes page2FlowerFloat { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-7px) rotate(1.2deg)} }
@keyframes page2HaloBreathe { 0%,100%{transform:scale(.96);opacity:.42} 50%{transform:scale(1.07);opacity:.82} }
@keyframes page2FlowerGlow { 0%,100%{filter:saturate(1) brightness(1)} 50%{filter:saturate(1.08) brightness(1.035)} }
@keyframes softHeartPulse { 0%,100%{transform:translateY(0) scale(1);opacity:.76} 50%{transform:translateY(-1px) scale(1.12);opacity:1} }
@media (max-height:700px) { .dedication-screen{--screen-pad-top:22px;--screen-pad-bottom-base:56px;--screen-content-gap:4px}.page2-flower-wrap{width:min(48vw,210px,22dvh);margin-bottom:8px}.page2-title{font-size:clamp(31px,min(9.6vw,5.2dvh),48px)}.page2-title em{font-size:clamp(27px,min(8.4vw,4.7dvh),42px)}.page2-sub{font-size:clamp(15px,min(4.2vw,2.2dvh),19px)} }
</style>
