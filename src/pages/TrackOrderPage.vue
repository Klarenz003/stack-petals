<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown, ChevronUp, ExternalLink, Printer } from 'lucide-vue-next'
import OrderReceiptCard from '@/components/OrderReceiptCard.vue'
import {
  formatPhoneDisplay,
  lookupCustomerOrder,
  normalizeOrderReference,
  normalizePhilippinePhone,
  type CustomerOrder,
  type CustomerOrderHistory,
} from '@/services/orderLookup'

const route = useRoute()
const router = useRouter()
const reference = ref(typeof route.query.ref === 'string' ? route.query.ref : '')
const phone = ref('')
const loading = ref(false)
const error = ref('')
const order = ref<CustomerOrder | null>(null)
const history = ref<CustomerOrderHistory[]>([])
const historyOpen = ref(false)
const receiptOpen = ref(false)

const normalizedPhone = computed(() => normalizePhilippinePhone(phone.value))
const normalizedReference = computed(() => normalizeOrderReference(reference.value))
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
const visibleHistory = computed(() => historyOpen.value ? history.value : history.value.slice(-2))
const lastUpdated = computed(() => {
  const date = history.value[history.value.length - 1]?.created_at || order.value?.created_at
  return date ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : ''
})

const statusLabel = computed(() => {
  if (isPickupOrder.value) {
    const pickupLabels: Record<string, string> = {
      ready: 'Ready for pickup', out_for_delivery: 'Ready for pickup', delivered: 'Picked up',
    }
    if (pickupLabels[normalizedStatus.value]) return pickupLabels[normalizedStatus.value]
  }
  const labels: Record<string, string> = {
    pending: 'Payment under review', confirmed: 'Payment confirmed', preparing: 'Preparing order',
    ready: 'Ready for delivery', out_for_delivery: 'Out for delivery', delivered: 'Delivered',
    preorder: 'Moved to pre-order', pre_order: 'Moved to pre-order', issue: 'Please contact us',
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
    { key: 'pending', label: 'Order received' }, { key: 'confirmed', label: 'Payment confirmed' },
    { key: 'preparing', label: 'Preparing order' }, { key: 'ready', label: 'Ready for pickup' },
    { key: 'delivered', label: 'Picked up' },
  ] : [
    { key: 'pending', label: 'Order received' }, { key: 'confirmed', label: 'Payment confirmed' },
    { key: 'preparing', label: 'Preparing order' }, { key: 'ready', label: 'Ready' },
    { key: 'out_for_delivery', label: 'Out for delivery' }, { key: 'delivered', label: 'Delivered' },
  ]
  const foundIndex = steps.findIndex(step => step.key === timelineStatus.value)
  const currentIndex = foundIndex === -1 ? 0 : foundIndex
  return steps.map((step, index) => ({
    ...step,
    complete: index <= currentIndex,
    current: index === currentIndex,
    mobileVisible: index === currentIndex || index === Math.min(currentIndex + 1, steps.length - 1),
  }))
})

function formatPhoneInput(event: Event) {
  const input = event.target as HTMLInputElement
  phone.value = normalizePhilippinePhone(input.value)
  input.value = formatPhoneDisplay(phone.value)
}

async function trackOrder() {
  error.value = ''
  order.value = null
  history.value = []
  historyOpen.value = false
  receiptOpen.value = false
  if (!normalizedReference.value || !/^09\d{9}$/.test(normalizedPhone.value)) {
    error.value = 'Enter your order reference and valid 11-digit phone number.'
    return
  }
  loading.value = true
  try {
    const result = await lookupCustomerOrder(reference.value, phone.value)
    if (!result) {
      error.value = 'No order matched that reference and phone number.'
      return
    }
    order.value = result.order
    history.value = result.history
  } catch {
    error.value = 'We could not check that order right now. Please try again.'
  } finally {
    loading.value = false
  }
}

function printReceipt() { window.print() }
function openPrintView() {
  if (order.value) router.push({ path: '/receipt', query: { ref: `SP-${order.value.id}` } })
}
</script>

<template>
  <div class="page-section track-page">
    <div class="page-hero">
      <h1>Track <span>Order</span></h1>
      <p>Check your handcrafted order from payment review to pickup or delivery.</p>
    </div>

    <div class="track-shell">
      <form class="track-form" @submit.prevent="trackOrder">
        <div class="track-form-intro">
          <span>Order lookup</span>
          <h2>Find your Stack Petals order</h2>
          <p>Use the same phone number you entered during checkout.</p>
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
          {{ loading ? 'Checking...' : 'Check status' }}
        </button>
      </form>

      <div v-if="order" class="track-result">
        <div class="track-result-header">
          <div>
            <span>Current status</span>
            <h2>{{ statusLabel }}</h2>
            <p>{{ statusHelpText }}</p>
            <small v-if="lastUpdated">Updated {{ lastUpdated }}</small>
          </div>
          <strong>SP-{{ order.id }}</strong>
        </div>

        <div class="track-timeline" :aria-label="`Current order status: ${statusLabel}`">
          <div v-for="step in timeline" :key="step.key"
            :class="['track-step', { active: step.complete, current: step.current, 'mobile-visible': step.mobileVisible }]">
            <span></span><p>{{ step.label }}</p>
          </div>
        </div>

        <section v-if="history.length" class="track-history">
          <div class="track-section-heading">
            <h3>Status updates</h3>
            <button v-if="history.length > 2" type="button" @click="historyOpen = !historyOpen">
              {{ historyOpen ? 'Show latest' : `View all ${history.length}` }}
              <ChevronUp v-if="historyOpen" :size="15" aria-hidden="true" />
              <ChevronDown v-else :size="15" aria-hidden="true" />
            </button>
          </div>
          <div v-for="item in visibleHistory" :key="item.id" class="track-history-item">
            <span></span>
            <div><strong>{{ item.label }}</strong><p v-if="item.note">{{ item.note }}</p>
              <small>{{ item.created_at ? new Date(item.created_at).toLocaleString('en-PH') : '' }}</small></div>
          </div>
        </section>

        <div :class="['track-support-card', { alert: needsSupport }]">
          <div><span>{{ needsSupport ? 'Needs attention' : 'Keep your proof safe' }}</span>
            <p>{{ needsSupport ? 'Contact Stack Petals with your order reference so we can help.'
              : 'Open or save your receipt here. You will not need to enter your details again.' }}</p></div>
          <div class="track-result-actions">
            <button class="co-btn-outline" type="button" @click="receiptOpen = !receiptOpen">
              {{ receiptOpen ? 'Hide receipt' : 'View receipt' }}
            </button>
            <RouterLink class="co-btn-primary" to="/contact">Contact us</RouterLink>
          </div>
        </div>

        <Transition name="receipt-reveal">
          <div v-if="receiptOpen" class="track-inline-receipt">
            <OrderReceiptCard :order="order" compact>
              <template #actions>
                <button class="co-btn-primary" type="button" @click="printReceipt"><Printer :size="17" /> Save as PDF</button>
                <button class="co-btn-outline" type="button" @click="openPrintView"><ExternalLink :size="17" /> Print view</button>
              </template>
            </OrderReceiptCard>
          </div>
        </Transition>

        <details class="track-details-disclosure">
          <summary>Order details</summary>
          <div class="track-details">
            <div><span>Name</span><strong>{{ order.customer_name }}</strong></div>
            <div><span>{{ isPickupOrder ? 'Pickup date' : 'Delivery date' }}</span><strong>{{ order.delivery_date }}</strong></div>
            <div><span>{{ isPickupOrder ? 'Pickup location' : 'Delivery address' }}</span><strong>{{ order.address }}</strong></div>
            <div><span>Payment method</span><strong>{{ order.payment_method }}</strong></div>
            <div><span>Total</span><strong>{{ order.total }}</strong></div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>
