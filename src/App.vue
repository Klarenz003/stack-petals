<script setup lang="ts">
import { ref, watch, computed } from 'vue'
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
import CartNotification from '@/components/CartNotification.vue'

useCanvas()

const cart    = useCartStore()
const preview = usePreviewStore()
const route   = useRoute()

const isLetterPage = computed(() => route.name === 'letter')

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
  <template v-if="!isLetterPage">
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
    <CartNotification />
    <TheHeader />

    <Transition name="preview">
      <BouquetPreviewModal
        v-if="preview.selectedBouquet"
        :bouquet="preview.selectedBouquet"
        @close="preview.close()"
      />
    </Transition>

  <!-- Page slide transition -->
  <RouterView v-slot="{ Component }">
    <Transition :name="transitionName" mode="out-in">
      <component :is="Component" :key="route.name" />
    </Transition>
  </RouterView>
  <TheFooter />
  </template>
</template>