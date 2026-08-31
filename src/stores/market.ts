import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type MarketCode = 'PH' | 'CA'

type MarketConfig = {
  code: MarketCode
  name: string
  shortName: string
  currency: 'PHP' | 'CAD'
  locale: 'en-PH' | 'en-CA'
}

const MARKET_STORAGE_KEY = 'stack-petals:market'

export const marketConfigs: Record<MarketCode, MarketConfig> = {
  PH: {
    code: 'PH',
    name: 'Philippines',
    shortName: 'PH',
    currency: 'PHP',
    locale: 'en-PH',
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    shortName: 'CA',
    currency: 'CAD',
    locale: 'en-CA',
  },
}

function storedMarket(): MarketCode | null {
  const value = localStorage.getItem(MARKET_STORAGE_KEY)?.toUpperCase()
  return value === 'CA' || value === 'PH' ? value : null
}

function localeMarket(): MarketCode {
  const locales = navigator.languages?.length ? navigator.languages : [navigator.language]
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const looksCanadian = locales.some(locale => /-(CA)$/i.test(locale))
    || /^(America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina))$/.test(timeZone)

  return looksCanadian ? 'CA' : 'PH'
}

export const useMarketStore = defineStore('market', () => {
  const savedMarket = storedMarket()
  const code = ref<MarketCode>(savedMarket || localeMarket())
  const hasCustomerChoice = ref(Boolean(savedMarket))
  const detecting = ref(false)

  const current = computed(() => marketConfigs[code.value])

  function setMarket(nextMarket: MarketCode, remember = true) {
    if (nextMarket !== 'PH' && nextMarket !== 'CA') return
    code.value = nextMarket
    if (remember) {
      localStorage.setItem(MARKET_STORAGE_KEY, nextMarket)
      hasCustomerChoice.value = true
    }
  }

  function formatMoney(amount: number) {
    return new Intl.NumberFormat(current.value.locale, {
      style: 'currency',
      currency: current.value.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  async function detectMarket() {
    if (hasCustomerChoice.value || detecting.value) return
    detecting.value = true

    try {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 1800)
      const response = await fetch('/cdn-cgi/trace', {
        cache: 'no-store',
        signal: controller.signal,
      })
      window.clearTimeout(timeout)

      if (response.ok) {
        const trace = await response.text()
        const country = trace.match(/^loc=([A-Z]{2})$/m)?.[1]
        if (country === 'CA' || country === 'PH') setMarket(country, false)
      }
    } catch {
      // Locale and time zone already provide the non-blocking fallback.
    } finally {
      detecting.value = false
    }
  }

  return {
    code,
    current,
    detecting,
    hasCustomerChoice,
    setMarket,
    formatMoney,
    detectMarket,
  }
})
