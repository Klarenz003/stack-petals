export const REVEAL_RESET_DELAY_MS = 12_000

type PointerPosition = {
  x: number
  y: number
}

type Size = {
  width: number
  height: number
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

export function clampToDocument(
  position: PointerPosition,
  item: Size,
  documentSize: Size,
  inset = 8,
) {
  const maxX = Math.max(inset, documentSize.width - item.width - inset)
  const maxY = Math.max(inset, documentSize.height - item.height - inset)

  return {
    x: Math.min(Math.max(position.x, inset), maxX),
    y: Math.min(Math.max(position.y, inset), maxY),
  }
}

export function isTapGesture(start: PointerPosition, end: PointerPosition, threshold = 8) {
  return Math.hypot(end.x - start.x, end.y - start.y) <= threshold
}
