<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import ProductCard from '@/components/ProductCard.vue'

const filters = ['All', 'Romance', 'Birthday', 'Sympathy', 'Celebration']
const activeFilter = ref('All')
const productsStore = useProductsStore()

onMounted(() => {
  productsStore.fetchProducts()
})

const filteredProducts = computed(() =>
  productsStore.productsByCategory(activeFilter.value)
)
</script>

<template>
  <div class="page-section">
    <div class="page-hero">
      <h1>Our <span>Bouquets</span></h1>
      <p>Every arrangement is handcrafted with intention and care.</p>
    </div>

    <div class="filter-bar">
      <button
        v-for="f in filters"
        :key="f"
        :class="['filter-btn', { active: activeFilter === f }]"
        @click="activeFilter = f"
      >
        {{ f }}
      </button>
    </div>

    <!-- TransitionGroup animates cards in/out when filter changes -->
    <TransitionGroup
      name="cards"
      tag="div"
      class="grid wide-grid"
    >
      <ProductCard v-for="product in filteredProducts" :key="product.name" :product="product" />
    </TransitionGroup>
  </div>
</template>
