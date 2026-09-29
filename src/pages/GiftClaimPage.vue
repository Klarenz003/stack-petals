<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const claiming = ref(false)
const error = ref('')
const activationCode = ref('')
const gift = ref<{
  id: string
  product_name: string
  has_360_view: boolean
  has_photo_upload: boolean
  status: string
  letter_id: string | null
} | null>(null)

onMounted(async () => {
  const token = String(route.params.token || '').trim()
  if (!supabase || !token) {
    error.value = 'This gift link is incomplete.'
    loading.value = false
    return
  }

  const { data, error: resolveError } = await supabase.rpc('resolve_gift_qr', {
    p_public_token: token,
  })
  const resolved = Array.isArray(data) ? data[0] : data
  gift.value = resolved || null
  if (resolveError || !gift.value) {
    error.value = 'This gift code is unavailable or has been revoked.'
  }
  loading.value = false
})

function continueToLetterBuilder() {
  if (!gift.value) return
  if (gift.value.status === 'published' && gift.value.letter_id) {
    router.push(`/letter/${gift.value.letter_id}`)
    return
  }
  claiming.value = true
  void (async () => {
    const token = String(route.params.token || '').trim()
    const { data, error: claimError } = await supabase?.rpc('claim_gift_qr', {
      p_public_token: token,
      p_activation_code: activationCode.value.trim().toUpperCase() || null,
    }) || { data: null, error: new Error('Supabase is not configured.') }
    const claimed = Array.isArray(data) ? data[0] : data
    if (claimError || !claimed) {
      error.value = 'The activation code is incorrect or this gift has already been revoked.'
      claiming.value = false
      return
    }
    localStorage.setItem('stack-petals:gift-claim', JSON.stringify({
      token,
      activationCode: activationCode.value.trim().toUpperCase(),
      productName: claimed.product_name,
      has360Viewer: claimed.has_360_view,
      hasPhotoUpload: claimed.has_photo_upload,
      qrId: claimed.id,
    }))
  router.push(`/gift/create/${token}`)
  })()
}
</script>

<template>
  <main class="gift-claim-page">
    <section class="gift-claim-card">
      <p class="gift-claim-eyebrow">A Stack Petals keepsake</p>
      <h1 v-if="loading">Preparing your gift…</h1>
      <template v-else-if="gift">
        <h1>Make this gift yours.</h1>
        <p class="gift-claim-copy">{{ gift.product_name }} is ready for a personal letter.</p>
        <label class="gift-claim-label">
          Activation code <span>(optional)</span>
          <input v-model="activationCode" autocomplete="one-time-code" placeholder="Enter code if provided" />
        </label>
        <button class="gift-claim-button" type="button" :disabled="claiming" @click="continueToLetterBuilder">
          {{ claiming ? 'Opening…' : 'Create the letter' }}
        </button>
        <small>Your message, petal notes, and memories can be added next.</small>
      </template>
      <p v-else class="gift-claim-error">{{ error }}</p>
    </section>
  </main>
</template>

<style scoped>
.gift-claim-page { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #f8eeee; color: #49343b; }
.gift-claim-card { width: min(100%, 460px); padding: clamp(28px, 6vw, 56px); border: 1px solid #dfbfc1; border-radius: 24px; background: rgba(255,252,249,.94); box-shadow: 0 22px 70px rgba(94,55,65,.14); text-align: center; }
.gift-claim-eyebrow { margin: 0 0 12px; color: #a05d72; font: 600 11px/1.4 'DM Sans', sans-serif; letter-spacing: .24em; text-transform: uppercase; }
h1 { margin: 0; font: 400 clamp(34px, 7vw, 54px)/1.05 'Cormorant Garamond', serif; }
.gift-claim-copy { margin: 16px 0 24px; color: #7e6a70; font: 16px/1.5 'DM Sans', sans-serif; }
.gift-claim-label { display: grid; gap: 8px; text-align: left; color: #74515d; font: 600 12px/1.4 'DM Sans', sans-serif; }
.gift-claim-label span { color: #a28c91; font-weight: 400; }
input { box-sizing: border-box; width: 100%; border: 1px solid #dcb8bd; border-radius: 10px; padding: 13px 14px; background: #fff; color: inherit; font: 15px 'DM Sans', sans-serif; }
.gift-claim-button { width: 100%; margin-top: 20px; border: 0; border-radius: 999px; padding: 14px 20px; background: #5e8d79; color: #fff; font: 700 14px 'DM Sans', sans-serif; cursor: pointer; }
.gift-claim-button:disabled { opacity: .6; cursor: wait; }
small { display: block; margin-top: 14px; color: #947f85; font: 12px/1.5 'DM Sans', sans-serif; }
.gift-claim-error { margin: 20px 0 0; color: #a14f5d; font: 15px/1.5 'DM Sans', sans-serif; }
</style>
