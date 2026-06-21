<script setup lang="ts">
import type { Product } from '@/types'
import { useCartStore } from '@/stores/cart'
import { useFlyToCart } from '@/composables/useFlyToCart'

const props = defineProps<{ bouquet: Product }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const cart = useCartStore()
const { flyToCart } = useFlyToCart()

function addAndClose(event: MouseEvent) {
  flyToCart(event)
  cart.addToCart(props.bouquet)
  emit('close')
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
          <button class="co-btn-primary" style="margin-top:16px" @click="addAndClose">
            Add to Cart
          </button>
        </div>
      </Transition>
    </div>
  </Transition>
</template>