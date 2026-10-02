<script setup lang="ts">
import { PhArrowRight as ArrowRight, PhFlower as Flower2, PhHeart as Heart, PhImages as Images, PhInfinity as Infinity, PhChatText as MessageSquareText, PhMusicNotes as Music2, PhQrCode as QrCode, PhCube as Rotate3D, PhSparkle as Sparkles } from '@phosphor-icons/vue'

const milestones = [
  { year: 'May 2026', title: 'The first line of code', description: "Stack Petals began as Klarenz Evasco's idea to bring engineering and handmade artistry into one meaningful gift." },
  { year: 'First creation', title: 'Craft met connection', description: 'A handcrafted flower became more than an object through a QR keepsake filled with words, memories, music, and motion.' },
  { year: 'Today', title: 'Every gift tells a story', description: 'We continue creating lasting floral pieces that help people say what matters in a personal, modern way.' },
]

const experiences = [
  { icon: Flower2, label: 'A handcrafted floral piece' },
  { icon: MessageSquareText, label: 'A personal digital letter' },
  { icon: Images, label: 'Photo memories' },
  { icon: Music2, label: 'A chosen soundtrack' },
  { icon: Rotate3D, label: 'An interactive 360° view' },
  { icon: QrCode, label: 'One QR keepsake' },
]

const values = [
  { icon: Sparkles, title: 'Precision', description: 'Every detail is considered, from the placement of each stem to the experience behind the QR code.' },
  { icon: Infinity, title: 'Lasting beauty', description: 'Our crafted flowers and digital keepsakes are designed to hold meaning long after the moment has passed.' },
  { icon: Heart, title: 'Made with heart', description: 'Technology supports the story, but genuine care remains at the center of every gift we create.' },
]

const team = [
  { initials: 'KE', name: 'Klarenz Evasco', role: 'Founder, software engineer, designer, and craftsman' },
  { initials: 'GE', name: 'Gerlie Evasco', role: 'Florist and floral craft partner' },
]
</script>

<template>
  <main class="about-page">
    <header class="page-hero about-hero">
      <p class="about-eyebrow">Our story</p>
      <h1>About <span>Stack Petals</span></h1>
      <p>Where engineering meets artistry, and every crafted gift becomes a story worth keeping.</p>
    </header>

    <section class="about-story" aria-labelledby="about-story-title">
      <figure class="about-founder-portrait">
        <img src="/images/owner.png" alt="Klarenz Evasco, founder of Stack Petals" />
        <figcaption><span>Founded and built by</span><strong>Klarenz Evasco</strong></figcaption>
      </figure>
      <div class="about-story-copy">
        <p class="about-section-label">How it began</p>
        <h2 id="about-story-title">A love for making, shaped by engineering.</h2>
        <p>In May 2026, computer engineer Klarenz Evasco set out to build something that joined his love for programming with the quiet joy of making by hand. Stack Petals grew from that idea: a crafted gift that can carry more than flowers alone.</p>
        <p>Each piece opens into a personal digital experience through its QR keepsake. A recipient can revisit a letter, treasured photographs, chosen music, and a 360° view made especially for their moment.</p>
        <blockquote>“The best technology should never get in the way of the feeling. It should help the feeling last.”</blockquote>
        <div class="about-mission"><span>Our mission</span><p>To make thoughtful gifting more personal, lasting, and beautifully connected.</p></div>
      </div>
    </section>

    <section class="about-timeline-section" aria-labelledby="about-journey-title">
      <div class="about-section-heading">
        <p class="about-section-label">A growing story</p>
        <h2 id="about-journey-title">From an idea to a keepsake.</h2>
      </div>
      <ol class="about-timeline">
        <li v-for="(milestone, index) in milestones" :key="milestone.year">
          <span class="about-timeline-number">0{{ index + 1 }}</span><time>{{ milestone.year }}</time>
          <h3>{{ milestone.title }}</h3><p>{{ milestone.description }}</p>
        </li>
      </ol>
    </section>

    <section class="about-difference" aria-labelledby="about-difference-title">
      <img class="about-craft-image" src="/images/craftedflowersv2.webp" alt="A handcrafted Stack Petals floral gift" />
      <div class="about-difference-copy">
        <p class="about-section-label">More than a crafted gift</p>
        <h2 id="about-difference-title">One piece, many ways to feel the moment again.</h2>
        <p>The physical craft is only the beginning. Every part of the digital experience is built to feel intimate, easy to revisit, and unmistakably made for one person.</p>
        <ul class="about-experience-list">
          <li v-for="experience in experiences" :key="experience.label"><component :is="experience.icon" :size="19" aria-hidden="true" /><span>{{ experience.label }}</span></li>
        </ul>
      </div>
    </section>

    <section class="about-values" aria-labelledby="about-values-title">
      <div class="about-section-heading"><p class="about-section-label">What guides us</p><h2 id="about-values-title">Built carefully. Given wholeheartedly.</h2></div>
      <div class="about-values-row">
        <article v-for="value in values" :key="value.title"><component :is="value.icon" :size="23" aria-hidden="true" /><h3>{{ value.title }}</h3><p>{{ value.description }}</p></article>
      </div>
    </section>

    <section class="about-team" aria-labelledby="about-team-title">
      <div class="about-section-heading"><p class="about-section-label">The people behind the petals</p><h2 id="about-team-title">A small team with a personal touch.</h2></div>
      <div class="about-team-list">
        <article v-for="member in team" :key="member.initials"><span class="about-team-avatar">{{ member.initials }}</span><div><h3>{{ member.name }}</h3><p>{{ member.role }}</p></div></article>
      </div>
    </section>

    <section class="about-cta">
      <div><p class="about-section-label">Find something meaningful</p><h2>Let your next gift hold more than a moment.</h2></div>
      <RouterLink class="about-cta-link" to="/shop">Explore our creations <ArrowRight :size="18" aria-hidden="true" /></RouterLink>
    </section>
  </main>
</template>
