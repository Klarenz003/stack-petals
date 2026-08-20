<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  delivery_method?: string
}

type StatusHistory = {
  id: string
  status: string
  label: string
  note?: string
  created_at?: string
}

const route = useRoute()
const router = useRouter()
const initialReference = typeof route.query.ref === 'string' ? route.query.ref : ''
const reference = ref(initialReference)
const phone = ref('')
const loading = ref(false)
const error = ref('')
const order = ref<TrackedOrder | null>(null)
const history = ref<StatusHistory[]>([])

const normalizedPhone = computed(() => phone.value.replace(/\D/g, '').slice(0, 11))
const normalizedReference = computed(() =>
  reference.value.trim().replace(/^SP-/i, '').toLowerCase()
)
const normalizedStatus = computed(() => order.value?.status?.toLowerCase() || 'pending')
const isPickupOrder = computed(() => {
  const method = order.value?.delivery_method?.toLowerCase() || ''
  const address = order.value?.address?.toLowerCase() || ''
  return method === 'pickup' || address.includes('pick up') || address.includes('pickup')
})
const timelineStatus = computed(() => {
  const status = normalizedStatus.value
  if (status === 'preorder' || status === 'pre_order') return 'confirmed'
  if (status === 'issue' || status === 'rejected') return 'pending'
  if (isPickupOrder.value && status === 'out_for_delivery') return 'ready'
  return status
})
const needsSupport = computed(() => ['issue', 'rejected'].includes(normalizedStatus.value))

const statusLabel = computed(() => {
  if (isPickupOrder.value) {
    const pickupLabels: Record<string, string> = {
      ready: 'Ready for pickup',
      out_for_delivery: 'Ready for pickup',
      delivered: 'Picked up',
    }

    if (pickupLabels[normalizedStatus.value]) return pickupLabels[normalizedStatus.value]
  }

  const labels: Record<string, string> = {
    pending: 'Payment under review',
    confirmed: 'Payment confirmed',
    preparing: 'Preparing order',
    ready: 'Ready for delivery',
    out_for_delivery: 'Out for delivery',
    delivered: 'Delivered',
    preorder: 'Moved to pre-order',
    pre_order: 'Moved to pre-order',
    issue: 'Please contact us',
    rejected: 'Payment issue',
  }
  return labels[normalizedStatus.value] || normalizedStatus.value.replace(/_/g, ' ')
})

const statusHelpText = computed(() => {
  if (isPickupOrder.value) {
    const pickupMessages: Record<string, string> = {
      ready: 'Your order is ready for pickup at Stack Petals.',
      out_for_delivery: 'Your order is ready for pickup at Stack Petals.',
      delivered: 'Your order has been picked up. Thank you for choosing Stack Petals.',
    }

    if (pickupMessages[normalizedStatus.value]) return pickupMessages[normalizedStatus.value]
  }

  const messages: Record<string, string> = {
    pending: 'We received your order and are reviewing your payment proof.',
    confirmed: 'Your payment has been confirmed. Your order is now in our queue.',
    preparing: 'Your Stack Petals piece is being prepared with care.',
    ready: 'Your order is ready and waiting for the next delivery step.',
    out_for_delivery: 'Your order is on the way. Please keep your phone available.',
    delivered: 'Your order has been delivered. Thank you for choosing Stack Petals.',
    preorder: 'This order is now a pre-order. Please allow the estimated preparation window.',
    pre_order: 'This order is now a pre-order. Please allow the estimated preparation window.',
    issue: 'We need your help to resolve something with this order. Please contact us.',
    rejected: 'There may be an issue with the payment proof. Please contact us for help.',
  }
  return messages[normalizedStatus.value] || 'We will update this page as your order moves forward.'
})

const timeline = computed(() => {
  const steps = isPickupOrder.value ? [
    { key: 'pending', label: 'Order received' },
    { key: 'confirmed', label: 'Payment confirmed' },
    { key: 'preparing', label: 'Preparing order' },
    { key: 'ready', label: 'Ready for pickup' },
    { key: 'delivered', label: 'Picked up' },
  ] : [
    { key: 'pending', label: 'Order received' },
    { key: 'confirmed', label: 'Payment confirmed' },
    { key: 'preparing', label: 'Preparing order' },
    { key: 'ready', label: 'Ready' },
    { key: 'out_for_delivery', label: 'Out for delivery' },
    { key: 'delivered', label: 'Delivered' },
  ]
  const currentIndex = steps.findIndex(step => step.key === timelineStatus.value)
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
  history.value = []

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

  const { data: historyData } = await supabase
    .from('order_status_history')
    .select('*')
    .eq('order_id', data.id)
    .order('created_at', { ascending: true })

  history.value = historyData || []
}

function viewReceipt() {
  if (!order.value) return
  router.push({ path: '/receipt', query: { ref: `SP-${order.value.id}` } })
}
</script>

<template>
  <div class="page-section track-page">
    <div class="page-hero">
      <h1>Track <span>Order</span></h1>
      <p>Check where your handcrafted order is, from payment review to delivery day.</p>
    </div>

    <div class="track-shell">
      <form class="track-form" @submit.prevent="trackOrder">
        <div class="track-form-intro">
          <span>Order Lookup</span>
          <h2>Find your Stack Petals order</h2>
          <p>Use the same phone number you entered during checkout.</p>
        </div>

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
            <p>{{ statusHelpText }}</p>
          </div>
          <strong>SP-{{ order.id }}</strong>
        </div>

        <div class="track-timeline">
          <div v-for="step in timeline" :key="step.key" :class="['track-step', { active: step.active }]">
            <span></span>
            <p>{{ step.label }}</p>
          </div>
        </div>

        <div v-if="history.length" class="track-history">
          <h3>Status Updates</h3>
          <div v-for="item in history" :key="item.id" class="track-history-item">
            <span></span>
            <div>
              <strong>{{ item.label }}</strong>
              <p v-if="item.note">{{ item.note }}</p>
              <small>{{ item.created_at ? new Date(item.created_at).toLocaleString('en-PH') : '' }}</small>
            </div>
          </div>
        </div>

        <div :class="['track-support-card', { alert: needsSupport }]">
          <div>
            <span>{{ needsSupport ? 'Needs attention' : 'Keep your proof safe' }}</span>
            <p>
              {{ needsSupport
                ? 'If your payment proof needs review, contact Stack Petals with your order reference.'
                : 'You can save your receipt anytime and use this page to check future updates.' }}
            </p>
          </div>
          <div class="track-result-actions">
            <button class="co-btn-outline" @click="viewReceipt">View Receipt</button>
            <RouterLink class="co-btn-primary" to="/contact">Contact Us</RouterLink>
          </div>
        </div>

        <div class="track-details">
          <div><span>Name</span><strong>{{ order.customer_name }}</strong></div>
          <div><span>{{ isPickupOrder ? 'Pickup Date' : 'Delivery Date' }}</span><strong>{{ order.delivery_date }}</strong></div>
          <div><span>{{ isPickupOrder ? 'Pickup Location' : 'Delivery Address' }}</span><strong>{{ order.address }}</strong></div>
          <div><span>Payment Method</span><strong>{{ order.payment_method }}</strong></div>
          <div><span>Total</span><strong>{{ order.total }}</strong></div>
        </div>
      </div>
    </div>
  </div>
</template>
