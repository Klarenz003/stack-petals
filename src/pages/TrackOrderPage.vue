<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/supabaseClient'

type TrackedOrder = {
  id: string
  created_at?: string
  customer_name?: string
  email?: string
  phone?: string
  address?: string
  delivery_date?: string
  items?: Array<{ name: string; quantity: number; price: string }>
  total?: string
  payment_method?: string
  status?: string
}

const route = useRoute()
const initialReference = typeof route.query.ref === 'string' ? route.query.ref : ''
const reference = ref(initialReference)
const phone = ref('')
const loading = ref(false)
const error = ref('')
const order = ref<TrackedOrder | null>(null)

const normalizedPhone = computed(() => phone.value.replace(/\D/g, '').slice(0, 11))
const normalizedReference = computed(() =>
  reference.value.trim().replace(/^SP-/i, '').toLowerCase()
)

const statusLabel = computed(() => {
  const status = order.value?.status?.toLowerCase() || 'pending'
  const labels: Record<string, string> = {
    pending: 'Payment under review',
    confirmed: 'Payment confirmed',
    preparing: 'Preparing bouquet',
    ready: 'Ready for delivery',
    out_for_delivery: 'Out for delivery',
    delivered: 'Delivered',
    preorder: 'Moved to pre-order',
    pre_order: 'Moved to pre-order',
    issue: 'Please contact us',
    rejected: 'Payment issue',
  }
  return labels[status] || status.replace(/_/g, ' ')
})

const timeline = computed(() => {
  const status = order.value?.status?.toLowerCase() || 'pending'
  const steps = [
    { key: 'pending', label: 'Order received' },
    { key: 'confirmed', label: 'Payment confirmed' },
    { key: 'preparing', label: 'Preparing bouquet' },
    { key: 'out_for_delivery', label: 'Out for delivery' },
    { key: 'delivered', label: 'Delivered' },
  ]
  const currentIndex = steps.findIndex(step => step.key === status)
  return steps.map((step, index) => ({
    ...step,
    active: currentIndex === -1 ? index === 0 : index <= currentIndex,
  }))
})

function formatPhoneInput(event: Event) {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '').slice(0, 11)
  phone.value = digits
  input.value = formatPhoneDisplay(digits)
}

function formatPhoneDisplay(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 4) return digits
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
}

async function trackOrder() {
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

  if (fetchError) {
    error.value = 'We could not check that order right now. Please try again.'
    return
  }

  if (!data) {
    error.value = 'No order matched that reference and phone number.'
    return
  }

  order.value = data
}
</script>

<template>
  <div class="page-section track-page">
    <div class="page-hero">
      <h1>Track <span>Order</span></h1>
      <p>Use your order reference and phone number to check your bouquet status.</p>
    </div>

    <div class="track-shell">
      <form class="track-form" @submit.prevent="trackOrder">
        <label>Order Reference
          <input v-model="reference" type="text" placeholder="SP-..." autocomplete="off" />
        </label>

        <label>Phone Number
          <input
            :value="formatPhoneDisplay(phone)"
            type="tel"
            inputmode="numeric"
            placeholder="09XX XXX XXXX"
            maxlength="13"
            @input="formatPhoneInput"
          />
        </label>

        <p v-if="error" class="field-error">{{ error }}</p>
        <button class="primary track-submit" type="submit" :disabled="loading">
          {{ loading ? 'Checking...' : 'Check Status' }}
        </button>
      </form>

      <div v-if="order" class="track-result">
        <div class="track-result-header">
          <div>
            <span>Current Status</span>
            <h2>{{ statusLabel }}</h2>
          </div>
          <strong>SP-{{ order.id }}</strong>
        </div>

        <div class="track-timeline">
          <div v-for="step in timeline" :key="step.key" :class="['track-step', { active: step.active }]">
            <span></span>
            <p>{{ step.label }}</p>
          </div>
        </div>

        <div class="track-details">
          <div><span>Name</span><strong>{{ order.customer_name }}</strong></div>
          <div><span>Delivery Date</span><strong>{{ order.delivery_date }}</strong></div>
          <div><span>Delivery Address</span><strong>{{ order.address }}</strong></div>
          <div><span>Total</span><strong>{{ order.total }}</strong></div>
        </div>
      </div>
    </div>
  </div>
</template>
