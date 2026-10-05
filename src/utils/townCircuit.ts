export type CircuitTile = { ports: number[]; turn: number }
// Clockwise: north, east, south, west. The route snakes through a 3x3 board.
export const CIRCUIT_SOURCE = 3, CIRCUIT_LAMP = 5
export function makeCircuit(stop = 0): CircuitTile[] {
  const ports = [[1,2],[2,3],[0,2],[0,3],[0,2],[1,2],[1,3],[0,1],[0,3]]
  return ports.map((ports, index) => ({ ports, turn: (index + stop + 1) % 4 }))
}
export function circuitPorts(tile: CircuitTile) { return tile.ports.map(port => (port + tile.turn) % 4) }
export function circuitPower(tiles: CircuitTile[]) {
  const powered = new Set<number>()
  if (tiles.length !== 9 || !circuitPorts(tiles[CIRCUIT_SOURCE]!).includes(3)) return powered
  const queue = [CIRCUIT_SOURCE]
  while (queue.length) {
    const index = queue.shift()!
    if (powered.has(index)) continue
    powered.add(index)
    for (const port of circuitPorts(tiles[index]!)) {
      const row = Math.floor(index / 3), col = index % 3
      const nextRow = row + (port === 0 ? -1 : port === 2 ? 1 : 0)
      const nextCol = col + (port === 3 ? -1 : port === 1 ? 1 : 0)
      if (nextRow < 0 || nextRow > 2 || nextCol < 0 || nextCol > 2) continue
      const next = nextRow * 3 + nextCol
      if (circuitPorts(tiles[next]!).includes((port + 2) % 4)) queue.push(next)
    }
  }
  return powered
}
export function circuitConnected(tiles: CircuitTile[]) {
  return tiles.length === 9 && circuitPower(tiles).has(CIRCUIT_LAMP) && circuitPorts(tiles[CIRCUIT_LAMP]!).includes(1)
}
