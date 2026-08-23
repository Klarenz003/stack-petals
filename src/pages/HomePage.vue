<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import ProductCard from '@/components/ProductCard.vue'
import HomeBouquetExperience from '@/components/HomeBouquetExperience.vue'
import type { Feature } from '@/types'

const router = useRouter()
const products = useProductsStore()

const occasions = ['someone special', 'family', 'friends', 'celebrations']
const activeOccasion = ref(0)
let occasionTimer: number | undefined

const featuredProducts = computed(() => products.featuredProducts.slice(0, 4))
const seasonalTheme = computed(() => {
  const month = new Date().getMonth() + 1
  if (month <= 2) return { className: 'season-love', label: 'Season of thoughtful gestures' }
  if (month <= 6) return { className: 'season-milestones', label: 'Made for meaningful milestones' }
  if (month >= 11) return { className: 'season-holidays', label: 'Keepsakes for the giving season' }
  return { className: 'season-everyday', label: 'Make an ordinary day unforgettable' }
})

onMounted(() => {
  products.fetchProducts()
  occasionTimer = window.setInterval(() => {
    activeOccasion.value = (activeOccasion.value + 1) % occasions.length
  }, 3200)
})

onBeforeUnmount(() => window.clearInterval(occasionTimer))

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
  <div class="home-page" :class="seasonalTheme.className">
    <section class="hero">
      <div class="hero-left">
        <span class="hero-kicker">{{ seasonalTheme.label }}</span>
        <h1>Where Code <br />Meets <span>Blooms</span></h1>
        <p class="hero-tagline">Engineered with Precision, Crafted with Love.</p>
        <p class="hero-occasion">
          A personal keepsake for
          <Transition name="occasion-swap" mode="out-in">
            <strong :key="occasions[activeOccasion]">{{ occasions[activeOccasion] }}</strong>
          </Transition>
        </p>
        <div class="buttons">
          <button class="primary hero-primary" @click="router.push('/products')">Shop Gifts</button>
          <button class="hero-process-link" @click="router.push('/process')">
            See how it works <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
        <div class="hero-capabilities" aria-label="QR keepsake features">
          <span>Message</span><i aria-hidden="true"></i>
          <span>Memories</span><i aria-hidden="true"></i>
          <span>Music</span><i aria-hidden="true"></i>
          <span>360&deg; View</span>
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

    </section>

    <section class="home-trust-strip" aria-label="Stack Petals benefits">
      <span v-for="item in trustItems" :key="item">{{ item }}</span>
    </section>

    <aside class="home-testimonial" aria-label="The Stack Petals promise">
      <span aria-hidden="true">&ldquo;</span>
      <p>A gift they can hold today, then scan, hear, and revisit whenever the moment calls.</p>
      <small>The Stack Petals experience</small>
    </aside>

    <section class="products" id="products">
      <div class="home-section-heading product-heading">
        <span>Shop Favorites</span>
        <h2>Featured Products</h2>
      </div>
      <div class="grid wide-grid featured-grid">
        <ProductCard v-for="product in featuredProducts" :key="product.name" :product="product" />
      </div>
      <button v-if="products.featuredProducts.length > featuredProducts.length" class="featured-view-all" @click="router.push('/products')">
        View all gifts <span aria-hidden="true">&rarr;</span>
      </button>
    </section>
  </div>
</template>
