import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabaseClient'
import type { Product } from '@/types'

export const useProductsStore = defineStore('products', () => {
  const allProducts = ref<Product[]>([])
  const loading = ref(false)

  function formatPeso(amount: number) {
    return `\u20b1${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

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

    allProducts.value = (data || []).map(p => {
      const priceAmount = Number(p.price || 0)
      const salePriceAmount = p.sale_price === null || p.sale_price === undefined
        ? null
        : Number(p.sale_price)
      const hasSale = salePriceAmount !== null && salePriceAmount > 0 && salePriceAmount < priceAmount

      return {
        id: p.id,
        name: p.name,
        price: formatPeso(hasSale ? salePriceAmount : priceAmount),
        originalPrice: hasSale ? formatPeso(priceAmount) : '',
        salePrice: hasSale ? formatPeso(salePriceAmount) : '',
        priceAmount,
        salePriceAmount: hasSale ? salePriceAmount : null,
        image: p.image,
        category: p.category,
        badge: p.badge,
        stock: p.stock,
        featured: p.featured,
        preOrderAllowed: p.pre_order_allowed ?? true,
        prepDays: p.prep_days ?? 5,
        deliveryRestrictions: p.delivery_restrictions ?? '',
      }
    })
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
