<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { PhCopy, PhShareNetwork, PhDownloadSimple, PhEye, PhEyeSlash, PhLockKey } from '@phosphor-icons/vue'
import { letterPasswordSaveText, letterPasswordShareText } from '@/utils/letterPasswordShare'
const props = defineProps<{ password: string }>()
const emit = defineEmits<{ clear: [] }>()
const visible = ref(false), busy = ref(false), status = ref('')
const field = ref<HTMLInputElement | null>(null)
watch(() => props.password, () => { visible.value = false; status.value = '' })
const cancelled = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'
async function copy() {
  status.value = ''
  try { await navigator.clipboard.writeText(props.password); status.value = 'Password copied. Paste it into a private message.' }
  catch { visible.value = true; status.value = 'Copy is unavailable. Select the password above and copy it manually.'; await nextTick(); field.value?.focus(); field.value?.select() }
}
async function share() {
  if (busy.value || !props.password) return
  if (!navigator.share) { await copy(); return }
  busy.value = true; status.value = ''
  try { await navigator.share({ title: 'Your private Stack Petals letter', text: letterPasswordShareText(props.password) }); status.value = 'Sharing finished. Send only to your intended recipient.' }
  catch (error) { if (!cancelled(error)) status.value = 'Could not open sharing. Use Copy password to send it privately.' }
  finally { busy.value = false }
}
async function save() {
  if (busy.value || !props.password) return
  busy.value = true; status.value = ''
  const file = new File([letterPasswordSaveText(props.password)], 'stack-petals-letter-password.txt', { type: 'text/plain;charset=utf-8' })
  try {
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Save your private letter password' })
      status.value = 'Save sheet closed. Check that the file was saved somewhere private.'
    } else {
      const url = URL.createObjectURL(file), link = document.createElement('a')
      link.href = url; link.download = file.name; document.body.appendChild(link); link.click(); link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
      status.value = 'Password file download started. Keep it somewhere private.'
    }
  } catch (error) { if (!cancelled(error)) status.value = 'Could not save the file. Copy the password into a private note instead.' }
  finally { busy.value = false }
}
</script>
<template>
  <section class="password-share" aria-labelledby="password-share-title">
    <p class="password-share-eyebrow"><PhLockKey :size="15" aria-hidden="true" />ONLY FOR YOU AND THEM</p>
    <h2 id="password-share-title">Send the key to their letter.</h2>
    <p class="password-share-intro">Share privately with your recipient, or save a copy on your phone.</p>
    <label class="password-share-label" for="share-letter-password">Your letter password</label>
    <div class="password-share-field"><input id="share-letter-password" ref="field" :value="password" :type="visible ? 'text' : 'password'" readonly autocomplete="off" spellcheck="false" /><button type="button" :aria-label="visible ? 'Hide saved letter password' : 'Show saved letter password'" :aria-pressed="visible" @click="visible = !visible"><component :is="visible ? PhEyeSlash : PhEye" :size="19" aria-hidden="true" /></button></div>
    <div class="password-share-actions"><button type="button" :disabled="busy" @click="copy"><PhCopy :size="18" aria-hidden="true" />Copy password</button><button type="button" :disabled="busy" @click="share"><PhShareNetwork :size="18" aria-hidden="true" />Share privately</button><button type="button" :disabled="busy" @click="save"><PhDownloadSimple :size="18" aria-hidden="true" />Save password</button></div>
    <p v-if="status" role="status" class="password-share-status">{{ status }}</p>
    <p class="password-share-note">Never put it on the QR card or share it publicly. Saved files and clipboard copies contain the readable password. We cannot retrieve it after you leave this page.</p>
    <button class="password-share-clear" type="button" :disabled="busy" @click="emit('clear')">I’ve saved it — clear it from this tab</button>
  </section>
</template>
<style scoped>
.password-share { margin:28px 0; padding:clamp(20px,4vw,28px); border:1px solid #d6e2d2; border-radius:20px; background:linear-gradient(135deg,#eff4ec,#fffaf6); color:#4e5c4d; }
.password-share-eyebrow { display:flex; align-items:center; gap:8px; margin:0 0 12px; color:#536f57; font:600 9px/1.7 'DM Sans',sans-serif; letter-spacing:.12em; }
.password-share h2 { margin:0 0 12px; color:#465b47; font:400 28px/1.2 'Cormorant Garamond',Georgia,serif; }
.password-share-intro,.password-share-note,.password-share-status { font:12px/1.8 'DM Sans',sans-serif; }
.password-share-intro { color:#64705f; margin-bottom:20px; }
.password-share-label { display:block; font:600 11px/1.6 'DM Sans',sans-serif; margin-bottom:7px; }
.password-share-field { display:flex; border:1px solid #d2dccc; border-radius:12px; overflow:hidden; background:#fffdf9; }
.password-share-field input { min-width:0; width:100%; border:0; padding:14px; background:none; font:16px/1.6 'DM Sans',sans-serif; color:#42533f; }
.password-share-field button { flex:none; width:46px; display:grid; place-items:center; border:0; background:none; color:#58775a; cursor:pointer; }
.password-share-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
.password-share-actions button { flex:1 1 150px; display:flex; align-items:center; justify-content:center; gap:9px; min-height:44px; padding:10px 12px; border:1px solid #cbd9c7; border-radius:10px; background:#fffdf9; color:#49634b; font:600 11px/1.6 'DM Sans',sans-serif; cursor:pointer; }
.password-share-actions button:nth-child(2) { background:#587d65; color:#fff; border-color:#587d65; }
.password-share-note { margin:16px 0 12px; color:#687063; font-size:11px; }
.password-share-status { color:#3d6347; margin:12px 0; }
.password-share-clear { padding:4px 0; border:0; border-bottom:1px solid #afbdab; background:none; color:#5d6e55; font:11px/1.7 'DM Sans',sans-serif; cursor:pointer; }
.password-share button:disabled { opacity:.5; cursor:wait; }
.password-share :is(input,button):focus-visible { outline:2px solid #587d65; outline-offset:2px; }
</style>
