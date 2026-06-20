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

      <div v-for="(item, index) in cart.cartItems" :key="index" class="cart-item">
        <img :src="item.image" :alt="item.name" />
        <div class="cart-item-info">
          <div class="cart-item-name">{{ item.name }}</div>
          <div class="cart-item-price">{{ item.price }}</div>
        </div>
        <button class="cart-item-remove" @click="cart.removeFromCart(index)">✕</button>
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
