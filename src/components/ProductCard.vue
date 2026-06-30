<script setup lang="ts">
import type { Product } from '@/types'
import { useCartStore } from '@/stores/cart'
import { usePreviewStore } from '@/stores/preview'
import { useFlyToCart } from '@/composables/useFlyToCart'

defineProps<{ product: Product }>()

const cart = useCartStore()
const preview = usePreviewStore()
const { flyToCart } = useFlyToCart()

function isPreorder(product: Product) {
  return (product.stock ?? 0) <= 0
}

function handleAddToCart(product: Product, event: MouseEvent) {
  const shouldAnimate = cart.shouldAnimateAddToCart(product)
  const added = cart.addToCart(product)
  if (added && shouldAnimate) flyToCart(event)
}
</script>

<template>
  <div class="card">
    <img
      :src="product.image"
      :alt="product.name"
      @click="preview.open(product)"
    />
    <div v-if="product.badge" class="card-badge">{{ product.badge }}</div>
    <h3>{{ product.name }}</h3>
    <p v-if="product.category" class="card-category">{{ product.category }}</p>
    <p>{{ product.price }}</p>
    <div v-if="isPreorder(product)" class="preorder-note">
      <strong>Available for Pre-order</strong>
      <span>Estimated prep time: 3-5 days</span>
    </div>
    <button
      class="add-to-cart-btn"
      :class="{ preorder: isPreorder(product) }"
      :disabled="!cart.canAddToCart(product)"
      @click="handleAddToCart(product, $event)"
    >
      {{ cart.canAddToCart(product) ? (isPreorder(product) ? 'Pre-order Now' : 'Add to Cart') : (cart.cartQuantity(product) > 0 ? 'In Cart' : 'Out of Stock') }}
    </button>
  </div>
</template>
