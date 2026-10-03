<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { PhMapPin as MapPin, PhArrowUpRight } from '@phosphor-icons/vue'
import { useMarketStore, type MarketCode } from '@/stores/market'
import { useCartStore } from '@/stores/cart'
import CodePatternToggle from '@/components/CodePatternToggle.vue'

defineProps<{ codePatternsEnabled: boolean }>()
const emit = defineEmits<{ 'update:codePatternsEnabled': [value: boolean] }>()

const route = useRoute()
const market = useMarketStore()
const cart = useCartStore()
const menuOpen = ref(false)
const header = ref<HTMLElement | null>(null)
const headerHeight = ref(78)
const menuTrigger = ref<HTMLButtonElement | null>(null)
const compactMarketLabels = ref(false)
let compactMarketQuery: MediaQueryList | undefined
let mobileMenuQuery: MediaQueryList | undefined
let lockedScrollY = 0
let hasScrollLock = false
let previousOverflowAnchor = ''
let anchorRestoreFrame: number | undefined

function releaseScrollLock(restorePosition = true) {
  if (!hasScrollLock) return
  hasScrollLock = false
  document.documentElement.classList.remove('site-menu-open')
  document.documentElement.style.removeProperty('--site-menu-scroll-offset')
  const restoreY = lockedScrollY
  // Wait for the placeholder to leave the DOM before restoring: otherwise
  // browser scroll anchoring subtracts the header height a second time.
  nextTick(() => {
    if (hasScrollLock) return
    if (restorePosition) {
      // Flush the restored header layout while automatic anchoring is disabled.
      header.value?.getBoundingClientRect()
      const previousBehavior = document.documentElement.style.scrollBehavior
      document.documentElement.style.scrollBehavior = 'auto'
      window.scrollTo(0, restoreY)
      document.documentElement.style.scrollBehavior = previousBehavior
    }
    anchorRestoreFrame = window.requestAnimationFrame(() => {
      document.documentElement.style.overflowAnchor = previousOverflowAnchor
      anchorRestoreFrame = undefined
    })
  })
}

const closeMenu = () => {
  menuOpen.value = false
}

const handleEscape = (event: KeyboardEvent) => {
  if (!menuOpen.value) return
  if (event.key === 'Escape') { event.preventDefault(); closeMenu(); menuTrigger.value?.focus({ preventScroll: true }); return }
  if (event.key === 'Tab') {
    const controls = Array.from(header.value?.querySelectorAll<HTMLElement>('a[href],button,select') || []).filter(element => element.getClientRects().length > 0)
    const first = controls[0], last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
}

function syncMobileMenu(event: MediaQueryListEvent) {
  if (!event.matches) closeMenu()
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
  if (isOpen) {
    if (anchorRestoreFrame !== undefined) {
      window.cancelAnimationFrame(anchorRestoreFrame)
      anchorRestoreFrame = undefined
    } else previousOverflowAnchor = document.documentElement.style.overflowAnchor
    document.documentElement.style.overflowAnchor = 'none'
    headerHeight.value = header.value?.offsetHeight || 78
    lockedScrollY = window.scrollY
    hasScrollLock = true
    document.documentElement.style.setProperty('--site-menu-scroll-offset', `-${lockedScrollY}px`)
    document.documentElement.classList.add('site-menu-open')
  } else releaseScrollLock()
}, { flush: 'sync' })

watch(
  () => route.fullPath,
  () => { releaseScrollLock(false); closeMenu() },
)

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
  compactMarketQuery = window.matchMedia('(max-width: 520px)')
  syncMarketLabelSize()
  compactMarketQuery.addEventListener('change', syncMarketLabelSize)
  mobileMenuQuery = window.matchMedia('(max-width: 960px)')
  mobileMenuQuery.addEventListener('change', syncMobileMenu)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape)
  compactMarketQuery?.removeEventListener('change', syncMarketLabelSize)
  mobileMenuQuery?.removeEventListener('change', syncMobileMenu)
  releaseScrollLock(false)
})
</script>

<template>
  <div v-if="menuOpen" class="site-header-placeholder" :style="{ height: `${headerHeight}px` }" aria-hidden="true"></div>
  <header ref="header" class="site-header" :style="{ '--site-header-height': `${headerHeight}px` }">
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
      ref="menuTrigger"
      class="nav-toggle"
      :class="{ open: menuOpen }"
      type="button"
      :aria-expanded="menuOpen"
      aria-controls="site-navigation"
      :aria-label="menuOpen ? 'Close navigation' : 'Open navigation'"
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
      <div class="mobile-code-preference">
        <span class="mobile-code-preference-label">Make yourself comfortable</span>
        <CodePatternToggle inline :model-value="codePatternsEnabled" @update:model-value="emit('update:codePatternsEnabled', $event)" />
      </div>
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

<style scoped>
.mobile-code-preference { display:none; }
@media(max-width:700px) {
  .mobile-code-preference { display:block; margin-top:24px; padding-top:21px; border-top:1px solid #e8d7cc; }
  .mobile-code-preference-label { display:block; margin-bottom:11px; color:#8b7167; font-size:9px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; }
}
</style>
