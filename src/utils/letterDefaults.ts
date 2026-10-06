export const DEFAULT_PETAL_MESSAGES = [
  'Your laugh',
  'Your kindness',
  'Being you',
  'Your heart',
  'Your smile',
  'The way you care',
] as const

export const DEFAULT_GIFT_NOTE_BODIES = [
  'Your laughter makes the little moments feel brighter.',
  'Your kindness means more than you may ever realize.',
  'You make a difference simply by being yourself.',
  'The warmth of your heart makes people feel at home.',
  "Your smile has a way of brightening someone's day.",
  'The care you give leaves a lasting mark on others.',
] as const

export function getGiftNoteMessages(messages: unknown): string[] {
  const values = Array.isArray(messages) ? messages : []
  return DEFAULT_GIFT_NOTE_BODIES.map((fallback, index) =>
    typeof values[index] === 'string' ? values[index].trim().slice(0, 60) || fallback : fallback)
}

export function getPetalMessages(messages: unknown): string[] {
  if (!Array.isArray(messages)) return [...DEFAULT_PETAL_MESSAGES]
  const normalized = messages.slice(0, 6).map(value => String(value || '').trim())
  return normalized.some(Boolean)
    ? Array.from({ length: 6 }, (_, index) => normalized[index] || DEFAULT_PETAL_MESSAGES[index])
    : [...DEFAULT_PETAL_MESSAGES]
}
