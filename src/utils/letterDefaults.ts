export const DEFAULT_PETAL_MESSAGES = [
  'Your laugh',
  'Your kindness',
  'Being you',
  'Your heart',
  'Your smile',
  'The way you care',
] as const

export function getPetalMessages(messages: unknown): string[] {
  if (!Array.isArray(messages)) return [...DEFAULT_PETAL_MESSAGES]
  const normalized = messages.slice(0, 6).map(value => String(value || '').trim())
  return normalized.some(Boolean)
    ? Array.from({ length: 6 }, (_, index) => normalized[index] || DEFAULT_PETAL_MESSAGES[index])
    : [...DEFAULT_PETAL_MESSAGES]
}
