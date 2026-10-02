<script setup lang="ts">
import { PhSparkle, PhArrowUpRight, PhHeart } from '@phosphor-icons/vue'
</script>
<template>
  <!-- Wax-sealed envelope, occasion picker and cinematic velvet curtain. -->
<section aria-label="A sealed letter for you" class="hero" id="hero">
<div aria-hidden="true" class="hero__header"><div class="monogram">a little love,</div><span class="eyebrow">MADE JUST FOR YOU</span></div>
<svg aria-hidden="true" class="hero__botanical hero__botanical--left" viewBox="0 0 240 420"><use href="#flower-sprig"></use></svg>
<svg aria-hidden="true" class="hero__botanical hero__botanical--right" viewBox="0 0 240 420"><use href="#flower-sprig"></use></svg>
<svg aria-hidden="true" class="hero__top-spark" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 60 60"><use href="#tiny-star"></use></svg>
<span aria-hidden="true" class="side-label">A LITTLE PIECE OF MY HEART &bull; JUST FOR YOU</span>
<div class="hero__copy">
<div class="eyebrow">AN ENVELOPE <span class="star"><PhSparkle class="ui-icon" aria-hidden="true" :size="'1em'" /></span> A SECRET <span class="star"><PhSparkle class="ui-icon" aria-hidden="true" :size="'1em'" /></span> A SMILE</div>
<h1>A letter<br/>for <em>you.</em></h1>
<p class="hero__sub">Because some things deserve to be <i>written from the heart.</i></p>
<svg aria-hidden="true" class="occasion-art"><use href="#motif-romance" id="hero-motif"></use></svg>
<fieldset class="occasion-picker" id="occasion-picker"><legend>Choose the occasion</legend><div class="occasion-picker__choices" id="occasion-choices"></div></fieldset>
</div>
<div class="envelope-stage" id="envelope-stage">
<div aria-hidden="true" class="luxe-envelope-aura"></div>
<div aria-hidden="true" class="luxe-orbit luxe-orbit--outer"></div>
<div aria-hidden="true" class="luxe-orbit luxe-orbit--inner"></div>
<div aria-hidden="true" class="envelope" id="envelope">
<div class="envelope__back"></div>
<div class="envelope__letter" id="envelope-letter">
<svg viewBox="0 0 60 60"><use href="#tiny-heart"></use></svg>
<small>JUST FOR YOU</small><span>with love</span>
</div>
<div class="envelope__front"></div>
<div class="envelope__flap" id="envelope-flap"></div>
</div>
<button aria-label="Break the wax seal and open the letter" class="seal-button" id="seal-button" title="Break the seal" type="button">
<svg aria-hidden="true" viewBox="0 0 100 100">
<defs><radialGradient cx="31%" cy="27%" id="wax"><stop stop-color="#d7a2aa"></stop><stop offset=".65" stop-color="#b77e8d"></stop><stop offset="1" stop-color="#8c5265"></stop></radialGradient></defs>
<path d="M50 3C65 1 67 11 79 15c11 5 7 15 15 25 7 9-2 19-3 28-2 13-13 12-22 22-8 10-18 2-29 7-14 4-17-9-27-16C1 72 8 63 4 50-1 36 12 30 15 19 19 8 32 13 40 6Z" fill="url(#wax)" stroke="#965968" stroke-width="2"></path>
<circle cx="49" cy="49" fill="none" r="33" stroke="#f3dadd" stroke-opacity=".75" stroke-width="1.3"></circle>
<path d="M49 66C40 60 29 51 29 41c0-11 13-13 20-3 7-10 20-8 20 3 0 10-11 19-20 25Z" fill="none" stroke="#fff0e9" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3"></path>
</svg>
</button>
</div>
<button class="open-button" id="open-button" type="button">OPEN YOUR LETTER  <PhArrowUpRight class="ui-icon" aria-hidden="true" :size="'1em'" /><svg aria-hidden="true" class="petal-button__icon" focusable="false" viewBox="0 0 44 44"><g fill="none" stroke="currentColor" stroke-width="1.4"><path d="M22 19c-7-15 0-19 5-11 4-13 14-8 9 4 12-2 13 10 1 13 6 11-5 17-13 8-8 10-19 3-13-7-13-4-11-14 1-13-1-14 9-18 14-5Z" opacity=".7"></path><path d="M22 24c-6-3-7-13-5-17M23 25c9-2 13-8 13-11M22 25c2 7 8 10 13 9M22 25c-7 2-11 7-10 11M22 25c-3-8-10-10-14-11"></path><circle cx="22" cy="24" fill="currentColor" r="4" stroke="none"></circle></g></svg></button>
<p class="hero__hint">psst... tap the little wax seal <PhHeart class="ui-icon" aria-hidden="true" :size="'1em'" /></p>
<span aria-hidden="true" class="bottom-note">HANDMADE WITH LOVE &amp; A LITTLE MAGIC</span>
</section>
<div aria-hidden="true" class="curtain" hidden="" id="curtain">
<div class="curtain__panel curtain__panel--left"></div>
<div class="curtain__panel curtain__panel--right"></div>
<div class="curtain__rod"></div>
<div aria-hidden="true" class="curtain__light"></div>
<div aria-hidden="true" class="curtain__glitter" id="curtain-glitter"></div>
<div class="curtain__title">
<svg class="occasion-art" viewBox="0 0 100 100"><use href="#motif-romance" id="curtain-motif"></use></svg>
<span>OPENING YOUR LETTER</span>
<strong>A moment, just for you.</strong>
</div>
</div>
</template>
