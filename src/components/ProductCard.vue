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
  <article class="card product-card">
    <button class="card-image-wrap" type="button" :aria-label="`View ${product.name}`" @click="preview.open(product)">
      <img
        :src="product.image"
        :alt="product.name"
        loading="lazy"
        decoding="async"
      />
      <div v-if="product.badge" class="card-badge">{{ product.badge }}</div>
      <span class="studio-product-discover">A closer look <span aria-hidden="true">↗</span></span>
    </button>
    <div class="card-body">
      <h3 :title="product.name"><button class="studio-product-name" type="button" @click="preview.open(product)">{{ product.name }}</button></h3>
      <p class="card-category">{{ product.category || 'Featured' }}</p>
      <div class="product-price" :class="{ sale: product.salePrice }">
        <span v-if="product.salePrice" class="sale-price">{{ product.salePrice }}</span>
        <span :class="{ 'original-price': product.salePrice }">{{ product.salePrice ? product.originalPrice : product.price }}</span>
      </div>
    </div>
    <div class="card-footer">
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
  </article>
</template>
