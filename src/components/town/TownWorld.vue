<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { PhFlower, PhCode, PhPackage, PhGameController, PhGift, PhTrophy, PhMapPin } from '@phosphor-icons/vue'
import TownSprite from './TownSprite.vue'
import TownActor from './TownActor.vue'
import TownBuilding from './TownBuilding.vue'
import TownBouquet from './TownBouquet.vue'
import TownDog from './TownDog.vue'
import TownCat from './TownCat.vue'
import type { PetDirection } from '@/utils/townPets'
import type { Stem } from '@/utils/townStory'
import { TOWN_ACTIVITIES, type TownAction } from '@/utils/townActivities'
import { LOCATIONS, WORLD, type Point, type TownLocationId } from '@/utils/townDemo'

const props = defineProps<{ player: Point; companion: Point; companionDirection: PetDirection; companionWalking: boolean; walking: boolean; running: boolean; character: string; direction: string; action:TownAction; activityTarget:Point|null; activityStep:number; litNodes:number; nurtured:boolean; petals: (Point & { id: number })[]; nearby: string | null; delivery: boolean; night: boolean; motion: boolean; paused?:boolean; stems: Stem[]; wrapping: string; garden: number; particles: { id: number; x: number; y: number }[] }>()
const actorMotion=computed(()=>props.motion&&!props.paused)
const emit = defineEmits<{ walk: [point: Point]; approach: [id: TownLocationId] }>()
const viewport = ref<HTMLElement | null>(null)
const scale = ref(1)
const width = ref(960), height = ref(600), overview = ref(false)
const closeCamera = computed(() => width.value <= 600 && !overview.value)
const camera = computed(() => ({ x: closeCamera.value ? Math.min(0, Math.max(width.value - WORLD.width * scale.value, width.value / 2 - props.player.x * scale.value)) : 0, y: closeCamera.value ? Math.min(0, Math.max(height.value - WORLD.height * scale.value, height.value / 2 - props.player.y * scale.value)) : 0 }))
const worldStyle = computed(() => ({ transform: `translate(${camera.value.x}px, ${camera.value.y}px) scale(${scale.value})` }))
function updateScale() { scale.value = closeCamera.value ? .8 : width.value / WORLD.width }
function toggleMap() { overview.value = !overview.value; updateScale() }
let observer: ResizeObserver | undefined
const icons = { flowers: PhFlower, studio: PhCode, delivery: PhPackage, arcade: PhGameController, gifts: PhGift, garden: PhTrophy }
const trees = [{ x: 38, y: 42 }, { x: 87, y: 48 }, { x: 885, y: 42 }, { x: 910, y: 94 }, { x: 32, y: 399 }, { x: 65, y: 440 }, { x: 893, y: 389 }, { x: 903, y: 470 }, { x: 344, y: 91 }, { x: 611, y: 94 }]
const beds = [{ x: 67, y: 208 }, { x: 857, y: 215 }, { x: 330, y: 440 }, { x: 614, y: 460 }, { x: 313, y: 265 }, { x: 591, y: 268 }]
const recipient = { x: 853, y: 337 }
const actorStyle = computed(() => ({ left: `${props.player.x}px`, top: `${props.player.y}px`, zIndex: Math.round(props.player.y) }))

function walk(event: MouseEvent) {
  if (!viewport.value) return
  const rect = viewport.value.getBoundingClientRect()
  emit('walk', { x: (event.clientX - rect.left - camera.value.x) / scale.value, y: (event.clientY - rect.top - camera.value.y) / scale.value })
}
onMounted(() => {
  observer = new ResizeObserver(entries => { width.value = entries[0]!.contentRect.width; height.value = entries[0]!.contentRect.height; updateScale() })
  if (viewport.value) observer.observe(viewport.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="viewport" class="town-map-viewport" :class="{ 'is-night': night, 'no-motion': !motion, 'town-overview': overview }" @click="walk" role="group" aria-label="Interactive Stack Petals Town. Click the ground to walk, or choose a location below.">
    <button v-if="width <= 600" class="town-map-toggle" type="button" :aria-pressed="overview" @click.stop="toggleMap"><PhMapPin :size="16" weight="regular" />{{ overview ? 'Follow me' : 'Town map' }}</button>
    <div class="town-world" :style="worldStyle">
      <svg class="town-terrain" viewBox="0 0 960 600" shape-rendering="crispEdges" aria-hidden="true">
        <defs><pattern id="town-grass" width="48" height="48" patternUnits="userSpaceOnUse"><rect width="48" height="48" fill="#d6e0b8" /><path d="M7 14H10V11H13V14H16M32 38H35V35H38V38H41" fill="none" stroke="#b9ca9c" stroke-width="2" /><rect x="24" y="8" width="3" height="3" fill="#e9edcb" /></pattern><pattern id="town-path" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#e9d9bc" /><path d="M0 0H24V24" stroke="#dcc9a8" stroke-width="1" fill="none" /></pattern></defs>
        <rect width="960" height="600" fill="url(#town-grass)" />
        <path d="M118 256H840V352H118ZM422 230H538V578H422ZM160 224H220V570H160ZM740 224H800V570H740Z" fill="#bcae88" />
        <path d="M122 260H836V348H122ZM426 234H534V578H426ZM164 228H216V566H164ZM744 228H796V566H744Z" fill="url(#town-path)" />
        <rect x="369" y="262" width="222" height="93" fill="#d9c7ad" /><rect x="373" y="266" width="214" height="85" fill="#eddfc8" />
        <path d="M420 291H438V279H522V291H540V327H522V339H438V327H420Z" fill="#b8aaa6" />
        <path d="M426 294H442V285H518V294H534V323H518V333H442V323H426Z" fill="#a8ccca" />
        <path d="M450 301H510V318H450Z" fill="#d7eeea" /><rect x="476" y="274" width="9" height="39" fill="#f2e9db" /><rect x="470" y="270" width="21" height="8" fill="#d5c4b0" />
        <path d="M873 281H936V360H922V376H864V360H853V295H873Z" fill="#a1beb1" /><path d="M877 287H930V352H917V369H869V354H860V300H877Z" fill="#b2d4cf" /><path d="M881 302H914M868 333H924M888 357H909" stroke="#deefe5" stroke-width="4" />
        <g v-for="tree in trees" :key="`${tree.x}-${tree.y}`" :transform="`translate(${tree.x} ${tree.y})`"><rect x="21" y="41" width="10" height="34" fill="#917758" /><path d="M5 51V22H13V10H39V19H48V48H39V57H13V51Z" fill="#78996a" /><path d="M9 39V23H17V15H34V23H42V39Z" fill="#9eb27b" /><rect x="14" y="23" width="8" height="8" fill="#bdd19a" /><rect x="28" y="40" width="11" height="6" fill="#617e59" /></g>
        <g v-for="bed in beds" :key="`${bed.x}-${bed.y}`" :transform="`translate(${bed.x} ${bed.y})`"><rect x="-3" y="6" width="44" height="24" fill="#b89a72" /><rect width="38" height="27" fill="#9bae77" /><path d="M4 10H12V18H4ZM22 14H30V22H22ZM14 0H22V8H14Z" fill="#e293aa" /><path d="M7 12H9V15H7ZM25 17H27V20H25ZM17 3H19V6H17Z" fill="#f7dca6" /></g>
        <path d="M38 568H920M38 579H920" stroke="#b99d7b" stroke-width="4" /><path v-for="post in 35" :key="post" :d="`M${post * 25 + 20} 561V584`" stroke="#c7ac88" stroke-width="6" />
        <g transform="translate(845 425)"><rect width="88" height="117" fill="#c6d5aa" /><path d="M0 0H88V117H0Z" fill="none" stroke="#aab990" stroke-width="4" /><g v-if="garden >= 1"><path d="M20 82V48M62 100V65" stroke="#70936c" stroke-width="4" /><path d="M12 42H17V37H25V42H30V50H25V55H17V50H12Z" fill="#e7a1b7" /><rect x="18" y="44" width="7" height="7" fill="#f6dda0" /><path v-if="garden >= 2" d="M54 59H59V54H67V59H72V67H67V72H59V67H54Z" fill="#ecc66b" /><rect v-if="garden >= 2" x="60" y="61" width="7" height="7" fill="#fff1c1" /></g><g v-if="garden >= 2"><rect x="35" y="21" width="43" height="8" fill="#b79779" /><rect x="35" y="32" width="43" height="7" fill="#c9ae8a" /><path d="M40 39V48M71 39V48" stroke="#9c8169" stroke-width="5" /></g><g v-if="garden >= 3"><path d="M4 6Q44 30 84 6" fill="none" stroke="#91735e" stroke-width="2" /><rect v-for="light in 6" :key="light" :x="light * 12 - 4" :y="light < 3 || light > 4 ? 10 : 17" width="5" height="7" fill="#ffe7a7" /></g></g>
      </svg>

      <div v-for="location in LOCATIONS" :key="location.id" class="town-house" :style="{ left: `${location.x - 80}px`, top: `${location.y - 13}px`, zIndex: location.y + 100 }">
        <TownBuilding :color="location.color" :kind="location.id" />
        <button v-show="overview || nearby === location.id" class="town-location-marker" :class="{ nearby: nearby === location.id }" :data-location="location.id" type="button" :aria-label="`Walk to ${location.name}`" @click.stop="emit('approach', location.id)"><component :is="icons[location.id]" :size="18" weight="duotone" /><span>{{ location.name }}</span></button>
      </div>
      <div v-for="petal in petals" :key="petal.id" class="town-collectible" :style="{ left: `${petal.x}px`, top: `${petal.y}px` }" aria-hidden="true"><svg viewBox="0 0 16 20" shape-rendering="crispEdges"><path d="M5 0H13V3H16V11H13V16H9V20H3V16H0V8H3V3H5Z" fill="#b66686" /><path d="M6 3H12V5H13V10H10V14H5V12H3V8H5V5H6Z" fill="#f1b4cc" /><rect x="8" y="5" width="3" height="4" fill="#ffdeeb" /></svg></div>
      <div class="town-npc" :class="{ waving: delivery && actorMotion }" :style="{ left: `${recipient.x}px`, top: `${recipient.y}px`, zIndex: recipient.y }"><span class="town-ground-shadow"></span><TownActor character="girl" :direction="player.x < recipient.x - 50 ? 'left' : 'down'" :action="garden>0?'bouquet':'idle'" :motion="actorMotion" :scale=".64" /><span v-if="delivery" class="town-delivery-pin"><PhMapPin :size="26" weight="fill" /></span><span class="town-npc-name">Luna</span></div>
      <div class="town-companion" :style="{ left: `${companion.x}px`, top: `${companion.y}px`, zIndex: Math.round(companion.y) }"><TownCat v-if="character === 'boy'" :direction="companionDirection" :walking="companionWalking" :motion="actorMotion" /><TownDog v-else :direction="companionDirection" :walking="companionWalking" :motion="actorMotion" /></div>
      <div class="town-player" :style="actorStyle"><span class="town-ground-shadow"></span><TownActor :character="character" :direction="direction" :action="delivery ? 'idle' : action" :walking="walking" :running="running" :motion="actorMotion" :scale=".68" /><TownBouquet v-if="delivery && stems.length === 3" class="town-carried-bouquet" :stems="stems" :wrapping="wrapping" small /><TownSprite v-else-if="delivery" class="town-carried-parcel" sprite="parcel" :scale=".24" /><span class="town-player-label">You</span></div>
      <div v-if="activityTarget" class="town-activity-marker" :style="{left:`${activityTarget.x}px`,top:`${activityTarget.y-20}px`}"><span><component :is="action==='laptop'?PhCode:action==='letter'?PhGift:PhFlower" :size="21" weight="duotone"/></span><small>Stop {{ activityStep+1 }}</small></div>
      <svg v-for="(node,index) in TOWN_ACTIVITIES.lights.targets" :key="`lamp-${index}`" class="town-little-lamp" :class="{lit:index<litNodes}" :style="{left:`${node.x-10}px`,top:`${node.y-36}px`,zIndex:Math.round(node.y)}" viewBox="0 0 20 38" shape-rendering="crispEdges" aria-hidden="true"><path v-if="index<litNodes" d="M2 0H18V17H2Z" fill="#ffedb73b"/><path d="M8 13H12V35H16V38H4V35H8Z" fill="#7c756b"/><path d="M4 3H16V16H4Z" fill="#736b65"/><path d="M6 5H14V13H6Z" :fill="index<litNodes?'#ffe9a6':'#b5c0b3'"/><path d="M7 0H13V3H7Z" fill="#9c8474"/></svg>
      <svg v-if="nurtured" v-for="(bed,index) in TOWN_ACTIVITIES.blooms.targets" :key="`new-bloom-${index}`" class="town-new-bloom" :style="{left:`${bed.x-18}px`,top:`${bed.y-20}px`}" viewBox="0 0 36 24" shape-rendering="crispEdges" aria-hidden="true"><path d="M8 10V24M27 10V24" stroke="#7a956c" stroke-width="3"/><path d="M3 4H7V0H12V4H16V9H12V13H7V9H3Z" fill="#e8a0b6"/><path d="M22 5H26V1H31V5H35V10H31V14H26V10H22Z" fill="#e8c674"/><path d="M7 4H12V9H7ZM26 5H31V10H26Z" fill="#fff0c7"/></svg>
      <div class="town-plaza-sign" aria-hidden="true">PETAL PLAZA</div>
      <svg v-for="particle in particles" :key="particle.id" class="town-particle" :data-particle="particle.id" :style="{ left: `${particle.x * 9.6}px`, top: `${particle.y * 6}px`, zIndex: 900 }" viewBox="0 0 20 20" shape-rendering="crispEdges" aria-hidden="true"><path d="M8 0H12V5H15V8H20V12H15V15H12V20H8V15H5V12H0V8H5V5H8Z" fill="#fff5cf" /><path d="M8 5H12V8H15V12H12V15H8V12H5V8H8Z" fill="#e08eae" /></svg>
    </div>
  </div>
</template>
