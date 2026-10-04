import { supabase } from '@/supabaseClient'
import { reportStorefrontError } from '@/services/errorTracker'

export type CustomerOrderItem = {
  name: string
  quantity?: number
  price: string | number
  image?: string
  preOrder?: boolean
}

export type CustomerOrder = {
  id: string
  created_at?: string
  customer_name?: string
  email?: string
  phone?: string
  address?: string
  delivery_date?: string
  items?: CustomerOrderItem[]
  total?: string | number
  payment_method?: string
  status?: string
  delivery_method?: string
}

export type CustomerOrderHistory = {
  id: string
  status: string
  label: string
  note?: string
  created_at?: string
}

export type CustomerOrderLookup = {
  order: CustomerOrder
  history: CustomerOrderHistory[]
}

const VERIFIED_ORDER_CACHE_KEY = 'stack-petals:verified-order'
const VERIFIED_ORDER_CACHE_DURATION = 10 * 60 * 1000

export function normalizeOrderReference(reference: string) {
  return reference.trim().replace(/^SP-/i, '').toLowerCase()
}

export function normalizePhilippinePhone(phone: string) {
  return phone.replace(/\D/g, '').slice(0, 11)
}

export function formatPhoneDisplay(phone: string) {
  const digits = normalizePhilippinePhone(phone)
  if (digits.length <= 4) return digits
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
}

export async function lookupCustomerOrder(reference: string, phone: string): Promise<CustomerOrderLookup | null> {
  const { data, error } = await supabase.rpc('lookup_customer_order', {
    p_order_reference: reference,
    p_phone: normalizePhilippinePhone(phone),
  })

  if (error) { reportStorefrontError('order.lookup', error); throw error }
  if (!data || typeof data !== 'object' || !('order' in data)) return null

  const lookup = data as unknown as CustomerOrderLookup
  const result = {
    order: lookup.order,
    history: Array.isArray(lookup.history) ? lookup.history : [],
  }

  cacheVerifiedOrder(result)
  return result
}

export function cacheVerifiedOrder(lookup: CustomerOrderLookup) {
  try {
    sessionStorage.setItem(VERIFIED_ORDER_CACHE_KEY, JSON.stringify({
      expiresAt: Date.now() + VERIFIED_ORDER_CACHE_DURATION,
      lookup,
    }))
  } catch {
    // Tracking still works when browser storage is unavailable.
  }
}

export function getCachedVerifiedOrder(reference: string): CustomerOrderLookup | null {
  try {
    const cached = JSON.parse(sessionStorage.getItem(VERIFIED_ORDER_CACHE_KEY) || 'null') as {
      expiresAt?: number
      lookup?: CustomerOrderLookup
    } | null
    if (!cached?.expiresAt || cached.expiresAt < Date.now() || !cached.lookup?.order) return null
    return normalizeOrderReference(reference) === cached.lookup.order.id.toLowerCase() ? cached.lookup : null
  } catch {
    return null
  }
}
