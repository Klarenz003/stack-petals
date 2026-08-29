<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Images, MessageCircleHeart, Music2, QrCode, Rotate3D } from 'lucide-vue-next'
import { useProductsStore } from '@/stores/products'
import ProductCard from '@/components/ProductCard.vue'
import HomeBouquetExperience from '@/components/HomeBouquetExperience.vue'
import type { Feature } from '@/types'

const router = useRouter()
const products = useProductsStore()

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
})

const features: Feature[] = [
  { label: 'Engineered', sub: 'with Precision', icon: '/images/engineered-icon.png' },
  { label: 'Crafted',    sub: 'with Love',      icon: '/images/crafted-icon.png'    },
  { label: 'Delivered',  sub: 'with Care',      icon: '/images/delivered-icon.png'  },
]

const experienceSteps = [
  { label: 'Scan QR', icon: QrCode },
  { label: 'Read Message', icon: MessageCircleHeart },
  { label: 'View Memories', icon: Images },
  { label: 'Play Music', icon: Music2 },
  { label: 'Explore 360\u00b0', icon: Rotate3D },
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

    <section class="products home-featured-products" id="products">
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

    <section class="home-experience">
      <div class="home-section-heading">
        <span>Signature Experience</span>
        <h2>One scan, a whole story.</h2>
        <p>
          A private keepsake unfolds naturally, one meaningful chapter at a time.
        </p>
      </div>

      <div class="experience-journey" aria-label="The Stack Petals QR experience">
        <div v-for="(item, index) in experienceSteps" :key="item.label" class="experience-step">
          <span class="experience-step-number">0{{ index + 1 }}</span>
          <span class="experience-step-icon"><component :is="item.icon" :size="22" stroke-width="1.6" /></span>
          <strong>{{ item.label }}</strong>
        </div>
      </div>
    </section>

    <section class="home-promise" aria-label="The Stack Petals promise">
      <div class="home-promise-copy">
        <span aria-hidden="true">&ldquo;</span>
        <p>A gift they can hold today, then scan, hear, and revisit whenever the moment calls.</p>
        <small>The Stack Petals experience</small>
      </div>
      <div class="home-promise-trust" aria-label="Stack Petals benefits">
        <span v-for="item in trustItems" :key="item">{{ item }}</span>
      </div>
    </section>

    <section class="home-closing-cta">
      <span>Made to be remembered</span>
      <h2>Create something they can keep.</h2>
      <button class="primary" @click="router.push('/products')">Choose a gift</button>
    </section>
  </div>
</template>
