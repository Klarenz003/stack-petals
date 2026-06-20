<script setup lang="ts">
import { useCanvas } from '@/composables/useCanvas'
import { useCartStore } from '@/stores/cart'
import { usePreviewStore } from '@/stores/preview'
import TheHeader from '@/components/TheHeader.vue'
import TheFooter from '@/components/TheFooter.vue'
import CartSidebar from '@/components/CartSidebar.vue'
import CheckoutModal from '@/components/CheckoutModal.vue'
import BouquetPreviewModal from '@/components/BouquetPreviewModal.vue'

// Initialise canvas animation
useCanvas()

const cart = useCartStore()
const preview = usePreviewStore()
</script>

<template>
  <!-- Background canvases (always visible) -->
  <canvas id="circuit-canvas"></canvas>
  <canvas id="petal-canvas"></canvas>

  <!-- Floating cart button -->
  <button class="cart-btn" @click="cart.cartOpen = true" title="View Cart">
    <img src="/images/cart-icon.png" alt="Cart" width="28" height="28" />
    <span v-if="cart.cartItems.length > 0" class="cart-count">
      {{ cart.cartItems.length }}
    </span>
  </button>

  <!-- Cart sidebar -->
  <CartSidebar />

  <!-- Checkout modal -->
  <CheckoutModal />

  <!-- App shell -->
  <TheHeader />
  <RouterView />

  <!-- Bouquet preview modal -->
  <BouquetPreviewModal
    v-if="preview.selectedBouquet"
    :bouquet="preview.selectedBouquet"
    @close="preview.close()"
  />

  <TheFooter />
</template>
