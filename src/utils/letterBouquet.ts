import type { CartItem } from '@/types'
import type { LetterRecord } from '@/types/letter'

export function bouquetKey(item: Pick<CartItem, 'id' | 'name'>): string {
  return item.id || item.name
}

export function selectLetterBouquet(items: CartItem[], selectedKey: string): CartItem | undefined {
  const eligible = items.filter(item => item.has360Viewer)
  return eligible.find(item => bouquetKey(item) === selectedKey) || eligible[0] || items[0]
}

export function getLetterBouquetAssets(letter: Partial<LetterRecord>) {
  const frames = (letter.angle_photos || []).filter(src => typeof src === 'string' && src.trim()).map(normalizeBouquetSrc)
  const standalone = letter.order_id === null || Boolean(letter.letter_v2_qr_id)
  return {
    image: letter.bouquet_image_url?.trim() ? normalizeBouquetSrc(letter.bouquet_image_url) : '',
    frames,
    // Actual admin uploads determine standalone availability, not the QR's
    // original feature flag. Checkout letters retain their capability gate.
    has360View: (standalone || letter.has_360_view !== false) && frames.length >= 2,
  }
}

function normalizeBouquetSrc(src: string): string {
  return /^(https?:|data:|blob:|\/)/.test(src) ? src : `/${src}`
}
