<script setup lang="ts">
import type { TownAction } from '@/utils/townActivities'
defineProps<{item:TownAction}>()
</script>
<template>
  <svg viewBox="0 0 40 44" shape-rendering="crispEdges" :data-held-item="item" aria-hidden="true">
    <g v-if="item==='laptop'">
      <path d="M3 7H36V29H38V34H1V29H3Z" fill="#302e39"/>
      <path d="M5 9H34V27H5Z" fill="#687f9c"/><path d="M7 11H32V25H7Z" fill="#263d55"/>
      <path d="M14 14H11V17H9V19H11V22H14V20H12V16H14ZM24 14H27V17H29V19H27V22H24V20H26V16H24Z" fill="#d4e9df"/>
      <path d="M20 13H22V17H20V21H18V24H16V20H18V16H20Z" fill="#e5b1c8"/>
      <path d="M3 29H36V32H3Z" fill="#e4d9d8"/><path d="M8 29H12V30H8ZM15 29H19V30H15ZM22 29H26V30H22ZM29 29H32V30H29Z" fill="#9c9da7"/>
      <path d="M14 32H26V34H14Z" fill="#a7abb3"/><rect x="19" y="8" width="2" height="1" fill="#e9d2d6"/>
    </g>
    <g v-else-if="item==='letter'">
      <path d="M3 12H37V34H3Z" fill="#8d5a72"/><path d="M5 14H35V32H5Z" fill="#fff1df"/>
      <path d="M5 15H8V18H11V21H14V24H26V21H29V18H32V15H35V18H32V21H29V24H26V27H14V24H11V21H8V18H5Z" fill="#dbabc0"/>
      <path d="M6 29H11V27H14V29H11V31H6ZM29 29H34V31H29V29H26V27H29Z" fill="#ead0c8"/>
      <path d="M17 23H24V25H26V30H24V32H17V30H15V25H17Z" fill="#be6d8e"/><path d="M18 25H23V29H18Z" fill="#efb3c7"/><rect x="19" y="25" width="2" height="2" fill="#ffe4e5"/>
    </g>
    <g v-else-if="item==='bouquet'">
      <path d="M19 28V9M20 28L9 12M21 27L31 11" stroke="#678b64" stroke-width="2"/>
      <path d="M13 24H8V18H12V21H16ZM26 23H33V18H29V20H24Z" fill="#8dac79"/>
      <path d="M6 22L20 28L35 22L27 40H14Z" fill="#b99580"/><path d="M8 23L20 30L33 23L25 39H15Z" fill="#f4ddbd"/><path d="M8 23L20 30L15 34ZM33 23L20 30L25 34Z" fill="#fff2d8"/>
      <g v-for="(flower,index) in [{x:9,y:12,c:'#e18fad'},{x:20,y:7,c:'#edafc5'},{x:31,y:12,c:'#d97d9e'},{x:15,y:18,c:'#e9bfd0'},{x:26,y:19,c:'#efa6bc'}]" :key="index" :transform="`translate(${flower.x} ${flower.y})`"><path d="M-3 -7H3V-3H7V3H3V7H-3V3H-7V-3H-3Z" fill="#ac627e"/><path d="M-2 -6H2V-2H6V2H2V6H-2V2H-6V-2H-2Z" :fill="flower.c"/><rect x="-2" y="-2" width="4" height="4" fill="#ffedba"/><rect x="-3" y="-5" width="2" height="2" fill="#ffdae5"/></g>
      <path d="M13 33H27V36H13ZM19 33H22V44H19Z" fill="#bd7192"/><path d="M13 33V29H17V31H20V33ZM27 33V29H23V31H20V33Z" fill="#de93af"/>
    </g>
    <g v-else-if="item==='watering'">
      <path d="M6 18H27V38H6ZM27 22H33V18H39V25H34V30H27Z" fill="#486f79"/><path d="M8 20H25V36H8ZM27 24H32V21H37V23H32V27H27Z" fill="#8eb9b5"/><path d="M9 18V9H22V18" stroke="#486f79" stroke-width="3" fill="none"/><path d="M11 23H14V33H11Z" fill="#d1e3d3"/><rect x="17" y="29" width="5" height="3" fill="#d2a0b5"/>
    </g>
  </svg>
</template>
