<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { PhFlower, PhCheck, PhArrowLeft, PhArrowRight, PhSparkle, PhGift } from '@phosphor-icons/vue'
import TownBouquet from './TownBouquet.vue'
import { isSunshineBouquet, type Stem, type StorySave } from '@/utils/townStory'
const props = defineProps<{ story: StorySave; motion: boolean }>()
const emit = defineEmits<{ arrange: [stems: Stem[], wrapping: StorySave['wrapping']]; finish: [quality: number] }>()
const stems = ref<Stem[]>([...props.story.stems]), wrapping = ref(props.story.wrapping)
const step = ref<'flowers' | 'ribbon'>('flowers'), position = ref(.5), tied = ref(false), feedback = ref('')
const matches = computed(() => isSunshineBouquet(stems.value))
let frame = 0, started = 0
function add(stem: Stem) { if (stems.value.length < 3) { stems.value.push(stem); emit('arrange', [...stems.value], wrapping.value) } }
function remove(index: number) { stems.value.splice(index, 1); emit('arrange', [...stems.value], wrapping.value) }
function animate(time: number) {
  if (!started) started = time
  position.value = .5 + Math.sin((time - started) / 750) * .45
  frame = requestAnimationFrame(animate)
}
function beginRibbon() { step.value = 'ribbon'; emit('arrange', [...stems.value], wrapping.value); if (props.motion) frame = requestAnimationFrame(animate) }
function tie() {
  if (tied.value) return
  cancelAnimationFrame(frame); tied.value = true
  const quality = 1 - Math.abs(position.value - .5) * 2
  feedback.value = quality > .7 ? 'A lovely little bow. Luna is going to love this.' : 'A wonderfully handmade bow. A little imperfect, a lot of heart.'
  emit('finish', quality)
}
function back() { cancelAnimationFrame(frame); started = 0; step.value = 'flowers' }
watch(() => props.motion, enabled => {
  cancelAnimationFrame(frame); started = 0
  if (step.value === 'ribbon' && !tied.value) { if (enabled) frame = requestAnimationFrame(animate); else position.value = .5 }
})
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>
<template>
  <div class="town-atelier">
    <p class="town-atelier-intro">{{ step === 'flowers' ? 'One sunshine yellow, one soft pink, one sky blue. Place them in any order: this little bouquet is yours.' : 'Tap when the marker reaches the blush centre. Every bow is welcome here.' }}</p>
    <div class="town-arrangement" :class="{ wrapped: step === 'ribbon' }"><TownBouquet :stems="stems" :wrapping="wrapping" /><span class="town-arrangement-label">FOR LUNA · MADE BY YOU</span></div>
    <template v-if="step === 'flowers'">
      <div class="town-stem-slots"><button v-for="index in 3" :key="index" :aria-label="stems[index - 1] ? `Remove flower ${index}` : `Empty flower slot ${index}`" :disabled="!stems[index - 1]" @click="remove(index - 1)"><PhFlower :size="23" :weight="stems[index - 1] ? 'fill' : 'regular'" :style="{ color: stems[index - 1] === 'sun' ? '#bda152' : stems[index - 1] === 'blue' ? '#7799b6' : '#c1819a' }" /><small>{{ stems[index - 1] || 'Add a flower' }}</small></button></div>
      <div class="town-recipe-picker"><button v-for="stem in (['sun', 'pink', 'blue'] as const)" :key="stem" :disabled="stems.length === 3" :data-stem="stem" @click="add(stem)"><PhFlower :size="18" weight="duotone" />{{ stem === 'sun' ? 'Sunshine' : stem === 'pink' ? 'Blush' : 'Blue skies' }}</button></div>
      <p class="town-arrangement-hint" role="status">{{ matches ? 'Just the colours Milo asked for. Ready for a little ribbon?' : stems.length === 3 ? 'Try one of each colour. Tap a flower slot to replace it.' : 'Choose three flowers above. Tap a filled slot to change it.' }}</p>
      <p class="town-eyebrow">CHOOSE YOUR WRAPPING</p>
      <div class="town-wrap-picker"><button v-for="wrap in (['cream', 'rose', 'sage'] as const)" :key="wrap" :aria-pressed="wrapping === wrap" @click="wrapping = wrap; emit('arrange', [...stems], wrap)"><span :class="wrap"></span>{{ wrap }}<PhCheck v-if="wrapping === wrap" :size="15" weight="fill" /></button></div>
      <button class="town-button town-full-button" :disabled="!matches" @click="beginRibbon">A little ribbon <PhArrowRight :size="18" weight="regular" /></button>
    </template>
    <template v-else>
      <div class="town-ribbon-track" role="meter" aria-label="Bow timing marker" :aria-valuenow="Math.round(position * 100)" :aria-valuemin="0" :aria-valuemax="100"><span class="town-ribbon-sweet"></span><span class="town-ribbon-marker" :style="{ left: `${position * 100}%` }"></span></div>
      <p v-if="tied" class="town-arrangement-hint" role="status">{{ feedback }}</p>
      <button v-if="!tied" class="town-button town-full-button" data-tie-bow @click="tie"><PhGift :size="20" weight="duotone" /> Tie your little bow</button>
      <p class="town-tip"><PhSparkle :size="20" weight="duotone" />No perfect scores needed. The care is what counts.</p>
      <button v-if="!tied" class="town-small-button" @click="back"><PhArrowLeft :size="16" weight="regular" /> Back to flowers</button>
    </template>
  </div>
</template>
