<script setup lang="ts">
import { computed } from 'vue'
import { PhHeart } from '@phosphor-icons/vue'
import { useRoute } from 'vue-router'
import { useCanvas } from '@/composables/useCanvas'

useCanvas()

const route = useRoute()

const symbols = ['</>', '{}', '()', 'const', '=>', '[]', 'let', 'await', 'heart']
const snippets = [
  { file: 'petals.ts', lines: ['// where code meets blooms', 'const gift = {', '  crafted: true,', "  madeWith: 'care'", '};'] },
  { file: 'keepsake.vue', lines: ['<StackPetals>', '  <Flowers />', '  <YourStory />', '</StackPetals>'] },
  { file: 'moments.ts', lines: ['async function bloom() {', '  await craft.byHand();', '  return aLittleMeaning;', '}'] },
  { file: 'story.css', lines: ['.thoughtful-gift {', '  care: intentional;', '  memories: forever;', '}'] },
]

const density = computed(() => {
  if (['track', 'receipt', 'contact'].includes(String(route.name))) return 10
  if (route.name === 'products') return 14
  return 18
})

const items = computed(() =>
  Array.from({ length: density.value }, (_, index) => ({
    id: `${String(route.name || 'page')}-${index}`,
    symbol: symbols[index % symbols.length],
    left: `${(index * 17 + 8) % 96}%`,
    delay: `${-(index * 1.9) % 18}s`,
    duration: `${18 + (index % 7) * 3}s`,
    drift: `${index % 2 === 0 ? 22 + (index % 4) * 8 : -22 - (index % 4) * 8}px`,
    size: `${10 + (index % 5) * 2}px`,
    opacity: `${0.16 + (index % 5) * 0.035}`,
  }))
)

function isPetal(symbol: string) {
  return symbol === 'heart'
}
</script>

<template>
  <canvas id="circuit-canvas" aria-hidden="true"></canvas>
  <canvas id="petal-canvas" aria-hidden="true"></canvas>
  <div class="petal-code-bg" aria-hidden="true">
    <div class="code-grid"></div>
    <div v-for="(snippet, index) in snippets" :key="snippet.file" class="code-snippet" :class="`code-snippet--${index}`">
      <div class="code-snippet-file"><span></span><span></span><span></span><b>{{ snippet.file }}</b></div>
      <div class="code-snippet-lines"><div v-for="(line, number) in snippet.lines" :key="number"><i>{{ number + 1 }}</i><code>{{ line }}</code></div></div>
    </div>
    <span
      v-for="item in items"
      :key="item.id"
      class="petal-code-item"
      :class="{ petal: isPetal(item.symbol) }"
      :style="{
        left: item.left,
        animationDelay: item.delay,
        animationDuration: item.duration,
        '--drift': item.drift,
        '--size': item.size,
        '--opacity': item.opacity,
        '--rest-top': `${12 + (items.indexOf(item) * 13) % 80}vh`,
      }"
    >
      <PhHeart v-if="item.symbol === 'heart'" :size="'1em'" />
      <template v-else>{{ item.symbol }}</template>
    </span>
  </div>
</template>

<style scoped>
.petal-code-bg { z-index:1; }
.code-grid { position:absolute; inset:0; background-image:linear-gradient(#8da9820d 1px,transparent 1px),linear-gradient(90deg,#8da9820d 1px,transparent 1px); background-size:64px 64px; mask-image:radial-gradient(ellipse at center,transparent 15%,#000 85%); }
.code-snippet { position:absolute; width:246px; padding:12px 14px 14px; border:1px solid #86a37e33; border-radius:12px; background:#fffaf526; color:#5b7c61; font-family:'Fira Code','Courier New',monospace; font-size:11px; line-height:1.9; opacity:.48; transform:rotate(-5deg); }
.code-snippet--0 { left:2%; top:18%; }
.code-snippet--1 { right:3%; top:34%; color:#a76e7a; border-color:#bc839333; transform:rotate(6deg); }
.code-snippet--2 { left:5%; bottom:16%; transform:rotate(4deg); }
.code-snippet--3 { right:2%; bottom:4%; color:#a76e7a; border-color:#bc839333; transform:rotate(-5deg); }
.code-snippet-file { display:flex; align-items:center; gap:4px; padding-bottom:8px; margin-bottom:8px; border-bottom:1px solid #85997e33; }
.code-snippet-file > span { width:4px; height:4px; border-radius:50%; background:currentColor; opacity:.6; }
.code-snippet-file b { margin-left:9px; font-size:9px; font-weight:400; letter-spacing:.04em; }
.code-snippet-lines > div { display:flex; gap:12px; }
.code-snippet-lines i { width:10px; flex:none; color:#9a8a78; font-style:normal; font-size:9px; text-align:right; }
.code-snippet-lines code { white-space:pre; font-family:inherit; font-size:inherit; }
.petal-code-item { animation-name:programmer-drift; font-weight:400; text-shadow:none; }
@keyframes programmer-drift { 0% { opacity:0; transform:translate3d(0,-8vh,0); } 12%,88% { opacity:var(--opacity); } 50% { transform:translate3d(var(--drift),50vh,0); } 100% { opacity:0; transform:translate3d(0,112vh,0); } }
@media(max-width:700px) { .code-grid { background-size:48px 48px; } .code-snippet { width:190px; font-size:9px; padding:10px; opacity:.35; } .code-snippet--0 { left:-25px; top:14%; } .code-snippet--1 { right:-30px; top:55%; } .code-snippet--2,.code-snippet--3 { display:none; } }
@media(prefers-reduced-motion:reduce) { .petal-code-item { animation:none; top:var(--rest-top); opacity:var(--opacity); } }
@media print { .petal-code-bg,#circuit-canvas,#petal-canvas { display:none; } }
</style>
