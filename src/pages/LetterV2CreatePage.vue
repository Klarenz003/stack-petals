<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'
import { reportStorefrontError } from '@/services/errorTracker'
import { getGiftCapabilities } from '@/utils/giftCapabilities'
import GiftQrHeader from '@/components/GiftQrHeader.vue'
import MemoryPhotoUpload from '@/components/MemoryPhotoUpload.vue'
import { DEFAULT_PETAL_MESSAGES, getPetalMessages } from '@/utils/letterDefaults'
import { PhCheck, PhPaperPlaneTilt } from '@phosphor-icons/vue'
const themes = ['romance', 'family', 'birthday', 'sympathy', 'friendship', 'graduation']
const petalMessages = ref<string[]>([...DEFAULT_PETAL_MESSAGES])
const route = useRoute(); const router = useRouter(); const saving = ref(false); const error = ref(''); const from = ref(''); const to = ref(''); const theme = ref('romance'); const message = ref(''); const memories = ref<string[]>([]); const canUpload = ref(true); const claimValid = ref(false)
onMounted(() => { try { const claim = JSON.parse(localStorage.getItem('stack-petals:letter-v2-claim') || 'null'); claimValid.value = Boolean(claim?.token === String(route.params.token || '') && claim?.qrId); canUpload.value = getGiftCapabilities(claim).hasPhotoUpload } catch { claimValid.value = false } if (!claimValid.value) error.value = 'Please open this page from your gift QR link first.' })

async function publish() {
  if (!claimValid.value || saving.value) return
  saving.value = true
  error.value = ''
  try {
    const { data, error: publishError } = await supabase.rpc('create_letter_v2', {
      p_public_token: String(route.params.token || ''),
      p_from: from.value.trim(),
      p_to: to.value.trim(),
      p_theme: theme.value,
      p_message: message.value.trim(),
      p_memories: memories.value,
      p_petal_messages: getPetalMessages(petalMessages.value),
    })
    if (publishError) throw publishError
    const id = Array.isArray(data) ? data[0]?.id : data?.id
    if (!id) throw new Error('The letter could not be created.')
    localStorage.removeItem('stack-petals:letter-v2-claim')
    await router.replace(`/letter-v2/${id}`)
  } catch (publishError) {
    reportStorefrontError('letter.publish', publishError)
    error.value = 'We couldn’t publish your letter. Your message is still here—please try again. If this continues, contact us for help.'
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <main class="gift-studio">
    <section class="gift-studio-shell" aria-labelledby="gift-composer-title">
      <GiftQrHeader composing />
      <div class="gift-studio-body">
        <p class="gift-studio-eyebrow">The words make it yours</p>
        <h1 id="gift-composer-title">A little letter. A lot of heart.</h1>
        <p class="gift-studio-intro">A personal message, little memories, and all the things worth saying.</p>
        <div class="gift-studio-activated"><PhCheck :size="15" weight="bold" aria-hidden="true" />{{ claimValid ? 'Your gift is activated. Let’s make it yours.' : 'Activate your Gift QR card to begin.' }}</div>
        <form @submit.prevent="publish" :aria-busy="saving">
          <fieldset class="gift-studio-fields" :disabled="saving || !claimValid">
            <legend class="gift-studio-sr-only">Personalize your gift letter</legend>
            <section class="gift-studio-form-card" aria-labelledby="gift-theme-title">
              <h2 id="gift-theme-title">Set the feeling.</h2>
              <p class="gift-studio-hint">Choose the style that feels most like your message.</p>
              <div class="gift-studio-themes" role="group" aria-labelledby="gift-theme-title">
                <button v-for="option in themes" :key="option" type="button" :aria-pressed="theme === option" :class="{ 'is-selected': theme === option }" @click="theme = option">{{ option }}</button>
              </div>
            </section>
            <section class="gift-studio-form-card" aria-labelledby="gift-message-title">
              <h2 id="gift-message-title">From your heart.</h2>
              <div class="gift-studio-name-grid">
                <label class="gift-studio-field" for="gift-letter-from">From<input id="gift-letter-from" v-model="from" maxlength="120" placeholder="Your name" /></label>
                <label class="gift-studio-field" for="gift-letter-to">To<input id="gift-letter-to" v-model="to" maxlength="120" placeholder="Recipient’s name" required /></label>
              </div>
              <label class="gift-studio-field" for="gift-letter-message">Your message<textarea id="gift-letter-message" v-model="message" rows="8" maxlength="2000" placeholder="Write something from the heart…" required></textarea></label>
              <p class="gift-studio-character-count">{{ message.length.toLocaleString() }} / 2,000 characters</p>
            </section>
            <section class="gift-studio-form-card" aria-labelledby="gift-little-things-title">
              <p class="gift-studio-eyebrow">Chapter 02 · Included in every letter</p>
              <h2 id="gift-little-things-title">It’s the little things.</h2>
              <p class="gift-studio-hint">Six tiny reminders for someone special. Keep these defaults or make each one your own.</p>
              <div class="gift-studio-petal-grid">
                <div v-for="(title, index) in DEFAULT_PETAL_MESSAGES" :key="index" class="gift-studio-petal">
                  <label :for="`gift-petal-${index}`"><span aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>{{ title }}</label>
                  <textarea :id="`gift-petal-${index}`" v-model="petalMessages[index]" maxlength="60" rows="3" :placeholder="title" :aria-describedby="`gift-petal-count-${index}`"></textarea>
                  <small :id="`gift-petal-count-${index}`">{{ petalMessages[index].length }} / 60</small>
                </div>
              </div>
              <p class="gift-studio-hint">Leave a note empty and we’ll use its default, so all six reminders are always included.</p>
            </section>
            <section v-if="canUpload" class="gift-studio-form-card" aria-labelledby="gift-memories-title">
              <h2 id="gift-memories-title">Little moments. Lasting memories.</h2>
              <p class="gift-studio-hint">Add up to three photos to make their letter even more personal.</p>
              <MemoryPhotoUpload v-model="memories" :disabled="saving || !claimValid" />
            </section>
          </fieldset>
          <p v-if="error" class="gift-studio-error" role="alert">{{ error }}</p>
          <div class="gift-studio-publish">
            <p class="gift-studio-hint">Once published, your Gift QR will open this letter directly—no activation code needed.</p>
            <button class="gift-studio-primary" :disabled="saving || !claimValid || !to.trim() || !message.trim()">{{ saving ? 'Publishing your letter…' : 'Publish your letter' }}<PhPaperPlaneTilt :size="17" aria-hidden="true" /></button>
          </div>
        </form>
      </div>
    </section>
  </main>
</template>
<style src="@/assets/gift-qr-studio.css"></style>
