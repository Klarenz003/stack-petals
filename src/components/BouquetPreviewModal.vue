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
          <p>{{ bouquet.price }}</p>
          <button class="co-btn-primary" style="margin-top:16px" :disabled="!cart.canAddToCart(bouquet)" @click="addAndClose">
            {{ cart.canAddToCart(bouquet) ? 'Add to Cart' : (cart.cartQuantity(bouquet) > 0 ? 'In Cart' : 'Out of Stock') }}
          </button>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
