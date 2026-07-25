<script setup lang="ts">
const steps = [
  {
    title: 'Pick Crafted Flowers You Love',
    desc: 'Browse our curated digital catalog and choose the handcrafted flower piece that perfectly speaks to your occasion.',
  },
  {
    title: 'Place Your Order & Submit Payment',
    desc: 'Input your details, customize your recipient\'s virtual message, and complete your secure checkout using GCash or Maya.',
  },
  {
    title: 'Payment Review',
    desc: 'Our system processes your order, and our team quickly verifies your payment screenshot to initialize the fulfillment process.',
  },
  {
    title: 'Crafting the Details',
    desc: 'Applying technical precision to artisan crafting, we carefully hand-create each detail from scratch to build a beautiful, lasting base.',
  },
  {
    title: 'Preparing Your Crafted Flowers',
    desc: 'Our team thoughtfully composes every petal, stem, and detail with deep care, keeping your design and aesthetic preferences in mind.',
  },
  {
    title: 'Careful Packaging & Shipping',
    desc: 'We securely pack and wrap your crafted flowers, seamlessly integrate your custom QR code tag, and ship it out so it arrives at your doorstep exactly on time.',
  },
]

const experienceFeatures = [
  {
    title: 'Handcrafted Artistry',
    icon: '01',
    image: '/images/craftedflowers.jpg',
    imageAlt: 'Handcrafted Stack Petals flower arrangement',
    desc: 'Every flower is carefully made by hand, giving the gift a lasting physical piece they can keep.',
  },
  {
    title: 'The Virtual Message',
    icon: '02',
    video: '/videos/letter.MP4',
    videoLabel: 'Preview of the virtual message experience',
    desc: 'A private QR code opens a personalized message made for the recipient.',
  },
  {
    title: 'Photo Memories',
    icon: '03',
    video: '/videos/photo_memories.mp4',
    videoLabel: 'Preview of loved one photo memories inside the letter experience',
    desc: 'Add meaningful photos of loved ones so the letter page feels personal, familiar, and sweet.',
  },
  {
    title: 'Background Music',
    icon: '04',
    visualClass: 'process-music-photo',
    desc: 'Choose soft background music to make the message, memories, and 360 view feel cinematic.',
  },
  {
    title: 'Interactive 360 View',
    icon: '05',
    video: '/videos/360view.mp4',
    videoLabel: 'Preview of the interactive 360 flower view',
    desc: 'Let them revisit the crafted flowers from every angle after receiving the gift.',
  },
]
</script>

<template>
  <div class="page-section">

    <!-- Hero -->
    <div class="page-hero">
      <h1>How it <span>Works</span></h1>
      <p>From handcrafted flowers to a private QR experience, every order is designed to feel personal from the first scan.</p>
    </div>

    <!-- Section 1 — The Experience -->
    <div class="process-section process-showcase-section">
      <div class="process-section-header">
        <span class="process-section-num">1</span>
        <h2>The Stack Petals Experience</h2>
      </div>
      <p class="process-section-sub">More than a product. It is a handcrafted keepsake with a digital heart.</p>
      <p class="process-section-desc">
        Every crafted flower piece we create is a fusion of physical craftsmanship and digital innovation.
        When you send a Stack Petals arrangement, your loved one receives an interactive experience
        that bridges the physical and digital worlds:
      </p>

      <div class="process-features">
        <div v-for="feature in experienceFeatures" :key="feature.title" class="process-feature">
          <div
            v-if="feature.video"
            class="process-feature-photo process-feature-video"
          >
            <video
              :aria-label="feature.videoLabel"
              autoplay
              muted
              loop
              playsinline
              preload="metadata"
            >
              <source :src="feature.video" type="video/mp4" />
            </video>
          </div>
          <div
            v-else-if="feature.visualClass === 'process-music-photo'"
            class="process-feature-photo process-music-photo"
            aria-hidden="true"
          >
            <div class="music-visual">
              <span class="music-note">music</span>
              <span class="music-wave"></span>
              <span class="music-wave"></span>
              <span class="music-wave"></span>
            </div>
          </div>
          <div v-else class="process-feature-photo">
            <img :src="feature.image" :alt="feature.imageAlt" loading="lazy" decoding="async" />
          </div>
          <span class="feature-dot">{{ feature.icon }}</span>
          <div class="process-feature-copy">
            <strong>{{ feature.title }}</strong>
            <p>{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2 — Ordering Process -->
    <div class="process-section">
      <div class="process-section-header">
        <span class="process-section-num">2</span>
        <h2>Our Seamless Ordering Process</h2>
      </div>
      <p class="process-section-sub">From code to craft — engineered with precision at every step.</p>

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

  </div>
</template>
