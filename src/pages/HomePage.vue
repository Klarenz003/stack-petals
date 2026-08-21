<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import ProductCard from '@/components/ProductCard.vue'
import HomeBouquetExperience from '@/components/HomeBouquetExperience.vue'
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

const experienceCards = [
  {
    label: 'Virtual Message',
    text: 'A private QR letter opens with your words, photos, and soft romantic motion.',
    icon: '01',
  },
  {
    label: 'Photo Memories',
    text: 'Add meaningful photos of loved ones so the gift feels personal, not generic.',
    icon: '02',
  },
  {
    label: '360 View',
    text: 'Let them revisit the crafted flowers from every angle after delivery.',
    icon: '03',
  },
  {
    label: 'Music Touch',
    text: 'Pair the letter with a song to make the moment feel more cinematic.',
    icon: '04',
  },
]

const trustItems = ['Handcrafted flowers', 'QR experience included', 'Pickup or delivery', 'Pre-order ready']
</script>

<template>
  <div>
    <section class="hero">
      <div class="hero-left">
        <span class="hero-kicker">More than flowers</span>
        <h1>Where Code <br />Meets <span>Blooms</span></h1>
        <p>Scan. Unlock. Feel the moment.</p>
        <div class="buttons">
          <button class="primary" @click="router.push('/products')">Shop Signature Gifts</button>
          <button class="secondary" @click="router.push('/process')">Explore Experience</button>
        </div>
      </div>
      <div class="hero-right">
        <HomeBouquetExperience />
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

    <section class="home-experience">
      <div class="home-section-heading">
        <span>Signature Experience</span>
        <h2>A crafted gift with a digital heart.</h2>
        <p>
          Each Stack Petals piece can unlock a private QR experience made for the person receiving it.
        </p>
      </div>

      <div class="experience-grid">
        <article v-for="item in experienceCards" :key="item.label" class="experience-card">
          <span>{{ item.icon }}</span>
          <h3>{{ item.label }}</h3>
          <p>{{ item.text }}</p>
        </article>
      </div>

      <div class="experience-actions">
        <button class="primary compact-primary" @click="router.push('/process')">See How It Works</button>
        <button class="secondary compact-secondary" @click="router.push('/gallery')">View Gallery</button>
      </div>
    </section>

    <section class="home-trust-strip" aria-label="Stack Petals benefits">
      <span v-for="item in trustItems" :key="item">{{ item }}</span>
    </section>

    <section class="products" id="products">
      <div class="home-section-heading product-heading">
        <span>Shop Favorites</span>
        <h2>Featured Products</h2>
      </div>
      <div class="grid wide-grid featured-grid">
        <ProductCard v-for="product in products.featuredProducts" :key="product.name" :product="product" />
      </div>
    </section>
  </div>
</template>
