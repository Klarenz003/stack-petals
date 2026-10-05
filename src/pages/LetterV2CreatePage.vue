<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'
import { reportStorefrontError } from '@/services/errorTracker'
import { getGiftCapabilities } from '@/utils/giftCapabilities'
import GiftQrHeader from '@/components/GiftQrHeader.vue'
import MemoryPhotoUpload from '@/components/MemoryPhotoUpload.vue'
import { passwordError } from '@/utils/letterAccess'
import { DEFAULT_PETAL_MESSAGES, getPetalMessages } from '@/utils/letterDefaults'
import { PhCheck, PhPaperPlaneTilt, PhLockKey, PhArrowRight } from '@phosphor-icons/vue'
const themes = ['romance', 'family', 'birthday', 'sympathy', 'friendship', 'graduation']
const petalMessages = ref<string[]>([...DEFAULT_PETAL_MESSAGES])
const route = useRoute(); const router = useRouter(); const saving = ref(false); const error = ref(''); const from = ref(''); const to = ref(''); const theme = ref('romance'); const message = ref(''); const memories = ref<string[]>([]); const canUpload = ref(true); const claimValid = ref(false)
const password = ref(''); const confirmation = ref(''); const activationCode = ref('')
const showPassword = ref(false)
const publishedId = ref(''); const managementToken = ref(''); const changed = ref(false)
onMounted(() => {
  try {
    const claim = JSON.parse(sessionStorage.getItem('stack-petals:letter-v2-claim') || 'null')
    claimValid.value = Boolean(claim?.token === String(route.params.token || '') && claim?.qrId && claim?.activationCode)
    activationCode.value = claim?.activationCode || ''
    canUpload.value = getGiftCapabilities(claim).hasPhotoUpload
    const receipt = JSON.parse(sessionStorage.getItem(`stack-petals:letter-receipt:${route.params.token}`) || 'null')
    if (receipt?.id && receipt?.managementToken) { publishedId.value = receipt.id; managementToken.value = receipt.managementToken }
  } catch { claimValid.value = false }
  if (!claimValid.value && !publishedId.value) error.value = 'Please activate your Gift QR card again to begin.'
})

async function changePassword() {
  error.value = passwordError(password.value, confirmation.value)
  if (error.value || saving.value) return
  saving.value = true; changed.value = false
  try {
    const { data, error: changeError } = await supabase.rpc('change_gift_letter_password', {
      p_letter_id: publishedId.value, p_management_token: managementToken.value, p_password: password.value,
    })
    if (changeError || !data) throw changeError || new Error('Password change unavailable')
    password.value = ''; confirmation.value = ''; changed.value = true
  } catch { error.value = 'We couldn’t change the password. Please try again.' }
  finally { saving.value = false }
}

async function publish() {
  if (!claimValid.value || saving.value) return
  error.value = passwordError(password.value, confirmation.value)
  if (error.value) return
  saving.value = true
  error.value = ''
  try {
    const { data, error: publishError } = await supabase.rpc('create_letter_v2', {
      p_public_token: String(route.params.token || ''),
      p_from: from.value.trim(),
      p_to: to.value.trim(),
      p_theme: theme.value,
      p_message: message.value.trim(),
      p_password: password.value,
      p_activation_code: activationCode.value,
      p_memories: memories.value,
      p_petal_messages: getPetalMessages(petalMessages.value),
    })
    if (publishError) throw publishError
    const id = Array.isArray(data) ? data[0]?.id : data?.id
    if (!id) throw new Error('The letter could not be created.')
    publishedId.value = id; managementToken.value = data[0]?.management_token || data?.management_token || ''
    password.value = ''; confirmation.value = ''; activationCode.value = ''
    sessionStorage.removeItem('stack-petals:letter-v2-claim')
    localStorage.removeItem('stack-petals:letter-v2-claim')
    try { sessionStorage.setItem(`stack-petals:letter-receipt:${route.params.token}`, JSON.stringify({ id, managementToken: managementToken.value })) } catch { /* Receipt still works in this tab. */ }
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
      <GiftQrHeader :composing="!publishedId" :reading="!!publishedId" />
      <div v-if="publishedId" class="gift-studio-body">
        <span class="gift-studio-hero-icon"><PhLockKey :size="30" weight="duotone" aria-hidden="true" /></span>
        <p class="gift-studio-eyebrow">Sealed with care</p>
        <h1 id="gift-composer-title">Your words. Just for them.</h1>
        <p class="gift-studio-intro">Your letter is ready. Share its password privately with your recipient—not on the QR card. They can remember their browser for 30 days.</p>
        <button class="gift-studio-primary" @click="router.push(`/letter-v2/${publishedId}`)">See your letter<PhArrowRight :size="18" aria-hidden="true" /></button>
        <details class="gift-password-settings">
          <summary>Change the letter password</summary>
          <p class="gift-studio-hint">Changing it signs out every remembered browser. Keep this composer tab open if you want to change it later.</p>
          <form @submit.prevent="changePassword">
            <label class="gift-studio-field">New password<input v-model="password" type="password" autocomplete="new-password" minlength="10" required :disabled="saving" /></label>
            <label class="gift-studio-field">Confirm password<input v-model="confirmation" type="password" autocomplete="new-password" required :disabled="saving" /></label>
            <p v-if="changed" role="status" class="gift-studio-hint">Password updated. Share the new password privately with your recipient.</p>
            <p v-if="error" role="alert" class="gift-studio-error">{{ error }}</p>
            <button class="gift-studio-primary" :disabled="saving">{{ saving ? 'Updating…' : 'Update password' }}</button>
          </form>
        </details>
      </div>
      <div v-else class="gift-studio-body">
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
            <section class="gift-studio-form-card" aria-labelledby="gift-privacy-title">
              <p class="gift-studio-eyebrow"><PhLockKey :size="16" weight="duotone" aria-hidden="true" /> Just for your recipient</p>
              <h2 id="gift-privacy-title">Seal it with a password.</h2>
              <p id="gift-password-help" class="gift-studio-hint">Choose at least 10 characters—a few memorable words work well. Share it privately with your recipient, never on the QR card.</p>
              <div class="gift-studio-name-grid">
                <label class="gift-studio-field" for="gift-password">Letter password<input id="gift-password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" minlength="10" aria-describedby="gift-password-help" required /></label>
                <label class="gift-studio-field" for="gift-password-confirm">Confirm password<input id="gift-password-confirm" v-model="confirmation" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" minlength="10" required /></label>
              </div>
              <label class="gift-password-show"><input v-model="showPassword" type="checkbox" />Show passwords</label>
              <p class="gift-studio-hint">No account needed. Your recipient can remember their browser for 30 days after unlocking.</p>
            </section>
          </fieldset>
          <p v-if="error" class="gift-studio-error" role="alert">{{ error }}</p>
          <div class="gift-studio-publish">
            <p class="gift-studio-hint">Your Gift QR opens a private letter. Only someone with your password can unlock it.</p>
            <button class="gift-studio-primary" :disabled="saving || !claimValid || !to.trim() || !message.trim()">{{ saving ? 'Publishing your letter…' : 'Publish your letter' }}<PhPaperPlaneTilt :size="17" aria-hidden="true" /></button>
          </div>
        </form>
      </div>
    </section>
  </main>
</template>
<style src="@/assets/gift-qr-studio.css"></style>
