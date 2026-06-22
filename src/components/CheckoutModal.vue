<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { ref, computed } from 'vue'

const cart = useCartStore()
const isShaking = ref(false)
const emailError = ref('')

// ── Functions ──────────────────────────────────────
async function submitOrder() {
  await cart.submitOrder()
  cart.checkoutStep = 5
}

function handleProofUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) cart.handleProofUpload(file)
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) cart.handleProofUpload(file)
}

function validateEmail() {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  emailError.value = pattern.test(cart.customer.email) ? '' : 'Please enter a valid email address'
}

function shakeModal() {
  if (isShaking.value) return
  isShaking.value = true
  setTimeout(() => { isShaking.value = false }, 500)
}

// ── Computed ───────────────────────────────────────
const minDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

function handleMemoryUpload(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files) {
    for (let i = 0; i < Math.min(files.length, 3 - cart.letterData.memories.length); i++) {
      const reader = new FileReader()
      reader.onload = (event) => {
        cart.letterData.memories.push(event.target?.result as string)
      }
      reader.readAsDataURL(files[i])
    }
  }
}

function handleMemoryDrop(e: DragEvent) {
  const files = e.dataTransfer?.files
  if (files) {
    for (let i = 0; i < Math.min(files.length, 3 - cart.letterData.memories.length); i++) {
      if (files[i].type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          cart.letterData.memories.push(event.target?.result as string)
        }
        reader.readAsDataURL(files[i])
      }
    }
  }
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
            <span class="co-item-price">{{ item.price }}</span>
          </div>
        </div>
        <div class="co-total">Total: <strong>{{ cart.cartTotal }}</strong></div>
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
            <input v-model="cart.customer.phone" type="tel" placeholder="09XX XXX XXXX" maxlength="11" @input="cart.customer.phone = cart.customer.phone.replace(/\D/g, '')"/>
            <small class="field-error" v-if="cart.customer.phone.length > 0 && cart.customer.phone.length < 11">Phone number must be 11 digits</small>
          </label>
          <label>Delivery Address
            <textarea v-model="cart.customer.address" placeholder="House no., Street, Barangay, City" rows="3"></textarea>
          </label>
          <label>Delivery Date
            <input v-model="cart.customer.date" type="date" :min="minDate" @keydown.prevent/>
          </label>
          <label>Note (optional)
            <textarea v-model="cart.customer.note" placeholder="Any special requests?" rows="2"></textarea>
          </label>
        </div>
        <div class="co-actions">
          <button class="co-btn-outline" @click="cart.checkoutStep = 1">← Back</button>
          <button class="co-btn-primary" @click="cart.checkoutStep = 3" :disabled="!cart.customerValid">
            Continue →
          </button>
        </div>
      </div>

      <!-- STEP 3 — Love Letter -->
      <div v-if="cart.checkoutStep === 3" class="checkout-body">
        <h2>Add a Love Letter 💌</h2>
        <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Optional: Include a personalized love letter with your bouquet</p>
        
        <div class="co-form">
          <label>
            <input v-model="cart.letterData.include" type="checkbox" />
            Include a love letter with this bouquet
          </label>
        </div>

        <div v-if="cart.letterData.include" class="letter-form">
          <label>For (Recipient Name)
            <input v-model="cart.letterData.recipientName" type="text" placeholder="Maria, Mom, My Love..." />
          </label>

          <label>Main Message
            <textarea v-model="cart.letterData.mainMessage" placeholder="Write your heartfelt message..." rows="4"></textarea>
          </label>

          <label>6 Petal Messages (short, one per petal)</label>
          <div v-for="(_, i) in cart.letterData.petalMessages" :key="i" class="petal-input">
            <input v-model="cart.letterData.petalMessages[i]" :placeholder="`Petal ${i + 1}...`" />
          </div>

          <label style="margin-top: 20px;">Memories (Optional - upload up to 3 photos)</label>
          <div class="upload-area" @click="($refs.memoryInput as HTMLInputElement).click()" @dragover.prevent @drop.prevent="handleMemoryDrop">
            <input
              ref="memoryInput"
              type="file"
              accept="image/*"
              multiple
              style="display:none"
              @change="handleMemoryUpload"
            />
            <div v-if="cart.letterData.memories.length === 0" class="upload-placeholder">
              <span>📸</span>
              <p>Click or drag photos here (max 3)</p>
            </div>
            <div v-else class="memory-grid">
              <div v-for="(mem, idx) in cart.letterData.memories" :key="idx" class="memory-preview">
                <img :src="mem" :alt="`Memory ${idx + 1}`" />
                <button class="remove-memory" @click.stop="cart.letterData.memories.splice(idx, 1)">✕</button>
              </div>
            </div>
          </div>
        </div>

        <div class="co-actions">
          <button class="co-btn-outline" @click="cart.checkoutStep = 2">← Back</button>
          <button class="co-btn-primary" @click="cart.checkoutStep = 4">Continue →</button>
        </div>
      </div>

      <!-- STEP 4 — Payment -->
      <div v-if="cart.checkoutStep === 4" class="checkout-body">
        <h2>Payment</h2>
        <p class="co-subtitle">Total to pay: <strong>{{ cart.cartTotal }}</strong></p>

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
          <button class="co-btn-outline" @click="cart.checkoutStep = 3">← Back</button>
          <button class="co-btn-primary" @click="submitOrder" :disabled="!cart.paymentProof">
            Submit Order →
          </button>
        </div>
      </div>

      <!-- STEP 5 — Confirmation -->
      <div v-if="cart.checkoutStep === 5" class="checkout-body confirmation">
        <div class="confirm-icon">🌸</div>
        <h2>Order Received!</h2>
        <p>Thank you, <strong>{{ cart.customer.name }}</strong>! Your order has been submitted successfully.</p>
        <div class="confirm-details">
          <div><span>Order Total</span><strong>{{ cart.confirmedTotal }}</strong></div>
          <div><span>Payment via</span><strong>{{ cart.paymentMethod === 'gcash' ? 'GCash' : 'Maya' }}</strong></div>
          <div><span>Delivery to</span><strong>{{ cart.customer.address }}</strong></div>
          <div><span>Delivery Date</span><strong>{{ cart.customer.date }}</strong></div>
          <div><span>Confirmation sent to</span><strong>{{ cart.customer.email }}</strong></div>
        </div>
        <p class="confirm-note">We'll review your payment and confirm your order within 24 hours. 🌷</p>
        <button class="co-btn-primary" @click="cart.finishCheckout()">Done</button>
      </div>

      <!-- Close button (not shown on confirmation) -->
      <button v-if="cart.checkoutStep < 5" class="checkout-close" @click="cart.closeCheckout()">✕</button>
    </div>
  </div>
</template>