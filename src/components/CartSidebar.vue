<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
const cart = useCartStore()
</script>

<template>
  <div v-if="cart.cartOpen" class="cart-overlay" @click.self="cart.cartOpen = false">
    <div class="cart-panel">
      <button class="close-btn" @click="cart.cartOpen = false">✕</button>
      <h2>Your Cart</h2>

      <p v-if="cart.cartItems.length === 0" class="cart-empty">Your cart is empty.</p>

  <div v-for="(item, index) in cart.cartItems" :key="item.name" class="cart-item">
    <img :src="item.image" :alt="item.name" />
    <div class="cart-item-info">
      <span class="cart-item-name">{{ item.name }}</span>
      <span class="cart-item-price">{{ item.price }}</span>
      <div class="qty-controls">
        <button @click="cart.updateQuantity(index, -1)">−</button>
        <span>{{ item.quantity }}</span>
        <button @click="cart.updateQuantity(index, 1)">+</button>
      </div>
    </div>
    <button class="remove-btn" @click="cart.removeFromCart(index)">✕</button>
  </div>

      <div v-if="cart.cartItems.length > 0" class="cart-total">
        Total: {{ cart.cartTotal }}
      </div>
      <button
        v-if="cart.cartItems.length > 0"
        class="checkout-btn"
        @click="cart.openCheckout()"
      >
        Checkout
      </button>
    </div>
  </div>
</template>
