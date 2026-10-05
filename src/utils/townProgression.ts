import type { TownLocationId } from './townDemo'
export function townPlaceAvailable(id: TownLocationId, unlocked: boolean) {
  return unlocked || ['flowers', 'delivery', 'garden'].includes(id)
}
