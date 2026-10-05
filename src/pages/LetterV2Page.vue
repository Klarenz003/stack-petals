<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import StackPetalsLetterExperience from '@/components/StackPetalsLetterExperience.vue'
import { loadAccessibleLetter } from '@/services/letterAccess'
import LetterPasswordGate from '@/components/LetterPasswordGate.vue'
import type { LetterRecord } from '@/types/letter'
import { reportStorefrontError } from '@/services/errorTracker'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const locked = ref(false)
const letter = ref<LetterRecord | null>(null)

onMounted(async () => {
  try {
    const result = await loadAccessibleLetter(String(route.params.id || ''))
    if (result.status === 'locked') locked.value = true
    else if (result.letter?.published) letter.value = result.letter
    else error.value = 'This letter is unavailable.'
  } catch (loadError) {
    reportStorefrontError('letter.load', loadError)
    error.value = 'This letter is unavailable.'
  }
  loading.value = false
})
</script>

<template>
  <main class="letter-v2-page">
    <div v-if="loading" class="letter-v2-loading">Preparing your letter…</div>
    <div v-else-if="error" class="letter-v2-error">{{ error }}</div>
    <LetterPasswordGate v-else-if="locked" :letter-id="String(route.params.id)" @unlocked="letter = $event; locked = false" />
    <StackPetalsLetterExperience v-else-if="letter" :letter="letter" />
  </main>
</template>

<style scoped>
.letter-v2-page { min-height: 100dvh; background: #f4eeea; }
.letter-v2-loading, .letter-v2-error { min-height: 100dvh; display: grid; place-items: center; padding: 24px; color: #60434d; font: 16px/1.5 'DM Sans', sans-serif; text-align: center; }
</style>
