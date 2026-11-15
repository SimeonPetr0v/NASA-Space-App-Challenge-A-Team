import { useEffect, useRef } from 'react'

/*
  Live pulse trace for the measuring screen, in the style of the app's
  heartbeat mark: at each heartbeat the camera detects, a beat shape (small
  rise, dip, tall spike, back to the line) whose height follows that beat's
  strength and whose details vary per beat; between beats, the camera
  signal's real small wobble. Beats are
  found in real time from how fast the fingertip darkens (blood arriving),
  so each shape appears when the heart actually beats. It is a picture of
  the beat timing, not an ECG. Drawn on a canvas every screen frame and
  placed by time, so it scrolls smoothly at any camera frame rate.
*/

export type TraceFeed = { push: (t: number, red: number, green: number) => void; clear: () => void }

const WINDOW_MS = 3000
/* Beats closer than this are one beat (200 bpm) */
const REFRACTORY_MS = 300
/* The beat shape: [ms relative to the beat, height as a share of the half height; up is positive] */
const BEAT: [number, number][] = [
  [-280, 0],
  [-200, 0.3],
  [-140, -0.45],
  [-30, 0.95],
  [90, 0],
]
const BEAT_SPAN = 370

export function PulseTrace({ feedRef }: { feedRef: React.MutableRefObject<TraceFeed | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    /* Each beat keeps its own strength (how sharp the darkening was, relative to recent beats) */
    const beats: { t: number; s: number }[] = []
    /* The real filtered signal, drawn faintly between beats */
    const pts: { t: number; v: number }[] = []
    let base = NaN
    let lastHp = 0
    let level = 0
    let lastBeat = -Infinity
    let armed = true
    feedRef.current = {
      push: (t, red, green) => {
        /* Red is saturated on bright screens and torches; then the beat is in green only */
        const x = red > 248 ? green : red + green
        base = Number.isNaN(base) ? x : base + (x - base) * 0.1
        const hp = base - x
        const rise = Math.max(0, hp - lastHp)
        lastHp = hp
        /* Adaptive threshold: half of the recent strongest rise, slowly forgetting */
        level = Math.max(rise, level * 0.97)
        pts.push({ t, v: hp })
        while (pts.length && pts[0].t < t - WINDOW_MS - 500) pts.shift()
        if (armed && level > 0 && rise > 0.5 * level && t - lastBeat > REFRACTORY_MS) {
          beats.push({ t, s: Math.min(1.3, rise / level) })
          lastBeat = t
          armed = false
        }
        if (rise < 0.2 * level) armed = true
        while (beats.length && beats[0].t < t - WINDOW_MS - 500) beats.shift()
      },
      clear: () => {
        beats.length = 0
        pts.length = 0
        base = NaN
        lastHp = 0
        level = 0
        lastBeat = -Infinity
        armed = true
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
        ctx.strokeStyle = getComputedStyle(c).color
        ctx.lineWidth = 3
        ctx.lineJoin = 'miter'
        ctx.miterLimit = 8
        ctx.lineCap = 'round'
        const now = performance.now()
        const xOf = (t: number) => w - ((now - t) / WINDOW_MS) * w
        const mid = h / 2
        const amp = h * 0.44
        /*
          Between beats: the real signal's small wobble. At each beat: the beat
          shape, its height set by that beat's strength and its small rise,
          dip and ending varied per beat, so no two beats look the same.
        */
        const recent = pts.filter((p) => p.t >= now - WINDOW_MS - 400)
        const wob = recent.reduce((m, p) => Math.max(m, Math.abs(p.v)), 0) || 1
        const line: [number, number][] = []
        /* Beat heights relative to the beats on screen, so stronger and weaker beats look different */
        const shown = beats.filter((b) => b.t >= now - WINDOW_MS - 400)
        const meanS = shown.reduce((a, b) => a + b.s, 0) / Math.max(1, shown.length) || 1
        const spans: [number, number][] = []
        beats.forEach((b, i) => {
          if (b.t + BEAT[BEAT.length - 1][0] < now - WINDOW_MS) return
          /* Narrow the shape when beats come fast, so neighbouring beats never overlap (at most 75 % of the gap) */
          const gap = Math.min(i > 0 ? b.t - beats[i - 1].t : Infinity, i < beats.length - 1 ? beats[i + 1].t - b.t : Infinity)
          const k = Math.min(1, (0.75 * gap) / BEAT_SPAN)
          /* Repeatable per-beat variation, from the beat's own time */
          const vary = (n: number) => {
            const x = Math.sin(b.t * 0.0137 + n * 12.9898) * 43758.5453
            return x - Math.floor(x)
          }
          const height = Math.max(0.45, Math.min(1, 0.8 * (b.s / meanS) ** 1.5))
          const shape: [number, number][] = [
            [BEAT[0][0], 0],
            [BEAT[1][0] * (0.85 + 0.3 * vary(1)), 0.15 + 0.25 * vary(2)],
            [BEAT[2][0] * (0.9 + 0.2 * vary(3)), -(0.25 + 0.3 * vary(4))],
            [BEAT[3][0], height],
            [40 + 30 * vary(5), -0.12 * vary(6)],
            [BEAT[4][0], 0],
          ]
          spans.push([b.t + BEAT[0][0] * k, b.t + BEAT[4][0] * k])
          for (const [ms, y] of shape) line.push([b.t + ms * k, y])
        })
        for (const p of recent) if (!spans.some(([a, z]) => p.t > a && p.t < z)) line.push([p.t, (p.v / wob) * 0.22])
        line.sort((a, z) => a[0] - z[0])
        ctx.beginPath()
        line.forEach(([t, y], i) => (i ? ctx.lineTo(xOf(t), mid - y * amp) : ctx.moveTo(xOf(t), mid - y * amp)))
        if (!line.length) {
          ctx.moveTo(0, mid)
          ctx.lineTo(w, mid)
        }
        ctx.stroke()
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
