<script setup lang="ts">
import type { Product } from '@/types'
import { useCartStore } from '@/stores/cart'
import { useFlyToCart } from '@/composables/useFlyToCart'

const props = defineProps<{ bouquet: Product }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const cart = useCartStore()
const { flyToCart } = useFlyToCart()

function isPreorder(product: Product) {
  return (product.stock ?? 0) <= 0
}

function addAndClose(event: MouseEvent) {
  const shouldAnimate = cart.shouldAnimateAddToCart(props.bouquet)
  const added = cart.addToCart(props.bouquet)
  if (added && shouldAnimate) flyToCart(event)
  if (added) emit('close')
}
</script>

<template>
  <Transition name="preview" appear>
    <div class="preview-overlay" @click="emit('close')">
      <button class="preview-close" @click.stop="emit('close')">✕</button>

      <Transition name="preview-card" appear>
        <div class="preview-content" @click.stop>
          <img :src="bouquet.image" :alt="bouquet.name" />
          <h2>{{ bouquet.name }}</h2>
          <p>{{ bouquet.price }}</p>
          <div v-if="isPreorder(bouquet)" class="preorder-note preview-preorder-note">
            <strong>Available for Pre-order</strong>
            <span>Estimated prep time: 3-5 days</span>
          </div>
          <button class="co-btn-primary preorder-preview-btn" :disabled="!cart.canAddToCart(bouquet)" @click="addAndClose">
            {{ cart.canAddToCart(bouquet) ? (isPreorder(bouquet) ? 'Pre-order Now' : 'Add to Cart') : (cart.cartQuantity(bouquet) > 0 ? 'In Cart' : 'Out of Stock') }}
          </button>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
