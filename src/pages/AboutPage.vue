<script setup lang="ts">
import type { TeamMember } from '@/types'

const values = [
  { icon: '🌸', title: 'Precision',      desc: 'Every stem placed with purpose, like a function with a clear return value.' },
  { icon: '✨', title: 'Lasting Beauty', desc: 'Handcrafted gifts designed to stay meaningful for years, not days.'        },
  { icon: '💛', title: 'Heart',          desc: 'Each piece carries the warmth of genuine human craftsmanship.'             },
]

const team: TeamMember[] = [
  { name: 'Klarenz E.', role: 'Owner & Founder',          initials: 'KE' },
  { name: 'Klarenz E.', role: 'Web Developer / Designer', initials: 'KE' },
  { name: 'Gerlie E.',  role: 'Florist',                  initials: 'GE' },
  { name: 'Klarenz E.', role: 'Software Engineer',        initials: 'KE' },
]
</script>

<template>
  <div class="page-section">
    <div class="page-hero">
      <h1>About <span>Stack Petals</span></h1>
      <p>Where engineering meets artistry. Every petal tells a story.</p>
    </div>

    <div class="about-grid">
      <div class="about-img">
        <img src="/images/owner.png" alt="Owner of Stack Petals" />
      </div>
      <div class="about-text">
        <h2>Our Story</h2>
        <p>
          In May 2026, computer engineer Klarenz Evasco set out to build 
          something that combined his love for programming with his passion 
          for hands-on crafting. Guided by a strong vision for success and a 
          prayer to build a meaningful future, he designed and coded Stack Petals 
          from the ground up to redefine how we express affection.
        </p>
        <p>
          Our products are entirely unique because they are not just about the item itself. 
          Each handcrafted piece acts as a gateway to a digital experience. 
          Embedded with a custom QR code, our gifts allow recipients to scan and 
          instantly unlock a heartfelt virtual message alongside an interactive 360-degree 
          view of their gift. Every piece is thoughtfully structured, elegantly composed, 
          and engineered to connect people in a modern world.
        </p>
        <h2 style="margin-top:32px">Our Mission</h2>
        <p>
          To revolutionize traditional gifting by embedding interactive technology into 
          artisan-made products, creating seamless, memorable, and high-tech expressions of love.
        </p>
      </div>
    </div>

    <div class="values-grid">
      <div v-for="v in values" :key="v.title" class="value-card">
        <div class="value-icon">{{ v.icon }}</div>
        <h3>{{ v.title }}</h3>
        <p>{{ v.desc }}</p>
      </div>
    </div>

    <div class="team-section">
      <h2>Meet the Team</h2>
      <div class="team-grid">
        <div v-for="member in team" :key="member.role" class="team-card">
          <div class="team-avatar">{{ member.initials }}</div>
          <h3>{{ member.name }}</h3>
          <span>{{ member.role }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
