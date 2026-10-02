<script setup lang="ts">
import { computed, ref } from 'vue'
import { PhCheck as Check, PhCopy as Copy, PhCreditCard as CreditCard, PhMapPin as MapPin, PhPackage as PackageCheck } from '@phosphor-icons/vue'
import type { CustomerOrder } from '@/services/orderLookup'

const props = defineProps<{
  order: CustomerOrder
  compact?: boolean
}>()

const copied = ref(false)
const isPickup = computed(() => props.order.delivery_method?.toLowerCase() === 'pickup'
  || props.order.address?.toLowerCase().includes('pick up')
  || props.order.address?.toLowerCase().includes('pickup'))

function amount(value: string | number | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value || '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

const subtotal = computed(() => (props.order.items || []).reduce(
  (sum, item) => sum + amount(item.price) * Math.max(item.quantity || 1, 1),
  0,
))
const total = computed(() => amount(props.order.total))
const shipping = computed(() => isPickup.value ? 0 : Math.max(total.value - subtotal.value, 0))
const reference = computed(() => `SP-${props.order.id}`)
const orderedAt = computed(() => props.order.created_at
  ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(props.order.created_at))
  : '')

function formatPeso(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
}

async function copyReference() {
  await navigator.clipboard.writeText(reference.value)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1800)
}
</script>

<template>
  <article :class="['receipt-card', { 'receipt-card--compact': compact }]">
    <header class="receipt-card-header">
      <div>
        <span>Stack Petals</span>
        <h2>Order receipt</h2>
        <p v-if="orderedAt">Ordered {{ orderedAt }}</p>
      </div>
      <button class="receipt-reference" type="button" title="Copy order reference" @click="copyReference">
        <span>{{ reference }}</span>
        <Check v-if="copied" :size="15" aria-hidden="true" />
        <Copy v-else :size="15" aria-hidden="true" />
      </button>
    </header>

    <div class="receipt-official-note">
      <PackageCheck :size="20" aria-hidden="true" />
      <div>
        <span>Official order proof</span>
        <p>Keep this receipt and order reference for tracking or customer support.</p>
      </div>
    </div>

    <section class="receipt-section">
      <h3>Items ordered</h3>
      <div class="receipt-items">
        <div v-for="(item, index) in order.items || []" :key="`${item.name}-${index}`" class="receipt-item">
          <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy" />
          <div class="receipt-item-copy">
            <strong>{{ item.name }}</strong>
            <span>Quantity {{ item.quantity || 1 }}<template v-if="item.preOrder"> &middot; Pre-order</template></span>
          </div>
          <strong>{{ formatPeso(amount(item.price) * Math.max(item.quantity || 1, 1)) }}</strong>
        </div>
        <p v-if="!order.items?.length" class="receipt-empty">No item details were recorded.</p>
      </div>
    </section>

    <section class="receipt-section receipt-summary">
      <h3>Payment summary</h3>
      <div><span>Subtotal</span><strong>{{ formatPeso(subtotal) }}</strong></div>
      <div><span>{{ isPickup ? 'Pickup' : 'Shipping' }}</span><strong>{{ isPickup ? 'Free' : formatPeso(shipping) }}</strong></div>
      <div class="receipt-total"><span>Total paid</span><strong>{{ order.total || formatPeso(total) }}</strong></div>
    </section>

    <section class="receipt-section receipt-fulfillment">
      <h3>{{ isPickup ? 'Pickup details' : 'Delivery details' }}</h3>
      <div class="receipt-info-row">
        <MapPin :size="18" aria-hidden="true" />
        <div><span>{{ isPickup ? 'Pickup location' : 'Address' }}</span><strong>{{ order.address || 'Not provided' }}</strong></div>
      </div>
      <div class="receipt-info-row">
        <PackageCheck :size="18" aria-hidden="true" />
        <div><span>{{ isPickup ? 'Pickup date' : 'Delivery date' }}</span><strong>{{ order.delivery_date || 'To be confirmed' }}</strong></div>
      </div>
      <div class="receipt-info-row">
        <CreditCard :size="18" aria-hidden="true" />
        <div><span>Payment method</span><strong>{{ order.payment_method || 'Not recorded' }}</strong></div>
      </div>
    </section>

    <details class="receipt-customer-details">
      <summary>Customer information</summary>
      <div class="receipt-lines">
        <div><span>Name</span><strong>{{ order.customer_name }}</strong></div>
        <div><span>Email</span><strong>{{ order.email }}</strong></div>
        <div><span>Phone</span><strong>{{ order.phone }}</strong></div>
      </div>
    </details>

    <div class="receipt-actions">
      <slot name="actions" />
    </div>
  </article>
</template>
