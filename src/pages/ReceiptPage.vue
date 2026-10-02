<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowLeft as ArrowLeft, PhPrinter as Printer } from '@phosphor-icons/vue'
import OrderReceiptCard from '@/components/OrderReceiptCard.vue'
import {
  formatPhoneDisplay,
  getCachedVerifiedOrder,
  lookupCustomerOrder,
  normalizePhilippinePhone,
  type CustomerOrder,
} from '@/services/orderLookup'

const route = useRoute()
const router = useRouter()
const reference = ref(typeof route.query.ref === 'string' ? route.query.ref : '')
const phone = ref('')
const loading = ref(false)
const error = ref('')
const order = ref<CustomerOrder | null>(null)

onMounted(() => {
  if (!reference.value) return
  const cached = getCachedVerifiedOrder(reference.value)
  if (cached) order.value = cached.order
})

function formatPhoneInput(event: Event) {
  const input = event.target as HTMLInputElement
  phone.value = normalizePhilippinePhone(input.value)
  input.value = formatPhoneDisplay(phone.value)
}

async function findReceipt() {
  error.value = ''
  order.value = null
  if (!reference.value.trim() || !/^09\d{9}$/.test(normalizePhilippinePhone(phone.value))) {
    error.value = 'Enter your order reference and valid 11-digit phone number.'
    return
  }
  loading.value = true
  try {
    const result = await lookupCustomerOrder(reference.value, phone.value)
    if (!result) {
      error.value = 'No receipt matched that order reference and phone number.'
      return
    }
    order.value = result.order
  } catch {
    error.value = 'We could not open that receipt right now. Please try again.'
  } finally {
    loading.value = false
  }
}

function trackOrder() {
  router.push({ name: 'track', query: order.value ? { ref: `SP-${order.value.id}` } : undefined })
}

function printReceipt() {
  window.print()
}
</script>

<template>
  <div class="page-section receipt-page">
    <div class="page-hero receipt-page-hero">
      <h1>Order <span>Receipt</span></h1>
      <p>Your printable Stack Petals proof of order.</p>
    </div>

    <div :class="['receipt-shell', { 'has-receipt': order }]">
      <form v-if="!order" class="track-form" @submit.prevent="findReceipt">
        <div class="track-form-intro">
          <span>Receipt lookup</span>
          <h2>Open your proof of order</h2>
          <p>Verify with the phone number used during checkout.</p>
        </div>
        <label>Order Reference
          <input v-model="reference" type="text" placeholder="SP-..." autocomplete="off" />
        </label>
        <label>Phone Number
          <input :value="formatPhoneDisplay(phone)" type="tel" inputmode="numeric" placeholder="09XX XXX XXXX"
            maxlength="13" @input="formatPhoneInput" />
        </label>
        <p v-if="error" class="field-error">{{ error }}</p>
        <button class="primary track-submit" type="submit" :disabled="loading">
          {{ loading ? 'Loading...' : 'View receipt' }}
        </button>
      </form>

      <OrderReceiptCard v-if="order" :order="order">
        <template #actions>
          <button class="co-btn-primary" type="button" @click="printReceipt"><Printer :size="17" /> Print / Save PDF</button>
          <button class="co-btn-outline" type="button" @click="trackOrder"><ArrowLeft :size="17" /> Track order</button>
        </template>
      </OrderReceiptCard>
    </div>
  </div>
</template>
