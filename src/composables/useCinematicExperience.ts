import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// The animation engines remain JavaScript DOM controllers; this composable owns their lifecycle.
// @ts-expect-error no public TypeScript declarations for the cinematic engine
import { initExperience } from '@/components/cinematic-letter/engine/initExperience.js'
// @ts-expect-error no public TypeScript declarations for the cinematic engine
import { initBlooms } from '@/components/cinematic-letter/engine/initBlooms.js'

export function useCinematicExperience() {
  const root = ref<HTMLElement | null>(null)
  let destroyExperience: (() => void) | null = null
  let destroyBlooms: (() => void) | null = null

  onMounted(async () => {
    await nextTick()
    if (!root.value) return
    destroyExperience = initExperience(root.value)
    destroyBlooms = initBlooms(root.value)
  })

  onBeforeUnmount(() => {
    destroyExperience?.()
    destroyExperience = null
    destroyBlooms?.()
    destroyBlooms = null
    if (!root.value) return
    gsap.killTweensOf(root.value.querySelectorAll('*'))
    ScrollTrigger.getAll().forEach(trigger => {
      if (root.value?.contains(trigger.trigger as Node)) trigger.kill()
    })
    document.body.dataset.occasion = ''
    delete document.body.dataset.occasion
  })

  return root
}
