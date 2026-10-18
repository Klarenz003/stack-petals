<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'
import { reportStorefrontError } from '@/services/errorTracker'
import { getGiftCapabilities } from '@/utils/giftCapabilities'
import GiftQrHeader from '@/components/GiftQrHeader.vue'
import MemoryPhotoUpload from '@/components/MemoryPhotoUpload.vue'
import LetterLittleThingsEditor from '@/components/LetterLittleThingsEditor.vue'
import LetterPersonalSurprise from '@/components/LetterPersonalSurprise.vue'
import LetterPasswordShare from '@/components/LetterPasswordShare.vue'
import { getLetterSurprise } from '@/utils/letterSurprise'
import { LETTER_PASSWORD_MIN_LENGTH, passwordError } from '@/utils/letterAccess'
import { DEFAULT_PETAL_MESSAGES, DEFAULT_GIFT_NOTE_BODIES, getGiftNoteMessages } from '@/utils/letterDefaults'
import { useLetterDraft } from '@/composables/useLetterDraft'
import { PhCheck, PhPaperPlaneTilt, PhLockKey, PhArrowRight } from '@phosphor-icons/vue'
const step = ref(1)
const furthestStep = ref(1)
const stepHeading = ref<HTMLElement | null>(null)
const steps = [
  { title: 'Your letter', heading: 'Start with what matters.', description: 'Choose the feeling, then write the words only you can say.' },
  { title: 'The little things', heading: 'Make the little things yours.', description: 'Keep our suggested notes or personalize them. Photos are optional.' },
  { title: 'The finishing touch', heading: 'One last touch of care.', description: 'Add an optional surprise, then seal your letter with care.' },
]
const themes = ['romance', 'family', 'birthday', 'sympathy', 'friendship', 'graduation']
const petalMessages = ref<string[]>([...DEFAULT_GIFT_NOTE_BODIES])
const petalTitles = ref<string[]>([...DEFAULT_PETAL_MESSAGES])
const petalArtworks = ref([0, 1, 2, 3, 4, 5])
const route = useRoute(); const router = useRouter(); const saving = ref(false); const error = ref(''); const from = ref(''); const to = ref(''); const theme = ref('romance'); const message = ref(''); const memories = ref<string[]>([]); const canUpload = ref(true); const claimValid = ref(false)
const password = ref(''); const confirmation = ref(''); const activationCode = ref('')
const showPassword = ref(false)
const shareablePassword = ref('')
onBeforeUnmount(() => { shareablePassword.value = ''; password.value = ''; confirmation.value = '' })
const surpriseEnabled = ref(false)
const surpriseTitle = ref('One more thing: you are loved.')
const surpriseMessage = ref('')
const surprisePhotos = ref<string[]>([])
const surprise = computed(() => surpriseEnabled.value ? getLetterSurprise({ title: surpriseTitle.value, message: surpriseMessage.value, photo: surprisePhotos.value[0] }) : null)
const publishedId = ref(''); const managementToken = ref(''); const changed = ref(false)
// A different card must activate independently, never inherit this component's draft.
onBeforeRouteUpdate(next => {
  if (next.params.token !== route.params.token) return `/letter-v2/claim/${encodeURIComponent(String(next.params.token || ''))}`
})
const discardRequested = ref(false)
const { loading: draftLoading, busy: draftBusy, status: draftStatus, savedAt: draftSavedAt,
  storageError: draftError, initialize: initializeDraft, skip: skipDraft,
  remove: removeDraft, discard: discardDraft, retry: retryDraft } = useLetterDraft(String(route.params.token || ''), {
  enabled: () => claimValid.value && !publishedId.value,
  snapshot: () => ({
    from: from.value, to: to.value, theme: theme.value, message: message.value, memories: memories.value,
    petalMessages: petalMessages.value, petalTitles: petalTitles.value, petalArtworks: petalArtworks.value,
    surpriseEnabled: surpriseEnabled.value, surpriseTitle: surpriseTitle.value, surpriseMessage: surpriseMessage.value,
    surprisePhotos: surprisePhotos.value, step: step.value, furthestStep: furthestStep.value,
  }),
  restore: draft => {
    from.value = draft.from; to.value = draft.to; theme.value = draft.theme; message.value = draft.message
    memories.value = canUpload.value ? draft.memories : []
    petalMessages.value = draft.petalMessages; petalTitles.value = draft.petalTitles; petalArtworks.value = draft.petalArtworks
    surpriseEnabled.value = draft.surpriseEnabled; surpriseTitle.value = draft.surpriseTitle
    surpriseMessage.value = draft.surpriseMessage; surprisePhotos.value = draft.surprisePhotos
    step.value = draft.to.trim() && draft.message.trim() ? draft.step : 1
    furthestStep.value = draft.to.trim() && draft.message.trim() ? draft.furthestStep : 1
  },
})
const draftStatusText = computed(() => draftLoading.value ? 'Checking for your saved draft…'
  : draftStatus.value === 'saving' ? 'Saving your draft…'
  : draftStatus.value === 'restored' ? 'Your saved draft is restored. Pick up where you left off.'
  : draftStatus.value === 'saved' ? 'Draft saved on this device.'
  : draftStatus.value === 'cleared' ? 'Saved draft deleted. You can start fresh.'
  : draftStatus.value === 'error' ? 'Draft needs your attention.' : 'Your draft autosaves on this device as you write.')
async function startOver() {
  await discardDraft(() => {
    from.value = ''; to.value = ''; theme.value = 'romance'; message.value = ''; memories.value = []
    petalMessages.value = [...DEFAULT_GIFT_NOTE_BODIES]; petalTitles.value = [...DEFAULT_PETAL_MESSAGES]
    petalArtworks.value = [0, 1, 2, 3, 4, 5]; surpriseEnabled.value = false
    surpriseTitle.value = 'One more thing: you are loved.'; surpriseMessage.value = ''; surprisePhotos.value = []
    step.value = 1; furthestStep.value = 1; password.value = ''; confirmation.value = ''; error.value = ''
  })
  discardRequested.value = false
}
async function goStep(target: number) {
  if (saving.value || draftLoading.value || draftBusy.value || !claimValid.value) return
  if (target > step.value && (!to.value.trim() || !message.value.trim())) {
    error.value = 'Add the recipient’s name and your message before continuing.'
    return
  }
  step.value = target; furthestStep.value = Math.max(furthestStep.value, target); error.value = ''
  await nextTick(); stepHeading.value?.focus({ preventScroll: true }); stepHeading.value?.scrollIntoView({ behavior: 'auto', block: 'start' })
}
async function submitStep() {
  if (step.value < 3) await goStep(step.value + 1)
  else await publish()
}
onMounted(async () => {
  let qrId = ''
  try {
    const claim = JSON.parse(sessionStorage.getItem('stack-petals:letter-v2-claim') || 'null')
    claimValid.value = Boolean(claim?.token === String(route.params.token || '') && claim?.qrId && claim?.activationCode)
    activationCode.value = claim?.activationCode || ''
    canUpload.value = getGiftCapabilities(claim).hasPhotoUpload
    qrId = typeof claim?.qrId === 'string' ? claim.qrId : ''
    const receipt = JSON.parse(sessionStorage.getItem(`stack-petals:letter-receipt:${route.params.token}`) || 'null')
    if (receipt?.id && receipt?.managementToken) { publishedId.value = receipt.id; managementToken.value = receipt.managementToken }
  } catch { claimValid.value = false }
  if (publishedId.value) { await removeDraft(); return }
  if (claimValid.value && qrId) await initializeDraft(qrId)
  else {
    skipDraft()
    error.value = 'Please activate your Gift QR card again to begin. Any saved draft will be restored after activation.'
  }
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
    shareablePassword.value = password.value
    password.value = ''; confirmation.value = ''; changed.value = true
  } catch { error.value = 'We couldn’t change the password. Please try again.' }
  finally { saving.value = false }
}

async function publish() {
  if (!claimValid.value || saving.value || draftLoading.value || draftBusy.value) return
  if (!to.value.trim() || !message.value.trim()) { await goStep(1); error.value = 'Add the recipient’s name and your message.'; return }
  if (surpriseEnabled.value && !surprise.value) { error.value = 'Add a final message, or turn off the optional surprise.'; return }
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
      p_petal_messages: getGiftNoteMessages(petalMessages.value),
      p_surprise: surprise.value,
      p_petal_labels: petalTitles.value.map((title, index) => title.trim() || DEFAULT_PETAL_MESSAGES[index]),
      p_petal_artworks: petalArtworks.value,
    })
    if (publishError) throw publishError
    const id = Array.isArray(data) ? data[0]?.id : data?.id
    if (!id) throw new Error('The letter could not be created.')
    publishedId.value = id; managementToken.value = data[0]?.management_token || data?.management_token || ''
    shareablePassword.value = password.value
    password.value = ''; confirmation.value = ''; activationCode.value = ''
    await removeDraft()
    try { sessionStorage.removeItem('stack-petals:letter-v2-claim'); localStorage.removeItem('stack-petals:letter-v2-claim') } catch { /* Storage may be denied; the server still closes this claimed QR. */ }
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
        <div v-if="draftError" class="composer-draft composer-draft--warning"><p role="alert">{{ draftError }}</p><button type="button" :disabled="draftBusy" @click="removeDraft()">Retry removing saved draft</button></div>
        <button class="gift-studio-primary" @click="router.push(`/letter-v2/${publishedId}`)">See your letter<PhArrowRight :size="18" aria-hidden="true" /></button>
        <LetterPasswordShare v-if="shareablePassword" :password="shareablePassword" @clear="shareablePassword = ''" />
        <p v-else class="gift-studio-hint">For privacy, the password is not kept after you leave or refresh this page. If you didn’t save it, use Change the letter password below.</p>
        <details class="gift-password-settings">
          <summary>Change the letter password</summary>
          <p class="gift-studio-hint">Changing it signs out every remembered browser. Keep this composer tab open if you want to change it later.</p>
          <form @submit.prevent="changePassword">
            <label class="gift-studio-field">New password<input v-model="password" type="password" autocomplete="new-password" :minlength="LETTER_PASSWORD_MIN_LENGTH" required :disabled="saving" /></label>
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
        <section v-if="claimValid" class="composer-draft" :class="{ 'composer-draft--warning': draftError }" aria-label="Saved letter draft">
          <p class="composer-draft-status" role="status">{{ draftStatusText }}</p>
          <p v-if="draftError" role="alert">{{ draftError }}</p>
          <p v-else class="composer-draft-privacy">Your words and cropped photos stay in this browser. Drafts expire after 7 days. Passwords are never saved. Clearing site data or using private browsing may erase drafts. Anyone using this browser may access the draft; avoid shared devices.</p>
          <p v-if="draftSavedAt" class="composer-draft-time">Last saved {{ new Date(draftSavedAt).toLocaleString() }}. Return using the same QR and browser; re-enter the activation code if asked.</p>
          <div v-if="!draftLoading" class="composer-draft-actions">
            <button v-if="draftError" type="button" :disabled="saving || draftBusy" @click="retryDraft()">Retry saving</button>
            <button v-if="!discardRequested" type="button" :disabled="saving || draftBusy" @click="discardRequested = true">Delete draft &amp; start over</button>
            <template v-else><p>This deletes the saved draft and clears this form. It cannot be undone.</p><button type="button" :disabled="saving || draftBusy" @click="startOver()">{{ draftBusy ? 'Deleting…' : 'Yes, delete & start over' }}</button><button type="button" :disabled="draftBusy" @click="discardRequested = false">Keep writing</button></template>
          </div>
        </section>
        <p v-else class="gift-studio-hint">Returning to a draft? <RouterLink :to="`/letter-v2/claim/${route.params.token}`">Activate this card again</RouterLink> in the same browser to resume. Your letter password is not saved.</p>
        <nav class="composer-steps" aria-label="Letter creation steps"><ol><li v-for="(item, index) in steps" :key="item.title"><button type="button" :aria-current="step === index + 1 ? 'step' : undefined" :disabled="saving || draftLoading || draftBusy || !claimValid || index + 1 > furthestStep" @click="goStep(index + 1)"><span class="composer-step-number"><PhCheck v-if="step > index + 1" :size="15" aria-hidden="true" /><template v-else>{{ index + 1 }}</template></span><span>{{ item.title }}</span></button></li></ol></nav>
        <div class="composer-step-intro"><p class="gift-studio-eyebrow">STEP {{ step }} OF 3</p><h2 ref="stepHeading" tabindex="-1">{{ steps[step - 1].heading }}</h2><p class="gift-studio-hint">{{ steps[step - 1].description }}</p></div>
        <form @submit.prevent="submitStep" :aria-busy="saving">
          <fieldset class="gift-studio-fields" :disabled="saving || draftLoading || draftBusy || !claimValid">
            <legend class="gift-studio-sr-only">Personalize your gift letter</legend>
            <div v-if="step === 1">
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
            </div>
            <div v-if="step === 2">
            <section class="gift-studio-form-card" aria-labelledby="gift-little-things-title">
              <p class="gift-studio-eyebrow">Chapter 02 · Included in every letter</p>
              <h2 id="gift-little-things-title">It’s the little things.</h2>
              <p class="gift-studio-hint">Six tiny reminders for someone special. Keep these defaults or make each one your own.</p>
              <LetterLittleThingsEditor v-model:titles="petalTitles" v-model:messages="petalMessages" v-model:artworks="petalArtworks" />
              <p class="gift-studio-hint">Leave a note empty and we’ll use its default, so all six reminders are always included.</p>
            </section>
            <section v-if="canUpload" class="gift-studio-form-card" aria-labelledby="gift-memories-title">
              <p class="gift-studio-eyebrow">Optional · Skip if you like</p>
              <h2 id="gift-memories-title">Little moments. Lasting memories.</h2>
              <p class="gift-studio-hint">Add up to three photos to make their letter even more personal.</p>
              <MemoryPhotoUpload v-model="memories" :disabled="saving || !claimValid" />
            </section>
            </div>
            <div v-if="step === 3">
            <section class="gift-studio-form-card gift-surprise-editor" aria-labelledby="gift-surprise-title">
              <p class="gift-studio-eyebrow">The finishing touch · Optional</p>
              <h2 id="gift-surprise-title">One last surprise.</h2>
              <p class="gift-studio-hint">Leave a final note they can unfold after reading. A favorite photo makes it even more yours.</p>
              <label class="gift-surprise-toggle"><input v-model="surpriseEnabled" type="checkbox" aria-controls="gift-surprise-fields" :aria-expanded="surpriseEnabled" /><span>Add a personal surprise<small>Skip it and no surprise card will appear.</small></span></label>
              <div v-if="surpriseEnabled" id="gift-surprise-fields" class="gift-surprise-fields">
                <label class="gift-studio-field" for="gift-surprise-heading">A little title<input id="gift-surprise-heading" v-model="surpriseTitle" maxlength="80" placeholder="My favorite moment with you" /></label>
                <label class="gift-studio-field" for="gift-surprise-message">Your final note<textarea id="gift-surprise-message" v-model="surpriseMessage" rows="4" maxlength="600" required placeholder="Whenever you miss me, come back here. You are so loved."></textarea></label>
                <p class="gift-studio-character-count">{{ surpriseMessage.length }} / 600 characters</p>
                <p class="gift-studio-hint">One special photo · Optional. Included with every Gift QR. Crop it just how you want it.</p><MemoryPhotoUpload v-model="surprisePhotos" :max-photos="1" :disabled="saving || !claimValid" />
                <p class="gift-studio-hint"><PhLockKey :size="14" aria-hidden="true" /> Protected by the same letter password. No extra step for your recipient.</p>
                <div class="gift-surprise-live-preview"><p class="gift-studio-eyebrow">Your surprise card · Live preview</p><LetterPersonalSurprise v-if="surprise" :surprise="surprise" preview /><p v-else class="gift-studio-hint gift-surprise-preview-empty">Write your final note above to see your card here. Your photo and title will appear with it.</p></div>
              </div>
            </section>
            <section class="gift-studio-form-card" aria-labelledby="gift-privacy-title">
              <p class="gift-studio-eyebrow"><PhLockKey :size="16" weight="duotone" aria-hidden="true" /> Just for your recipient</p>
              <h2 id="gift-privacy-title">Seal it with a password.</h2>
              <p id="gift-password-help" class="gift-studio-hint">Choose at least {{ LETTER_PASSWORD_MIN_LENGTH }} characters. A longer password is safer. Share it privately with your recipient, never on the QR card.</p>
              <div class="gift-studio-name-grid">
                <label class="gift-studio-field" for="gift-password">Letter password<input id="gift-password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" :minlength="LETTER_PASSWORD_MIN_LENGTH" aria-describedby="gift-password-help" required /></label>
                <label class="gift-studio-field" for="gift-password-confirm">Confirm password<input id="gift-password-confirm" v-model="confirmation" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" :minlength="LETTER_PASSWORD_MIN_LENGTH" required /></label>
              </div>
              <label class="gift-password-show"><input v-model="showPassword" type="checkbox" />Show passwords</label>
              <p class="gift-studio-hint">No account needed. Your recipient can remember their browser for 30 days after unlocking.</p>
            </section>
            </div>
          </fieldset>
          <p v-if="error" class="gift-studio-error" role="alert">{{ error }}</p>
          <div class="gift-studio-publish">
            <p class="gift-studio-hint">{{ step < 3 ? 'Your words stay here as you move between steps.' : 'Your Gift QR opens a private letter. Only someone with your password can unlock it.' }}</p>
            <div class="composer-step-actions"><button v-if="step > 1" type="button" class="composer-back" :disabled="saving || draftLoading || draftBusy" @click="goStep(step - 1)">← Back</button><button class="gift-studio-primary" :disabled="saving || draftLoading || draftBusy || !claimValid">{{ step === 1 ? 'Continue to little things' : step === 2 ? 'Continue to finishing touch' : saving ? 'Publishing your letter…' : 'Publish your letter' }}<PhArrowRight v-if="step < 3" :size="17" aria-hidden="true" /><PhPaperPlaneTilt v-else :size="17" aria-hidden="true" /></button></div>
          </div>
        </form>
      </div>
    </section>
  </main>
</template>
<style src="@/assets/gift-qr-studio.css"></style>
<style scoped>
.composer-draft { margin-top:20px; padding:16px; border:1px solid #d6e2d3; border-radius:14px; background:#f0f5ed; color:#526452; font:12px/1.7 'DM Sans',sans-serif; overflow-wrap:anywhere; }
.composer-draft p { margin:0 0 8px; }
.composer-draft .composer-draft-status { font-weight:600; color:#3e5946; }
.composer-draft-privacy,.composer-draft-time { font-size:11px; }
.composer-draft--warning { border-color:#ddbd9a; background:#fff5e8; color:#754e2d; }
.composer-draft-actions { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
.composer-draft-actions p { flex-basis:100%; }
.composer-draft button { min-height:40px; padding:8px 12px; border:1px solid #b9cbb5; border-radius:9px; background:#fffdf9; color:#3e5946; font:600 11px/1.5 'DM Sans',sans-serif; cursor:pointer; }
.composer-draft button:disabled { opacity:.6; cursor:default; }
.composer-draft button:focus-visible { outline:2px solid #587d65; outline-offset:3px; }
.composer-steps { margin:28px 0; padding:8px; border:1px solid #e6d8cd; border-radius:16px; background:#fffaf6; }
.composer-steps ol { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; list-style:none; padding:0; margin:0; }
.composer-steps button { display:flex; width:100%; align-items:center; gap:9px; min-height:54px; padding:10px; border:0; border-radius:10px; background:none; color:#6e645d; font:600 11px/1.5 'DM Sans',sans-serif; cursor:pointer; text-align:left; }
.composer-steps button[aria-current=step] { background:#e9f0e7; color:#3e604b; }
.composer-steps button:disabled { cursor:default; opacity:.6; }
.composer-step-number { display:grid; place-items:center; flex:none; width:26px; height:26px; border:1px solid #d9c6b7; border-radius:50%; font-size:10px; background:#fffdf9; }
.composer-steps button[aria-current=step] .composer-step-number { background:#587d65; border-color:#587d65; color:#fff; }
.composer-step-intro { margin-bottom:26px; }
.composer-step-intro h2 { margin:8px 0; color:#58443f; font:400 clamp(26px,4vw,34px)/1.2 'Cormorant Garamond',Georgia,serif; scroll-margin-top:24px; }
.composer-step-actions { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-top:16px; }
.composer-step-actions .gift-studio-primary { margin-left:auto; }
.composer-back { display:inline-flex; align-items:center; justify-content:center; gap:12px; min-height:46px; border:1px solid #d5c5b6; border-radius:12px; padding:12px 16px; background:#fffaf5; color:#624b40; font:600 12px/1.5 'DM Sans',sans-serif; cursor:pointer; }
.composer-steps button:focus-visible,.composer-back:focus-visible { outline:2px solid #587d65; outline-offset:3px; }
@media(max-width:600px) { .composer-steps { padding:6px; }.composer-steps button { flex-direction:column; text-align:center; gap:6px; font-size:10px; padding:10px 4px; }.composer-step-actions { flex-wrap:wrap; }.composer-step-actions .gift-studio-primary { flex:1; } }
</style>
