<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { ref, computed, nextTick, watch, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'

const LetterPage = defineAsyncComponent(() => import('@/pages/LetterPage.vue'))

const cart = useCartStore()
const router = useRouter()
const checkoutModal = ref<HTMLElement | null>(null)
const isShaking = ref(false)
const emailError = ref('')
const showLetterExperiencePreview = ref(false)
// Kept for backwards-compatible state restoration when an existing checkout
// session contains the former multi-screen preview data.
const letterPreviewScreen = ref(0)
const letterPreviewPetals = ref([false, false, false, false, false, false])
const activeLetterPreviewPetal = ref<number | null>(null)
const activePetalEditor = ref<number | null>(null)
const draftPetalMessage = ref('')
const draftPetalSvg = ref(0)
const petalSvgOptions = ['Sun', 'Flower', 'Sparkles', 'Heart', 'Smile', 'Care']
// Older recovered checkout sessions predate petal artwork selections.
// Normalize them before any editor action so Save cannot fail on undefined.
if (!Array.isArray(cart.letterData.petalSvgSelections)) {
  cart.letterData.petalSvgSelections = [0, 1, 2, 3, 4, 5]
}
const petalSvgSelections = computed(() => cart.letterData.petalSvgSelections)
const showPetalDiscardPrompt = ref(false)
const cropQueue = ref<File[]>([])
const cropSource = ref('')
const cropZoom = ref(1)
const cropOffset = ref({ x: 0, y: 0 })
const cropDragging = ref(false)
const cropDragStart = ref({ x: 0, y: 0 })
const cropOffsetStart = ref({ x: 0, y: 0 })
const cropViewport = ref<HTMLElement | null>(null)
const cropImage = ref<HTMLImageElement | null>(null)
const addressStatus = ref('Type the full delivery address so we can estimate the shipping area.')
const receiptDownloaded = ref(false)
const referenceCopied = ref(false)
const showPickupAddress = ref(false)
const MAIN_LETTER_WORD_LIMIT = 300
const PETAL_MESSAGE_CHAR_LIMIT = 60
const PICKUP_ADDRESS = 'Evasco Family, Santa Ana, Taytay Rizal'
const petalPrompts = [
  { title: 'Their smile', placeholder: 'What makes their smile special?' },
  { title: 'Their kindness', placeholder: 'A small kindness you always remember...' },
  { title: 'Your favorite memory', placeholder: 'A short memory you share...' },
  { title: 'What you admire', placeholder: 'Something you admire about them...' },
  { title: 'How they make you feel', placeholder: 'The feeling they bring into your life...' },
  { title: 'A wish for them', placeholder: 'A short wish or reminder for them...' },
]

const checkoutPreviewLetter = computed(() => ({
  letter_theme: cart.letterData.theme,
  recipient: cart.letterData.recipientName || 'your recipient',
  sender: cart.letterData.fromName?.trim() || cart.customer.name || 'someone special',
  message: cart.letterData.mainMessage || 'A personal letter is waiting to be revealed.',
  petal_messages: cart.letterData.petalMessages,
  memories: cart.letterData.memories,
  has_360_view: cart.cartItems.some(item => Boolean(item.has360Viewer)),
  petal_artworks: cart.letterData.petalSvgSelections,
}))

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

// Keep the original file as the crop source. Compression belongs to the
// saved crop, not to the preview: otherwise the cropper can display a
// resampled/letterboxed version instead of the photo the customer selected.
async function rawFileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = event => resolve(String(event.target?.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
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

function handleAddressInput() {
  cart.refreshShippingEstimate()
  if (cart.customer.deliveryMethod === 'pickup') {
    addressStatus.value = 'Pick up selected. No shipping fee will be added.'
    return
  }
  const address = cart.shippingEstimateAddress.trim()
  addressStatus.value = address.length >= 8
    ? 'Shipping is estimated from the barangay, city/municipality, and province fields.'
    : 'Fill in barangay, city/municipality, and province so we can estimate the shipping area.'
}

function handleDeliveryMethodChange(method: 'delivery' | 'pickup') {
  cart.setDeliveryMethod(method)
  showPickupAddress.value = false
  addressStatus.value = method === 'pickup'
    ? 'Pick up selected. No shipping fee will be added.'
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
    `Method: ${cart.customer.deliveryMethod === 'pickup' ? 'Pick up' : 'Delivery'}`,
    `Date: ${cart.customer.date}`,
    `Address: ${cart.customer.deliveryMethod === 'pickup' ? 'Pick up at Stack Petals' : cart.fullDeliveryAddress}`,
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

const pickupGoogleMapsUrl = computed(() =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(PICKUP_ADDRESS)}`
)

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
  if (files) await queueMemoryFiles(Array.from(files))
  ;(e.target as HTMLInputElement).value = ''
}

async function handleMemoryDrop(e: DragEvent) {
  const files = e.dataTransfer?.files
  if (files) await queueMemoryFiles(Array.from(files).filter(file => file.type.startsWith('image/')))
}

async function queueMemoryFiles(files: File[]) {
  const remaining = Math.max(0, 3 - cart.letterData.memories.length)
  cropQueue.value = files.filter(file => file.type.startsWith('image/')).slice(0, remaining)
  await openNextCrop()
}

async function openNextCrop() {
  const next = cropQueue.value.shift()
  if (!next) {
    cropSource.value = ''
    return
  }
  cropZoom.value = 1
  cropOffset.value = { x: 0, y: 0 }
  cropSource.value = await rawFileToDataUrl(next)
}

function startCropDrag(event: PointerEvent) {
  cropDragging.value = true
  cropDragStart.value = { x: event.clientX, y: event.clientY }
  cropOffsetStart.value = { ...cropOffset.value }
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
}

function moveCropDrag(event: PointerEvent) {
  if (!cropDragging.value) return
  const viewport = cropViewport.value
  const image = cropImage.value
  const imageWidth = image?.naturalWidth || 0
  const imageHeight = image?.naturalHeight || 0
  const viewportWidth = viewport?.clientWidth || 0
  const viewportHeight = viewport?.clientHeight || 0
  const imageRatio = imageHeight ? imageWidth / imageHeight : 1
  const viewportRatio = viewportHeight ? viewportWidth / viewportHeight : 1
  const baseWidth = imageRatio > viewportRatio ? viewportHeight * imageRatio : viewportWidth
  const baseHeight = imageRatio > viewportRatio ? viewportHeight : viewportWidth / imageRatio
  const maxX = Math.max(0, (baseWidth * cropZoom.value - viewportWidth) / 2)
  const maxY = Math.max(0, (baseHeight * cropZoom.value - viewportHeight) / 2)
  cropOffset.value = {
    x: Math.max(-maxX, Math.min(maxX, cropOffsetStart.value.x + event.clientX - cropDragStart.value.x)),
    y: Math.max(-maxY, Math.min(maxY, cropOffsetStart.value.y + event.clientY - cropDragStart.value.y)),
  }
}

function endCropDrag() { cropDragging.value = false }

function clampCropOffset() {
  const viewport = cropViewport.value
  const image = cropImage.value
  if (!viewport || !image?.naturalWidth || !image.naturalHeight) return
  const viewportWidth = viewport.clientWidth
  const viewportHeight = viewport.clientHeight
  const imageRatio = image.naturalWidth / image.naturalHeight
  const viewportRatio = viewportWidth / viewportHeight
  const baseWidth = imageRatio > viewportRatio ? viewportHeight * imageRatio : viewportWidth
  const baseHeight = imageRatio > viewportRatio ? viewportHeight : viewportWidth / imageRatio
  const maxX = Math.max(0, (baseWidth * cropZoom.value - viewportWidth) / 2)
  const maxY = Math.max(0, (baseHeight * cropZoom.value - viewportHeight) / 2)
  cropOffset.value = {
    x: Math.max(-maxX, Math.min(maxX, cropOffset.value.x)),
    y: Math.max(-maxY, Math.min(maxY, cropOffset.value.y)),
  }
}

async function saveCrop() {
  if (!cropSource.value) return
  const image = new Image()
  image.src = cropSource.value
  await new Promise<void>(resolve => { image.onload = () => resolve(); image.onerror = () => resolve() })
  if (!image.naturalWidth || !image.naturalHeight) return openNextCrop()

  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 600
  const context = canvas.getContext('2d')
  if (!context) return openNextCrop()
  const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) * cropZoom.value
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  // Dragging happens in CSS pixels while the saved crop is rendered at a
  // fixed resolution. Convert the same movement into canvas pixels so the
  // saved image exactly matches what the customer positioned in the frame.
  const viewportWidth = cropViewport.value?.clientWidth || canvas.width
  const viewportHeight = cropViewport.value?.clientHeight || canvas.height
  const offsetX = cropOffset.value.x * (canvas.width / viewportWidth)
  const offsetY = cropOffset.value.y * (canvas.height / viewportHeight)
  context.fillStyle = '#fffaf8'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, (canvas.width - width) / 2 + offsetX, (canvas.height - height) / 2 + offsetY, width, height)
  cart.letterData.memories.push(canvas.toDataURL('image/jpeg', 0.86))
  await openNextCrop()
}

function openLetterExperiencePreview() {
  letterPreviewScreen.value = 0
  letterPreviewPetals.value = [false, false, false, false, false, false]
  activeLetterPreviewPetal.value = null
  showLetterExperiencePreview.value = true
}

function nextLetterPreviewScreen() { if (letterPreviewScreen.value < 3) letterPreviewScreen.value++ }
function prevLetterPreviewScreen() { if (letterPreviewScreen.value > 0) letterPreviewScreen.value-- }
function toggleLetterPreviewPetal(index: number) {
  letterPreviewPetals.value[index] = true
  activeLetterPreviewPetal.value = index
}
function openPetalEditor(index: number) {
  activePetalEditor.value = index
  draftPetalMessage.value = cart.letterData.petalMessages[index] || ''
  draftPetalSvg.value = petalSvgSelections.value[index] ?? index
  showPetalDiscardPrompt.value = false
}
function savePetalMessage() {
  if (activePetalEditor.value === null) return
  cart.letterData.petalMessages[activePetalEditor.value] = draftPetalMessage.value.slice(0, PETAL_MESSAGE_CHAR_LIMIT)
  petalSvgSelections.value[activePetalEditor.value] = draftPetalSvg.value
  activePetalEditor.value = null
  showPetalDiscardPrompt.value = false
}
function requestPetalDiscard() {
  if (activePetalEditor.value === null || draftPetalMessage.value === cart.letterData.petalMessages[activePetalEditor.value]) {
    activePetalEditor.value = null
    showPetalDiscardPrompt.value = false
    return
  }
  showPetalDiscardPrompt.value = true
}
function confirmPetalDiscard() {
  activePetalEditor.value = null
  showPetalDiscardPrompt.value = false
}
const activeLetterPreviewPetalMessage = computed(() => activeLetterPreviewPetal.value === null
  ? ''
  : cart.letterData.petalMessages[activeLetterPreviewPetal.value] || 'Your petal message will appear here.')

watch(
  () => cart.checkoutStep,
  async () => {
    await nextTick()
    checkoutModal.value?.scrollTo({ top: 0, behavior: 'auto' })
  },
)

</script>

<template>
  <div
    v-if="cart.checkoutStep > 0"
    class="checkout-overlay"
    @click.self="shakeModal"
  >
    <div ref="checkoutModal" class="checkout-modal" :class="{ shake: isShaking }">

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
          <span>5</span><small>Done</small>
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
          <div><span>Shipping</span><strong>{{ cart.customer.deliveryMethod === 'pickup' ? 'Free pick up' : (cart.shippingFee ? `₱${cart.shippingFee.toFixed(2)}` : 'Add address') }}</strong></div>
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
          <div class="full-field fulfillment-method">
            <span class="method-label">Receiving Method</span>
            <div class="method-options">
              <button
                type="button"
                :class="['method-option', { active: cart.customer.deliveryMethod === 'delivery' }]"
                @click="handleDeliveryMethodChange('delivery')"
              >
                <strong>Delivery</strong>
                <small>Shipping fee applies based on location.</small>
              </button>
              <button
                type="button"
                :class="['method-option', { active: cart.customer.deliveryMethod === 'pickup' }]"
                @click="handleDeliveryMethodChange('pickup')"
              >
                <strong>Pick up</strong>
                <small>No shipping fee will be added.</small>
              </button>
            </div>
          </div>
          <div v-if="cart.customer.deliveryMethod === 'delivery'" class="full-field delivery-fields">
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
          </div>
          <div class="address-detect-card">
            <p class="map-status">{{ addressStatus }}</p>
            <p v-if="cart.customer.deliveryMethod === 'pickup'" class="address-preview">
              Pick up at Stack Petals. We will contact you when your order is ready.
            </p>
            <div v-if="cart.customer.deliveryMethod === 'pickup'" class="pickup-location">
              <button type="button" class="pickup-address-toggle" @click="showPickupAddress = !showPickupAddress">
                {{ showPickupAddress ? 'Hide Stack Petals address' : 'View Stack Petals address' }}
              </button>
              <div v-if="showPickupAddress" class="pickup-address-panel">
                <span>Google Map</span>
                <strong>{{ PICKUP_ADDRESS }}</strong>
                <a :href="pickupGoogleMapsUrl" target="_blank" rel="noopener noreferrer">
                  Open in Google Maps
                </a>
              </div>
            </div>
            <p v-else-if="cart.fullDeliveryAddress" class="address-preview">
              {{ cart.fullDeliveryAddress }}
            </p>
            <div class="shipping-estimate">
              <span>{{ cart.shippingLabel }}</span>
              <strong>{{ cart.customer.deliveryMethod === 'pickup' ? 'Free' : (cart.shippingFee ? `₱${cart.shippingFee.toFixed(2)}` : 'Pending') }}</strong>
            </div>
            <a v-if="cart.customer.deliveryMethod === 'delivery'" class="map-adjust-btn" :href="googleMapsSearchUrl" target="_blank" rel="noopener noreferrer">
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

        <div v-if="cart.letterData.include" class="letter-theme-picker">
          <span class="petals-section-title">Choose your letter style</span>
          <div class="letter-theme-options">
            <button v-for="option in [
              { id: 'romance', label: 'Romance' },
              { id: 'family', label: 'Family' },
              { id: 'birthday', label: 'Birthday' },
              { id: 'sympathy', label: 'Sympathy' },
              { id: 'friendship', label: 'Friendship' },
              { id: 'graduation', label: 'Graduation' },
              { id: 'original', label: 'Original' },
            ]" :key="option.id" type="button" :class="['letter-theme-option', { active: cart.letterData.theme === option.id }]" @click="cart.letterData.theme = option.id">
              {{ option.label }}
            </button>
          </div>
        </div>

        <div v-if="cart.letterData.include" class="letter-card">
          <div class="letter-field">
            <label for="checkout-letter-from">From</label>
            <input
              id="checkout-letter-from"
              v-model="cart.letterData.fromName"
              type="text"
              maxlength="120"
              placeholder="Your name..."
              class="letter-input"
            />
          </div>

          <div class="letter-field">
            <label for="checkout-letter-to">To</label>
            <input
              id="checkout-letter-to"
              v-model="cart.letterData.recipientName"
              type="text"
              maxlength="120"
              placeholder="Recipient's name..."
              class="letter-input"
            />
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

          <div class="letter-field song-suggestion-field">
            <label for="checkout-song-suggestion">Song Suggestion <span>Optional</span></label>
            <input
              id="checkout-song-suggestion"
              v-model="cart.letterData.songSuggestion"
              type="text"
              maxlength="150"
              placeholder="Song title and artist, or a Spotify/YouTube link"
              class="letter-input"
            />
            <small>Suggest the background song you would like for the letter experience. Final availability will be confirmed by Stack Petals.</small>
          </div>

          <div class="petals-section">
            <label class="petals-section-title">6 Petal Messages</label>

            <div class="petals-grid">
              <div v-for="(prompt, i) in petalPrompts" :key="prompt.title" class="petal-field">
                <span class="petal-number">{{ i + 1 }}</span>
                <div class="petal-input-wrap">
                  <label class="petal-prompt" :for="`petal-message-${i}`">{{ prompt.title }}</label>
                  <button
                    :id="`petal-message-${i}`"
                    type="button"
                    class="petal-input-trigger"
                    :class="{ 'has-message': cart.letterData.petalMessages[i] }"
                    @click.stop="openPetalEditor(i)"
                  >
                    {{ cart.letterData.petalMessages[i] || prompt.placeholder }}
                  </button>
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

    <!-- Full Letter Experience Preview Modal -->
    <div
      v-if="showLetterExperiencePreview"
      class="letter-experience-overlay"
      @click.self="showLetterExperiencePreview = false"
    >
      <div class="letter-experience-modal">
        <button
          class="flower-modal-close letter-experience-close"
          type="button"
          aria-label="Close letter preview"
          @click="showLetterExperiencePreview = false"
        >
          &times;
        </button>

        <div class="checkout-letter-full-preview">
          <LetterPage
            :preview-letter="checkoutPreviewLetter"
            :preview="true"
          />
        </div>

        <!-- The former multi-screen preview remains available in source for
             migration safety, but checkout intentionally shows only a teaser. -->
        <template v-if="false">
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
                :class="[
                  'letter-preview-petal-zone',
                  `letter-preview-petal-${i + 1}`,
                  { revealed: letterPreviewPetals[i], active: activeLetterPreviewPetal === i },
                ]"
                @click="toggleLetterPreviewPetal(i)"
              >
                <div class="preview-symbol">&#9829;</div>
              </div>
            </div>

            <div class="letter-preview-petal-message" aria-live="polite">
              <Transition name="checkout-petal-message" mode="out-in">
                <p
                  v-if="activeLetterPreviewPetalMessage"
                  :key="activeLetterPreviewPetal ?? 'petal-message'"
                >
                  <span aria-hidden="true">&#9829;</span>
                  {{ activeLetterPreviewPetalMessage }}
                </p>
                <p v-else class="is-placeholder">Select a petal to reveal its message</p>
              </Transition>
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
        </template>
      </div>
    </div>

    <div v-if="cropSource" class="memory-crop-overlay">
      <section class="memory-crop-modal" role="dialog" aria-modal="true" aria-labelledby="memory-crop-title">
        <button class="petal-editor-close" type="button" aria-label="Cancel photo crop" @click="cropQueue = []; cropSource = ''">&times;</button>
        <span class="petals-section-title">Photo memory</span>
        <h3 id="memory-crop-title">Crop this photo</h3>
        <p class="petal-editor-help">Drag the image to choose what appears in your letter.</p>
        <div
          ref="cropViewport"
          class="memory-crop-viewport"
          @pointerdown="startCropDrag"
          @pointermove="moveCropDrag"
          @pointerup="endCropDrag"
          @pointercancel="endCropDrag"
          @pointerleave="endCropDrag"
        >
          <img
            ref="cropImage"
            :src="cropSource"
            alt="Photo crop preview"
            :style="{
              left: `calc(50% + ${cropOffset.x}px)`,
              top: `calc(50% + ${cropOffset.y}px)`,
              transform: 'translate(-50%, -50%) scale(' + cropZoom + ')'
            }"
            draggable="false"
          />
          <span class="memory-crop-guide" aria-hidden="true"></span>
        </div>
        <label class="memory-crop-zoom">Zoom
          <input v-model.number="cropZoom" type="range" min="1" max="2.5" step="0.01" @input="clampCropOffset" />
        </label>
        <div class="petal-editor-footer">
          <span>{{ cropQueue.length ? `${cropQueue.length} more photo${cropQueue.length === 1 ? '' : 's'}` : 'Ready to add' }}</span>
          <button class="co-btn-primary" type="button" @click="saveCrop">Use this crop</button>
        </div>
      </section>
    </div>

    <div v-if="activePetalEditor !== null" class="petal-editor-overlay" @click.self="requestPetalDiscard">
      <section class="petal-editor-modal" role="dialog" aria-modal="true" aria-labelledby="petal-editor-title">
        <button class="petal-editor-close" type="button" aria-label="Close petal editor" @click="requestPetalDiscard">&times;</button>
        <span class="petals-section-title">Petal {{ activePetalEditor + 1 }}</span>
        <h3 id="petal-editor-title">{{ petalPrompts[activePetalEditor].title }}</h3>
        <p class="petal-editor-help">Write one short description about this person.</p>
        <div class="petal-svg-picker">
          <span class="petal-svg-picker__label">Choose the note artwork</span>
          <div class="petal-svg-options">
            <button
              v-for="(name, iconIndex) in petalSvgOptions"
              :key="name"
              type="button"
              class="petal-svg-option"
              :class="{ active: draftPetalSvg === iconIndex }"
              :aria-label="`Use ${name} artwork`"
              @click="draftPetalSvg = iconIndex"
            >
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <template v-if="iconIndex === 0">
                  <circle cx="50" cy="50" r="16" fill="none"/><path d="M50 7v22M50 71v22M7 50h22m42 0h22M20 20l16 16m28 28 16 16M80 20 64 36M36 64 20 80"/>
                </template>
                <template v-else-if="iconIndex === 1"><path d="M50 88V48m0 12C29 59 19 45 21 29c17 0 27 10 29 31Zm0-13c20 0 30-11 29-26-17 0-27 10-29 26Z"/><path d="M50 48c-8-15-4-26 0-34 7 11 8 22 0 34Z"/></template>
                <template v-else-if="iconIndex === 2"><path d="M50 8v28M50 64v28M8 50h28M64 50h28M20 20l20 20m20 20 20 20M80 20 60 40M40 60 20 80"/><path d="M50 31c2 15 9 22 24 24-15 2-22 9-24 24-2-15-9-22-24-24 15-2 22-9 24-24Z"/></template>
                <template v-else-if="iconIndex === 3"><path d="M50 82C25 64 14 50 14 35c0-22 26-29 36-10 10-19 36-12 36 10 0 15-11 29-36 47Z"/></template>
                <template v-else-if="iconIndex === 4"><circle cx="50" cy="50" r="25" fill="none"/><path d="M39 46h1m20 0h1M40 61q10 9 20 0M24 25l-8-8m60 8 8-8M24 75l-8 8m60-8 8 8"/></template>
                <template v-else><path d="M14 55c10-14 20-15 36-3 16-12 26-11 36 3L65 78H35L14 55Z"/><path d="M50 52 38 66m12-14 12 14M18 28l6 5m58-5-6 5"/></template>
              </svg>
              <small>{{ name }}</small>
            </button>
          </div>
        </div>
        <textarea
          v-model="draftPetalMessage"
          class="petal-editor-textarea"
          :maxlength="PETAL_MESSAGE_CHAR_LIMIT"
          :placeholder="petalPrompts[activePetalEditor].placeholder"
          autofocus
        ></textarea>
        <div class="petal-editor-footer">
          <span>{{ draftPetalMessage.length }}/{{ PETAL_MESSAGE_CHAR_LIMIT }}</span>
          <button class="co-btn-primary" type="button" @click="savePetalMessage">Save</button>
        </div>
      </section>
    </div>

    <div v-if="showPetalDiscardPrompt" class="petal-discard-overlay" role="alertdialog" aria-modal="true" aria-labelledby="petal-discard-title">
      <section class="petal-discard-modal">
        <h3 id="petal-discard-title">Discard this message?</h3>
        <p>Are you sure you want to discard your changes?</p>
        <div class="petal-discard-actions">
          <button class="co-btn-outline" type="button" @click="showPetalDiscardPrompt = false">Keep editing</button>
          <button class="co-btn-primary" type="button" @click="confirmPetalDiscard">Discard</button>
        </div>
      </section>
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
          <div><span>Shipping</span><strong>{{ cart.customer.deliveryMethod === 'pickup' ? 'Free pick up' : `₱${cart.shippingFee.toFixed(2)}` }}</strong></div>
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
          <button
            class="co-btn-primary order-submit-button"
            :class="{ 'is-animating': cart.isSubmittingOrder }"
            @click="submitOrder"
            :disabled="!cart.paymentProof || cart.isSubmittingOrder"
          >
            <span class="order-submit-text">Complete Order →</span>
            <span class="order-submit-loader" aria-hidden="true">
              <span class="submit-road-line submit-line-a"></span>
              <span class="submit-road-line submit-line-b"></span>
              <span class="submit-box"></span>
              <span class="submit-truck">
                <span class="submit-door submit-door-top"></span>
                <span class="submit-door submit-door-bottom"></span>
                <span class="submit-cargo"></span>
                <span class="submit-cab"></span>
                <span class="submit-window"></span>
              </span>
            </span>
          </button>
        </div>
      </div>

      <!-- STEP 5 — Confirmation -->
      <p v-if="cart.checkoutStep === 4 && cart.orderSubmitError" class="reservation-error">
        {{ cart.orderSubmitError }}
      </p>

      <div v-if="cart.checkoutStep === 5" class="checkout-body confirmation">
        <div class="order-confirm-animation" aria-label="Order placed animation">
          <div class="order-confirm-scene">
            <div class="order-confirm-road">
              <span class="road-line line-a"></span>
              <span class="road-line line-b"></span>
              <span class="road-line line-c"></span>
              <span class="order-box"></span>
              <div class="order-truck">
                <span class="truck-door door-top"></span>
                <span class="truck-door door-bottom"></span>
                <span class="truck-cargo"></span>
                <span class="truck-cab"></span>
                <span class="truck-window"></span>
                <span class="truck-wheel wheel-front"></span>
                <span class="truck-wheel wheel-back"></span>
              </div>
            </div>
          </div>
          <p class="order-placed-label">Order Placed</p>
        </div>
        <h2>Order Received!</h2>
        <p>Thank you, <strong>{{ cart.customer.name }}</strong>! Your order has been submitted successfully.</p>
        <div class="confirm-reference-card">
          <span>Your order reference</span>
          <strong>{{ cart.confirmedOrderReference }}</strong>
          <button type="button" @click="copyOrderReference">
            {{ referenceCopied ? 'Copied' : 'Copy ID' }}
          </button>
        </div>
        <div class="confirm-details">
          <div><span>Order Total</span><strong>{{ cart.confirmedTotal }}</strong></div>
          <div><span>Payment via</span><strong>{{ cart.paymentMethod === 'gcash' ? 'GCash' : 'Maya' }}</strong></div>
          <div v-if="cart.hasPreOrderItems"><span>Order Type</span><strong>Pre-order</strong></div>
          <div><span>Items</span><strong>{{ cart.cartItems.length }} item{{ cart.cartItems.length === 1 ? '' : 's' }}</strong></div>
          <div><span>Method</span><strong>{{ cart.customer.deliveryMethod === 'pickup' ? 'Pick up' : 'Delivery' }}</strong></div>
          <div><span>{{ cart.customer.deliveryMethod === 'pickup' ? 'Pick up' : 'Delivery to' }}</span><strong>{{ cart.customer.deliveryMethod === 'pickup' ? 'Stack Petals' : cart.fullDeliveryAddress }}</strong></div>
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
