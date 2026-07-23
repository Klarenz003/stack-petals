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
  const shouldAnimate = cart.shouldAnimateAddToCart(product)
  const added = cart.addToCart(product)
  if (added && shouldAnimate) flyToCart(event)
}
</script>

<template>
  <div class="card">
    <div class="card-image-wrap" @click="preview.open(product)">
      <img
        :src="product.image"
        :alt="product.name"
      />
      <div v-if="product.badge" class="card-badge">{{ product.badge }}</div>
    </div>
    <div class="card-body">
      <h3>{{ product.name }}</h3>
      <p class="card-category">{{ product.category || 'Featured' }}</p>
      <div class="product-price" :class="{ sale: product.salePrice }">
        <span v-if="product.salePrice" class="sale-price">{{ product.salePrice }}</span>
        <span :class="{ 'original-price': product.salePrice }">{{ product.salePrice ? product.originalPrice : product.price }}</span>
      </div>
    </div>
    <div v-if="cart.isProductPreOrder(product)" class="preorder-note">
      <strong>Available for Pre-order</strong>
      <span>Estimated prep time: {{ product.prepDays ?? 5 }} day{{ (product.prepDays ?? 5) === 1 ? '' : 's' }}</span>
      <span v-if="product.deliveryRestrictions">{{ product.deliveryRestrictions }}</span>
    </div>
    <button
      class="add-to-cart-btn"
      :class="{ preorder: cart.isProductPreOrder(product) }"
      :disabled="!cart.canAddToCart(product)"
      @click="handleAddToCart(product, $event)"
    >
      {{ cart.canAddToCart(product) ? (cart.isProductPreOrder(product) ? 'Pre-order Now' : 'Add to Cart') : (cart.cartQuantity(product) > 0 ? 'In Cart' : 'Out of Stock') }}
    </button>
  </div>
</template>
