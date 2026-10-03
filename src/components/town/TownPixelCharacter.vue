<script setup lang="ts">
import { computed } from 'vue'
import TownHeldItem from './TownHeldItem.vue'
import { characterView } from '@/utils/townCharacterArt'
import type { TownAction } from '@/utils/townActivities'
const props=withDefaults(defineProps<{character:string;direction:string;action:TownAction;walking:boolean;running:boolean;motion?:boolean}>(),{motion:true})
const view=computed(()=>characterView(props.direction))
const girl=computed(()=>props.character==='girl')
const holding=computed(()=>props.action!=='idle')
const projection=computed(()=>`translate(${40-view.value.projection*40} 0) scale(${view.value.projection} 1)`)
</script>
<template>
  <svg class="town-vector-character" :class="{girl,walking:walking&&motion,sprinting:running&&walking&&motion,breathing:!walking&&motion,'motion-off':!motion}" :data-facing="view.facing" :data-view="view.back?'rear':view.side?'profile':'front'" :data-diagonal="view.diagonal" :data-action="action" viewBox="0 0 80 108" shape-rendering="crispEdges" aria-hidden="true">
    <g :transform="view.mirrored?'translate(80 0) scale(-1 1)':undefined">
      <g :transform="projection">
        <g class="pixel-leg far"><path d="M25 78H38V98H24V93H22V84H25Z" fill="#292831"/><path d="M26 82H35V93H27Z" :fill="girl?'#f3c8b3':'#48424b'"/><path d="M23 95H38V103H21V99H23Z" fill="#302b33"/><path d="M24 96H36V101H23V98H24Z" fill="#e5dce0"/><rect x="25" y="97" width="8" height="2" fill="#fff7ec"/></g>
        <g class="pixel-leg near"><path d="M42 78H56V94H59V103H40V95H42Z" fill="#2b2630"/><path d="M44 82H53V95H44Z" :fill="girl?'#ffdcc5':'#514751'"/><path d="M43 96H55V98H57V101H42V98H43Z" fill="#fff5e9"/><rect x="44" y="99" width="11" height="2" fill="#d9cfd5"/></g>
        <g class="pixel-upper">
          <path v-if="girl" d="M20 21H61V30H65V46H69V73H64V83H57V87H22V82H16V72H12V49H16V31H20Z" fill="#35252b"/>
          <path v-if="girl" d="M20 34H58V78H62V81H54V83H24V78H19V66H16V51H20Z" fill="#694039"/>
          <g v-if="holding && view.back" transform="translate(39 48)"><TownHeldItem :item="action" x="0" y="0" width="35" height="39"/></g>
          <path d="M28 48H52V52H59V61H62V75H58V82H22V76H18V61H22V53H28Z" fill="#29252d"/>
          <path d="M29 51H50V55H55V73H25V56H29Z" :fill="girl?'#fff2e3':'#39343e'"/>
          <path v-if="view.diagonal" d="M50 55H55V73H51V70H48V61H50Z" :fill="girl?'#ead4c8':'#292631'"/>
          <path v-if="!girl" d="M28 55H33V59H36V65H33V59H30ZM49 55H45V59H42V65H45V59H48Z" fill="#938089"/>
          <path v-if="!girl && view.back" d="M29 52H49V63H46V66H33V63H29Z" fill="#51414a"/>
          <path v-if="girl" d="M27 66H53V72H57V79H60V85H20V79H23V72H27Z" fill="#a75b7a"/>
          <path v-if="girl" d="M29 68H51V75H55V81H25V75H29Z" fill="#ed99b6"/><path v-if="girl" d="M30 71H34V80H30ZM47 73H51V81H47Z" fill="#ffc2cf"/>
          <path v-if="girl && !view.back" d="M34 52H46V57H42V61H38V57H34Z" fill="#d884a2"/>
          <path v-if="!holding" d="M21 57H27V76H24V80H20V75H18V63H21ZM54 57H60V64H63V75H60V80H55V75H54Z" :fill="girl?'#fff3e6':'#453842'"/>
          <path v-if="!holding" d="M20 75H25V80H20ZM56 75H61V80H56Z" fill="#efb599"/>
          <g class="pixel-head">
            <path d="M21 9H27V5H35V3H47V6H56V10H61V17H65V27H63V40H58V47H52V51H29V48H22V43H17V32H16V19H21Z" fill="#2b2027"/>
            <path v-if="!girl" d="M19 20H14V16H20V10H25V5H32V9H37V3H43V6H48V2H53V8H60V6H64V14H68V19H64V28H61V37H19Z" fill="#2b2027"/>
            <path d="M24 11H30V8H36V6H46V9H55V13H59V23H61V34H57V43H50V47H31V44H25V39H21V27H20V19H24Z" fill="#70453e"/>
            <path v-if="!girl" d="M20 17H23V12H29V8H32V13H38V7H42V10H49V7H52V13H59V11H61V18H65V21H60V28H23Z" fill="#654039"/>
            <path d="M29 13H33V10H44V12H51V17H56V24H52V29H29V25H24V19H29Z" fill="#8f5c4c"/>
            <template v-if="!view.back">
              <path :d="view.diagonal||view.side?'M34 26H57V30H62V39H57V45H48V49H38V45H32V36H34Z':'M24 26H57V31H61V39H57V44H51V49H31V45H24V40H21V32H24Z'" fill="#ffdbb9"/>
              <path d="M24 27H31V32H27V38H23V32H24ZM55 33H59V39H55Z" fill="#e6a184"/>
              <g class="pixel-eyes" :style="{transformOrigin:view.diagonal||view.side?'49px 36px':'40px 36px'}">
                <path v-if="!view.side" :d="view.diagonal?'M39 31H44V40H39Z':'M27 31H34V41H27Z'" fill="#442d30"/><path :d="view.side?'M53 31H59V40H53Z':view.diagonal?'M53 31H59V41H53Z':'M47 31H54V41H47Z'" fill="#442d30"/>
                <path v-if="!view.side" :d="view.diagonal?'M40 32H42V35H40Z':'M28 32H31V35H28Z'" fill="#fff8ed"/><path :d="view.side||view.diagonal?'M54 32H57V35H54Z':'M48 32H51V35H48Z'" fill="#fff8ed"/>
              </g>
              <path :d="view.diagonal||view.side?'M48 44H53V46H48Z':'M37 44H43V46H37Z'" fill="#b96972"/><path v-if="!view.side" d="M26 40H31V42H26ZM51 40H56V42H51Z" fill="#efaaa6"/>
              <path d="M23 18H31V24H36V28H40V22H44V27H48V20H54V26H58V17H55V13H49V10H32V13H25Z" fill="#684038"/>
              <path v-if="!girl" d="M22 16H29V11H34V17H40V13H46V17H51V13H57V22H54V28H49V23H44V29H40V23H36V31H31V26H27V29H23Z" fill="#58363a"/>
              <path v-if="girl" d="M20 23H25V38H29V47H24V44H19V37H17V27H20ZM57 24H62V36H65V47H61V56H58V47H55V39H57Z" fill="#78483d"/>
            </template>
            <template v-else><path d="M26 17H32V12H46V16H54V23H58V37H53V45H31V42H25V33H23V22H26Z" fill="#825144"/><path d="M29 21H34V16H42V19H49V27H53V38H48V43H34V38H29Z" fill="#714338"/><path v-if="view.diagonal" d="M59 32H62V38H59V41H57V36H59Z" fill="#d99f82"/><path v-if="girl" d="M26 35H30V49H34V65H30V78H24V72H20V51H23V43H26ZM48 38H55V53H60V69H56V80H49V73H45V58H48Z" fill="#74463b"/></template>
            <g v-if="girl" :transform="view.back?'translate(-3 0)':undefined"><path d="M54 14H60V18H64V24H60V28H54V24H50V18H54Z" fill="#ae587c"/><path d="M55 15H59V19H63V23H59V27H55V23H51V19H55Z" fill="#f3a1bc"/><rect x="55" y="19" width="4" height="4" fill="#ffe6a0"/><path d="M58 13H62V10H67V16H62V19H60Z" fill="#829b69"/></g>
          </g>
          <g v-if="holding && !view.back" :transform="view.diagonal||view.side?'translate(7 0)':undefined">
            <path d="M23 55H29V65H34V70H28V68H22V63H20V57H23ZM53 55H59V57H62V63H60V68H54V70H48V65H53Z" :fill="girl?'#fff0e1':'#463942'"/>
            <TownHeldItem :item="action" x="21" y="50" width="38" height="42"/>
            <path d="M22 67H27V73H22ZM53 67H58V73H53Z" fill="#f3c0a2"/><path d="M23 68H26V70H23ZM54 68H57V70H54Z" fill="#ffdfbb"/>
          </g>
        </g>
      </g>
    </g>
  </svg>
</template>
<style scoped>
.town-vector-character{display:block;width:100%;height:100%;overflow:visible;pointer-events:none}.pixel-upper{transform-origin:40px 83px}.pixel-leg{transform-box:view-box;transform-origin:40px 94px}.breathing .pixel-upper{animation:pixel-breathe 3.6s steps(4,end) infinite}.breathing .pixel-eyes{animation:pixel-blink 6.4s steps(1,end) infinite}.walking .pixel-upper{animation:pixel-walk-bob .36s steps(2,end) infinite}.walking .pixel-leg.near{animation:pixel-foot .36s steps(2,end) infinite}.walking .pixel-leg.far{animation:pixel-foot .36s steps(2,end) -.18s infinite}.sprinting.walking .pixel-upper,.sprinting.walking .pixel-leg{animation-duration:.24s}.sprinting.walking .pixel-leg.far{animation-delay:-.12s}.girl.breathing .pixel-upper{animation-delay:-1.1s}.girl.breathing .pixel-eyes{animation-delay:-2.3s}
@keyframes pixel-breathe{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-.5px) scaleY(1.012)}}@keyframes pixel-blink{0%,43%,47%,100%{transform:scaleY(1)}44%,46%{transform:scaleY(.08)}}@keyframes pixel-walk-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}}@keyframes pixel-foot{0%,100%{transform:translate(0,0)}50%{transform:translate(2px,-3px)}}
.motion-off *{animation:none!important}@media(prefers-reduced-motion:reduce){.town-vector-character *{animation:none!important}}
</style>
