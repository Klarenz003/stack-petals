<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import StackPetalsLetterExperience from '@/components/StackPetalsLetterExperience.vue'
import { supabase } from '@/supabaseClient'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const letter = ref<Record<string, unknown> | null>(null)

onMounted(async () => {
  const { data, error: loadError } = await supabase
    .from('letters')
    .select('*')
    .eq('id', String(route.params.id || ''))
    .eq('published', true)
    .single()
  if (loadError || !data) error.value = 'This LetterPage V2 is unavailable.'
  else letter.value = data
  loading.value = false
})
</script>

<template>
  <main class="letter-v2-page">
    <div v-if="loading" class="letter-v2-loading">Preparing your letter…</div>
    <div v-else-if="error" class="letter-v2-error">{{ error }}</div>
    <StackPetalsLetterExperience v-else-if="letter" :letter="letter" />
  </main>
</template>

<style scoped>
.letter-v2-page { min-height: 100dvh; background: #f4eeea; }
.letter-v2-loading, .letter-v2-error { min-height: 100dvh; display: grid; place-items: center; padding: 24px; color: #60434d; font: 16px/1.5 'DM Sans', sans-serif; text-align: center; }
</style>
