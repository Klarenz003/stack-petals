<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref } from 'vue'
import { PhX, PhTrash, PhArrowRight } from '@phosphor-icons/vue'
import { useDialogFocus } from '@/composables/useDialogFocus'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
const panel = ref<HTMLElement | null>(null)
useDialogFocus(panel, () => cart.cartOpen, () => { cart.cartOpen = false })
</script>

<template>
  <div v-if="cart.cartOpen" class="cart-overlay" @click.self="cart.cartOpen = false">
    <div ref="panel" class="cart-panel" role="dialog" aria-modal="true" aria-labelledby="studio-cart-title" tabindex="-1">
      <button class="close-btn" aria-label="Close cart" @click="cart.cartOpen = false"><PhX :size="18" /></button>
      <span class="studio-eyebrow cart-studio-eyebrow">Your next thoughtful gesture</span>
      <h2 id="studio-cart-title">The gift bag.</h2>

      <div v-if="cart.cartItems.length === 0" class="cart-empty-state">
        <span>Stack Petals</span>
        <h3>Your cart is waiting to bloom.</h3>
        <p>Choose a handcrafted piece and add the QR letter experience during checkout.</p>
        <RouterLink class="cart-empty-link" to="/products" @click="cart.cartOpen = false">
          Browse Products
        </RouterLink>
      </div>

      <div v-if="cart.cartItems.length > 0" class="cart-items-list">
        <div v-for="(item, index) in cart.cartItems" :key="item.name" class="cart-item">
          <img :src="item.image" :alt="item.name" />
          <div class="cart-item-info">
            <div class="cart-item-name">{{ item.name }}</div>
            <div v-if="item.preOrder" class="cart-preorder-label">Pre-order - 3-5 days prep</div>
            <div class="cart-item-price" :class="{ sale: item.salePrice }">
              <span v-if="item.salePrice" class="sale-price">{{ item.salePrice }}</span>
              <span :class="{ 'original-price': item.salePrice }">{{ item.salePrice ? item.originalPrice : item.price }}</span>
            </div>
            <div class="qty-controls">
              <button :aria-label="`Decrease quantity of ${item.name}`" @click="cart.updateQuantity(index, -1)">−</button>
              <span>{{ item.quantity }}</span>
              <button :aria-label="`Increase quantity of ${item.name}`" @click="cart.updateQuantity(index, 1)">+</button>
            </div>
          </div>
          <button class="remove-btn" :aria-label="`Remove ${item.name}`" @click="cart.removeFromCart(index)"><PhTrash :size="17" /></button>
        </div>
      </div>

      <div v-if="cart.cartItems.length > 0" class="cart-footer">
        <div class="cart-total">
          <span>Item subtotal</span>
          <strong>{{ cart.cartSubtotal }}</strong>
        </div>
        <p class="cart-checkout-note">Pickup or delivery fee is finalized during checkout.</p>
        <button class="checkout-btn" @click="cart.openCheckout()">
          Make it personal <PhArrowRight :size="18" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>
