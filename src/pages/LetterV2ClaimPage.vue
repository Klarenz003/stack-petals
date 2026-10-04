<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'
import { getGiftCapabilities } from '@/utils/giftCapabilities'
import GiftQrHeader from '@/components/GiftQrHeader.vue'
import { PhKey, PhArrowRight, PhLockKey, PhFlowerTulip } from '@phosphor-icons/vue'

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
  localStorage.setItem('stack-petals:letter-v2-claim', JSON.stringify({ token, qrId: claimed.id, has360Viewer: claimed.has_360_view, hasPhotoUpload: claimed.has_photo_upload, productName: claimed.product_name }))
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
        <p class="gift-studio-eyebrow">A little surprise, just for you</p>
        <h1 id="gift-activation-title">{{ loading ? 'Opening your gift…' : 'A little code. A lot of heart.' }}</h1>
        <p class="gift-studio-intro">{{ loading ? 'We’re finding the letter that belongs to your gift.' : 'Unlock your gift and turn a few heartfelt words into something unforgettable.' }}</p>
        <div v-if="loading" class="gift-studio-loading" role="status">Checking your Gift QR…</div>
        <form v-else-if="code" @submit.prevent="claim">
          <div class="gift-studio-product"><PhFlowerTulip :size="20" aria-hidden="true" /><span>{{ code.product_name }}<small>Ready for your personal touch</small></span></div>
          <label class="gift-studio-field" for="gift-activation-code">Your activation code
            <input id="gift-activation-code" v-model="activationCode" class="gift-studio-code" placeholder="XXXX-XXXX" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" :disabled="claiming" :aria-invalid="!!error" :aria-describedby="error ? 'gift-activation-error' : 'gift-activation-hint'" required />
          </label>
          <p id="gift-activation-hint" class="gift-studio-hint">You’ll find this code printed with your Gift QR card.</p>
          <p v-if="error" id="gift-activation-error" class="gift-studio-error" role="alert">{{ error }}</p>
          <button class="gift-studio-primary" :disabled="claiming || !activationCode.trim()">{{ claiming ? 'Unlocking your gift…' : 'Make it personal' }}<PhArrowRight :size="16" aria-hidden="true" /></button>
          <p class="gift-studio-reassurance"><PhLockKey :size="14" aria-hidden="true" />{{ copy }}</p>
        </form>
        <p v-else class="gift-studio-error" role="alert">{{ error }}</p>
      </div>
    </section>
  </main>
</template>
<style src="@/assets/gift-qr-studio.css"></style>
