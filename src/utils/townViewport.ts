export type TownViewport = { width: number; height: number; top: number; left: number }
export function townViewport(windowWidth: number, windowHeight: number, visible?: { width: number; height: number; offsetTop: number; offsetLeft: number } | null): TownViewport {
  const valid = (n: number) => Number.isFinite(n) && n > 0
  return {
    width: visible && valid(visible.width) ? visible.width : windowWidth,
    height: visible && valid(visible.height) ? visible.height : windowHeight,
    top: visible && Number.isFinite(visible.offsetTop) ? Math.max(0, visible.offsetTop) : 0,
    left: visible && Number.isFinite(visible.offsetLeft) ? Math.max(0, visible.offsetLeft) : 0,
  }
}
