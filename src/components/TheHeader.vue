<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { PhMapPin as MapPin, PhArrowUpRight } from '@phosphor-icons/vue'
import { useMarketStore, type MarketCode } from '@/stores/market'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const market = useMarketStore()
const cart = useCartStore()
const menuOpen = ref(false)
const compactMarketLabels = ref(false)
let compactMarketQuery: MediaQueryList | undefined

const closeMenu = () => {
  menuOpen.value = false
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeMenu()
}

const syncMarketLabelSize = (event?: MediaQueryListEvent) => {
  compactMarketLabels.value = event?.matches ?? compactMarketQuery?.matches ?? false
}

function changeMarket(event: Event) {
  const nextMarket = (event.target as HTMLSelectElement).value as MarketCode
  if (nextMarket === market.code) return

  if (cart.cartItems.length && !window.confirm('Changing stores will clear your current cart. Continue?')) {
    ;(event.target as HTMLSelectElement).value = market.code
    return
  }

  if (cart.cartItems.length) cart.finishCheckout()
  market.setMarket(nextMarket)
}

watch(menuOpen, (isOpen) => {
  document.documentElement.classList.toggle('site-menu-open', isOpen)
})

watch(
  () => route.fullPath,
  closeMenu,
)

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
  compactMarketQuery = window.matchMedia('(max-width: 520px)')
  syncMarketLabelSize()
  compactMarketQuery.addEventListener('change', syncMarketLabelSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape)
  compactMarketQuery?.removeEventListener('change', syncMarketLabelSize)
  document.documentElement.classList.remove('site-menu-open')
})
</script>

<template>
  <header class="site-header">
    <RouterLink class="logo" to="/" aria-label="Stack Petals home">
      <img src="/images/stack-petals-floral-logo.png" alt="Stack Petals floral logo" />
      <span class="logo-lockup"><span class="logo-wordmark">Stack Petals</span><small>Flowers. Feelings. Forever.</small></span>
    </RouterLink>

    <label class="market-switcher">
      <MapPin :size="16" weight="regular" aria-hidden="true" />
      <span class="sr-only">Shopping region</span>
      <select :value="market.code" aria-label="Shopping region" @change="changeMarket">
        <option value="PH">{{ compactMarketLabels ? 'PH' : 'Philippines' }}</option>
        <option value="CA">{{ compactMarketLabels ? 'CA' : 'Canada' }}</option>
      </select>
    </label>

    <button
      class="nav-toggle"
      :class="{ open: menuOpen }"
      type="button"
      :aria-expanded="menuOpen"
      aria-controls="site-navigation"
      aria-label="Toggle navigation"
      @click="menuOpen = !menuOpen"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <nav id="site-navigation" :class="{ open: menuOpen }" aria-label="Primary navigation">
      <span class="mobile-nav-eyebrow">A little something meaningful</span>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/products">Shop</RouterLink>
      <RouterLink to="/about">About</RouterLink>
      <RouterLink to="/process">Process</RouterLink>
      <RouterLink to="/gallery">Gallery</RouterLink>
      <RouterLink to="/reviews">Reviews</RouterLink>
      <RouterLink to="/track">Track Order</RouterLink>
      <RouterLink to="/contact">Contact</RouterLink>
      <RouterLink class="mobile-nav-shop" to="/products">Find your gift <PhArrowUpRight :size="18" /></RouterLink>
    </nav>

    <button
      v-if="menuOpen"
      class="site-nav-backdrop"
      type="button"
      aria-label="Close navigation"
      @click="closeMenu"
    ></button>
  </header>
</template>
