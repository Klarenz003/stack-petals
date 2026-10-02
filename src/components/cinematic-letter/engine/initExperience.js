import { PhHeart, PhSparkle, PhArrowClockwise, PhPause } from '@phosphor-icons/vue';
import { setIconText } from '@/utils/phosphorDom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import logoUrl from '../assets/stack-petals-logo.png';
import { GIFT } from '../config/gift.js';
import { getVisibleLetterChapters, formatChapterIndicator } from '../../../utils/letterChapters';
import { PUBLIC_SITE_URL } from '../../../utils/siteConfig';
const publicSiteUrl = () => PUBLIC_SITE_URL;

/**
 * Compatibility animation controller: the original cinematic GSAP timelines and
 * 3D unboxing remain intact, but now initialize only after Vue mounts its DOM.
 * The view is componentized, while this module preserves all original behaviors.
 */
export function initExperience(rootElement) {
  window.gsap = gsap;
  window.ScrollTrigger = ScrollTrigger;
  const lastNoteButton = rootElement?.querySelector?.('#last-button');
  if (lastNoteButton) {
    lastNoteButton.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) node.textContent = node.textContent.replace(/\?/g, '↗');
    });
  }
  gsap.registerPlugin(ScrollTrigger);
  // The checkout preview owns the scroll position. Using the outer modal here
  // leaves ScrollTrigger listening to a different element than the one the
  // customer actually scrolls, so later chapters remain opacity:0.
  const scrollRoot = rootElement?.closest?.('.checkout-letter-full-preview')
    || rootElement?.closest?.('.letter-experience-modal')
    || null;

  const PETAL_ARTWORKS = [
    '<circle cx="50" cy="50" r="16" fill="none"/><path d="M50 7v22M50 71v22M7 50h22m42 0h22M20 20l16 16m28 28 16 16M80 20 64 36M36 64 20 80"/>',
    '<path d="M50 88V48m0 12C29 59 19 45 21 29c17 0 27 10 29 31Zm0-13c20 0 30-11 29-26-17 0-27 10-29 26Z"/><path d="M50 48c-8-15-4-26 0-34 7 11 8 22 0 34Z"/>',
    '<path d="M50 8v28M50 64v28M8 50h28M64 50h28M20 20l20 20m20 20 20 20M80 20 60 40M40 60 20 80"/><path d="M50 31c2 15 9 22 24 24-15 2-22 9-24 24-2-15-9-22-24-24 15-2 22-9 24-24Z"/>',
    '<path d="M50 82C25 64 14 50 14 35c0-22 26-29 36-10 10-19 36-12 36 10 0 15-11 29-36 47Z"/>',
    '<circle cx="50" cy="50" r="25" fill="none"/><path d="M39 46h1m20 0h1M40 61q10 9 20 0M24 25l-8-8m60 8 8-8M24 75l-8 8m60-8 8 8"/>',
    '<path d="M14 55c10-14 20-15 36-3 16-12 26-11 36 3L65 78H35L14 55Z"/><path d="M50 52 38 66m12-14 12 14M18 28l6 5m58-5-6 5"/>',
  ];

    // Embedded original brand image; this HTML has no local asset dependencies.
    const STACK_PETALS_LOGO = logoUrl;
    rootElement.querySelectorAll('[data-stack-petals-logo]').forEach(img => {img.src = STACK_PETALS_LOGO;});
    if (window.gsap && window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
    // The letter still opens without GSAP, but enhanced effects need the CDN.
  const luxeCleanup = []
  const listen = (target, event, handler, opts) => { target.addEventListener(event, handler, opts); luxeCleanup.push(() => target.removeEventListener(event, handler, opts)) }

    /* ══════════════════════════════════════════════════════════════════
       CUSTOMIZE YOUR GIFT HERE. The rest of the site updates automatically.
       ══════════════════════════════════════════════════════════════════ */
    
    const OCCASIONS = {
      romance: {
        label:'Romance', monogram:'a little love,', eyebrow:'A LETTER FROM THE HEART', subtitle:'Because some feelings deserve to be written down.',
        heading:'My dearest', letterLabel:'Your romantic letter', signoff:'With all my heart,',
        paragraphs:GIFT.paragraphs, notes:[
          ['Your laugh',GIFT.reasons[0]],['Your kindness',GIFT.reasons[1]],['Being you',GIFT.reasons[2]],
          ['Your heart',GIFT.reasons[3]],['Your smile',GIFT.reasons[4]],['The way you care',GIFT.reasons[5]]],
        notesHeading:'It’s the little things.', notesIntro:'Six tiny reminders. Tap each one to turn it over.',notesFooter:'And there are still so many more than six...',
        memoriesHeading:'Little moments, kept forever.', memoriesIntro:'A small gallery of the moments worth returning to.',
        finalHeading:'One last little thing.', finalIntro:'There is one more note, and it’s the most important one.',
        revealHeading:'I’m so glad there is you.', lastNote:GIFT.lastNote, giftTitle:GIFT.giftTitle,giftCaption:GIFT.giftCaption,
        backOfGift:'with love',closing:'MADE WITH LOVE. KEPT WITH YOU.', hue:'0deg'
      },
      sympathy: {
        label:'Sympathy',monogram:'holding space,',eyebrow:'A QUIET NOTE OF COMFORT',subtitle:'A gentle reminder that you do not have to carry everything alone.',
        heading:'Dear',letterLabel:'A note of sympathy',signoff:'With care,',
        paragraphs:[
          'I wish there were words that could make this easier. For now, please know that I am thinking of you and holding space for all that you are feeling.',
          'There is no right way or timetable for grief. You deserve patience, rest, and people who will sit beside you without asking you to be okay.',
          'Whenever you need company, a listening ear, or simply a quiet moment, I am here. You are cared for, today and in the days ahead.'
        ],notes:[
          ['I am here','You can call on me for company, a meal, an errand, or just silence together.'],
          ['Take your time','There is no deadline for healing and no need to explain how you feel.'],
          ['Rest is enough','You do not need to accomplish anything today. A breath at a time is enough.'],
          ['Your memories','You can speak their name and share your memories whenever you want.'],
          ['A small kindness','Let me help with one practical thing when the days feel heavy.'],
          ['Held in care','Even when words are scarce, you do not have to face this alone.']
        ],notesHeading:'Small moments of comfort.',notesIntro:'Six gentle thoughts to unfold whenever you need them.',
        notesFooter:'Take only the words that help today.',memoriesHeading:'Moments held close.',memoriesIntro:'Photos and memories can be gathered here, if they bring comfort.',
        finalHeading:'A quiet thought for you.',finalIntro:'One more note, with no need to respond.',
        revealHeading:'You are held in care.',lastNote:'May you have room for every feeling and support through every day. I am here for you.',
        giftTitle:'A small token of care.',giftCaption:'A gentle gesture, offered with care. Turn it around when you feel ready.',backOfGift:'with care',closing:'WITH CARE, THROUGH EVERY SEASON.',hue:'145deg'
      },
      birthday: {
        label:'Birthday',monogram:'make a wish,',eyebrow:'A CELEBRATION JUST FOR YOU',subtitle:'Today deserves a little extra sparkle.',
        heading:'Happy birthday,',letterLabel:'A birthday letter',signoff:'With all my best wishes,',
        paragraphs:[
          'Today is a lovely excuse to celebrate you: your energy, your stories, and every little way you make life brighter.',
          'I hope this new year brings you unexpected joys, good company, and moments that make you pause and think, “I am glad I was here for this.”',
          'May you feel celebrated in all the ways that matter to you. This little letter is one more wish for a beautiful year ahead.'
        ],notes:[
          ['Your day','Today gets to be all about you. Enjoy every small celebration.'],['New adventures','May this year take you somewhere wonderful.'],
          ['Good company','I hope you are surrounded by people who cheer you on.'],['Make a wish','Here is to the hopes you have not said aloud yet.'],
          ['More laughter','May your year be full of stories worth retelling.'],['You deserve joy','Celebrate how far you have come and all that lies ahead.']
        ],notesHeading:'Six birthday wishes.',notesIntro:'Tap each little wish to unwrap it.',
        notesFooter:'And may there be many more reasons to celebrate.',memoriesHeading:'Snapshots to celebrate.',memoriesIntro:'A gallery of joyful moments worth revisiting.',
        finalHeading:'One last birthday wish.',finalIntro:'A little more cheer before you go.',
        revealHeading:'Here’s to you!',lastNote:'May the year ahead be kind, exciting, and full of reasons to smile. Happy birthday!',
        giftTitle:'A birthday surprise.',giftCaption:'A tiny present for your big day. Give it a spin and enjoy the celebration.',backOfGift:'make a wish',closing:'A LITTLE JOY, MADE FOR YOU.',hue:'45deg'
      },
      family: {
        label:'Family',monogram:'close to home,',eyebrow:'FOR SOMEONE WHO FEELS LIKE HOME',subtitle:'A note for the people who make a place feel like ours.',
        heading:'Dear',letterLabel:'A letter to family',signoff:'With love,',
        paragraphs:[
          'Some of the best parts of my life are woven through the time we have shared. Thank you for being part of the place I call home.',
          'Whether we are together or miles apart, I carry our stories, traditions, and everyday moments with me.',
          'I hope you always know how much you matter to me. Here is a little keepsake for the moments we have had and all the ones still to come.'
        ],notes:[
          ['Our stories','The stories we share always bring me back home.'],['Your support','Thank you for being there in ways big and small.'],
          ['Shared laughter','Our happiest moments often start with a simple laugh.'],['Our traditions','I treasure the little rituals that belong to us.'],
          ['A safe place','Being with you makes the world feel more familiar.'],['Always family','No distance can erase the bond we share.']
        ],notesHeading:'The ties that stay.',notesIntro:'Six reminders of what makes us family.',
        notesFooter:'And there are more memories still to make.',memoriesHeading:'Our shared story.',memoriesIntro:'Little snapshots of the life we have shared.',
        finalHeading:'A note from home.',finalIntro:'Before you go, remember this.',
        revealHeading:'You feel like home.',lastNote:'Thank you for being part of my life, my memories, and my sense of home.',
        giftTitle:'Something for our story.',giftCaption:'A small gesture to celebrate all we have shared. Turn it around to see every side.',backOfGift:'family always',closing:'ROOTED IN THE MOMENTS WE SHARE.',hue:'80deg'
      },
      friendship: {
        label:'Friendship',monogram:'better together,',eyebrow:'A NOTE FOR A GOOD FRIEND',subtitle:'Some people make ordinary days feel like adventures.',
        heading:'Hey',letterLabel:'A letter to a friend',signoff:'Your friend,',
        paragraphs:[
          'I wanted to pause for a moment and tell you how glad I am that our paths crossed. You make the ordinary a lot more fun.',
          'Thank you for the conversations, the laughter, and the kind of support that makes hard days a little easier.',
          'Here is a small reminder that I am in your corner. I cannot wait for the next story we get to tell together.'
        ],notes:[
          ['Our laughs','Even the smallest joke can turn a whole day around.'],['Showing up','You have a way of being there when it matters.'],
          ['Long talks','I never run out of things to share with you.'],['Little plans','Even simple plans are more fun together.'],
          ['Being real','I can be myself when we are together.'],['What’s next','I look forward to the memories still waiting for us.']
        ],notesHeading:'The good little things.',notesIntro:'Six reasons I am grateful for our friendship.',
        notesFooter:'Here’s to everything still ahead.',memoriesHeading:'Adventures, remembered.',memoriesIntro:'A gallery of moments worth laughing about again.',
        finalHeading:'One more thing, friend.',finalIntro:'A small reminder to take with you.',
        revealHeading:'I’m glad we’re friends.',lastNote:'Thanks for being you and for making life more fun just by being in it.',
        giftTitle:'A little something, friend.',giftCaption:'A small surprise to celebrate our friendship. Give it a spin.',backOfGift:'good friends',closing:'FOR THE STORIES STILL TO COME.',hue:'190deg'
      },
      graduation: {
        label:'Graduation',monogram:'you did it,',eyebrow:'A NEW CHAPTER BEGINS',subtitle:'A little celebration for everything you have achieved.',
        heading:'Congratulations,',letterLabel:'A graduation letter',signoff:'With so much pride,',
        paragraphs:[
          'Today is proof of your patience, courage, and the countless small steps that brought you here.',
          'Take a moment to celebrate this achievement and the person you became along the way.',
          'Wherever the next chapter leads, I hope you remember how capable and loved you are.'
        ],notes:[
          ['Your courage','You kept going even when the path was difficult.'],['Your growth','Look how much you have learned and become.'],['Your future','There are beautiful possibilities ahead.'],['Your effort','Every late night and small step mattered.'],['Your people','You never had to do this alone.'],['This moment','You deserve to feel proud today.']
        ],notesHeading:'Six reasons to feel proud.',notesIntro:'Tap each thought to unfold it.',notesFooter:'Carry this feeling into everything ahead.',memoriesHeading:'Moments that led here.',memoriesIntro:'A small gallery of the journey worth remembering.',finalHeading:'One last cheer.',finalIntro:'Before the next chapter begins.',revealHeading:'The best is still ahead.',lastNote:GIFT.lastNote,giftTitle:'A little graduation surprise.',giftCaption:'A small keepsake for this important milestone.',backOfGift:'you did it',closing:'PROUD OF YOU, ALWAYS.',hue:'285deg'
      },
      other: {
        label:GIFT.otherOccasionName || 'Other',monogram:'just for you,',eyebrow:'A NOTE FOR THIS MOMENT',subtitle:'Whatever the occasion, these words are for you.',
        heading:'Dear',letterLabel:'A personal letter',signoff:'Warmly,',
        paragraphs:[
          'I wanted to mark this moment with a little something made just for you.',
          'Whatever this season means to you, I hope you feel seen, supported, and appreciated.',
          'Take these words with you as a reminder that someone is thinking of you today.'
        ],notes:[
          ['This moment','Some moments deserve to be marked and remembered.'],['A kind thought','I hope a little kindness finds you today.'],
          ['Your journey','Every step of your story matters.'],['A pause','Take the time to notice how far you have come.'],
          ['Good things','I hope good things come your way.'],['For you','This little note was made with you in mind.']
        ],notesHeading:'Six little thoughts.',notesIntro:'Unfold each thought at your own pace.',
        notesFooter:'Keep the thoughts that speak to you.',memoriesHeading:'Moments to keep.',memoriesIntro:'A place for the photos that matter to you.',
        finalHeading:'One last thought.',finalIntro:'A little something to take with you.',
        revealHeading:'This one is for you.',lastNote:'Whatever the occasion, I hope this reminds you that you matter.',
        giftTitle:'A little something for you.',giftCaption:'A small gesture for this moment. Turn it around and enjoy.',backOfGift:'for you',closing:'A MOMENT MADE TO REMEMBER.',hue:'250deg'
      }
    };

    const $ = id => rootElement.querySelector(`#${id}`);
    const $$ = selector => rootElement.querySelectorAll(selector);
    const paramOccasion = GIFT.showOccasionPicker ? new URLSearchParams(window.location.search).get('occasion') : null;
    let occasion = OCCASIONS[paramOccasion] ? paramOccasion : (OCCASIONS[GIFT.occasion] ? GIFT.occasion : 'romance');
    const picker = $('occasion-picker');
    picker.hidden = !GIFT.showOccasionPicker;
    for (const key of Object.keys(OCCASIONS)) {
      const button = document.createElement('button');
      button.type = 'button';button.className = 'occasion-choice';button.dataset.occasion = key;
      button.textContent = OCCASIONS[key].label;
      button.addEventListener('click', () => { if (!opened) { occasion = key; renderOccasion(); } });
      $('occasion-choices').appendChild(button);
    }
    function setText(selector,value) { const el=rootElement.querySelector(selector); if(el) el.textContent=value; }
    function renderOccasion() {
      const profile = {...OCCASIONS[occasion], ...(GIFT.custom[occasion] || {})};
      // Occasion profiles supply the visual design, not replacement letters.
      // Always retain checkout/admin content when rendering a customer letter.
      if (GIFT.useCustomerContent) {
        profile.paragraphs = GIFT.paragraphs;
        profile.notes = profile.notes.map(([label], i) => [label, GIFT.reasons[i] || '']);
        profile.lastNote = GIFT.lastNote;
      }
      document.body.dataset.occasion = occasion;
      document.body.style.setProperty('--gift-hue',profile.hue);
      document.title = `${profile.label} Letter — Stack Petals`;
      document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.body).getPropertyValue('--occasion-canvas').trim();
      rootElement.querySelectorAll('.occasion-choice').forEach(el => el.setAttribute('aria-pressed',String(el.dataset.occasion===occasion)));
      for (const id of ['hero-motif','paper-motif','closing-motif','curtain-motif']) $(id).setAttribute('href',`#motif-${occasion}`);
      setText('.monogram',profile.monogram);setText('.hero__copy > .eyebrow',profile.eyebrow);
      setText('.hero__sub',profile.subtitle);
      // The envelope is addressed to the recipient, never to the occasion.
      // Fall back to the occasion label only when no recipient was supplied.
      setText('.envelope__letter span',String(GIFT.recipient || profile.label || 'you'));
      setText('.side-label',profile.eyebrow);setText('.bottom-note',profile.closing);setText('.footer-credit',profile.closing);
        setIconText(rootElement.querySelector('.story-nav__mark'), PhSparkle, profile.label);
      rootElement.querySelector('.letter-paper').setAttribute('aria-label',profile.letterLabel);
      const heading = $('letter-heading');heading.replaceChildren(document.createTextNode(profile.heading+' '));
      const recipient = document.createElement('em');recipient.textContent=GIFT.recipient;heading.appendChild(recipient);
      rootElement.querySelectorAll('[data-sender]').forEach(el => el.textContent=GIFT.sender);
      profile.paragraphs.forEach((line,i)=>{if($(`letter-paragraph-${i+1}`)) $(`letter-paragraph-${i+1}`).textContent=line;});
      $('letter-signoff').textContent=profile.signoff;
      const cards=[...rootElement.querySelectorAll('.reason-card')];
      cards.forEach((card,i)=>{
        const [label,message]=profile.notes[i];
        const customLabel = Array.isArray(GIFT.petalLabels) ? String(GIFT.petalLabels[i] || '').trim() : '';
        card.querySelectorAll('.reason-card__label').forEach(el=>el.textContent=customLabel || label);
        $(`reason-${i+1}`).textContent=message;
        card.setAttribute('aria-pressed','false');card.setAttribute('aria-label',`Reveal note ${i+1}: ${customLabel || label}`);
      });
      // Customer-selected note artwork is used by every cinematic theme.
      // The original theme intentionally keeps its historical SVGs.
      if (occasion !== 'original' && Array.isArray(GIFT.petalArtworks)) {
        rootElement.querySelectorAll('.reason-card__icon').forEach((icon, i) => {
          const artwork = PETAL_ARTWORKS[Number(GIFT.petalArtworks[i])];
          if (artwork) icon.innerHTML = artwork;
        });
      }
      setText('#reasons-heading',profile.notesHeading);setText('.reasons-section .chapter-desc',profile.notesIntro);
      setText('.reasons-footer',profile.notesFooter);
      setText('#memories-heading',profile.memoriesHeading);setText('.memories-section .chapter-desc',profile.memoriesIntro);
      setText('#final-heading',profile.finalHeading);setText('.final__center > p',profile.finalIntro);
      setText('#surprise-heading',profile.revealHeading);$('final-message').textContent=profile.lastNote;
      setText('#gift-showcase-heading',profile.giftTitle);setText('.gift-card__caption',profile.giftCaption);
      setText('.gift-face--back span',profile.backOfGift);
      setIconText(rootElement.querySelector('.gift-face--right span'), occasion==='sympathy'?PhSparkle:PhHeart);
      setText('.gift-face--left span',occasion==='birthday'?'celebrate':occasion==='sympathy'?'be gentle':'always');
      setText('.gift-face--bottom span',occasion==='sympathy'?'with care':occasion==='birthday'?'for today':'made with care');
      setText('.gift-dialog__panel > .eyebrow',profile.label.toUpperCase());
      setText('.gift-dialog__panel > p',profile.giftCaption);
      const donationUrl = import.meta.env.VITE_DONATION_URL || `${publicSiteUrl()}/contact?subject=Support%20Stack%20Petals`;
      rootElement.querySelectorAll('[data-donation-link]').forEach(link => {
        const amount = link.getAttribute('data-donation-amount');
        if (!amount) {
          link.setAttribute('href', donationUrl);
          return;
        }
        const target = new URL(donationUrl, window.location.origin);
        target.searchParams.set('amount', amount);
        link.setAttribute('href', target.toString());
      });
      if(window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.fromTo('.occasion-art',{opacity:.2,scale:.85,rotation:-10},{opacity:1,scale:1,rotation:0,duration:.7,ease:'back.out(1.4)',clearProps:'all'});
      }
    }
    renderOccasion();

    const gsapReady = !!window.gsap;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let opened = false;
    let chapterOneTimeline = null;
    updateMusicUI(false);

    // Gold dust is short-lived and only created when the visitor breaks the seal.
    function emitSealBurst() {
      if (!gsapReady || reduceMotion) return;
      const origin = $('seal-button').getBoundingClientRect();
      const cx = origin.left + origin.width / 2, cy = origin.top + origin.height / 2;
      const container = document.createElement('div');
      container.className = 'luxe-seal-burst';
      container.setAttribute('aria-hidden','true');
      document.body.appendChild(container);
      for (let i=0;i<22;i++) {
        const speck=document.createElement('i'); container.appendChild(speck);
        const a = i * 2.39996, r=gsap.utils.random(75,245);
        gsap.set(speck,{left:cx,top:cy,scale:gsap.utils.random(.45,1.6)});
        gsap.to(speck,{x:Math.cos(a)*r,y:Math.sin(a)*r,opacity:0,scale:0,rotation:gsap.utils.random(-300,300),duration:gsap.utils.random(.95,1.7),delay:gsap.utils.random(0,.12),ease:'power3.out'});
      }
      gsap.delayedCall(1.95,()=>container.remove());
    }

    function setupLuxeMotion() {
      const starField = $('luxe-stars');
      const glitter = $('curtain-glitter');
      for(let i=0;i<36;i++) {
        const star=document.createElement('span'); star.className='luxe-star'; starField.appendChild(star);
        star.style.left=`${(i*73.31)%100}%`;
        star.style.top=`${(i*39.73)%100}%`;
        star.style.setProperty('--size',`${(i%4)+1}px`);
        if (gsapReady && !reduceMotion) gsap.to(star,{opacity:gsap.utils.random(.35,.86),scale:gsap.utils.random(1,2.1),duration:gsap.utils.random(1.8,4.8),repeat:-1,yoyo:true,delay:-i*.19,ease:'sine.inOut'});
      }
      for(let i=0;i<46;i++) {
        const spark=document.createElement('span'); glitter.appendChild(spark);
        spark.style.left=`${(i*61.8)%100}%`;spark.style.top=`${(i*37.37)%100}%`;
      }
      if(!gsapReady || reduceMotion) return;
      gsap.to('.luxe-orbit--outer',{rotation:360,duration:65,ease:'none',repeat:-1});
      gsap.to('.luxe-orbit--inner',{rotation:-360,duration:49,ease:'none',repeat:-1});
      gsap.to('.luxe-atmosphere__halo',{rotation:16,scale:1.13,duration:11,yoyo:true,repeat:-1,ease:'sine.inOut'});
      const stage=$('envelope-stage');
      const pointerFine=window.matchMedia('(hover:hover) and (pointer:fine)').matches;
      if(pointerFine) {
        const x=gsap.quickTo(stage,'rotationY',{duration:.9,ease:'power3.out'});
        const y=gsap.quickTo(stage,'rotationX',{duration:.9,ease:'power3.out'});
        listen($('hero'),'pointermove',e=>{
          if(opened)return;
          const rect=$('hero').getBoundingClientRect();
          x(((e.clientX-rect.left)/rect.width-.5)*11);
          y(-((e.clientY-rect.top)/rect.height-.5)*8);
        });
        listen($('hero'),'pointerleave',()=>{x(0);y(0)});
        rootElement.querySelectorAll('.reason-card').forEach(card=>{
          const inner=card.querySelector('.reason-card__inner');
          const rx=gsap.quickTo(card,'rotationX',{duration:.5,ease:'power2.out'});
          const ry=gsap.quickTo(card,'rotationY',{duration:.5,ease:'power2.out'});
          listen(card,'pointermove',e=>{
            const rect=card.getBoundingClientRect();
            ry(((e.clientX-rect.left)/rect.width-.5)*7);
            rx(-((e.clientY-rect.top)/rect.height-.5)*7);
            inner.style.setProperty('--pointer-x',`${(e.clientX-rect.left)/rect.width*100}%`);
            inner.style.setProperty('--pointer-y',`${(e.clientY-rect.top)/rect.height*100}%`);
          });
          listen(card,'pointerleave',()=>{rx(0);ry(0)});
        });
      }
    }
    setupLuxeMotion();

    function setUpScroll() {
      const chapters = getVisibleLetterChapters({
        hasPhotoUpload: GIFT.hasPhotoUpload !== false,
        has360View: GIFT.has360Viewer !== false,
      }).map((chapter, index, visibleChapters) => ({
        ...chapter,
        label: formatChapterIndicator(chapter, index, visibleChapters.length),
      }));
      const chapterNumberWords = ['ONE', 'TWO', 'THREE', 'FOUR'];
      chapters.forEach((chapter, index) => {
        const chapterTag = rootElement.querySelector(`#${chapter.id} .chapter-tag`);
        if (chapterTag) {
          chapterTag.textContent = `CHAPTER ${chapterNumberWords[index] || index + 1}  /  ${chapter.title}`;
        }
      });
      const memoriesChapterTag = rootElement.querySelector('#memories-section .chapter-tag');
      if (memoriesChapterTag && GIFT.hasPhotoUpload === false) memoriesChapterTag.closest('.chapter')?.setAttribute('hidden', 'true');
      const getViewportHeight = () => scrollRoot?.clientHeight || window.innerHeight;
      const getScrollTop = () => scrollRoot?.scrollTop || window.scrollY;
      const onScroll = () => {
        const max = Math.max(1, (scrollRoot?.scrollHeight || document.documentElement.scrollHeight) - getViewportHeight());
        $('progress-fill').style.width = `${Math.min(100, getScrollTop() / max * 100)}%`;
        const current = chapters.findLast?.(ch => $(ch.id).getBoundingClientRect().top <= getViewportHeight() * .46)
          || chapters[0];
        $('chapter-indicator').textContent = current.label;
      };
      listen(scrollRoot || window, 'scroll', onScroll, {passive:true});
      listen(window, 'resize', onScroll, {passive:true});
      onScroll();
      if (!gsapReady || reduceMotion || !window.ScrollTrigger) return;
      gsap.registerPlugin(ScrollTrigger);
      gsap.utils.toArray('.reveal').forEach(el => {
        // Letter is visible immediately; everything else arrives as you scroll.
        if (el.closest('#letter-section')) return;
        gsap.from(el, {
          scrollTrigger:{ trigger:el, start:'top 90%', once:true, ...(scrollRoot ? { scroller: scrollRoot } : {}) },
          y:72, opacity:0, scale:.97,filter:'blur(7px)',duration:1.25,ease:'power3.out',clearProps:'transform,opacity,filter'
        });
      });
      const chapterScroller = scrollRoot ? { scroller: scrollRoot } : {};
      gsap.from('.final__flower--left', {scrollTrigger:{trigger:'.final-section',start:'top 75%',once:true,...chapterScroller},x:-45,rotation:-48,opacity:0,duration:1.8,ease:'power2.out'});
      gsap.from('.final__flower--right', {scrollTrigger:{trigger:'.final-section',start:'top 75%',once:true,...chapterScroller},x:45,rotation:165,opacity:0,duration:1.8,ease:'power2.out'});
      ScrollTrigger.refresh();
    }

    function enterLetter() {
      const story = $('story');
      const section = $('letter-section');
      const book = $('flower-book');
      if (chapterOneTimeline) {
        chapterOneTimeline.kill();
        chapterOneTimeline = null;
      }
      story.inert = false;
      section?.classList.remove('is-intro-active','is-intro-complete');
      book?.classList.remove('is-unfolded');

      const heading = $('letter-heading');
      heading.setAttribute('tabindex','-1');

      // Keep the chapter visually blank for a brief beat after loading.
      if (!gsapReady || reduceMotion) {
        window.setTimeout(() => {
          section?.classList.add('is-intro-active','is-intro-complete');
          book?.classList.add('is-unfolded');
          section?.querySelectorAll('.letter-paper .paper-top, .letter-paper h2, .letter-paper p, .letter-paper .signature').forEach(el => el.style.opacity = '1');
          heading.focus({preventScroll:true});
        }, 1200);
        return;
      }

      chapterOneTimeline = gsap.timeline({
        delay:.48,
        onComplete:() => {
          section?.classList.add('is-intro-complete');
          chapterOneTimeline = null;
          heading.focus({preventScroll:true});
        }
      });

      // Chapter 1 uses an opacity-only entrance so its content never gets
      // stranded off-screen by transforms or blur while the modal mounts.
      gsap.set('.letter-section .chapter-tag',{autoAlpha:0});
      gsap.set('.letter-section .flower-book',{autoAlpha:0});
      gsap.set('.letter-section .flower-book__controls, .letter-section .scroll-note',{autoAlpha:0});
      gsap.set('.letter-paper .paper-top, .letter-paper h2, .letter-paper p, .letter-paper .signature',{autoAlpha:0});

      chapterOneTimeline.call(() => section?.classList.add('is-intro-active'))
        .to('.letter-section .flower-book',{autoAlpha:1,duration:1.8,ease:'power2.out'})
        .to('.letter-section .chapter-tag',{autoAlpha:1,duration:1.15,ease:'power2.out'},'-=1')
        .call(() => document.dispatchEvent(new CustomEvent('stackpetals:letter-enter')))
        .to('.letter-paper .paper-top',{autoAlpha:1,duration:1.15,ease:'power2.out'},'+=.45')
        .to('.letter-paper h2',{autoAlpha:1,duration:1.55,ease:'power3.out'},'-=.35')
        .to('.letter-paper p',{autoAlpha:1,stagger:.5,duration:1.5,ease:'power2.out'},'+=.18')
        .to('.letter-paper .signature',{autoAlpha:1,duration:1.35,ease:'power2.out'},'-=.5')
        .to('.letter-section .flower-book__controls, .letter-section .scroll-note',{autoAlpha:1,stagger:.16,duration:1.05,ease:'power2.out'},'-=.45');

      // A checkout modal can delay its first paint while the curtain is
      // closing. Guarantee the first chapter cannot remain visually blank if
      // that delayed animation is interrupted by the modal lifecycle.
      // Keep the safety fallback long enough for the full staged Chapter 1
      // sequence to finish.  The previous 2.5s timeout forced every element
      // to 100% opacity while the timeline was still running, which made the
      // chapter appear to flash in as a block instead of fading in naturally.
      const introFallbackDelay = gsapReady ? 15000 : 1200;
      window.setTimeout(() => {
        if (section?.classList.contains('is-intro-complete')) return;
        section?.classList.add('is-intro-active', 'is-intro-complete');
        chapterOneTimeline?.kill();
        chapterOneTimeline = null;
        section?.querySelectorAll('.letter-paper .paper-top, .letter-paper h2, .letter-paper p, .letter-paper .signature, .flower-book, .flower-book__controls, .scroll-note').forEach(el => {
          el.style.opacity = '1';
          el.style.visibility = 'visible';
          el.style.transform = 'none';
          el.style.filter = 'none';
        });
      }, introFallbackDelay);
    }

    function revealStoryShell() {
      const story = $('story');
      story.style.display = '';
      story.style.visibility = 'visible';
      story.style.opacity = '1';
      story.classList.add('is-visible');
      story.inert = false;
    }

    function showStory(deferEntrance = false) {
      const story = $('story');
      story.hidden = false;
      story.style.display = '';
      story.style.opacity = '0';
      story.style.visibility = 'hidden';
      story.classList.remove('is-visible');
      story.inert = deferEntrance;
      // Match the live letter page: opening the envelope transitions from the
      // invitation into the chapter experience.
      $('hero').style.display = 'none';
      window.scrollTo({top:0,behavior:'instant'});
      setUpScroll();
      if (!deferEntrance) {
        revealStoryShell();
        enterLetter();
      }
    }

    function revealThroughCurtain() {
      const curtain = $('curtain');
      curtain.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      gsap.set(curtain, {autoAlpha:0});
      gsap.set('.curtain__panel', {xPercent:0});
      gsap.set('.curtain__light', {autoAlpha:0,scaleX:.12});
      gsap.set('.curtain__glitter span', {autoAlpha:0,scale:0});
      gsap.timeline({onComplete:() => {
        curtain.hidden = true;
        document.documentElement.style.removeProperty('overflow');
        enterLetter();
      }})
        .to(curtain, {autoAlpha:1,duration:.42,ease:'power2.inOut'})
        .call(() => showStory(true))
        .call(revealStoryShell)
        .fromTo('.curtain__title .occasion-art', {autoAlpha:0,scale:.5,rotation:-25}, {autoAlpha:1,scale:1,rotation:0,duration:.9,ease:'back.out(1.6)'})
        .fromTo('.curtain__title span, .curtain__title strong', {autoAlpha:0,y:30,filter:'blur(12px)'}, {autoAlpha:1,y:0,filter:'blur(0px)',stagger:.17,duration:.8,ease:'power3.out'},'-=.5')
        .to('.curtain__title', {autoAlpha:0,y:-25,scale:1.07,duration:.52},'+=.34')
        .to('.curtain__light', {autoAlpha:1,scaleX:1,duration:.75,ease:'power2.in'},'-=.05')
        .to('.curtain__panel--left', {xPercent:-110,rotationY:-8,duration:2.05,ease:'power4.inOut'},'-=.18')
        .to('.curtain__panel--right', {xPercent:110,rotationY:8,duration:2.05,ease:'power4.inOut'},'<')
        .to('.curtain__glitter span',{autoAlpha:1,scale:1,stagger:{each:.018,from:'random'},duration:.3},'-=1.7')
        .to('.curtain__glitter span',{autoAlpha:0,y:'-=100',x:()=>gsap.utils.random(-65,65),stagger:{each:.02,from:'random'},duration:1.3,ease:'power2.out'},'<')
        .to('.curtain__light',{autoAlpha:0,scaleX:1.3,duration:.55},'-=.78')
        .to('.curtain__rod', {autoAlpha:0,duration:.35},'-=1.2')
        .to(curtain, {autoAlpha:0,duration:.4},'-=.38');
    }

    function openLetter() {
      if (opened) return;
      opened = true;
      $('seal-button').disabled = true;
      $('open-button').disabled = true;
      if (!gsapReady || reduceMotion) {showStory(); return;}
      gsap.killTweensOf('#seal-button');
      const tl = gsap.timeline({defaults:{ease:'power2.inOut'}});
      tl.to('#seal-button',{scale:1.18,rotation:9,duration:.22,ease:'power2.out'})
        .to('#seal-button',{rotation:-15,scale:.8,duration:.25,ease:'power3.inOut'})
        .call(() => emitSealBurst())
        .to('#seal-button',{opacity:0,scale:0,rotation:-68,filter:'blur(8px)',duration:.5,ease:'power3.in'})
        .to('#envelope-flap',{rotateX:-180,duration:1.1,ease:'power3.inOut'},'-=.26')
        .set('#envelope-flap',{zIndex:1})
        .to('#envelope-letter',{y:-135,scale:1.035,duration:1.35,ease:'back.out(1.08)'},'-=.42')
        .to('.luxe-orbit', {scale:1.5,opacity:0,duration:.8,ease:'power2.out'},'-=1.15')
        .to('#envelope-stage',{y:40,scale:1.19,opacity:0,filter:'blur(9px)',duration:.85,ease:'power3.in'},'+=.14')
        .to('.hero__copy, .hero__hint, .open-button',{opacity:0,y:-24,duration:.55},'<')
        .call(revealThroughCurtain);
    }
    $('seal-button').addEventListener('click', async () => { if (occasion !== 'sympathy') await startMusic(); openLetter(); });
    $('open-button').addEventListener('click', async () => { if (occasion !== 'sympathy') await startMusic(); openLetter(); });

    rootElement.querySelectorAll('.reason-card').forEach((card, index) => {
      card.addEventListener('click',() => {
        const title = card.querySelector('.reason-card__front .reason-card__label').textContent.trim();
        const pressed = card.getAttribute('aria-pressed') === 'true';
        card.setAttribute('aria-pressed', String(!pressed));
        card.setAttribute('aria-label', `${pressed ? 'Reveal' : 'Fold back'} reason ${index+1}: ${title}`);
      });
    });





    function createRomanticMusicSystem() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      const pad = ctx.createGain();
      const shimmer = ctx.createGain();
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 1200;
      master.gain.value = 0;
      pad.gain.value = .22;
      shimmer.gain.value = .05;
      pad.connect(lowpass).connect(master);
      shimmer.connect(master);
      master.connect(ctx.destination);

      const chordProgression = [
        [261.63, 329.63, 392.00],
        [293.66, 369.99, 440.00],
        [220.00, 277.18, 329.63],
        [246.94, 311.13, 392.00]
      ];
      const bellLine = [659.25, 587.33, 523.25, 587.33, 659.25, 783.99, 659.25, 587.33];
      let timers = [];
      let running = false;

      const clearTimers = () => { timers.forEach(id => clearTimeout(id)); timers = []; };

      function schedulePad(freqs, when, duration) {
        freqs.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = index === 0 ? 'sine' : 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, when);
          gain.gain.exponentialRampToValueAtTime(0.055 / (index + 1), when + .65);
          gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
          osc.connect(gain).connect(pad);
          osc.start(when);
          osc.stop(when + duration + .08);
        });
      }

      function scheduleBell(freq, when, duration=.8) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const trem = ctx.createOscillator();
        const tremGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        trem.type = 'sine';
        trem.frequency.value = 4.2;
        tremGain.gain.value = 8;
        trem.connect(tremGain).connect(osc.frequency);
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(0.03, when + .08);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
        osc.connect(gain).connect(shimmer);
        osc.start(when); trem.start(when);
        osc.stop(when + duration + .04); trem.stop(when + duration + .04);
      }

      function scheduleCycle(startTime) {
        chordProgression.forEach((chord, step) => {
          const stepTime = startTime + step * 2.55;
          schedulePad(chord, stepTime, 2.45);
          schedulePad(chord.map(n => n / 2), stepTime, 2.25);
        });
        bellLine.forEach((note, index) => {
          scheduleBell(note, startTime + .6 + index * 1.15, index % 3 === 0 ? 1.05 : .76);
        });
        timers.push(setTimeout(() => { if (running) scheduleCycle(ctx.currentTime + .12); }, 9600));
      }

      return {
        async start() {
          if (ctx.state === 'suspended') await ctx.resume();
          if (running) return;
          running = true;
          clearTimers();
          master.gain.cancelScheduledValues(ctx.currentTime);
          master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime);
          master.gain.exponentialRampToValueAtTime(.14, ctx.currentTime + 1.1);
          scheduleCycle(ctx.currentTime + .05);
        },
        stop() {
          running = false;
          clearTimers();
          master.gain.cancelScheduledValues(ctx.currentTime);
          master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime);
          master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + .8);
        },
        isRunning() { return running; }
      };
    }

    const music = createRomanticMusicSystem();
    function updateMusicUI(isOn) {
      $('music-toggle').setAttribute('aria-pressed', String(isOn));
      $('music-toggle').setAttribute('aria-label', isOn ? 'Pause background music' : 'Play background music');
      $('music-toggle').title = isOn ? 'Pause music' : 'Play music';
    }
    async function startMusic() {
      if (!music) return;
      try { await music.start(); updateMusicUI(true); } catch (err) { console.warn('Music could not start automatically.', err); }
    }
    function stopMusic() {
      if (!music) return;
      music.stop();
      updateMusicUI(false);
    }
    $('music-toggle').addEventListener('click', async () => {
      if (!music) return;
      if (music.isRunning()) {
        stopMusic();
      } else {
        await startMusic();
      }
    });



    function setupPhotoMemories() {
      const memories = Array.isArray(GIFT.photoMemories) ? GIFT.photoMemories : [];
      const memoriesSection = $('memories-section');
      if (memoriesSection && GIFT.hasPhotoUpload === false) {
        memoriesSection.hidden = true;
        memoriesSection.style.display = 'none';
      }
      const fallbackMemories = [
        { src:'', caption:'Your first favorite memory goes here.' },
        { src:'', caption:'Add another photo you never want to forget.' },
        { src:'', caption:'One more little moment worth keeping.' }
      ];
      const items = memories.length ? memories : fallbackMemories;
      const track = $('memories-track');
      const dots = $('memory-dots');
      let index = 0;
      let touchStartX = null;

      const placeholderSVG = `
        <svg class="memory-placeholder__icon" viewBox="0 0 100 100" aria-hidden="true">
          <rect x="15" y="19" width="70" height="62" rx="4"/>
          <circle cx="36" cy="39" r="8"/>
          <path d="M22 70 43 49l13 13 10-9 12 17"/>
          <path d="M50 10v7M47 13h6"/>
        </svg>`;

      track.innerHTML = '';
      dots.innerHTML = '';

      items.forEach((memory, i) => {
        const slide = document.createElement('article');
        slide.className = 'memory-slide';
        slide.setAttribute('aria-label', `Memory ${i+1} of ${items.length}`);
        const frame = document.createElement('div');
        frame.className = 'memory-frame';

        const placeholder = document.createElement('div');
        placeholder.className = 'memory-placeholder';
        placeholder.innerHTML = `${placeholderSVG}<div><strong>Memory ${String(i+1).padStart(2,'0')}</strong><span>Add a photo in the admin config</span></div>`;
        frame.appendChild(placeholder);

        if (memory.src) {
          const img = document.createElement('img');
          img.className = 'memory-image';
          img.alt = memory.alt || `Photo memory ${i+1}`;
          img.loading = i === 0 ? 'eager' : 'lazy';
          img.src = memory.src;
          img.addEventListener('load', () => placeholder.style.display = 'none');
          img.addEventListener('error', () => img.classList.add('is-hidden'));
          frame.appendChild(img);
        }

        const overlay = document.createElement('div');
        overlay.className = 'memory-overlay';
        overlay.innerHTML = `<span class="memory-counter">MEMORY ${String(i+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}</span><p class="memory-caption"></p>`;
        overlay.querySelector('.memory-caption').textContent = memory.caption || 'A little moment worth keeping.';
        frame.appendChild(overlay);
        slide.appendChild(frame);
        track.appendChild(slide);

        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'memory-dot';
        dot.setAttribute('aria-label', `Go to memory ${i+1}`);
        dot.setAttribute('aria-current', i === 0 ? 'true' : 'false');
        dot.addEventListener('click', () => goTo(i));
        dots.appendChild(dot);
      });

      const update = (animate = true) => {
        if (!animate) track.style.transition = 'none';
        track.style.transform = `translateX(-${index * 100}%)`;
        [...dots.children].forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
        if (!animate) requestAnimationFrame(() => track.style.transition = '');
      };

      function goTo(next) {
        index = (next + items.length) % items.length;
        update(true);
        if (gsapReady && !reduceMotion) {
          gsap.fromTo(track.children[index], {opacity:.7, scale:.985}, {opacity:1, scale:1, duration:.55, ease:'power2.out'});
        }
      }

      $('memory-prev').addEventListener('click', () => goTo(index - 1));
      $('memory-next').addEventListener('click', () => goTo(index + 1));

      const viewport = $('memories-viewport');
      viewport.addEventListener('pointerdown', e => { touchStartX = e.clientX; });
      viewport.addEventListener('pointerup', e => {
        if (touchStartX == null) return;
        const delta = e.clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(delta) > 45) goTo(index + (delta < 0 ? 1 : -1));
      });
      viewport.addEventListener('pointercancel', () => { touchStartX = null; });
      update(false);
    }

    setupPhotoMemories();


    /* Gift box reveal + real 200-300 frame product viewer.
       Demo images are 240 consistently rendered SAMPLE frames, not photos of your actual merchandise. */
    const DEMO_PRODUCT_FRAMES = Array.from({length:240}, (_, i) => `${import.meta.env.BASE_URL}demo-frames/${String(i+1).padStart(3,'0')}.webp`);
    // The original six-sided spinning gift box remains the hero. Opening it
    // reveals a genuine frame-by-frame product viewer; the demo is illustrative.
    const product360 = GIFT.product360 || {mode:'demo', frameCount:240};
    const giftStage = $('gift-stage');
    const giftScene = $('gift-scene');
    const giftCube = $('gift-cube');
    const giftFrame = $('gift-frame');
    const giftSlider = $('gift-frame-slider');
    const boxHint = $('gift-box-hint');
    const naturalFrameSorter = new Intl.Collator(undefined, {numeric:true,sensitivity:'base'});
    let giftBoxFadeTimer = null;
    let giftProductRiseTimer = null;
    const giftView = {
      opened:false, frames:product360.mode === 'demo' ? DEMO_PRODUCT_FRAMES : [], ownsUrls:[], isDemo:product360.mode === 'demo', frame:0,
      playing:false, raf:null, lastTime:0, dragging:false, pointerId:null, startX:0,
      startY:0, startFrame:0, pointerMoved:false, preload:[], boxX:-19,
      boxY:28, boxRaf:null, boxLastTime:0, boxSpinning:false
    };
    const loopFrame = (index,n=giftView.frames.length) => (index%n+n)%n;
    function clearGiftBoxFade(){
      if(giftBoxFadeTimer!==null){clearTimeout(giftBoxFadeTimer);giftBoxFadeTimer=null;}
      if(giftProductRiseTimer!==null){clearTimeout(giftProductRiseTimer);giftProductRiseTimer=null;}
      giftStage.classList.remove('box-fade-ready','is-product-rising');
      giftCube.classList.remove('is-fading-out');
    }
        function scheduleGiftBoxFade(){
      clearGiftBoxFade();
      giftBoxFadeTimer=setTimeout(()=>{
        if($('gift-dialog').open && giftView.opened){giftStage.classList.add('box-fade-ready');giftCube.classList.add('is-fading-out');}
      }, reduceMotion ? 120 : 4100);
    }
    function renderBox(){
      giftScene.style.transform=`rotateX(${giftView.boxX}deg) rotateY(${giftView.boxY}deg)`;
    }
    function stopBoxSpin(){
      giftView.boxSpinning=false;
      if(giftView.boxRaf!==null){cancelAnimationFrame(giftView.boxRaf);giftView.boxRaf=null;}
      giftView.boxLastTime=0;
      if(!giftView.opened){
        setIconText($('gift-spin-toggle'), PhArrowClockwise, 'Spin the box');
        $('gift-spin-toggle').setAttribute('aria-pressed','false');
      }
    }
    function boxSpinTick(time){
      if(!giftView.boxSpinning || giftView.opened || !$('gift-dialog').open)return;
      if(giftView.boxLastTime){
        const dt=Math.min(time-giftView.boxLastTime,64);
        giftView.boxY=(giftView.boxY+dt*.026)%360;
        renderBox();
      }
      giftView.boxLastTime=time;
      giftView.boxRaf=requestAnimationFrame(boxSpinTick);
    }
    function startBoxSpin(){
      if(giftView.opened || reduceMotion || !$('gift-dialog').open)return;
      stopBoxSpin();giftView.boxSpinning=true;
      setIconText($('gift-spin-toggle'), PhPause, 'Pause box spin');
      $('gift-spin-toggle').setAttribute('aria-pressed','true');
      giftView.boxRaf=requestAnimationFrame(boxSpinTick);
    }
    function fillProductFrame(index){
      if(!giftView.frames.length)return;
      giftView.frame=loopFrame(Math.round(index));
      const url=giftView.frames[giftView.frame];
      if(giftFrame.dataset.currentUrl!==url){giftFrame.src=url;giftFrame.dataset.currentUrl=url;}
      giftSlider.value=String(giftView.frame);
      giftSlider.style.setProperty('--fill',((giftView.frame/Math.max(1,giftView.frames.length-1))*100)+'%');
      $('gift-current-frame').textContent=String(giftView.frame+1).padStart(3,'0');
      $('gift-frame-total').textContent=String(giftView.frames.length).padStart(3,'0');
    }
    function preloadNeighbors(){
      if(!giftView.opened || giftView.frames.length<2)return;
      giftView.preload=[];
      for(let offset=1;offset<=6;offset++){
        const img=new Image();img.src=giftView.frames[loopFrame(giftView.frame+offset)];giftView.preload.push(img);
      }
    }
    function stopProductSpin(){
      giftView.playing=false;
      if(giftView.raf!==null){cancelAnimationFrame(giftView.raf);giftView.raf=null;}
      giftView.lastTime=0;
      if(giftView.opened){
        setIconText($('gift-spin-toggle'), PhArrowClockwise, 'Rotate product');
        $('gift-spin-toggle').setAttribute('aria-pressed','false');
      }
    }
    function productSpinTick(now){
      if(!giftView.playing || !giftView.opened || !$('gift-dialog').open)return;
      if(giftView.lastTime && now-giftView.lastTime>=75){
        const steps=Math.max(1,Math.floor((now-giftView.lastTime)/75));
        giftView.lastTime=now;
        fillProductFrame(giftView.frame+Math.min(steps,4));
        if(giftView.frame%5===0)preloadNeighbors();
      }else if(!giftView.lastTime){giftView.lastTime=now;}
      giftView.raf=requestAnimationFrame(productSpinTick);
    }
    function startProductSpin(){
      if(GIFT.previewMode || !giftView.opened || reduceMotion || !$('gift-dialog').open)return;
      stopProductSpin();giftView.playing=true;giftView.lastTime=0;
      setIconText($('gift-spin-toggle'), PhPause, 'Pause product rotation');
      $('gift-spin-toggle').setAttribute('aria-pressed','true');
      giftView.raf=requestAnimationFrame(productSpinTick);
    }
    function setFrameSource(urls,{isDemo=true,name='',ownsUrls=[]}={}){
      stopProductSpin();
      giftView.ownsUrls.forEach(url=>URL.revokeObjectURL(url));
      giftView.ownsUrls=ownsUrls;giftView.frames=urls;giftView.isDemo=isDemo;
      giftSlider.max=String(Math.max(0,urls.length-1));
      giftFrame.alt=isDemo?'Illustrated sample bouquet shown through 240 generated demonstration frames.':'Photographic 360 degree view of your product.';
      $('gift-product-label').textContent=isDemo
        ? `${urls.length} illustrated demo frames · replace with your own photos in creator tools`
        : `${urls.length} product frames ${name?'· '+name:''} · drag to turn`;
      $('gift-upload').hidden=!isDemo;
      giftFrame.dataset.currentUrl='';fillProductFrame(0);preloadNeighbors();
      if(giftView.opened&&!reduceMotion)startProductSpin();
    }
    function petalsFromBox(){
      if(reduceMotion)return;
      const root=$('gift-stage-petals');root.replaceChildren();
      for(let n=0;n<27;n++){
        const petal=document.createElement('i');
        const angle=(n/27)*Math.PI*2, dist=90+((n*23)%105);
        petal.style.setProperty('--left',`${48+(n%4)*1.5}%`);
        petal.style.setProperty('--top',`${46+(n%3)*1.5}%`);
        petal.style.setProperty('--dx',`${Math.cos(angle)*dist}px`);
        petal.style.setProperty('--dy',`${Math.sin(angle)*dist-45}px`);
        petal.style.setProperty('--spin',`${(n%2?1:-1)*(70+n*29)}deg`);
        petal.style.setProperty('--delay',`${(n%5)*35}ms`);
        root.appendChild(petal);
        petal.addEventListener('animationend',()=>petal.remove(),{once:true});
      }
    }
    function unboxGift(){
      if(giftView.opened)return;
      stopBoxSpin();
      // Face the ribboned box toward the recipient for the reveal.
      giftView.boxX=-19;
      giftView.boxY=28;
      renderBox();
      clearGiftBoxFade();
      giftView.opened=true;
      giftStage.classList.add('is-unboxed');
      giftCube.classList.add('is-unboxed');
      $('gift-unseal').disabled=true;
      const canRotateProduct = Boolean(GIFT.has360Viewer) && !GIFT.previewMode;
      $('gift-stage-instructions').hidden=!canRotateProduct;
      $('gift-frame-counter').hidden=!canRotateProduct;
      $('gift-scrubber').hidden=!canRotateProduct;
      $('gift-close-box').hidden=false;
      boxHint.hidden=true;
      giftStage.setAttribute('aria-label',canRotateProduct
        ? '360 degree product viewer. Drag horizontally, use arrow keys, or the frame slider to rotate the product.'
        : 'Gift box reveal. This bouquet does not include an interactive 360 degree viewer.');
      $('gift-spin-toggle').disabled=!canRotateProduct;
      $('gift-reset-view').disabled=!canRotateProduct;
      setIconText($('gift-spin-toggle'), PhArrowClockwise, 'Rotate product');
      $('gift-spin-toggle').setAttribute('aria-pressed','false');
      setIconText($('gift-reset-view'), PhArrowClockwise, 'Reset product');
      $('gift-experience-subtitle').textContent=GIFT.previewMode
        ? 'A flower-filled surprise. The 360° viewer is available after checkout.'
        : 'A flower-filled surprise. Drag the gift to view it from every angle.';
      $('gift-product-label').textContent=giftView.isDemo
        ? `${giftView.frames.length} illustrated demo frames · add your actual product photos below`
        : `${giftView.frames.length} product photos · drag or swipe to rotate`;
      petalsFromBox();fillProductFrame(giftView.frame);preloadNeighbors();
      scheduleGiftBoxFade();
      giftProductRiseTimer=setTimeout(()=>{
        if($('gift-dialog').open && giftView.opened){giftStage.classList.add('is-product-rising');}
      },reduceMotion?30:1180);
      if(canRotateProduct&&!reduceMotion)setTimeout(()=>{if($('gift-dialog').open&&giftView.opened)startProductSpin();},5600);
    }
    function rewrapGift(){
      if(!giftView.opened)return;
      stopProductSpin();
      giftView.opened=false;giftView.dragging=false;
      clearGiftBoxFade();
      giftStage.classList.remove('is-unboxed','is-dragging');
      giftCube.classList.remove('is-unboxed');
      $('gift-unseal').disabled=false;
      $('gift-stage-instructions').hidden=true;
      $('gift-frame-counter').hidden=true;
      $('gift-scrubber').hidden=true;
      $('gift-close-box').hidden=true;
      boxHint.hidden=false;
      giftStage.setAttribute('aria-label','Spinning three dimensional gift box. Drag to rotate the box, then open to reveal your product.');
      $('gift-spin-toggle').disabled=false;
      $('gift-reset-view').disabled=false;
      setIconText($('gift-reset-view'), PhArrowClockwise, 'Reset box view');
      $('gift-experience-subtitle').textContent='The original spinning gift box, with a surprise waiting inside.';
      $('gift-product-label').textContent='A surprise awaits inside this ribboned box';
      giftView.boxX=-19;giftView.boxY=28;renderBox();
      if(!reduceMotion)startBoxSpin();
      else stopBoxSpin();
    }
    function resetGiftView(){
      if(giftView.opened){stopProductSpin();fillProductFrame(0);preloadNeighbors();if(!reduceMotion)startProductSpin();}
      else{stopBoxSpin();giftView.boxX=-19;giftView.boxY=28;renderBox();if(!reduceMotion)startBoxSpin();}
    }
    function openGiftDialog(){
      const dialog=$('gift-dialog');if(!dialog.open)dialog.showModal();
      stopProductSpin();stopBoxSpin();
      giftView.opened=false;giftView.dragging=false;giftView.frame=0;
      giftView.boxX=-19;giftView.boxY=28;
      clearGiftBoxFade();
      giftStage.classList.remove('is-unboxed','is-dragging');
      giftCube.classList.remove('is-unboxed');
      $('gift-unseal').disabled=false;
      $('gift-stage-instructions').hidden=true;
      $('gift-frame-counter').hidden=true;
      $('gift-scrubber').hidden=true;
      $('gift-close-box').hidden=true;
      boxHint.hidden=false;
      giftStage.setAttribute('aria-label','Spinning three dimensional gift box. Drag to rotate the box, then open to reveal your product.');
      $('gift-spin-toggle').disabled=false;
      $('gift-reset-view').disabled=false;
      setIconText($('gift-reset-view'), PhArrowClockwise, 'Reset box view');
      $('gift-experience-subtitle').textContent='The original spinning gift box, with a surprise waiting inside.';
      $('gift-product-label').textContent='A surprise awaits inside this ribboned box';
      renderBox();fillProductFrame(0);
      if(gsapReady&&!reduceMotion){
        gsap.fromTo('#gift-dialog-panel',{opacity:0,y:26,scale:.97},{opacity:1,y:0,scale:1,duration:.7,ease:'power3.out'});
      }
      if(!reduceMotion)startBoxSpin();
      else stopBoxSpin();
      $('gift-unseal').focus();
    }
    function closeGiftDialog(){
      stopProductSpin();stopBoxSpin();
      clearGiftBoxFade();
      if($('gift-dialog').open)$('gift-dialog').close();
    }
    const gift360Button = $('gift360-button');
    if (!GIFT.has360Viewer) {
      gift360Button.disabled = true;
      gift360Button.hidden = true;
      gift360Button.setAttribute('aria-hidden','true');
      setText('.gift-card__caption','A keepsake gift box is included with this letter.');
    } else if (GIFT.previewMode) {
      gift360Button.disabled = true;
      gift360Button.setAttribute('aria-disabled','true');
      gift360Button.title = 'The 360° viewer becomes available after checkout.';
      setText('.gift-card__caption','The full gift experience and 360° viewer become available after checkout.');
    }
    gift360Button.addEventListener('click',()=>{
      if (GIFT.previewMode || !GIFT.has360Viewer) return;
      openGiftDialog();
      // Audio buffering or autoplay restrictions must not delay the popup.
      void startMusic();
    });
    $('gift-dialog-close').addEventListener('click',closeGiftDialog);
    $('gift-dialog').addEventListener('click',e=>{if(e.target===$('gift-dialog'))closeGiftDialog();});
    $('gift-dialog').addEventListener('cancel',()=>{stopProductSpin();stopBoxSpin();clearGiftBoxFade();});
    $('gift-unseal').addEventListener('click',unboxGift);
    $('gift-close-box').addEventListener('click',rewrapGift);
    $('gift-spin-toggle').addEventListener('click',()=>{
      if(giftView.opened)giftView.playing?stopProductSpin():startProductSpin();
      else giftView.boxSpinning?stopBoxSpin():startBoxSpin();
    });
    $('gift-reset-view').addEventListener('click',resetGiftView);
    $('gift-prev-frame').addEventListener('click',()=>{stopProductSpin();fillProductFrame(giftView.frame-1);preloadNeighbors();});
    $('gift-next-frame').addEventListener('click',()=>{stopProductSpin();fillProductFrame(giftView.frame+1);preloadNeighbors();});
    giftSlider.addEventListener('input',()=>{stopProductSpin();fillProductFrame(Number(giftSlider.value));preloadNeighbors();});
    giftStage.addEventListener('pointerdown',e=>{
      if(e.target.closest('button,input,details,label') || e.button>0)return;
      if(GIFT.previewMode&&giftView.opened)return;
      giftView.dragging=true;giftView.pointerId=e.pointerId;
      giftView.startX=e.clientX;giftView.startY=e.clientY;
      giftView.startFrame=giftView.frame;
      giftView.pointerMoved=false;giftStage.classList.add('is-dragging');
      if(giftView.opened)stopProductSpin();else stopBoxSpin();
      if(giftStage.setPointerCapture)giftStage.setPointerCapture(e.pointerId);
    });
    giftStage.addEventListener('pointermove',e=>{
      if(!giftView.dragging||e.pointerId!==giftView.pointerId)return;
      const dx=e.clientX-giftView.startX,dy=e.clientY-giftView.startY;
      if(Math.abs(dx)>2||Math.abs(dy)>2)giftView.pointerMoved=true;
      if(giftView.opened)fillProductFrame(giftView.startFrame+Math.round(dx*.64));
      else{
        giftView.boxY+=dx*.16;giftView.boxX=Math.max(-67,Math.min(55,giftView.boxX-dy*.12));
        giftView.startX=e.clientX;giftView.startY=e.clientY;renderBox();
      }
    });
    function finishGiftDrag(e){
      if(!giftView.dragging)return;
      giftView.dragging=false;giftStage.classList.remove('is-dragging');
      if(giftView.opened)preloadNeighbors();
    }
    giftStage.addEventListener('pointerup',finishGiftDrag);
    giftStage.addEventListener('pointercancel',finishGiftDrag);
    giftStage.tabIndex=0;
    giftStage.addEventListener('keydown',e=>{
      if(!['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key))return;
      e.preventDefault();
      if(giftView.opened){if(GIFT.previewMode)return;stopProductSpin();fillProductFrame(giftView.frame+(e.key==='ArrowRight'?1:-1));preloadNeighbors();}
      else{
        stopBoxSpin();giftView.boxY+=(e.key==='ArrowRight'?9:e.key==='ArrowLeft'?-9:0);
        giftView.boxX+=e.key==='ArrowUp'?7:e.key==='ArrowDown'?-7:0;renderBox();
      }
    });
    async function importGiftFiles(files){
      const valid=Array.from(files||[]).filter(file=>/^image\/(?:jpeg|png|webp|avif)$/i.test(file.type)||/\.(?:jpe?g|png|webp|avif)$/i.test(file.name));
      valid.sort((a,b)=>naturalFrameSorter.compare(a.webkitRelativePath||a.name,b.webkitRelativePath||b.name));
      if(valid.length<2){$('gift-load-status').textContent='Please choose at least two images captured in one complete turn.';return;}
      if(valid.length>300){$('gift-load-status').textContent='Choose at most 300 photos for this viewer.';return;}
      const urls=valid.map(file=>URL.createObjectURL(file));
      setFrameSource(urls,{isDemo:false,name:valid[0].name.replace(/\d+\.[^.]+$/i,'').slice(0,35),ownsUrls:urls});
      $('gift-load-status').textContent=`Loaded ${valid.length} product images. ${valid.length<200?'For the smoothest full turn, use 200–300 photos. ':''}Your local preview is ready. To publish your photos, use the included build_product360.py packager.`;
      if(!giftView.opened)unboxGift();
    }
    $('gift-folder-input').addEventListener('change',e=>importGiftFiles(e.target.files));
    $('gift-files-input').addEventListener('change',e=>importGiftFiles(e.target.files));
    listen(document, 'visibilitychange', ()=>{
      if(document.hidden){stopBoxSpin();stopProductSpin();}
      else if($('gift-dialog').open&&!reduceMotion){giftView.opened?startProductSpin():startBoxSpin();}
    });
    if(product360.mode==='urls' && Array.isArray(product360.frames)){
      setFrameSource(product360.frames,{isDemo:false,name:'your bouquet'});
    }
    $('gift-upload').hidden = product360.mode !== 'demo';
    if(product360.mode==='folder'){
      const n=Number(product360.frameCount)||240;
      if(n>=2&&n<=300){
        const paths=Array.from({length:n},(_,i)=>`${product360.folder}${product360.prefix}${String((product360.firstFrame||1)+i).padStart(product360.digits||3,'0')}.${product360.extension||'webp'}`);
        const test=new Image();test.onload=()=>setFrameSource(paths,{isDemo:false,name:'your product'});
        test.onerror=()=>{$('gift-load-status').textContent='Product photo folder not found, so the 240-frame illustrated demo is shown.';};
        test.src=paths[0];
      }
    }
    fillProductFrame(0);

    function launchSparkles() {
      if (!gsapReady || reduceMotion) return;
      const root = $('surprise-card');
      root.querySelectorAll('.spark').forEach(el => el.remove());
      for (let i=0;i<16;i++) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        const use = document.createElementNS('http://www.w3.org/2000/svg','use');
        use.setAttribute('href',i%3===0?'#tiny-heart':'#tiny-star');
        svg.setAttribute('viewBox','0 0 60 60');svg.classList.add('spark');svg.appendChild(use);root.appendChild(svg);
        const theta = (i/16)*Math.PI*2;
        const r = 120 + (i%4)*24;
        gsap.fromTo(svg,{x:0,y:0,opacity:1,scale:.35,rotation:0},
          {x:Math.cos(theta)*r,y:Math.sin(theta)*r,opacity:0,rotation:85,scale:1.2,duration:1.55,delay:.26,ease:'power2.out',onComplete:()=>svg.remove()});
      }
    }
    $('last-button').addEventListener('click', async () => {
      await startMusic();
      const dialog = $('surprise-dialog');
      dialog.showModal();
      if (gsapReady && !reduceMotion) {
        gsap.fromTo('#surprise-card',{opacity:0,y:45,scale:.88,rotation:-2},
          {opacity:1,y:0,scale:1,rotation:0,duration:.9,ease:'back.out(1.45)'});
        launchSparkles();
      }
      $('dialog-close').focus();
    });
    $('dialog-close').addEventListener('click',()=> $('surprise-dialog').close());
    $('surprise-dialog').addEventListener('click',e => {if(e.target===$('surprise-dialog'))$('surprise-dialog').close();});
    $('share-shop-button').addEventListener('click', async () => {
      const url = `${publicSiteUrl()}/`;
      const message = 'Stack Petals — Engineered with Precision, Crafted with Love.';
      const feedback = $('shop-share-feedback');
      feedback.textContent = '';
      if (navigator.share) {
        try {
          await navigator.share({title:'Stack Petals', text:message, url});
          return;
        } catch (error) {
          if (error.name === 'AbortError') return;
          // Fall through to the copy-link fallback if native sharing is unavailable.
        }
      }
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
        } else {
          const input = document.createElement('textarea');
          input.value = url;
          input.setAttribute('readonly', '');
          input.style.position = 'fixed';
          input.style.opacity = '0';
          document.body.appendChild(input);
          input.select();
          const copied = document.execCommand('copy');
          input.remove();
          if (!copied) throw new Error('Copy not available');
        }
        feedback.textContent = 'Shop link copied — ready to share!';
      } catch (error) {
        feedback.textContent = `Share this link: ${PUBLIC_SITE_URL}`;
      }
    });
    $('replay-button').addEventListener('click',()=>window.location.reload());

    // Decorative motion is purely optional and respects reduced-motion settings.
    if (gsapReady && !reduceMotion) {
      gsap.timeline({defaults:{ease:'power3.out'}})
        .from('.hero__header',{opacity:0,y:-25,filter:'blur(8px)',duration:1.2})
        .from('.hero__copy > *',{opacity:0,y:38,filter:'blur(8px)',stagger:.13,duration:1.25,clearProps:'filter'},'-=.65')
        .from('#envelope-stage',{opacity:0,y:105,scale:.77,rotationX:-28,filter:'blur(15px)',duration:2.1,ease:'expo.out',clearProps:'filter'},'-=1.16')
        .from('.hero__botanical--left',{opacity:0,x:-75,rotation:-25,duration:2.4},'-=1.8')
        .from('.hero__botanical--right',{opacity:0,x:75,rotation:185,duration:2.4},'<')
        .from('#open-button',{opacity:0,y:23,duration:.95},'-=.7');
      gsap.to('#seal-button',{y:-5,scale:1.045,repeat:-1,yoyo:true,duration:1.7,ease:'sine.inOut'});
      gsap.to('.luxe-envelope-aura',{scale:1.2,opacity:.72,repeat:-1,yoyo:true,duration:3.8,ease:'sine.inOut'});
      const field=$('petal-field');
      for(let i=0;i<17;i++) {
        const petal=document.createElement('i');petal.className='floating-petal';field.appendChild(petal);
        const startX = 5 + (i*37.618)%90;
        const time = 13 + (i*7)%11;
        gsap.set(petal,{left:`${startX}%`,y:-40,opacity: .32 + (i%4)*.11,rotation:i*47,scale:.55+(i%5)*.18});
        gsap.to(petal,{y:()=>window.innerHeight+95,x:(i%2?-1:1)*(65+i*11),rotation:`+=${(i%2?-1:1)*(250+i*19)}`,
          duration:time,delay:-(i*3.3%time),ease:'none',repeat:-1});
      }
    }

  return () => {
    if (music) music.stop();
    stopProductSpin();stopBoxSpin();clearGiftBoxFade();
    giftView.ownsUrls.forEach(url => URL.revokeObjectURL(url));
    giftView.preload = [];
    luxeCleanup.splice(0).forEach(cleanup => cleanup());
  };
}
