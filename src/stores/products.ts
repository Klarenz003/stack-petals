import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabaseClient'
import type { Product } from '@/types'

export const useProductsStore = defineStore('products', () => {
  const allProducts = ref<Product[]>([])
  const loading = ref(false)

  async function fetchProducts() {
    loading.value = true
    await supabase.rpc('release_expired_stock_reservations')

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch products:', error)
      loading.value = false
      return
    }

    allProducts.value = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      price: `₱${p.price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      image: p.image,
      category: p.category,
      badge: p.badge,
      stock: p.stock,
      featured: p.featured,
    }))
    loading.value = false
  }

  const featuredProducts = computed(() =>
    allProducts.value.filter(p => p.featured)
  )

  const productsByCategory = (category: string) =>
    category === 'All'
      ? allProducts.value
      : allProducts.value.filter(p => p.category === category)

  return {
    allProducts,
    loading,
    fetchProducts,
    featuredProducts,
    productsByCategory,
  }
})
