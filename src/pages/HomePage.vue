<script setup lang="ts">
import { useRouter } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import type { Product, Feature } from '@/types'

const router = useRouter()

const features: Feature[] = [
  { label: 'Engineered', sub: 'with Precision', icon: '/images/engineered-icon.png' },
  { label: 'Crafted',    sub: 'with Love',      icon: '/images/crafted-icon.png'    },
  { label: 'Delivered',  sub: 'with Care',      icon: '/images/delivered-icon.png'  },
]

const products: Product[] = [
  { name: 'Blush Symphony', price: '₱5,000.00', image: '/images/b1.png' },
  { name: 'Code & Petals',  price: '₱5,699.00', image: '/images/b2.png' },
  { name: 'Pink Algorithm', price: '₱4,500.00', image: '/images/b3.png' },
  { name: 'Lavender Logic', price: '₱5,399.00', image: '/images/b4.png' },
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
        <ProductCard v-for="product in products" :key="product.name" :product="product" />
      </div>
    </section>
  </div>
</template>
