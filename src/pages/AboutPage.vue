<script setup lang="ts">
import { PhCode, PhArrowRight as ArrowRight, PhFlower as Flower2, PhHeart as Heart, PhImages as Images, PhInfinity as Infinity, PhChatText as MessageSquareText, PhMusicNotes as Music2, PhQrCode as QrCode, PhCube as Rotate3D, PhSparkle as Sparkles } from '@phosphor-icons/vue'

const milestones = [
  { year: 'May 2026', title: 'The first line of code', description: "Stack Petals began as Klarenz Evasco's idea to bring engineering and handmade artistry into one meaningful gift.", icon: PhCode, chapter: 'An idea takes root', note: 'Built with intention' },
  { year: 'First creation', title: 'Craft met connection', description: 'A handcrafted flower became more than an object through a QR keepsake filled with words, memories, music, and motion.', icon: Flower2, chapter: 'Something begins to bloom', note: 'Crafted by hand' },
  { year: 'Today', title: 'Every gift tells a story', description: 'We continue creating lasting floral pieces that help people say what matters in a personal, modern way.', icon: Heart, chapter: 'The story keeps growing', note: 'Given from the heart' },
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
  { initials: 'KE', name: 'Klarenz Evasco', role: 'Founder, software engineer, designer, and craftsman', icon: PhCode, discipline: 'Engineering & design' },
  { initials: 'GE', name: 'Gerlie Evasco', role: 'Florist and floral craft partner', icon: Flower2, discipline: 'Flowers & artistry' },
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
      <ol class="journey-timeline">
        <li v-for="(milestone, index) in milestones" :key="milestone.year" class="journey-chapter">
          <div class="journey-marker"><span class="journey-dot" aria-hidden="true"></span><span>{{ milestone.chapter }}</span></div>
          <article class="journey-card" :aria-labelledby="`journey-chapter-${index}`">
            <div class="journey-card-top"><span class="journey-icon"><component :is="milestone.icon" :size="27" weight="duotone" aria-hidden="true" /></span><span class="journey-number" aria-hidden="true">0{{ index + 1 }}</span></div>
            <span class="journey-date">{{ milestone.year }}</span>
            <h3 :id="`journey-chapter-${index}`">{{ milestone.title }}</h3>
            <p>{{ milestone.description }}</p>
            <div class="journey-card-foot"><span class="journey-foot-line" aria-hidden="true"></span><span>{{ milestone.note }}</span></div>
          </article>
        </li>
      </ol>
      <p class="journey-postscript"><Sparkles :size="17" weight="duotone" aria-hidden="true" /> A little engineering. A lot of heart. A story still unfolding.</p>
    </section>

    <section class="about-difference" aria-labelledby="about-difference-title">
      <img class="about-craft-image" src="/images/craftedflowersv2.webp" alt="A handcrafted Stack Petals floral gift" />
      <div class="about-difference-copy">
        <p class="about-section-label">More than a crafted gift</p>
        <h2 id="about-difference-title">One piece, many ways to feel the moment again.</h2>
        <p>The physical craft is only the beginning. Every part of the digital experience is built to feel intimate, easy to revisit, and unmistakably made for one person.</p>
        <ul class="about-experience-list">
          <li v-for="experience in experiences" :key="experience.label"><span class="experience-icon"><component :is="experience.icon" :size="23" weight="duotone" aria-hidden="true" /></span><span class="experience-label">{{ experience.label }}</span></li>
        </ul>
      </div>
    </section>

    <section class="about-values principles-section" aria-labelledby="about-values-title">
      <div class="about-section-heading"><p class="about-section-label">What guides us</p><h2 id="about-values-title">Built carefully. Given wholeheartedly.</h2></div>
      <div class="principles-grid">
        <article v-for="(value, index) in values" :key="value.title" class="principle-card">
          <span class="principle-kicker">Our promise · 0{{ index + 1 }}</span>
          <span class="principle-icon"><component :is="value.icon" :size="32" weight="duotone" aria-hidden="true" /></span>
          <h3>{{ value.title }}</h3><p>{{ value.description }}</p>
          <span class="principle-flourish" aria-hidden="true"><span></span><Flower2 :size="15" weight="duotone" /><span></span></span>
        </article>
      </div>
    </section>

    <section class="makers-section" aria-labelledby="about-team-title">
      <div class="about-section-heading"><p class="about-section-label">The people behind the petals</p><h2 id="about-team-title">A small team with a personal touch.</h2></div>
      <p class="makers-intro">Two different crafts. One shared love for making something meaningful.</p>
      <div class="makers-grid">
        <article v-for="member in team" :key="member.initials" class="maker-card">
          <span class="maker-discipline">{{ member.discipline }}</span>
          <div class="maker-avatar" aria-hidden="true"><span>{{ member.initials }}</span><span class="maker-emblem"><component :is="member.icon" :size="20" weight="duotone" /></span></div>
          <h3>{{ member.name }}</h3>
          <p>{{ member.role }}</p>
          <span class="maker-signature">Stack Petals <span aria-hidden="true"></span> Made with care</span>
        </article>
      </div>
    </section>

    <section class="about-cta">
      <div><p class="about-section-label">Find something meaningful</p><h2>Let your next gift hold more than a moment.</h2></div>
      <RouterLink class="about-cta-link" to="/products">Explore our creations <ArrowRight :size="18" aria-hidden="true" /></RouterLink>
    </section>
  </main>
</template>

<style scoped>
.about-page .about-experience-list { grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
.about-page .about-experience-list li { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; min-width:0; min-height:116px; padding:18px 16px; box-sizing:border-box; border:1px solid #d9e1cf; border-radius:12px; background:#eff3e9; text-align:center; }
.experience-icon { display:grid; place-items:center; flex:none; width:34px; height:34px; margin:0 auto; color:#5f8872; }
.experience-icon svg { display:block; }
.experience-label { display:block; width:100%; max-width:180px; color:#617357; font-size:12px; line-height:1.55; text-wrap:balance; overflow-wrap:break-word; }
@media(max-width:360px) { .about-page .about-experience-list { gap:10px; } .about-page .about-experience-list li { padding:16px 10px; } .experience-label { font-size:11px; } }
.about-page .principles-section { padding:65px 0 55px; margin-top:55px; border-top:1px solid #eadbd3; border-bottom:1px solid #eadbd3; background:transparent; }
.principles-section .about-section-heading,.makers-section .about-section-heading { max-width:650px; margin:0 auto 30px; text-align:center; }
.principles-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:22px; }
.principle-card { position:relative; display:flex; flex-direction:column; align-items:center; min-width:0; padding:32px 27px 26px; border:1px solid #e6d7cf; border-radius:24px; text-align:center; background:linear-gradient(160deg,#fffdf9,#f7f3ea); box-shadow:0 8px 28px #5b463308; transition:transform .25s,box-shadow .25s; }
.principle-card:nth-child(2) { background:linear-gradient(160deg,#fffdf9,#f1f5ec); }
.principle-card:nth-child(3) { background:linear-gradient(160deg,#fffdf9,#fbefed); }
.principle-kicker { color:#927f70; font-size:9px; font-weight:600; letter-spacing:.13em; line-height:1.6; text-transform:uppercase; }
.principle-icon { display:grid; place-items:center; width:72px; height:72px; flex:none; margin:24px auto 22px; border:1px solid #d9e3d3; border-radius:23px; color:#5f8872; background:#edf3e8; box-shadow:0 0 0 7px #f6f8f1; }
.principle-card:nth-child(3) .principle-icon { color:#b27782; border-color:#ebd0d2; background:#f8e5e6; box-shadow:0 0 0 7px #fdf5f2; }
.principle-card h3 { margin:0 0 14px; color:#483f38; font:500 clamp(27px,2.4vw,32px)/1.15 'Cormorant Garamond',Georgia,serif; letter-spacing:-.025em; }
.principle-card p { max-width:290px; margin:0 0 26px; color:#75675e; font-size:13px; line-height:1.85; text-wrap:pretty; }
.principle-flourish { display:flex; align-items:center; justify-content:center; gap:10px; width:100%; margin-top:auto; color:#b59286; }
.principle-flourish > span { height:1px; width:42px; background:#e3d6cb; }
.makers-section { padding:65px 0 0; }
.makers-section .about-section-heading { margin-bottom:14px; }
.makers-intro { max-width:460px; margin:0 auto 32px; text-align:center; color:#807167; font-size:12px; line-height:1.8; }
.makers-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); max-width:880px; gap:24px; margin:0 auto; }
.maker-card { position:relative; display:flex; flex-direction:column; align-items:center; min-width:0; padding:30px 34px 25px; border:1px solid #e4d6cc; border-radius:25px; text-align:center; background:radial-gradient(ellipse at 50% 35%,#ecf2e6,transparent 65%),#fffbf7; box-shadow:0 7px 26px #58443306; }
.maker-card:nth-child(2) { background:radial-gradient(ellipse at 50% 35%,#f8e6e4,transparent 65%),#fffbf7; }
.maker-discipline { color:#62816b; font-size:9px; font-weight:600; letter-spacing:.13em; line-height:1.6; text-transform:uppercase; }
.maker-card:nth-child(2) .maker-discipline { color:#ac7580; }
.maker-avatar { position:relative; display:grid; place-items:center; width:92px; height:92px; margin:27px 0 22px; border-radius:50%; border:1px solid #cfddc9; background:linear-gradient(140deg,#f7faf2,#dfebd9); box-shadow:0 0 0 8px #ffffff88; color:#5f7c62; }
.maker-avatar > span:first-child { font:500 33px/1 'Cormorant Garamond',Georgia,serif; letter-spacing:-.025em; }
.maker-emblem { position:absolute; display:grid; place-items:center; width:34px; height:34px; bottom:-3px; right:-3px; border:3px solid #fffbf7; border-radius:12px; background:#6c8d72; color:#fffaf5; }
.maker-card:nth-child(2) .maker-avatar { border-color:#e9c9c9; background:linear-gradient(140deg,#fff6f3,#f0d7d5); color:#a16e76; }
.maker-card:nth-child(2) .maker-emblem { background:#b78289; }
.maker-card h3 { margin:0 0 10px; color:#453e36; font:500 32px/1.15 'Cormorant Garamond',Georgia,serif; letter-spacing:-.025em; }
.maker-card p { max-width:280px; margin:0 0 26px; color:#786a60; font-size:12px; line-height:1.8; }
.maker-signature { display:flex; align-items:center; justify-content:center; gap:9px; width:100%; padding-top:19px; margin-top:auto; border-top:1px solid #e6d9ce; color:#9b897a; font-size:9px; line-height:1.5; letter-spacing:.06em; }
.maker-signature > span { width:3px; height:3px; background:#bca491; border-radius:50%; }
@media(hover:hover) { .principle-card:hover { transform:translateY(-4px); box-shadow:0 14px 30px #5b463310; } }
@media(max-width:950px) and (min-width:701px) { .principles-grid { gap:14px; } .principle-card { padding:28px 19px 23px; } }
@media(max-width:700px) {
  .about-page .principles-section { padding:45px 0; margin-top:40px; }
  .principles-grid { grid-template-columns:1fr; gap:18px; max-width:440px; margin:0 auto; }
  .principle-card { padding:29px 27px 25px; }
  .makers-section { padding-top:45px; }
  .makers-grid { grid-template-columns:1fr; gap:18px; max-width:440px; }
  .maker-card { padding:29px 26px 24px; }
  .makers-intro { max-width:310px; }
}
@media(prefers-reduced-motion:reduce) { .principle-card { transition:none; } .principle-card:hover { transform:none; } }
.journey-timeline { position:relative; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:22px; margin:32px 0 0; padding:0; list-style:none; }
.journey-timeline::before { content:''; position:absolute; top:8px; left:8px; right:8px; height:1px; background:linear-gradient(90deg,#bdcdb8,#dec4bf,#bdcdb8); }
.journey-chapter { position:relative; min-width:0; }
.journey-marker { position:relative; display:flex; align-items:center; gap:10px; margin-bottom:22px; color:#687f6b; font-size:10px; font-weight:600; line-height:1.6; letter-spacing:.04em; }
.journey-marker > span:last-child { padding-right:12px; background:#fff8f5; }
.journey-dot { flex:none; width:17px; height:17px; border:4px solid #fff8f5; border-radius:50%; background:#6f927c; box-shadow:0 0 0 1px #bfcfbd; }
.journey-chapter:nth-child(2) .journey-dot { background:#b77a83; box-shadow:0 0 0 1px #dfbcc1; }
.journey-card { position:relative; display:flex; flex-direction:column; height:calc(100% - 39px); box-sizing:border-box; padding:28px; overflow:hidden; border:1px solid #e5d6ce; border-radius:22px; background:linear-gradient(145deg,#fffcf8,#faf4ed); box-shadow:0 8px 28px #5d483a06; transition:transform .25s,border-color .25s,box-shadow .25s; }
.journey-card::before { content:''; position:absolute; top:0; left:28px; right:28px; height:2px; background:#a6bca2; border-radius:0 0 2px 2px; }
.journey-chapter:nth-child(2) .journey-card { background:linear-gradient(145deg,#fffcf8,#fbefeb); }
.journey-chapter:nth-child(2) .journey-card::before { background:#d9a6ad; }
.journey-chapter:nth-child(3) .journey-card { background:linear-gradient(145deg,#fffcf8,#f0f4eb); }
.journey-card-top { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:27px; }
.journey-icon { display:grid; place-items:center; width:54px; height:54px; border:1px solid #dce5d5; border-radius:17px; background:#edf2e8; color:#5f8872; }
.journey-chapter:nth-child(2) .journey-icon { background:#f8e9e8; border-color:#ecd2d2; color:#ac727d; }
.journey-number { color:#d7c9bb; font:400 47px/1 'Cormorant Garamond',Georgia,serif; letter-spacing:-.06em; }
.journey-date { display:block; margin-bottom:12px; color:#56775f; font-size:10px; font-weight:700; line-height:1.5; letter-spacing:.12em; text-transform:uppercase; }
.journey-chapter:nth-child(2) .journey-date { color:#9d6671; }
.journey-card h3 { margin:0 0 14px; color:#443e37; font:500 clamp(25px,2.5vw,31px)/1.12 'Cormorant Garamond',Georgia,serif; letter-spacing:-.025em; text-wrap:balance; }
.journey-card p { margin:0 0 27px; color:#73685f; font-size:13px; line-height:1.85; }
.journey-card-foot { display:flex; align-items:center; gap:10px; padding-top:18px; margin-top:auto; border-top:1px solid #e7dbd1; color:#7c7468; font-size:9px; font-weight:600; line-height:1.5; letter-spacing:.08em; text-transform:uppercase; }
.journey-foot-line { width:18px; height:2px; flex:none; border-radius:2px; background:#9ab293; }
.journey-chapter:nth-child(2) .journey-foot-line { background:#ce9fa6; }
.journey-postscript { display:flex; align-items:center; justify-content:center; gap:9px; margin:25px 0 0; color:#7d7169; font-size:11px; line-height:1.7; text-align:center; }
.journey-postscript svg { flex:none; color:#b77a83; }
@media(hover:hover) { .journey-card:hover { transform:translateY(-4px); border-color:#bac9b2; box-shadow:0 15px 32px #5d483a0d; } }
@media(max-width:1000px) and (min-width:701px) { .journey-timeline { gap:14px; } .journey-card { padding:22px 19px; } .journey-marker { font-size:9px; gap:7px; } }
@media(max-width:700px) {
  .journey-timeline { grid-template-columns:1fr; gap:25px; padding-left:29px; margin-top:27px; }
  .journey-timeline::before { top:8px; bottom:24px; left:8px; right:auto; width:1px; height:auto; background:linear-gradient(#bdcdb8,#dec4bf,#bdcdb8); }
  .journey-dot { position:absolute; left:-29px; top:0; }
  .journey-marker { margin-bottom:12px; min-height:17px; font-size:10px; }
  .journey-marker > span:last-child { background:transparent; }
  .journey-card { height:auto; padding:25px; border-radius:20px; }
  .journey-card-top { margin-bottom:22px; }
  .journey-card h3 { font-size:29px; }
  .journey-postscript { align-items:flex-start; max-width:270px; margin-inline:auto; }
  .journey-postscript svg { margin-top:2px; }
}
@media(max-width:360px) { .journey-card { padding:20px; } .journey-card h3 { font-size:26px; } }
@media(prefers-reduced-motion:reduce) { .journey-card { transition:none; } .journey-card:hover { transform:none; } }
</style>
