<script setup lang="ts">
import type { Stem } from '@/utils/townStory'
withDefaults(defineProps<{ stems: Stem[]; wrapping: string; small?: boolean }>(), { small: false })
const colours = { pink: '#e498b4', blue: '#95b9d7', sun: '#edc66d' }
</script>
<template>
  <svg class="town-made-bouquet" :class="{ small }" viewBox="0 0 120 140" shape-rendering="crispEdges" aria-hidden="true">
    <path d="M59 90L35 43M60 94L60 33M62 92L86 44" stroke="#739268" stroke-width="5" />
    <path d="M48 67H35V57H43V61H48ZM73 63H87V54H80V58H73Z" fill="#9bb57a" />
    <g v-for="(stem, index) in stems" :key="index" :transform="`translate(${[34,60,86][index]} ${[44,30,44][index]})`"><path d="M-6 -19H6V-13H13V-6H19V6H13V13H6V19H-6V13H-13V6H-19V-6H-13V-13H-6Z" :fill="colours[stem]" /><path d="M-3 -13H3V-6H10V3H3V10H-6V3H-10V-6H-3Z" fill="#ffffff35" /><rect x="-5" y="-5" width="10" height="10" fill="#f9e9ac" /></g>
    <path d="M23 70L60 86L97 70L77 129H44Z" :fill="wrapping === 'sage' ? '#a8ba97' : wrapping === 'rose' ? '#d69ab0' : '#e7d4b7'" />
    <path d="M23 70L60 86L45 103ZM97 70L60 86L77 103Z" fill="#fff8ed65" />
    <path d="M43 106H78V113H43ZM57 104V137H63V104Z" fill="#fff3e7" />
    <path d="M58 107H45V97H53V100H58ZM64 107H77V97H69V100H64Z" fill="#b16d88" /><rect x="57" y="103" width="8" height="9" fill="#cc8aa1" />
  </svg>
</template>
