<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const cart = useCartStore()
const router = useRouter()
const isShaking = ref(false)
const emailError = ref('')
const showPreview = ref(false)
const showLetterExperiencePreview = ref(false)
const letterPreviewScreen = ref(0)
const previewRevealed = ref([false, false, false, false, false, false])
const letterPreviewPetals = ref([false, false, false, false, false, false])
const addressStatus = ref('Type the full delivery address so we can estimate the shipping area.')
const receiptDownloaded = ref(false)
const referenceCopied = ref(false)
const MAIN_LETTER_WORD_LIMIT = 300
const PETAL_MESSAGE_CHAR_LIMIT = 30

// ── Functions ──────────────────────────────────────
async function compressImage(file: File, maxSize = 1400, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  const image = new Image()
  const objectUrl = URL.createObjectURL(file)

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = reject
      image.src = objectUrl
    })

    const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function fileToDataUrl(file: File) {
  const compressed = await compressImage(file, 1200, 0.8)
  return await new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = event => resolve(event.target?.result as string)
    reader.readAsDataURL(compressed)
  })
}

async function submitOrder() {
  if (cart.isSubmittingOrder) return
  try {
    await cart.submitOrder()
    receiptDownloaded.value = false
    referenceCopied.value = false
    cart.checkoutStep = 5
  } catch (error) {
    console.error(error)
  }
}

async function handleProofUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) cart.handleProofUpload(await compressImage(file))
}

async function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) cart.handleProofUpload(await compressImage(file))
}

function validateEmail() {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  emailError.value = pattern.test(cart.customer.email) ? '' : 'Please enter a valid email address'
}

function formatPhoneInput(event: Event) {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '').slice(0, 11)
  cart.customer.phone = digits
  input.value = formatPhoneDisplay(digits)
}

function formatPhoneDisplay(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 4) return digits
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
}

function getWordCount(text: string) {
  return text.trim().match(/\S+/g)?.length || 0
}

function limitWords(text: string, limit = MAIN_LETTER_WORD_LIMIT) {
  const words = text.trim().match(/\S+/g) || []
  return words.length > limit ? words.slice(0, limit).join(' ') : text
}

function handleMainMessageInput() {
  cart.letterData.mainMessage = limitWords(cart.letterData.mainMessage)
}

function limitPetalMessage(index: number) {
  cart.letterData.petalMessages[index] = cart.letterData.petalMessages[index].slice(0, PETAL_MESSAGE_CHAR_LIMIT)
}

function handleAddressInput() {
  cart.refreshShippingEstimate()
  const address = cart.shippingEstimateAddress.trim()
  addressStatus.value = address.length >= 8
    ? 'Shipping is estimated from the barangay, city/municipality, and province fields.'
    : 'Fill in barangay, city/municipality, and province so we can estimate the shipping area.'
}

function shakeModal() {
  if (isShaking.value) return
  isShaking.value = true
  setTimeout(() => { isShaking.value = false }, 500)
}

function handleDone() {
  cart.finishCheckout()
  window.location.reload()
}

async function continueToPayment() {
  if (cart.letterData.include) {
    cart.letterData.mainMessage = limitWords(cart.letterData.mainMessage)
    cart.letterData.petalMessages = cart.letterData.petalMessages.map(message =>
      message.slice(0, PETAL_MESSAGE_CHAR_LIMIT)
    )
  }
  const reserved = await cart.reserveStockForPayment()
  if (reserved) cart.checkoutStep = 4
}

async function backFromPayment() {
  await cart.releaseStockReservation()
  cart.checkoutStep = 3
}

function buildReceiptText() {
  const itemLines = cart.cartItems.map((item, index) => {
    const quantity = item.quantity > 1 ? ` x ${item.quantity}` : ''
    return `${index + 1}. ${item.name}${quantity} - ${item.price}`
  })

  return [
    'STACK PETALS ORDER RECEIPT',
    '==========================',
    '',
    `Order Reference: ${cart.confirmedOrderReference}`,
    `Order Type: ${cart.hasPreOrderItems ? 'Pre-order' : 'Standard'}`,
    `Customer: ${cart.customer.name}`,
    `Phone: ${cart.customer.phone}`,
    `Email: ${cart.customer.email}`,
    '',
    'Delivery',
    '--------',
    `Date: ${cart.customer.date}`,
    `Address: ${cart.fullDeliveryAddress}`,
    `Shipping Area: ${cart.shippingLabel}`,
    '',
    'Items',
    '-----',
    ...itemLines,
    '',
    'Payment',
    '-------',
    `Payment Method: ${cart.paymentMethod === 'gcash' ? 'GCash' : 'Maya'}`,
    `Subtotal: ${cart.cartSubtotal}`,
    `Shipping Fee: PHP ${cart.shippingFee.toFixed(2)}`,
    `Total: ${cart.confirmedTotal}`,
    '',
    'Please keep this receipt and use your order reference when tracking or contacting Stack Petals.',
  ].join('\n')
}

function downloadReceipt() {
  const receipt = buildReceiptText()
  const blob = new Blob([receipt], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${cart.confirmedOrderReference || 'stack-petals-order'}-receipt.txt`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  receiptDownloaded.value = true
}

async function copyOrderReference() {
  const reference = cart.confirmedOrderReference
  if (!reference) return

  try {
    await navigator.clipboard.writeText(reference)
  } catch {
    const input = document.createElement('textarea')
    input.value = reference
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    input.remove()
  }

  referenceCopied.value = true
  setTimeout(() => { referenceCopied.value = false }, 1800)
}

function goToTrackOrder() {
  const reference = cart.confirmedOrderReference
  cart.finishCheckout()
  router.push({ name: 'track', query: reference ? { ref: reference } : undefined })
}

function goToReceipt() {
  const reference = cart.confirmedOrderReference
  cart.finishCheckout()
  router.push({ name: 'receipt', query: reference ? { ref: reference } : undefined })
}

// ── Computed ───────────────────────────────────────
const minDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

const googleMapsSearchUrl = computed(() => {
  const address = cart.fullDeliveryAddress.trim()
  const query = address || 'Taytay Rizal Philippines'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
})

const reservationExpiresAt = computed(() => {
  if (!cart.stockReservationExpiresAt) return ''
  return new Date(cart.stockReservationExpiresAt).toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const mainMessageWordCount = computed(() => getWordCount(cart.letterData.mainMessage))
const mainMessageNearLimit = computed(() => mainMessageWordCount.value >= MAIN_LETTER_WORD_LIMIT - 30)

async function handleMemoryUpload(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files) {
    for (let i = 0; i < Math.min(files.length, 3 - cart.letterData.memories.length); i++) {
      cart.letterData.memories.push(await fileToDataUrl(files[i]))
    }
  }
}

async function handleMemoryDrop(e: DragEvent) {
  const files = e.dataTransfer?.files
  if (files) {
    for (let i = 0; i < Math.min(files.length, 3 - cart.letterData.memories.length); i++) {
      if (files[i].type.startsWith('image/')) {
        cart.letterData.memories.push(await fileToDataUrl(files[i]))
      }
    }
  }
}

function togglePreviewPetal(i: number) {
  previewRevealed.value[i] = !previewRevealed.value[i]
}

function openLetterExperiencePreview() {
  letterPreviewScreen.value = 0
  letterPreviewPetals.value = [false, false, false, false, false, false]
  showLetterExperiencePreview.value = true
}

function nextLetterPreviewScreen() {
  if (letterPreviewScreen.value < 3) letterPreviewScreen.value++
}

function prevLetterPreviewScreen() {
  if (letterPreviewScreen.value > 0) letterPreviewScreen.value--
}

function toggleLetterPreviewPetal(i: number) {
  letterPreviewPetals.value[i] = !letterPreviewPetals.value[i]
}

</script>

<template>
  <div
    v-if="cart.checkoutStep > 0"
    class="checkout-overlay"
    @click.self="shakeModal"
  >
    <div class="checkout-modal" :class="{ shake: isShaking }">

      <!-- Step indicator -->
      <div class="checkout-steps">
        <div class="step" :class="{ active: cart.checkoutStep >= 1, done: cart.checkoutStep > 1 }">
          <span>1</span><small>Order</small>
        </div>
        <div class="step-line" :class="{ done: cart.checkoutStep > 1 }"></div>
        <div class="step" :class="{ active: cart.checkoutStep >= 2, done: cart.checkoutStep > 2 }">
          <span>2</span><small>Details</small>
        </div>
        <div class="step-line" :class="{ done: cart.checkoutStep > 2 }"></div>
        <div class="step" :class="{ active: cart.checkoutStep >= 3, done: cart.checkoutStep > 3 }">
          <span>3</span><small>Letter</small>
        </div>
        <div class="step-line" :class="{ done: cart.checkoutStep > 3 }"></div>
        <div class="step" :class="{ active: cart.checkoutStep >= 4, done: cart.checkoutStep > 4 }">
          <span>4</span><small>Payment</small>
        </div>
        <div class="step-line" :class="{ done: cart.checkoutStep > 4 }"></div>
        <div class="step" :class="{ active: cart.checkoutStep >= 5 }">
          <span>✓</span><small>Done</small>
        </div>
      </div>

      <!-- STEP 1 — Order Summary -->
      <div v-if="cart.checkoutStep === 1" class="checkout-body">
        <h2>Order Summary</h2>
        <div v-for="item in cart.cartItems" :key="item.name" class="co-item">
          <img :src="item.image" :alt="item.name" />
          <div class="co-item-info">
            <span class="co-item-name">{{ item.name }}</span>
            <span v-if="item.preOrder" class="checkout-preorder-tag">Pre-order • {{ item.prepDays ?? 5 }} day{{ (item.prepDays ?? 5) === 1 ? '' : 's' }} prep</span>
            <span class="co-item-price">{{ item.price }}</span>
          </div>
        </div>
        <div v-if="cart.hasPreOrderItems" class="checkout-preorder-notice">
          <strong>Pre-order included</strong>
          <span>Choose a delivery date at least {{ cart.preOrderPrepDays }} day{{ cart.preOrderPrepDays === 1 ? '' : 's' }} from today.</span>
        </div>
        <div class="co-total order-total-breakdown">
          <div><span>Subtotal</span><strong>{{ cart.cartSubtotal }}</strong></div>
          <div><span>Shipping</span><strong>{{ cart.shippingFee ? `₱${cart.shippingFee.toFixed(2)}` : 'Add address' }}</strong></div>
          <div><span>Total</span><strong>{{ cart.cartTotal }}</strong></div>
        </div>
        <div class="co-actions">
          <button class="co-btn-outline" @click="cart.closeCheckout()">Cancel</button>
          <button class="co-btn-primary" @click="cart.checkoutStep = 2">Continue →</button>
        </div>
      </div>

      <!-- STEP 2 — Customer Details -->
      <div v-if="cart.checkoutStep === 2" class="checkout-body">
        <h2>Your Details</h2>
        <div class="co-form">
          <label>Full Name
            <input v-model="cart.customer.name" type="text" placeholder="Juan dela Cruz" />
          </label>
          <label>Email Address
            <input v-model="cart.customer.email" type="email" placeholder="juan@email.com" @input="validateEmail"/>
            <small class="field-error" v-if="emailError">{{ emailError }}</small>
          </label>
          <label>Phone Number
            <input
              :value="formatPhoneDisplay(cart.customer.phone)"
              type="tel"
              inputmode="numeric"
              autocomplete="tel"
              placeholder="09XX XXX XXXX"
              maxlength="13"
              @input="formatPhoneInput"
            />
            <small class="field-error" v-if="cart.customer.phone.length > 0 && cart.customer.phone.length < 11">Phone number must be 11 digits</small>
            <small class="field-error" v-else-if="cart.customer.phone.length === 11 && !cart.customer.phone.startsWith('09')">Use a valid PH mobile number starting with 09</small>
          </label>
          <label class="full-field">Delivery Address
            <input
              v-model="cart.customer.address"
              type="text"
              placeholder="House/unit/building and street"
              @input="handleAddressInput"
            />
          </label>
          <label class="full-field">Nearest Landmark (optional)
            <input
              v-model="cart.customer.landmark"
              type="text"
              placeholder="Near church, school, mall, subdivision gate, etc."
              @input="handleAddressInput"
            />
          </label>
          <div class="address-grid">
            <label>Barangay
              <input
                v-model="cart.customer.barangay"
                type="text"
                placeholder="Barangay"
                @input="handleAddressInput"
              />
            </label>
            <label>City / Municipality
              <input
                v-model="cart.customer.city"
                type="text"
                placeholder="Taytay"
                @input="handleAddressInput"
              />
            </label>
            <label>Province
              <input
                v-model="cart.customer.province"
                type="text"
                placeholder="Rizal"
                @input="handleAddressInput"
              />
            </label>
          </div>
          <div class="address-detect-card">
            <p class="map-status">{{ addressStatus }}</p>
            <p v-if="cart.fullDeliveryAddress" class="address-preview">
              {{ cart.fullDeliveryAddress }}
            </p>
            <div class="shipping-estimate">
              <span>{{ cart.shippingLabel }}</span>
              <strong>{{ cart.shippingFee ? `₱${cart.shippingFee.toFixed(2)}` : 'Pending' }}</strong>
            </div>
            <a class="map-adjust-btn" :href="googleMapsSearchUrl" target="_blank" rel="noopener noreferrer">
              Check address in Google Maps
            </a>
          </div>
          <label>Delivery Date
            <input
              v-model="cart.customer.date"
              type="date"
              :min="minDate"
              @change="cart.checkDeliveryDateCapacity()"
              @keydown.prevent
            />
            <small
              v-if="cart.deliveryDateMessage"
              :class="['delivery-slot-message', { full: cart.deliveryDateFull, limited: cart.deliveryDateCapacity.isLimited }]"
            >
              {{ cart.isCheckingDeliveryDate ? 'Checking delivery slots...' : cart.deliveryDateMessage }}
            </small>
            <small v-if="cart.preOrderDateMessage" class="field-error preorder-date-error">
              {{ cart.preOrderDateMessage }}
            </small>
          </label>
          <label>Note (optional)
            <textarea v-model="cart.customer.note" placeholder="Any special requests?" rows="2"></textarea>
          </label>
        </div>
        <div class="co-actions">
          <button class="co-btn-outline" @click="cart.checkoutStep = 1">← Back</button>
          <button class="co-btn-primary" @click="cart.checkoutStep = 3" :disabled="!cart.customerValid">
            {{ cart.isCheckingDeliveryDate ? 'Checking slots...' : 'Continue →' }}
          </button>
        </div>
      </div>

      <!-- STEP 3 — Love Letter -->
      <div v-if="cart.checkoutStep === 3" class="checkout-body letter-step">
        <h2 style="text-align: center; margin-bottom: 8px;">Add a Love Letter 💌</h2>
        <p style="text-align: center; color: #999; font-size: 13px; margin-bottom: 32px;">Make this gift even more special</p>

        <label class="letter-toggle">
          <input v-model="cart.letterData.include" type="checkbox" />
          <span>Yes, include a personalized love letter</span>
        </label>

        <div v-if="cart.letterData.include" class="letter-card">
          <div class="letter-field">
            <label>For</label>
            <input v-model="cart.letterData.recipientName" type="text" placeholder="Their name..." class="letter-input" />
          </div>

          <div class="letter-field">
            <label>Your Message</label>
            <textarea
              v-model="cart.letterData.mainMessage"
              placeholder="Write something from your heart... up to 300 words"
              class="letter-textarea"
              @input="handleMainMessageInput"
            ></textarea>
            <span class="main-message-count" :class="{ warning: mainMessageNearLimit }">
              {{ mainMessageWordCount }}/{{ MAIN_LETTER_WORD_LIMIT }} words
            </span>
          </div>

          <div class="petals-section">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <label style="margin: 0;">6 Petal Messages</label>
              <button class="flower-preview-btn" @click="showPreview = true">👀 Preview</button>
            </div>

            <div class="petals-grid">
              <div v-for="(_, i) in cart.letterData.petalMessages" :key="i" class="petal-field">
                <span class="petal-number">{{ i + 1 }}</span>
                <div class="petal-input-wrap">
                  <input
                    v-model="cart.letterData.petalMessages[i]"
                    :placeholder="`Petal ${i + 1}...`"
                    class="petal-input"
                    :maxlength="PETAL_MESSAGE_CHAR_LIMIT"
                    @input="limitPetalMessage(i)"
                  />
                  <span class="petal-char-count" :class="{ warning: cart.letterData.petalMessages[i].length >= PETAL_MESSAGE_CHAR_LIMIT - 5 }">
                    {{ cart.letterData.petalMessages[i].length }}/{{ PETAL_MESSAGE_CHAR_LIMIT }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button class="letter-experience-preview-btn" @click="openLetterExperiencePreview">
            Preview Full Letter Experience
          </button>

          <div class="letter-field">
            <label>Memories</label>
            <div class="upload-zone" @click="($refs.memoryInput as HTMLInputElement).click()" @dragover.prevent @drop.prevent="handleMemoryDrop">
              <input ref="memoryInput" type="file" accept="image/*" multiple style="display:none" @change="handleMemoryUpload" />
              <div v-if="cart.letterData.memories.length === 0" class="upload-empty">
                <span>📸</span>
                <p>Add up to 3 photos</p>
              </div>
              <div v-else class="memory-grid">
                <div v-for="(mem, idx) in cart.letterData.memories" :key="idx" class="memory-item">
                  <img :src="mem" :alt="`Memory ${idx + 1}`" />
                  <button class="memory-remove" @click.stop="cart.letterData.memories.splice(idx, 1)">✕</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="co-actions">
          <button class="co-btn-outline" @click="cart.checkoutStep = 2">← Back</button>
          <button class="co-btn-primary" @click="continueToPayment" :disabled="cart.isReservingStock">
            {{ cart.isReservingStock ? 'Reserving stock...' : 'Continue →' }}
          </button>
        </div>
        <p v-if="cart.stockReservationError" class="reservation-error">
          {{ cart.stockReservationError }}
        </p>
      </div>

    <!-- Flower Preview Modal -->
    <div v-if="showPreview" class="flower-modal-overlay" @click.self="showPreview = false">
      <div class="flower-modal">
        <button class="flower-modal-close" @click="showPreview = false">✕</button>
        
        <h3 style="text-align: center; margin: 0 0 4px; font-size: 16px; font-family: 'Lora', serif;">Your Flower 🌸</h3>
        <p style="text-align: center; font-size: 12px; color: #B08090; margin: 0 0 16px; font-style: italic; font-family: 'Lora', serif;">Tap a petal to reveal</p>

        <div class="flower-container">
          <svg class="flower-svg-preview" viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="140" cy="60" rx="32" ry="48" fill="#F4C0CE" opacity="0.88"/>
            <ellipse cx="140" cy="60" rx="32" ry="48" fill="#F0B4C4" opacity="0.88" transform="rotate(60 140 140)"/>
            <ellipse cx="140" cy="60" rx="32" ry="48" fill="#F4C0CE" opacity="0.88" transform="rotate(120 140 140)"/>
            <ellipse cx="140" cy="60" rx="32" ry="48" fill="#F0B4C4" opacity="0.88" transform="rotate(180 140 140)"/>
            <ellipse cx="140" cy="60" rx="32" ry="48" fill="#F4C0CE" opacity="0.88" transform="rotate(240 140 140)"/>
            <ellipse cx="140" cy="60" rx="32" ry="48" fill="#F0B4C4" opacity="0.88" transform="rotate(300 140 140)"/>
            <circle cx="140" cy="140" r="30" fill="#FAD4A8"/>
            <circle cx="140" cy="140" r="22" fill="#FFE4B5"/>
          </svg>

          <div class="preview-petal-zone preview-petal-1" @click="togglePreviewPetal(0)">
            <div class="preview-symbol" v-if="!previewRevealed[0]">✦</div>
            <div class="preview-pill" v-else>{{ cart.letterData.petalMessages[0] || '...' }}</div>
          </div>
          <div class="preview-petal-zone preview-petal-2" @click="togglePreviewPetal(1)">
            <div class="preview-symbol" v-if="!previewRevealed[1]">✦</div>
            <div class="preview-pill" v-else>{{ cart.letterData.petalMessages[1] || '...' }}</div>
          </div>
          <div class="preview-petal-zone preview-petal-3" @click="togglePreviewPetal(2)">
            <div class="preview-symbol" v-if="!previewRevealed[2]">✦</div>
            <div class="preview-pill" v-else>{{ cart.letterData.petalMessages[2] || '...' }}</div>
          </div>
          <div class="preview-petal-zone preview-petal-4" @click="togglePreviewPetal(3)">
            <div class="preview-symbol" v-if="!previewRevealed[3]">✦</div>
            <div class="preview-pill" v-else>{{ cart.letterData.petalMessages[3] || '...' }}</div>
          </div>
          <div class="preview-petal-zone preview-petal-5" @click="togglePreviewPetal(4)">
            <div class="preview-symbol" v-if="!previewRevealed[4]">✦</div>
            <div class="preview-pill" v-else>{{ cart.letterData.petalMessages[4] || '...' }}</div>
          </div>
          <div class="preview-petal-zone preview-petal-6" @click="togglePreviewPetal(5)">
            <div class="preview-symbol" v-if="!previewRevealed[5]">✦</div>
            <div class="preview-pill" v-else>{{ cart.letterData.petalMessages[5] || '...' }}</div>
          </div>
        </div>

        <p style="text-align: center; font-size: 11px; color: #C48090; margin-top: 16px; font-family: 'Lora', serif; font-style: italic;">
          This is how your petals will look to the recipient
        </p>
      </div>
    </div>


    <!-- Full Letter Experience Preview Modal -->
    <div
      v-if="showLetterExperiencePreview"
      class="letter-experience-overlay"
      @click.self="showLetterExperiencePreview = false"
    >
      <div class="letter-experience-modal">
        <button class="flower-modal-close" @click="showLetterExperiencePreview = false">x</button>

        <div class="letter-preview-phone">
          <section v-if="letterPreviewScreen === 0" class="letter-preview-screen center">
            <div class="letter-preview-logo">Stack Petals</div>
            <div class="letter-preview-flower-mark">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <ellipse cx="60" cy="28" rx="16" ry="28" fill="#f4c0ce" />
                <ellipse cx="60" cy="28" rx="16" ry="28" fill="#efb3c3" transform="rotate(60 60 60)" />
                <ellipse cx="60" cy="28" rx="16" ry="28" fill="#f4c0ce" transform="rotate(120 60 60)" />
                <ellipse cx="60" cy="28" rx="16" ry="28" fill="#efb3c3" transform="rotate(180 60 60)" />
                <ellipse cx="60" cy="28" rx="16" ry="28" fill="#f4c0ce" transform="rotate(240 60 60)" />
                <ellipse cx="60" cy="28" rx="16" ry="28" fill="#efb3c3" transform="rotate(300 60 60)" />
                <circle cx="60" cy="60" r="16" fill="#fad4a8" />
                <circle cx="60" cy="60" r="10" fill="#ffe4b5" />
              </svg>
            </div>
            <h3>For {{ cart.letterData.recipientName || 'your recipient' }}</h3>
            <p>A little letter experience from {{ cart.customer.name || 'someone special' }}.</p>
            <button class="letter-preview-action" @click="nextLetterPreviewScreen">Open Letter</button>
          </section>

          <section v-else-if="letterPreviewScreen === 1" class="letter-preview-screen">
            <div class="letter-preview-title">
              <span>Petal Messages</span>
              <h3>Tap each petal</h3>
            </div>

            <div class="letter-preview-flower-wrap">
              <svg class="flower-svg-preview" viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="140" cy="60" rx="32" ry="48" fill="#F4C0CE" opacity="0.88"/>
                <ellipse cx="140" cy="60" rx="32" ry="48" fill="#F0B4C4" opacity="0.88" transform="rotate(60 140 140)"/>
                <ellipse cx="140" cy="60" rx="32" ry="48" fill="#F4C0CE" opacity="0.88" transform="rotate(120 140 140)"/>
                <ellipse cx="140" cy="60" rx="32" ry="48" fill="#F0B4C4" opacity="0.88" transform="rotate(180 140 140)"/>
                <ellipse cx="140" cy="60" rx="32" ry="48" fill="#F4C0CE" opacity="0.88" transform="rotate(240 140 140)"/>
                <ellipse cx="140" cy="60" rx="32" ry="48" fill="#F0B4C4" opacity="0.88" transform="rotate(300 140 140)"/>
                <circle cx="140" cy="140" r="30" fill="#FAD4A8"/>
                <circle cx="140" cy="140" r="22" fill="#FFE4B5"/>
              </svg>

              <div
                v-for="(_, i) in cart.letterData.petalMessages"
                :key="i"
                :class="['letter-preview-petal-zone', `letter-preview-petal-${i + 1}`]"
                @click="toggleLetterPreviewPetal(i)"
              >
                <div class="preview-symbol" v-if="!letterPreviewPetals[i]">*</div>
                <div class="preview-pill" v-else>{{ cart.letterData.petalMessages[i] || '...' }}</div>
              </div>
            </div>
          </section>

          <section v-else-if="letterPreviewScreen === 2" class="letter-preview-screen">
            <div class="letter-preview-title">
              <span>Main Letter</span>
              <h3>Message</h3>
            </div>
            <div class="letter-preview-message-box">
              <p>{{ cart.letterData.mainMessage || 'Your full letter message will appear here.' }}</p>
              <p class="letter-preview-sender">- {{ cart.customer.name || 'Your name' }}</p>
            </div>
          </section>

          <section v-else class="letter-preview-screen">
            <div class="letter-preview-title">
              <span>Memories</span>
              <h3>Photos together</h3>
            </div>
            <div v-if="cart.letterData.memories.length" class="letter-preview-memory-grid">
              <img
                v-for="(memory, i) in cart.letterData.memories"
                :key="i"
                :src="memory"
                :alt="`Memory ${i + 1}`"
              />
            </div>
            <div v-else class="letter-preview-empty">
              Add up to 3 memories and they will appear in this final part of the letter.
            </div>
          </section>
        </div>

        <div class="letter-preview-controls">
          <button
            class="co-btn-outline"
            :disabled="letterPreviewScreen === 0"
            @click="prevLetterPreviewScreen"
          >
            Back
          </button>
          <div class="letter-preview-dots" aria-label="Letter preview screens">
            <span
              v-for="screen in 4"
              :key="screen"
              :class="{ active: letterPreviewScreen === screen - 1 }"
              @click="letterPreviewScreen = screen - 1"
            ></span>
          </div>
          <button
            class="co-btn-primary"
            @click="letterPreviewScreen === 3 ? showLetterExperiencePreview = false : nextLetterPreviewScreen()"
          >
            {{ letterPreviewScreen === 3 ? 'Done' : 'Next' }}
          </button>
        </div>
      </div>
    </div>

      <!-- STEP 4 - Payment -->
      <div v-if="cart.checkoutStep === 4" class="checkout-body">
        <h2>Payment</h2>
        <div v-if="cart.hasPreOrderItems" class="checkout-preorder-notice">
          <strong>Pre-order payment</strong>
          <span>These item(s) will be prepared for your selected delivery date. Estimated prep time is {{ cart.preOrderPrepDays }} day{{ cart.preOrderPrepDays === 1 ? '' : 's' }}.</span>
        </div>
        <div v-if="cart.stockReservationExpiresAt" class="reservation-notice">
          <strong>Stock reserved</strong>
          <span>Please finish payment by {{ reservationExpiresAt }} to keep these items reserved.</span>
        </div>
        <div class="payment-total-card">
          <div><span>Subtotal</span><strong>{{ cart.cartSubtotal }}</strong></div>
          <div><span>Shipping</span><strong>₱{{ cart.shippingFee.toFixed(2) }}</strong></div>
          <div><span>Total to pay</span><strong>{{ cart.cartTotal }}</strong></div>
        </div>

        <div class="payment-toggle">
          <button
            :class="['pay-tab', { active: cart.paymentMethod === 'gcash' }]"
            @click="cart.paymentMethod = 'gcash'"
          >💙 GCash</button>
          <button
            :class="['pay-tab', { active: cart.paymentMethod === 'maya' }]"
            @click="cart.paymentMethod = 'maya'"
          >💚 Maya</button>
        </div>

        <div class="qr-container">
          <div class="qr-box" v-if="cart.paymentMethod === 'gcash'">
            <img src="/images/gcash-qr.jpg" alt="GCash QR" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
            <div class="qr-placeholder" style="display:none">
              <span>💙</span>
              <p>GCash QR Code</p>
              <small>Replace with your actual GCash QR<br>(./images/gcash-qr.png)</small>
            </div>
          </div>
          <div class="qr-box" v-if="cart.paymentMethod === 'maya'">
            <img src="/images/maya-qr.jpg" alt="Maya QR" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
            <div class="qr-placeholder" style="display:none">
              <span>💚</span>
              <p>Maya QR Code</p>
              <small>Replace with your actual Maya QR<br>(./images/maya-qr.png)</small>
            </div>
          </div>
          <p class="qr-hint">Scan the QR code using your {{ cart.paymentMethod === 'gcash' ? 'GCash' : 'Maya' }} app, then upload your screenshot below.</p>
        </div>

        <!-- Upload proof -->
        <div
          class="upload-area"
          @click="($refs.proofInput as HTMLInputElement).click()"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <input
            ref="proofInput"
            type="file"
            accept="image/*"
            style="display:none"
            @change="handleProofUpload"
          />
          <div v-if="!cart.paymentProof" class="upload-placeholder">
            <span>📎</span>
            <p>Click or drag your payment screenshot here</p>
          </div>
          <div v-else class="upload-preview">
            <img :src="cart.paymentProofPreview ?? ''" alt="Payment proof" />
            <button class="remove-proof" @click.stop="cart.clearProof()">✕</button>
          </div>
        </div>

        <div class="co-actions">
          <button class="co-btn-outline" @click="backFromPayment" :disabled="cart.isSubmittingOrder">← Back</button>
          <button class="co-btn-primary" @click="submitOrder" :disabled="!cart.paymentProof || cart.isSubmittingOrder">
            {{ cart.isSubmittingOrder ? 'Submitting...' : 'Submit Order →' }}
          </button>
        </div>
      </div>

      <!-- STEP 5 — Confirmation -->
      <p v-if="cart.checkoutStep === 4 && cart.orderSubmitError" class="reservation-error">
        {{ cart.orderSubmitError }}
      </p>

      <div v-if="cart.checkoutStep === 5" class="checkout-body confirmation">
        <div class="confirm-icon">🌸</div>
        <h2>Order Received!</h2>
        <p>Thank you, <strong>{{ cart.customer.name }}</strong>! Your order has been submitted successfully.</p>
        <div class="confirm-details">
          <div><span>Order Reference</span><strong>{{ cart.confirmedOrderReference }}</strong></div>
          <div><span>Order Total</span><strong>{{ cart.confirmedTotal }}</strong></div>
          <div><span>Payment via</span><strong>{{ cart.paymentMethod === 'gcash' ? 'GCash' : 'Maya' }}</strong></div>
          <div v-if="cart.hasPreOrderItems"><span>Order Type</span><strong>Pre-order</strong></div>
          <div><span>Items</span><strong>{{ cart.cartItems.length }} item{{ cart.cartItems.length === 1 ? '' : 's' }}</strong></div>
          <div><span>Delivery to</span><strong>{{ cart.fullDeliveryAddress }}</strong></div>
          <div><span>Shipping area</span><strong>{{ cart.shippingLabel }}</strong></div>
          <div><span>Delivery Date</span><strong>{{ cart.customer.date }}</strong></div>
          <div><span>Confirmation sent to</span><strong>{{ cart.customer.email }}</strong></div>
        </div>
        <p class="confirm-note">We'll review your payment and confirm your order within 24 hours. 🌷</p>
        <div class="receipt-actions">
          <button class="co-btn-primary" @click="downloadReceipt">
            {{ receiptDownloaded ? 'Receipt Downloaded' : 'Download Receipt' }}
          </button>
          <button class="co-btn-outline" @click="copyOrderReference">
            {{ referenceCopied ? 'Copied' : 'Copy Order ID' }}
          </button>
        </div>
        <p class="receipt-reminder">Please save your receipt or copy your order ID before leaving this screen.</p>
        <div class="receipt-secondary-actions">
          <button class="receipt-link-btn" @click="goToReceipt">View Receipt</button>
          <button class="receipt-link-btn" @click="goToTrackOrder">Track Order</button>
          <button class="receipt-link-btn" @click="handleDone">Done</button>
        </div>
      </div>

      <!-- Close button (not shown on confirmation) -->
      <button v-if="cart.checkoutStep < 5" class="checkout-close" :disabled="cart.isSubmittingOrder" @click="cart.closeCheckout()">✕</button>
    </div>
  </div>
</template>
