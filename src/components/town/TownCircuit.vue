<script setup lang="ts">
import { computed, ref } from 'vue'
import { PhLightning, PhLightbulb, PhArrowCounterClockwise, PhCheck } from '@phosphor-icons/vue'
import { makeCircuit, circuitPower, circuitPorts, circuitConnected } from '@/utils/townCircuit'
const props = defineProps<{ stop: number }>()
const emit = defineEmits<{ complete: [] }>()
const tiles = ref(makeCircuit(props.stop)), turns = ref(0)
const powered = computed(() => circuitPower(tiles.value)), connected = computed(() => circuitConnected(tiles.value))
const names = ['up', 'right', 'down', 'left']
function rotate(index: number) { tiles.value[index]!.turn = (tiles.value[index]!.turn + 1) % 4; turns.value++ }
function hint() {
  const next = tiles.value.findIndex(tile => tile.turn !== 0)
  if (next >= 0) { tiles.value[next]!.turn = 0; turns.value++ }
}
</script>
<template>
  <div class="town-circuit">
    <p>Turn the wire tiles to connect the battery on the left to the lamp on the right. Lit wires show where the power reaches.</p>
    <div class="circuit-board"><PhLightning class="circuit-battery" :size="25" weight="fill" /><div class="circuit-grid">
      <button v-for="(tile,index) in tiles" :key="index" :data-circuit-tile="index" :class="{ powered: powered.has(index) }" :aria-label="`Rotate wire row ${Math.floor(index/3)+1}, column ${index%3+1}. Connected sides: ${circuitPorts(tile).map(port=>names[port]).join(', ')}`" @click="rotate(index)">
        <svg viewBox="0 0 60 60" aria-hidden="true"><path v-for="port in circuitPorts(tile)" :key="port" :d="['M30 30V0','M30 30H60','M30 30V60','M30 30H0'][port]" /><circle cx="30" cy="30" r="5" /></svg>
      </button>
    </div><PhLightbulb class="circuit-lamp" :class="{ lit: connected }" :size="27" :weight="connected ? 'fill' : 'duotone'" /></div>
    <p role="status">{{ connected ? 'A complete connection. Your little lamp is ready to glow.' : 'No timer. Try a turn, follow the light, and take your time.' }}</p>
    <button class="town-button town-full-button" :disabled="!connected" data-power-circuit @click="emit('complete')"><PhCheck :size="19" weight="fill" /> Light up this corner</button>
    <div class="circuit-help"><button class="town-small-button" @click="hint">A little hint</button><button class="town-small-button" @click="tiles = makeCircuit(stop); turns = 0"><PhArrowCounterClockwise :size="16" /> Start again</button></div>
  </div>
</template>
<style scoped>
.circuit-board{position:relative;display:flex;align-items:center;justify-content:center;gap:10px;padding:24px 0}.circuit-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;width:min(270px,calc(100% - 65px))}.circuit-grid button{aspect-ratio:1;padding:0;min-width:0;overflow:hidden;border:1px solid #cbd5c2;border-radius:12px;background:#eef1e5;cursor:pointer;touch-action:manipulation}.circuit-grid svg{width:100%;height:100%;display:block;stroke:#a4b29b;stroke-width:5;fill:#a4b29b}.circuit-grid .powered{background:#f9efcb;border-color:#c4b975}.circuit-grid .powered svg{stroke:#af923d;fill:#af923d}.circuit-battery{color:#af923d;flex-shrink:0}.circuit-lamp{color:#9ba38d;flex-shrink:0}.circuit-lamp.lit{color:#b18c2c;filter:drop-shadow(0 0 9px #e9c957)}.circuit-help{display:flex;justify-content:space-between;gap:12px;margin-top:14px}.circuit-grid button:focus-visible{outline:3px solid #7d9c76;outline-offset:1px}
</style>
