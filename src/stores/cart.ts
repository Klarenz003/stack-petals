// src/stores/cart.ts
import { supabase } from '@/supabaseClient'
import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { CartItem, Customer, PaymentMethod, CheckoutStep, Product } from '@/types'

const CHECKOUT_RECOVERY_KEY = 'stack-petals-checkout-recovery'

export const useCartStore = defineStore('cart', () => {
  // ── State ──────────────────────────────────────────────────────
  const cartItems = ref<CartItem[]>([])
  const cartOpen = ref(false)

  const checkoutStep = ref<CheckoutStep>(0)
  const confirmedTotal = ref('')
  const confirmedOrderReference = ref('')
  const paymentMethod = ref<PaymentMethod>('gcash')
  const paymentProof = ref<File | null>(null)
  const paymentProofPreview = ref<string | null>(null)
  const isSubmittingOrder = ref(false)
  const isReservingStock = ref(false)
  const stockReservationExpiresAt = ref('')
  const stockReservationError = ref('')
  const orderSubmitError = ref('')
  const isCheckingDeliveryDate = ref(false)
  const deliveryDateCapacity = ref({
    max: 0,
    booked: 0,
    remaining: 0,
    isFull: false,
    isLimited: false,
  })
  const deliveryDateMessage = ref('')
  let orderSubmissionPromise: Promise<void> | null = null
  let stockReservationToken = ''

  const customer = ref<Customer>({
    deliveryMethod: 'delivery',
    name: '',
    email: '',
    phone: '',
    address: '',
    landmark: '',
    barangay: '',
    city: '',
    province: '',
    addressLat: null,
    addressLng: null,
    addressPlaceId: '',
    shippingZone: '',
    date: '',
    note: '',
  })

  // ── Love Letter ────────────────────────────────────────────────────────
  const letterData = ref({
    include: false,
    recipientName: '',
    mainMessage: '',
    petalMessages: ['', '', '', '', '', ''],
    memories: [] as string[],
  })

  type CheckoutRecovery = {
    cartItems: CartItem[]
    checkoutStep: CheckoutStep
    customer: Customer
    letterData: typeof letterData.value
    paymentMethod: PaymentMethod
    stockReservationExpiresAt: string
    savedAt: string
  }

  function persistCheckoutRecovery() {
    try {
      if (checkoutStep.value === 5 || (cartItems.value.length === 0 && checkoutStep.value === 0)) {
        localStorage.removeItem(CHECKOUT_RECOVERY_KEY)
        return
      }

      const recovery: CheckoutRecovery = {
        cartItems: cartItems.value,
        checkoutStep: checkoutStep.value,
        customer: customer.value,
        letterData: letterData.value,
        paymentMethod: paymentMethod.value,
        stockReservationExpiresAt: stockReservationExpiresAt.value,
        savedAt: new Date().toISOString(),
      }

      localStorage.setItem(CHECKOUT_RECOVERY_KEY, JSON.stringify(recovery))
    } catch (error) {
      console.error('Checkout recovery save failed:', error)
    }
  }

  function restoreCheckoutRecovery() {
    try {
      const saved = localStorage.getItem(CHECKOUT_RECOVERY_KEY)
      if (!saved) return

      const recovery = JSON.parse(saved) as Partial<CheckoutRecovery>
      if (!Array.isArray(recovery.cartItems) || recovery.cartItems.length === 0) return

      const recoveredStep = Number(recovery.checkoutStep || 0) as CheckoutStep
      const hasActiveReservation = recovery.stockReservationExpiresAt
        ? new Date(recovery.stockReservationExpiresAt).getTime() > Date.now() + 30000
        : false

      cartItems.value = recovery.cartItems
      customer.value = { ...customer.value, ...recovery.customer }
      letterData.value = { ...letterData.value, ...recovery.letterData }
      paymentMethod.value = recovery.paymentMethod || 'gcash'
      paymentProof.value = null
      paymentProofPreview.value = null
      stockReservationExpiresAt.value = hasActiveReservation ? recovery.stockReservationExpiresAt || '' : ''
      checkoutStep.value = recoveredStep >= 1 && recoveredStep <= 4
        ? (recoveredStep === 4 && !hasActiveReservation ? 3 : recoveredStep)
        : 0
    } catch (error) {
      console.error('Checkout recovery restore failed:', error)
      localStorage.removeItem(CHECKOUT_RECOVERY_KEY)
    }
  }

  function clearCheckoutRecovery() {
    localStorage.removeItem(CHECKOUT_RECOVERY_KEY)
  }

  restoreCheckoutRecovery()

  watch(
    [cartItems, checkoutStep, customer, letterData, paymentMethod, stockReservationExpiresAt],
    persistCheckoutRecovery,
    { deep: true }
  )

  watch(
    () => customer.value.date,
    date => {
      checkDeliveryDateCapacity(date)
    },
    { immediate: true }
  )

  // ── Computed ───────────────────────────────────────────────────
  const itemSubtotalAmount = computed(() => {
    return cartItems.value.reduce((acc, item) => {
      const numeric = item.salePriceAmount && item.salePriceAmount > 0
        ? item.salePriceAmount
        : item.priceAmount ?? parseFloat(item.price.replace(/[^\d.]/g, ''))
      return acc + (isNaN(numeric) ? 0 : numeric) * item.quantity
    }, 0)
  })

  function formatPeso(amount: number) {
    return `\u20b1${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  function toRadians(degrees: number) {
    return degrees * (Math.PI / 180)
  }

  function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const earthRadiusKm = 6371
    const dLat = toRadians(lat2 - lat1)
    const dLng = toRadians(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  function estimateShippingZone(address: string, lat?: number | null, lng?: number | null) {
    const normalized = address.toLowerCase()
    const metroNearKeywords = [
      'metro manila', 'manila', 'quezon city', 'makati', 'taguig', 'pasig',
      'mandaluyong', 'san juan', 'marikina', 'caloocan', 'malabon', 'navotas',
      'valenzuela', 'pasay', 'paranaque', 'para\u00f1aque', 'las pinas',
      'las pi\u00f1as', 'muntinlupa', 'pateros', 'taytay', 'cainta', 'angono',
      'antipolo', 'binangonan', 'san mateo', 'rodriguez',
    ]
    const outsideLuzonKeywords = [
      'visayas', 'mindanao', 'cebu', 'bohol', 'iloilo', 'bacolod', 'negros',
      'leyte', 'samar', 'davao', 'cagayan de oro', 'zamboanga',
      'general santos', 'butuan', 'surigao', 'cotabato', 'palawan',
    ]

    if (metroNearKeywords.some(keyword => normalized.includes(keyword))) return 'metro-near'
    if (outsideLuzonKeywords.some(keyword => normalized.includes(keyword))) return 'outside-luzon'

    if (typeof lat === 'number' && typeof lng === 'number') {
      const distanceFromTaytay = getDistanceKm(lat, lng, 14.5586, 121.1366)
      const likelyLuzon = lat >= 12.2 && lat <= 19.9 && lng >= 119.3 && lng <= 124.3
      if (distanceFromTaytay <= 25) return 'metro-near'
      if (!likelyLuzon) return 'outside-luzon'
    }

    return address.trim() ? 'luzon-far' : ''
  }

  function buildDeliveryAddress() {
    const c = customer.value
    if (c.deliveryMethod === 'pickup') return 'Pick up at Stack Petals'
    return [
      c.address.trim(),
      c.landmark.trim() ? `Landmark: ${c.landmark.trim()}` : '',
      c.barangay.trim() ? `Barangay ${c.barangay.trim()}` : '',
      c.city.trim(),
      c.province.trim(),
    ].filter(Boolean).join(', ')
  }

  const fullDeliveryAddress = computed(() => buildDeliveryAddress())

  function buildShippingAddress() {
    const c = customer.value
    return [
      c.barangay.trim() ? `Barangay ${c.barangay.trim()}` : '',
      c.city.trim(),
      c.province.trim(),
    ].filter(Boolean).join(', ')
  }

  const shippingEstimateAddress = computed(() => buildShippingAddress())

  const shippingFee = computed(() => {
    if (customer.value.deliveryMethod === 'pickup') return 0
    const zone = customer.value.shippingZone.toLowerCase()
    if (zone === 'metro-near') return 150
    if (zone === 'outside-luzon') return 350
    if (shippingEstimateAddress.value.trim()) return 250
    return 0
  })

  const shippingLabel = computed(() => {
    if (customer.value.deliveryMethod === 'pickup') return 'Pick up - no shipping fee'
    if (!shippingEstimateAddress.value.trim()) return 'Add barangay, city, and province'
    if (customer.value.shippingZone === 'metro-near') return 'Metro Manila / near Taytay'
    if (customer.value.shippingZone === 'outside-luzon') return 'Outside Luzon'
    return 'Luzon provincial / farther area'
  })

  const cartSubtotal = computed(() => formatPeso(itemSubtotalAmount.value))
  const cartTotal = computed(() => formatPeso(itemSubtotalAmount.value + shippingFee.value))
  const deliveryDateFull = computed(() => deliveryDateCapacity.value.isFull)
  const hasPreOrderItems = computed(() => cartItems.value.some(item => item.preOrder))
  const preOrderPrepDays = computed(() => {
    const prepDays = cartItems.value
      .filter(item => item.preOrder)
      .map(item => item.prepDays ?? 5)
    return prepDays.length ? Math.max(...prepDays) : 5
  })
  const preOrderDateValid = computed(() => {
    if (!hasPreOrderItems.value) return true
    if (!customer.value.date) return false
    const minimum = new Date()
    minimum.setDate(minimum.getDate() + preOrderPrepDays.value)
    return customer.value.date >= minimum.toISOString().split('T')[0]
  })
  const preOrderDateMessage = computed(() =>
    hasPreOrderItems.value && !preOrderDateValid.value
      ? `Pre-order item(s) need a delivery date at least ${preOrderPrepDays.value} days from today.`
      : ''
  )

  const customerValid = computed(() => {
  const c = customer.value
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)
  const phoneOk = /^09\d{9}$/.test(c.phone)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]
  const dateOk = !!c.date && c.date >= minDate
  const addressOk = c.deliveryMethod === 'pickup' || !!(
    c.address &&
    c.barangay &&
    c.city &&
    c.province
  )
  const scheduleOk = c.deliveryMethod === 'pickup' || (!deliveryDateFull.value && !isCheckingDeliveryDate.value)
  return !!(
    c.name &&
    emailOk &&
    phoneOk &&
    addressOk &&
    dateOk &&
    preOrderDateValid.value &&
    scheduleOk
  )
})

  // ── Actions ────────────────────────────────────────────────────
  const notification = ref<string | null>(null)
  let notificationTimer: ReturnType<typeof setTimeout> | null = null

  function showNotification(message: string) {
    notification.value = message
    if (notificationTimer) clearTimeout(notificationTimer)
    notificationTimer = setTimeout(() => {
      notification.value = null
    }, 2500)
  }

  function isSameProduct(a: Product, b: Product) {
    return a.id && b.id ? a.id === b.id : a.name === b.name
  }

  function withTimeout<T>(promise: PromiseLike<T>, ms: number, message: string) {
    let timeoutId: ReturnType<typeof setTimeout>
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), ms)
    })
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timeoutId))
  }

  async function checkDeliveryDateCapacity(date = customer.value.date) {
    deliveryDateMessage.value = ''
    deliveryDateCapacity.value = {
      max: 0,
      booked: 0,
      remaining: 0,
      isFull: false,
      isLimited: false,
    }

    if (!date) return

    isCheckingDeliveryDate.value = true
    try {
      const { data, error } = await withTimeout(
        supabase.rpc('get_delivery_date_availability', {
          p_delivery_date: date,
        }),
        8000,
        'Delivery date check took too long.'
      )

      if (error) {
        console.error('Delivery date check failed:', error)
        deliveryDateMessage.value = error.message?.includes('get_delivery_date_availability')
          ? 'Delivery slot checking is not ready yet. Please apply the latest Supabase migration.'
          : 'Could not check delivery slots right now.'
        return
      }

      const result = Array.isArray(data) ? data[0] : data
      if (!result) return

      deliveryDateCapacity.value = {
        max: result.max_deliveries ?? 0,
        booked: result.booked_deliveries ?? 0,
        remaining: result.remaining_slots ?? 0,
        isFull: !!result.is_full,
        isLimited: !!result.is_limited,
      }

      if (deliveryDateCapacity.value.isFull) {
        deliveryDateMessage.value = 'This delivery date is full. Please choose another date.'
      } else if (deliveryDateCapacity.value.isLimited) {
        deliveryDateMessage.value = `${deliveryDateCapacity.value.remaining} delivery slot${deliveryDateCapacity.value.remaining === 1 ? '' : 's'} left for this date.`
      } else {
        deliveryDateMessage.value = `${deliveryDateCapacity.value.remaining} delivery slots available.`
      }
    } catch (error) {
      console.error('Delivery date check failed:', error)
      deliveryDateMessage.value = 'Could not check delivery slots right now.'
    } finally {
      isCheckingDeliveryDate.value = false
    }
  }

  function getStockReservationToken() {
    if (stockReservationToken) return stockReservationToken

    const stored = localStorage.getItem('stack-petals-stock-reservation-token')
    if (stored) {
      stockReservationToken = stored
      return stockReservationToken
    }

    stockReservationToken = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    localStorage.setItem('stack-petals-stock-reservation-token', stockReservationToken)
    return stockReservationToken
  }

  function reservableItems() {
    return cartItems.value
      .filter(item => !item.preOrder && item.id && item.quantity > 0)
      .map(item => ({ product_id: item.id, quantity: item.quantity }))
  }

  function hasActiveStockReservation() {
    if (!stockReservationExpiresAt.value) return false
    return new Date(stockReservationExpiresAt.value).getTime() > Date.now() + 30000
  }

  async function reserveStockForPayment() {
    stockReservationError.value = ''

    if (cartItems.value.length === 0) {
      stockReservationError.value = 'Your cart is empty.'
      showNotification(stockReservationError.value)
      return false
    }

    const items = reservableItems()
    if (cartItems.value.some(item => !item.preOrder && !item.id)) {
      stockReservationError.value = 'Some cart items cannot be reserved. Please refresh and try again.'
      showNotification(stockReservationError.value)
      return false
    }

    if (items.length === 0) {
      stockReservationExpiresAt.value = ''
      stockReservationError.value = ''
      return true
    }

    isReservingStock.value = true
    try {
      const { data, error } = await withTimeout(
        supabase.rpc('reserve_cart_stock', {
          p_session_token: getStockReservationToken(),
          p_items: items,
          p_minutes: 15,
        }),
        10000,
        'Stock reservation took too long.'
      )

      if (error) {
        console.error('Stock reservation failed:', error)
        const message = error.message?.includes('reserve_cart_stock')
          ? 'Stock reservation is not ready yet. Please apply the latest Supabase migration.'
          : 'Could not reserve stock. Please try again.'
        stockReservationError.value = message
        showNotification(stockReservationError.value)
        return false
      }

      const result = Array.isArray(data) ? data[0] : data
      if (!result?.success) {
        stockReservationExpiresAt.value = ''
        stockReservationError.value = result?.message || 'Some items are no longer available.'
        showNotification(stockReservationError.value)
        return false
      }

      stockReservationExpiresAt.value = result.expires_at
      stockReservationError.value = ''
      showNotification('Stock reserved for 15 minutes')
      return true
    } catch (error) {
      console.error('Stock reservation failed:', error)
      stockReservationError.value = error instanceof Error && error.message === 'Stock reservation took too long.'
        ? 'Stock reservation is taking too long. Please check your Supabase migration/connection and try again.'
        : 'Could not reserve stock. Please try again.'
      showNotification(stockReservationError.value)
      return false
    } finally {
      isReservingStock.value = false
    }
  }

  async function releaseStockReservation() {
    if (!stockReservationExpiresAt.value) return
    try {
      const { error } = await supabase.rpc('release_stock_reservation', {
        p_session_token: getStockReservationToken(),
      })
      if (error) console.error('Stock reservation release failed:', error)
    } catch (error) {
      console.error('Stock reservation release failed:', error)
    }
    stockReservationExpiresAt.value = ''
    stockReservationError.value = ''
  }

  async function commitStockReservation() {
    if (!stockReservationExpiresAt.value) return
    try {
      const { error } = await supabase.rpc('commit_stock_reservation', {
        p_session_token: getStockReservationToken(),
      })
      if (error) console.error('Stock reservation commit failed:', error)
    } catch (error) {
      console.error('Stock reservation commit failed:', error)
    }
    stockReservationExpiresAt.value = ''
    stockReservationError.value = ''
  }

  async function ensureStockReservation() {
    if (reservableItems().length === 0) return true
    if (hasActiveStockReservation()) return true
    return reserveStockForPayment()
  }

  function cartQuantity(item: Product) {
    return cartItems.value.find(i => isSameProduct(i, item))?.quantity ?? 0
  }

  function productAllowsPreOrder(item: Product) {
    return item.preOrderAllowed !== false
  }

  function isProductPreOrder(item: Product) {
    return (item.stock ?? 0) <= 0 && productAllowsPreOrder(item)
  }

  function canAddToCart(item: Product) {
    if ((item.stock ?? 0) <= 0) return isProductPreOrder(item) && cartQuantity(item) === 0
    return cartQuantity(item) < (item.stock ?? 0)
  }

  function shouldAnimateAddToCart(item: Product) {
    return (item.stock ?? 0) > 0 && canAddToCart(item)
  }

  function addToCart(item: Product) {
    const isPreOrder = isProductPreOrder(item)
    if ((item.stock ?? 0) <= 0 && !isPreOrder) {
      showNotification('This item is currently out of stock')
      return false
    }
    const existing = cartItems.value.find(i => isSameProduct(i, item))
    if (existing) {
      if (existing.preOrder) {
        showNotification('This pre-order item is already in your cart')
        return false
      }
      if (existing.quantity >= (item.stock ?? 0)) {
        showNotification(`Only ${item.stock} available in stock`)
        return false
      }
      existing.quantity++
    } else {
      cartItems.value.push({ ...item, quantity: 1, preOrder: isPreOrder })
      if (isPreOrder) showNotification('Pre-order item added to cart')
    }
    return true
  }

  async function updateQuantity(index: number, delta: number) {
    await releaseStockReservation()
    const item = cartItems.value[index]
    const newQty = item.quantity + delta
    if (newQty < 1) {
      cartItems.value.splice(index, 1)
      return
    }
    if (item.preOrder && newQty > 1) {
      showNotification('Pre-order items are limited to 1 per checkout')
      return
    }
    if (newQty > (item.stock ?? 0)) {
      showNotification(`Only ${item.stock} available in stock`)
      return
    }
    item.quantity = newQty
  }

  async function removeFromCart(index: number) {
    await releaseStockReservation()
    cartItems.value.splice(index, 1)
  }

  function openCheckout() {
    cartOpen.value = false
    checkoutStep.value = 1
  }

  async function closeCheckout() {
    await releaseStockReservation()
    checkoutStep.value = 0
  }

  function updateDeliveryAddress(address: string, options: { lat?: number | null; lng?: number | null; placeId?: string } = {}) {
    customer.value.address = address
    if (options.lat !== undefined) customer.value.addressLat = options.lat
    if (options.lng !== undefined) customer.value.addressLng = options.lng
    if (options.placeId !== undefined) customer.value.addressPlaceId = options.placeId
    customer.value.shippingZone = estimateShippingZone(shippingEstimateAddress.value, customer.value.addressLat, customer.value.addressLng)
  }

  function setDeliveryMethod(method: Customer['deliveryMethod']) {
    customer.value.deliveryMethod = method
    customer.value.shippingZone = method === 'pickup'
      ? ''
      : estimateShippingZone(shippingEstimateAddress.value, customer.value.addressLat, customer.value.addressLng)
  }

  function refreshShippingEstimate() {
    customer.value.addressLat = null
    customer.value.addressLng = null
    customer.value.addressPlaceId = ''
    customer.value.shippingZone = customer.value.deliveryMethod === 'pickup'
      ? ''
      : estimateShippingZone(shippingEstimateAddress.value)
  }

  async function goToPayment() {
    if (!customerValid.value) return
    if (preOrderDateMessage.value) {
      showNotification(preOrderDateMessage.value)
      return
    }
    const reserved = await reserveStockForPayment()
    if (reserved) checkoutStep.value = 4
  }

  function handleProofUpload(file: File) {
    paymentProof.value = file
    paymentProofPreview.value = URL.createObjectURL(file)
  }

  function clearProof() {
    paymentProof.value = null
    paymentProofPreview.value = null
  }


  async function createOrder(): Promise<void> {
    orderSubmitError.value = ''
    if (!paymentProof.value) throw new Error('No proof')
    const stockReserved = await ensureStockReservation()
    if (!stockReserved) throw new Error('Stock is no longer available')

    confirmedTotal.value = cartTotal.value

    // 1. Upload payment proof to Supabase Storage
    const fileName = `proof-${Date.now()}.jpg`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('proofs')
      .upload(fileName, paymentProof.value)
    if (uploadError) throw uploadError

    const orderNote = [
      customer.value.note,
      hasPreOrderItems.value ? `Order type: Pre-order (estimated prep time: ${preOrderPrepDays.value} day${preOrderPrepDays.value === 1 ? '' : 's'})` : '',
      `Fulfillment: ${customer.value.deliveryMethod === 'pickup' ? 'Pick up' : 'Delivery'}`,
      `Shipping: ${shippingLabel.value} (${formatPeso(shippingFee.value)})`,
      customer.value.landmark ? `Landmark: ${customer.value.landmark}` : '',
      customer.value.barangay ? `Barangay: ${customer.value.barangay}` : '',
      customer.value.city ? `City/Municipality: ${customer.value.city}` : '',
      customer.value.province ? `Province: ${customer.value.province}` : '',
      customer.value.addressLat !== null && customer.value.addressLng !== null
        ? `Pinned location: ${customer.value.addressLat}, ${customer.value.addressLng}`
        : '',
    ].filter(Boolean).join('\n')

    // 2. Insert order into Supabase
    const { data: insertedOrder, error } = await supabase.from('orders').insert({
      customer_name:  customer.value.name,
      email:          customer.value.email,
      phone:          customer.value.phone,
      address:        fullDeliveryAddress.value,
      delivery_date:  customer.value.date,
      note:           orderNote,
      items:          cartItems.value.map(i => ({
        name: i.name,
        price: i.price,
        image: i.image,
        quantity: i.quantity,
        preOrder: !!i.preOrder,
        prepDays: i.prepDays ?? 5,
        deliveryRestrictions: i.deliveryRestrictions || '',
      })),
      total:          confirmedTotal.value,
      payment_method: paymentMethod.value === 'gcash' ? 'GCash' : 'Maya',
      proof_url:      uploadData.path,
      status:         hasPreOrderItems.value ? 'preorder' : 'pending',
    }).select('id')
      .single()
    if (error) throw error
    if (!insertedOrder?.id) throw new Error('Order was created but no order reference was returned.')
    confirmedOrderReference.value = `SP-${insertedOrder.id}`

    const { error: historyError } = await supabase.rpc('record_order_status_history', {
      p_order_id: insertedOrder.id,
      p_status: hasPreOrderItems.value ? 'preorder' : 'pending',
      p_label: hasPreOrderItems.value ? 'Pre-order received' : 'Order received',
      p_note: 'Order was submitted by the customer.',
    })
    if (historyError) console.warn('Order history was not recorded:', historyError)

    // 3. Consume the reserved stock. The stock was already decremented at payment step.
    await commitStockReservation()

    // 4. Save letter draft if included
    if (letterData.value.include) {
      const { error: letterError } = await supabase.from('letters').insert({
        order_id:       insertedOrder.id,
        recipient:      letterData.value.recipientName,
        sender:         customer.value.name,
        message:        letterData.value.mainMessage,
        petal_messages: letterData.value.petalMessages,
        memories:       letterData.value.memories,
        angle_photos:   [],
        published:      false,
        template:       'love',
      })

      if (letterError) console.warn('Letter draft was not created:', letterError)
    }

    // 5. Send email notifications if the edge function is available.
    try {
      const emailRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          order: {
            customer_name:  customer.value.name,
            email:          customer.value.email,
            phone:          customer.value.phone,
            address:        fullDeliveryAddress.value,
            delivery_date:  customer.value.date,
            note:           orderNote,
            items:          cartItems.value,
            subtotal:       cartSubtotal.value,
            shipping_fee:   formatPeso(shippingFee.value),
            shipping_zone:  shippingLabel.value,
            total:          cartTotal.value,
            payment_method: paymentMethod.value === 'gcash' ? 'GCash' : 'Maya',
          },
        }),
      })
      if (!emailRes.ok) {
        console.warn('Order email notification failed:', emailRes.status, await emailRes.text())
      }
    } catch (emailError) {
      console.warn('Order email notification skipped:', emailError)
    }
  }

  async function submitOrder(): Promise<void> {
    if (orderSubmissionPromise) return orderSubmissionPromise

    isSubmittingOrder.value = true
    orderSubmitError.value = ''
    orderSubmissionPromise = createOrder()
      .catch(error => {
        console.error('Order submit failed:', error)
        orderSubmitError.value = error instanceof Error
          ? error.message
          : 'Could not submit order. Please try again.'
        showNotification(orderSubmitError.value)
        throw error
      })
      .finally(() => {
        isSubmittingOrder.value = false
        orderSubmissionPromise = null
      })

    return orderSubmissionPromise
  }

  function finishCheckout() {
    clearCheckoutRecovery()
    cartItems.value = []
    checkoutStep.value = 0
    confirmedOrderReference.value = ''
    stockReservationExpiresAt.value = ''
    stockReservationError.value = ''
    orderSubmitError.value = ''
    paymentProof.value = null
    paymentProofPreview.value = null
    isSubmittingOrder.value = false
    orderSubmissionPromise = null
    customer.value = {
      deliveryMethod: 'delivery',
      name: '',
      email: '',
      phone: '',
      address: '',
      landmark: '',
      barangay: '',
      city: '',
      province: '',
      addressLat: null,
      addressLng: null,
      addressPlaceId: '',
      shippingZone: '',
      date: '',
      note: '',
    }

    letterData.value = {
      include: false,
      recipientName: '',
      mainMessage: '',
      petalMessages: ['', '', '', '', '', ''],
      memories: [],
    }
  }



  return {
      // ── State ──────────────────────────────────────────────────────
      cartItems, cartOpen, checkoutStep, confirmedTotal, confirmedOrderReference,
      paymentMethod, paymentProof, paymentProofPreview, isSubmittingOrder,
      isReservingStock, stockReservationExpiresAt, stockReservationError,
      orderSubmitError,
      isCheckingDeliveryDate, deliveryDateCapacity, deliveryDateMessage,
      customer, letterData,

      // ── Computed ───────────────────────────────────────────────────
      cartSubtotal, cartTotal, shippingFee, shippingLabel, customerValid,
      fullDeliveryAddress, shippingEstimateAddress,
      deliveryDateFull, hasPreOrderItems, preOrderDateValid, preOrderDateMessage,
      preOrderPrepDays,

      // ── Actions ────────────────────────────────────────────────────
      addToCart, removeFromCart, updateQuantity,
      cartQuantity, canAddToCart, shouldAnimateAddToCart,
      isProductPreOrder, productAllowsPreOrder,
      openCheckout, closeCheckout, goToPayment,
      reserveStockForPayment, releaseStockReservation,
      updateDeliveryAddress, refreshShippingEstimate,
      checkDeliveryDateCapacity,
      setDeliveryMethod,
      handleProofUpload, clearProof,
      submitOrder, finishCheckout, notification
    }
  })
