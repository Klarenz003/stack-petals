import { distance, walkable, type Point } from './townDemo'
export type PetDirection = 'up' | 'down' | 'left' | 'right'
// Alpha-tight crops aligned at the paws; right mirrors the clean left profile.
export const DOG_POSES: Record<PetDirection, [number, number, number, number]> = {
  down: [914, 791, 55, 67], left: [1033, 800, 73, 58],
  right: [1033, 800, 73, 58], up: [1106, 787, 46, 70],
}
export const CAT_POSES: Record<PetDirection, [number, number, number, number]> = {
  down: [915, 720, 49, 60], left: [1036, 719, 56, 61],
  right: [1036, 719, 56, 61], up: [1101, 719, 40, 63],
}
export function petMovement(before: Point, after: Point, facing: PetDirection) {
  const dx = after.x - before.x, dy = after.y - before.y
  const walking = Math.hypot(dx, dy) > .05
  const direction: PetDirection = !walking ? facing : Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up'
  return { walking, direction }
}
/** Keep resting pets visibly beside, not behind, their owner. Prefer the existing side. */
export function petRestSpot(owner: Point, pet: Point): Point {
  const side = pet.x < owner.x ? -1 : 1
  const candidates = [10, 24, 40, 0].flatMap(dy => [side, -side].map(sign => ({ x: owner.x + sign * 56, y: owner.y + dy })))
  return candidates.find(point => walkable(point) && walkable({ x: point.x - 16, y: point.y }) && walkable({ x: point.x + 16, y: point.y }))
    || candidates.filter(walkable).sort((a,b) => distance(a, pet) - distance(b, pet))[0]
    || { ...pet }
}
