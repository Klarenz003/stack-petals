import type { TownAction } from './townActivities'
export type AtlasBox = [number, number, number, number]
export type SpriteFrame = { box: AtlasBox; flip?: boolean }
export type CharacterDirection = 'down' | 'left' | 'right' | 'up'
// The illustration includes extra intermediate poses between its labelled columns.
// Mirror the verified left step rather than sampling a neighbouring character.
// Bounds measured from the transparent atlas, with one clear pixel around each pose.
const boyIdle: Record<CharacterDirection, AtlasBox> = { down:[105,345,66,104],left:[200,346,65,103],right:[294,346,64,105],up:[390,346,68,103] }
const girlIdle: Record<CharacterDirection, AtlasBox> = { down:[567,347,74,99],left:[659,348,67,102],right:[744,348,67,101],up:[823,347,76,102] }
const boyWalk: Record<CharacterDirection, AtlasBox> = { down:[101,454,62,95],left:[180,454,62,95],right:[180,454,62,95],up:[399,455,62,94] }
const girlWalk: Record<CharacterDirection, AtlasBox> = { down:[564,449,75,104],left:[643,456,63,96],right:[643,456,63,96],up:[828,456,74,97] }
const boyRun: Record<CharacterDirection, AtlasBox> = { down:[102,555,62,91],left:[180,556,62,89],right:[180,556,62,89],up:[398,555,61,91] }
const girlRun: Record<CharacterDirection, AtlasBox> = { down:[562,557,78,91],left:[642,561,64,85],right:[642,561,64,85],up:[834,561,70,86] }
const holdingFrames: Record<string, Record<CharacterDirection, AtlasBox>> = {
  'boy-laptop': {down:[102,647,65,101],left:[194,648,66,99],right:[294,648,69,98],up:[391,649,65,99]},
  'boy-bouquet': {down:[101,748,68,106],left:[189,748,73,107],right:[294,747,72,107],up:[389,749,71,105]},
  'girl-bouquet': {down:[563,652,76,95],left:[655,650,71,97],right:[745,650,71,97],up:[825,651,77,96]},
  'girl-letter': {down:[563,746,76,107],left:[650,748,76,106],right:[743,747,73,107],up:[825,749,77,104]},
}
export function characterFrame(sprite: string, moving: boolean, running: boolean, step: number, action: TownAction = 'idle'): SpriteFrame | null {
  const [person, ...parts] = sprite.split('-')
  const requested = parts.join('-')
  // Diagonal travel uses the verified side profile. The atlas has four angles,
  // not eight; never sample unrelated artwork as a pretend diagonal frame.
  const direction = parts.length === 2 && ['up','down'].includes(parts[0]!) && ['left','right'].includes(parts[1]!) ? parts[1] : requested
  if ((person !== 'boy' && person !== 'girl') || !['down','left','right','up'].includes(direction || '')) return null
  const facing = direction as CharacterDirection
  if(!moving && holdingFrames[`${person}-${action}`]) return {box:holdingFrames[`${person}-${action}`]![facing]}
  const idle = person === 'boy' ? boyIdle : girlIdle
  if (!moving || step % 2 === 0) return { box: idle[facing] }
  const frames = running ? person === 'boy' ? boyRun : girlRun : person === 'boy' ? boyWalk : girlWalk
  return { box: frames[facing], flip: facing === 'right' }
}
