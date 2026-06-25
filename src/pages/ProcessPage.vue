<script setup lang="ts">
const steps = [
  {
    title: 'Pick a Bouquet You Love',
    desc: 'Browse our curated digital catalog and choose the handcrafted arrangement that perfectly speaks to your occasion.',
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
    title: 'Crafting the Blooms',
    desc: 'Applying technical precision to artisan crafting, we carefully hand-create each individual flower from scratch to build a beautiful, lasting base.',
  },
  {
    title: 'Arranging Your Bouquet',
    desc: 'Our team thoughtfully composes and structures every stem with deep care, keeping your design and aesthetic preferences in mind.',
  },
  {
    title: 'Careful Packaging & Shipping',
    desc: 'We securely pack and wrap your arrangement, seamlessly integrate your custom QR code tag, and ship it out so it arrives at your doorstep exactly on time.',
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
      <p class="process-section-sub">More than just a bouquet because it is a high-tech keepsake.</p>
      <p class="process-section-desc">
        Every arrangement we create is a fusion of physical craftsmanship and digital innovation.
        When you gift a Stack Petals bouquet, your loved one receives an interactive experience
        that bridges the physical and digital worlds:
      </p>

      <div class="process-features">
        <div class="process-feature">
          <span class="feature-dot">🌸</span>
          <div>
            <strong>Handcrafted Artistry</strong>
            <p>Every single flower is meticulously crafted by hand to ensure a stunning, long-lasting physical arrangement.</p>
          </div>
        </div>
        <div class="process-feature">
          <span class="feature-dot">💌</span>
          <div>
            <strong>The Virtual Message</strong>
            <p>Tucked inside the bouquet is a unique, custom QR code. When scanned by the recipient, it instantly unlocks a personalized virtual message from you.</p>
          </div>
        </div>
        <div class="process-feature">
          <span class="feature-dot">✨</span>
          <div>
            <strong>Interactive 360° View</strong>
            <p>Along with your message, the QR code grants them access to an immersive digital experience, allowing them to appreciate your arrangement and read your heartfelt letter.</p>
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