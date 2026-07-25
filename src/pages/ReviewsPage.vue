<script setup lang="ts">
import type { Review } from '@/types'

const reviews: Review[] = [
  { name: 'Maria S.',  text: 'Absolutely stunning gift! It felt personal, polished, and the delivery was right on time. Will definitely order again.' },
  { name: 'Carlo B.',  text: "Ordered for my girlfriend's birthday. She cried happy tears. Stack Petals never disappoints." },
  { name: 'Jessa R.',  text: 'The GCash payment was so easy and the team confirmed my order super fast. Love the whole experience!' },
  { name: 'Miguel T.', text: 'Unique concept with a techy personal touch. The packaging was gorgeous and everything arrived perfect.' },
  { name: 'Ana G.',    text: "I've ordered three times already. Every product feels thoughtful and beautifully made." },
  { name: 'Paolo M.',  text: 'Fast delivery, lovely presentation, and great customer service. Highly recommend Stack Petals!' },
]

const trustStats = [
  { value: '5.0', label: 'Average Rating' },
  { value: '24h', label: 'Payment Review' },
  { value: 'QR', label: 'Personal Experience' },
]
</script>

<template>
  <div class="page-section">
    <div class="page-hero">
      <h1>Customer <span>Reviews</span></h1>
      <p>Kind words from customers who trusted Stack Petals for handcrafted, personal gifts.</p>
    </div>

    <section class="reviews-trust">
      <div v-for="stat in trustStats" :key="stat.label" class="reviews-trust-card">
        <strong>{{ stat.value }}</strong>
        <span>{{ stat.label }}</span>
      </div>
    </section>

    <div class="reviews-grid">
      <div v-for="r in reviews" :key="r.name" class="review-card">
        <div class="review-stars" aria-label="5 star rating">
          <span v-for="star in 5" :key="star"></span>
        </div>
        <p class="review-text">"{{ r.text }}"</p>
        <div class="review-author">{{ r.name }}</div>
      </div>
    </div>

    <section class="reviews-cta">
      <span>Ready for your moment?</span>
      <h2>Create a handcrafted surprise with a personal QR experience.</h2>
      <div class="reviews-cta-actions">
        <RouterLink class="co-btn-primary" to="/products">Shop Products</RouterLink>
        <RouterLink class="co-btn-outline" to="/gallery">View Gallery</RouterLink>
      </div>
    </section>
  </div>
</template>
