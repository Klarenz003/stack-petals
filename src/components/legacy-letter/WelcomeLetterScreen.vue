<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import LetterMagicButton from '@/components/LetterMagicButton.vue'
import LetterScreenDots from '@/components/LetterScreenDots.vue'
import './opening-slides.css'

defineProps<{
  recipient: string
  backgroundColor: string
  screenIndices: number[]
  activeScreen: number
}>()

const emit = defineEmits<{
  next: []
  select: [screen: number]
}>()

const envelopeImage = ref<HTMLImageElement | null>(null)
let breathingMedia: gsap.MatchMedia | null = null

onMounted(() => {
  breathingMedia = gsap.matchMedia()
  breathingMedia.add('(prefers-reduced-motion: no-preference)', () => {
    if (!envelopeImage.value) return
    gsap.to(envelopeImage.value, {
      scale: 1.035,
      transformOrigin: '50% 50%',
      duration: 2.4,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
  })
})

onBeforeUnmount(() => breathingMedia?.revert())
</script>

<template>
  <div class="letter-screen welcome-screen" :style="{ backgroundColor }">
    <div class="screen-content center">
      <div class="welcome-top-divider"><span></span>&#10022;<span></span></div>
      <div class="recipient-keepsake">For {{ recipient }}</div>
      <div class="welcome-heart-line"><span></span>&#9825;<span></span></div>
      <h1 class="letter-headline">A message<br><em>just for you</em></h1>
      <div class="letter-invitation-card" aria-hidden="true">
        <img ref="envelopeImage" src="/images/envelope-clean.png" alt="" class="letter-envelope-image" />
      </div>
      <div class="blooming-flower" aria-hidden="true">&#127800;</div>
      <div class="letter-divider"><span></span>&#10022;<span></span></div>
      <p class="letter-sub">Someone who admires you<br>has something to share</p>
      <LetterMagicButton class="letter-magic-action page1-magic-action" label="Open your letter" @activate="emit('next')" />
    </div>
    <LetterScreenDots :screen-indices="screenIndices" :active-screen="activeScreen" @select="emit('select', $event)" />
  </div>
</template>

<style>
/* Chapter 1 styles remain local to this screen while the legacy shared stylesheet is migrated. */
.welcome-screen { --screen-pad-top: clamp(22px, 3.8dvh, 36px); --screen-pad-bottom-base: clamp(62px, 8.6dvh, 78px); --screen-content-gap: clamp(2px, 0.45dvh, 6px); position: relative; display: grid; place-items: center; overflow: hidden; }
.welcome-screen .screen-content { width: min(100%, 420px); align-self: center; justify-content: center; align-items: center; max-height: none; overflow: visible; box-sizing: border-box; }
/* Keep the legacy opening readable if the GSAP entrance is interrupted or
   restored from browser history before its completion callback runs. */
.welcome-screen .screen-content {
  opacity: 1 !important;
  visibility: visible !important;
  transform: none !important;
  filter: none !important;
}
.welcome-top-divider, .welcome-heart-line { display: grid; grid-template-columns: minmax(42px, 1fr) auto minmax(42px, 1fr); align-items: center; gap: 10px; width: min(300px, 74vw); color: #D4687A; line-height: 1; }
.welcome-top-divider { margin: clamp(2px, 0.55dvh, 6px) auto clamp(4px, 0.8dvh, 9px); font-size: 12px; opacity: .72; }
.welcome-heart-line { margin: clamp(4px, 0.75dvh, 8px) auto 0; color: #E89AAA; font-size: clamp(18px, min(4.8vw, 2.5dvh), 24px); }
.welcome-top-divider span, .welcome-heart-line span { height: 1px; background: linear-gradient(90deg, transparent, rgba(212,104,122,.42), transparent); }
.welcome-screen .recipient-keepsake { display: inline-flex !important; width: max-content !important; max-width: calc(100% - 32px) !important; min-height: clamp(28px, 4dvh, 38px); margin: 0 auto; padding: 5px 20px; border: 1px solid rgba(232,180,192,.72); border-radius: 999px !important; background: linear-gradient(145deg, rgba(255,255,255,.78), rgba(255,239,243,.58)); box-shadow: 0 14px 30px rgba(212,104,122,.12), inset 0 1px 0 rgba(255,255,255,.88); color: #8F4C5E; font-size: clamp(15px, min(4.3vw, 2.35dvh), 20px); }
.welcome-screen .recipient-keepsake::before, .welcome-screen .recipient-keepsake::after { content: '\2665'; color: #E8A6B4; font-size: 11px; margin: 0 10px; }
.welcome-screen .letter-headline { margin: 0 0 clamp(-8px, -.8dvh, -3px); color: #7A3A4A; font-family: 'Playfair Display','Lora',serif; font-size: clamp(44px, min(13.6vw, 7.4dvh), 72px); font-weight: 400; line-height: .9; text-shadow: 0 2px 0 rgba(255,238,242,.82), 0 9px 18px rgba(122,58,74,.14); }
.welcome-screen .letter-headline em { display: inline-block; margin-top: clamp(1px, .25dvh, 4px); color: #D4687A; font-family: 'Great Vibes','Lora',cursive; font-size: clamp(52px, min(16vw, 8.2dvh), 82px); font-weight: 400; line-height: .72; text-shadow: 0 1px 0 rgba(255,248,249,.8), 0 8px 18px rgba(212,104,122,.12); }
.welcome-screen .letter-invitation-card { width: min(70vw, 310px, 29dvh); height: auto; aspect-ratio: 1.34 / 1; margin: clamp(2px, .4dvh, 5px) auto 0; filter: drop-shadow(0 22px 30px rgba(163,90,105,.18)); }
.welcome-screen .letter-invitation-card { width: min(70vw, 310px, 29dvh) !important; height: auto !important; aspect-ratio: 1 !important; flex: 0 0 auto !important; overflow: hidden; }
.welcome-screen .letter-envelope-image { display: block !important; width: 100% !important; height: 100% !important; max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; position: static !important; }
.welcome-screen .letter-divider { margin: clamp(-2px, -.2dvh, 0px) auto 0; }
.welcome-screen .letter-sub { color: #8F5A66; font-size: clamp(14px, min(3.8vw, 2dvh), 17px); font-style: italic; line-height: 1.24; margin: 0; }
.welcome-screen .screen-content > * { align-self: center !important; position: relative; left: 0 !important; margin-left: auto !important; margin-right: auto !important; }
.welcome-screen .letter-headline,
.welcome-screen .letter-sub { width: 100%; text-align: center; }
.welcome-screen .letter-invitation-card { width: min(70vw, 310px, 29dvh) !important; }
@media (max-width: 680px) {
  .welcome-screen .letter-invitation-card {
    width: min(62vw, 252px, 25dvh) !important;
    height: auto;
    overflow: hidden;
  }
  .welcome-screen .letter-envelope-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
@media (max-height: 700px) { .welcome-screen { --screen-pad-top: 16px; --screen-pad-bottom-base: 52px; --screen-content-gap: 2px; } .welcome-screen .letter-headline { font-size: clamp(34px, min(12vw, 6.2dvh), 50px); } .welcome-screen .letter-headline em { font-size: clamp(42px, min(14vw, 7.2dvh), 58px); } .welcome-screen .letter-invitation-card { width: min(62vw, 252px, 25dvh); } .welcome-heart-line { margin-top: 4px; } .welcome-screen .letter-sub { font-size: 13px; } }
@media (max-width: 680px) and (max-height: 700px) { .welcome-screen .letter-invitation-card { width: min(58vw, 220px, 25dvh) !important; } }
</style>
