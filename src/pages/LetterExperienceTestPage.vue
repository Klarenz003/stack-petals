<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import StackPetalsLetterExperience from '@/components/StackPetalsLetterExperience.vue'

const route = useRoute()
const themes = ['romance', 'family', 'birthday', 'sympathy', 'friendship', 'graduation', 'original'] as const
const activeTheme = computed(() => themes.includes(route.query.theme as any) ? String(route.query.theme) : 'romance')
const mockLetter = computed(() => ({
  id: 'local-test-letter',
  letter_theme: activeTheme.value,
  recipient: 'Favorite Person',
  sender: 'Someone who loves you',
  message: 'This is a local test letter for the Stack Petals cinematic experience.\n\nEvery detail was made to feel personal, warm, and memorable.',
  petal_messages: ['Your smile', 'Your kindness', 'Your courage', 'Your heart', 'Your laughter', 'The way you care'],
  memories: [],
}))

</script>

<template>
  <main class="letter-test-page">
    <StackPetalsLetterExperience :letter="mockLetter" show-picker />
  </main>
</template>

<style scoped>
.letter-test-page { min-height:100dvh; background:#f4eeea; }
</style>
