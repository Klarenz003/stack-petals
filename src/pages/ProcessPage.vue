<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { PhArrowRight as ArrowRight, PhCube as Box, PhCheckCircle as CheckCircle2, PhFlower as Flower2, PhGift as Gift, PhHeart as Heart, PhImages as Images, PhChatText as MessageSquareText, PhMusicNotes as Music2, PhPackage as PackageCheck, PhQrCode as QrCode, PhCube as Rotate3D, PhScan as ScanLine, PhSparkle as Sparkles, PhStorefront as Store, PhTruck as Truck, PhWallet as WalletCards } from '@phosphor-icons/vue'

const orderSteps = [
  {
    title: 'Choose your crafted gift',
    desc: 'Browse the collection, check availability, and select the piece that fits the moment.',
    icon: Gift,
  },
  {
    title: 'Personalize the experience',
    desc: 'Add the recipient, letter, petal messages, photo memories, and a song suggestion.',
    icon: Heart,
  },
  {
    title: 'Complete checkout',
    desc: 'Choose pickup or delivery, submit your payment proof, and keep your order reference.',
    icon: WalletCards,
  },
  {
    title: 'We craft and prepare',
    desc: 'After payment review, we create the flowers by hand and prepare the private QR keepsake.',
    icon: Flower2,
  },
  {
    title: 'Receive it your way',
    desc: 'Collect it from Stack Petals or follow your delivery status using Track Order.',
    icon: PackageCheck,
  },
]

const overviewSteps = [
  { title: 'Choose', detail: 'Find your thoughtful gift', icon: Gift },
  { title: 'Personalize', detail: 'Make the story yours', icon: Heart },
  { title: 'We craft', detail: 'Handmade with care', icon: Flower2 },
  { title: 'They unlock', detail: 'A keepsake to revisit', icon: QrCode },
]

const experienceFeatures = [
  {
    id: 'scan',
    title: 'Scan the QR',
    eyebrow: 'The invitation',
    desc: 'The keepsake begins with a private QR tag attached to the crafted gift.',
    icon: ScanLine,
    image: '/images/home-experience/bouquet-qr-guide.png',
    imageAlt: 'Stack Petals bouquet with QR tag and scanning guide',
  },
  {
    id: 'letter',
    title: 'Read the letter',
    eyebrow: 'Words made personal',
    desc: 'A private message unfolds into a gentle, page-by-page experience.',
    icon: MessageSquareText,
    video: '/videos/letter.MP4',
    videoLabel: 'Preview of the Stack Petals virtual letter',
  },
  {
    id: 'memories',
    title: 'Revisit memories',
    eyebrow: 'Photos held close',
    desc: 'Meaningful photos become a small gallery the recipient can return to anytime.',
    icon: Images,
    video: '/videos/photo_memories.mp4',
    videoLabel: 'Preview of photo memories in the letter experience',
  },
  {
    id: 'music',
    title: 'Play the soundtrack',
    eyebrow: 'A song for the moment',
    desc: 'Music gives the letter and memories their own atmosphere and emotion.',
    icon: Music2,
    image: '/images/keepsake-music.png',
    imageAlt: 'Stack Petals keepsake music preview',
  },
  {
    id: 'view360',
    title: 'Explore every angle',
    eyebrow: 'The crafted gift, preserved',
    desc: 'When available, the 360 view lets the recipient revisit the finished piece from every side.',
    icon: Rotate3D,
    video: '/videos/360view.mp4',
    videoLabel: 'Preview of the interactive 360 degree crafted flower view',
  },
]

const selectedExperience = ref(experienceFeatures[0].id)
const musicScene = ref<HTMLElement | null>(null)
let musicAnimation: gsap.Context | null = null

const activeExperience = computed(
  () => experienceFeatures.find((feature) => feature.id === selectedExperience.value) ?? experienceFeatures[0],
)

const stopMusicAnimation = () => {
  musicAnimation?.revert()
  musicAnimation = null
}

const animateMusicScene = async () => {
  stopMusicAnimation()
  if (selectedExperience.value !== 'music') return

  await nextTick()
  if (!musicScene.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  musicAnimation = gsap.context(() => {
    gsap.to('.process-music-record', {
      rotation: 360,
      duration: 8,
      ease: 'none',
      repeat: -1,
    })

    gsap.to('.process-music-glow', {
      scale: 1.08,
      opacity: 0.72,
      duration: 1.8,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })

    gsap.to('.process-music-tonearm', {
      rotation: 27,
      duration: 2.4,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })

    gsap.fromTo(
      '.process-music-bar',
      { scaleY: 0.24, transformOrigin: '50% 100%' },
      {
        scaleY: (index) => [0.62, 0.92, 0.48, 1, 0.7, 0.88, 0.55, 0.78][index % 8],
        duration: 0.64,
        ease: 'sine.inOut',
        stagger: { each: 0.08, repeat: -1, yoyo: true },
      },
    )

    gsap.to('.process-music-note', {
      keyframes: [
        { y: 8, opacity: 0, scale: 0.72 },
        { y: -18, opacity: 0.78, scale: 1 },
        { y: -58, opacity: 0, scale: 0.86 },
      ],
      x: (index) => (index % 2 === 0 ? 12 : -12),
      duration: 3.2,
      ease: 'sine.out',
      stagger: { each: 0.72, repeat: -1 },
    })
  }, musicScene.value)
}

watch(selectedExperience, animateMusicScene, { flush: 'post' })
onBeforeUnmount(stopMusicAnimation)
</script>

<template>
  <main class="page-section process-page-refined">
    <section class="page-hero process-intro" aria-labelledby="process-page-title">
      <span class="process-kicker"><Sparkles :size="15" /> From craft to keepsake</span>
      <h1 id="process-page-title">How Stack Petals <span>works</span></h1>
      <p>Choose a handcrafted gift, make the experience personal, and let one QR code hold the message, memories, music, and more.</p>
      <ol class="process-overview" aria-label="Process overview">
        <li v-for="(step, index) in overviewSteps" :key="step.title" class="overview-step">
          <span class="overview-number" aria-hidden="true">0{{ index + 1 }}</span>
          <span class="overview-icon"><component :is="step.icon" :size="23" weight="duotone" aria-hidden="true" /></span>
          <span class="overview-title">{{ step.title }}</span>
          <span class="overview-detail">{{ step.detail }}</span>
          <span v-if="index < overviewSteps.length - 1" class="overview-connector" aria-hidden="true"><ArrowRight :size="14" weight="regular" /></span>
        </li>
      </ol>
    </section>

    <section class="process-journey-band" aria-labelledby="order-journey-title">
      <div class="process-section-heading">
        <div>
          <span class="process-section-label">Journey one</span>
          <h2 id="order-journey-title">How your gift is made</h2>
        </div>
        <p>Five clear stages from your first choice to pickup or delivery.</p>
      </div>

      <ol class="process-order-timeline">
        <li v-for="(step, index) in orderSteps" :key="step.title">
          <div class="process-step-marker">
            <component :is="step.icon" :size="21" weight="regular" />
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
          </div>
          <div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
          </div>
        </li>
      </ol>

      <div class="fulfillment-studio" aria-labelledby="fulfillment-title">
        <div class="fulfillment-intro"><span class="process-section-label">The final little step</span><h3 id="fulfillment-title">Receive it your way.</h3></div>
        <div class="fulfillment-grid">
        <article class="fulfillment-card">
          <span class="fulfillment-icon"><Store :size="30" weight="duotone" aria-hidden="true" /></span>
          <div class="fulfillment-copy">
            <h3>Pickup at Stack Petals</h3>
            <p>No shipping fee. Your order tracker changes to ready for pickup when the gift is prepared.</p>
          </div>
          <span class="fulfillment-note"><CheckCircle2 :size="15" weight="duotone" aria-hidden="true" /> No shipping fee</span>
        </article>
        <article class="fulfillment-card fulfillment-card--delivery">
          <span class="fulfillment-icon"><Truck :size="30" weight="duotone" aria-hidden="true" /></span>
          <div class="fulfillment-copy">
            <h3>Doorstep delivery</h3>
            <p>The delivery fee is calculated from the barangay, city or municipality, and province entered at checkout.</p>
          </div>
          <span class="fulfillment-note"><WalletCards :size="15" weight="duotone" aria-hidden="true" /> Fee calculated at checkout</span>
        </article>
        </div>
      </div>
    </section>

    <section class="process-recipient-band" aria-labelledby="recipient-journey-title">
      <div class="process-section-heading">
        <div>
          <span class="process-section-label">Journey two</span>
          <h2 id="recipient-journey-title">What they unlock</h2>
        </div>
        <p>Select a chapter to preview the experience. Only the chosen media is loaded.</p>
      </div>

      <div class="process-experience-layout">
        <div class="process-experience-tabs" role="tablist" aria-label="Recipient experience previews">
          <button
            v-for="(feature, index) in experienceFeatures"
            :key="feature.id"
            type="button"
            role="tab"
            :aria-selected="selectedExperience === feature.id"
            :class="{ active: selectedExperience === feature.id }"
            @click="selectedExperience = feature.id"
          >
            <span class="process-tab-number">{{ String(index + 1).padStart(2, '0') }}</span>
            <component :is="feature.icon" :size="21" weight="regular" />
            <span>
              <small>{{ feature.eyebrow }}</small>
              <strong>{{ feature.title }}</strong>
            </span>
          </button>
        </div>

        <div class="process-media-stage" role="tabpanel">
          <Transition name="process-media" mode="out-in" @after-enter="animateMusicScene">
            <div :key="activeExperience.id" class="process-media-inner">
              <video
                v-if="activeExperience.video"
                :aria-label="activeExperience.videoLabel"
                autoplay
                muted
                loop
                playsinline
                preload="auto"
                disablepictureinpicture
              >
                <source :src="activeExperience.video" type="video/mp4" />
              </video>
              <div
                v-else-if="activeExperience.id === 'music'"
                ref="musicScene"
                class="process-music-visual"
                role="img"
                aria-label="A romantic animated record and music visualizer"
              >
                <div class="process-music-notes" aria-hidden="true">
                  <Music2 v-for="note in 4" :key="note" class="process-music-note" :size="22" />
                </div>
                <div class="process-music-player" aria-hidden="true">
                  <span class="process-music-glow"></span>
                  <div class="process-music-record">
                    <span class="process-record-groove groove-one"></span>
                    <span class="process-record-groove groove-two"></span>
                    <span class="process-record-label"><Flower2 :size="29" weight="regular" /></span>
                  </div>
                  <div class="process-music-tonearm"><span></span></div>
                </div>
                <div class="process-music-copy">
                  <span>Now playing</span>
                  <strong>A song chosen for this moment</strong>
                  <div class="process-music-equalizer" aria-hidden="true">
                    <i v-for="bar in 8" :key="bar" class="process-music-bar"></i>
                  </div>
                  <p><Music2 :size="16" /> Softly playing inside the keepsake</p>
                </div>
              </div>
              <img
                v-else
                :src="activeExperience.image"
                :alt="activeExperience.imageAlt"
                decoding="async"
              />
              <div class="process-media-caption">
                <span>{{ activeExperience.eyebrow }}</span>
                <h3>{{ activeExperience.title }}</h3>
                <p>{{ activeExperience.desc }}</p>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </section>

    <section class="process-expectations" aria-labelledby="expectations-title">
      <div>
        <span class="process-section-label">Before you order</span>
        <h2 id="expectations-title">Made thoughtfully, never rushed</h2>
      </div>
      <ul>
        <li><CheckCircle2 :size="19" /> Available stock can be reserved briefly during payment.</li>
        <li><CheckCircle2 :size="19" /> Pre-order preparation follows the product's stated preparation days.</li>
        <li><CheckCircle2 :size="19" /> Delivery dates depend on available daily slots.</li>
        <li><CheckCircle2 :size="19" /> Your receipt and order reference let you track every update.</li>
      </ul>
    </section>

    <section class="process-final-cta keepsake-cta" aria-labelledby="process-cta-title">
      <div class="keepsake-cta-copy">
        <span class="keepsake-cta-icon"><Box :size="27" weight="duotone" aria-hidden="true" /></span>
        <span class="keepsake-cta-label">Ready to make one meaningful?</span>
        <h2 id="process-cta-title">Choose the gift. We will craft the moment around it.</h2>
        <p>Handcrafted flowers. A personal story. Something worth keeping.</p>
      </div>
      <RouterLink to="/products" class="process-shop-link">
        Create your gift <ArrowRight :size="18" aria-hidden="true" />
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.process-page-refined .keepsake-cta { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:38px; padding:38px 40px; background:#e8eee2; border:1px solid #d2deca; border-radius:25px; color:#35483b; }
.keepsake-cta-copy { min-width:0; }
.process-page-refined .keepsake-cta .keepsake-cta-icon { display:grid; place-items:center; width:52px; height:52px; margin:0 0 22px; border:1px solid #cbd9c2; border-radius:16px; background:#f5f8ef; color:#456a50; }
.process-page-refined .keepsake-cta .keepsake-cta-label { display:block; margin-bottom:11px; color:#4e6554; font-size:10px; font-weight:600; line-height:1.6; letter-spacing:.1em; text-transform:uppercase; }
.process-page-refined .keepsake-cta h2 { max-width:620px; margin:0; color:#35483b; font:500 clamp(30px,3.8vw,43px)/1.13 'Cormorant Garamond',Georgia,serif; letter-spacing:-.025em; text-wrap:balance; }
.keepsake-cta-copy p { margin:17px 0 0; color:#566553; font-size:12px; line-height:1.8; }
.process-page-refined .keepsake-cta .process-shop-link { min-height:50px; padding:14px 24px; border:1px solid #496b56; background:#496b56; color:#fffaf5; font-size:12px; font-weight:500; box-shadow:0 5px 16px #354b3914; }
.process-page-refined .keepsake-cta .process-shop-link:hover { background:#385441; border-color:#385441; color:#fffaf5; }
.process-page-refined .keepsake-cta .process-shop-link:focus-visible { outline:2px solid #35483b; outline-offset:4px; }
@media(max-width:800px) { .process-page-refined .keepsake-cta { grid-template-columns:1fr; justify-items:center; gap:25px; padding:32px 26px; text-align:center; } .process-page-refined .keepsake-cta .keepsake-cta-icon { margin-inline:auto; } .process-page-refined .keepsake-cta h2 { max-width:520px; } }
@media(max-width:360px) { .process-page-refined .keepsake-cta { padding:28px 21px; } }
.process-overview { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:22px; width:min(760px,100%); margin:34px auto 0; padding:0; list-style:none; }
.overview-step { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:9px; min-width:0; padding:24px 13px 22px; border:1px solid #e6d6cd; border-radius:19px; background:linear-gradient(145deg,#fffdf9,#fbf4ed); box-shadow:0 5px 18px #6e514307; text-align:center; }
.overview-number { position:absolute; top:10px; right:12px; color:#bba99b; font-size:9px; line-height:1.4; letter-spacing:.06em; }
.overview-icon { display:grid; place-items:center; flex:none; width:45px; height:45px; margin-bottom:5px; border:1px solid #dce5d4; border-radius:15px; background:#edf3e6; color:#5f8872; }
.overview-step:nth-child(even) .overview-icon { background:#f8e9e6; border-color:#ecd3cf; color:#b27b83; }
.overview-title { color:#54483f; font-size:12px; font-weight:600; line-height:1.4; }
.overview-detail { color:#8b786c; font-size:10px; line-height:1.6; text-wrap:balance; }
.overview-connector { position:absolute; display:grid; place-items:center; top:50%; right:-20px; width:16px; height:20px; transform:translateY(-50%); color:#b79a89; }
@media(max-width:700px) {
  .process-overview { grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; max-width:420px; margin-top:28px; }
  .overview-step { padding:23px 12px 21px; }
  .overview-connector { display:none; }
}
@media(max-width:360px) { .process-overview { gap:11px; } .overview-detail { font-size:9px; } }
.fulfillment-studio { margin-top:45px; padding-top:32px; border-top:1px solid #e7d7cf; }
.fulfillment-intro { margin-bottom:25px; text-align:center; }
.fulfillment-intro h3 { margin:8px 0 0; color:#51473d; font:500 32px/1.15 'Cormorant Garamond',Georgia,serif; letter-spacing:-.025em; }
.fulfillment-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:22px; }
.fulfillment-card { display:flex; flex-direction:column; align-items:center; min-width:0; padding:30px 32px 25px; border:1px solid #dfe2d2; border-radius:22px; background:linear-gradient(145deg,#fffdf9,#f1f5eb); text-align:center; box-shadow:0 8px 24px #594a3705; }
.fulfillment-card--delivery { border-color:#e6d3cd; background:linear-gradient(145deg,#fffdf9,#fbefea); }
.fulfillment-icon { display:grid; place-items:center; width:64px; height:64px; margin:0 auto 22px; border-radius:20px; border:1px solid #d5dfcb; background:#eaf1e3; color:#5f8872; box-shadow:0 0 0 6px #f5f8f0; }
.fulfillment-card--delivery .fulfillment-icon { border-color:#e9cfcf; background:#f6e4e2; color:#aa7580; box-shadow:0 0 0 6px #fdf4ef; }
.fulfillment-icon svg { display:block; }
.fulfillment-copy { width:100%; max-width:360px; }
.fulfillment-copy h3 { margin:0 0 12px; color:#493f36; font:500 clamp(26px,2.6vw,30px)/1.15 'Cormorant Garamond',Georgia,serif; letter-spacing:-.02em; text-wrap:balance; }
.fulfillment-copy p { margin:0 0 24px; color:#78695f; font-size:12px; line-height:1.85; text-wrap:pretty; }
.fulfillment-note { display:flex; align-items:center; justify-content:center; gap:7px; width:100%; margin-top:auto; padding-top:18px; border-top:1px solid #dfe3d4; color:#5b775e; font-size:10px; font-weight:500; line-height:1.6; }
.fulfillment-note svg { flex:none; }
.fulfillment-card--delivery .fulfillment-note { border-color:#ebd8cf; color:#9a6d73; }
@media(max-width:700px) { .fulfillment-grid { grid-template-columns:1fr; gap:16px; } .fulfillment-studio { margin-top:32px; padding-top:28px; } .fulfillment-card { padding:28px 24px 23px; } }
@media(max-width:360px) { .fulfillment-card { padding:25px 19px 22px; } .fulfillment-copy h3 { font-size:26px; } }
</style>
