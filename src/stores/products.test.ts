import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { useProductsStore } from './products'
import { useMarketStore } from './market'
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock('@/supabaseClient', () => ({ supabase: { rpc: mocks.rpc } }))
vi.mock('@/services/errorTracker', () => ({ reportStorefrontError: vi.fn() }))
vi.mock('@/stores/market', async () => {
  const { reactive } = await import('vue')
  const market = reactive({ code: 'PH' })
  return {
    useMarketStore: () => market,
    marketConfigs: { PH: { locale: 'en-PH', currency: 'PHP' }, CA: { locale: 'en-CA', currency: 'CAD' } },
  }
})
let pinia: Pinia
beforeEach(() => {
  pinia = createPinia(); setActivePinia(pinia)
  useMarketStore().code = 'PH'
  mocks.rpc.mockReset().mockResolvedValue({ data: [], error: null })
})
afterEach(() => { disposePinia(pinia); vi.useRealTimers() })
describe('product caching', () => {
  it('shares requests, caches empty results, expires and allows explicit refresh', async () => {
    vi.useFakeTimers()
    const store = useProductsStore()
    await Promise.all([store.fetchProducts(), store.fetchProducts()])
    expect(store.hasLoaded).toBe(true)
    expect(mocks.rpc).toHaveBeenCalledTimes(2)
    await store.fetchProducts()
    expect(mocks.rpc).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(120_000)
    await store.fetchProducts()
    expect(mocks.rpc).toHaveBeenCalledTimes(4)
    await store.fetchProducts({ force: true })
    expect(mocks.rpc).toHaveBeenCalledTimes(6)
  })
  it('does not let an old market response replace the new market', async () => {
    let finishOld!: (value: unknown) => void
    mocks.rpc.mockImplementation((name, args) => {
      if (name === 'release_expired_market_stock_reservations') return Promise.resolve({ data: null })
      if (args.p_market_code === 'PH') return new Promise(resolve => { finishOld = resolve })
      return Promise.resolve({ data: [{ id: 'canada', price: 25, market_code: 'CA' }], error: null })
    })
    const store = useProductsStore()
    const oldRequest = store.fetchProducts()
    await vi.waitFor(() => expect(finishOld).toBeTypeOf('function'))
    useMarketStore().code = 'CA'
    await store.fetchProducts()
    expect(store.allProducts[0]?.id).toBe('canada')
    expect(store.allProducts[0]?.price).toBe('$25.00')
    finishOld({ data: [{ id: 'philippines', price: 1999 }], error: null })
    await oldRequest
    expect(store.allProducts[0]?.id).toBe('canada')
    useMarketStore().code = 'PH'
    expect(store.allProducts[0]?.id).toBe('philippines')
    expect(store.allProducts[0]?.price).toContain('1,999.00')
  })
})
