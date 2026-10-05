<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { PhX, PhArrowRight, PhArrowLeft, PhHeart, PhUsers, PhFlower, PhGift, PhEnvelopeOpen, PhImages, PhMusicNotes, PhCube, PhPlay, PhPause, PhArrowCounterClockwise } from '@phosphor-icons/vue'
import { useDialogFocus } from '@/composables/useDialogFocus'

const emit = defineEmits<{ close: [] }>()
const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const step = ref(0)
const selected = ref(0)
const music = ref<HTMLAudioElement | null>(null)
const playing = ref(false)
const audioError = ref(false)
let motion: gsap.Context | undefined
let audioRequest = 0
let disposed = false
const recipients = [
  { name: 'Someone I love', icon: PhHeart, salutation: 'To my favorite person,', message: 'In the big moments and the quiet ones, I would choose you all over again. These flowers are a little reminder of a very lasting feeling.' },
  { name: 'A friend', icon: PhUsers, salutation: 'To the friend who makes life brighter,', message: 'For every laugh, every check-in, and every time you showed up. Here is a little thank-you for being wonderfully you.' },
  { name: 'Family', icon: PhFlower, salutation: 'To someone who feels like home,', message: 'So much of who I am comes from the love you have given me. I hope this little gift reminds you how deeply you are appreciated.' },
  { name: 'Someone worth celebrating', icon: PhGift, salutation: 'This moment belongs to you,', message: 'For your birthday, your milestone, or the beautiful new chapter ahead. I am cheering for you today, and for everything still to come.' },
]
const recipient = computed(() => recipients[selected.value]!)
const shopDestination = computed(() => ({ path: '/products', query: { occasion: ['Romance', 'Friendship', 'Thank You', 'Celebration'][selected.value] } }))
const chapters = [ 'The invitation', 'Your words', 'Your memories', 'Your soundtrack', 'Every angle', 'Make it yours' ]
useDialogFocus(root, () => true, () => emit('close'))
function stopMusic() { audioRequest++; music.value?.pause(); playing.value = false }
async function toggleMusic() {
  if (playing.value) { stopMusic(); return }
  const request = ++audioRequest
  audioError.value = false
  try {
    await music.value?.play()
    if (request !== audioRequest) { music.value?.pause(); return }
    playing.value = true
  } catch { if (request === audioRequest) audioError.value = true }
}
function go(next: number) { stopMusic(); step.value = Math.max(0, Math.min(5, next)) }
watch(step, async () => {
  motion?.revert()
  await nextTick()
  if (disposed || !stage.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  motion = gsap.context(() => {
    gsap.from('.demo-reveal', { y: 18, opacity: 0, duration: .65, stagger: .08, ease: 'power3.out' })
  }, stage.value)
}, { immediate: true })
onBeforeUnmount(() => { disposed = true; stopMusic(); motion?.revert() })
</script>

<template>
  <Teleport to="body">
    <div class="keepsake-demo-backdrop" @click.self="emit('close')">
      <section ref="root" class="keepsake-demo" role="dialog" aria-modal="true" aria-labelledby="keepsake-demo-title" tabindex="-1">
        <header class="demo-header">
          <span class="demo-brand">Stack Petals <small>Sample recipient experience</small></span>
          <button class="demo-icon-button" aria-label="Close sample experience" @click="emit('close')"><PhX :size="20" /></button>
        </header>
        <div class="demo-layout">
          <aside class="demo-aside">
            <span class="demo-eyebrow">A gift with a story inside</span>
            <h2>Something to hold.<br /><em>Something to feel.</em></h2>
            <img src="/images/home-experience/bouquet-qr-guide.png" alt="Handcrafted blue bouquet with its QR keepsake tag" />
            <p>The flowers are only the beginning.</p>
            <div class="demo-progress" aria-label="Experience chapters">
              <button v-for="(chapter, index) in chapters" :key="chapter" :class="{ active: step === index, complete: step > index }" :aria-label="chapter" :aria-current="step === index ? 'step' : undefined" @click="go(index)"><span>{{ String(index + 1).padStart(2, '0') }}</span></button>
            </div>
          </aside>
          <div class="demo-main">
            <div class="demo-chapter"><span>{{ String(step + 1).padStart(2, '0') }} / 06</span>{{ chapters[step] }}</div>
            <div ref="stage" :key="step" class="demo-stage" aria-live="polite">
              <template v-if="step === 0">
                <img class="demo-envelope demo-reveal" src="/images/envelope-clean.png" alt="A sealed letter waiting to be opened" />
                <h3 id="keepsake-demo-title" class="demo-reveal">There’s more to this gift<br /><em>than flowers.</em></h3>
                <p class="demo-reveal">Who would you make smile?</p>
                <div class="demo-recipient-grid demo-reveal" role="group" aria-label="Choose a sample recipient">
                  <button v-for="(person, index) in recipients" :key="person.name" :aria-pressed="selected === index" :class="{ selected: selected === index }" @click="selected = index"><component :is="person.icon" :size="20" :weight="selected === index ? 'fill' : 'duotone'" />{{ person.name }}</button>
                </div>
              </template>
              <template v-else-if="step === 1">
                <PhEnvelopeOpen class="demo-reveal demo-chapter-icon" :size="30" weight="duotone" />
                <h3 id="keepsake-demo-title" class="demo-reveal">The words they’ll<br /><em>keep coming back to.</em></h3>
                <article class="demo-letter demo-reveal"><span>For you, always</span><h4>{{ recipient.salutation }}</h4><p>{{ recipient.message }}</p><small>With love, from me.</small></article>
                <p class="demo-note demo-reveal">This is a sample. Your real gift carries your own words.</p>
              </template>
              <template v-else-if="step === 2">
                <PhImages class="demo-reveal demo-chapter-icon" :size="30" weight="duotone" />
                <h3 id="keepsake-demo-title" class="demo-reveal">A place for<br /><em>your favorite memories.</em></h3>
                <div class="demo-media demo-reveal"><video src="/videos/photo_memories.mp4" controls playsinline muted preload="metadata" aria-label="Sample photo memories experience"></video></div>
                <p class="demo-reveal">Little moments. Big feelings. Add your photos when you personalize your letter.</p>
              </template>
              <template v-else-if="step === 3">
                <PhMusicNotes class="demo-reveal demo-chapter-icon" :size="30" weight="duotone" />
                <h3 id="keepsake-demo-title" class="demo-reveal">Some feelings<br /><em>sound like a song.</em></h3>
                <div class="demo-record demo-reveal" :class="{ playing }"><PhFlower :size="42" weight="duotone" /></div>
                <button class="demo-music-button demo-reveal" :aria-pressed="playing" @click="toggleMusic"><PhPause v-if="playing" :size="20" weight="fill" /><PhPlay v-else :size="20" weight="fill" />{{ playing ? 'Pause sample soundtrack' : 'Play sample soundtrack' }}</button>
                <p class="demo-reveal">Imagine the song that reminds them of you.</p>
                <p v-if="audioError" role="status" class="demo-note">The sample audio couldn’t play. You can still explore the other chapters.</p>
              </template>
              <template v-else-if="step === 4">
                <PhCube class="demo-reveal demo-chapter-icon" :size="30" weight="duotone" />
                <h3 id="keepsake-demo-title" class="demo-reveal">Their bouquet.<br /><em>A whole new perspective.</em></h3>
                <div class="demo-media demo-reveal"><video src="/videos/360view.mp4" controls playsinline muted preload="metadata" aria-label="Video demonstration of the bouquet 360-degree feature"></video></div>
                <p class="demo-note demo-reveal">Video demonstration. The interactive 360° view is available for eligible bouquets once their images are prepared.</p>
              </template>
              <template v-else>
                <PhGift class="demo-reveal demo-chapter-icon" :size="40" weight="duotone" />
                <h3 id="keepsake-demo-title" class="demo-reveal">Flowers they can hold.<br /><em>A feeling they can revisit.</em></h3>
                <p class="demo-reveal">A birthday. A milestone. A thank-you. Whatever the moment, make the story yours.</p>
                <RouterLink class="demo-primary demo-reveal" :to="shopDestination" @click="emit('close')">Shop Gifts <PhArrowRight :size="18" /></RouterLink>
                <RouterLink class="demo-text-link demo-reveal" to="/process" @click="emit('close')">See how personalization works</RouterLink>
                <button class="demo-replay demo-reveal" @click="go(0)"><PhArrowCounterClockwise :size="16" /> Replay the surprise</button>
              </template>
            </div>
            <footer class="demo-footer">
              <button v-if="step > 0" class="demo-back" @click="go(step - 1)"><PhArrowLeft :size="16" /> Back</button><span v-else class="demo-note">Made personal. Never ordinary.</span>
              <button v-if="step < 5" class="demo-primary" @click="go(step + 1)">{{ step === 0 ? 'Open your surprise' : step === 4 ? 'Make it yours' : 'Continue the story' }} <PhArrowRight :size="18" /></button>
              <button v-else class="demo-back" @click="emit('close')">Back to the bouquet</button>
            </footer>
          </div>
        </div>
        <audio ref="music" src="/music/lettermusic.mp3" preload="none" @pause="playing = false" @ended="playing = false"></audio>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.keepsake-demo-backdrop{position:fixed;inset:0;z-index:4000;display:grid;place-items:center;padding:24px;background:#302a28a8;backdrop-filter:blur(12px)}
.keepsake-demo{width:min(1060px,100%);max-height:calc(100dvh - 48px);overflow:auto;overscroll-behavior:contain;background:#fffaf6;color:#443c37;border:1px solid #f1ddd2;border-radius:28px;box-shadow:0 28px 100px #241b2940;outline:none}
.demo-header{display:flex;justify-content:space-between;align-items:center;padding:20px 28px;border-bottom:1px solid #ecdcd3;gap:16px}.demo-brand{font:600 25px/1.2 'Cormorant Garamond',serif}.demo-brand small{display:block;font:500 9px/1.6 Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#796b63;margin-top:4px}
.demo-icon-button{display:grid;place-items:center;width:44px;height:44px;border:1px solid #e6d1c6;background:#fffaf6;border-radius:50%;color:#685850;flex-shrink:0;cursor:pointer}
.demo-layout{display:grid;grid-template-columns:.85fr 1.15fr}.demo-aside{padding:40px 32px;background:radial-gradient(ellipse at center,#f8e2dd,transparent 70%),#f6eee7;border-right:1px solid #ecdcd3;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center}.demo-eyebrow{font:600 9px/1.6 Inter,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#92636c}.demo-aside h2{font:500 36px/1.08 'Cormorant Garamond',serif;margin:18px 0}.demo-aside em,.demo-stage em{color:#a76576;font-weight:500}.demo-aside>img{width:min(260px,85%);max-height:310px;object-fit:contain;filter:drop-shadow(0 16px 16px #50444418)}.demo-aside>p{font:400 17px/1.5 'Cormorant Garamond',serif;color:#6b5a52}
.demo-progress{display:flex;gap:8px;margin-top:16px}.demo-progress button{display:grid;place-items:center;width:34px;height:34px;border:1px solid #d8c9ba;border-radius:50%;background:#fff8f1;color:#75665b;font:500 10px Inter,sans-serif;cursor:pointer}.demo-progress button.active{background:#4a6b5a;color:#fff;border-color:#4a6b5a;box-shadow:0 0 0 4px #4a6b5a12}.demo-progress button.complete{border-color:#91a390;color:#4a6b5a}
.demo-main{padding:28px 34px;display:flex;flex-direction:column;min-width:0}.demo-chapter{display:flex;align-items:center;gap:14px;font:600 10px/1.5 Inter,sans-serif;text-transform:uppercase;letter-spacing:.12em;color:#77665d}.demo-chapter>span{color:#a76576}.demo-stage{min-height:430px;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px 0;gap:18px}.demo-stage h3{font:500 clamp(29px,3vw,40px)/1.04 'Cormorant Garamond',serif;margin:0;text-wrap:balance}.demo-stage p{font:400 13px/1.7 Inter,sans-serif;color:#70635c;margin:0;max-width:360px}.demo-stage .demo-note,.demo-note{font:400 11px/1.6 Inter,sans-serif;color:#77685f}.demo-envelope{width:150px;height:110px;object-fit:contain;filter:drop-shadow(0 10px 10px #ae757520)}.demo-chapter-icon{color:#5f8872;flex-shrink:0}
.demo-recipient-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%}.demo-recipient-grid button{display:flex;align-items:center;gap:10px;text-align:left;padding:14px;border:1px solid #e4d3c9;background:#fff7f2;border-radius:14px;font:500 11px/1.5 Inter,sans-serif;color:#66564e;cursor:pointer;min-height:60px}.demo-recipient-grid svg{flex-shrink:0;color:#5f8872}.demo-recipient-grid button.selected{background:#eef3e9;border-color:#8ca58c;color:#354e3e}
.demo-letter{width:100%;box-sizing:border-box;padding:26px 28px;background:linear-gradient(135deg,#fffdfb,#fbece7);border:1px solid #e8cfc4;border-radius:3px 20px 20px 3px;box-shadow:0 10px 30px #68433708;text-align:left}.demo-letter>span{font:500 9px Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#a76576}.demo-letter h4{font:500 25px/1.15 'Cormorant Garamond',serif;margin:18px 0 12px}.demo-letter p{font:400 19px/1.5 'Cormorant Garamond',serif;color:#554840}.demo-letter small{display:block;margin-top:20px;font:italic 18px 'Cormorant Garamond',serif;color:#956371}
.demo-media{width:100%;border:1px solid #e8d7ca;border-radius:18px;overflow:hidden;background:#f5ebe4}.demo-media video{display:block;width:100%;height:230px;object-fit:contain;background:#f7efea}.demo-record{width:160px;height:160px;display:grid;place-items:center;border-radius:50%;background:repeating-radial-gradient(circle,#443d3d 0 2px,#514848 3px 4px);border:10px solid #eee3d8;box-shadow:0 12px 28px #443c3720;color:#fff}.demo-record svg{background:#b77a83;border-radius:50%;padding:18px;box-sizing:content-box}.demo-record.playing{animation:record-turn 12s linear infinite}
.demo-music-button{display:flex;align-items:center;gap:10px;border:1px solid #97ac96;border-radius:999px;padding:12px 20px;background:#eef3e9;color:#354e3e;font:600 12px Inter,sans-serif;cursor:pointer}.demo-primary{display:inline-flex;align-items:center;justify-content:center;gap:12px;min-height:46px;padding:13px 21px;border:1px solid #4a6b5a;border-radius:999px;background:#4a6b5a;color:#fffaf6;text-decoration:none;font:600 12px/1.5 Inter,sans-serif;cursor:pointer;box-sizing:border-box}.demo-primary:hover{background:#385342}.demo-footer{display:flex;justify-content:space-between;align-items:center;gap:16px;border-top:1px solid #ecdcd3;padding-top:20px}.demo-back,.demo-replay{display:inline-flex;align-items:center;gap:8px;border:0;background:transparent;color:#66564e;font:500 12px/1.5 Inter,sans-serif;cursor:pointer;min-height:44px}.demo-text-link{font:500 12px/1.6 Inter,sans-serif;color:#4a6b5a;text-underline-offset:5px}.demo-replay{color:#986572;font-size:11px}
.keepsake-demo :is(button,a):focus-visible{outline:2px solid #4a6b5a;outline-offset:4px}
.demo-header{position:sticky;top:0;z-index:2;background:#fffaf6}
.keepsake-demo .demo-footer{background:transparent;color:#66564e;box-shadow:none;border-radius:0;margin:0;width:auto;padding:20px 0 0}
@keyframes record-turn{to{transform:rotate(360deg)}}
@media(max-width:700px){.keepsake-demo-backdrop{padding:0}.keepsake-demo{width:100%;height:100dvh;max-height:100dvh;border:0;border-radius:0;display:flex;flex-direction:column;padding-top:env(safe-area-inset-top);box-sizing:border-box}.demo-header{padding:14px 20px;flex-shrink:0}.demo-brand{font-size:23px}.demo-layout{display:flex;flex-direction:column;flex:1}.demo-aside{padding:16px 20px;border-right:0;border-bottom:1px solid #ecdcd3}.demo-aside :is(h2,img,p){display:none}.demo-progress{margin-top:12px;gap:12px}.demo-main{padding:20px max(20px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left));flex:1}.demo-stage{min-height:350px;padding:24px 0;gap:18px}.demo-stage h3{font-size:34px}.demo-footer{gap:10px;flex-wrap:wrap}.demo-footer>.demo-note{display:none}.demo-footer>.demo-primary{margin-left:auto}.demo-media video{height:210px}}
@media(max-width:360px){.demo-main{padding-inline:16px}.demo-recipient-grid button{padding:11px;font-size:10px}.demo-stage h3{font-size:30px}.demo-letter{padding:20px}.demo-progress{gap:8px}}
@media(prefers-reduced-motion:reduce){.demo-record.playing{animation:none}}
</style>
