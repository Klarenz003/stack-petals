<script setup lang="ts">
import type { TeamMember } from '@/types'

const values = [
  { icon: '🌸', title: 'Precision',      desc: 'Every stem placed with purpose, like a function with a clear return value.' },
  { icon: '✨', title: 'Lasting Beauty', desc: 'Handcrafted bouquets designed to stay beautiful for years, not days.'        },
  { icon: '📦', title: 'Reliability',    desc: 'On-time delivery, every time. No bugs, no delays.'                           },
  { icon: '💛', title: 'Heart',          desc: 'Each bouquet carries the warmth of genuine human craftsmanship.'             },
]

const team: TeamMember[] = [
  { name: 'Klarenz E.', role: 'Owner',                    initials: 'KE' },
  { name: 'Klarenz E.', role: 'Web Developer / Designer', initials: 'KE' },
  { name: 'Klarenz E.', role: 'Florist',                  initials: 'KE' },
  { name: 'Klarenz E.', role: 'Software Engineer',        initials: 'KE' },
]
</script>

<template>
  <div class="page-section">
    <div class="page-hero">
      <h1>About <span>Stack Petals</span></h1>
      <p>Where engineering meets artistry — and every petal tells a story.</p>
    </div>

    <div class="about-grid">
      <div class="about-img">
        <img src="/images/bouquet-main.png" alt="About Stack Petals" />
      </div>
      <div class="about-text">
        <h2>Our Story</h2>
        <p>
          Stack Petals was born at the intersection of two passions — software engineering and
          the art of floral design. Founded in 2024, we believe that the same precision and care
          that goes into building beautiful software can be applied to crafting breathtaking bouquets.
        </p>
        <p>
          Every arrangement we create is like a piece of code: thoughtfully structured, elegantly
          composed, and built to last — or in this case, to bloom.
        </p>
        <h2 style="margin-top:32px">Our Mission</h2>
        <p>
          To deliver premium, handcrafted bouquets that combine technical precision with heartfelt
          creativity — making every occasion unforgettable.
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
