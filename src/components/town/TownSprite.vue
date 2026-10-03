<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { characterFrame, type AtlasBox } from '@/utils/townSprites'
import type { TownAction } from '@/utils/townActivities'
const props = withDefaults(defineProps<{ sprite: string; scale?: number; walking?: boolean; running?: boolean; action?: TownAction }>(), { scale: 1, walking: false, running: false, action: 'idle' })
const step = ref(0)
let timer: ReturnType<typeof setInterval> | undefined
watch(() => [props.walking, props.running, props.sprite], () => {
  if (timer) clearInterval(timer)
  step.value = 0
  if (props.walking) timer = setInterval(() => { step.value = (step.value + 1) % 2 }, props.running ? 120 : 180)
}, { immediate: true })
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
// Alpha-tight viewports sample the cleaned atlas; no colour blending is needed.
const boxes: Record<string, [number, number, number, number]> = {
  'cat': [915, 720, 49, 60], 'dog': [914, 791, 55, 67],
  'bouquet-pink': [1006, 47, 92, 119], 'bouquet-blue': [1212, 50, 92, 108], 'bouquet-sun': [1309, 37, 94, 121],
  'parcel': [1405, 35, 103, 108], 'letter': [1259, 173, 70, 52],
  'boy-portrait': [1294, 726, 104, 107], 'girl-portrait': [1396, 719, 125, 114],
}
const frame = computed(() => characterFrame(props.sprite, props.walking, props.running, step.value, props.action) || {box:boxes[props.sprite] || [105,345,66,104] as AtlasBox})
const container = computed(() => {
  const character = characterFrame(props.sprite,false,false,0)
  return {width:`${(character ? 80 : frame.value.box[2])*props.scale}px`,height:`${(character ? 108 : frame.value.box[3])*props.scale}px`}
})
const art = computed(() => {
  const [x,y,width,height] = frame.value.box
  return {position:'absolute' as const,left:'50%',bottom:'0',width:`${width*props.scale}px`,height:`${height*props.scale}px`,backgroundSize:`${1536*props.scale}px ${1024*props.scale}px`,backgroundPosition:`${-x*props.scale}px ${-y*props.scale}px`,transform:`translateX(-50%)${frame.value.flip ? ' scaleX(-1)' : ''}`}
})
</script>
<template><span class="town-sprite" :style="container" :data-sprite="sprite" :data-step="step" aria-hidden="true"><span class="town-sprite-art" :style="art"></span></span></template>
<style scoped>
.town-sprite{display:inline-block;position:relative;overflow:hidden;flex:none;pointer-events:none}
.town-sprite-art{display:block;background-image:url('/images/town/sprite-atlas-clean.png');background-repeat:no-repeat;image-rendering:pixelated;pointer-events:none}
</style>
