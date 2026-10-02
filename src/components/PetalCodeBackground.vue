<script setup lang="ts">
import { computed } from 'vue'
import { PhHeart } from '@phosphor-icons/vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const symbols = ['</>', '{}', '()', 'const', '</>', '[]', 'let', '{}', 'heart']

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
    opacity: `${0.08 + (index % 5) * 0.025}`,
  }))
)

function isPetal(symbol: string) {
  return symbol === 'heart'
}
</script>

<template>
  <div class="petal-code-bg" aria-hidden="true">
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
      }"
    >
      <PhHeart v-if="item.symbol === 'heart'" :size="'1em'" />
      <template v-else>{{ item.symbol }}</template>
    </span>
  </div>
</template>
