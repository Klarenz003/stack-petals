<script setup lang="ts">
import { PhArrowRight, PhFlower, PhPackage, PhCalendarBlank, PhQuotes } from '@phosphor-icons/vue'

import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { useRouter } from 'vue-router'
import { PhImages as Images, PhChatCircleDots as MessageCircleHeart, PhMusicNotes as Music2, PhQrCode as QrCode, PhCube as Rotate3D } from '@phosphor-icons/vue'
import { useProductsStore } from '@/stores/products'
import ProductCard from '@/components/ProductCard.vue'
import HomeBouquetExperience from '@/components/HomeBouquetExperience.vue'
import type { Feature } from '@/types'

const router = useRouter()
const products = useProductsStore()
const isLoading = ref(true)
const homeRoot = ref<HTMLElement | null>(null)
let homeRevealContext: gsap.Context | null = null

const featuredProducts = computed(() => products.featuredProducts.slice(0, 4))
const seasonalTheme = computed(() => {
  const month = new Date().getMonth() + 1
  if (month <= 2) return { className: 'season-love', label: 'Season of thoughtful gestures' }
  if (month <= 6) return { className: 'season-milestones', label: 'Made for meaningful milestones' }
  if (month >= 11) return { className: 'season-holidays', label: 'Keepsakes for the giving season' }
  return { className: 'season-everyday', label: 'Make an ordinary day unforgettable' }
})

onMounted(async () => {
  await products.fetchProducts()
  requestAnimationFrame(async () => {
    isLoading.value = false
    await nextTick()
    const root = homeRoot.value
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    homeRevealContext?.revert()
    homeRevealContext = gsap.context(() => {
      const copy = gsap.utils.toArray<HTMLElement>('.hero-left > *')
      const art = gsap.utils.toArray<HTMLElement>('.hero-right')
      const features = gsap.utils.toArray<HTMLElement>('.feature-bar .feature')
      gsap.set([...copy, ...art, ...features], { opacity: 0 })
      gsap.set(copy, { y: 24 })
      gsap.set(art, { y: 18, scale: 0.97 })
      gsap.set(features, { y: 12 })
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
      timeline.to(copy, { opacity: 1, y: 0, duration: 0.62, stagger: 0.07 })
        .to(art, { opacity: 1, y: 0, scale: 1, duration: 0.9 }, '-=0.42')
        .to(features, { opacity: 1, y: 0, duration: 0.48, stagger: 0.08 }, '-=0.5')
    }, root)
  })
})

onBeforeUnmount(() => {
  homeRevealContext?.revert()
  homeRevealContext = null
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

const trustItems = [
  { title: 'Made by hand', description: 'Flowers crafted with care.', icon: PhFlower },
  { title: 'A story inside', description: 'Your QR keepsake, included.', icon: QrCode },
  { title: 'Your way to gift', description: 'Choose pickup or delivery.', icon: PhPackage },
  { title: 'Worth planning for', description: 'Pre-order for your moment.', icon: PhCalendarBlank },
]
</script>

<template>
  <div ref="homeRoot" class="home-page" :class="seasonalTheme.className">
    <section v-if="isLoading" class="home-hero-skeleton" aria-label="Loading homepage" aria-busy="true">
      <div class="home-skeleton-copy"><span class="skeleton-line skeleton-kicker"></span><span class="skeleton-line skeleton-title"></span><span class="skeleton-line skeleton-title skeleton-title-short"></span><span class="skeleton-line skeleton-tagline"></span><div class="home-skeleton-actions"><span></span><span></span></div><span class="skeleton-line skeleton-capabilities"></span></div>
      <div class="home-skeleton-art"><span class="skeleton-bouquet"></span><span class="skeleton-phone"></span></div>
    </section>
    <section v-else class="hero">
      <div class="hero-left">
        <span class="hero-kicker">{{ seasonalTheme.label }}</span>
        <h1>Where Code <br />Meets <span>Blooms</span></h1>
        <p class="hero-tagline">Flowers made by hand.<br />A feeling made to last.</p>
        <p class="studio-hero-description">A handcrafted gift with a story tucked inside. One scan opens your words, memories, and music into a keepsake made just for them.</p>
        <div class="buttons">
          <button class="primary hero-primary" @click="router.push('/products')">Find your gift <PhArrowRight :size="18" /></button>
          <button class="hero-process-link" @click="router.push('/process')">
            See how it works <span aria-hidden="true"><PhArrowRight class="ui-icon" aria-hidden="true" :size="'1em'" /></span>
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
        <h2>Little gifts. <em>Big feelings.</em></h2>
        <p>A few favorites, handcrafted for your favorite people.</p>
      </div>
      <div class="grid wide-grid featured-grid">
        <template v-if="isLoading">
          <div v-for="index in 4" :key="index" class="home-product-skeleton"><span></span><i></i><b></b></div>
        </template>
        <ProductCard v-for="product in featuredProducts" v-else :key="product.name" :product="product" />
      </div>
      <div v-if="products.fetchError" class="studio-fetch-notice" role="alert"><p>{{ products.fetchError }}</p><button @click="products.fetchProducts()" :disabled="products.loading">Try again</button></div>
      <button v-if="products.featuredProducts.length > featuredProducts.length" class="featured-view-all" @click="router.push('/products')">
        View all gifts <span aria-hidden="true"><PhArrowRight class="ui-icon" aria-hidden="true" :size="'1em'" /></span>
      </button>
    </section>

    <section class="studio-occasion-section" aria-labelledby="occasion-title"><div><span class="studio-eyebrow">No perfect words required</span><h2 id="occasion-title">What do you want<br />your gift to <em>say?</em></h2><p>For a milestone, a thank-you, or simply because.</p></div><div class="studio-occasion-grid"><RouterLink v-for="occasion in [{ label: 'I love you.', category: 'Romance', number: '01' }, { label: 'Celebrate you.', category: 'Birthday', number: '02' }, { label: 'Thank you.', category: 'Thank You', number: '03' }, { label: 'Just because.', category: 'All', number: '04' }]" :key="occasion.number" :to="{ path: '/products', query: { occasion: occasion.category } }"><span>{{ occasion.number }}</span><strong>{{ occasion.label }}</strong><PhArrowRight :size="20" aria-hidden="true" /></RouterLink></div></section>

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
          <span class="experience-step-icon"><component :is="item.icon" :size="22" weight="regular" /></span>
          <strong>{{ item.label }}</strong>
        </div>
      </div>
    </section>

    <section class="home-promise promise-studio" aria-label="The Stack Petals promise">
      <PhFlower class="promise-watermark" :size="280" weight="thin" aria-hidden="true" />
      <div class="home-promise-copy">
        <div class="promise-eyebrow"><i aria-hidden="true"></i> More than a bouquet</div>
        <PhQuotes class="promise-quote-mark" :size="32" weight="fill" aria-hidden="true" />
        <blockquote>
          <p>A gift they can hold today.<br />A feeling they can <em>revisit.</em></p>
        </blockquote>
        <p class="promise-description">Your words, memories, and music—tucked into a keepsake that stays close, long after the moment.</p>
        <div class="promise-signature"><i aria-hidden="true"></i><small>The Stack Petals experience</small></div>
      </div>
      <div class="promise-benefits">
        <p class="promise-benefits-heading">Thoughtful in every detail</p>
        <ul class="home-promise-trust" aria-label="Stack Petals benefits">
          <li v-for="item in trustItems" :key="item.title" class="promise-benefit">
            <div class="promise-benefit-icon"><component :is="item.icon" :size="24" weight="duotone" aria-hidden="true" /></div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="home-closing-cta">
      <span>Made to be remembered</span>
      <h2>Create something they can keep.</h2>
      <button class="primary" @click="router.push('/products')">Choose a gift</button>
    </section>
  </div>
</template>

<style scoped>
.home-promise.promise-studio {
  position: relative; isolation: isolate; overflow: hidden;
  width: min(1250px, calc(100% - 64px)); margin: 0 auto 60px;
  display: grid; grid-template-columns: minmax(0,1.1fr) minmax(0,1fr);
  align-items: center; gap: clamp(32px,5vw,72px); padding: clamp(32px,4.5vw,64px);
  border: 1px solid #d3ded0; border-radius: 28px;
  background: radial-gradient(ellipse at 0% 0%,#f6f8f1,transparent 65%),#e7eee5;
  box-shadow: 0 14px 40px #42553e06;
}
.promise-studio::after { content: ''; position: absolute; inset: 10px; border: 1px solid #ffffff75; border-radius: 19px; pointer-events: none; z-index: -1; }
.promise-watermark { position: absolute; left: -95px; bottom: -105px; color: #53744b; opacity: .055; transform: rotate(-20deg); z-index: -1; pointer-events: none; }
.promise-studio .home-promise-copy { display: block; min-width: 0; }
.promise-eyebrow { display: flex; align-items: center; gap: 10px; color: #53634f; font-size: 10px; font-weight: 600; letter-spacing: .15em; text-transform: uppercase; }
.promise-eyebrow i { width: 22px; height: 1px; background: #8ba184; }
.promise-quote-mark { display: block; margin: 25px 0 9px; color: #7b9471; }
.promise-studio blockquote { margin: 0; }
.promise-studio blockquote p { margin: 0; font: 500 clamp(30px,3vw,42px)/1.15 'Cormorant Garamond',Georgia,serif; letter-spacing: -.025em; color: #354b3e; }
.promise-studio blockquote em { font-weight: 400; color: #82535f; }
.promise-studio .home-promise-copy .promise-description { max-width: 365px; margin: 20px 0 25px; font: 400 13px/1.85 'Inter',sans-serif; color: #52614f; }
.promise-signature { display: flex; align-items: center; gap: 12px; }
.promise-signature i { width: 24px; height: 1px; background: #ab8088; }
.promise-studio .promise-signature small { color: #74565d; font-size: 9px; font-weight: 600; letter-spacing: .12em; line-height: 1.6; }
.promise-benefits { min-width: 0; }
.promise-benefits-heading { margin: 0 0 16px; color: #52614f; font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }
.promise-studio .home-promise-trust { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; margin: 0; padding: 0; list-style: none; }
.promise-benefit { min-width: 0; padding: 20px 18px; border: 1px solid #d2decb; border-radius: 16px; background: #fbfcf6cf; }
.promise-benefit-icon { display: grid; place-items: center; width: 40px; height: 40px; margin-bottom: 15px; border: 1px solid #dce4d4; border-radius: 12px; color: #4a6b50; background: #edf2e6; }
.promise-benefit:nth-child(2) .promise-benefit-icon,
.promise-benefit:nth-child(4) .promise-benefit-icon { color: #885862; background: #f6ebe9; border-color: #ead6d1; }
.promise-benefit h3 { margin: 0 0 7px; font: 600 13px/1.4 'Inter',sans-serif; color: #384e3c; }
.promise-benefit p { margin: 0; font: 400 11px/1.65 'Inter',sans-serif; color: #596751; }
@media (max-width: 960px) {
  .home-promise.promise-studio { grid-template-columns: minmax(0,1fr); width: calc(100% - 48px); padding: 40px; gap: 32px; }
  .promise-studio .home-promise-copy { text-align: center; }
  .promise-eyebrow,.promise-signature { justify-content: center; }
  .promise-quote-mark { margin-inline: auto; }
  .promise-studio .home-promise-copy .promise-description { margin-inline: auto; max-width: 420px; }
  .promise-benefits-heading { text-align: center; }
  .promise-benefit { padding: 22px; }
}
@media (max-width: 480px) {
  .home-promise.promise-studio { width: calc(100% - 32px); padding: 30px 20px; margin: 0 auto 35px; border-radius: 22px; gap: 28px; }
  .promise-studio::after { inset: 7px; border-radius: 16px; }
  .promise-eyebrow { font-size: 9px; letter-spacing: .12em; }
  .promise-studio blockquote p { font-size: clamp(28px,7.8vw,34px); }
  .promise-studio .home-promise-copy .promise-description { font-size: 12px; }
  .promise-studio .home-promise-trust { gap: 10px; }
  .promise-benefit { padding: 16px 12px; }
  .promise-benefit h3 { font-size: 12px; }
  .promise-benefit p { font-size: 11px; }
}
.home-hero-skeleton { min-height: min(820px, 78svh); display: grid; grid-template-columns: 1fr 1.35fr; align-items: center; gap: clamp(20px, 5vw, 80px); padding: clamp(44px, 7vw, 100px) 5%; overflow: hidden; }
.home-skeleton-copy { display: grid; gap: 16px; max-width: 560px; }
.skeleton-line, .home-skeleton-actions span, .skeleton-bouquet, .skeleton-phone, .home-product-skeleton span, .home-product-skeleton i, .home-product-skeleton b { display: block; background: linear-gradient(110deg, rgba(228,204,198,.48) 8%, rgba(255,246,242,.92) 18%, rgba(228,204,198,.48) 33%); background-size: 220% 100%; animation: home-skeleton-shimmer 1.35s linear infinite; }
.skeleton-line { height: 18px; border-radius: 999px; width: 82%; }.skeleton-kicker { width: 42%; height: 12px; }.skeleton-title { width: 94%; height: clamp(48px, 7vw, 92px); border-radius: 14px; }.skeleton-title-short { width: 78%; margin-top: -9px; }.skeleton-tagline { width: 62%; height: 18px; margin-top: 10px; }.skeleton-capabilities { width: 52%; height: 12px; margin-top: 10px; }
.home-skeleton-actions { display: flex; gap: 18px; margin-top: 16px; }.home-skeleton-actions span { width: 150px; height: 54px; border-radius: 12px; }.home-skeleton-actions span + span { width: 120px; background: transparent; border: 1px solid rgba(207,169,163,.42); }
.home-skeleton-art { position: relative; min-height: 520px; }.skeleton-bouquet { position: absolute; inset: 5% 15% 4% 5%; border-radius: 48% 52% 42% 45%; transform: rotate(-8deg); }.skeleton-phone { position: absolute; right: 3%; top: 18%; width: 23%; height: 64%; border-radius: 28px; border: 8px solid rgba(92,73,78,.18); }
.home-product-skeleton { min-height: 330px; padding: 16px; border: 1px solid rgba(211,177,170,.35); border-radius: 18px; }.home-product-skeleton span { height: 220px; border-radius: 12px; }.home-product-skeleton i { width: 62%; height: 16px; margin-top: 18px; border-radius: 999px; }.home-product-skeleton b { width: 38%; height: 13px; margin-top: 12px; border-radius: 999px; }
@keyframes home-skeleton-shimmer { to { background-position: -220% 0; } }
@media (max-width: 760px) { .home-hero-skeleton { min-height: 720px; grid-template-columns: 1fr; padding-top: 48px; }.home-skeleton-art { min-height: 300px; }.skeleton-phone { right: 8%; top: 8%; height: 78%; } }
</style>
