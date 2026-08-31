import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/supabaseClient'
import type { Product } from '@/types'
import { useMarketStore } from '@/stores/market'

export const useProductsStore = defineStore('products', () => {
  const allProducts = ref<Product[]>([])
  const loading = ref(false)
  const market = useMarketStore()

  async function fetchProducts() {
    loading.value = true
    await supabase.rpc('release_expired_market_stock_reservations')

    const { data, error } = await supabase.rpc('get_storefront_products', {
      p_market_code: market.code,
    })

    if (error) {
      console.error('Failed to fetch products:', error)
      loading.value = false
      return
    }

    allProducts.value = (data || []).map((p: any) => {
      const priceAmount = Number(p.price || 0)
      const salePriceAmount = p.sale_price === null || p.sale_price === undefined
        ? null
        : Number(p.sale_price)
      const hasSale = salePriceAmount !== null && salePriceAmount > 0 && salePriceAmount < priceAmount

      return {
        id: p.id,
        baseProductId: p.product_id,
        marketCode: p.market_code,
        currencyCode: p.currency_code,
        name: p.name,
        price: market.formatMoney(hasSale ? salePriceAmount : priceAmount),
        originalPrice: hasSale ? market.formatMoney(priceAmount) : '',
        salePrice: hasSale ? market.formatMoney(salePriceAmount) : '',
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

  watch(() => market.code, () => fetchProducts())

  return {
    allProducts,
    loading,
    fetchProducts,
    featuredProducts,
    productsByCategory,
  }
})
