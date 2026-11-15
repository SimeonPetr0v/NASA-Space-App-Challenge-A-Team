import { useEffect, useRef } from 'react'

/*
  Live pulse trace for the measuring screen, in the style of the app's
  heartbeat mark: a flat line with one wide beat shape (small rise, dip,
  tall spike, back to the line) at each heartbeat the camera detects. Beats are
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
    const beats: number[] = []
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
        if (armed && level > 0 && rise > 0.5 * level && t - lastBeat > REFRACTORY_MS) {
          beats.push(t)
          lastBeat = t
          armed = false
        }
        if (rise < 0.2 * level) armed = true
        while (beats.length && beats[0] < t - WINDOW_MS - 500) beats.shift()
      },
      clear: () => {
        beats.length = 0
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
        ctx.beginPath()
        ctx.moveTo(0, mid)
        beats.forEach((b, i) => {
          if (b + BEAT[BEAT.length - 1][0] < now - WINDOW_MS) return
          /* Narrow the shape when beats come fast, so neighbouring beats never overlap (at most 75 % of the gap) */
          const gap = Math.min(i > 0 ? b - beats[i - 1] : Infinity, i < beats.length - 1 ? beats[i + 1] - b : Infinity)
          const k = Math.min(1, (0.75 * gap) / BEAT_SPAN)
          for (const [ms, y] of BEAT) ctx.lineTo(xOf(b + ms * k), mid - y * amp)
        })
        ctx.lineTo(w, mid)
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
