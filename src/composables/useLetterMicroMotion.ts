import { animate, stagger } from 'animejs'

type AnimeAnimation = ReturnType<typeof animate>

const sparkleVectors = [
  { x: 0, y: -20 },
  { x: 18, y: -10 },
  { x: 17, y: 12 },
  { x: 0, y: 21 },
  { x: -18, y: 12 },
  { x: -18, y: -10 },
]

const envelopeSparkleVectors = [
  { x: -54, y: -42 },
  { x: -18, y: -62 },
  { x: 24, y: -58 },
  { x: 58, y: -28 },
  { x: 52, y: 18 },
  { x: 18, y: 44 },
  { x: -28, y: 42 },
  { x: -58, y: 12 },
]

const memorySparkleVectors = [
  { x: -30, y: -22 },
  { x: 28, y: -28 },
  { x: 38, y: 8 },
  { x: 22, y: 30 },
  { x: -26, y: 32 },
  { x: -38, y: 5 },
]

const bouquetSparkleVectors = [
  { x: -58, y: -45 },
  { x: -20, y: -66 },
  { x: 25, y: -62 },
  { x: 60, y: -30 },
  { x: 58, y: 26 },
  { x: 22, y: 58 },
  { x: -30, y: 56 },
  { x: -62, y: 18 },
]

const reminderSparkleVectors = [
  { x: -48, y: -20 },
  { x: -22, y: -46 },
  { x: 18, y: -48 },
  { x: 48, y: -18 },
  { x: 44, y: 24 },
  { x: 18, y: 46 },
  { x: -22, y: 44 },
  { x: -46, y: 20 },
]

const senderSparkleVectors = [
  { x: -50, y: -24 },
  { x: -16, y: -52 },
  { x: 24, y: -48 },
  { x: 52, y: -10 },
  { x: 38, y: 38 },
  { x: -10, y: 52 },
  { x: -46, y: 28 },
]

export function useLetterMicroMotion() {
  const runningAnimations = new Set<AnimeAnimation>()

  function shouldReduceMotion() {
    return typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function play(target: Parameters<typeof animate>[0], parameters: Parameters<typeof animate>[1]) {
    const animation = animate(target, parameters)
    runningAnimations.add(animation)
    animation.then(() => runningAnimations.delete(animation)).catch(() => undefined)
    return animation
  }

  function animatePetalReveal(index: number, isComplete: boolean) {
    if (typeof document === 'undefined' || shouldReduceMotion()) return

    const screen = document.querySelector<HTMLElement>('.petal-message-screen')
    if (!screen) return

    const symbols = Array.from(screen.querySelectorAll<HTMLElement>('.petal-symbol'))
    const selectedSymbol = symbols[index]
    const flower = screen.querySelector<HTMLElement>('.flower-image')
    const message = screen.querySelector<HTMLElement>('.petal-message-card')
    const sparkles = Array.from(screen.querySelectorAll<HTMLElement>('.petal-sparkle-burst span'))

    if (selectedSymbol) {
      play(selectedSymbol, {
        scale: [1, 1.28, 0.96, 1.08],
        rotate: [0, index % 2 === 0 ? 8 : -8, 0],
        duration: 720,
        ease: 'out(4)',
      })
    }

    if (flower) {
      play(flower, {
        filter: [
          'brightness(1) saturate(1)',
          'brightness(1.12) saturate(1.08)',
          'brightness(1) saturate(1)',
        ],
        duration: 900,
        ease: 'inOut(3)',
      })
    }

    sparkles.forEach((sparkle, sparkleIndex) => {
      const vector = sparkleVectors[sparkleIndex] ?? sparkleVectors[0]
      play(sparkle, {
        opacity: [0, 1, 0],
        scale: [0.2, 1.2, 0.35],
        translateX: [0, vector.x],
        translateY: [0, vector.y],
        delay: sparkleIndex * 35,
        duration: 720,
        ease: 'out(3)',
      })
    })

    if (message) {
      play(message, {
        opacity: [0, 1],
        translateY: [12, 0],
        scale: [0.97, 1],
        duration: 560,
        ease: 'out(4)',
      })
    }

    if (isComplete) {
      play(symbols, {
        scale: [1, 1.16, 1],
        delay: stagger(65, { from: index }),
        duration: 620,
        ease: 'inOut(3)',
      })

      const action = screen.querySelector<HTMLElement>('.page3-action-slot')
      if (action) {
        play(action, {
          filter: ['brightness(1)', 'brightness(1.12)', 'brightness(1)'],
          translateY: [5, 0],
          duration: 900,
          ease: 'out(4)',
        })
      }
    }
  }

  async function animateEnvelopeOpening() {
    if (typeof document === 'undefined' || shouldReduceMotion()) return

    const wrap = document.querySelector<HTMLElement>('.letter-reveal-wrap.anime-opening')
    if (!wrap) return

    const stage = wrap.querySelector<HTMLElement>('.page4-envelope-stage')
    const circle = wrap.querySelector<HTMLElement>('.page4-circle')
    const envelope = wrap.querySelector<HTMLElement>('.page4-envelope')
    const flare = wrap.querySelector<HTMLElement>('.page4-seal-flare')
    const ribbon = wrap.querySelector<HTMLElement>('.page4-light-ribbon')
    const sparkles = Array.from(wrap.querySelectorAll<HTMLElement>('.page4-opening-sparkles span'))
    const copy = Array.from(wrap.querySelectorAll<HTMLElement>(
      '.page4-title, .page4-divider, .letter-sub, .page4-open-magic-action',
    ))

    if (!stage || !circle || !envelope) return

    await Promise.all([
      play(stage, {
        scale: [1, 1.035],
        duration: 420,
        ease: 'out(3)',
      }),
      play(envelope, {
        translateY: [0, -12],
        rotate: [-7, -1],
        scale: [1, 1.085],
        filter: [
          'brightness(1) drop-shadow(0 0 0 rgba(255, 255, 255, 0))',
          'brightness(1.08) drop-shadow(0 13px 20px rgba(190, 91, 111, 0.24))',
        ],
        duration: 480,
        ease: 'out(4)',
      }),
      play(circle, {
        scale: [1, 1.07],
        rotate: [0, 3],
        filter: ['brightness(1)', 'brightness(1.12)'],
        duration: 480,
        ease: 'out(3)',
      }),
    ])

    if (flare) {
      play(flare, {
        opacity: [0, 0.95, 0],
        scale: [0.25, 1.35, 1.8],
        duration: 720,
        ease: 'out(4)',
      })
    }

    if (ribbon) {
      play(ribbon, {
        opacity: [0, 0.85, 0],
        scaleX: [0.12, 1, 1.24],
        duration: 760,
        ease: 'out(4)',
      })
    }

    sparkles.forEach((sparkle, index) => {
      const vector = envelopeSparkleVectors[index] ?? envelopeSparkleVectors[0]
      play(sparkle, {
        opacity: [0, 1, 0],
        scale: [0.15, 1.15, 0.3],
        translateX: [0, vector.x],
        translateY: [0, vector.y],
        rotate: [0, index % 2 === 0 ? 70 : -70],
        delay: index * 28,
        duration: 680,
        ease: 'out(4)',
      })
    })

    await Promise.all([
      play(envelope, {
        opacity: [1, 0],
        translateY: [-12, -42],
        rotate: [-1, 5],
        scale: [1.085, 1.2],
        duration: 620,
        ease: 'inOut(3)',
      }),
      play(circle, {
        opacity: [1, 0],
        scale: [1.07, 0.82],
        rotate: [3, 12],
        duration: 600,
        ease: 'inOut(3)',
      }),
      play(copy, {
        opacity: [1, 0],
        translateY: [0, 8],
        delay: stagger(35),
        duration: 430,
        ease: 'in(3)',
      }),
    ])
  }

  function animateMemoryChapterEntrance() {
    if (typeof document === 'undefined' || shouldReduceMotion()) return

    const screen = document.querySelector<HTMLElement>('.memories-screen')
    if (!screen) return

    const title = screen.querySelector<HTMLElement>('.letter-title')
    const divider = screen.querySelector<HTMLElement>('.letter-divider')
    const frame = screen.querySelector<HTMLElement>('.memory-frame')
    const activePhoto = screen.querySelector<HTMLElement>('.memory-slide.active')
    const dots = screen.querySelector<HTMLElement>('.memory-dots')
    const caption = screen.querySelector<HTMLElement>('.memory-caption')
    const action = screen.querySelector<HTMLElement>('.page5-magic-action')
    const glint = screen.querySelector<HTMLElement>('.memory-photo-glint')
    const sparkles = Array.from(screen.querySelectorAll<HTMLElement>('.memory-reveal-sparkles span'))

    if (title) {
      play(title, {
        opacity: [0, 1],
        translateY: [16, 0],
        duration: 720,
        ease: 'out(4)',
      })
    }

    if (divider) {
      play(divider, {
        opacity: [0, 1],
        scaleX: [0.35, 1],
        delay: 100,
        duration: 640,
        ease: 'out(4)',
      })
    }

    if (frame) {
      play(frame, {
        opacity: [0, 1],
        translateY: [34, 0],
        rotate: [-5.5, -1.2],
        scale: [0.9, 1.025, 1],
        delay: 130,
        duration: 940,
        ease: 'out(4)',
      })
    }

    if (activePhoto) {
      play(activePhoto, {
        filter: [
          'brightness(1.3) saturate(0.45) contrast(0.86)',
          'brightness(1.08) saturate(0.86) contrast(0.96)',
          'brightness(1) saturate(1) contrast(1)',
        ],
        scale: [1.08, 1],
        delay: 250,
        duration: 1250,
        ease: 'inOut(3)',
      })
    }

    if (glint) {
      play(glint, {
        opacity: [0, 0.72, 0],
        translateX: ['-135%', '135%'],
        delay: 420,
        duration: 980,
        ease: 'inOut(3)',
      })
    }

    const supportingElements = [dots, caption, action].filter(
      (element): element is HTMLElement => Boolean(element),
    )
    if (supportingElements.length) {
      play(supportingElements, {
        opacity: [0, 1],
        translateY: [14, 0],
        delay: stagger(90, { start: 430 }),
        duration: 620,
        ease: 'out(4)',
      })
    }

    sparkles.forEach((sparkle, index) => {
      const vector = memorySparkleVectors[index] ?? memorySparkleVectors[0]
      play(sparkle, {
        opacity: [0, 0.9, 0],
        scale: [0.15, 1.05, 0.25],
        translateX: [0, vector.x],
        translateY: [0, vector.y],
        delay: 520 + index * 45,
        duration: 760,
        ease: 'out(4)',
      })
    })
  }

  function animateMemoryChange(direction: 1 | -1) {
    if (typeof document === 'undefined' || shouldReduceMotion()) return

    const screen = document.querySelector<HTMLElement>('.memories-screen')
    if (!screen) return

    const frame = screen.querySelector<HTMLElement>('.memory-frame')
    const activePhoto = screen.querySelector<HTMLElement>('.memory-slide.active')
    const caption = screen.querySelector<HTMLElement>('.memory-caption')
    const activeDot = screen.querySelector<HTMLElement>('.memory-dots span.active')
    const glint = screen.querySelector<HTMLElement>('.memory-photo-glint')
    const sparkles = Array.from(screen.querySelectorAll<HTMLElement>('.memory-reveal-sparkles span'))

    if (frame) {
      play(frame, {
        rotate: [-1.2, direction * 1.4, -1.2],
        translateX: [0, direction * -5, 0],
        scale: [1, 0.985, 1],
        duration: 520,
        ease: 'inOut(3)',
      })
    }

    if (activePhoto) {
      play(activePhoto, {
        opacity: [0.35, 1],
        translateX: [direction * 18, 0],
        scale: [1.035, 1],
        filter: ['brightness(1.12) saturate(0.82)', 'brightness(1) saturate(1)'],
        duration: 640,
        ease: 'out(4)',
      })
    }

    if (caption) {
      play(caption, {
        opacity: [0.45, 1],
        translateY: [8, 0],
        duration: 520,
        ease: 'out(4)',
      })
    }

    if (activeDot) {
      play(activeDot, {
        scale: [0.7, 1.18, 1],
        duration: 460,
        ease: 'out(4)',
      })
    }

    if (glint) {
      play(glint, {
        opacity: [0, 0.5, 0],
        translateX: direction > 0 ? ['-135%', '135%'] : ['135%', '-135%'],
        duration: 720,
        ease: 'inOut(3)',
      })
    }

    sparkles.forEach((sparkle, index) => {
      const vector = memorySparkleVectors[index] ?? memorySparkleVectors[0]
      play(sparkle, {
        opacity: [0, 0.75, 0],
        scale: [0.2, 0.9, 0.2],
        translateX: [0, vector.x * 0.65],
        translateY: [0, vector.y * 0.65],
        delay: index * 28,
        duration: 560,
        ease: 'out(4)',
      })
    })
  }

  function animateBouquetChapterEntrance() {
    if (typeof document === 'undefined' || shouldReduceMotion()) return

    const screen = document.querySelector<HTMLElement>('.bouquet-screen')
    if (!screen) return

    const title = screen.querySelector<HTMLElement>('.letter-title')
    const intro = screen.querySelector<HTMLElement>('.bouquet-intro')
    const divider = screen.querySelector<HTMLElement>('.letter-divider')
    const preview = screen.querySelector<HTMLElement>('.bouquet-preview')
    const tag = screen.querySelector<HTMLElement>('.bouquet-tag')
    const photo = screen.querySelector<HTMLElement>('.bouquet-main-photo')
    const shine = screen.querySelector<HTMLElement>('.bouquet-shine')
    const plaque = screen.querySelector<HTMLElement>('.bouquet-plaque')
    const details = Array.from(screen.querySelectorAll<HTMLElement>('.bouquet-detail-row > span'))
    const control = screen.querySelector<HTMLElement>('.btn-360, .bouquet-note')
    const action = screen.querySelector<HTMLElement>('.page6-magic-action')
    const sparkles = Array.from(screen.querySelectorAll<HTMLElement>('.bouquet-sparkles span'))

    if (title) {
      play(title, {
        opacity: [0, 1],
        translateY: [15, 0],
        duration: 720,
        ease: 'out(4)',
      })
    }

    if (intro) {
      play(intro, {
        opacity: [0, 1],
        translateY: [9, 0],
        delay: 80,
        duration: 620,
        ease: 'out(4)',
      })
    }

    if (divider) {
      play(divider, {
        opacity: [0, 1],
        scaleX: [0.3, 1],
        delay: 130,
        duration: 640,
        ease: 'out(4)',
      })
    }

    if (preview) {
      play(preview, {
        opacity: [0, 1],
        delay: 180,
        duration: 520,
        ease: 'out(3)',
      })
    }

    if (tag) {
      play(tag, {
        opacity: [0, 1],
        scale: [0.84, 1.04, 1],
        delay: 220,
        duration: 760,
        ease: 'out(4)',
      })
    }

    if (photo) {
      play(photo, {
        opacity: [0, 1],
        translateY: [26, -6, 0],
        scale: [0.82, 1.035, 1],
        rotate: ['-2.5deg', '0.6deg', '0deg'],
        delay: 300,
        duration: 1080,
        ease: 'out(4)',
      })
    }

    if (shine) {
      play(shine, {
        opacity: [0, 0.76, 0],
        translateX: ['-145%', '220%'],
        delay: 500,
        duration: 980,
        ease: 'inOut(3)',
      })
    }

    if (plaque) {
      play(plaque, {
        opacity: [0, 1],
        translateY: [12, 0],
        scale: [0.94, 1],
        delay: 570,
        duration: 640,
        ease: 'out(4)',
      })
    }

    if (details.length) {
      play(details, {
        opacity: [0, 1],
        translateY: [8, 0],
        delay: stagger(70, { start: 650 }),
        duration: 560,
        ease: 'out(4)',
      })
    }

    const finalElements = [control, action].filter(
      (element): element is HTMLElement => Boolean(element),
    )
    if (finalElements.length) {
      play(finalElements, {
        opacity: [0, 1],
        translateY: [10, 0],
        delay: stagger(90, { start: 790 }),
        duration: 600,
        ease: 'out(4)',
      })
    }

    sparkles.forEach((sparkle, index) => {
      const vector = bouquetSparkleVectors[index] ?? bouquetSparkleVectors[0]
      play(sparkle, {
        opacity: [0, 0.95, 0],
        scale: [0.1, 1.15, 0.25],
        translateX: [0, vector.x],
        translateY: [0, vector.y],
        rotate: [0, index % 2 === 0 ? 55 : -55],
        delay: 520 + index * 42,
        duration: 820,
        ease: 'out(4)',
      })
    })
  }

  function animateReminderChapterEntrance() {
    if (typeof document === 'undefined' || shouldReduceMotion()) return

    const screen = document.querySelector<HTMLElement>('.quote-screen')
    if (!screen) return

    const flowerWrap = screen.querySelector<HTMLElement>('.quote-flower-wrap')
    const flower = screen.querySelector<HTMLElement>('.quote-flower-img')
    const kicker = screen.querySelector<HTMLElement>('.quote-kicker')
    const divider = screen.querySelector<HTMLElement>('.quote-divider')
    const card = screen.querySelector<HTMLElement>('.quote-card')
    const lines = Array.from(screen.querySelectorAll<HTMLElement>('.quote-line'))
    const action = screen.querySelector<HTMLElement>('.page7-magic-action')
    const sparkles = Array.from(screen.querySelectorAll<HTMLElement>('.quote-sparkles span'))

    if (flowerWrap) {
      play(flowerWrap, {
        opacity: [0, 1],
        scale: [0.62, 1.12, 1],
        rotate: ['-10deg', '3deg', '0deg'],
        duration: 980,
        ease: 'out(4)',
      })
    }

    if (flower) {
      play(flower, {
        filter: [
          'brightness(0.95) saturate(0.9)',
          'brightness(1.16) saturate(1.12)',
          'brightness(1) saturate(1)',
        ],
        duration: 1180,
        ease: 'inOut(3)',
      })
    }

    sparkles.forEach((sparkle, index) => {
      const vector = reminderSparkleVectors[index] ?? reminderSparkleVectors[0]
      play(sparkle, {
        opacity: [0, 0.9, 0],
        scale: [0.15, 1, 0.2],
        translateX: [0, vector.x],
        translateY: [0, vector.y],
        rotate: [0, index % 2 === 0 ? 65 : -65],
        delay: 180 + index * 38,
        duration: 760,
        ease: 'out(4)',
      })
    })

    if (kicker) {
      play(kicker, {
        opacity: [0, 1],
        translateY: [12, 0],
        delay: 220,
        duration: 680,
        ease: 'out(4)',
      })
    }

    if (divider) {
      play(divider, {
        opacity: [0, 1],
        scaleX: [0.18, 1],
        delay: 330,
        duration: 720,
        ease: 'out(4)',
      })
    }

    if (card) {
      play(card, {
        opacity: [0, 1],
        translateY: [24, 0],
        scale: [0.94, 1.012, 1],
        delay: 390,
        duration: 900,
        ease: 'out(4)',
      })
    }

    if (lines.length) {
      play(lines, {
        opacity: [0, 1],
        translateY: [15, 0],
        filter: ['blur(5px)', 'blur(0px)'],
        delay: stagger(180, { start: 610 }),
        duration: 760,
        ease: 'out(4)',
      })
    }

    if (action) {
      play(action, {
        opacity: [0, 1],
        translateY: [14, 0],
        scale: [0.95, 1],
        delay: 1260,
        duration: 680,
        ease: 'out(4)',
      })
    }
  }

  function animateSenderChapterEntrance() {
    if (typeof document === 'undefined' || shouldReduceMotion()) return

    const screen = document.querySelector<HTMLElement>('.sender-screen')
    if (!screen) return

    const card = screen.querySelector<HTMLElement>('.sender-keepsake')
    const kicker = screen.querySelector<HTMLElement>('.sender-kicker')
    const seal = screen.querySelector<HTMLElement>('.sender-seal')
    const sealRing = screen.querySelector<HTMLElement>('.sender-seal-ring')
    const initial = screen.querySelector<HTMLElement>('.sender-circle')
    const name = screen.querySelector<HTMLElement>('.sender-name')
    const divider = screen.querySelector<HTMLElement>('.sender-divider')
    const closingCopy = Array.from(
      screen.querySelectorAll<HTMLElement>('.sender-note, .sender-flourish'),
    )
    const action = screen.querySelector<HTMLElement>('.page8-magic-action')
    const sparkles = Array.from(screen.querySelectorAll<HTMLElement>('.sender-sparkles span'))

    if (card) {
      play(card, {
        opacity: [0, 1],
        translateY: [24, 0],
        scale: [0.95, 1.008, 1],
        duration: 920,
        ease: 'out(4)',
      })
    }

    if (kicker) {
      play(kicker, {
        opacity: [0, 1],
        translateY: [9, 0],
        letterSpacing: ['0.38em', '0.28em'],
        delay: 190,
        duration: 680,
        ease: 'out(4)',
      })
    }

    if (seal) {
      play(seal, {
        opacity: [0, 1],
        translateY: [-22, 3, 0],
        scale: [1.18, 0.94, 1],
        rotate: ['-7deg', '2deg', '0deg'],
        delay: 310,
        duration: 900,
        ease: 'out(5)',
      })
    }

    if (sealRing) {
      play(sealRing, {
        opacity: [0.15, 0.9, 0.62],
        delay: 470,
        duration: 780,
        ease: 'out(4)',
      })
    }

    if (initial) {
      play(initial, {
        filter: [
          'brightness(0.95) saturate(0.9)',
          'brightness(1.18) saturate(1.14)',
          'brightness(1) saturate(1)',
        ],
        delay: 390,
        duration: 960,
        ease: 'inOut(3)',
      })
    }

    sparkles.forEach((sparkle, index) => {
      const vector = senderSparkleVectors[index] ?? senderSparkleVectors[0]
      play(sparkle, {
        opacity: [0, 0.95, 0],
        scale: [0.1, 1.12, 0.2],
        translateX: [0, vector.x],
        translateY: [0, vector.y],
        rotate: [0, index % 2 === 0 ? 60 : -60],
        delay: 500 + index * 42,
        duration: 780,
        ease: 'out(4)',
      })
    })

    if (name) {
      play(name, {
        opacity: [0, 1],
        translateY: [16, 0],
        filter: ['blur(5px)', 'blur(0px)'],
        delay: 650,
        duration: 760,
        ease: 'out(4)',
      })
    }

    if (divider) {
      play(divider, {
        opacity: [0, 1],
        scaleX: [0.16, 1],
        delay: 760,
        duration: 650,
        ease: 'out(4)',
      })
    }

    if (closingCopy.length) {
      play(closingCopy, {
        opacity: [0, 1],
        translateY: [10, 0],
        delay: stagger(120, { start: 860 }),
        duration: 620,
        ease: 'out(4)',
      })
    }

    if (action) {
      play(action, {
        opacity: [0, 1],
        translateY: [14, 0],
        scale: [0.95, 1],
        delay: 1160,
        duration: 680,
        ease: 'out(4)',
      })
    }
  }

  function animateKeepsakeChapterEntrance() {
    if (typeof document === 'undefined' || shouldReduceMotion()) return

    const screen = document.querySelector<HTMLElement>('.keepsake-screen')
    if (!screen) return

    const eyebrow = screen.querySelector<HTMLElement>('.keepsake-heading > span')
    const heading = screen.querySelector<HTMLElement>('.keepsake-heading h2')
    const introduction = screen.querySelector<HTMLElement>('.keepsake-heading p')
    const ribbon = screen.querySelector<HTMLElement>('.keepsake-ribbon')
    const tiles = Array.from(screen.querySelectorAll<HTMLElement>('.keepsake-tile'))
    const numbers = Array.from(screen.querySelectorAll<HTMLElement>('.keepsake-number'))
    const copies = Array.from(screen.querySelectorAll<HTMLElement>('.keepsake-copy'))
    const action = screen.querySelector<HTMLElement>('.page9-magic-action')

    if (eyebrow) {
      play(eyebrow, {
        opacity: [0, 1],
        translateY: [8, 0],
        letterSpacing: ['0.34em', '0.24em'],
        duration: 580,
        ease: 'out(4)',
      })
    }

    if (heading) {
      play(heading, {
        opacity: [0, 1],
        translateY: [20, 0],
        filter: ['blur(7px)', 'blur(0px)'],
        delay: 90,
        duration: 820,
        ease: 'out(4)',
      })
    }

    if (introduction) {
      play(introduction, {
        opacity: [0, 1],
        translateY: [10, 0],
        delay: 230,
        duration: 620,
        ease: 'out(4)',
      })
    }

    if (ribbon) {
      play(ribbon, {
        opacity: [0, 1],
        scaleY: [0.05, 1],
        transformOrigin: '50% 0%',
        delay: 300,
        duration: 880,
        ease: 'out(4)',
      })
    }

    const tileEntrances = [
      { x: -30, y: 8, rotate: -1.4 },
      { x: -18, y: 22, rotate: -1 },
      { x: 18, y: 22, rotate: 1 },
      { x: 30, y: 8, rotate: 1.4 },
    ]

    tiles.forEach((tile, index) => {
      const entrance = tileEntrances[index] ?? tileEntrances[0]
      play(tile, {
        opacity: [0, 1],
        translateX: [entrance.x, 0],
        translateY: [entrance.y, 0],
        rotate: [`${entrance.rotate}deg`, '0deg'],
        scale: [0.955, 1],
        delay: 360 + index * 125,
        duration: 820,
        ease: 'out(4)',
      })
    })

    if (numbers.length) {
      play(numbers, {
        opacity: [0, 1],
        scale: [0.35, 1.12, 1],
        rotate: ['-18deg', '3deg', '0deg'],
        delay: stagger(125, { start: 600 }),
        duration: 620,
        ease: 'out(5)',
      })
    }

    if (copies.length) {
      play(copies, {
        opacity: [0, 1],
        translateY: [12, 0],
        filter: ['blur(4px)', 'blur(0px)'],
        delay: stagger(125, { start: 680 }),
        duration: 650,
        ease: 'out(4)',
      })
    }

    if (action) {
      play(action, {
        opacity: [0, 1],
        translateY: [15, 0],
        scale: [0.94, 1],
        delay: 1190,
        duration: 720,
        ease: 'out(4)',
      })
    }
  }

  function animateFinalChapterEntrance() {
    if (typeof document === 'undefined' || shouldReduceMotion()) return

    const screen = document.querySelector<HTMLElement>('.end-screen')
    const stationery = screen?.querySelector<HTMLElement>('.end-stationery')
    if (!screen || !stationery) return

    const floralStage = stationery.querySelector<HTMLElement>('.end-floral-stage')
    const titleLines = Array.from(stationery.querySelectorAll<HTMLElement>('.end-title-line'))
    const heartDivider = stationery.querySelector<HTMLElement>('.end-heart-divider')
    const message = stationery.querySelector<HTMLElement>('.end-message')
    const signatureDivider = stationery.querySelector<HTMLElement>('.end-signature-divider')
    const signatureParts = Array.from(stationery.querySelectorAll<HTMLElement>('.end-brand-signature > *'))
    const actions = screen.querySelector<HTMLElement>('.end-actions')

    play(stationery, {
      opacity: [0, 1],
      translateY: [16, 0],
      scale: [0.985, 1],
      filter: ['blur(6px)', 'blur(0px)'],
      duration: 820,
      ease: 'out(4)',
    })

    if (floralStage) {
      play(floralStage, {
        opacity: [0, 1],
        translateY: [12, 0],
        scale: [0.55, 1.06, 1],
        rotate: ['-8deg', '2deg', '0deg'],
        delay: 150,
        duration: 820,
        ease: 'out(5)',
      })
    }

    if (titleLines.length) {
      play(titleLines, {
        opacity: [0, 1],
        translateY: [18, 0],
        filter: ['blur(6px)', 'blur(0px)'],
        delay: stagger(145, { start: 330 }),
        duration: 760,
        ease: 'out(4)',
      })
    }

    if (heartDivider) {
      play(heartDivider, {
        opacity: [0, 1],
        scaleX: [0.28, 1],
        delay: 680,
        duration: 650,
        ease: 'out(4)',
      })
    }

    if (message) {
      play(message, {
        opacity: [0, 1],
        translateY: [11, 0],
        delay: 790,
        duration: 680,
        ease: 'out(4)',
      })
    }

    if (signatureDivider) {
      play(signatureDivider, {
        opacity: [0, 1],
        scaleX: [0.3, 1],
        delay: 940,
        duration: 620,
        ease: 'out(4)',
      })
    }

    if (signatureParts.length) {
      play(signatureParts, {
        opacity: [0, 1],
        translateY: [9, 0],
        delay: stagger(90, { start: 1030 }),
        duration: 590,
        ease: 'out(4)',
      })
    }

    if (actions) {
      play(actions, {
        opacity: [0, 1],
        translateY: [13, 0],
        scale: [0.96, 1],
        delay: 1390,
        duration: 680,
        ease: 'out(4)',
      })
    }
  }

  function destroy() {
    runningAnimations.forEach((animation) => animation.cancel())
    runningAnimations.clear()
  }

  return {
    animatePetalReveal,
    animateEnvelopeOpening,
    animateMemoryChapterEntrance,
    animateMemoryChange,
    animateBouquetChapterEntrance,
    animateReminderChapterEntrance,
    animateSenderChapterEntrance,
    animateKeepsakeChapterEntrance,
    animateFinalChapterEntrance,
    destroy,
  }
}
