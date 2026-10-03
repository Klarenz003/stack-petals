<script setup lang="ts">
import TownChibiCharacter from './TownChibiCharacter.vue'
import type { TownAction } from '@/utils/townActivities'
withDefaults(defineProps<{ character: string; direction?: string; action?: TownAction; walking?: boolean; running?: boolean; scale?: number; motion?:boolean }>(),{direction:'down',action:'idle',walking:false,running:false,scale:.68,motion:true})
</script>
<template>
  <span class="town-actor" :data-action="action" :data-direction="direction" :style="{width:`${96*scale}px`,height:`${108*scale}px`}">
    <TownChibiCharacter :character="character" :direction="direction" :action="action" :walking="walking" :running="running" :motion="motion"/>
  </span>
</template>
<style scoped>
.town-actor{display:inline-block;position:relative;flex:none;pointer-events:none}
</style>
