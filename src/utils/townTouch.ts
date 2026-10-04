export type TouchDirection = { x: number; y: number }

/** Eight-way intent with a dead zone; diagonals retain the engine's normalized speed. */
export function joystickDirection(x: number, y: number, radius: number): TouchDirection {
  if (!Number.isFinite(x) || !Number.isFinite(y) || radius <= 0 || Math.hypot(x, y) < radius * .22) return { x: 0, y: 0 }
  const angle = Math.round(Math.atan2(y, x) / (Math.PI / 4)) * Math.PI / 4
  return { x: Math.round(Math.cos(angle)), y: Math.round(Math.sin(angle)) }
}
