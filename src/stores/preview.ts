// src/stores/preview.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Product } from '@/types'

export const usePreviewStore = defineStore('preview', () => {
  const selectedBouquet = ref<Product | null>(null)

  function open(product: Product) {
    selectedBouquet.value = product
  }

  function close() {
    selectedBouquet.value = null
  }

  return { selectedBouquet, open, close }
})
