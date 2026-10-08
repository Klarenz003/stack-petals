<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'
import { getGiftCapabilities } from '@/utils/giftCapabilities'
import GiftQrHeader from '@/components/GiftQrHeader.vue'
import { PhKey, PhArrowRight, PhLockKey } from '@phosphor-icons/vue'

const route = useRoute(); const router = useRouter()
const loading = ref(true); const claiming = ref(false); const error = ref(''); const activationCode = ref('')
const code = ref<{ id:string; product_name:string; has_360_view:boolean; has_photo_upload:boolean; status:string; letter_id:string|null } | null>(null)
const copy = computed(() => getGiftCapabilities(code.value).hasPhotoUpload ? 'Your words, your memories, a letter they’ll keep.' : 'Your words, a letter they’ll keep.')

async function claim() {
  if (!code.value || claiming.value) return
  claiming.value = true; error.value = ''
  const token = String(route.params.token || '').trim()
  const { data, error: claimError } = await supabase.rpc('claim_letter_v2_qr', { p_public_token: token, p_activation_code: activationCode.value.trim().toUpperCase() || null })
  const claimed = Array.isArray(data) ? data[0] : data
  if (claimError || !claimed) { error.value = 'Please check the activation code printed with your Gift QR card and try again.'; claiming.value = false; return }
  if (claimed.status === 'published' && claimed.letter_id) {
    await router.replace(`/letter-v2/${claimed.letter_id}`)
    return
  }
  sessionStorage.setItem('stack-petals:letter-v2-claim', JSON.stringify({ token, activationCode: activationCode.value.trim().toUpperCase(), qrId: claimed.id, has360Viewer: claimed.has_360_view, hasPhotoUpload: claimed.has_photo_upload, productName: claimed.product_name }))
  await router.replace(`/letter-v2/create/${token}`)
}

onMounted(async () => {
  const token = String(route.params.token || '').trim()
  if (!token) { error.value = 'This gift link is incomplete.'; loading.value = false; return }
  const { data, error: resolveError } = await supabase.rpc('resolve_letter_v2_qr', { p_public_token: token })
  const resolved = Array.isArray(data) ? data[0] : data
  if (resolveError || !resolved) error.value = 'This gift QR code is unavailable.'
  else if (resolved.status === 'published' && resolved.letter_id) { await router.replace(`/letter-v2/${resolved.letter_id}`); return }
  else code.value = resolved
  loading.value = false
})
</script>

<template>
  <main class="gift-studio">
    <section class="gift-studio-shell gift-studio-shell--activation" aria-labelledby="gift-activation-title" :aria-busy="loading || claiming">
      <GiftQrHeader />
      <div class="gift-studio-body">
        <span class="gift-studio-hero-icon" aria-hidden="true"><PhKey :size="30" weight="light" /></span>
        <p class="gift-studio-eyebrow">{{ code?.letter_id ? 'Your replacement card · Same treasured letter' : 'For the sender · Before you gift it' }}</p>
        <h1 id="gift-activation-title">{{ loading ? 'Opening your gift…' : code?.letter_id ? 'Your keepsake. A fresh key.' : 'A little code. A lot of heart.' }}</h1>
        <p class="gift-studio-intro">{{ loading ? 'We’re finding the letter that belongs to your gift.' : code?.letter_id ? 'Your letter is already here. Activate this replacement card to open it again—your letter password stays the same.' : 'Activate your card, write your letter, and leave them something to treasure.' }}</p>
        <div v-if="loading" class="gift-studio-loading" role="status">Checking your Gift QR…</div>
        <form v-else-if="code" @submit.prevent="claim">
          <section class="gift-activation-guide" aria-labelledby="gift-code-guide-title">
            <span class="gift-activation-guide-icon" aria-hidden="true"><PhKey :size="23" weight="light" /></span>
            <div><h2 id="gift-code-guide-title">Find the code on the back.</h2><p>Turn your card over and gently scratch off the sticker covering the activation code. Enter the revealed code below, including the hyphen.</p><p class="gift-activation-guide-note">No sticker on your card? Use the activation code printed on the back. Keep it private while setting up your letter.</p></div>
          </section>
          <label class="gift-studio-field" for="gift-activation-code">Your activation code
            <input id="gift-activation-code" v-model="activationCode" class="gift-studio-code" placeholder="XXXX-XXXX" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" :disabled="claiming" :aria-invalid="!!error" :aria-describedby="error ? 'gift-activation-hint gift-activation-error' : 'gift-activation-hint'" required />
          </label>
          <p id="gift-activation-hint" class="gift-studio-hint">{{ code.letter_id ? 'This replacement card already holds your letter. Use its NEW activation code to restore access, then unlock with the same letter password.' : 'Use the code from this card—not your letter password. Activation opens the editor; it does not publish your letter.' }}</p>
          <p v-if="error" id="gift-activation-error" class="gift-studio-error" role="alert">{{ error }}</p>
          <button class="gift-studio-primary" :disabled="claiming || !activationCode.trim()">{{ claiming ? 'Activating your card…' : code.letter_id ? 'Activate & open your letter' : 'Activate & write your letter' }}<PhArrowRight :size="16" aria-hidden="true" /></button>
          <p class="gift-studio-reassurance"><PhLockKey :size="14" aria-hidden="true" />{{ copy }}</p>
          <section v-if="!code.letter_id" class="gift-activation-next" aria-labelledby="gift-activation-next-title">
            <p class="gift-studio-eyebrow">What happens next</p>
            <h2 id="gift-activation-next-title">From your words to their keepsake.</h2>
            <ol>
              <li><strong>Write your letter.</strong><p>After activation, you’ll go straight to the editor. Choose a theme, add your names, and write your message.</p></li>
              <li><strong>Make the little things yours.</strong><p>Keep the six suggested notes or change their titles, words, and icons. Add an optional final surprise with a personal note and one special photo, included with every Gift QR. <template v-if="code.has_photo_upload">You can also add up to three memory photos.</template></p></li>
              <li><strong>Seal it, then publish.</strong><p>Create a letter password of at least 10 characters and confirm it. Publish when you’re ready, then copy, share privately, or save the password to your phone.</p></li>
              <li><strong>Give them the card—and the password.</strong><p>Once published, the same QR opens your finished letter. Your recipient enters the password you chose, not the activation code. No account needed; they can choose to remember their browser for 30 days.</p></li>
            </ol>
            <p class="gift-activation-next-note"><PhLockKey :size="16" aria-hidden="true" /><span>Send the letter password separately and privately. Don’t write it on the QR card. Keep the editor tab open until you publish—refreshing or leaving can lose your unfinished draft.</span></p>
          </section>
        </form>
        <p v-else class="gift-studio-error" role="alert">{{ error }}</p>
      </div>
    </section>
  </main>
</template>
<style src="@/assets/gift-qr-studio.css"></style>
<style scoped>
.gift-activation-guide { display:flex; gap:13px; padding:18px; border:1px solid #d6e2d3; border-radius:16px; background:#f0f5ed; }
.gift-activation-guide-icon { display:grid; place-items:center; flex:none; width:36px; height:36px; border:1px solid #d6e2d3; border-radius:11px; color:#4e6f56; background:#fffdf8; }
.gift-activation-guide h2 { margin:0 0 8px; font:400 21px/1.3 Georgia,serif; color:#3e5946; }
.gift-activation-guide p { margin:0; color:#526452; font-size:13px; line-height:1.75; }
.gift-activation-guide .gift-activation-guide-note { margin-top:10px; color:#62705e; font-size:11px; }
.gift-activation-next { margin-top:28px; padding-top:26px; border-top:1px solid #eadbd6; }
.gift-activation-next h2 { margin:0; font:400 24px/1.3 Georgia,serif; color:#4f4540; }
.gift-activation-next ol { counter-reset:activation-step; list-style:none; display:grid; gap:20px; margin:24px 0; padding:0; }
.gift-activation-next li { counter-increment:activation-step; position:relative; padding-left:43px; }
.gift-activation-next li::before { content:counter(activation-step,decimal-leading-zero); position:absolute; left:0; top:0; display:grid; place-items:center; width:30px; height:30px; border-radius:10px; background:#f7ebe8; color:#946568; font:600 11px/1 'DM Sans',sans-serif; }
.gift-activation-next strong { display:block; color:#584942; font-size:13px; font-weight:600; line-height:1.6; }
.gift-activation-next li p { margin:6px 0 0; color:#74665f; font-size:12px; line-height:1.8; }
.gift-activation-next-note { display:flex; align-items:flex-start; gap:9px; padding:14px; margin:0; background:#faf3ee; border-radius:12px; color:#74665f; font-size:11px; line-height:1.8; }
.gift-activation-next-note svg { flex:none; margin-top:3px; color:#7c665d; }
@media(max-width:400px) { .gift-activation-guide { padding:14px; gap:10px; }.gift-activation-guide h2 { font-size:19px; }.gift-activation-guide-icon { width:30px; height:30px; }.gift-activation-next h2 { font-size:22px; } }
</style>
