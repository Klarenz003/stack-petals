<script setup lang="ts">
import { ref, computed } from 'vue'
import ProductCard from '@/components/ProductCard.vue'
import type { Product } from '@/types'

const filters = ['All', 'Romance', 'Birthday', 'Sympathy', 'Celebration']
const activeFilter = ref('All')

const products: Product[] = [
  { name: 'Blush Symphony',    price: '₱5,000.00', image: '/images/b1.png', category: 'Romance',     badge: 'Best Seller' },
  { name: 'Code & Petals',     price: '₱5,699.00', image: '/images/b2.png', category: 'Celebration', badge: null          },
  { name: 'Pink Algorithm',    price: '₱4,500.00', image: '/images/b3.png', category: 'Birthday',    badge: null          },
  { name: 'Lavender Logic',    price: '₱5,399.00', image: '/images/b4.png', category: 'Romance',     badge: null          },
  { name: 'Soft Compile',      price: '₱5,000.00', image: '/images/b1.png', category: 'Sympathy',    badge: null          },
  { name: 'Binary Blossom',    price: '₱6,599.00', image: '/images/b2.png', category: 'Celebration', badge: 'New'         },
  { name: 'Debug in Bloom',    price: '₱4,200.00', image: '/images/b3.png', category: 'Birthday',    badge: null          },
  { name: 'Null Pointer Rose', price: '₱3,899.00', image: '/images/b4.png', category: 'Sympathy',    badge: null          },
]

const filteredProducts = computed(() => {
  if (activeFilter.value === 'All') return products
  return products.filter(p => p.category === activeFilter.value)
})
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
      <ProductCard
        v-for="product in filteredProducts"
        :key="product.name"
        :product="product"
      />
    </TransitionGroup>
  </div>
</template>
