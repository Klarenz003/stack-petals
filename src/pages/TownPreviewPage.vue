<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import { PhArrowLeft, PhArrowRight, PhArrowUp, PhArrowDown, PhFlower, PhCode, PhPackage, PhGameController, PhGift, PhTrophy, PhClock, PhPause, PhPlay, PhGear, PhX, PhCheck, PhLock, PhSparkle, PhMapPin, PhSpeakerHigh, PhSpeakerSlash, PhSun, PhMoon, PhHeart, PhKeyboard, PhArrowCounterClockwise } from '@phosphor-icons/vue'
import TownWorld from '@/components/town/TownWorld.vue'
import TownSprite from '@/components/town/TownSprite.vue'
import TownAtelier from '@/components/town/TownAtelier.vue'
import TownBouquet from '@/components/town/TownBouquet.vue'
import TownActor from '@/components/town/TownActor.vue'
import TownErrands from '@/components/town/TownErrands.vue'
import { TOWN_ACTIVITIES, activityTarget, canWork, travelDirection, type TownAction, type TownDirection, type ActivityId } from '@/utils/townActivities'
import { FIRST_DELIVERY, STORY_STEPS, freshStory, restoreStory, gardenLevel, type Stem, type StorySave } from '@/utils/townStory'
import { petRestSpot, petMovement, type PetDirection } from '@/utils/townPets'
import { useDialogFocus } from '@/composables/useDialogFocus'
import { CHALLENGES, LOCATIONS, doorFor, distance, findTownPath, movePlayer, type Point, type TownLocationId } from '@/utils/townDemo'
import '@/assets/town-demo.css'
import '@/assets/town-story.css'
import '@/assets/town-activities.css'

type Panel = TownLocationId | 'welcome' | 'settings' | 'result' | 'thanks' | 'activity' | null
const SAVE_KEY = 'stack-petals:town-demo:v1'
const root = ref<HTMLElement | null>(null), dialog = ref<HTMLElement | null>(null)
const modal = ref<Panel>('welcome'), player = ref<Point>({ x: 380, y: 340 })
const direction = ref<TownDirection>('down'), walking = ref(false), paused = ref(false), sprinting = ref(false)
const pocket = ref<TownAction>('idle'), errand = ref<ActivityId|null>(null), errandStep = ref(0), completedErrands = ref(0)
const workStep = ref(0), watered = ref<number[]>([]), workFeedback = ref('')
const activityWins = reactive({lights:0,blooms:0,notes:0})
const target = computed(() => errand.value ? activityTarget(errand.value,errandStep.value) : null)
const workReady = computed(() => !!errand.value && canWork(errand.value,errandStep.value,player.value))
const errandLocked = computed(() => delivery.value || running.value || story.stage === 'arrange')
const actorAction = computed<TownAction>(() => delivery.value && story.stage === 'deliver' ? 'bouquet' : errand.value ? TOWN_ACTIVITIES[errand.value].action : pocket.value)
const repairPattern = computed(() => [[1,0,2],[2,1,0],[0,2,1]][errandStep.value%3]!)
const workIcons = [PhCode,PhSparkle,PhHeart]
const controls = [
  {key:'up-left',icon:PhArrowUp,label:'Move diagonally up left'}, {key:'arrowup',icon:PhArrowUp,label:'Move up'}, {key:'up-right',icon:PhArrowUp,label:'Move diagonally up right'},
  {key:'arrowleft',icon:PhArrowLeft,label:'Move left'}, {key:'arrowright',icon:PhArrowRight,label:'Move right'},
  {key:'down-left',icon:PhArrowUp,label:'Move diagonally down left'}, {key:'arrowdown',icon:PhArrowDown,label:'Move down'}, {key:'down-right',icon:PhArrowUp,label:'Move diagonally down right'},
]
const character = ref('boy'), night = ref(false), motion = ref(true), sound = ref(false)
const stats = reactive({ petals: 0, collected: 0, score: 0, crafted: 0, coding: 0, deliveries: 0, runs: 0, best: 0 })
const visited = ref<string[]>([]), delivery = ref(false), running = ref(false), remaining = ref(30), roundScore = ref(0)
const story = reactive(freshStory())
const companion = ref<Point>({ x: 338, y: 340 })
const companionDirection = ref<PetDirection>('down'), companionWalking = ref(false)
let trail: { point: Point; time: number }[] = []
let lastOwnerMove = 0, restPath: Point[] = [], restAnchor = ''
const garden = computed(() => gardenLevel(stats.deliveries))
const storyIndex = computed(() => ({ new: 0, gather: 1, arrange: 2, deliver: 3, complete: 4 })[story.stage])
const storyObjective = computed(() => ({ new: 'Milo has a little favour to ask.', gather: stats.petals >= 3 ? 'Your petals are ready. Visit the flower shop.' : `Collect ${3 - stats.petals} more petals around the plaza.`, arrange: 'Arrange three flowers and tie a little bow.', deliver: 'Bring your handmade bouquet to Luna by the pond.', complete: 'A little kindness. A new flower in your garden.' })[story.stage])
const bouquet = ref('pink'), challengeIndex = ref(0), answer = ref<number | null>(null)
const recipient = ref('Someone special'), message = ref('A little reminder: you make ordinary days feel extraordinary.')
const toast = ref(''), particles = ref<{ id: number; x: number; y: number }[]>([])
const icons = { flowers: PhFlower, studio: PhCode, delivery: PhPackage, arcade: PhGameController, gifts: PhGift, garden: PhTrophy }
const held = new Set<string>()
let path: Point[] = [], destination: TownLocationId | null = null, frame = 0, last = 0, petalId = 0, particleId = 0
let toastTimer: ReturnType<typeof setTimeout> | undefined, context: gsap.Context | undefined, audio: AudioContext | undefined
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
const reducedMotion = ref(reduced.matches)
const useMotion = computed(() => motion.value && !reducedMotion.value)
function motionPreference(event: MediaQueryListEvent) { reducedMotion.value = event.matches }
const nearby = computed(() => LOCATIONS.find(location => distance(player.value, doorFor(location)) < 57) || null)
const challenge = computed(() => CHALLENGES[challengeIndex.value % CHALLENGES.length]!)
const title = computed(() => modal.value === 'activity' && errand.value ? TOWN_ACTIVITIES[errand.value].title : modal.value === 'thanks' ? 'You made her day.' : modal.value === 'welcome' ? 'Welcome to your little world.' : modal.value === 'settings' ? 'Make yourself at home.' : modal.value === 'result' ? 'A lovely little run.' : LOCATIONS.find(item => item.id === modal.value)?.name || '')
const achievements = computed(() => [
  { name:'Town caretaker',detail:'Repair lights, water blooms, and deliver a note.',icon:PhSparkle,done:Object.values(activityWins).every(count=>count>0),progress:`${Object.values(activityWins).filter(count=>count>0).length} / 3` },
  { name: 'First bloom', detail: 'Collect your first petal.', icon: PhFlower, done: stats.collected >= 1, progress: `${Math.min(stats.collected, 1)} / 1` },
  { name: 'Bouquet master', detail: 'Craft ten bouquets.', icon: PhFlower, done: stats.crafted >= 10, progress: `${Math.min(stats.crafted, 10)} / 10` },
  { name: 'Love delivery', detail: 'Deliver five little gifts.', icon: PhPackage, done: stats.deliveries >= 5, progress: `${Math.min(stats.deliveries, 5)} / 5` },
  { name: 'Little developer', detail: 'Solve ten coding challenges.', icon: PhCode, done: stats.coding >= 10, progress: `${Math.min(stats.coding, 10)} / 10` },
  { name: 'Full bloom', detail: 'Try crafting, coding, delivery and Bloom Run.', icon: PhTrophy, done: stats.crafted > 0 && stats.coding > 0 && stats.deliveries > 0 && stats.runs > 0, progress: `${[stats.crafted, stats.coding, stats.deliveries, stats.runs].filter(Boolean).length} / 4` },
])
const petalPoints: Point[] = [{ x: 300, y: 300 }, { x: 650, y: 305 }, { x: 190, y: 260 }, { x: 770, y: 260 }, { x: 360, y: 365 }, { x: 600, y: 370 }, { x: 190, y: 550 }, { x: 480, y: 550 }, { x: 770, y: 550 }, { x: 95, y: 300 }, { x: 845, y: 320 }]
const petals = ref(petalPoints.map(point => ({ ...point, id: ++petalId })))

function notify(text: string) {
  toast.value = text
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 4200)
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ stats, story, visited: visited.value, character: character.value, night: night.value, motion: motion.value, completedErrands:completedErrands.value, pocket:pocket.value, activityWins, errand:errand.value, errandStep:errandStep.value, note:{recipient:recipient.value,message:message.value} })) } catch { /* Private browsing may not permit persistence. Gameplay still works. */ }
}
function startErrand(id:ActivityId) {
  if(errandLocked.value || errand.value || paused.value) return
  errand.value=id;errandStep.value=0;close();save();notify(TOWN_ACTIVITIES[id].detail)
}
function cancelErrand(){errand.value=null;errandStep.value=0;workFeedback.value='';save();notify('Errand tucked away. You can begin again whenever you like.')}
function equip(action:TownAction){if(errand.value || errandLocked.value)return;pocket.value=action;save()}
function findWork(){if(target.value) walk(target.value)}
function openWork(){if(!workReady.value || paused.value)return;workStep.value=0;watered.value=[];workFeedback.value='';open('activity')}
function completeWork(){
  if(!errand.value || !workReady.value)return
  const id=errand.value;void sparkle(player.value);chime();errandStep.value++
  if(errandStep.value>=TOWN_ACTIVITIES[id].targets.length){
    stats.score+=TOWN_ACTIVITIES[id].reward;completedErrands.value++;activityWins[id]++
    if(id==='lights')stats.coding++
    if(id==='notes')stats.deliveries++
    notify(`${TOWN_ACTIVITIES[id].title} complete. +${TOWN_ACTIVITIES[id].reward} kindness. Thank you for looking after the town.`)
    errand.value=null;errandStep.value=0
  }else notify('A little better already. Your next stop is marked in town.')
  close();save()
}
function repair(index:number){
  if(!workReady.value || errand.value!=='lights')return
  if(repairPattern.value[workStep.value]!==index){workStep.value=0;workFeedback.value='Almost. Follow the symbols from left to right. There’s no rush.';return}
  workStep.value++;workFeedback.value='A little connection, made.';chime()
  if(workStep.value===3)completeWork()
}
function water(index:number){
  if(!workReady.value || errand.value!=='blooms' || watered.value.includes(index))return
  watered.value.push(index);chime();workFeedback.value='A little drink for a little bloom.'
  if(watered.value.length===3)completeWork()
}
function acceptStory() { if(errand.value){notify('Finish or tuck away your current errand first. Milo will be waiting.');return} if (story.stage !== 'new') return; story.stage = 'gather'; save(); close(); notify('Milo: Thank you. Pick up three pink petals, then visit the flower shop.') }
function beginArrangement() {
  if(errand.value){notify('Finish or tuck away your current errand before arranging a bouquet.');return}
  if (story.stage !== 'gather' || stats.petals < 3) return
  stats.petals -= 3; story.stage = 'arrange'; save()
}
function arrange(stems: Stem[], wrapping: StorySave['wrapping']) { story.stems = stems; story.wrapping = wrapping; save() }
function finishBouquet(quality: number) {
  if (story.stage !== 'arrange') return
  story.bow = quality; story.stage = 'deliver'; delivery.value = true; stats.crafted++; save(); chime()
  notify('Your bouquet is ready. A little imperfect, a lot of heart.')
}
function storyAction() {
  if(errand.value){notify('Your current errand is marked in town. Finish it or tuck it away first.');return}
  if (story.stage === 'new') approach('delivery')
  else if (story.stage === 'gather' && stats.petals < 3) { const next = [...petals.value].sort((a, b) => distance(a, player.value) - distance(b, player.value))[0]; if (next) walk(next) }
  else if (story.stage === 'gather' || story.stage === 'arrange') approach('flowers')
  else if (story.stage === 'deliver') walk({ x: 853, y: 337 })
  else open('thanks')
}
function chime() {
  if (!sound.value) return
  try {
    audio ||= new AudioContext()
    void audio.resume()
    const oscillator = audio.createOscillator(), gain = audio.createGain()
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(660, audio.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(880, audio.currentTime + .12)
    gain.gain.setValueAtTime(.035, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .2)
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .21)
  } catch { sound.value = false }
}
async function sparkle(point: Point) {
  if (!useMotion.value) return
  const id = ++particleId
  particles.value.push({ id, x: point.x / 9.6, y: point.y / 6 })
  await nextTick()
  const element = root.value?.querySelector(`[data-particle="${id}"]`)
  if (!element) return
  gsap.fromTo(element, { y: 0, scale: .5, opacity: 1 }, { y: -45, scale: 1.2, opacity: 0, duration: .8, ease: 'power2.out', onComplete: () => { particles.value = particles.value.filter(item => item.id !== id) } })
}
function close() { modal.value = null; held.clear(); last = 0 }
function open(panel: Panel) {
  modal.value = panel; held.clear(); path = []; destination = null; walking.value = false
  if (panel && LOCATIONS.some(item => item.id === panel) && !visited.value.includes(panel)) { visited.value.push(panel); save() }
}
useDialogFocus(dialog, () => modal.value !== null, close)
function walk(point: Point) {
  if (modal.value || paused.value) return
  destination = null; path = findTownPath(player.value, point)
}
function approach(id: TownLocationId) {
  if (modal.value || paused.value) return
  const location = LOCATIONS.find(item => item.id === id)!
  if (distance(player.value, doorFor(location)) < 57) { open(id); return }
  destination = id; path = findTownPath(player.value, doorFor(location))
}
function interact() { if(modal.value || paused.value)return;if(workReady.value)openWork();else if(nearby.value)open(nearby.value.id) }
function collect(point: Point) {
  stats.petals++; stats.collected++; stats.score += 25
  if (running.value) roundScore.value += 25
  void sparkle(point); chime(); save()
}
function craft() {
  if (stats.petals < 3) return
  stats.petals -= 3; stats.crafted++; stats.score += 100
  pocket.value='bouquet'
  notify('Bouquet crafted. A little happiness, made by you. +100 points'); chime(); save()
}
function solve(index: number) {
  if (answer.value !== null) return
  answer.value = index
  if (index === challenge.value.answer) { stats.coding++; stats.score += 75; chime(); save() }
}
function startRun() {
  if(errand.value){notify('Finish or tuck away your current errand before starting a run.');return}
  remaining.value = 30; roundScore.value = 0; running.value = true; paused.value = false
  petals.value = petalPoints.map(point => ({ ...point, id: ++petalId }))
  close(); notify('Bloom Run started. Collect as many petals as you can in 30 seconds.')
}
function finishRun() {
  running.value = false; remaining.value = 0; stats.runs++; stats.best = Math.max(stats.best, roundScore.value)
  save(); open('result'); chime()
}
function resetWalk() { held.clear(); walking.value = false; sprinting.value = false; last = 0 }
function keyDown(event: KeyboardEvent) {
  if (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,[contenteditable="true"]')) return
  const key = event.key.toLowerCase()
  if (modal.value) return
  if (key === 'shift') sprinting.value = true
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) { event.preventDefault(); held.add(key); path = []; destination = null }
  if ((key === 'e' || key === 'enter') && !(event.target instanceof HTMLButtonElement) && !(event.target instanceof HTMLAnchorElement)) { event.preventDefault(); interact() }
  if (key === 'escape' && !event.repeat) { paused.value = !paused.value; resetWalk() }
}
function keyUp(event: KeyboardEvent) { held.delete(event.key.toLowerCase()); if (event.key === 'Shift') sprinting.value = false }
function visibility() { if (document.hidden) { paused.value = true; resetWalk() } }
function press(event: PointerEvent, key: string) {
  if (modal.value || paused.value) return
  const button = event.currentTarget as HTMLElement
  button.setPointerCapture(event.pointerId); held.add(key); path = []; destination = null
}
function tick(now: number) {
  const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now
  if (!modal.value && !paused.value) {
    const previousPlayer = player.value
    const speed = running.value || sprinting.value ? 220 : 160
    let dx = Number(['d','arrowright','up-right','down-right'].some(key=>held.has(key))) - Number(['a','arrowleft','up-left','down-left'].some(key=>held.has(key)))
    let dy = Number(['s','arrowdown','down-left','down-right'].some(key=>held.has(key))) - Number(['w','arrowup','up-left','up-right'].some(key=>held.has(key)))
    if (!dx && !dy && path.length) {
      const target = path[0]!, length = distance(player.value, target)
      if (length <= speed * dt + 1) { player.value = target; path.shift() }
      else { dx = (target.x - player.value.x) / length; dy = (target.y - player.value.y) / length }
    }
    const length = Math.hypot(dx, dy)
    walking.value = length > 0
    if (length) {
      player.value = movePlayer(player.value, dx / length * speed * dt, dy / length * speed * dt)
    }
    walking.value = distance(previousPlayer,player.value)>.05
    direction.value = travelDirection(previousPlayer,player.value,direction.value)
    // A delayed trail gives the companion its own footsteps, including around corners.
    if (!trail.length || distance(trail[trail.length - 1]!.point, player.value) > 2) trail.push({ point: { ...player.value }, time: now })
    // Consume the route only when the pet reaches it; dropping old corners can strand it behind a building.
    while (trail.length > 1 && distance(companion.value, trail[0]!.point) < 5) trail.shift()
    const follow = trail[0]?.point
    const previousCompanion = companion.value
    if (distance(previousPlayer, player.value) > .05) { lastOwnerMove = now; restAnchor = ''; restPath = [] }
    const restingPet = now - lastOwnerMove > 250
    if (restingPet) {
      const anchor = `${player.value.x},${player.value.y}`
      if (restAnchor !== anchor) {
        restAnchor = anchor
        const beside = petRestSpot(player.value, companion.value)
        restPath = [...findTownPath(companion.value, beside), beside]
      }
      while (restPath.length && distance(companion.value, restPath[0]!) < 1.5) restPath.shift()
      const target = restPath[0]
      if (target) {
        const gap = distance(companion.value, target), step = Math.min(gap, 170 * dt)
        if (gap > 0) companion.value = movePlayer(companion.value, (target.x-companion.value.x)/gap*step, (target.y-companion.value.y)/gap*step)
      }
      // Start the next follow trail from this resting spot, rather than retracing old footsteps.
      trail = [{point:{...player.value},time:now}]
    } else if (follow && trail[0]!.time < now - 250 && distance(companion.value, player.value) > 32) {
      const gap = distance(companion.value, follow)
      if (gap > 1) companion.value = movePlayer(companion.value, (follow.x - companion.value.x) / gap * Math.min(gap, (speed + 20) * dt), (follow.y - companion.value.y) / gap * Math.min(gap, (speed + 20) * dt))
    }
    const pet = petMovement(previousCompanion, companion.value, companionDirection.value)
    companionDirection.value = restingPet && !restPath.length ? 'down' : pet.direction; companionWalking.value = pet.walking
    if (!path.length && destination) {
      const target = destination; destination = null
      const location = LOCATIONS.find(item => item.id === target)!
      if (distance(player.value, doorFor(location)) < 57) open(target)
      else notify('That route is blocked. Try approaching from the plaza.')
    }
    for (const petal of petals.value.filter(item => distance(item, player.value) < 23)) {
      petals.value = petals.value.filter(item => item.id !== petal.id); collect(petal)
    }
    if (!petals.value.length) petals.value = petalPoints.map(point => ({ ...point, id: ++petalId }))
    if (delivery.value && distance(player.value, { x: 853, y: 337 }) < 43) {
      delivery.value = false; stats.deliveries++; stats.score += 150
      if (story.stage === 'deliver' && !story.completed) { story.completed = true; story.stage = 'complete'; open('thanks') }
      else notify('Luna: Thank you so much! A little kindness delivered.')
      void sparkle({ x: 853, y: 290 }); chime(); save()
    }
    if (running.value) { remaining.value = Math.max(0, remaining.value - dt); if (!remaining.value) finishRun() }
  } else { walking.value = false; companionWalking.value = false }
  frame = requestAnimationFrame(tick)
}
watch(() => nearby.value?.id, async () => {
  await nextTick()
  const markers = root.value?.querySelectorAll('.town-location-marker svg')
  if (!markers) return
  gsap.killTweensOf(markers); gsap.set(markers, { y: 0, scale: 1 })
  const active = root.value?.querySelector('.town-location-marker.nearby svg')
  if (active && useMotion.value) gsap.to(active, { y: -3, scale: 1.08, duration: .7, repeat: -1, yoyo: true, ease: 'sine.inOut' })
})
watch([character, night, motion], save)
watch(modal, async panel => {
  if (!panel || !useMotion.value) return
  await nextTick()
  if (!dialog.value) return
  context?.add(() => {
    gsap.fromTo(dialog.value, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .35, ease: 'power2.out', clearProps: 'transform,opacity' })
    if (panel === 'thanks') gsap.fromTo('.town-thankyou-card', { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .7, delay: .15, clearProps: 'transform,opacity' })
  })
})
watch(useMotion, enabled => { if (!enabled) { gsap.killTweensOf('.town-location-marker svg'); particles.value = [] } })
onMounted(() => {
  reduced.addEventListener('change', motionPreference)
  try {
    const stored = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')
    if (stored && typeof stored === 'object') {
      Object.assign(story, restoreStory(stored.story)); delivery.value = story.stage === 'deliver'
      for (const key of Object.keys(stats) as (keyof typeof stats)[]) if (Number.isSafeInteger(stored.stats?.[key]) && stored.stats[key] >= 0) stats[key] = Math.min(stored.stats[key], 9999999)
      visited.value = Array.isArray(stored.visited) ? stored.visited.filter((id: unknown) => LOCATIONS.some(item => item.id === id)) : []
      character.value = stored.character === 'girl' ? 'girl' : 'boy'; night.value = stored.night === true; motion.value = stored.motion !== false
      if(Number.isSafeInteger(stored.completedErrands)&&stored.completedErrands>=0)completedErrands.value=Math.min(stored.completedErrands,999999)
      if(['idle','laptop','bouquet','letter'].includes(stored.pocket))pocket.value=stored.pocket
      for(const id of ['lights','blooms','notes'] as const)if(Number.isSafeInteger(stored.activityWins?.[id])&&stored.activityWins[id]>=0)activityWins[id]=Math.min(stored.activityWins[id],999999)
      const savedErrand=stored.errand as ActivityId
      if(['lights','blooms','notes'].includes(savedErrand) && !delivery.value && story.stage!=='arrange' && Number.isInteger(stored.errandStep) && stored.errandStep>=0 && stored.errandStep<TOWN_ACTIVITIES[savedErrand].targets.length){errand.value=savedErrand;errandStep.value=stored.errandStep}
      if(typeof stored.note?.recipient==='string')recipient.value=stored.note.recipient.slice(0,40)
      if(typeof stored.note?.message==='string')message.value=stored.note.message.slice(0,160)
    }
  } catch { /* Ignore invalid or unavailable demo saves. */ }
  window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp); window.addEventListener('blur', resetWalk)
  document.addEventListener('visibilitychange', visibility)
  frame = requestAnimationFrame(tick)
  context = gsap.context(() => { if (useMotion.value) gsap.from('.town-enter', { y: 18, opacity: 0, duration: .7, stagger: .1, ease: 'power2.out', clearProps: 'all' }) }, root.value!)
})
onBeforeUnmount(() => {
  reduced.removeEventListener('change', motionPreference)
  cancelAnimationFrame(frame); if (toastTimer) clearTimeout(toastTimer)
  window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); window.removeEventListener('blur', resetWalk)
  document.removeEventListener('visibilitychange', visibility)
  gsap.killTweensOf(root.value?.querySelectorAll('.town-location-marker svg,.town-particle') || []); context?.revert(); void audio?.close()
})
</script>

<template>
  <main ref="root" class="town-demo" :class="{ 'town-reduced-motion': !useMotion }">
    <header class="town-topbar town-enter">
      <RouterLink to="/" class="town-back"><PhArrowLeft :size="18" weight="regular" /><span>Back to Stack Petals</span></RouterLink>
      <span class="town-demo-badge"><span></span> PLAYABLE DEMO</span>
      <button class="town-icon-button" type="button" aria-label="Town settings" @click="open('settings')"><PhGear :size="22" weight="duotone" /></button>
    </header>
    <section class="town-heading town-enter">
      <div><p class="town-eyebrow">WHERE CODE MEETS BLOOMS</p><h1>Stack Petals <em>Town.</em></h1><p>A little world to wander. A little joy to make.</p></div>
      <div class="town-heading-note"><PhSparkle :size="22" weight="duotone" /><span>Your everyday,<br /><strong>a little more magical.</strong></span></div>
    </section>
    <div class="town-layout town-enter">
      <section class="town-play-area" aria-label="Town game">
        <div class="town-hud">
          <div class="town-stat"><PhFlower :size="24" weight="duotone" /><div><small>PETALS</small><strong>{{ stats.petals }}</strong></div></div>
          <div class="town-stat"><component :is="running ? PhTrophy : PhHeart" :size="24" :weight="running ? 'duotone' : 'fill'" /><div><small>{{ running ? 'RUN SCORE' : 'KINDNESSES' }}</small><strong>{{ running ? roundScore : stats.deliveries }}</strong></div></div>
          <div class="town-stat town-timer"><PhClock :size="23" weight="duotone" /><div><small>{{ running ? 'BLOOM RUN' : 'TAKE YOUR TIME' }}</small><strong>{{ running ? `${Math.ceil(remaining)}s` : 'Free roam' }}</strong></div></div>
          <button class="town-icon-button" type="button" :aria-label="paused ? 'Resume game' : 'Pause game'" :disabled="!!modal" @click="paused = !paused; resetWalk()"><component :is="paused ? PhPlay : PhPause" :size="20" weight="fill" /></button>
        </div>
        <div class="town-map-shell">
          <TownWorld :player="player" :companion="companion" :companion-direction="companionDirection" :companion-walking="companionWalking" :walking="walking" :running="running || sprinting" :character="character" :direction="direction" :action="actorAction" :activity-target="target" :activity-step="errandStep" :lit-nodes="activityWins.lights>0?3:errand==='lights'?errandStep:0" :nurtured="activityWins.blooms>0" :petals="petals" :nearby="nearby?.id || null" :delivery="delivery" :night="night" :motion="useMotion" :paused="paused || !!modal" :stems="story.stems" :wrapping="story.wrapping" :garden="garden" :particles="particles" @walk="walk" @approach="approach" />
          <div v-if="paused && !modal" class="town-pause-overlay"><PhPause :size="32" weight="duotone" /><h2>A little pause.</h2><p>Your town will be right here.</p><button class="town-button" @click="paused = false; last = 0"><PhPlay :size="18" weight="fill" /> Keep exploring</button></div>
        </div>
        <div class="town-context-bar">
          <span><PhMapPin :size="18" weight="duotone" />{{ errand ? `${TOWN_ACTIVITIES[errand].title} · Stop ${errandStep+1} of ${TOWN_ACTIVITIES[errand].targets.length}` : delivery ? 'Bring your little kindness to Luna beside the pond.' : running ? 'Catch the pink petals. Every one is worth 25 points.' : nearby ? nearby.name : !story.completed ? storyObjective : 'Petal Plaza · Pick a place. Follow your curiosity.' }}</span>
          <button v-if="errand && !modal && !paused" class="town-small-button" @click="workReady?openWork():findWork()">{{ workReady?'Get started':'Find your stop' }}<PhArrowRight :size="16" weight="regular"/></button>
          <button v-else-if="delivery && !modal && !paused" class="town-small-button" @click="walk({ x: 853, y: 337 })">Find Luna <PhArrowRight :size="16" weight="regular" /></button><button v-else-if="nearby && !modal && !paused" class="town-small-button" @click="interact">Enter <PhArrowRight :size="16" weight="regular" /></button><button v-else-if="!modal && !paused && !running && !story.completed" class="town-small-button" @click="storyAction">{{ story.stage === 'new' ? 'Meet Milo' : story.stage === 'gather' && stats.petals < 3 ? 'Find a petal' : 'Atelier' }}<PhArrowRight :size="16" weight="regular" /></button>
        </div>
        <div class="town-controls"><p><PhKeyboard :size="20" weight="regular" /><span><kbd>W A S D</kbd> or arrows · <kbd>Shift</kbd> to run<br /><small>Combine directions for diagonal travel. <kbd>E</kbd> to interact.</small></span></p><div class="town-dpad" aria-label="Eight-way touch movement controls"><button v-for="control in controls" :key="control.key" type="button" :class="control.key" :aria-label="control.label" @pointerdown="press($event, control.key)" @pointerup="held.delete(control.key)" @pointercancel="held.delete(control.key)" @lostpointercapture="held.delete(control.key)"><component :is="control.icon" :size="18" weight="bold" /></button></div></div>
        <TownErrands :active="errand" :step="errandStep" :ready="workReady" :locked="errandLocked || paused" :tool="pocket" :completed="completedErrands" @start="startErrand" @find="findWork" @work="openWork" @cancel="cancelErrand" @equip="equip" />
      </section>
      <aside class="town-sidebar">
        <section class="town-story-card" aria-label="Your first delivery story">
          <p class="town-eyebrow">A LITTLE DELIVERY · CHAPTER 01</p><h2>{{ FIRST_DELIVERY.title }}</h2>
          <div class="town-story-people"><TownSprite sprite="boy-portrait" :scale=".38" /><PhArrowRight :size="16" weight="regular" /><TownSprite sprite="girl-portrait" :scale=".38" /><span>Milo, for Luna</span></div>
          <ol class="town-story-steps"><li v-for="(step, index) in STORY_STEPS" :key="step" :class="{ done: index < storyIndex || story.completed, active: index === storyIndex && !story.completed }"><PhCheck v-if="index < storyIndex || story.completed" :size="12" weight="fill" /><span v-else>{{ index + 1 }}</span>{{ step }}</li></ol>
          <p role="status">{{ storyObjective }}</p><button class="town-button town-full-button" :disabled="!!modal || paused" data-story-action @click="storyAction">{{ story.stage === 'new' ? 'Meet Milo' : story.stage === 'gather' && stats.petals < 3 ? 'Find a petal' : story.stage === 'gather' || story.stage === 'arrange' ? 'Visit the atelier' : story.stage === 'deliver' ? 'Find Luna' : 'Read your thank-you' }}<PhArrowRight :size="16" weight="regular" /></button>
        </section>
        <div class="town-directory-heading"><p class="town-eyebrow">THE NEIGHBOURHOOD</p><h2>Find your little thing.</h2><p>Choose a place and we'll walk you there.</p></div>
        <button v-for="location in LOCATIONS" :key="location.id" class="town-directory-card" :data-destination="location.id" :disabled="!!modal || paused" @click="approach(location.id)"><span class="town-directory-icon" :style="{ '--location-color': location.color }"><component :is="icons[location.id]" :size="24" weight="duotone" /></span><span><strong>{{ location.name }}</strong><small>{{ location.description }}</small></span><PhCheck v-if="visited.includes(location.id)" :size="17" weight="fill" /><PhArrowRight v-else :size="16" weight="regular" /></button>
        <div class="town-quest"><PhTrophy :size="22" weight="duotone" /><div><small>YOUR LITTLE MILESTONES</small><strong>{{ achievements.filter(item => item.done).length }} of {{ achievements.length }} unlocked</strong><div class="town-progress"><span :style="{ width: `${achievements.filter(item => item.done).length / achievements.length * 100}%` }"></span></div></div></div>
        <p class="town-local-note"><PhLock :size="15" weight="regular" /> Just a demo. Progress stays in this browser.</p>
      </aside>
    </div>
    <footer class="town-footer"><span>ENGINEERED WITH PRECISION. CRAFTED WITH LOVE.</span><span>Pixel world. Real little moments.</span></footer>
    <Transition name="town-toast"><div v-if="toast" class="town-toast" role="status"><PhCheck :size="20" weight="fill" /><span>{{ toast }}</span><button class="town-icon-button" aria-label="Dismiss notification" @click="toast = ''"><PhX :size="16" weight="regular" /></button></div></Transition>

    <div v-if="modal" class="town-modal-backdrop" @click.self="close">
      <section ref="dialog" class="town-dialog" role="dialog" aria-modal="true" aria-labelledby="town-dialog-title" tabindex="-1">
        <header class="town-dialog-header"><span class="town-dialog-symbol"><component :is="modal === 'activity' ? PhSparkle : modal === 'thanks' ? PhHeart : modal === 'welcome' ? PhFlower : modal === 'settings' ? PhGear : modal === 'result' ? PhTrophy : icons[modal]" :size="26" weight="duotone" /></span><button class="town-icon-button" aria-label="Close dialog" @click="close"><PhX :size="20" weight="regular" /></button></header>
        <p class="town-eyebrow">STACK PETALS TOWN</p><h2 id="town-dialog-title">{{ title }}</h2>
        <template v-if="modal === 'activity' && errand">
          <div class="town-work-scene"><TownActor :character="character" :action="actorAction" :motion="useMotion" :scale="1.25"/><component :is="errand==='lights'?PhCode:errand==='blooms'?PhFlower:PhHeart" :size="55" weight="duotone"/></div>
          <template v-if="errand==='lights'"><p>These little lights need a connection. Match the three symbols below, from left to right, to repair this node.</p><div class="town-work-pattern" aria-label="Repair sequence"><span v-for="(symbol,index) in repairPattern" :key="index" :class="{done:index<workStep}"><component :is="workIcons[symbol]" :size="26" weight="duotone"/><span class="sr-only">{{ ['Code','Sparkle','Heart'][symbol] }}</span></span></div><div class="town-work-choices"><button v-for="(icon,index) in workIcons" :key="index" :aria-label="['Connect code','Connect sparkle','Connect heart'][index]" @click="repair(index)"><component :is="icon" :size="28" weight="duotone"/></button></div></template>
          <template v-else-if="errand==='blooms'"><p>Every flower deserves a little attention. Give each of these three blooms a drink.</p><div class="town-work-choices"><button v-for="index in [0,1,2]" :key="index" :disabled="watered.includes(index)" :aria-label="`Water flower ${index+1}`" @click="water(index)"><component :is="watered.includes(index)?PhCheck:PhFlower" :size="30" :weight="watered.includes(index)?'fill':'duotone'"/></button></div></template>
          <template v-else><p>Luna has a quiet moment by the pond. A few kind words can make an ordinary afternoon feel special.</p><div class="town-postcard"><small>FOR {{ recipient.trim() || 'LUNA' }}</small><p>{{ message.trim() || 'You make this little town a brighter place.' }}</p></div><button class="town-button town-full-button" @click="completeWork"><PhHeart :size="20" weight="duotone"/>Give Luna your little note</button></template>
          <p class="town-work-feedback" role="status">{{ workFeedback }}</p>
        </template>
        <template v-else-if="modal === 'welcome'">
          <p>Someone needs a little sunshine today. Make a bouquet, bring it to a neighbour, and watch your kindness become a flower in the garden.</p>
          <div class="town-avatar-picker"><button v-for="avatar in ['boy', 'girl']" :key="avatar" :aria-pressed="character === avatar" @click="character = avatar"><TownSprite :sprite="`${avatar}-portrait`" :scale=".85" /><span>{{ avatar === 'boy' ? 'The developer' : 'The florist' }}</span><PhCheck v-if="character === avatar" :size="18" weight="fill" /></button></div>
          <div class="town-tip"><PhMapPin :size="20" weight="duotone" /><span>Tap a location to walk there. Use the arrow controls, or WASD, to explore freely.</span></div>
          <button class="town-button town-full-button" data-enter-town @click="close"><PhPlay :size="19" weight="fill" /> Enter the town <PhArrowRight :size="18" weight="regular" /></button>
          <small class="town-disclaimer">An independent preview. No purchases, accounts or real deliveries.</small>
        </template>
        <template v-else-if="modal === 'flowers'">
          <template v-if="story.stage === 'gather'">
            <div class="town-npc-dialogue"><TownSprite sprite="girl-portrait" :scale=".6" /><div><small>PIP · THE FLORIST</small><p>Milo told me about Luna. Gather three petals and we'll turn them into something lovely together.</p></div></div>
            <div class="town-tip"><PhFlower :size="20" weight="duotone" /><span>{{ stats.petals >= 3 ? 'Three petals, three flowers. Your atelier is ready.' : `You have ${stats.petals} petals. Pick up ${3 - stats.petals} more around the plaza.` }}</span></div>
            <button class="town-button town-full-button" :disabled="stats.petals < 3" data-begin-arrangement @click="beginArrangement">Make Luna's bouquet · 3 petals<PhArrowRight :size="18" weight="regular" /></button>
          </template>
          <TownAtelier v-else-if="story.stage === 'arrange'" :story="story" :motion="useMotion" @arrange="arrange" @finish="finishBouquet" />
          <template v-else-if="story.stage === 'deliver'">
            <div class="town-arrangement"><TownBouquet :stems="story.stems" :wrapping="story.wrapping" /></div><p class="town-arrangement-hint">A lovely little bow. A bouquet made by you. Luna is waiting by the pond.</p>
            <button class="town-button town-full-button" data-take-bouquet @click="close"><PhGift :size="20" weight="duotone" /> Take your bouquet into town</button>
          </template>
          <template v-else>
          <p>Three petals. A little patience. Something lovely, made by you.</p>
          <div class="town-bouquet-preview"><TownSprite :sprite="`bouquet-${bouquet}`" :scale="1.4" /></div>
          <div class="town-recipe-picker"><button v-for="item in [{ id: 'pink', name: 'Blush blooms' }, { id: 'blue', name: 'Blue skies' }, { id: 'sun', name: 'Sunshine' }]" :key="item.id" :aria-pressed="bouquet === item.id" @click="bouquet = item.id">{{ item.name }}<PhCheck v-if="bouquet === item.id" :size="16" weight="fill" /></button></div>
          <div class="town-tip"><PhFlower :size="20" weight="duotone" /><span>{{ stats.petals >= 3 ? `You have ${stats.petals} petals. This bouquet costs 3.` : `You have ${stats.petals} petals. Collect ${3 - stats.petals} more around town.` }}</span></div>
          <button class="town-button town-full-button" :disabled="stats.petals < 3" @click="craft"><PhFlower :size="20" weight="duotone" /> Craft a bouquet · 3 petals</button>
          </template>
        </template>
        <template v-else-if="modal === 'studio'">
          <div class="town-work-scene"><TownActor :character="character" action="laptop" :motion="useMotion" :scale="1.15"/><PhCode :size="48" weight="duotone"/></div>
          <button class="town-small-button" :disabled="errandLocked || !!errand" @click="startErrand('lights')">Take your laptop into town<PhArrowRight :size="16"/></button>
          <p>Small challenges. Bright ideas. You don't have to be a developer to start.</p>
          <div class="town-code-question"><PhCode :size="25" weight="duotone" /><h3>{{ challenge.prompt }}</h3></div>
          <div class="town-answer-list"><button v-for="(choice, index) in challenge.choices" :key="choice" :disabled="answer !== null" :class="{ correct: answer !== null && index === challenge.answer, incorrect: answer === index && index !== challenge.answer }" @click="solve(index)"><span>{{ choice }}</span><PhCheck v-if="answer !== null && index === challenge.answer" :size="19" weight="fill" /></button></div>
          <div v-if="answer !== null" class="town-tip"><PhSparkle :size="20" weight="duotone" /><span>{{ answer === challenge.answer ? 'Lovely work! +75 points. ' : 'A little learning goes a long way. ' }}{{ challenge.note }}</span></div>
          <button v-if="answer !== null" class="town-button town-full-button" @click="challengeIndex++; answer = null">Next challenge <PhArrowRight :size="18" weight="regular" /></button>
        </template>
        <template v-else-if="modal === 'delivery'">
          <template v-if="!story.completed">
            <div class="town-npc-dialogue"><TownSprite sprite="boy-portrait" :scale=".65" /><div><small>MILO · YOUR NEIGHBOUR</small><p>{{ FIRST_DELIVERY.request }}</p></div></div>
            <div class="town-request-palette"><span class="sun">Sunshine yellow</span><span class="pink">Soft pink</span><span class="blue">Sky blue</span></div>
            <button v-if="story.stage === 'new'" class="town-button town-full-button" data-accept-story @click="acceptStory"><PhHeart :size="20" weight="duotone" /> Let's make her day</button>
            <button v-else class="town-button town-full-button" @click="close(); storyAction()">{{ story.stage === 'deliver' ? 'Bring the bouquet to Luna' : 'Continue this little favour' }}<PhArrowRight :size="18" weight="regular" /></button>
            <p class="town-disclaimer">No timer. No perfect scores. Just a little kindness.</p>
          </template>
          <template v-else>
          <p>Someone by the pond is waiting for a little surprise. Could you make their day?</p>
          <div class="town-bouquet-preview"><TownSprite sprite="parcel" :scale="1.2" /></div>
          <div class="town-tip"><PhMapPin :size="20" weight="duotone" /><span>Take the parcel to the recipient on the right side of Petal Plaza. Look for the pink location pin.</span></div>
          <button class="town-button town-full-button" :disabled="!!errand" @click="delivery = true; close(); notify('Parcel picked up. Find the recipient beside the pond.')"><PhPackage :size="20" weight="duotone" />{{ delivery ? 'Continue your delivery' : 'Pick up a little kindness' }}</button>
          </template>
        </template>
        <template v-else-if="modal === 'thanks'">
          <div class="town-thanks-scene"><TownSprite sprite="girl-down" :scale="1.15" /><TownBouquet :stems="story.stems" :wrapping="story.wrapping" small /><svg class="town-pixel-heart" viewBox="0 0 20 18" shape-rendering="crispEdges" aria-hidden="true"><path d="M2 0H8V2H12V0H18V2H20V8H18V10H16V12H14V14H12V16H8V14H6V12H4V10H2V8H0V2H2Z" fill="#d983a3" /><path d="M3 3H7V5H3Z" fill="#fce0ea" /></svg></div>
          <div class="town-npc-dialogue"><div><small>LUNA · A LITTLE BRIGHTER TODAY</small><p>{{ FIRST_DELIVERY.thanks }}</p></div></div>
          <div class="town-thankyou-card"><small>A NOTE TO KEEP</small><p>{{ FIRST_DELIVERY.card }}</p><span>With love, Luna</span></div>
          <div class="town-tip"><PhFlower :size="20" weight="fill" /><span>Your first flower is growing in the community garden. This thank-you is saved in your browser.</span></div>
          <button class="town-button town-full-button" data-see-garden @click="close(); approach('garden')">See what kindness grows<PhArrowRight :size="18" weight="regular" /></button>
        </template>
        <template v-else-if="modal === 'arcade' || modal === 'result'">
          <div class="town-arcade-art"><PhGameController :size="64" weight="duotone" /><span>BLOOM RUN</span></div>
          <p>{{ modal === 'result' ? 'A few petals, a little adventure. Every run is a new beginning.' : 'Thirty seconds. A town full of petals. How much happiness can you collect?' }}</p>
          <div class="town-run-stats"><div><small>{{ modal === 'result' ? 'THIS RUN' : 'TIME LIMIT' }}</small><strong>{{ modal === 'result' ? roundScore : '30s' }}</strong></div><div><small>PERSONAL BEST</small><strong>{{ stats.best }}</strong></div></div>
          <button class="town-button town-full-button" @click="startRun"><component :is="modal === 'result' ? PhArrowCounterClockwise : PhPlay" :size="20" weight="fill" />{{ modal === 'result' ? 'A little more? Play again' : 'Start Bloom Run' }}</button>
        </template>
        <template v-else-if="modal === 'gifts'">
          <p>A few words can mean everything. Make a little postcard, just for fun.</p>
          <label class="town-field">For<input v-model="recipient" maxlength="40" placeholder="Someone special" /></label>
          <label class="town-field">Your little message<textarea v-model="message" maxlength="160" rows="3"></textarea><small>{{ message.length }} / 160</small></label>
          <div class="town-postcard"><TownSprite sprite="letter" :scale=".75" /><small>A LITTLE NOTE FOR {{ recipient.trim() || 'SOMEONE SPECIAL' }}</small><p>{{ message.trim() || 'Your words belong here.' }}</p><PhHeart :size="19" weight="duotone" /></div>
          <button class="town-button town-full-button" :disabled="errandLocked || !!errand" @click="startErrand('notes')">Carry this note to Luna<PhArrowRight :size="18"/></button>
          <p class="town-disclaimer">A keepsake for this demo town. It stays in your browser and is never sent or published as a customer letter.</p>
        </template>
        <template v-else-if="modal === 'garden'">
          <button class="town-small-button" :disabled="errandLocked || !!errand" @click="startErrand('blooms')"><PhFlower :size="18" weight="duotone"/>Care for the town's flower beds<PhArrowRight :size="16"/></button>
          <p>{{ garden === 0 ? 'A quiet little patch, waiting for its first act of kindness.' : garden === 1 ? 'Your kindness planted the first bloom. Three deliveries will bring a little garden bench.' : garden === 2 ? 'A place to sit, a few more blooms. Five deliveries will light up the garden.' : 'Flowers, fairy lights, and a place to stay a little longer. You made this happen.' }}</p>
          <div class="town-garden-milestones"><span :class="{ grown: garden >= 1 }"><PhFlower :size="20" weight="duotone" />1 · First bloom</span><span :class="{ grown: garden >= 2 }"><PhHeart :size="20" weight="duotone" />3 · A place to sit</span><span :class="{ grown: garden >= 3 }"><PhSparkle :size="20" weight="duotone" />5 · Fairy lights</span></div>
          <button v-if="story.completed" class="town-small-button" @click="open('thanks')">Luna's thank-you<PhArrowRight :size="16" weight="regular" /></button>
          <div class="town-achievement-list"><div v-for="item in achievements" :key="item.name" :class="{ unlocked: item.done }"><span><component :is="item.icon" :size="24" :weight="item.done ? 'fill' : 'duotone'" /></span><div><strong>{{ item.name }}</strong><small>{{ item.detail }}</small></div><small>{{ item.progress }}</small><PhCheck v-if="item.done" :size="17" weight="fill" /><PhLock v-else :size="17" weight="regular" /></div></div>
        </template>
        <template v-else-if="modal === 'settings'">
          <p>Your character, your pace. A town that feels like you.</p>
          <div class="town-avatar-picker"><button v-for="avatar in ['boy', 'girl']" :key="avatar" :aria-pressed="character === avatar" @click="character = avatar"><TownSprite :sprite="`${avatar}-portrait`" :scale=".65" /><span>{{ avatar === 'boy' ? 'Developer' : 'Florist' }}</span><PhCheck v-if="character === avatar" :size="18" weight="fill" /></button></div>
          <button class="town-setting" :aria-pressed="night" @click="night = !night"><component :is="night ? PhMoon : PhSun" :size="22" weight="duotone" /><span>Town atmosphere<small>{{ night ? 'Quiet evening' : 'Sunny afternoon' }}</small></span><span class="town-toggle" :class="{ on: night }"></span></button>
          <button class="town-setting" :aria-pressed="sound" @click="sound = !sound; chime()"><component :is="sound ? PhSpeakerHigh : PhSpeakerSlash" :size="22" weight="duotone" /><span>Little sound effects<small>{{ sound ? 'On · gentle collectible chimes' : 'Off · a peaceful little town' }}</small></span><span class="town-toggle" :class="{ on: sound }"></span></button>
          <button class="town-setting" :aria-pressed="useMotion" :disabled="reducedMotion" @click="motion = !motion"><PhSparkle :size="22" weight="duotone" /><span>Interface motion<small>{{ reducedMotion ? 'Reduced motion follows your device preference' : useMotion ? 'On · a little extra magic' : 'Off · keep things still' }}</small></span><span class="town-toggle" :class="{ on: useMotion }"></span></button>
        </template>
      </section>
    </div>
  </main>
</template>
