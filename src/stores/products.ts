import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/supabaseClient'
import { reportStorefrontError } from '@/services/errorTracker'
import type { Product } from '@/types'
import { useMarketStore, marketConfigs, type MarketCode } from '@/stores/market'
import { createTimedCache } from '@/utils/timedCache'

export const useProductsStore = defineStore('products', () => {
  const allProducts = ref<Product[]>([])
  const loading = ref(false)
  const fetchError = ref('')
  const market = useMarketStore()
  const cache = createTimedCache<MarketCode, Product[]>()
  const hasLoaded = ref(false)

  async function fetchProducts(options: { force?: boolean } = {}) {
    const marketCode = market.code
    const snapshot = cache.peek(marketCode)
    if (snapshot !== undefined) { allProducts.value = snapshot; hasLoaded.value = true }
    if (!options.force && cache.isFresh(marketCode)) return
    loading.value = true
    fetchError.value = ''
    try {
      const result = await cache.load(marketCode, async () => {
        await supabase.rpc('release_expired_market_stock_reservations')

        const { data, error } = await supabase.rpc('get_storefront_products', {
          p_market_code: marketCode,
        })
        if (error) throw error

        const storefrontRows = data || []
        const productIds = storefrontRows.map((p: any) => p.product_id).filter(Boolean)
        const { data: capabilityRows } = productIds.length
          ? await supabase.from('products').select('id, has_360_view').in('id', productIds)
          : { data: [] as any[] }
        const capabilities = new Map((capabilityRows || []).map((row: any) => [row.id, Boolean(row.has_360_view)]))

        const config = marketConfigs[marketCode]
        const formatMoney = (amount: number) => new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
        return storefrontRows.map((p: any) => {
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
            price: formatMoney(hasSale ? salePriceAmount : priceAmount),
            originalPrice: hasSale ? formatMoney(priceAmount) : '',
            salePrice: hasSale ? formatMoney(salePriceAmount) : '',
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
            // Keep false as the safe default for ordinary bouquets.
            has360Viewer: capabilities.get(p.product_id) ?? Boolean(p.has_360_view ?? p.has360Viewer ?? p.supports_360),
          }
        })
      }, options.force)
      if (market.code === marketCode) { allProducts.value = result; hasLoaded.value = true }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      reportStorefrontError('products.load', error)
      if (market.code === marketCode) fetchError.value = 'The collection could not refresh. Please try again in a moment.'
    } finally {
      if (market.code === marketCode) loading.value = false
    }
  }

  const featuredProducts = computed(() =>
    allProducts.value.filter(p => p.featured)
  )

  const productsByCategory = (category: string) =>
    category === 'All'
      ? allProducts.value
      : allProducts.value.filter(p => p.category === category)

  watch(() => market.code, code => {
    const snapshot = cache.peek(code)
    allProducts.value = snapshot ?? []
    hasLoaded.value = snapshot !== undefined
    fetchError.value = ''
    loading.value = false
    void fetchProducts()
  }, { flush: 'sync' })

  return {
    allProducts,
    hasLoaded,
    loading,
    fetchError,
    fetchProducts,
    featuredProducts,
    productsByCategory,
  }
})
