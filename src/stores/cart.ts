// src/stores/cart.ts
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
    checkoutStep.value = 3
  }

  function handleProofUpload(file: File) {
    paymentProof.value = file
    paymentProofPreview.value = URL.createObjectURL(file)
  }

  function clearProof() {
    paymentProof.value = null
    paymentProofPreview.value = null
  }

  /**
   * submitOrder: currently persists to localStorage.
   * TODO: Replace localStorage.setItem calls with Supabase inserts once
   * the Node.js/Express API is ready, e.g.:
   *   await api.post('/orders', payload)
   */
  function submitOrder(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!paymentProof.value) { reject(new Error('No proof')); return }

      confirmedTotal.value = cartTotal.value

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const orders = JSON.parse(localStorage.getItem('sp_orders') || '[]')
          orders.unshift({
            id:            `ORD-${Date.now()}`,
            createdAt:     new Date().toISOString(),
            customer:      { ...customer.value },
            items:         cartItems.value.map(i => ({ name: i.name, price: i.price, image: i.image })),
            total:         cartTotal.value,
            paymentMethod: paymentMethod.value === 'gcash' ? 'GCash' : 'Maya',
            proofImage:    (e.target as FileReader).result,
            paymentStatus: 'Pending',
            deliveryStatus:'Processing',
          })
          localStorage.setItem('sp_orders', JSON.stringify(orders))
          resolve()
        } catch (err) {
          reject(err)
        }
      }
      reader.readAsDataURL(paymentProof.value)
    })
  }

  function finishCheckout() {
    cartItems.value = []
    checkoutStep.value = 0
    paymentProof.value = null
    paymentProofPreview.value = null
    customer.value = { name: '', email: '', phone: '', address: '', date: '', note: '' }
  }

  return {
    // state
    cartItems, cartOpen, checkoutStep, confirmedTotal,
    paymentMethod, paymentProof, paymentProofPreview, customer,
    // computed
    cartTotal, customerValid,
    // actions
    addToCart, removeFromCart,
    openCheckout, closeCheckout, goToPayment,
    handleProofUpload, clearProof,
    submitOrder, finishCheckout,
  }
})
