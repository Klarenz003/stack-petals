// src/stores/cart.ts
import { supabase } from '@/supabaseClient'
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { CartItem, Customer, PaymentMethod, CheckoutStep } from '@/types'


export const useCartStore = defineStore('cart', () => {
  // ── State ──────────────────────────────────────────────────────
  const cartItems = ref<CartItem[]>([])
  const cartOpen = ref(false)

  const checkoutStep = ref<CheckoutStep>(0)
  const confirmedTotal = ref('')
  const paymentMethod = ref<PaymentMethod>('gcash')
  const paymentProof = ref<File | null>(null)
  const paymentProofPreview = ref<string | null>(null)

  const customer = ref<Customer>({
    name: '',
    email: '',
    phone: '',
    address: '',
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
  const cartTotal = computed(() => {
    const sum = cartItems.value.reduce((acc, item) => {
      const numeric = parseFloat(item.price.replace(/[₱,]/g, ''))
      return acc + (isNaN(numeric) ? 0 : numeric) * item.quantity
    }, 0)
    return `₱${sum.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  })

  const customerValid = computed(() => {
  const c = customer.value
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)
  const phoneOk = c.phone.length === 11
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

  function addToCart(item: CartItem) {
    if (!item.stock || item.stock === 0) {
      showNotification('This item is out of stock')
      return
    }
    const existing = cartItems.value.find(i => i.id === item.id)
    if (existing) {
      if (existing.quantity >= (item.stock ?? 0)) {
        showNotification(`Only ${item.stock} available in stock`)
        return
      }
      existing.quantity++
    } else {
      cartItems.value.push({ ...item, quantity: 1 })
    }
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


  async function submitOrder(): Promise<void> {
    if (!paymentProof.value) throw new Error('No proof')

    confirmedTotal.value = cartTotal.value

    // 1. Upload payment proof to Supabase Storage
    const fileName = `proof-${Date.now()}.jpg`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('proofs')
      .upload(fileName, paymentProof.value)
    if (uploadError) throw uploadError

    // 2. Insert order into Supabase
    const { error } = await supabase.from('orders').insert({
      customer_name:  customer.value.name,
      email:          customer.value.email,
      phone:          customer.value.phone,
      address:        customer.value.address,
      delivery_date:  customer.value.date,
      note:           customer.value.note,
      items:          cartItems.value.map(i => ({ name: i.name, price: i.price, image: i.image, quantity: i.quantity })),
      total:          cartTotal.value,
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
          note:           customer.value.note,
          items:          cartItems.value,
          total:          cartTotal.value,
          payment_method: paymentMethod.value === 'gcash' ? 'GCash' : 'Maya',
        },
      }),
    })
    console.log('Edge function response:', emailRes.status, await emailRes.text())
  }

  function finishCheckout() {
    cartItems.value = []
    checkoutStep.value = 0
    paymentProof.value = null
    paymentProofPreview.value = null
    customer.value = { name: '', email: '', phone: '', address: '', date: '', note: '' }

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
      paymentMethod, paymentProof, paymentProofPreview, customer, letterData,

      // ── Computed ───────────────────────────────────────────────────
      cartTotal, customerValid,

      // ── Actions ────────────────────────────────────────────────────
      addToCart, removeFromCart, updateQuantity,
      openCheckout, closeCheckout, goToPayment,
      handleProofUpload, clearProof,
      submitOrder, finishCheckout, notification
    }
  })