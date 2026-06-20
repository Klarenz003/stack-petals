<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()

async function submitOrder() {
  await cart.submitOrder()
  cart.checkoutStep = 4
}

function handleProofUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) cart.handleProofUpload(file)
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) cart.handleProofUpload(file)
}
</script>

<template>
  <div
    v-if="cart.checkoutStep > 0"
    class="checkout-overlay"
    @click.self="cart.closeCheckout()"
  >
    <div class="checkout-modal">

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
          <span>3</span><small>Payment</small>
        </div>
        <div class="step-line" :class="{ done: cart.checkoutStep > 3 }"></div>
        <div class="step" :class="{ active: cart.checkoutStep >= 4 }">
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
            <input v-model="cart.customer.email" type="email" placeholder="juan@email.com" />
          </label>
          <label>Phone Number
            <input v-model="cart.customer.phone" type="tel" placeholder="+63 9XX XXX XXXX" />
          </label>
          <label>Delivery Address
            <textarea v-model="cart.customer.address" placeholder="House no., Street, Barangay, City" rows="3"></textarea>
          </label>
          <label>Delivery Date
            <input v-model="cart.customer.date" type="date" />
          </label>
          <label>Note (optional)
            <textarea v-model="cart.customer.note" placeholder="Any special requests?" rows="2"></textarea>
          </label>
        </div>
        <div class="co-actions">
          <button class="co-btn-outline" @click="cart.checkoutStep = 1">← Back</button>
          <button class="co-btn-primary" @click="cart.goToPayment()" :disabled="!cart.customerValid">
            Continue →
          </button>
        </div>
      </div>

      <!-- STEP 3 — Payment -->
      <div v-if="cart.checkoutStep === 3" class="checkout-body">
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
          <div v-if="cart.paymentMethod === 'gcash'" class="qr-box">
            <img
              src="/images/gcash-qr.jpg"
              alt="GCash QR"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <div class="qr-placeholder">
              <span>💙</span>
              <p>GCash QR Code</p>
              <small>Replace with your actual GCash QR<br />(public/images/gcash-qr.jpg)</small>
            </div>
          </div>
          <div v-if="cart.paymentMethod === 'maya'" class="qr-box">
            <img
              src="/images/maya-qr.jpg"
              alt="Maya QR"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <div class="qr-placeholder">
              <span>💚</span>
              <p>Maya QR Code</p>
              <small>Replace with your actual Maya QR<br />(public/images/maya-qr.jpg)</small>
            </div>
          </div>
          <p class="qr-hint">
            Scan the QR code using your {{ cart.paymentMethod === 'gcash' ? 'GCash' : 'Maya' }} app,
            then upload your screenshot below.
          </p>
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
          <button class="co-btn-outline" @click="cart.checkoutStep = 2">← Back</button>
          <button class="co-btn-primary" @click="submitOrder" :disabled="!cart.paymentProof">
            Submit Order →
          </button>
        </div>
      </div>

      <!-- STEP 4 — Confirmation -->
      <div v-if="cart.checkoutStep === 4" class="checkout-body confirmation">
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
      <button v-if="cart.checkoutStep < 4" class="checkout-close" @click="cart.closeCheckout()">✕</button>
    </div>
  </div>
</template>
