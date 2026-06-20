<script setup lang="ts">
import type { ProcessStep } from '@/types'

const steps: ProcessStep[] = [
  { title: 'You Place Your Order',   desc: 'Browse our catalog, add to cart, and check out with GCash or Maya.'      },
  { title: 'We Review Your Payment', desc: 'Our team verifies your payment screenshot within a few hours.'            },
  { title: 'Crafting the Blooms',    desc: 'Each flower is carefully handcrafted to create a beautiful lasting bouquet.' },
  { title: 'Arranging Your Bouquet', desc: 'Our florists arrange every stem with care and your preferences in mind.'  },
  { title: 'Careful Packaging',      desc: 'Wrapped and secured so your blooms arrive as beautiful as they left.'     },
  { title: 'Delivered to Your Door', desc: 'On-time delivery to your specified address on your chosen date.'          },
]
</script>

<template>
  <div class="page-section">
    <div class="page-hero">
      <h1>Our <span>Process</span></h1>
      <p>From idea to doorstep — crafted with precision at every step.</p>
    </div>
    <div class="process-steps">
      <div v-for="(step, i) in steps" :key="i" class="process-step">
        <div class="process-num">{{ i + 1 }}</div>
        <div class="process-body">
          <h3>{{ step.title }}</h3>
          <p>{{ step.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
