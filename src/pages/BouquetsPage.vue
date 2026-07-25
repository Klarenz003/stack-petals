<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import ProductCard from '@/components/ProductCard.vue'

const baseFilters = [
  'All',
  'Romance',
  'Birthday',
  'Anniversary',
  'Celebration',
  'Sympathy',
]

const extraFilters = [
  'Graduation',
  'Thank You',
  'Apology',
  'Get Well',
  'Friendship',
  'Home Decor',
  'Keepsakes',
  'Accessories',
  'Custom Gifts',
]
const activeFilter = ref('All')
const isMoreOpen = ref(false)
const productsStore = useProductsStore()

onMounted(() => {
  productsStore.fetchProducts()
})

const filteredProducts = computed(() =>
  productsStore.productsByCategory(activeFilter.value)
)

const filters = computed(() => {
  const productCategories = productsStore.allProducts
    .map(product => product.category?.trim())
    .filter((category): category is string => Boolean(category))

  return Array.from(new Set([...baseFilters, ...extraFilters, ...productCategories]))
})

const visibleFilters = computed(() => filters.value.filter(filter => baseFilters.includes(filter)))
const overflowFilters = computed(() => filters.value.filter(filter => !baseFilters.includes(filter)))

const moreFilterValue = computed({
  get: () => overflowFilters.value.includes(activeFilter.value) ? activeFilter.value : '',
  set: value => {
    if (value) activeFilter.value = value
  },
})

function selectFilter(filter: string) {
  activeFilter.value = filter
  isMoreOpen.value = false
}

function syncMoreOpen(event: Event) {
  isMoreOpen.value = (event.target as HTMLDetailsElement).open
}
</script>

<template>
  <div class="page-section">
    <div class="page-hero">
      <h1>Our <span>Products</span></h1>
      <p>Every gift is handcrafted with intention, care, and a little bit of code.</p>
    </div>

    <div class="filter-bar">
      <button
        v-for="f in visibleFilters"
        :key="f"
        :class="['filter-btn', { active: activeFilter === f }]"
        @click="selectFilter(f)"
      >
        {{ f }}
      </button>
      <details
        v-if="overflowFilters.length"
        class="filter-more"
        :open="isMoreOpen"
        @toggle="syncMoreOpen"
      >
        <summary :class="['filter-btn more-filter-btn', { active: moreFilterValue }]">
          {{ moreFilterValue || 'More categories' }}
        </summary>
        <div class="filter-menu">
          <button
            v-for="f in overflowFilters"
            :key="f"
            type="button"
            :class="{ active: activeFilter === f }"
            @click="selectFilter(f)"
          >
            {{ f }}
          </button>
        </div>
      </details>
    </div>

    <p class="product-result-line">
      {{ filteredProducts.length }} {{ filteredProducts.length === 1 ? 'item' : 'items' }}
      <span v-if="activeFilter !== 'All'">in {{ activeFilter }}</span>
    </p>

    <!-- TransitionGroup animates cards in/out when filter changes -->
    <TransitionGroup
      name="cards"
      tag="div"
      class="grid wide-grid"
    >
      <ProductCard v-for="product in filteredProducts" :key="product.id || product.name" :product="product" />
    </TransitionGroup>

    <div v-if="!filteredProducts.length" class="product-empty-state">
      <h2>No products here yet</h2>
      <p>Try another category or check back soon for new handcrafted pieces.</p>
    </div>
  </div>
</template>
