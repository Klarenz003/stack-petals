import { uniqueImageSources } from './imagePreloader'

interface LetterCriticalAssetInput {
  bouquetImage?: string | null
  memories?: string[] | null
  anglePhotos?: string[] | null
}

const LETTER_STATIC_ASSETS = [
  '/images/envelope.png',
  '/images/page2_flower-trim.png',
  '/images/6petals.png',
  '/images/page4_circle.png',
  '/images/page4_envelope-clean.png',
  '/images/keepsake-letter.png',
  '/images/keepsake-music.png',
]

export function getLetterCriticalImageSources(input: LetterCriticalAssetInput) {
  return uniqueImageSources([
    ...LETTER_STATIC_ASSETS,
    input.bouquetImage,
    ...(input.memories ?? []),
  ])
}
