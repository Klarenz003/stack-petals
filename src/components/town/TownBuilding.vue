<script setup lang="ts">
defineProps<{ color: string; kind: string }>()
</script>
<template>
  <svg viewBox="0 0 160 144" class="town-building" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="12" y="132" width="140" height="8" fill="#456b5540" />
    <rect x="18" y="51" width="124" height="82" fill="#d8b9a0" /><rect x="22" y="51" width="116" height="77" fill="#fff0d8" />
    <path d="M8 51V39H18V27H28V17H38V7H122V17H132V27H142V39H152V51Z" fill="#655e61" />
    <path d="M14 45V39H24V27H34V17H44V11H116V17H126V27H136V39H146V45Z" :fill="color" />
    <path d="M33 21H126M23 33H137M15 44H146" stroke="#ffffff36" stroke-width="4" />
    <rect x="65" y="85" width="34" height="48" fill="#ba8d77" /><rect x="70" y="89" width="24" height="42" fill="#715957" /><rect x="85" y="108" width="4" height="4" fill="#eac798" />
    <rect x="28" y="74" width="27" height="29" fill="#ae8976" /><rect x="31" y="77" width="21" height="23" fill="#8fb4bd" />
    <path d="M41 77V100M31 88H52" stroke="#fff0d8" stroke-width="3" />
    <rect x="108" y="74" width="27" height="29" fill="#ae8976" /><rect x="111" y="77" width="21" height="23" fill="#8fb4bd" />
    <path d="M121 77V100M111 88H132" stroke="#fff0d8" stroke-width="3" />
    <path d="M20 55H142V65H136V69H124V65H112V69H100V65H88V69H76V65H64V69H52V65H40V69H28V65H20Z" :fill="color" />
    <path d="M32 55V65M56 55V65M80 55V65M104 55V65M128 55V65" stroke="#fff1df" stroke-width="12" />
    <rect x="24" y="117" width="30" height="13" fill="#a17765" /><rect x="108" y="117" width="30" height="13" fill="#a17765" />
    <path d="M28 119V110H33V114H40V107H46V114H51V120M111 120V113H117V108H124V114H132V109H136V120" fill="#7c9c64" />
    <path v-if="kind === 'flowers' || kind === 'gifts'" d="M29 110H35V115H29ZM41 106H47V112H41ZM119 107H125V113H119ZM130 108H136V114H130Z" fill="#df8da2" />
    <rect x="59" y="129" width="46" height="6" fill="#d5c2aa" />
    <rect v-if="kind === 'studio'" x="112" y="33" width="19" height="19" fill="#665e6e" /><path v-if="kind === 'studio'" d="M116 39L112 43L116 47M126 39L130 43L126 47" stroke="#d9eff0" stroke-width="2" fill="none" />
    <rect v-if="kind === 'arcade'" x="67" y="12" width="24" height="22" fill="#726383" /><rect v-if="kind === 'arcade'" x="73" y="17" width="12" height="11" fill="#e6b8e2" />
    <g v-if="kind === 'flowers'"><path d="M40 12H118V20H128V37H31V24H40Z" fill="#bad6cd" /><path d="M47 15V37M67 15V37M87 15V37M107 15V37M32 27H126" stroke="#f5eedd" stroke-width="3" /><rect x="48" y="32" width="13" height="5" fill="#d899ac" /><rect x="82" y="31" width="18" height="6" fill="#e5c584" /></g>
    <g v-if="kind === 'studio'"><rect x="32" y="80" width="19" height="15" fill="#58596d" /><rect x="35" y="83" width="13" height="8" fill="#b2d5cc" /><rect x="114" y="81" width="15" height="12" fill="#5a606c" /><path d="M117 85H124M117 89H122" stroke="#c4ddd1" stroke-width="2" /></g>
    <g v-if="kind === 'delivery'"><rect x="28" y="94" width="19" height="18" fill="#cfad88" /><path d="M36 95V112M28 102H47" stroke="#f2dbc0" stroke-width="3" /><rect x="118" y="101" width="20" height="18" fill="#bd9279" /><rect x="125" y="101" width="5" height="18" fill="#f3d5b4" /></g>
    <g v-if="kind === 'gifts'"><path d="M65 25H92V45H65Z" fill="#efd0db" /><path d="M78 25V45M65 30H92" stroke="#fff2df" stroke-width="4" /><path d="M77 24H70V19H75V22H77M80 24H87V19H82V22H80" fill="#b7708d" /></g>
    <g v-if="kind === 'garden'"><path d="M72 33H85V42H72Z" fill="#b3896f" /><path d="M78 34V17M78 25H66V18H72V22M79 28H92V21H87V25" stroke="#70925c" stroke-width="4" /><path d="M73 11H83V19H73Z" fill="#e7a5b7" /></g>
  </svg>
</template>
<style scoped>.town-building { display: block; width: 160px; height: 144px; image-rendering: pixelated; filter: drop-shadow(0 6px 0 #526e4920); }</style>
