// src/composables/useCanvas.ts
import { onMounted, onBeforeUnmount } from 'vue'

interface CircuitNode { x: number; y: number }
interface CircuitLine {
  a: CircuitNode; b: CircuitNode; mid: CircuitNode
  pulse: boolean; pulseT: number; pulseSpeed: number
}
interface Circuit { nodes: CircuitNode[]; lines: CircuitLine[] }

interface Petal {
  x: number; y: number; size: number; rot: number; rotSpeed: number
  vx: number; vy: number; swing: number; swingSpeed: number
  color: string; opacity: number
}

const PETAL_COLORS = [
  'rgba(220,170,175,0.82)',
  'rgba(240,200,205,0.75)',
  'rgba(210,155,160,0.7)',
  'rgba(245,215,210,0.65)',
  'rgba(200,140,145,0.6)',
]

export function useCanvas() {
  let rafId: number | null = null
  let resizeHandler: (() => void) | null = null

  onMounted(() => {
    const cc = document.getElementById('circuit-canvas') as HTMLCanvasElement
    const pc = document.getElementById('petal-canvas') as HTMLCanvasElement
    if (!cc || !pc) return

    const W = () => cc.width
    const H = () => cc.height

    function buildCircuit(): Circuit {
      const w = W(), h = H(), grid = 48
      const nodes: CircuitNode[] = []
      const lines: CircuitLine[] = []
      for (let x = grid; x < w; x += grid)
        for (let y = grid; y < h; y += grid)
          if (Math.random() < 0.35)
            nodes.push({ x: x + (Math.random() - 0.5) * 12, y: y + (Math.random() - 0.5) * 12 })
      nodes.forEach((a, i) => nodes.forEach((b, j) => {
        if (j <= i) return
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < grid * 2.2 && Math.random() < 0.45) {
          const horiz = Math.random() < 0.5
          const mid = horiz ? { x: b.x, y: a.y } : { x: a.x, y: b.y }
          lines.push({ a, b, mid, pulse: Math.random() < 0.3, pulseT: Math.random(), pulseSpeed: 0.004 + Math.random() * 0.006 })
        }
      }))
      return { nodes, lines }
    }

    function drawCircuit(ctx: CanvasRenderingContext2D, circuit: Circuit) {
      ctx.clearRect(0, 0, W(), H())
      ctx.lineWidth = 0.8
      circuit.lines.forEach(l => {
        ctx.strokeStyle = 'rgba(190,140,120,0.18)'
        ctx.beginPath(); ctx.moveTo(l.a.x, l.a.y); ctx.lineTo(l.mid.x, l.mid.y); ctx.lineTo(l.b.x, l.b.y); ctx.stroke()
        if (l.pulse) {
          const t = l.pulseT
          const pts = [l.a, l.mid, l.b]
          const seg = t * 2
          let px: number, py: number
          if (seg < 1) { px = pts[0].x + (pts[1].x - pts[0].x) * seg; py = pts[0].y + (pts[1].y - pts[0].y) * seg }
          else { const s = seg - 1; px = pts[1].x + (pts[2].x - pts[1].x) * s; py = pts[1].y + (pts[2].y - pts[1].y) * s }
          ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(220,170,100,0.7)'; ctx.fill()
        }
      })
      circuit.nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n.x, n.y, 2.2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(190,140,120,0.32)'; ctx.fill()
      })
    }

    const makePetal = (fromTop: boolean): Petal => ({
      x: Math.random() * W(),
      y: fromTop ? -20 - Math.random() * 80 : Math.random() * H(),
      size: 6 + Math.random() * 8,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 0.4 + Math.random() * 0.7,
      swing: Math.random() * Math.PI * 2,
      swingSpeed: 0.015 + Math.random() * 0.02,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      opacity: 0.5 + Math.random() * 0.5,
    })

    let circuit = buildCircuit()
    const petals: Petal[] = Array.from({ length: 28 }, () => makePetal(false))

    resizeHandler = () => {
      cc.width = pc.width = window.innerWidth
      cc.height = pc.height = window.innerHeight
      circuit = buildCircuit()
    }
    window.addEventListener('resize', resizeHandler)
    resizeHandler()

    const loop = () => {
      circuit.lines.forEach(l => {
        if (l.pulse) { l.pulseT += l.pulseSpeed; if (l.pulseT > 1) l.pulseT = 0 }
      })
      drawCircuit(cc.getContext('2d')!, circuit)

      const pctx = pc.getContext('2d')!
      pctx.clearRect(0, 0, W(), H())
      petals.forEach(p => {
        p.swing += p.swingSpeed
        p.x += p.vx + Math.sin(p.swing) * 0.5
        p.y += p.vy
        p.rot += p.rotSpeed
        if (p.y > H() + 20) Object.assign(p, makePetal(true))
        pctx.save()
        pctx.translate(p.x, p.y)
        pctx.rotate(p.rot)
        pctx.globalAlpha = p.opacity
        pctx.fillStyle = p.color
        pctx.beginPath()
        pctx.ellipse(0, 0, p.size * 0.42, p.size, 0, 0, Math.PI * 2)
        pctx.fill()
        pctx.restore()
      })

      rafId = requestAnimationFrame(loop)
    }

    loop()
  })

  onBeforeUnmount(() => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  })
}
