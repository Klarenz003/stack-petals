<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
</script>

<template>
  <div v-if="cart.cartOpen" class="cart-overlay" @click.self="cart.cartOpen = false">
    <div class="cart-panel">
      <button class="close-btn" aria-label="Close cart" @click="cart.cartOpen = false">x</button>
      <h2>Your Cart</h2>

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
              <button @click="cart.updateQuantity(index, -1)">-</button>
              <span>{{ item.quantity }}</span>
              <button @click="cart.updateQuantity(index, 1)">+</button>
            </div>
          </div>
          <button class="remove-btn" aria-label="Remove item" @click="cart.removeFromCart(index)">x</button>
        </div>
      </div>

      <div v-if="cart.cartItems.length > 0" class="cart-footer">
        <div class="cart-total">
          <span>Item subtotal</span>
          <strong>{{ cart.cartSubtotal }}</strong>
        </div>
        <p class="cart-checkout-note">Pickup or delivery fee is finalized during checkout.</p>
        <button class="checkout-btn" @click="cart.openCheckout()">
          Checkout
        </button>
      </div>
    </div>
  </div>
</template>
