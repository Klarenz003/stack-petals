<script lang="ts">
let nextCropId=0
</script>
<script setup lang="ts">
import { computed,onBeforeUnmount,ref,watch } from 'vue'
import TownHeldItem from './TownHeldItem.vue'
import { approvedPose } from '@/utils/townApprovedArt'
import { characterView } from '@/utils/townCharacterArt'
import type { TownAction } from '@/utils/townActivities'
const props=defineProps<{character:string;direction:string;action:TownAction;walking:boolean;running:boolean;motion:boolean}>()
const step=ref(0)
let timer:ReturnType<typeof setInterval>|undefined
watch(()=>[props.walking,props.running,props.motion,props.direction,props.action],()=>{
  if(timer)clearInterval(timer);step.value=0
  if(props.walking&&props.motion)timer=setInterval(()=>step.value=(step.value+1)%2,props.running?120:180)
},{immediate:true})
onBeforeUnmount(()=>{if(timer)clearInterval(timer)})
const view=computed(()=>characterView(props.direction))
const itemTransform=computed(()=>view.value.mirrored?'translate(96 0) scale(-1 1)':undefined)
const pose=computed(()=>approvedPose(props.character,props.direction,props.action,props.walking&&props.motion,props.running,step.value))
// A fixed viewport and an explicit clip keep the entire atlas hidden even
// while the browser decodes a different sheet during a pose change.
const cropId=`town-chibi-${++nextCropId}`
const poseKey=computed(()=>`${pose.value.source}:${pose.value.box.join(',')}:${pose.value.flip}`)
const layout=computed(()=>{
  const [atlasX,atlasY,w,h]=pose.value.box,scale=Math.min(102/h,92/w)
  const x=(96-w*scale)/2,y=106-h*scale
  return {x,y,width:w*scale,height:h*scale,transform:`translate(${x-atlasX*scale} ${y-atlasY*scale}) scale(${scale})`}
})
</script>
<template>
  <!-- SVG crop wrapper around the approved raster art, not a vector trace. -->
  <svg class="town-chibi-character" :class="{breathing:!walking&&motion,walking:walking&&motion,sprinting:walking&&running&&motion,'motion-off':!motion}" viewBox="0 0 96 108" :data-facing="view.facing" :data-view="view.back?'rear':view.side?'profile':'front'" :data-diagonal="view.diagonal" :data-action="action" :data-source="pose.source" :data-step="step" aria-hidden="true">
    <g class="chibi-motion">
      <g v-if="pose.overlay&&view.back" :transform="itemTransform"><TownHeldItem :item="action" x="57" y="64" width="34" height="38"/></g>
      <g :key="poseKey" :transform="pose.flip?'translate(96 0) scale(-1 1)':undefined">
        <defs><clipPath :id="cropId" clipPathUnits="userSpaceOnUse"><rect :x="layout.x" :y="layout.y" :width="layout.width" :height="layout.height"/></clipPath></defs>
        <g :clip-path="`url(#${cropId})`"><image :href="pose.source" :transform="layout.transform" x="0" y="0" :width="pose.atlasSize?.[0]??1536" :height="pose.atlasSize?.[1]??1024"/></g>
      </g>
      <g v-if="pose.overlay&&!view.back" :transform="itemTransform"><TownHeldItem :item="action" x="57" y="64" width="34" height="38"/></g>
    </g>
  </svg>
</template>
<style scoped>
.town-chibi-character{display:block;width:100%;height:100%;overflow:visible;pointer-events:none}.town-chibi-character image{image-rendering:pixelated}.chibi-motion{transform-origin:48px 106px}.breathing .chibi-motion{animation:chibi-breathe 3.8s ease-in-out infinite}.walking .chibi-motion{animation:chibi-step .36s steps(2,end) infinite}.walking.sprinting .chibi-motion{animation-duration:.24s}.motion-off .chibi-motion{animation:none!important}
@keyframes chibi-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.008,1.018)}}@keyframes chibi-step{0%,100%{transform:translate(0,0) rotate(-.5deg)}50%{transform:translate(0,-1px) rotate(.5deg)}}
@media(prefers-reduced-motion:reduce){.town-chibi-character .chibi-motion{animation:none!important}}
</style>
