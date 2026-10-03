import type { TownDirection } from './townActivities'
/** Drawing orientation is separate from travel; all eight directions have a pose. */
export function characterView(direction: string) {
  const valid:TownDirection[]=['down','up','left','right','up-left','up-right','down-left','down-right']
  const facing=valid.includes(direction as TownDirection)?direction as TownDirection:'down'
  return {
    facing,
    back:facing.startsWith('up'),
    side:facing==='left'||facing==='right',
    diagonal:facing.includes('-'),
    mirrored:facing==='left'||facing.endsWith('-left'),
    projection:facing.includes('-')?.84:facing==='left'||facing==='right'?.68:1,
  }
}
