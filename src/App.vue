<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { gsap } from 'gsap'
import { useRoute } from 'vue-router'
import { useCodePatternPreference } from '@/composables/useCodePatternPreference'
import { useCartStore } from '@/stores/cart'
import { usePreviewStore } from '@/stores/preview'
import { useMarketStore } from '@/stores/market'
import { routeOrder } from '@/router'
import TheHeader from '@/components/TheHeader.vue'
import TheFooter from '@/components/TheFooter.vue'
import CartSidebar from '@/components/CartSidebar.vue'
import CheckoutModal from '@/components/CheckoutModal.vue'
import BouquetPreviewModal from '@/components/BouquetPreviewModal.vue'
import CartNotification from '@/components/CartNotification.vue'
import PetalCodeBackground from '@/components/PetalCodeBackground.vue'
import CodePatternToggle from '@/components/CodePatternToggle.vue'
import AppLoadingScreen from '@/components/AppLoadingScreen.vue'
import SiteChatbot from '@/components/SiteChatbot.vue'

const codePatternsEnabled = useCodePatternPreference()

const cart    = useCartStore()
const preview = usePreviewStore()
const market  = useMarketStore()
const route   = useRoute()

const isLetterPage = computed(() => Boolean(route.meta.hideNav))
const STARTUP_LOADER_KEY = 'stack-petals:startup-ready:v1'
const startupAssets = [
  '/images/background.png',
  '/images/stack-petals-floral-logo.png',
  '/images/cart-icon.png',
  '/images/home-experience/bouquet-qr-guide.png',
  '/images/home-experience/phone-frame.png',
  '/images/home-experience/keepsafe-page.png',
  '/images/engineered-icon.png',
  '/images/crafted-icon.png',
  '/images/delivered-icon.png',
]
const showStartupLoader = ref(
  !isLetterPage.value && sessionStorage.getItem(STARTUP_LOADER_KEY) !== 'ready',
)

onMounted(() => market.detectMarket())

function finishStartupLoading() {
  sessionStorage.setItem(STARTUP_LOADER_KEY, 'ready')
  showStartupLoader.value = false
}

function revealPage(element: Element) {
  if (isLetterPage.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  gsap.fromTo(element, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.46, ease: 'power2.out', clearProps: 'transform,opacity' })
}

// 'slide-left' when going forward, 'slide-right' when going back
const transitionName = ref('slide-left')

watch(
  () => route.name,
  (to, from) => {
    const toOrder   = routeOrder[to   as string] ?? 0
    const fromOrder = routeOrder[from as string] ?? 0
    transitionName.value = toOrder > fromOrder ? 'slide-left' : 'slide-right'
  }
)
</script>

<template>
  <div :class="isLetterPage ? 'keepsake-shell' : 'storefront-shell'">
  <a v-if="!isLetterPage" class="storefront-skip-link" href="#storefront-content">Skip to content</a>
  <AppLoadingScreen
    v-if="showStartupLoader"
    :assets="startupAssets"
    @ready="finishStartupLoading"
  />

  <template v-if="!isLetterPage">
    <PetalCodeBackground v-if="codePatternsEnabled" />
    <CodePatternToggle v-model="codePatternsEnabled" />

    <button class="cart-btn" type="button" @click="cart.cartOpen = true" title="Your gift bag" :aria-label="`Open gift bag, ${cart.cartItems.reduce((total, item) => total + item.quantity, 0)} items`" aria-haspopup="dialog" :aria-expanded="cart.cartOpen">
      <img src="/images/cart-icon.png" alt="" width="40" height="40" aria-hidden="true" />
      <span v-if="cart.cartItems.length > 0" class="cart-count">
        {{ cart.cartItems.reduce((total, item) => total + item.quantity, 0) }}
      </span>
    </button>

    <CartSidebar />
    <CheckoutModal />
    <CartNotification />
    <SiteChatbot />
    <TheHeader v-model:code-patterns-enabled="codePatternsEnabled" />

    <Transition name="preview">
      <BouquetPreviewModal
        v-if="preview.selectedBouquet"
        :bouquet="preview.selectedBouquet"
        @close="preview.close()"
      />
    </Transition>
  </template>

  <!-- Always rendered -->
  <div id="storefront-content" :class="{ 'storefront-content': !isLetterPage }" tabindex="-1">
  <RouterView v-slot="{ Component }">
    <!-- Letter renderers swap roots after loading and manage their own animations.
         Route CSS transitions can leave the async renderer invisible on that swap. -->
    <component v-if="isLetterPage" :is="Component" :key="route.name" />
    <Transition v-else :name="transitionName" mode="out-in" @after-enter="revealPage">
      <component :is="Component" :key="route.name" />
    </Transition>
  </RouterView>
  </div>

  <!-- Footer only on non-letter pages -->
  <TheFooter v-if="!isLetterPage" />
  </div>
</template>
