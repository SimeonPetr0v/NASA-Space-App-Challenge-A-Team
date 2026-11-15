import { useEffect, useRef } from 'react'

/*
  Live pulse trace for the measuring screen. Drawn on a canvas every screen
  frame and positioned by time, so it scrolls smoothly even when the camera
  only delivers 15 frames a second. The camera loop pushes raw samples into
  `feed`; a real-time filter removes the slow baseline and adds the rate at
  which the fingertip darkens (blood arriving), so each beat shows as a
  sharp spike rather than a soft wave.
*/

export type TraceFeed = { push: (t: number, red: number, green: number) => void; clear: () => void }

const WINDOW_MS = 4000

/* Uses the text colour of its container (currentColor), so it follows each theme */
export function PulseTrace({ feedRef }: { feedRef: React.MutableRefObject<TraceFeed | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const pts: { t: number; v: number }[] = []
    let base = NaN
    let smooth = 0
    let lastHp = 0
    let scale = 0
    feedRef.current = {
      push: (t, red, green) => {
        /* Red is saturated on bright screens and torches; then the beat is in green only */
        const x = red > 248 ? green : red + green
        base = Number.isNaN(base) ? x : base + (x - base) * 0.1
        /* Darkening = blood arriving. Its rate of change marks the beat, so it is added on top of the level to draw a sharp spike per beat */
        const hp = base - x
        const rise = Math.max(0, hp - lastHp)
        lastHp = hp
        const v = 0.35 * hp + 2.2 * rise
        smooth += (v - smooth) * 0.75
        pts.push({ t, v: smooth })
        while (pts.length && pts[0].t < t - WINDOW_MS - 500) pts.shift()
      },
      clear: () => {
        pts.length = 0
        base = NaN
        smooth = 0
        lastHp = 0
        scale = 0
      },
    }
    let raf = 0
    const draw = () => {
      const c = canvas.current
      if (c) {
        const dpr = window.devicePixelRatio || 1
        const w = c.clientWidth
        const h = c.clientHeight
        if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
          c.width = Math.round(w * dpr)
          c.height = Math.round(h * dpr)
        }
        const ctx = c.getContext('2d')!
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, w, h)
        const color = getComputedStyle(c).color
        ctx.globalAlpha = 0.15
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, h / 2)
        ctx.lineTo(w, h / 2)
        ctx.stroke()
        ctx.globalAlpha = 1
        const now = performance.now()
        const recent = pts.filter((p) => p.t >= now - WINDOW_MS)
        const peak = recent.reduce((m, p) => Math.max(m, Math.abs(p.v)), 0)
        scale = Math.max(peak, scale * 0.985)
        if (recent.length > 1 && scale > 0) {
          ctx.lineWidth = 2.5
          ctx.lineJoin = 'miter'
          ctx.miterLimit = 6
          ctx.lineCap = 'round'
          ctx.beginPath()
          recent.forEach((p, i) => {
            const x = w - ((now - p.t) / WINDOW_MS) * w
            const y = h / 2 - (p.v / scale) * (h * 0.42)
            if (i) ctx.lineTo(x, y)
            else ctx.moveTo(x, y)
          })
          ctx.stroke()
        }
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      feedRef.current = null
    }
  }, [feedRef])

  return <canvas ref={canvas} className="h-16 w-full" aria-hidden="true" />
}
