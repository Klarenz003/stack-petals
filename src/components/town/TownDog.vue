<script setup lang="ts">
import { computed } from 'vue'
import { DOG_POSES, type PetDirection } from '@/utils/townPets'
const props = defineProps<{ direction: PetDirection; walking: boolean; motion: boolean }>()
const style = computed(() => {
  const [x, y, width, height] = DOG_POSES[props.direction]
  return { width: `${width * .64}px`, height: `${height * .64}px`, backgroundSize: '983.04px 655.36px', backgroundPosition: `${-x * .64}px ${-y * .64}px` }
})
</script>
<template>
  <span class="town-dog" :class="[direction, { trotting: walking && motion }]" :style="style" :data-facing="direction" :data-walking="walking && motion" aria-hidden="true">
    <span v-if="walking && motion" class="town-dog-paw first"></span><span v-if="walking && motion" class="town-dog-paw second"></span>
  </span>
</template>
<style scoped>
.town-dog{display:block;position:relative;flex:none;background-image:url('/images/town/sprite-atlas-clean.png');background-repeat:no-repeat;image-rendering:pixelated;pointer-events:none}
.town-dog.right{transform:scaleX(-1)}
.town-dog.trotting{animation:dog-trot .32s steps(2,end) infinite}
.town-dog-paw{position:absolute;bottom:3px;width:5px;height:7px;background:#dda35f;border-bottom:2px solid #9b704a;border-radius:1px;animation:dog-step .32s steps(2,end) infinite}
.town-dog-paw.first{left:29%}.town-dog-paw.second{left:61%;animation-delay:-.16s}
.town-dog.left .town-dog-paw.first,.town-dog.right .town-dog-paw.first{left:24%}
.town-dog.left .town-dog-paw.second,.town-dog.right .town-dog-paw.second{left:67%}
@keyframes dog-step{0%,100%{transform:translate(0,0)}50%{transform:translate(-2px,-3px)}}
@keyframes dog-trot{0%,100%{translate:0 0}50%{translate:0 -1px}}
@media(prefers-reduced-motion:reduce){.town-dog,.town-dog-paw{animation:none!important}}
</style>
