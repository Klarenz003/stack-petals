<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import ProductCard from '@/components/ProductCard.vue'
import type { Feature } from '@/types'

const router = useRouter()
const products = useProductsStore()

onMounted(() => {
  products.fetchProducts()
})

const features: Feature[] = [
  { label: 'Engineered', sub: 'with Precision', icon: '/images/engineered-icon.png' },
  { label: 'Crafted',    sub: 'with Love',      icon: '/images/crafted-icon.png'    },
  { label: 'Delivered',  sub: 'with Care',      icon: '/images/delivered-icon.png'  },
]
</script>

<template>
  <div>
    <section class="hero">
      <div class="hero-left">
        <h1>Where Code <br />Meets <span>Blooms</span></h1>
        <p>Engineered with Precision, Crafted with Love.</p>
        <div class="buttons">
          <button class="primary" @click="router.push('/bouquets')">Shop Bouquets</button>
          <button class="secondary" @click="router.push('/about')">Our Story</button>
        </div>
      </div>
      <div class="hero-right">
        <img src="/images/bouquet-main.png" alt="Bouquet" />
      </div>
    </section>

    <div class="feature-bar">
      <div v-for="feat in features" :key="feat.label" class="feature">
        <img :src="feat.icon" :alt="feat.label" width="40" height="40" />
        <div>
          <strong>{{ feat.label }}</strong>
          <span>{{ feat.sub }}</span>
        </div>
      </div>
    </div>

    <section class="products" id="products">
      <h2>Featured Bouquets</h2>
      <div class="grid">
        <ProductCard v-for="product in products.featuredProducts" :key="product.name" :product="product" />
      </div>
    </section>
  </div>
</template>
