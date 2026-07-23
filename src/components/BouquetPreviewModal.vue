<script setup lang="ts">
import type { Product } from '@/types'
import { useCartStore } from '@/stores/cart'
import { useFlyToCart } from '@/composables/useFlyToCart'

const props = defineProps<{ bouquet: Product }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const cart = useCartStore()
const { flyToCart } = useFlyToCart()

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
          <div class="product-price preview-price" :class="{ sale: bouquet.salePrice }">
            <span v-if="bouquet.salePrice" class="sale-price">{{ bouquet.salePrice }}</span>
            <span :class="{ 'original-price': bouquet.salePrice }">{{ bouquet.salePrice ? bouquet.originalPrice : bouquet.price }}</span>
          </div>
          <div v-if="cart.isProductPreOrder(bouquet)" class="preorder-note preview-preorder-note">
            <strong>Available for Pre-order</strong>
            <span>Estimated prep time: {{ bouquet.prepDays ?? 5 }} day{{ (bouquet.prepDays ?? 5) === 1 ? '' : 's' }}</span>
            <span v-if="bouquet.deliveryRestrictions">{{ bouquet.deliveryRestrictions }}</span>
          </div>
          <button class="co-btn-primary preorder-preview-btn" :disabled="!cart.canAddToCart(bouquet)" @click="addAndClose">
            {{ cart.canAddToCart(bouquet) ? (cart.isProductPreOrder(bouquet) ? 'Pre-order Now' : 'Add to Cart') : (cart.cartQuantity(bouquet) > 0 ? 'In Cart' : 'Out of Stock') }}
          </button>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
