<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
const cart = useCartStore()
</script>

<template>
  <Transition name="fade-scale">
    <div v-if="cart.notification" class="cart-notification-overlay">
      <div class="cart-notification">{{ cart.notification }}</div>
    </div>
  </Transition>
</template>

<style scoped>
.cart-notification-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1000;
}

.cart-notification {
  background-color: rgba(40, 40, 40, 0.92);
  color: #fff;
  padding: 14px 28px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  text-align: center;
  max-width: 320px;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>