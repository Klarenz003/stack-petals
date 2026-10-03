<script setup lang="ts">
import { computed } from 'vue'
import { CAT_POSES, type PetDirection } from '@/utils/townPets'
const props = defineProps<{ direction: PetDirection; walking: boolean; motion: boolean }>()
const style = computed(() => {
  const [x, y, width, height] = CAT_POSES[props.direction]
  return { width: `${width * .64}px`, height: `${height * .64}px`, backgroundSize: '983.04px 655.36px', backgroundPosition: `${-x * .64}px ${-y * .64}px` }
})
</script>
<template>
  <span class="town-cat" :class="[direction, { strolling: walking && motion }]" :style="style" :data-facing="direction" :data-walking="walking && motion" aria-hidden="true">
    <span v-if="walking && motion" class="town-cat-paw first"></span><span v-if="walking && motion" class="town-cat-paw second"></span>
  </span>
</template>
<style scoped>
.town-cat{display:block;position:relative;flex:none;background-image:url('/images/town/sprite-atlas-clean.png');background-repeat:no-repeat;image-rendering:pixelated;pointer-events:none}
.town-cat.right{transform:scaleX(-1)}
.town-cat.strolling{animation:cat-stroll .36s steps(2,end) infinite}
.town-cat-paw{position:absolute;bottom:3px;width:5px;height:6px;background:#f2e9df;border-bottom:2px solid #66605e;border-radius:1px;animation:cat-step .36s steps(2,end) infinite}
.town-cat-paw.first{left:29%}.town-cat-paw.second{left:61%;animation-delay:-.18s}
.town-cat.left .town-cat-paw.first,.town-cat.right .town-cat-paw.first{left:24%}
.town-cat.left .town-cat-paw.second,.town-cat.right .town-cat-paw.second{left:67%}
@keyframes cat-step{0%,100%{transform:translate(0,0)}50%{transform:translate(-2px,-3px)}}
@keyframes cat-stroll{0%,100%{translate:0 0}50%{translate:0 -1px}}
@media(prefers-reduced-motion:reduce){.town-cat,.town-cat-paw{animation:none!important}}
</style>
