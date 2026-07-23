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
    icon: '🌸',
    image: '/images/craftedflowers.jpg',
    imageAlt: 'Handcrafted Stack Petals flower arrangement',
    desc: 'Every single flower is meticulously crafted by hand to ensure a stunning, long-lasting physical arrangement.',
  },
  {
    title: 'The Virtual Message',
    icon: '💌',
    video: '/videos/letter.MP4',
    videoLabel: 'Preview of the virtual message experience',
    desc: 'Tucked inside the arrangement is a unique, custom QR code. When scanned by the recipient, it instantly unlocks a personalized virtual message from you.',
  },
  {
    title: 'Photo Memories',
    icon: '▣',
    video: '/videos/photo_memories.mp4',
    videoLabel: 'Preview of loved one photo memories inside the letter experience',
    desc: 'Customers can add photos of their loved ones that appear inside the letter experience, turning the QR page into a sweet personal memory gallery.',
  },
  {
    title: 'Background Music',
    icon: '♫',
    visualClass: 'process-music-photo',
    desc: 'The letter experience can play a soft custom song while they browse the message, memories, and 360° flower view.',
  },
  {
    title: 'Interactive 360° View',
    icon: '✨',
    video: '/videos/360view.mp4',
    videoLabel: 'Preview of the interactive 360 flower view',
    desc: 'Along with your message, the QR code grants them access to an immersive digital experience, allowing them to appreciate your crafted flowers and read your heartfelt letter.',
  },
]
</script>

<template>
  <div class="page-section">

    <!-- Hero -->
    <div class="page-hero">
      <h1>How it <span>Works</span></h1>
    </div>

    <!-- Section 1 — The Experience -->
    <div class="process-section">
      <div class="process-section-header">
        <span class="process-section-num">1</span>
        <h2>The Stack Petals Experience</h2>
      </div>
      <p class="process-section-sub">More than just a product because it is a high-tech keepsake.</p>
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
              <span class="music-note">♪</span>
              <span class="music-wave"></span>
              <span class="music-wave"></span>
              <span class="music-wave"></span>
            </div>
          </div>
          <div v-else class="process-feature-photo">
            <img :src="feature.image" :alt="feature.imageAlt" loading="lazy" decoding="async" />
          </div>
          <span class="feature-dot">{{ feature.icon }}</span>
          <div>
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
