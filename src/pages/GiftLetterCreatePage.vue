<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'
import { getGiftCapabilities } from '@/utils/giftCapabilities'
const route = useRoute()
const router = useRouter()
const saving = ref(false)
const error = ref('')
const from = ref('')
const to = ref('')
const theme = ref('romance')
const message = ref('')
const memories = ref<string[]>([])
const canUpload = ref(true)
const claimValid = ref(false)

try {
  const claim = JSON.parse(localStorage.getItem('stack-petals:gift-claim') || 'null')
  canUpload.value = getGiftCapabilities(claim).hasPhotoUpload
  claimValid.value = Boolean(claim?.token && claim.token === String(route.params.token || '') && claim?.qrId)
} catch {
  claimValid.value = false
}

onMounted(() => {
  if (!claimValid.value) error.value = 'Please open this page from the gift QR link first.'
})

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error || new Error('Could not read this photo.'))
    reader.readAsDataURL(file)
  })
}

async function addPhoto(event: Event) {
  if (!canUpload.value) return
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || []).slice(0, 3 - memories.value.length)
  for (const file of files) memories.value.push(await readFileAsDataUrl(file))
  input.value = ''
}

async function publish() {
  if (!claimValid.value) {
    error.value = 'Please open this page from the gift QR link first.'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const token = String(route.params.token || '')
    const { data, error: rpcError } = await supabase.rpc('create_gift_letter', {
      p_public_token: token,
      p_from: from.value.trim(),
      p_to: to.value.trim(),
      p_theme: theme.value,
      p_message: message.value.trim(),
      p_memories: memories.value,
    })
    if (rpcError) throw rpcError
    const id = Array.isArray(data) ? data[0]?.id : data?.id
    if (!id) throw new Error('The letter could not be created.')
    router.replace(`/letter/${id}`)
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : 'Could not save the letter.'
  } finally {
    saving.value = false
  }
}
</script>
<template><main class="gift-create"><section class="gift-create-card"><p class="eyebrow">Your Stack Petals gift</p><h1>Create the letter</h1><p class="intro">This gift is already purchased. Add your message{{ canUpload ? ' and memories' : '' }} below.</p><div class="fields"><label>From<input v-model="from" placeholder="Your name"></label><label>To<input v-model="to" placeholder="Recipient name"></label><label>Theme<select v-model="theme"><option value="romance">Romance</option><option value="family">Family</option><option value="birthday">Birthday</option><option value="sympathy">Sympathy</option><option value="friendship">Friendship</option><option value="graduation">Graduation</option></select></label><label>Your message<textarea v-model="message" rows="7" maxlength="2000" placeholder="Write something from the heart..."></textarea></label><label v-if="canUpload">Memories <span>(up to 3 photos)</span><input type="file" accept="image/*" multiple @change="addPhoto"></label><div v-if="memories.length" class="memory-row"><img v-for="(photo,i) in memories" :key="i" :src="photo" alt="Memory preview"></div></div><p v-if="error" class="error">{{error}}</p><button :disabled="saving || !claimValid || !to.trim() || !message.trim()" @click="publish">{{saving?'Publishing…':'Publish my letter'}}</button></section></main></template>
<style scoped>.gift-create{min-height:100vh;display:grid;place-items:center;padding:24px;background:#f8eeee;color:#49343b}.gift-create-card{width:min(100%,620px);padding:clamp(26px,5vw,48px);border:1px solid #dfbfc1;border-radius:24px;background:#fffdfa;box-shadow:0 20px 70px #6b46521c}.eyebrow{color:#a05d72;font:600 11px 'DM Sans';letter-spacing:.2em;text-transform:uppercase}.gift-create h1{margin:8px 0;font:400 clamp(38px,7vw,58px)/1 'Cormorant Garamond'}.intro{color:#806e73;font:15px 'DM Sans'}.fields{display:grid;gap:16px;margin-top:24px}.fields label{display:grid;gap:7px;color:#74515d;font:600 12px 'DM Sans'}.fields span{font-weight:400;color:#a28c91}input,select,textarea{box-sizing:border-box;width:100%;border:1px solid #dcb8bd;border-radius:10px;padding:12px;background:#fff;color:#49343b;font:15px 'DM Sans'}textarea{resize:vertical}.memory-row{display:flex;gap:10px}.memory-row img{width:82px;height:82px;object-fit:cover;border-radius:8px}.gift-create button{margin-top:22px;width:100%;border:0;border-radius:999px;padding:14px;background:#5e8d79;color:#fff;font:700 14px 'DM Sans';cursor:pointer}.gift-create button:disabled{opacity:.5}.error{color:#a14f5d;font:14px 'DM Sans'}</style>
