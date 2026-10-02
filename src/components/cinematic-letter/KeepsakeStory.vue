<script setup lang="ts">
import { PhHeart, PhSparkle, PhArrowUpRight, PhFlower, PhArrowLeft, PhArrowRight, PhArrowClockwise } from '@phosphor-icons/vue'
import { ref, watch } from 'vue'
const props = defineProps<{ bouquetImage?: string }>()
const imageFailed = ref(false)
watch(() => props.bouquetImage, () => { imageFailed.value = false })
</script>
<template>
  <!-- The four-chapter flower letter, six notes, photo memories and final gift chapter. -->
<main class="story" hidden="" id="story" style="display:none;opacity:0;visibility:hidden">
<div aria-hidden="true" class="progress"><div class="progress__fill" id="progress-fill"></div></div>
<div aria-hidden="true" class="story-nav"><span class="story-nav__mark">for you <PhHeart class="ui-icon" aria-hidden="true" :size="'1em'" /></span><span class="story-nav__chapter" id="chapter-indicator">01 / 04 &mdash; THE LETTER</span></div>
<section aria-labelledby="letter-heading" class="chapter letter-section" id="letter-section">
<div class="letter-layout">
<div class="chapter-tag reveal">CHAPTER ONE &nbsp; / &nbsp; THE LETTER</div>
<div aria-label="Interactive fold-out flower letter" class="flower-book" id="flower-book"><svg aria-hidden="true" class="corner-bloom corner-bloom--tl" viewBox="0 0 240 420"><use href="#flower-sprig"></use></svg><svg aria-hidden="true" class="corner-bloom corner-bloom--br" viewBox="0 0 240 420"><use href="#flower-sprig"></use></svg><aside aria-label="Pressed flower illustration page" class="flower-leaf flower-leaf--left"><div class="flower-leaf__front"><div class="flower-leaf__border"></div><span class="flower-leaf__overline">PETAL I &middot; GROW</span><svg aria-hidden="true" class="flower-leaf__sprig flower-leaf__sprig--left" viewBox="0 0 240 420"><use href="#flower-sprig"></use></svg><h3>Keep<br/><em>blooming.</em></h3><p>Every little season deserves a flower.</p><span class="flower-leaf__foot">PRESSED WITH CARE <PhSparkle class="ui-icon" aria-hidden="true" :size="'1em'" /></span></div><div aria-hidden="true" class="flower-leaf__reverse"><svg viewBox="0 0 240 420"><use href="#flower-sprig"></use></svg></div></aside><article aria-label="Your love letter" class="letter-paper reveal">
<div aria-hidden="true" class="letter-paper__sheen"></div>
<div class="paper-top"><svg aria-hidden="true" class="occasion-art--paper" viewBox="0 0 100 100"><use href="#motif-romance" id="paper-motif"></use></svg></div>
<h2 id="letter-heading">My dearest <em data-recipient="">favorite person</em>,</h2>
<p id="letter-paragraph-1">Some people enter our lives and make the ordinary feel a little more beautiful. You have a way of doing that without even trying.</p>
<p id="letter-paragraph-2">I love the little things: our silly conversations, the way you make me smile, and how the simplest moments become memories when they&rsquo;re shared with you.</p>
<p id="letter-paragraph-3">So I made you this tiny corner of the universe, just to remind you how much you mean to me. Whatever comes next, I hope we keep collecting lovely little moments together.</p>
<p class="letter__sign" id="letter-signoff">With all my heart,</p>
<div class="signature" data-sender="">your favorite person</div>
</article><aside aria-label="Discover the flower notes" class="flower-leaf flower-leaf--right"><div class="flower-leaf__front"><div class="flower-leaf__border"></div><span class="flower-leaf__overline">PETAL II &middot; DISCOVER</span><svg aria-hidden="true" class="flower-leaf__sprig flower-leaf__sprig--right" viewBox="0 0 240 420"><use href="#flower-sprig"></use></svg><h3>Six little<br/><em>flowers.</em></h3><p>A tiny garden of thoughts, just for you.</p><button class="flower-leaf__next" id="go-to-blooms" type="button">PICK A PETAL <span aria-hidden="true"><PhArrowUpRight class="ui-icon" aria-hidden="true" :size="'1em'" /></span></button></div><div aria-hidden="true" class="flower-leaf__reverse"><svg viewBox="0 0 240 420"><use href="#flower-sprig"></use></svg></div></aside></div><div class="flower-book__controls reveal"><button aria-pressed="false" class="flower-book__toggle" id="flower-book-toggle" type="button"><PhFlower class="ui-icon" aria-hidden="true" :size="'1em'" />   Unfold the flower pages</button><span aria-hidden="true" class="flower-book__hint">DRAG THE LETTER TO TILT &middot; EXPLORE EACH PAGE</span></div>
<div class="scroll-note reveal">KEEP READING, THERE'S MORE <svg aria-hidden="true" viewBox="0 0 20 34"><path d="M10 1v29m-8-8 8 9 8-9"></path></svg></div>
</div>
</section>
<section aria-labelledby="reasons-heading" class="chapter reasons-section" id="reasons-section">
<div class="reasons-content">
<div class="chapter-tag reveal">CHAPTER TWO &nbsp; / &nbsp; THE LITTLE THINGS</div>
<h2 class="chapter-heading reveal" id="reasons-heading">It's the <em>little things.</em></h2>
<p class="chapter-desc reveal">Six tiny reminders. Tap each one to turn them over.</p>
<div class="reasons-grid">
<button aria-label="Reveal reason one: Your laugh" aria-pressed="false" class="reason-card reveal" type="button">
<span class="reason-card__inner">
<span class="reason-card__face reason-card__front">
<span class="reason-card__number">NOTE NO. 01</span>
<svg aria-hidden="true" class="reason-card__icon" viewBox="0 0 100 100">
<circle cx="50" cy="52" r="20"></circle><path d="M50 4v21M50 79v17M2 52h22m52 0h22M17 19l18 17m30 30 18 18M83 19 65 36M35 68 17 84"></path><path d="M38 50q12-10 24 0" stroke-dasharray="2 5"></path>
</svg>
<span class="reason-card__label">Your laugh</span>
<span class="reason-card__tap">TAP TO UNFOLD   <PhArrowUpRight class="ui-icon" aria-hidden="true" :size="'1em'" /></span>
</span>
<span class="reason-card__face reason-card__back">
<span class="reason-card__number">NOTE NO. 01</span>
<span class="reason-card__label">Your laugh</span>
<p id="reason-1">It has a way of turning an ordinary day into a favorite memory.</p>
<span class="reason-card__tap">TAP TO FOLD BACK &nbsp; &curvearrowleft;</span>
</span>
</span>
</button>
<button aria-label="Reveal reason two: Your kindness" aria-pressed="false" class="reason-card reveal" type="button">
<span class="reason-card__inner">
<span class="reason-card__face reason-card__front">
<span class="reason-card__number">NOTE NO. 02</span>
<svg aria-hidden="true" class="reason-card__icon" viewBox="0 0 100 100">
<path d="M50 94V53m0 20C34 72 28 61 25 50c16 0 25 6 25 23m0-6c16-1 24-11 26-23-16 1-24 9-26 23"></path>
<path d="M50 46C10 67 18 27 40 31c-15-27 15-36 20-10 25-15 37 17 7 23C64 59 51 56 50 46Z" fill="#e6bbc2" fill-opacity=".35"></path>
<path d="M50 45c-18-11-1-25 6-12 13-9 19 13 3 13-2 12-17 8-9-1Z"></path>
<path d="M49 45q7-7 11-2"></path>
</svg>
<span class="reason-card__label">Your kindness</span>
<span class="reason-card__tap">TAP TO UNFOLD   <PhArrowUpRight class="ui-icon" aria-hidden="true" :size="'1em'" /></span>
</span>
<span class="reason-card__face reason-card__back">
<span class="reason-card__number">NOTE NO. 02</span>
<span class="reason-card__label">Your kindness</span>
<p id="reason-2">The thoughtful little things you do stay with me longer than you know.</p>
<span class="reason-card__tap">TAP TO FOLD BACK &nbsp; &curvearrowleft;</span>
</span>
</span>
</button>
<button aria-label="Reveal reason three: Just being you" aria-pressed="false" class="reason-card reveal" type="button">
<span class="reason-card__inner">
<span class="reason-card__face reason-card__front">
<span class="reason-card__number">NOTE NO. 03</span>
<svg aria-hidden="true" class="reason-card__icon" viewBox="0 0 100 100">
<path d="M50 7c1 24 11 35 35 36-24 1-34 12-35 36C49 55 38 44 15 43 39 42 49 31 50 7Z"></path><path d="M18 10c0 8 3 12 11 12-8 0-11 4-11 12 0-8-4-12-12-12 8 0 12-4 12-12ZM80 70c1 8 4 12 12 12-8 0-12 4-12 12 0-8-3-12-11-12 8 0 11-4 11-12Z"></path>
</svg>
<span class="reason-card__label">Being you</span>
<span class="reason-card__tap">TAP TO UNFOLD   <PhArrowUpRight class="ui-icon" aria-hidden="true" :size="'1em'" /></span>
</span>
<span class="reason-card__face reason-card__back">
<span class="reason-card__number">NOTE NO. 03</span>
<span class="reason-card__label">Being you</span>
<p id="reason-3">You make every moment a little brighter simply by showing up as yourself.</p>
<span class="reason-card__tap">TAP TO FOLD BACK &nbsp; &curvearrowleft;</span>
</span>
</span>
</button>
<button aria-label="Reveal reason 4: Your heart" aria-pressed="false" class="reason-card reveal" type="button">
<span class="reason-card__inner">
<span class="reason-card__face reason-card__front">
<span class="reason-card__number">NOTE NO. 04</span>
<svg aria-hidden="true" class="reason-card__icon" viewBox="0 0 100 100"><path d="M50 78C28 63 18 51 18 38c0-10 8-18 18-18 7 0 11 3 14 8 3-5 7-8 14-8 10 0 18 8 18 18 0 13-10 25-32 40Z" fill="#e9c0c8" fill-opacity=".28"></path><path d="M50 29v27m-13-14h26" stroke-linecap="round"></path></svg>
<span class="reason-card__label">Your heart</span>
<span class="reason-card__tap">TAP TO UNFOLD   <PhArrowUpRight class="ui-icon" aria-hidden="true" :size="'1em'" /></span>
</span>
<span class="reason-card__face reason-card__back">
<span class="reason-card__number">NOTE NO. 04</span>
<span class="reason-card__label">Your heart</span>
<p id="reason-4">The warmth in your heart makes everyone around you feel safe, seen, and cared for.</p>
<span class="reason-card__tap">TAP TO FOLD BACK &nbsp; &curvearrowleft;</span>
</span>
</span>
</button>
<button aria-label="Reveal reason 5: Your smile" aria-pressed="false" class="reason-card reveal" type="button">
<span class="reason-card__inner">
<span class="reason-card__face reason-card__front">
<span class="reason-card__number">NOTE NO. 05</span>
<svg aria-hidden="true" class="reason-card__icon" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="#f3dde1" fill-opacity=".36" r="34"></circle><path d="M35 43c3-4 8-4 12 0m9 0c3-4 8-4 12 0M33 57c7 10 23 19 35 0" stroke-linecap="round"></path><path d="M20 16v13m-6-7h13m53 48v11m-6-5h12" stroke-linecap="round"></path></svg>
<span class="reason-card__label">Your smile</span>
<span class="reason-card__tap">TAP TO UNFOLD   <PhArrowUpRight class="ui-icon" aria-hidden="true" :size="'1em'" /></span>
</span>
<span class="reason-card__face reason-card__back">
<span class="reason-card__number">NOTE NO. 05</span>
<span class="reason-card__label">Your smile</span>
<p id="reason-5">Your smile has a way of softening even the hardest days and turning them into something gentle.</p>
<span class="reason-card__tap">TAP TO FOLD BACK &nbsp; &curvearrowleft;</span>
</span>
</span>
</button>
<button aria-label="Reveal reason 6: The way you care" aria-pressed="false" class="reason-card reveal" type="button">
<span class="reason-card__inner">
<span class="reason-card__face reason-card__front">
<span class="reason-card__number">NOTE NO. 06</span>
<svg aria-hidden="true" class="reason-card__icon" viewBox="0 0 100 100"><path d="M16 61c14 0 21-5 27-12m41 12C70 61 63 56 57 49M22 65c11 1 19 8 28 12 9-4 17-11 28-12"></path><path d="M50 58C35 48 30 39 33 32c3-8 13-8 17 0 4-8 14-8 17 0 3 7-2 16-17 26Z" fill="#e9c0c8" fill-opacity=".3"></path><path d="M17 61c4-4 8-7 15-8m51 8c-4-4-8-7-15-8"></path></svg>
<span class="reason-card__label">The way you care</span>
<span class="reason-card__tap">TAP TO UNFOLD   <PhArrowUpRight class="ui-icon" aria-hidden="true" :size="'1em'" /></span>
</span>
<span class="reason-card__face reason-card__back">
<span class="reason-card__number">NOTE NO. 06</span>
<span class="reason-card__label">The way you care</span>
<p id="reason-6">The way you care so deeply is one of the quiet reasons you mean so much to me.</p>
<span class="reason-card__tap">TAP TO FOLD BACK &nbsp; &curvearrowleft;</span>
</span>
</span>
</button>
</div>
<div aria-live="polite" class="bloom-journey reveal" id="bloom-journey" role="status"><span aria-hidden="true" class="bloom-journey__florals" id="bloom-buds"></span><span id="bloom-message">A little garden awaits &middot; 0 of 6 flowers discovered</span></div>
<p class="reasons-footer reveal">And there are still so many more than six... <PhHeart class="ui-icon" aria-hidden="true" :size="'1em'" /></p>
</div>
</section>
<section aria-labelledby="memories-heading" class="chapter memories-section" id="memories-section">
<div class="memories-content">
<div class="chapter-tag reveal">CHAPTER THREE &nbsp; / &nbsp; OUR MEMORIES</div>
<h2 class="chapter-heading reveal" id="memories-heading">Little moments, <em>kept forever.</em></h2>
<p class="chapter-desc reveal">A small gallery of the moments worth returning to.</p>
<div class="memories-shell reveal">
<div class="memories-viewport" id="memories-viewport">
<div aria-live="polite" class="memories-track" id="memories-track"></div>
</div>
<div class="memory-controls">
<button aria-label="Previous memory" class="memory-arrow" id="memory-prev" type="button"><PhArrowLeft class="ui-icon" aria-hidden="true" :size="'1em'" /></button>
<div aria-label="Memory slides" class="memory-dots" id="memory-dots"></div>
<button aria-label="Next memory" class="memory-arrow" id="memory-next" type="button"><PhArrowRight class="ui-icon" aria-hidden="true" :size="'1em'" /></button>
</div>
</div>
</div>
</section>
<section aria-labelledby="final-heading" class="chapter final-section" id="final-section">
<div class="chapter-tag reveal">CHAPTER FOUR &nbsp; / &nbsp; ONE LAST THING</div>
<div class="final__halo reveal">
<svg aria-hidden="true" class="final__flower final__flower--left" viewBox="0 0 240 420"><use href="#flower-sprig"></use></svg>
<svg aria-hidden="true" class="final__flower final__flower--right" viewBox="0 0 240 420"><use href="#flower-sprig"></use></svg>
<div class="final__center">
<span class="eyebrow">P.S. BEFORE YOU GO...</span>
<h2 id="final-heading">One <em>last</em><br>little thing.</br></h2>
<p>There is one more note, and it's the most important one.</p>
<div aria-labelledby="gift-showcase-heading" class="gift-showcase reveal">
<div class="gift-card">
<div class="gift-portrait-wrap">
<img v-if="bouquetImage && !imageFailed" class="gift-portrait gift-bouquet-photo" :src="bouquetImage" alt="Your gift bouquet" loading="lazy" @error="imageFailed = true" />
<svg v-else aria-hidden="true" class="gift-portrait" viewBox="0 0 420 360">
<defs>
<linearGradient id="gift-glow" x1="0" x2="1" y1="0" y2="1">
<stop offset="0%" stop-color="#fff8f6"></stop>
<stop offset="100%" stop-color="#f1d2da"></stop>
</linearGradient>
<linearGradient id="gift-box-front" x1="0" x2="1" y1="0" y2="1">
<stop offset="0%" stop-color="#efcbd3"></stop>
<stop offset="100%" stop-color="#dca2af"></stop>
</linearGradient>
<linearGradient id="gift-lid" x1="0" x2="1" y1="0" y2="1">
<stop offset="0%" stop-color="#f7dce1"></stop>
<stop offset="100%" stop-color="#ebbec8"></stop>
</linearGradient>
<linearGradient id="gift-side" x1="0" x2="1" y1="0" y2="1">
<stop offset="0%" stop-color="#e7b6c2"></stop>
<stop offset="100%" stop-color="#cb8b9a"></stop>
</linearGradient>
</defs>
<ellipse cx="210" cy="298" fill="#9b707722" rx="102" ry="20"></ellipse>
<circle cx="210" cy="172" fill="url(#gift-glow)" opacity=".95" r="128"></circle>
<path d="M132 174 210 134 288 174 210 215Z" fill="url(#gift-lid)" stroke="#c9939f"></path>
<path d="M132 174v65l78 42v-66Z" fill="url(#gift-side)" stroke="#c58b97"></path>
<path d="M288 174v65l-78 42v-66Z" fill="url(#gift-box-front)" stroke="#c58b97"></path>
<path d="M150 163 210 127 270 163 210 198Z" fill="#fff8f7" opacity=".55"></path>
<path d="M201 135h18v145h-18z" fill="#fff8f7" opacity=".92"></path>
<path d="M132 198h156v18H132z" fill="#fff8f7" opacity=".92"></path>
<ellipse cx="182" cy="113" fill="#fff6f4" opacity=".95" rx="35" ry="22" stroke="#d5a4ae"></ellipse>
<ellipse cx="238" cy="113" fill="#fff6f4" opacity=".95" rx="35" ry="22" stroke="#d5a4ae"></ellipse>
<circle cx="210" cy="120" fill="#fffaf8" r="18" stroke="#d4a0ab"></circle>
<path d="M210 120c-9-17-29-35-50-32 8 24 25 38 50 32Zm0 0c9-17 29-35 50-32-8 24-25 38-50 32Z" fill="#ffe8ee" opacity=".9" stroke="#d4a0ab"></path>
<path d="M112 101c14 4 26 15 30 28M306 105c-14 3-26 15-30 28M95 149c10 4 19 12 23 22M325 150c-10 4-20 12-23 22" fill="none" stroke="#d9b3b8" stroke-linecap="round"></path>
<g fill="#fff6f2" stroke="#d2a4ae">
<path d="M103 76c0 9 4 13 12 13-8 0-12 4-12 12 0-8-4-12-12-12 8 0 12-4 12-13Z"></path>
<path d="M320 70c0 10 5 15 15 15-10 0-15 5-15 15 0-10-4-15-14-15 10 0 14-5 14-15Z"></path>
<path d="M329 232c0 7 3 11 10 11-7 0-10 3-10 10 0-7-3-10-10-10 7 0 10-4 10-11Z"></path>
</g>
</svg>
</div>
<h3 class="gift-card__heading" id="gift-showcase-heading">A little <em>gift</em> for you.</h3>
<p class="gift-card__caption">A tiny surprise, wrapped with love. If you're curious, you can open a full 360 view and turn it around from every angle.</p>
<button class="gift-360-button" id="gift360-button" type="button"><span><PhArrowClockwise class="ui-icon" aria-hidden="true" :size="'1em'" /></span> Unwrap &amp; explore 360&deg;</button>
</div>
</div>
<button class="last-button" id="last-button" type="button">UNFOLD THE LAST NOTE   <PhArrowUpRight class="ui-icon" aria-hidden="true" :size="'1em'" /><svg aria-hidden="true" class="petal-button__icon" focusable="false" viewBox="0 0 44 44"><g fill="none" stroke="currentColor" stroke-width="1.4"><path d="M22 19c-7-15 0-19 5-11 4-13 14-8 9 4 12-2 13 10 1 13 6 11-5 17-13 8-8 10-19 3-13-7-13-4-11-14 1-13-1-14 9-18 14-5Z" opacity=".7"></path><path d="M22 24c-6-3-7-13-5-17M23 25c9-2 13-8 13-11M22 25c2 7 8 10 13 9M22 25c-7 2-11 7-10 11M22 25c-3-8-10-10-14-11"></path><circle cx="22" cy="24" fill="currentColor" r="4" stroke="none"></circle></g></svg></button>
<div aria-label="Stack Petals signature" class="brand-signoff reveal">
<span class="brand-signoff__overline">A keepsake by</span>
<img alt="Stack Petals logo" class="brand-logo brand-logo--signature" data-stack-petals-logo=""/>
<div class="brand-signoff__name">Stack Petals</div>
<div class="brand-lockup__tagline">Engineered with <em>Precision</em>, Crafted with <em>Love</em>.</div>
</div>
</div>
</div>
<span class="footer-credit">MADE WITH LOVE. KEPT WITH YOU.</span>
</section>
</main>
</template>
