import { getLetterCapabilities } from './letterCapabilities'
import { getPetalMessages } from './letterDefaults'
import type { LetterRecord } from '@/types/letter'
import { getLetterBouquetAssets } from './letterBouquet'

// The cinematic engine consumes a mutable JavaScript config object.
// @ts-expect-error no public TypeScript declarations for the cinematic config
import { GIFT } from '@/components/cinematic-letter/config/gift.js'

const closings: Record<string, string> = {
  romance: 'You are loved, today and always. Keep this little reminder close.',
  family: 'Wherever life leads, you will always have a home here.',
  birthday: 'May the year ahead bloom with joy. Happy birthday!',
  sympathy: 'You are held in care. Take each day gently.',
  friendship: 'Life is brighter with you in it. I am grateful for you.',
  graduation: 'This is only the beginning. Keep growing into your brightest future.',
}

export function configureCinematicLetter(
  letter: Partial<LetterRecord>,
  options: { preview?: boolean; showPicker?: boolean } = {},
) {
  const theme = letter.letter_theme || 'romance'
  const capabilities = getLetterCapabilities(letter)
  const bouquet = getLetterBouquetAssets(letter)
  const messageParts = String(letter.message || '').split(/\n\s*\n/).filter(Boolean)
  const memories = (letter.memories || []).map((item: any, index: number) => {
    const value = typeof item === 'string' ? item : item?.src || item?.url || item?.image
    return value ? { src: value, alt: `Memory ${index + 1}`, caption: item?.caption || `Memory ${index + 1}` } : null
  }).filter(Boolean)

  Object.assign(GIFT, {
    occasion: theme,
    showOccasionPicker: Boolean(options.showPicker) && !options.preview,
    previewMode: Boolean(options.preview),
    useCustomerContent: true,
    has360Viewer: bouquet.has360View,
    hasPhotoUpload: capabilities.hasPhotoUpload,
    recipient: letter.recipient || 'you',
    sender: letter.sender || 'someone who cares',
    paragraphs: [
      messageParts[0] || letter.message || 'A personal note, written especially for you.',
      messageParts[1] || '',
      messageParts.slice(2).join('\n\n') || '',
    ],
    reasons: getPetalMessages(letter.petal_messages),
    petalLabels: Array.isArray(letter.petal_labels)
      ? letter.petal_labels.map(value => String(value || '').trim()).slice(0, 6)
      : (Array.isArray((letter.backgrounds as any)?.petal_labels)
        ? (letter.backgrounds as any).petal_labels.map((value: unknown) => String(value || '').trim()).slice(0, 6)
        : []),
    photoMemories: memories,
    petalArtworks: letter.petal_artworks || letter.backgrounds?.petal_artworks || [],
    lastNote: closings[theme] || closings.romance,
    product360: bouquet.has360View ? { mode: 'urls', frames: bouquet.frames, frameCount: bouquet.frames.length } : { mode: 'none', frameCount: 0 },
  })

  return {
    theme,
    has360Viewer: bouquet.has360View,
    hasPhotoUpload: capabilities.hasPhotoUpload,
  }
}
