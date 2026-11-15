/*
  Finds heartbeats live in the camera signal, for the moving pulse line.
  - Exposure jumps are removed: a frame-to-frame change over 3x the 90th
    percentile of recent changes (the steepest pulse upstrokes stay well
    below that).
  - Slow drift (finger pressure, screen brightness, auto-exposure) is removed
    by subtracting the 0.8 s average, so the detector never stalls on a drift.
  - A beat is a local peak of what is left that the wave climbed to by at
    least 0.8 standard deviations within the 0.5 s before it (the upstroke),
    so small wiggles on a broad top do not count and weaker beats still do.
    Peaks closer than 0.45 of the recent beat interval (at least 300 ms, so
    at most 200 bpm) are one beat: the higher one is kept.
  The rate itself still comes from ppg.ts; this only places the beats.
*/

export type Beat = { t: number; s: number }
export type Wave = { t: number; v: number }

const BASELINE_MS = 0.8 * 1000
const KEEP_MS = 4000
const MIN_GAP_MS = 300

const quantile = (xs: number[], q: number) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length * q)]
}
const median = (xs: number[]) => quantile(xs, 0.5)

export function createBeatFinder() {
  const beats: Beat[] = []
  const wave: Wave[] = []
  let recentX: { t: number; x: number }[] = []
  let steps: number[] = []
  let lastRaw = NaN
  let x = 0
  let first = NaN

  const push = (t: number, raw: number) => {
    if (Number.isNaN(lastRaw)) {
      x = raw
      first = t
    }
    else {
      const d = raw - lastRaw
      const jump = steps.length >= 20 && Math.abs(d) > 3 * quantile(steps, 0.9)
      x += jump ? 0 : d
      steps.push(Math.abs(d))
      if (steps.length > 60) steps = steps.slice(-60)
    }
    lastRaw = raw
    recentX.push({ t, x })
    recentX = recentX.filter((p) => p.t >= t - BASELINE_MS)
    const slow = recentX.reduce((a, p) => a + p.x, 0) / recentX.length
    const fast = recentX.slice(-3).reduce((a, p) => a + p.x, 0) / Math.min(3, recentX.length)
    /* The average is not settled during the first 0.8 s */
    if (t - first < BASELINE_MS) return
    /* Blood arriving darkens the fingertip, so a beat is a dip in brightness: flip it into a peak */
    wave.push({ t, v: slow - fast })
    while (wave.length && wave[0].t < t - KEEP_MS) wave.shift()
    while (beats.length && beats[0].t < t - KEEP_MS) beats.shift()

    const n = wave.length
    if (n < 5 || wave[n - 1].t - wave[0].t < 1000) return
    const c = wave[n - 3]
    const peak = c.v >= wave[n - 4].v && c.v >= wave[n - 5].v && c.v > wave[n - 2].v && c.v > wave[n - 1].v
    if (!peak) return
    const recent = wave.filter((p) => p.t >= t - 3000)
    const mean = recent.reduce((a, p) => a + p.v, 0) / recent.length
    const sd = Math.sqrt(recent.reduce((a, p) => a + (p.v - mean) ** 2, 0) / recent.length) || 1
    /* How far the wave climbed to this peak from its low point in the 0.5 s before it (the beat's upstroke) */
    const rise = c.v - Math.min(...wave.filter((p) => p.t >= c.t - 500 && p.t <= c.t).map((p) => p.v))
    if (rise < 0.8 * sd) return
    const intervals = beats.slice(-7).map((b, i, a) => (i ? b.t - a[i - 1].t : 0)).slice(1)
    const minGap = Math.max(MIN_GAP_MS, 0.45 * median(intervals))
    const last = beats.at(-1)
    const s = rise / sd
    if (last && c.t - last.t < minGap) {
      if (s > last.s) beats[beats.length - 1] = { t: c.t, s }
    } else beats.push({ t: c.t, s })
  }

  const clear = () => {
    beats.length = 0
    wave.length = 0
    recentX = []
    steps = []
    lastRaw = NaN
    x = 0
    first = NaN
  }

  return { beats, wave, push, clear }
}
