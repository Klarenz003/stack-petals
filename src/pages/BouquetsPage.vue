<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import ProductCard from '@/components/ProductCard.vue'
import { PhMagnifyingGlass, PhArrowUpRight } from '@phosphor-icons/vue'

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
const route = useRoute()
const search = ref('')
const sort = ref('featured')

onMounted(() => {
  productsStore.fetchProducts()
})

const filteredProducts = computed(() => {
  const term = search.value.trim().toLowerCase()
  const matching = productsStore.productsByCategory(activeFilter.value).filter(product =>
    !term || [product.name, product.category, product.badge].some(value => String(value || '').toLowerCase().includes(term)),
  )
  return [...matching].sort((a, b) => {
    if (sort.value === 'price-low') return (a.salePriceAmount ?? a.priceAmount ?? 0) - (b.salePriceAmount ?? b.priceAmount ?? 0)
    if (sort.value === 'price-high') return (b.salePriceAmount ?? b.priceAmount ?? 0) - (a.salePriceAmount ?? a.priceAmount ?? 0)
    if (sort.value === 'name') return a.name.localeCompare(b.name)
    return Number(Boolean(b.featured)) - Number(Boolean(a.featured))
  })
})

function resetBrowsing() { search.value = ''; activeFilter.value = 'All'; sort.value = 'featured' }

const filters = computed(() => {
  const productCategories = productsStore.allProducts
    .map(product => product.category?.trim())
    .filter((category): category is string => Boolean(category))

  return Array.from(new Set([...baseFilters, ...extraFilters, ...productCategories]))
})
watch(() => route.query.occasion, value => {
  activeFilter.value = typeof value === 'string' && filters.value.includes(value) ? value : 'All'
}, { immediate: true })

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
  <div class="page-section collection-page">
    <div class="page-hero">
      <span class="studio-eyebrow">The collection · Made by hand, given from the heart</span>
      <h1>A gift for <span>every feeling.</span></h1>
      <p>Every gift is handcrafted with intention, care, and a little bit of code.</p>
      <RouterLink to="/process" class="studio-text-link">Discover the keepsake experience <PhArrowUpRight :size="17" /></RouterLink>
    </div>

    <div class="studio-catalog-tools"><label class="studio-catalog-search"><PhMagnifyingGlass :size="19" aria-hidden="true" /><input v-model="search" type="search" placeholder="Find your flowers, occasion, or keepsake…" aria-label="Search the collection" /></label><label class="studio-catalog-sort"><span>Sort by</span><select v-model="sort"><option value="featured">Featured first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option></select></label></div>
    <div class="filter-bar">
      <button
        v-for="f in visibleFilters"
        :key="f"
        :class="['filter-btn', { active: activeFilter === f }]"
        :aria-pressed="activeFilter === f"
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

    <div v-if="productsStore.fetchError" class="studio-fetch-notice" role="alert"><p>{{ productsStore.fetchError }}</p><button @click="productsStore.fetchProducts()" :disabled="productsStore.loading">Try again</button></div>
    <p class="product-result-line" aria-live="polite">
      {{ filteredProducts.length }} {{ filteredProducts.length === 1 ? 'item' : 'items' }}
      <span v-if="activeFilter !== 'All'">in {{ activeFilter }}</span>
      <button v-if="search || activeFilter !== 'All'" class="studio-clear-filters" @click="resetBrowsing">Reset filters</button>
    </p>

    <div v-if="productsStore.loading" class="grid wide-grid product-skeleton-grid" aria-busy="true">
      <div v-for="index in 6" :key="index" class="product-skeleton-card">
        <span></span>
        <div>
          <i></i>
          <i></i>
          <i></i>
        </div>
      </div>
    </div>

    <!-- TransitionGroup animates cards in/out when filter changes -->
    <TransitionGroup
      v-else
      name="cards"
      tag="div"
      class="grid wide-grid"
    >
      <ProductCard v-for="product in filteredProducts" :key="product.id || product.name" :product="product" />
    </TransitionGroup>

    <div v-if="!productsStore.loading && !filteredProducts.length" class="product-empty-state">
      <span>A fresh start</span>
      <h2>{{ search ? 'No gifts match just yet.' : 'Something lovely is on its way.' }}</h2>
      <p>Try another name or occasion, or explore the rest of our collection.</p>
      <div class="product-empty-actions">
        <button type="button" class="co-btn-primary" @click="resetBrowsing">Explore all gifts</button>
        <RouterLink class="co-btn-outline" to="/contact">Request Custom Piece</RouterLink>
      </div>
    </div>
  </div>
</template>
