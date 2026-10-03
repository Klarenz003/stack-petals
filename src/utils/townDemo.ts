export type Point = { x: number; y: number }
export type TownLocationId = 'flowers' | 'studio' | 'delivery' | 'arcade' | 'gifts' | 'garden'
export const WORLD = { width: 960, height: 600, cell: 24 }
export const LOCATIONS: { id: TownLocationId; name: string; description: string; x: number; y: number; color: string }[] = [
  { id: 'flowers', name: 'Flower shop', description: 'Craft a little happiness.', x: 190, y: 115, color: '#d989a1' },
  { id: 'studio', name: 'Developer studio', description: 'A little code. A lot of heart.', x: 480, y: 106, color: '#8394b0' },
  { id: 'delivery', name: 'Delivery station', description: 'Good feelings, on their way.', x: 770, y: 115, color: '#c69a6f' },
  { id: 'arcade', name: 'Bloom arcade', description: 'Catch petals. Chase a high score.', x: 190, y: 410, color: '#a48eba' },
  { id: 'gifts', name: 'Gift room', description: 'Find the words that feel like you.', x: 480, y: 410, color: '#ce8295' },
  { id: 'garden', name: 'Memory garden', description: 'Every little win belongs here.', x: 770, y: 410, color: '#8fa878' },
]
export const doorFor = (location: typeof LOCATIONS[number]): Point => ({ x: location.x, y: location.y + 123 })
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
export function walkable(point: Point) {
  if (point.x < 24 || point.x > WORLD.width - 24 || point.y < 30 || point.y > WORLD.height - 24) return false
  return !LOCATIONS.some(location => point.x > location.x - 85 && point.x < location.x + 85
    && point.y > location.y - 20 && point.y < location.y + 100)
}
export function movePlayer(point: Point, dx: number, dy: number): Point {
  const next = { ...point }
  if (walkable({ x: next.x + dx, y: next.y })) next.x += dx
  if (walkable({ x: next.x, y: next.y + dy })) next.y += dy
  return next
}
/** Eight-way shortest paths. Diagonal edges cannot cut blocked corners. */
export function findTownPath(start: Point, destination: Point): Point[] {
  const cells: Point[] = []
  for (let y = 36; y < WORLD.height - 24; y += WORLD.cell) {
    for (let x = 36; x < WORLD.width - 24; x += WORLD.cell) if (walkable({ x, y })) cells.push({ x, y })
  }
  const closest = (point: Point) => cells.reduce((best, cell) => distance(cell, point) < distance(best, point) ? cell : best, cells[0]!)
  const from = closest(start), to = closest(destination)
  const key = (point: Point) => `${point.x},${point.y}`
  const available = new Map(cells.map(cell => [key(cell), cell]))
  const queue = [from], parents = new Map<string, string | null>([[key(from), null]])
  const costs=new Map<string,number>([[key(from),0]]), settled=new Set<string>()
  while(queue.length) {
    queue.sort((a,b)=>costs.get(key(a))!-costs.get(key(b))!)
    const current = queue.shift()!
    if(settled.has(key(current)))continue
    settled.add(key(current))
    if (key(current) === key(to)) break
    for (const [dx, dy] of [[24, 0], [-24, 0], [0, 24], [0, -24], [24,24],[-24,24],[24,-24],[-24,-24]]) {
      const nextKey = key({ x: current.x + dx!, y: current.y + dy! })
      if(dx && dy && (!available.has(key({x:current.x+dx,y:current.y})) || !available.has(key({x:current.x,y:current.y+dy}))))continue
      const cost=costs.get(key(current))!+Math.hypot(dx!,dy!)
      if (available.has(nextKey) && cost<(costs.get(nextKey)??Infinity)) { costs.set(nextKey,cost);parents.set(nextKey, key(current)); queue.push(available.get(nextKey)!) }
    }
  }
  if (!parents.has(key(to))) return []
  const path: Point[] = []
  let cursor: string | null = key(to)
  while (cursor !== null) { path.unshift(available.get(cursor)!); cursor = parents.get(cursor) ?? null }
  return path
}
export const CHALLENGES = [
  { prompt: 'Which line makes a button respond to a click in Vue?', choices: ['@click="sendGift"', ':hover="sendGift"', '#click="sendGift"'], answer: 0, note: '@click listens for a click event. A little code makes a connection.' },
  { prompt: 'What does an accessible image need?', choices: ['A larger file', 'Meaningful alt text', 'A hidden title'], answer: 1, note: 'Alt text helps people understand an image without seeing it.' },
  { prompt: 'Which CSS rule gives pixel art crisp edges?', choices: ['filter: blur(2px)', 'opacity: 0.5', 'image-rendering: pixelated'], answer: 2, note: 'Pixelated rendering keeps the little details intentionally sharp.' },
  { prompt: 'What keeps a private activation code out of a public link?', choices: ['A separate public token', 'A different font', 'A longer URL'], answer: 0, note: 'Keep public identifiers and private activation keys separate.' },
]
