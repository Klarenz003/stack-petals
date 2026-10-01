<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'
import { getGiftCapabilities } from '@/utils/giftCapabilities'

const route = useRoute(); const router = useRouter()
const loading = ref(true); const claiming = ref(false); const error = ref(''); const activationCode = ref('')
const code = ref<{ id:string; product_name:string; has_360_view:boolean; has_photo_upload:boolean; status:string; letter_id:string|null } | null>(null)
const copy = computed(() => getGiftCapabilities(code.value).hasPhotoUpload ? 'Your message, memories, and LetterPage V2 experience are ready.' : 'Your message and LetterPage V2 experience are ready.')

async function claim() {
  if (!code.value || claiming.value) return
  claiming.value = true; error.value = ''
  const token = String(route.params.token || '').trim()
  const { data, error: claimError } = await supabase.rpc('claim_letter_v2_qr', { p_public_token: token, p_activation_code: activationCode.value.trim().toUpperCase() || null })
  const claimed = Array.isArray(data) ? data[0] : data
  if (claimError || !claimed) { error.value = 'Enter the activation code printed with this LetterPage V2 QR card.'; claiming.value = false; return }
  localStorage.setItem('stack-petals:letter-v2-claim', JSON.stringify({ token, qrId: claimed.id, has360Viewer: claimed.has_360_view, hasPhotoUpload: claimed.has_photo_upload, productName: claimed.product_name }))
  await router.replace(`/letter-v2/create/${token}`)
}

onMounted(async () => {
  const token = String(route.params.token || '').trim()
  if (!token) { error.value = 'This LetterPage V2 link is incomplete.'; loading.value = false; return }
  const { data, error: resolveError } = await supabase.rpc('resolve_letter_v2_qr', { p_public_token: token })
  const resolved = Array.isArray(data) ? data[0] : data
  if (resolveError || !resolved) error.value = 'This LetterPage V2 QR code is unavailable.'
  else if (resolved.status === 'published' && resolved.letter_id) { await router.replace(`/letter-v2/${resolved.letter_id}`); return }
  else code.value = resolved
  loading.value = false
})
</script>

<template><main class="v2-claim"><section class="v2-card"><p class="eyebrow">Standalone LetterPage V2</p><h1 v-if="loading">Opening your letter…</h1><template v-else-if="code && !error"><h1>Unlock LetterPage V2.</h1><p>{{ code.product_name }} is ready to personalize.</p><label>Activation code<input v-model="activationCode" placeholder="XXXX-XXXX" autocomplete="one-time-code" @keyup.enter="claim"></label><button :disabled="claiming || !activationCode.trim()" @click="claim">{{ claiming ? 'Opening…' : 'Customize the letter' }}</button><small>{{ copy }}</small></template><p v-else class="error">{{ error }}</p></section></main></template>
<style scoped>.v2-claim{min-height:100vh;display:grid;place-items:center;padding:24px;background:#f8eeee;color:#49343b}.v2-card{width:min(100%,460px);padding:clamp(28px,6vw,56px);border:1px solid #dfbfc1;border-radius:24px;background:#fffdfa;box-shadow:0 22px 70px #5e37411f;text-align:center}.eyebrow{margin:0 0 12px;color:#a05d72;font:600 11px/1.4 'DM Sans';letter-spacing:.24em;text-transform:uppercase}h1{margin:0;font:400 clamp(34px,7vw,54px)/1.05 'Cormorant Garamond'}p{color:#7e6a70;font:16px/1.5 'DM Sans'}label{display:grid;gap:8px;margin-top:20px;text-align:left;color:#74515d;font:600 12px 'DM Sans'}input{box-sizing:border-box;width:100%;padding:13px 14px;border:1px solid #dcb8bd;border-radius:10px;font:15px 'DM Sans'}button{width:100%;margin-top:20px;border:0;border-radius:999px;padding:14px;background:#5e8d79;color:#fff;font:700 14px 'DM Sans';cursor:pointer}button:disabled{opacity:.5}small{display:block;margin-top:14px;color:#947f85;font:12px/1.5 'DM Sans'}.error{color:#a14f5d}</style>
