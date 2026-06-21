<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCanvas } from '@/composables/useCanvas'
import { useCartStore } from '@/stores/cart'
import { usePreviewStore } from '@/stores/preview'
import { routeOrder } from '@/router'
import TheHeader from '@/components/TheHeader.vue'
import TheFooter from '@/components/TheFooter.vue'
import CartSidebar from '@/components/CartSidebar.vue'
import CheckoutModal from '@/components/CheckoutModal.vue'
import BouquetPreviewModal from '@/components/BouquetPreviewModal.vue'

useCanvas()

const cart    = useCartStore()
const preview = usePreviewStore()
const route   = useRoute()

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
  <canvas id="circuit-canvas"></canvas>
  <canvas id="petal-canvas"></canvas>

  <button class="cart-btn" @click="cart.cartOpen = true" title="View Cart">
    <img src="/images/cart-icon.png" alt="Cart" width="28" height="28" />
    <span v-if="cart.cartItems.length > 0" class="cart-count">
      {{ cart.cartItems.length }}
    </span>
  </button>

  <CartSidebar />
  <CheckoutModal />
  <TheHeader />

  <!-- Page slide transition -->
  <RouterView v-slot="{ Component }">
    <Transition :name="transitionName" mode="out-in">
      <component :is="Component" :key="route.name" />
    </Transition>
  </RouterView>

  <BouquetPreviewModal
    v-if="preview.selectedBouquet"
    :bouquet="preview.selectedBouquet"
    @close="preview.close()"
  />

  <TheFooter />
</template>

<style>
/* ── Page slide transitions ── */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              opacity   0.35s ease;
}

/* Going forward (Home → Bouquets → About …) */
.slide-left-enter-from  { transform: translateX(48px);  opacity: 0; }
.slide-left-enter-to    { transform: translateX(0);      opacity: 1; }
.slide-left-leave-from  { transform: translateX(0);      opacity: 1; }
.slide-left-leave-to    { transform: translateX(-48px);  opacity: 0; }

/* Going backward (Contact → Reviews → Gallery …) */
.slide-right-enter-from { transform: translateX(-48px); opacity: 0; }
.slide-right-enter-to   { transform: translateX(0);     opacity: 1; }
.slide-right-leave-from { transform: translateX(0);     opacity: 1; }
.slide-right-leave-to   { transform: translateX(48px);  opacity: 0; }
</style>