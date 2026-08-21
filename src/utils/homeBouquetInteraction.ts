export const REVEAL_RESET_DELAY_MS = 12_000

type PointerPosition = {
  x: number
  y: number
}

export function viewportToDocumentPosition(
  position: PointerPosition,
  scroll: PointerPosition,
) {
  return {
    x: position.x + scroll.x,
    y: position.y + scroll.y,
  }
}

export function isTapGesture(start: PointerPosition, end: PointerPosition, threshold = 8) {
  return Math.hypot(end.x - start.x, end.y - start.y) <= threshold
}
