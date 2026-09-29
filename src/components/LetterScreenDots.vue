<script setup lang="ts">
const props = defineProps<{
  screenIndices: number[]
  activeScreen: number
}>()

const emit = defineEmits<{
  select: [screen: number]
}>()
</script>

<template>
  <div class="screen-dots" aria-label="Letter pages">
    <button
      v-for="screenIndex in props.screenIndices"
      :key="screenIndex"
      type="button"
      :class="{ active: props.activeScreen === screenIndex }"
      :aria-label="`Go to letter page ${screenIndex + 1}`"
      :aria-current="props.activeScreen === screenIndex ? 'page' : undefined"
      @click="emit('select', screenIndex)"
    ></button>
  </div>
</template>

<style scoped>
.screen-dots {
  position: absolute;
  bottom: var(--screen-dot-bottom);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 7px;
  z-index: 100;
  pointer-events: none;
}

.screen-dots button {
  width: 6px;
  height: 6px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #E8B4C0;
  cursor: pointer;
  opacity: 0.64;
  transition: all 0.24s ease;
  pointer-events: auto;
}

.screen-dots button.active {
  background: #D4687A;
  box-shadow: 0 0 0 4px rgba(212, 104, 122, 0.1);
  opacity: 1;
  width: 20px;
  border-radius: 999px;
}
</style>
