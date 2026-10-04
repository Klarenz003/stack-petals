<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhChatCircle as MessageCircle, PhPaperPlaneTilt as Send, PhSparkle as Sparkles, PhThumbsDown as ThumbsDown, PhThumbsUp as ThumbsUp, PhX as X } from '@phosphor-icons/vue'
import { supabase } from '@/supabaseClient'
import { reportStorefrontError } from '@/services/errorTracker'
import { useMarketStore } from '@/stores/market'

type ChatMessage = {
  id: number
  role: 'user' | 'assistant'
  content: string
  route?: string
  interactionId?: string
  feedback?: 'helpful' | 'not_helpful'
}

const route = useRoute()
const router = useRouter()
const market = useMarketStore()
const isOpen = ref(false)
const sending = ref(false)
const input = ref('')
const inputElement = ref<HTMLTextAreaElement | null>(null)
const messageList = ref<HTMLElement | null>(null)
let nextMessageId = 1
const CHAT_SESSION_KEY = 'stack-petals:chat-session'

function chatSessionToken() {
  const existing = localStorage.getItem(CHAT_SESSION_KEY)
  if (existing && /^[A-Za-z0-9_-]{20,80}$/.test(existing)) return existing
  const token = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().replace(/-/g, '')
    : `${Date.now()}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`
  localStorage.setItem(CHAT_SESSION_KEY, token)
  return token
}

const sessionToken = chatSessionToken()

const messages = ref<ChatMessage[]>([
  {
    id: nextMessageId++,
    role: 'assistant',
    content: 'Hi, I am Petal Guide. Ask me about Stack Petals gifts, ordering, delivery or pickup, and the QR keepsake experience.',
  },
])

const quickQuestions = computed(() => [
  market.code === 'CA' ? 'What gifts are available in Canada?' : 'What gifts are available in the Philippines?',
  'How does the QR keepsake work?',
  'How can I track my order?',
])

const routeLabels: Record<string, string> = {
  '/products': 'Open Shop',
  '/process': 'See How It Works',
  '/track': 'Track Order',
  '/contact': 'Contact Stack Petals',
  '/gallery': 'View Gallery',
}

async function scrollToLatest() {
  await nextTick()
  if (messageList.value) messageList.value.scrollTop = messageList.value.scrollHeight
}

async function openChat() {
  isOpen.value = true
  await nextTick()
  inputElement.value?.focus()
  scrollToLatest()
}

function closeChat() {
  isOpen.value = false
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) closeChat()
}

async function sendMessage(prefilled?: string) {
  const content = (prefilled ?? input.value).trim()
  if (!content || sending.value || content.length > 500) return

  messages.value.push({ id: nextMessageId++, role: 'user', content })
  input.value = ''
  sending.value = true
  await scrollToLatest()

  const history = messages.value
    .slice(1, -1)
    .slice(-6)
    .map(message => ({ role: message.role, content: message.content }))

  const { data, error } = await supabase.functions.invoke('stack-petals-chat', {
    body: {
      message: content,
      history,
      market: market.code,
      page: route.fullPath,
      sessionToken,
    },
  })

  if (error || !data?.answer) {
    reportStorefrontError('chat.send', error)
    messages.value.push({
      id: nextMessageId++,
      role: 'assistant',
      content: 'I am having trouble connecting right now. Please try again or contact Stack Petals.',
      route: '/contact',
    })
  } else {
    messages.value.push({
      id: nextMessageId++,
      role: 'assistant',
      content: String(data.answer),
      route: routeLabels[data.route] ? data.route : undefined,
      interactionId: data.interactionId || undefined,
    })
  }

  sending.value = false
  await scrollToLatest()
  inputElement.value?.focus()
}

function handleInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

async function followRoute(path: string) {
  closeChat()
  await router.push(path)
}

async function rateMessage(message: ChatMessage, feedback: 'helpful' | 'not_helpful') {
  if (!message.interactionId || message.feedback) return
  const previous = message.feedback
  message.feedback = feedback

  const { data, error } = await supabase.rpc('rate_chatbot_interaction', {
    p_interaction_id: message.interactionId,
    p_session_token: sessionToken,
    p_feedback: feedback,
  })

  if (error || data !== true) message.feedback = previous
}

watch(() => market.code, () => {
  messages.value = [messages.value[0]]
})

window.addEventListener('keydown', handleEscape)
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<template>
  <div class="petal-chat" :class="{ open: isOpen }">
    <Transition name="petal-chat-panel">
      <section
        v-if="isOpen"
        class="petal-chat-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby="petal-chat-title"
      >
        <header class="petal-chat-header">
          <span class="petal-chat-mark" aria-hidden="true"><Sparkles :size="18" /></span>
          <div>
            <h2 id="petal-chat-title">Petal Guide</h2>
            <p>Stack Petals questions only</p>
          </div>
          <button type="button" aria-label="Close chat" title="Close chat" @click="closeChat">
            <X :size="19" />
          </button>
        </header>

        <div ref="messageList" class="petal-chat-messages" aria-live="polite">
          <div
            v-for="message in messages"
            :key="message.id"
            class="petal-chat-message"
            :class="message.role"
          >
            <p>{{ message.content }}</p>
            <button
              v-if="message.route"
              type="button"
              class="petal-chat-route"
              @click="followRoute(message.route)"
            >
              {{ routeLabels[message.route] }}
            </button>
            <div v-if="message.interactionId" class="petal-chat-feedback" aria-label="Was this answer helpful?">
              <span>{{ message.feedback ? 'Thank you' : 'Helpful?' }}</span>
              <button
                type="button"
                :class="{ selected: message.feedback === 'helpful' }"
                :disabled="Boolean(message.feedback)"
                aria-label="Helpful answer"
                title="Helpful"
                @click="rateMessage(message, 'helpful')"
              >
                <ThumbsUp :size="13" />
              </button>
              <button
                type="button"
                :class="{ selected: message.feedback === 'not_helpful' }"
                :disabled="Boolean(message.feedback)"
                aria-label="Not helpful answer"
                title="Not helpful"
                @click="rateMessage(message, 'not_helpful')"
              >
                <ThumbsDown :size="13" />
              </button>
            </div>
          </div>

          <div v-if="messages.length === 1" class="petal-chat-suggestions">
            <button
              v-for="question in quickQuestions"
              :key="question"
              type="button"
              @click="sendMessage(question)"
            >
              {{ question }}
            </button>
          </div>

          <div v-if="sending" class="petal-chat-typing" aria-label="Petal Guide is replying">
            <span></span><span></span><span></span>
          </div>
        </div>

        <form class="petal-chat-compose" @submit.prevent="sendMessage()">
          <textarea
            ref="inputElement"
            v-model="input"
            rows="1"
            maxlength="500"
            aria-label="Ask Petal Guide"
            placeholder="Ask about Stack Petals..."
            :disabled="sending"
            @keydown="handleInputKeydown"
          ></textarea>
          <button
            type="submit"
            :disabled="sending || !input.trim()"
            aria-label="Send message"
            title="Send message"
          >
            <Send :size="18" />
          </button>
        </form>
        <p class="petal-chat-note">Please do not share passwords or payment credentials.</p>
      </section>
    </Transition>

    <button
      v-if="!isOpen"
      type="button"
      class="petal-chat-launcher"
      aria-label="Ask Petal Guide"
      title="Ask Petal Guide"
      @click="openChat"
    >
      <MessageCircle :size="25" />
      <span>Ask us</span>
    </button>
  </div>
</template>

<style scoped>
.petal-chat {
  position: fixed;
  right: max(24px, env(safe-area-inset-right));
  bottom: calc(92px + env(safe-area-inset-bottom));
  z-index: 1200;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
}

.petal-chat button,
.petal-chat textarea,
.petal-chat-panel {
  pointer-events: auto;
}

.petal-chat-launcher {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 17px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 24px;
  background: #9b5261;
  color: #fff;
  box-shadow: 0 12px 30px rgba(111, 52, 68, 0.24);
  font: 600 14px/1 Arial, sans-serif;
  cursor: pointer;
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.petal-chat-launcher:hover {
  background: #874655;
  box-shadow: 0 15px 34px rgba(111, 52, 68, 0.3);
  transform: translateY(-2px);
}

.petal-chat-panel {
  display: flex;
  width: min(370px, calc(100vw - 32px));
  height: min(570px, calc(100dvh - 150px));
  margin-bottom: 12px;
  overflow: hidden;
  flex-direction: column;
  border: 1px solid rgba(205, 145, 157, 0.42);
  border-radius: 8px;
  background: rgba(255, 252, 251, 0.98);
  box-shadow: 0 24px 60px rgba(74, 42, 50, 0.2);
  color: #332a2c;
  backdrop-filter: blur(18px);
}

.petal-chat-header {
  display: grid;
  grid-template-columns: 38px 1fr 36px;
  gap: 10px;
  align-items: center;
  min-height: 70px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(205, 145, 157, 0.24);
  background: linear-gradient(110deg, #fff4f5 0%, #f3f7f3 100%);
}

.petal-chat-mark {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 50%;
  background: #fff;
  color: #9b5261;
  box-shadow: 0 4px 12px rgba(155, 82, 97, 0.15);
}

.petal-chat-header h2 {
  margin: 0;
  color: #6f3444;
  font-family: Georgia, serif;
  font-size: 19px;
  font-weight: 500;
  letter-spacing: 0;
}

.petal-chat-header p {
  margin: 3px 0 0;
  color: #756b6d;
  font: 12px/1.3 Arial, sans-serif;
}

.petal-chat-header button {
  display: grid;
  width: 34px;
  height: 34px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #6d6264;
  cursor: pointer;
}

.petal-chat-header button:hover { background: rgba(155, 82, 97, 0.09); }

.petal-chat-messages {
  display: flex;
  min-height: 0;
  padding: 16px 14px;
  overflow-y: auto;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  overscroll-behavior: contain;
}

.petal-chat-message {
  max-width: 84%;
  font: 14px/1.48 Arial, sans-serif;
}

.petal-chat-message p {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  white-space: pre-wrap;
}

.petal-chat-message.assistant { align-self: flex-start; }
.petal-chat-message.assistant p {
  border: 1px solid #eadadd;
  background: #fff;
  color: #514648;
}

.petal-chat-message.user { align-self: flex-end; }
.petal-chat-message.user p {
  background: #648e7b;
  color: #fff;
}

.petal-chat-route {
  margin-top: 6px;
  padding: 7px 10px;
  border: 1px solid #d8a5ae;
  border-radius: 6px;
  background: #fff8f8;
  color: #8a4758;
  font: 600 12px/1 Arial, sans-serif;
  cursor: pointer;
}

.petal-chat-feedback {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-top: 6px;
  color: #8a7d80;
  font: 11px/1 Arial, sans-serif;
}

.petal-chat-feedback button {
  display: grid;
  width: 25px;
  height: 25px;
  padding: 0;
  place-items: center;
  border: 1px solid #eadadd;
  border-radius: 50%;
  background: #fff;
  color: #806f73;
  cursor: pointer;
}

.petal-chat-feedback button:hover:not(:disabled),
.petal-chat-feedback button.selected {
  border-color: #b66d7d;
  color: #9b5261;
}

.petal-chat-feedback button:disabled { cursor: default; }

.petal-chat-suggestions {
  display: flex;
  margin-top: 2px;
  flex-direction: column;
  gap: 7px;
}

.petal-chat-suggestions button {
  width: fit-content;
  max-width: 100%;
  padding: 8px 10px;
  border: 1px solid #dce7df;
  border-radius: 6px;
  background: #f7faf7;
  color: #496b5c;
  font: 13px/1.3 Arial, sans-serif;
  text-align: left;
  cursor: pointer;
}

.petal-chat-typing {
  display: flex;
  align-self: flex-start;
  gap: 4px;
  padding: 11px 13px;
  border: 1px solid #eadadd;
  border-radius: 8px;
  background: #fff;
}

.petal-chat-typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c77d8d;
  animation: petal-chat-dot 900ms ease-in-out infinite;
}
.petal-chat-typing span:nth-child(2) { animation-delay: 140ms; }
.petal-chat-typing span:nth-child(3) { animation-delay: 280ms; }

.petal-chat-compose {
  display: grid;
  grid-template-columns: 1fr 40px;
  gap: 8px;
  padding: 10px 12px 6px;
  border-top: 1px solid rgba(205, 145, 157, 0.22);
  background: #fff;
}

.petal-chat-compose textarea {
  width: 100%;
  min-height: 40px;
  max-height: 92px;
  padding: 10px 11px;
  resize: none;
  border: 1px solid #dfd5d6;
  border-radius: 7px;
  outline: none;
  color: #332a2c;
  font: 14px/1.35 Arial, sans-serif;
}

.petal-chat-compose textarea:focus {
  border-color: #b66d7d;
  box-shadow: 0 0 0 3px rgba(182, 109, 125, 0.12);
}

.petal-chat-compose button {
  display: grid;
  width: 40px;
  height: 40px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: #9b5261;
  color: #fff;
  cursor: pointer;
}

.petal-chat-compose button:disabled { cursor: default; opacity: 0.45; }

.petal-chat-note {
  margin: 0;
  padding: 0 12px 9px;
  background: #fff;
  color: #918689;
  font: 10px/1.3 Arial, sans-serif;
  text-align: center;
}

.petal-chat-panel-enter-active,
.petal-chat-panel-leave-active { transition: opacity 180ms ease, transform 220ms ease; }
.petal-chat-panel-enter-from,
.petal-chat-panel-leave-to { opacity: 0; transform: translateY(12px) scale(0.98); }

@keyframes petal-chat-dot {
  0%, 70%, 100% { opacity: 0.35; transform: translateY(0); }
  35% { opacity: 1; transform: translateY(-3px); }
}

@media (max-width: 600px) {
  .petal-chat {
    right: max(12px, env(safe-area-inset-right));
    bottom: calc(86px + env(safe-area-inset-bottom));
  }

  .petal-chat-panel {
    width: calc(100vw - 24px);
    height: min(560px, calc(100dvh - 118px));
  }

  .petal-chat-launcher span { display: none; }
  .petal-chat-launcher { width: 50px; min-height: 50px; padding: 0; border-radius: 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .petal-chat-panel-enter-active,
  .petal-chat-panel-leave-active { transition: none; }
  .petal-chat-typing span { animation: none; }
}
</style>
