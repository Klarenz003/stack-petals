<script setup lang="ts">
import { PhCode, PhFlower, PhEnvelope, PhArrowRight, PhX, PhCheck, PhLaptop } from '@phosphor-icons/vue'
import { TOWN_ACTIVITIES, type ActivityId, type TownAction } from '@/utils/townActivities'
defineProps<{active:ActivityId|null;step:number;ready:boolean;locked:boolean;tool:TownAction;completed:number}>()
defineEmits<{start:[id:ActivityId];find:[];work:[];cancel:[];equip:[action:TownAction]}>()
const icons={lights:PhCode,blooms:PhFlower,notes:PhEnvelope}
</script>
<template>
  <section class="town-errands" aria-label="Little town activities">
    <header><div><p class="town-eyebrow">LITTLE THINGS, BIG FEELINGS</p><h3>A town worth lingering in.</h3></div><span><PhCheck :size="15" weight="fill"/>{{ completed }} errands</span></header>
    <div v-if="active" class="town-active-errand" aria-live="polite"><component :is="icons[active]" :size="26" weight="duotone"/><div><strong>{{ TOWN_ACTIVITIES[active].title }}</strong><small>Stop {{ step+1 }} of {{ TOWN_ACTIVITIES[active].targets.length }} · {{ ready ? 'You’re here. Let’s make something good.' : 'Follow the little marker in town.' }}</small></div><button class="town-small-button" @click="ready ? $emit('work') : $emit('find')">{{ ready?'Get started':'Take me there' }}<PhArrowRight :size="16"/></button><button class="town-icon-button" aria-label="Cancel this errand" @click="$emit('cancel')"><PhX :size="17"/></button></div>
    <div v-else class="town-errand-grid"><button v-for="(activity,id) in TOWN_ACTIVITIES" :key="id" :disabled="locked" @click="$emit('start',id)"><span class="town-errand-icon"><component :is="icons[id]" :size="25" weight="duotone"/></span><strong>{{ activity.title }}</strong><small>{{ activity.detail }}</small><span class="town-errand-reward">{{ activity.reward }} kindness <PhArrowRight :size="15"/></span></button></div>
    <p v-if="locked && !active" class="town-errand-hint">Finish your current delivery or run first. Your little errands will be waiting.</p>
    <div class="town-pocket-tools"><span>Pocket companions</span><button v-for="item in [{action:'idle',label:'Empty hands',icon:PhCheck},{action:'laptop',label:'Laptop',icon:PhLaptop},{action:'bouquet',label:'Flowers',icon:PhFlower},{action:'letter',label:'Letter',icon:PhEnvelope}] as const" :key="item.action" :disabled="locked || !!active" :aria-pressed="tool===item.action" @click="$emit('equip',item.action)"><component :is="item.icon" :size="16" :weight="tool===item.action?'fill':'duotone'"/>{{item.label}}</button></div>
  </section>
</template>
