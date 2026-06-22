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
      return acc + (isNaN(numeric) ? 0 : numeric)
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
  function addToCart(item: CartItem) {
    if (!item.stock || item.stock === 0) {
      alert('This item is out of stock')
      return
    }
    cartItems.value.push({ ...item })
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
      items:          cartItems.value.map(i => ({ name: i.name, price: i.price, image: i.image })),
      total:          cartTotal.value,
      payment_method: paymentMethod.value === 'gcash' ? 'GCash' : 'Maya',
      proof_url:      uploadData.path,
      status:         'pending',
    })

    if (error) throw error

    // 3. Send email notifications
    console.log('Calling edge function...')
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
    // state
    cartItems, cartOpen, checkoutStep, confirmedTotal,
    paymentMethod, paymentProof, paymentProofPreview, customer, letterData,
    // computed
    cartTotal, customerValid,
    // actions
    addToCart, removeFromCart,
    openCheckout, closeCheckout, goToPayment,
    handleProofUpload, clearProof,
    submitOrder, finishCheckout,
  }
})