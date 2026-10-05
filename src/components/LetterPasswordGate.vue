<script setup lang="ts">
import { ref } from 'vue'
import { PhLockKey, PhEnvelopeSimple, PhArrowRight, PhEye, PhEyeSlash } from '@phosphor-icons/vue'
import { unlockLetter } from '@/services/letterAccess'
import type { LetterRecord } from '@/types/letter'
import GiftQrHeader from '@/components/GiftQrHeader.vue'

const props = defineProps<{ letterId: string }>()
const emit = defineEmits<{ unlocked: [letter: LetterRecord] }>()
const password = ref('')
const remember = ref(false)
const visible = ref(false)
const busy = ref(false)
const error = ref('')
const unlockedLetter = ref<LetterRecord | null>(null)

async function unlock() {
  if (busy.value || !password.value) return
  busy.value = true; error.value = ''
  try {
    const result = await unlockLetter(props.letterId, password.value, remember.value)
    if (result.status === 'unlocked' && result.letter) {
      password.value = ''
      if (remember.value && result.storageUnavailable) {
        error.value = 'Your browser won’t save access here. Your letter is unlocked for this visit; you’ll need its password next time.'
        unlockedLetter.value = result.letter
      } else emit('unlocked', result.letter)
    } else if (result.status === 'limited') error.value = `Too many attempts. Please try again in ${Math.max(1, Math.ceil((result.retry_after ?? 900) / 60))} minutes.`
    else if (result.status === 'unavailable') error.value = 'This letter is no longer available. Please contact the person who gave you this gift.'
    else error.value = 'That password didn’t match. Check with the person who sent your letter.'
  } catch { error.value = 'We couldn’t open your letter just now. Please try again.' }
  finally { busy.value = false }
}
</script>

<template>
  <main class="gift-studio letter-unlock">
    <section class="gift-studio-shell gift-studio-shell--activation" aria-labelledby="letter-unlock-title">
      <GiftQrHeader reading />
      <div class="gift-studio-body">
        <span class="gift-studio-hero-icon" aria-hidden="true"><PhEnvelopeSimple :size="32" weight="duotone" /></span>
        <p class="gift-studio-eyebrow">A little privacy. A lot of heart.</p>
        <h1 id="letter-unlock-title">Just between you two.</h1>
        <p class="gift-studio-intro">Someone made this letter just for you. Enter the password they shared to open it.</p>
        <form @submit.prevent="unlock" :aria-busy="busy">
          <label class="gift-studio-field" for="recipient-password">Your letter password</label>
          <div class="letter-password-input">
            <input id="recipient-password" v-model="password" :type="visible ? 'text' : 'password'" autocomplete="current-password" :disabled="busy" required :aria-invalid="!!error" :aria-describedby="error ? 'unlock-help unlock-error' : 'unlock-help'" />
            <button type="button" :aria-label="visible ? 'Hide password' : 'Show password'" :aria-pressed="visible" @click="visible = !visible"><component :is="visible ? PhEyeSlash : PhEye" :size="20" /></button>
          </div>
          <label class="letter-remember"><input v-model="remember" type="checkbox" :disabled="busy" /><span>Remember this browser for 30 days<small>Use this only on your own device.</small></span></label>
          <p id="unlock-error" class="gift-studio-error" role="alert" v-if="error">{{ error }}</p>
          <button v-if="unlockedLetter" type="button" class="gift-studio-primary" @click="emit('unlocked', unlockedLetter)">Continue to my letter<PhArrowRight :size="18" aria-hidden="true" /></button>
          <button v-else class="gift-studio-primary" :disabled="busy || !password">{{ busy ? 'Opening your letter…' : 'Open my letter' }}<PhArrowRight :size="18" aria-hidden="true" /></button>
          <p id="unlock-help" class="gift-studio-reassurance"><PhLockKey :size="16" aria-hidden="true" />No account needed. Ask your sender if you don’t have the password.</p>
        </form>
      </div>
    </section>
  </main>
</template>
<style src="@/assets/gift-qr-studio.css"></style>
<style scoped>
.letter-unlock { min-height: 100dvh; }
.letter-password-input { display: flex; align-items: center; border: 1px solid #d8bdb5; border-radius: 14px; background: #fffdfa; overflow: hidden; }
.letter-password-input:focus-within { outline: 3px solid #c4d6c8; outline-offset: 3px; }
.letter-password-input input { min-width: 0; flex: 1; padding: 16px; border: 0; background: transparent; color: #403a35; font-size: 16px; outline: none; }
.letter-password-input button { display: grid; place-items: center; width: 48px; height: 48px; flex: 0 0 auto; border: 0; background: transparent; color: #537562; cursor: pointer; }
.letter-remember { display: flex; align-items: flex-start; gap: 12px; padding: 22px 0; color: #443d37; font: 14px/1.5 'DM Sans',sans-serif; text-align: left; }
.letter-remember input { width: 18px; height: 18px; margin-top: 2px; accent-color: #557c67; }
.letter-remember small { display: block; color: #786b64; margin-top: 3px; }
</style>
