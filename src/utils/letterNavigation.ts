export const LETTER_TOTAL_SCREENS = 10
export const LETTER_MESSAGE_SCREEN_INDEX = 3
export const LETTER_MEMORIES_SCREEN_INDEX = 4
export const LETTER_GIFT_SCREEN_INDEX = 5

export function getNextLetterScreen(current: number, total: number, hasMemories: boolean): number {
  if (current >= total - 1) return current
  return current === LETTER_MESSAGE_SCREEN_INDEX && !hasMemories
    ? Math.min(LETTER_GIFT_SCREEN_INDEX, total - 1)
    : current + 1
}

export function normalizeLetterScreen(screen: number, total: number, hasMemories: boolean): number {
  const bounded = Math.max(0, Math.min(screen, total - 1))
  return bounded === LETTER_MEMORIES_SCREEN_INDEX && !hasMemories
    ? Math.min(LETTER_GIFT_SCREEN_INDEX, total - 1)
    : bounded
}
