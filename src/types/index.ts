// src/types/index.ts

export interface Product {
  id?: string
  name: string
  price: string
  originalPrice?: string
  salePrice?: string
  priceAmount?: number
  salePriceAmount?: number | null
  image: string
  category?: string
  badge?: string | null
  stock?: number
  featured?: boolean
  preOrderAllowed?: boolean
  prepDays?: number
  deliveryRestrictions?: string
}

export interface CartItem extends Product {
  // Future: add quantity when backend supports it
}

export interface Customer {
  deliveryMethod: 'delivery' | 'pickup'
  name: string
  email: string
  phone: string
  address: string
  landmark: string
  barangay: string
  city: string
  province: string
  addressLat: number | null
  addressLng: number | null
  addressPlaceId: string
  shippingZone: string
  date: string
  note: string
}

export interface Order {
  id: string
  createdAt: string
  customer: Customer
  items: CartItem[]
  total: string
  paymentMethod: 'GCash' | 'Maya'
  proofImage: string          // base64 — will be replaced with a Supabase Storage URL
  paymentStatus: 'Pending' | 'Confirmed' | 'Rejected'
  deliveryStatus: 'Processing' | 'Ready' | 'Delivered'
}

export interface Message {
  id: string
  createdAt: string
  name: string
  email: string
  subject: string
  message: string
  read: boolean
}

export interface Feature {
  label: string
  sub: string
  icon: string
}

export interface Review {
  name: string
  text: string
}

export interface TeamMember {
  name: string
  role: string
  initials: string
}

export interface ProcessStep {
  title: string
  desc: string
}

export interface ContactInfo {
  icon: string
  label: string
  value: string
}

export type PaymentMethod = 'gcash' | 'maya'
export type CheckoutStep = 0 | 1 | 2 | 3 | 4 | 5
export interface CartItem {
  id?: string
  name: string
  price: string
  originalPrice?: string
  salePrice?: string
  priceAmount?: number
  salePriceAmount?: number | null
  image: string
  category?: string
  badge?: string | null
  stock?: number
  featured?: boolean
  preOrderAllowed?: boolean
  prepDays?: number
  deliveryRestrictions?: string
  quantity: number
  preOrder?: boolean
}
