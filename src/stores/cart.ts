// src/stores/cart.ts
import { supabase } from '@/supabaseClient'
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { CartItem, Customer, PaymentMethod, CheckoutStep, Product } from '@/types'


export const useCartStore = defineStore('cart', () => {
  // ── State ──────────────────────────────────────────────────────
  const cartItems = ref<CartItem[]>([])
  const cartOpen = ref(false)

  const checkoutStep = ref<CheckoutStep>(0)
  const confirmedTotal = ref('')
  const paymentMethod = ref<PaymentMethod>('gcash')
  const paymentProof = ref<File | null>(null)
  const paymentProofPreview = ref<string | null>(null)
  const isSubmittingOrder = ref(false)
  let orderSubmissionPromise: Promise<void> | null = null

  const customer = ref<Customer>({
    name: '',
    email: '',
    phone: '',
    address: '',
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

  // ── Computed ───────────────────────────────────────────────────
  const itemSubtotalAmount = computed(() => {
    return cartItems.value.reduce((acc, item) => {
      const numeric = parseFloat(item.price.replace(/[^\d.]/g, ''))
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

  const shippingFee = computed(() => {
    const zone = customer.value.shippingZone.toLowerCase()
    if (zone === 'metro-near') return 150
    if (zone === 'outside-luzon') return 350
    if (customer.value.address.trim()) return 250
    return 0
  })

  const shippingLabel = computed(() => {
    if (!customer.value.address.trim()) return 'Add delivery address'
    if (customer.value.shippingZone === 'metro-near') return 'Metro Manila / near Taytay'
    if (customer.value.shippingZone === 'outside-luzon') return 'Outside Luzon'
    return 'Luzon provincial / farther area'
  })

  const cartSubtotal = computed(() => formatPeso(itemSubtotalAmount.value))
  const cartTotal = computed(() => formatPeso(itemSubtotalAmount.value + shippingFee.value))

  const customerValid = computed(() => {
  const c = customer.value
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)
  const phoneOk = /^09\d{9}$/.test(c.phone)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]
  const dateOk = !!c.date && c.date >= minDate
  return !!(c.name && emailOk && phoneOk && c.address && dateOk)
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

  function cartQuantity(item: Product) {
    return cartItems.value.find(i => isSameProduct(i, item))?.quantity ?? 0
  }

  function canAddToCart(item: Product) {
    return !!item.stock && cartQuantity(item) < item.stock
  }

  function shouldAnimateAddToCart(item: Product) {
    return canAddToCart(item)
  }

  function addToCart(item: Product) {
    if (!item.stock || item.stock === 0) {
      showNotification('This item is out of stock')
      return false
    }
    const existing = cartItems.value.find(i => isSameProduct(i, item))
    if (existing) {
      if (existing.quantity >= (item.stock ?? 0)) {
        showNotification(`Only ${item.stock} available in stock`)
        return false
      }
      existing.quantity++
    } else {
      cartItems.value.push({ ...item, quantity: 1 })
    }
    return true
  }

  function updateQuantity(index: number, delta: number) {
    const item = cartItems.value[index]
    const newQty = item.quantity + delta
    if (newQty < 1) {
      cartItems.value.splice(index, 1)
      return
    }
    if (newQty > (item.stock ?? 0)) {
      showNotification(`Only ${item.stock} available in stock`)
      return
    }
    item.quantity = newQty
  }

  function removeFromCart(index: number) {
    cartItems.value.splice(index, 1)
  }

  function openCheckout() {
    cartOpen.value = false
    checkoutStep.value = 1
  }

  function closeCheckout() {
    checkoutStep.value = 0
  }

  function updateDeliveryAddress(address: string, options: { lat?: number | null; lng?: number | null; placeId?: string } = {}) {
    customer.value.address = address
    if (options.lat !== undefined) customer.value.addressLat = options.lat
    if (options.lng !== undefined) customer.value.addressLng = options.lng
    if (options.placeId !== undefined) customer.value.addressPlaceId = options.placeId
    customer.value.shippingZone = estimateShippingZone(address, customer.value.addressLat, customer.value.addressLng)
  }

  function goToPayment() {
    if (!customerValid.value) return
    checkoutStep.value = letterData.value.include ? 3 : 4
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
    if (!paymentProof.value) throw new Error('No proof')

    confirmedTotal.value = cartTotal.value

    // 1. Upload payment proof to Supabase Storage
    const fileName = `proof-${Date.now()}.jpg`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('proofs')
      .upload(fileName, paymentProof.value)
    if (uploadError) throw uploadError

    const orderNote = [
      customer.value.note,
      `Shipping: ${shippingLabel.value} (${formatPeso(shippingFee.value)})`,
      customer.value.addressLat !== null && customer.value.addressLng !== null
        ? `Pinned location: ${customer.value.addressLat}, ${customer.value.addressLng}`
        : '',
    ].filter(Boolean).join('\n')

    // 2. Insert order into Supabase
    const { error } = await supabase.from('orders').insert({
      customer_name:  customer.value.name,
      email:          customer.value.email,
      phone:          customer.value.phone,
      address:        customer.value.address,
      delivery_date:  customer.value.date,
      note:           orderNote,
      items:          cartItems.value.map(i => ({ name: i.name, price: i.price, image: i.image, quantity: i.quantity })),
      total:          confirmedTotal.value,
      payment_method: paymentMethod.value === 'gcash' ? 'GCash' : 'Maya',
      proof_url:      uploadData.path,
      status:         'pending',
    })
    if (error) throw error

    // 3. Decrease stock for each item
    for (const item of cartItems.value) {
      if (!item.id) continue
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        p_id: item.id,
        p_qty: item.quantity,
      })
      if (stockError) console.error('Stock update failed for', item.id, stockError)
    }

    // 4. Save letter draft if included
    if (letterData.value.include) {
      // Get the order we just created
        const { data: orderData } = await supabase
          .from('orders')
          .select('id')
          .eq('email', customer.value.email)
          .eq('proof_url', uploadData.path)
          .single()

        console.log('Order data:', orderData)

        if (orderData) {
          const { error: letterError } = await supabase.from('letters').insert({
            order_id:       orderData.id,
            recipient:      letterData.value.recipientName,
            sender:         customer.value.name,
            message:        letterData.value.mainMessage,
            petal_messages: letterData.value.petalMessages,
            memories:       letterData.value.memories,
            angle_photos:   [],
            published:      false,
            template:       'love',
          })
          console.log('Letter error:', letterError)
        }
      }

    // 5. Send email notifications
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
          address:        customer.value.address,
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
    console.log('Edge function response:', emailRes.status, await emailRes.text())
  }

  async function submitOrder(): Promise<void> {
    if (orderSubmissionPromise) return orderSubmissionPromise

    isSubmittingOrder.value = true
    orderSubmissionPromise = createOrder()
      .finally(() => {
        isSubmittingOrder.value = false
        orderSubmissionPromise = null
      })

    return orderSubmissionPromise
  }

  function finishCheckout() {
    cartItems.value = []
    checkoutStep.value = 0
    paymentProof.value = null
    paymentProofPreview.value = null
    isSubmittingOrder.value = false
    orderSubmissionPromise = null
    customer.value = {
      name: '',
      email: '',
      phone: '',
      address: '',
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
      cartItems, cartOpen, checkoutStep, confirmedTotal,
      paymentMethod, paymentProof, paymentProofPreview, isSubmittingOrder, customer, letterData,

      // ── Computed ───────────────────────────────────────────────────
      cartSubtotal, cartTotal, shippingFee, shippingLabel, customerValid,

      // ── Actions ────────────────────────────────────────────────────
      addToCart, removeFromCart, updateQuantity,
      cartQuantity, canAddToCart, shouldAnimateAddToCart,
      openCheckout, closeCheckout, goToPayment,
      updateDeliveryAddress,
      handleProofUpload, clearProof,
      submitOrder, finishCheckout, notification
    }
  })
