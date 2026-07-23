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
</script>

<template>
  <div class="page-section">
    <div class="page-hero">
      <h1>Customer <span>Reviews</span></h1>
      <p>What our customers say about us.</p>
    </div>
    <div class="reviews-grid">
      <div v-for="r in reviews" :key="r.name" class="review-card">
        <div class="review-stars">★★★★★</div>
        <p class="review-text">"{{ r.text }}"</p>
        <div class="review-author">— {{ r.name }}</div>
      </div>
    </div>
  </div>
</template>
