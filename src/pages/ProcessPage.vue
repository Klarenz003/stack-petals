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
      <nav class="process-quick-path" aria-label="Process overview">
        <span><Gift :size="18" /> Choose</span>
        <ArrowRight :size="15" aria-hidden="true" />
        <span><Heart :size="18" /> Personalize</span>
        <ArrowRight :size="15" aria-hidden="true" />
        <span><Flower2 :size="18" /> We craft</span>
        <ArrowRight :size="15" aria-hidden="true" />
        <span><QrCode :size="18" /> They unlock</span>
      </nav>
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

      <div class="process-fulfillment-split">
        <article>
          <Store :size="23" />
          <div>
            <h3>Pickup at Stack Petals</h3>
            <p>No shipping fee. Your order tracker changes to ready for pickup when the gift is prepared.</p>
          </div>
        </article>
        <article>
          <Truck :size="23" />
          <div>
            <h3>Doorstep delivery</h3>
            <p>The delivery fee is calculated from the barangay, city or municipality, and province entered at checkout.</p>
          </div>
        </article>
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

    <section class="process-final-cta">
      <div>
        <Box :size="28" weight="regular" />
        <span>Ready to make one meaningful?</span>
        <h2>Choose the gift. We will craft the moment around it.</h2>
      </div>
      <RouterLink to="/products" class="process-shop-link">
        Create your gift <ArrowRight :size="18" />
      </RouterLink>
    </section>
  </main>
</template>
