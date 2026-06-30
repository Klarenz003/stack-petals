<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'

type ReceiptOrder = {
  id: string
  created_at?: string
  customer_name?: string
  email?: string
  phone?: string
  address?: string
  delivery_date?: string
  items?: Array<{ name: string; quantity?: number; price: string; preOrder?: boolean }>
  total?: string
  payment_method?: string
  status?: string
}

const route = useRoute()
const router = useRouter()
const reference = ref(typeof route.query.ref === 'string' ? route.query.ref : '')
const phone = ref('')
const loading = ref(false)
const error = ref('')
const order = ref<ReceiptOrder | null>(null)

const normalizedReference = computed(() => reference.value.trim().replace(/^SP-/i, '').toLowerCase())
const normalizedPhone = computed(() => phone.value.replace(/\D/g, '').slice(0, 11))

function formatPhoneInput(event: Event) {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '').slice(0, 11)
  phone.value = digits
  input.value = digits.length <= 4 ? digits : digits.length <= 7 ? `${digits.slice(0, 4)} ${digits.slice(4)}` : `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
}

async function findReceipt() {
  error.value = ''
  order.value = null

  if (!normalizedReference.value || !/^09\d{9}$/.test(normalizedPhone.value)) {
    error.value = 'Enter your order reference and valid 11-digit phone number.'
    return
  }

  loading.value = true
  const { data, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', normalizedReference.value)
    .eq('phone', normalizedPhone.value)
    .maybeSingle()
  loading.value = false

  if (fetchError || !data) {
    error.value = 'No receipt matched that order reference and phone number.'
    return
  }

  order.value = data
}

function printReceipt() {
  window.print()
}

function trackOrder() {
  router.push({ name: 'track', query: order.value ? { ref: `SP-${order.value.id}` } : undefined })
}
</script>

<template>
  <div class="page-section receipt-page">
    <div class="page-hero">
      <h1>Order <span>Receipt</span></h1>
      <p>View or print your Stack Petals receipt using your order reference and phone number.</p>
    </div>

    <div class="receipt-shell">
      <form class="track-form" @submit.prevent="findReceipt">
        <label>Order Reference
          <input v-model="reference" type="text" placeholder="SP-..." autocomplete="off" />
        </label>
        <label>Phone Number
          <input type="tel" inputmode="numeric" placeholder="09XX XXX XXXX" maxlength="13" @input="formatPhoneInput" />
        </label>
        <p v-if="error" class="field-error">{{ error }}</p>
        <button class="primary track-submit" type="submit" :disabled="loading">
          {{ loading ? 'Loading...' : 'View Receipt' }}
        </button>
      </form>

      <div v-if="order" class="receipt-card">
        <div class="receipt-card-header">
          <div>
            <span>Stack Petals</span>
            <h2>Receipt</h2>
          </div>
          <strong>SP-{{ order.id }}</strong>
        </div>

        <div class="receipt-lines">
          <div><span>Customer</span><strong>{{ order.customer_name }}</strong></div>
          <div><span>Email</span><strong>{{ order.email }}</strong></div>
          <div><span>Phone</span><strong>{{ order.phone }}</strong></div>
          <div><span>Delivery Date</span><strong>{{ order.delivery_date }}</strong></div>
          <div><span>Delivery Address</span><strong>{{ order.address }}</strong></div>
          <div><span>Payment</span><strong>{{ order.payment_method }}</strong></div>
        </div>

        <div class="receipt-items">
          <div v-for="item in order.items || []" :key="item.name">
            <span>{{ item.name }}{{ item.quantity && item.quantity > 1 ? ` x${item.quantity}` : '' }}</span>
            <strong>{{ item.price }}</strong>
          </div>
        </div>

        <div class="receipt-total">
          <span>Total</span>
          <strong>{{ order.total }}</strong>
        </div>

        <div class="receipt-actions">
          <button class="co-btn-primary" @click="printReceipt">Print / Save PDF</button>
          <button class="co-btn-outline" @click="trackOrder">Track Order</button>
        </div>
      </div>
    </div>
  </div>
</template>
