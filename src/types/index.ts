// src/types/index.ts

export interface Product {
  name: string
  price: string
  image: string
  category?: string
  badge?: string | null
}

export interface CartItem extends Product {
  // Future: add quantity when backend supports it
}

export interface Customer {
  name: string
  email: string
  phone: string
  address: string
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
export type CheckoutStep = 0 | 1 | 2 | 3 | 4
