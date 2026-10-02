<script setup lang="ts">
// The supplied cinematic experience remains the visual source of truth.
import InvitationAndCurtain from './cinematic-letter/InvitationAndCurtain.vue'
import KeepsakeStory from './cinematic-letter/KeepsakeStory.vue'
import GiftAndSurprise from './cinematic-letter/GiftAndSurprise.vue'
// These DOM controllers are intentionally JavaScript; keep their boundary explicit.
import cinematicStyles from './cinematic-letter/styles/original.css?inline'
import { computed, onBeforeUnmount } from 'vue'
import { useCinematicExperience } from '@/composables/useCinematicExperience'
import type { LetterRecord } from '@/types/letter'
import { configureCinematicLetter } from '@/utils/cinematicLetterConfig'
import { getLetterBouquetAssets } from '@/utils/letterBouquet'

const props = defineProps<{ letter: Partial<LetterRecord>; preview?: boolean; showPicker?: boolean }>()
const root = useCinematicExperience()
const { theme } = configureCinematicLetter(props.letter, props)
const bouquetImage = computed(() => getLetterBouquetAssets(props.letter).image)

// The cinematic stylesheet contains intentionally generic selectors (for example
// `.hero`) because it was originally a standalone page. Keep it mounted only
// while this experience exists so it cannot leak into the storefront homepage.
const CINEMATIC_STYLE_ID = 'stack-petals-cinematic-styles'
let cinematicStyle = document.getElementById(CINEMATIC_STYLE_ID) as HTMLStyleElement | null
let cinematicStyleUsers = Number(cinematicStyle?.dataset.users || 0)
if (!cinematicStyle) {
  cinematicStyle = document.createElement('style')
  cinematicStyle.id = CINEMATIC_STYLE_ID
  cinematicStyle.textContent = cinematicStyles
  document.head.appendChild(cinematicStyle)
}
cinematicStyleUsers += 1
cinematicStyle.dataset.users = String(cinematicStyleUsers)

onBeforeUnmount(() => {
  const style = document.getElementById(CINEMATIC_STYLE_ID) as HTMLStyleElement | null
  if (!style) return
  const users = Math.max(0, Number(style.dataset.users || 1) - 1)
  if (users === 0) style.remove()
  else style.dataset.users = String(users)
})

</script>

<template>
<div ref="root" class="letter-experience" :data-theme="theme">
<svg aria-hidden="true" height="0" style="position:absolute;overflow:hidden" width="0">
<defs>
<symbol id="flower-sprig" viewBox="0 0 240 420">
<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
<path d="M93 412 C106 330 113 258 119 200 S115 90 130 25" stroke-width="1.6"></path>
<path d="M111 291 C70 262 44 222 38 172M116 239 C165 220 180 187 191 132M117 176 C81 147 70 111 65 65" stroke-width="1.25"></path>
<g fill="#d5a8ab" fill-opacity=".35" stroke-width="1">
<path d="M107 326 C77 326 63 304 55 273 C88 272 107 291 107 326Z"></path>
<path d="M109 309 C132 281 154 280 177 287 C160 315 136 329 109 309Z"></path>
<path d="M109 271 C93 245 71 242 53 246 C66 273 85 288 109 271Z"></path>
<path d="M118 226 C140 198 158 198 181 200 C167 227 143 242 118 226Z"></path>
<path d="M115 193 C90 178 79 158 82 139 C103 148 116 167 115 193Z"></path>
<path d="M119 155 C137 130 159 122 176 127 C166 153 142 166 119 155Z"></path>
<path d="M69 232 C39 229 20 210 13 190 C45 187 64 203 69 232Z"></path>
<path d="M178 168 C196 145 220 145 235 154 C219 175 193 185 178 168Z"></path>
<path d="M74 121 C51 117 33 97 31 75 C58 76 74 92 74 121Z"></path>
</g>
<g stroke-width="1.2" transform="translate(130 44)">
<path d="M0-29 C-13-54-36-34-29-14 C-59-18-54 17-29 21 C-39 47-7 51 4 32 C20 55 43 30 28 13 C53 0 38-29 14-24 C10-39-2-39 0-29Z" fill="#e5b6bd" fill-opacity=".45"></path>
<path d="M0-27 C-8-13-18-20-17-7 C-25 0-12 11-4 8 C1 23 16 16 14 5 C26-7 12-13 4-7 C-4-12-8-4-6 1 C0 10 12 5 5-1 C1-5-3 0 1 2"></path>
</g>
<g stroke-width="1.3" transform="translate(40 166) scale(.79)">
<path d="M0-29 C-13-54-36-34-29-14 C-59-18-54 17-29 21 C-39 47-7 51 4 32 C20 55 43 30 28 13 C53 0 38-29 14-24 C10-39-2-39 0-29Z" fill="#e9c7c8" fill-opacity=".58"></path>
<path d="M0-27 C-8-13-18-20-17-7 C-25 0-12 11-4 8 C1 23 16 16 14 5 C26-7 12-13 4-7 C-4-12-8-4-6 1 C0 10 12 5 5-1 C1-5-3 0 1 2"></path>
</g>
<g stroke-width="1.5" transform="translate(192 127) scale(.58)">
<path d="M0-29 C-13-54-36-34-29-14 C-59-18-54 17-29 21 C-39 47-7 51 4 32 C20 55 43 30 28 13 C53 0 38-29 14-24 C10-39-2-39 0-29Z" fill="#e4b7be" fill-opacity=".6"></path>
<path d="M0-27 C-8-13-18-20-17-7 C-25 0-12 11-4 8 C1 23 16 16 14 5 C26-7 12-13 4-7 C-4-12-8-4-6 1 C0 10 12 5 5-1 C1-5-3 0 1 2"></path>
</g>
</g>
</symbol>
<symbol id="tiny-heart" viewBox="0 0 60 60"><path d="M30 47C19 39 9 30 9 20c0-11 15-16 21-3 6-13 21-8 21 3 0 10-10 19-21 27Z" stroke-linecap="round" stroke-linejoin="round"></path></symbol>
<symbol id="tiny-star" viewBox="0 0 60 60"><path d="M30 3c1 17 9 25 26 27-17 1-25 9-26 27C28 39 20 31 3 30 20 28 28 20 30 3Z" stroke-linejoin="round"></path></symbol>
<symbol id="motif-romance" viewBox="0 0 100 100"><path d="M50 82C24 63 12 49 12 34c0-23 27-30 38-10 11-20 38-13 38 10 0 15-12 29-38 48Z"></path><path d="M50 74C30 59 21 48 21 35"></path></symbol>
<symbol id="motif-sympathy" viewBox="0 0 100 100"><path d="M50 87V43m0 15C28 57 18 43 20 27c18 0 29 10 30 31Zm0-11c21 0 31-11 30-26-18 0-29 10-30 26Z"></path><path d="M20 90c21-9 39-9 60 0M50 43c-7-17-3-27 0-34 7 12 9 22 0 34Z"></path></symbol>
<symbol id="motif-birthday" viewBox="0 0 100 100"><path d="M19 62c0 14 15 24 31 24s31-10 31-24V50H19v12Zm0-12c0-10 14-16 31-16s31 6 31 16M50 34V20m-4-4c0-5 4-9 4-9s4 4 4 9c0 3-2 5-4 5s-4-2-4-5ZM20 61c12 7 19-6 30 0 11 6 18-7 30 0"></path><path d="M13 22l3 3m68-2 3-3M75 11l-1 5"></path></symbol>
<symbol id="motif-family" viewBox="0 0 100 100"><path d="M12 47 50 16l38 31M21 42v43h58V42M39 85V61h22v24"></path><path d="M50 51c-15-11-17-19-12-24 5-5 10-1 12 3 2-4 7-8 12-3 5 5 3 13-12 24Z"></path></symbol>
<symbol id="motif-friendship" viewBox="0 0 100 100"><path d="M14 55c6-13 17-16 28-7l8 8 8-8c11-9 22-6 28 7L65 79H35L14 55Z"></path><path d="M50 56 38 67m12-11 12 11M15 26l5 5m60-5-5 5M50 12v9"></path></symbol>
<symbol id="motif-graduation" viewBox="0 0 100 100"><path d="m10 38 40-20 40 20-40 20-40-20Z"></path><path d="M25 47v20c14 11 36 11 50 0V47M90 39v25"></path><circle cx="90" cy="68" r="3"></circle></symbol>
<symbol id="motif-other" viewBox="0 0 100 100"><path d="M50 7 59 39 92 50 59 60 50 93 40 60 8 50 40 39Z"></path><path d="M50 25v50M25 50h50"></path></symbol>
</defs>
</svg>
<div aria-hidden="true" class="grain"></div>
<div aria-hidden="true" class="petal-field" id="petal-field"></div>
<div aria-hidden="true" class="luxe-atmosphere">
<div class="luxe-atmosphere__halo"></div>
<div class="luxe-atmosphere__halo luxe-atmosphere__halo--second"></div>
<div class="luxe-atmosphere__stars" id="luxe-stars"></div>
</div>
  <InvitationAndCurtain />
  <KeepsakeStory :bouquet-image="bouquetImage" />
  <GiftAndSurprise />
</div>
</template>

<style scoped>
.letter-experience { width:100%; min-height:100svh; overflow-x:clip; }
.letter-experience[data-theme="graduation"] { --occasion-canvas:#f2eff8; --occasion-paper:#fffdfb; --occasion-accent:#72588f; --occasion-soft:#ddd2ec; --occasion-deep:#403650; --occasion-glow:#fbf8ff; --occasion-edge:#e5dff0; --occasion-motif:#a78ac3; --canvas:var(--occasion-canvas); --paper:var(--occasion-paper); --rose:var(--occasion-motif); --rose-deep:var(--occasion-accent); --blush:var(--occasion-soft); --text:var(--occasion-deep); }
</style>
