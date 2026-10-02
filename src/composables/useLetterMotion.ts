import { gsap } from 'gsap'

type MotionTarget = Element | Element[] | NodeListOf<Element> | null

interface LetterMotionOptions {
  getScreen: () => number
  isReverse: () => boolean
}

interface SceneSelectors {
  intro: string
  title?: string
  hero: string
  detail: string
  action: string
}

const SELECTORS: Record<number, SceneSelectors> = {
  0: {
    intro: '.welcome-top-divider, .recipient-keepsake, .welcome-heart-line',
    title: '.letter-headline',
    hero: '.letter-invitation-card',
    detail: '.blooming-flower, .letter-divider, .letter-sub',
    action: '.page1-magic-action',
  },
  1: {
    intro: '.page2-logo-divider',
    hero: '.page2-flower-wrap',
    title: '.page2-title',
    detail: '.page2-divider, .page2-sub',
    action: '.page2-magic-action',
  },
  2: {
    intro: '.page3-logo-divider',
    title: '.page3-title, .page3-sub',
    hero: '.petals-flower',
    detail: '.petal-zone',
    action: '.petal-message-slot, .page3-action-slot',
  },
  3: {
    intro: '.page4-envelope-stage',
    title: '.page4-title',
    hero: '.page4-circle, .page4-envelope',
    detail: '.page4-divider, .letter-reveal-wrap > .letter-sub',
    action: '.page4-open-magic-action',
  },
  4: {
    intro: '.letter-title, .letter-divider',
    hero: '.memory-frame',
    detail: '.memory-dots, .memory-caption, .no-memories',
    action: '.page5-magic-action',
  },
  5: {
    intro: '.letter-title, .bouquet-intro, .letter-divider, .bouquet-tag',
    hero: '.bouquet-stage',
    detail: '.bouquet-plaque, .bouquet-detail-row, .btn-360, .bouquet-note',
    action: '.page6-magic-action',
  },
  6: {
    intro: '.quote-flower-wrap, .quote-kicker, .quote-divider',
    title: '.quote-line',
    hero: '.quote-card',
    detail: '',
    action: '.page7-magic-action',
  },
  7: {
    intro: '.sender-kicker',
    title: '.sender-name',
    hero: '.sender-seal',
    detail: '.sender-divider, .sender-note, .sender-flourish',
    action: '.page8-magic-action',
  },
  8: {
    intro: '.keepsake-heading > *',
    title: '',
    hero: '.keepsake-menu',
    detail: '.keepsake-tile',
    action: '.page9-magic-action',
  },
  9: {
    intro: '.end-floral-mark',
    title: '.end-title',
    hero: '.end-stationery',
    detail: '.end-heart-divider, .end-message, .end-signature-divider, .end-brand-signature',
    action: '.end-actions > *',
  },
}

function elements(root: HTMLElement, selector: string): HTMLElement[] {
  return selector ? Array.from(root.querySelectorAll<HTMLElement>(selector)) : []
}

function hasTargets(target: MotionTarget): boolean {
  if (!target) return false
  if (target instanceof Element) return true
  return target.length > 0
}

export function useLetterMotion(options: LetterMotionOptions) {
  let timeline: gsap.core.Timeline | null = null
  let animatedElements: HTMLElement[] = []
  let animationRoot: HTMLElement | null = null

  function clearInlineMotion() {
    animationRoot?.classList.remove('chapter-is-animating')
    animationRoot = null
    if (!animatedElements.length) return
    gsap.set(animatedElements, {
      clearProps: 'transform,opacity,visibility,filter,clipPath,willChange',
    })
    animatedElements = []
  }

  function remember(...groups: HTMLElement[][]) {
    animatedElements = Array.from(new Set(groups.flat()))
    if (animatedElements.length) gsap.set(animatedElements, { willChange: 'transform,opacity' })
  }

  function fromTo(
    tl: gsap.core.Timeline,
    target: MotionTarget,
    from: gsap.TweenVars,
    to: gsap.TweenVars,
    position: gsap.Position = '>',
  ) {
    if (hasTargets(target)) tl.fromTo(target as gsap.TweenTarget, from, to, position)
  }

  function addPetalTrail(tl: gsap.core.Timeline, root: HTMLElement, direction: number, mobile: boolean) {
    const petals = elements(root, '.chapter-petal-trail span')
    if (!petals.length || mobile) return

    fromTo(
      tl,
      petals,
      {
        autoAlpha: 0,
        x: (index) => direction * (-38 - index * 13),
        y: (index) => -12 + index * 8,
        rotation: (index) => direction * (-24 + index * 15),
        scale: 0.72,
      },
      {
        autoAlpha: 0.46,
        x: (index) => direction * (34 + index * 12),
        y: (index) => 14 + index * 13,
        rotation: (index) => direction * (36 + index * 19),
        scale: 1,
        duration: 0.92,
        stagger: 0.045,
        ease: 'power2.out',
      },
      0,
    )
    tl.to(petals, { autoAlpha: 0, duration: 0.25, stagger: 0.025 }, 0.68)
  }

  function animateChapter(element: Element) {
    timeline?.kill()
    clearInlineMotion()

    const root = element as HTMLElement
    const screen = options.getScreen()
    const scene = SELECTORS[screen] ?? SELECTORS[0]
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobile = window.matchMedia('(max-width: 680px)').matches
    const direction = options.isReverse() ? -1 : 1

    const intro = elements(root, scene.intro)
    const title = elements(root, scene.title ?? '')
    const hero = elements(root, scene.hero)
    const detail = elements(root, scene.detail)
    const action = elements(root, scene.action)
    const trails = elements(root, '.chapter-petal-trail span')
    remember(intro, title, hero, detail, action, trails)

    if (reduced) {
      gsap.set(animatedElements, { autoAlpha: 1, clearProps: 'all' })
      animatedElements = []
      return
    }

    const travel = mobile ? 10 : 18
    animationRoot = root
    root.classList.add('chapter-is-animating')
    timeline = gsap.timeline({
      defaults: { overwrite: 'auto', ease: 'power3.out' },
      onComplete: clearInlineMotion,
      onInterrupt: clearInlineMotion,
    })
    const tl = timeline

    addPetalTrail(tl, root, direction, mobile)

    switch (screen) {
      case 0:
        fromTo(tl, intro, { autoAlpha: 0, y: -travel }, { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.08 }, 0.04)
        fromTo(tl, title, { autoAlpha: 0, y: travel, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.78 }, 0.16)
        fromTo(tl, hero, { autoAlpha: 0, y: travel, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out' }, 0.3)
        fromTo(tl, detail, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.06 }, 0.55)
        fromTo(tl, action, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.58 }, 0.72)
        break

      case 1:
        fromTo(tl, intro, { autoAlpha: 0, scaleX: 0.4 }, { autoAlpha: 1, scaleX: 1, duration: 0.55 }, 0.05)
        fromTo(tl, hero, { autoAlpha: 0, scale: 0.78, rotation: direction * -6 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.05, ease: 'back.out(1.1)' }, 0.12)
        fromTo(tl, title, { autoAlpha: 0, y: travel }, { autoAlpha: 1, y: 0, duration: 0.75 }, 0.42)
        fromTo(tl, detail, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.46, stagger: 0.09 }, 0.65)
        fromTo(tl, action, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.55 }, 0.82)
        break

      case 2:
        fromTo(tl, intro, { autoAlpha: 0, scaleX: 0.3 }, { autoAlpha: 1, scaleX: 1, duration: 0.48 }, 0.05)
        fromTo(tl, title, { autoAlpha: 0, y: -travel }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.09 }, 0.12)
        fromTo(tl, hero, { autoAlpha: 0, scale: 0.7, rotation: direction * -9 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.92, ease: 'back.out(1.25)' }, 0.3)
        fromTo(tl, detail, { autoAlpha: 0, scale: 0.35 }, { autoAlpha: 1, scale: 1, duration: 0.48, stagger: { each: 0.06, from: 'random' }, ease: 'back.out(1.8)' }, 0.56)
        fromTo(tl, action, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 }, 0.72)
        break

      case 3:
        fromTo(tl, intro, { autoAlpha: 0, y: -travel, scale: 0.82 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.2)' }, 0.08)
        fromTo(tl, elements(root, '.page4-circle'), { autoAlpha: 0, scale: 0.68, rotation: -12 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.05 }, 0.12)
        fromTo(tl, elements(root, '.page4-envelope'), { autoAlpha: 0, y: -18, rotationZ: direction * 4, scale: 0.9 }, { autoAlpha: 1, y: 0, rotationZ: 0, scale: 1, duration: 0.82, ease: 'back.out(1.3)' }, 0.3)
        fromTo(tl, title, { autoAlpha: 0, y: travel }, { autoAlpha: 1, y: 0, duration: 0.68 }, 0.46)
        fromTo(tl, detail, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.08 }, 0.62)
        fromTo(tl, action, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.52, ease: 'back.out(1.5)' }, 0.78)
        break

      case 4:
        fromTo(tl, intro, { autoAlpha: 0, y: -travel }, { autoAlpha: 1, y: 0, duration: 0.52, stagger: 0.08 }, 0.05)
        fromTo(tl, hero, { autoAlpha: 0, y: travel * 1.5, rotation: direction * 2.8, scale: 0.9 }, { autoAlpha: 1, y: 0, rotation: 0, scale: 1, duration: 0.9, ease: 'back.out(1.18)' }, 0.2)
        fromTo(tl, detail, { autoAlpha: 0, y: 9 }, { autoAlpha: 1, y: 0, duration: 0.46, stagger: 0.09 }, 0.55)
        fromTo(tl, action, { autoAlpha: 0, y: 10, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.58, ease: 'back.out(1.5)' }, 0.72)
        break

      case 5:
        fromTo(tl, intro, { autoAlpha: 0, y: -travel }, { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.055 }, 0.04)
        fromTo(tl, hero, { autoAlpha: 0, y: travel * 1.4, scale: 0.78, rotation: direction * -1.5 }, { autoAlpha: 1, y: 0, scale: 1, rotation: 0, duration: 1.08, ease: 'back.out(1.2)' }, 0.2)
        fromTo(tl, elements(root, '.bouquet-halo'), { autoAlpha: 0, scale: 0.65 }, { autoAlpha: 1, scale: 1, duration: 1.2 }, 0.34)
        fromTo(tl, elements(root, '.bouquet-main-photo'), { autoAlpha: 0, scale: 0.92, filter: 'saturate(.7)' }, { autoAlpha: 1, scale: 1, filter: 'saturate(1)', duration: 0.82 }, 0.48)
        fromTo(tl, detail, { autoAlpha: 0, y: 9 }, { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.07 }, 0.66)
        fromTo(tl, action, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.84)
        break

      case 6:
        fromTo(tl, intro, { autoAlpha: 0, y: -travel, scale: 0.88 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.62, stagger: 0.09 }, 0.08)
        fromTo(tl, hero, { autoAlpha: 0, scaleY: 0.72, transformOrigin: '50% 0%' }, { autoAlpha: 1, scaleY: 1, duration: 0.75, ease: 'power3.out' }, 0.32)
        fromTo(tl, title, { autoAlpha: 0, y: travel, filter: mobile ? 'none' : 'blur(4px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.12 }, 0.48)
        fromTo(tl, action, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.55, ease: 'back.out(1.45)' }, 0.94)
        break

      case 7:
        fromTo(tl, hero, { autoAlpha: 0, scale: 0.45, rotation: direction * -12 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.92, ease: 'back.out(1.5)' }, 0.1)
        fromTo(tl, intro, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.48 }, 0.25)
        fromTo(tl, title, { autoAlpha: 0, y: travel }, { autoAlpha: 1, y: 0, duration: 0.66 }, 0.4)
        fromTo(tl, detail, { autoAlpha: 0, y: 9 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.08 }, 0.56)
        fromTo(tl, action, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.52, ease: 'back.out(1.5)' }, 0.78)
        break

      case 8:
        fromTo(tl, intro, { autoAlpha: 0, y: -travel }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 }, 0.04)
        fromTo(tl, hero, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.5 }, 0.22)
        fromTo(tl, detail, { autoAlpha: 0, y: travel, rotation: (index) => (index % 2 ? 1.2 : -1.2) }, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.58, stagger: 0.095, ease: 'back.out(1.16)' }, 0.3)
        fromTo(tl, action, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.78)
        break

      case 9:
        fromTo(tl, hero, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.72 }, 0.05)
        fromTo(tl, intro, { autoAlpha: 0, scale: 0.55, rotation: -10 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.78, ease: 'back.out(1.4)' }, 0.16)
        fromTo(tl, title, { autoAlpha: 0, y: travel }, { autoAlpha: 1, y: 0, duration: 0.72 }, 0.28)
        fromTo(tl, detail, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.46, stagger: 0.07 }, 0.48)
        fromTo(tl, action, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 }, 0.75)
        break
    }
  }

  function destroy() {
    timeline?.kill()
    timeline = null
    clearInlineMotion()
  }

  return { animateChapter, destroy }
}
