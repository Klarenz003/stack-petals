<script setup lang="ts">
defineProps<{ index: number }>()
</script>
<template>
  <svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <template v-if="index === 0"><circle cx="50" cy="50" r="16" /><path d="M50 7v22M50 71v22M7 50h22m42 0h22M20 20l16 16m28 28 16 16M80 20 64 36M36 64 20 80" /></template>
    <template v-else-if="index === 1"><path d="M50 88V48m0 12C29 59 19 45 21 29c17 0 27 10 29 31Zm0-13c20 0 30-11 29-26-17 0-27 10-29 26Z" /><path d="M50 48c-8-15-4-26 0-34 7 11 8 22 0 34Z" /></template>
    <template v-else-if="index === 2"><path d="M50 8v28M50 64v28M8 50h28M64 50h28M20 20l20 20m20 20 20 20M80 20 60 40M40 60 20 80" /><path d="M50 31c2 15 9 22 24 24-15 2-22 9-24 24-2-15-9-22-24-24 15-2 22-9 24-24Z" /></template>
    <template v-else-if="index === 3"><path d="M50 82C25 64 14 50 14 35c0-22 26-29 36-10 10-19 36-12 36 10 0 15-11 29-36 47Z" /></template>
    <template v-else-if="index === 4"><circle cx="50" cy="50" r="25" /><path d="M39 46h1m20 0h1M40 61q10 9 20 0M24 25l-8-8m60 8 8-8M24 75l-8 8m60-8 8 8" /></template>
    <template v-else><path d="M14 55c10-14 20-15 36-3 16-12 26-11 36 3L65 78H35L14 55Z" /><path d="M50 52 38 66m12-14 12 14M18 28l6 5m58-5-6 5" /></template>
  </svg>
</template>
