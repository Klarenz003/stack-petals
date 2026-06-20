<script setup lang="ts">
import type { Product } from '@/types'
import { useCartStore } from '@/stores/cart'
import { usePreviewStore } from '@/stores/preview'
import { useFlyToCart } from '@/composables/useFlyToCart'

defineProps<{ product: Product }>()

const cart = useCartStore()
const preview = usePreviewStore()
const { flyToCart } = useFlyToCart()

function handleAddToCart(product: Product, event: MouseEvent) {
  flyToCart(event)
  cart.addToCart(product)
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
    <button class="add-to-cart-btn" @click="handleAddToCart(product, $event)">
      Add to Cart
    </button>
  </div>
</template>
