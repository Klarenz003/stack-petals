import { distance, type Point } from './townDemo'
export type TownDirection = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right'
export type TownAction = 'idle' | 'laptop' | 'bouquet' | 'letter' | 'watering'
export type ActivityId = 'lights' | 'blooms' | 'notes'
export const TOWN_ACTIVITIES = {
  lights: { title: 'Light up the plaza', detail: 'Carry your laptop to three little light nodes and repair their code.', action: 'laptop' as TownAction, reward: 120, targets: [{x:320,y:300},{x:650,y:305},{x:770,y:550}] },
  blooms: { title: 'A morning in bloom', detail: 'Bring a watering can to three thirsty flower beds.', action: 'watering' as TownAction, reward: 90, targets: [{x:313,y:265},{x:614,y:460},{x:95,y:300}] },
  notes: { title: 'A note to keep', detail: 'Carry your handwritten postcard to Luna beside the pond.', action: 'letter' as TownAction, reward: 80, targets: [{x:853,y:337}] },
}
export function travelDirection(before: Point, after: Point, previous: TownDirection): TownDirection {
  const dx=after.x-before.x, dy=after.y-before.y
  if(Math.hypot(dx,dy)<.05) return previous
  const x=Math.abs(dx), y=Math.abs(dy)
  if(x>.4142*y && y>.4142*x) return `${dy<0?'up':'down'}-${dx<0?'left':'right'}`
  return x>y ? dx<0?'left':'right' : dy<0?'up':'down'
}
export function activityTarget(id: ActivityId, step: number): Point | null {
  return TOWN_ACTIVITIES[id].targets[step] || null
}
export function canWork(id: ActivityId, step: number, player: Point) {
  const target=activityTarget(id,step)
  return !!target && distance(target,player)<42
}
