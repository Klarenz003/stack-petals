<script setup lang="ts">
import { PhX } from '@phosphor-icons/vue'

import type { Product } from '@/types'
import { useCartStore } from '@/stores/cart'
import { useFlyToCart } from '@/composables/useFlyToCart'
import { ref } from 'vue'
import { useDialogFocus } from '@/composables/useDialogFocus'

const props = defineProps<{ bouquet: Product }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const cart = useCartStore()
const { flyToCart } = useFlyToCart()
const panel = ref<HTMLElement | null>(null)
useDialogFocus(panel, () => true, () => emit('close'))

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

      <Transition name="preview-card" appear>
        <div ref="panel" class="preview-content" role="dialog" aria-modal="true" aria-labelledby="studio-preview-title" tabindex="-1" @click.stop>
          <button aria-label="Close product preview" class="preview-close" @click="emit('close')"><PhX :size="18" /></button>
          <img :src="bouquet.image" :alt="bouquet.name" />
          <span class="studio-eyebrow" style="margin-top: 22px">Made for a meaningful moment</span>
          <h2 id="studio-preview-title">{{ bouquet.name }}</h2>
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
