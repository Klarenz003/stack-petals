import { supabase } from '@/supabaseClient'
import type { App } from 'vue'
import { getActivePinia } from 'pinia'
import { useMarketStore } from '@/stores/market'

const operations = ['runtime', 'navigation', 'products.load', 'checkout.availability', 'checkout.reserve', 'checkout.submit', 'letter.load', 'letter.publish', 'contact.send', 'chat.send', 'order.lookup'] as const
export type ErrorOperation = typeof operations[number]
const seen = new Map<string, number>()
let sent = 0

export function safeErrorCode(error: unknown): string {
  const candidate = error && typeof error === 'object' ? error as { code?: unknown; name?: unknown } : {}
  if (typeof candidate.code === 'string' && /^(?:[0-9A-Z]{5}|PGRST\d{3})$/.test(candidate.code)) return candidate.code
  const names = ['TypeError', 'ReferenceError', 'RangeError', 'SyntaxError', 'ChunkLoadError']
  return typeof candidate.name === 'string' && names.includes(candidate.name) ? candidate.name : 'UNKNOWN'
}

/** Never send error text, stack traces, form data, URL parameters, or customer identifiers. */
export function reportStorefrontError(operation: ErrorOperation, error?: unknown) {
  try {
    if (!operations.includes(operation) || sent >= 20) return
    const code = safeErrorCode(error)
    const key = `${operation}:${code}`
    if (Date.now() - (seen.get(key) || 0) < 60_000) return
    seen.set(key, Date.now())
    sent++
    const rawSegment = location.pathname.split('/')[1] || 'home'
    const aliases: Record<string, string> = { products: 'bouquets', track: 'track-order' }
    const segment = aliases[rawSegment] || rawSegment
    const pages = ['home', 'bouquets', 'about', 'contact', 'gallery', 'track-order', 'receipt', 'letter', 'letter-v2', 'gift', 'town-preview']
    const page = pages.includes(segment) ? segment : 'other'
    const market = getActivePinia() ? useMarketStore().code : localStorage.getItem('stack-petals:market') === 'CA' ? 'CA' : 'PH'
    void supabase.functions.invoke('report-storefront-error', {
      body: { operation, code, page, market, device: innerWidth <= 700 ? 'mobile' : 'desktop' },
    }).catch(() => { /* Reporting must never interrupt or recursively report failures. */ })
  } catch { /* Tracking remains optional when storage or networking is unavailable. */ }
}

export function installErrorTracker(app: Pick<App, 'config'>) {
  const previousHandler = app.config.errorHandler
  app.config.errorHandler = (error, instance, info) => {
    reportStorefrontError('runtime', error)
    if (previousHandler) previousHandler(error, instance, info)
    else console.error(error)
  }
  window.addEventListener('error', event => { if (event.error) reportStorefrontError('runtime', event.error) })
  window.addEventListener('unhandledrejection', event => reportStorefrontError('runtime', event.reason))
}
