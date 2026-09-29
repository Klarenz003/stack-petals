export function getNextLetterScreen(current: number, total: number, hasMemories: boolean): number {
  if (current >= total - 1) return current
  return current === 3 && !hasMemories ? Math.min(5, total - 1) : current + 1
}

export function normalizeLetterScreen(screen: number, total: number, hasMemories: boolean): number {
  const bounded = Math.max(0, Math.min(screen, total - 1))
  return bounded === 4 && !hasMemories ? Math.min(5, total - 1) : bounded
}
