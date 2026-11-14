/*
  Photoplethysmography (PPG) from a camera: each heartbeat pushes blood into
  the fingertip, which changes how much light passes through it. Estimate
  only; not a medical device.

  Robust for laptop webcams too:
  - all three colour channels are measured, because a bright screen or torch
    often saturates red at 255 and then the pulse only shows in green/blue;
  - frames arrive irregularly (webcams drop to ~15 fps in low light), so the
    series is resampled to 30 Hz;
  - slow drift and exposure jumps are removed with a band-pass filter;
  - the heart rate is the dominant rhythm in the spectrum between 42 and
    200 bpm, which tolerates noise far better than counting single peaks;
  - the signal with the clearest rhythm wins (red, green, blue, or red and
    green together), and how clear it is becomes the quality score.
*/

export type Sample = { t: number; red: number; green: number; blue: number }
type Channel = 'red' | 'green' | 'blue'
const CHANNELS: Channel[] = ['red', 'green', 'blue']
const HZ = 30
const MIN_BPM = 42
const MAX_BPM = 200

const movingAverage = (xs: number[], w: number) => {
  const out: number[] = []
  let sum = 0
  for (let i = 0; i < xs.length; i++) {
    sum += xs[i]
    if (i >= w) sum -= xs[i - w]
    out.push(sum / Math.min(i + 1, w))
  }
  return out
}

/** Even 30 Hz series of one channel from irregular frame times */
const resample = (samples: Sample[], ch: Channel) => {
  if (samples.length < 2) return []
  const out: number[] = []
  const t0 = samples[0].t
  const t1 = samples.at(-1)!.t
  let j = 0
  for (let t = t0; t <= t1; t += 1000 / HZ) {
    while (j < samples.length - 2 && samples[j + 1].t < t) j++
    const a = samples[j]
    const b = samples[j + 1]
    const k = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t)
    out.push(a[ch] + (b[ch] - a[ch]) * k)
  }
  return out
}

/*
  Auto-exposure and white-balance make sudden jumps. Frame-to-frame changes
  far larger than usual (over 5x the median absolute change) are replaced by
  the median change, then the series is rebuilt, so the jumps disappear
  while the gentle pulse stays.
*/
const removeJumps = (x: number[]) => {
  if (x.length < 3) return x
  const d = x.slice(1).map((v, i) => v - x[i])
  const abs = d.map(Math.abs).sort((p, q) => p - q)
  const mad = abs[Math.floor(abs.length / 2)] || 1e-6
  const out = [x[0]]
  for (let i = 0; i < d.length; i++) out.push(out[i] + (Math.abs(d[i]) > 5 * mad ? 0 : d[i]))
  return out
}

/** Band-pass (difference of a short and a 0.8 s moving average), inverted so peaks are beats */
const band = (raw: number[]) => {
  const x = removeJumps(raw)
  const fast = movingAverage(x, 3)
  const slow = movingAverage(x, Math.round(HZ * 0.8))
  return fast.map((v, i) => slow[i] - v)
}

const saturated = (samples: Sample[], ch: Channel) => {
  const mean = samples.reduce((s, x) => s + x[ch], 0) / samples.length
  return mean > 250 || mean < 3
}

const normalise = (y: number[]) => {
  const sd = Math.sqrt(y.reduce((s, v) => s + v * v, 0) / Math.max(1, y.length)) || 1
  return y.map((v) => v / sd)
}

/*
  Dominant rhythm between MIN_BPM and MAX_BPM from a Hann-windowed spectrum
  (0.01 Hz steps). A real pulse wave is not a pure sine: it shows at its
  rate and at twice its rate, so each rate scores its own power plus half
  the power at double the rate. quality = how far the best score stands
  above the scores around it (noise alone stays low).
*/
function spectrum(w: number[], f: number) {
  let re = 0
  let im = 0
  const k = (2 * Math.PI * f) / HZ
  for (let i = 0; i < w.length; i++) {
    re += w[i] * Math.cos(k * i)
    im -= w[i] * Math.sin(k * i)
  }
  return re * re + im * im
}

function rhythm(y: number[]): { bpm: number; q: number } | null {
  const s = y.slice(HZ)
  const n = s.length
  if (n < HZ * 6) return null
  const w = s.map((v, i) => v * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))))
  const freqs: number[] = []
  const score: number[] = []
  for (let f = MIN_BPM / 60; f <= MAX_BPM / 60 + 1e-9; f += 0.01) {
    freqs.push(f)
    score.push(spectrum(w, f) + (2 * f < HZ / 2 ? 0.5 * spectrum(w, 2 * f) : 0))
  }
  let best = 0
  for (let i = 1; i < score.length; i++) if (score[i] > score[best]) best = i
  /* Compare the peak with its own neighbourhood (±0.4 Hz, skipping ±0.08 Hz), so leftover slow drift that lifts the low end does not count as a pulse */
  const around = score.filter((_, i) => Math.abs(freqs[i] - freqs[best]) <= 0.4 && Math.abs(freqs[i] - freqs[best]) > 0.08).sort((p, q) => p - q)
  const floor = around[Math.floor(around.length / 2)] || 1e-9
  return { bpm: freqs[best] * 60, q: score[best] / floor }
}

/** Candidate signals: each unsaturated channel, and red + green together (both dim with each beat) */
function bestChannel(samples: Sample[]): { y: number[]; found: { bpm: number; q: number } | null } {
  const bands: Partial<Record<Channel, number[]>> = {}
  for (const ch of CHANNELS) if (!saturated(samples, ch)) bands[ch] = normalise(band(resample(samples, ch)))
  const candidates = Object.values(bands)
  if (bands.red && bands.green) candidates.push(bands.red.map((v, i) => v + bands.green![i]))
  let pick: { y: number[]; found: { bpm: number; q: number } | null } | null = null
  for (const y of candidates) {
    const found = rhythm(y)
    if (!pick || (found?.q ?? -1) > (pick.found?.q ?? -1)) pick = { y, found }
  }
  return pick ?? { y: [], found: null }
}

/** Signal for the live wave (30 Hz) */
export function pulseSignal(samples: Sample[]) {
  return bestChannel(samples).y
}

/**
  A finger covering the camera, lit by the torch, the bright screen or room
  light, makes the image reddish and fairly dark; webcams often see only a
  dim red, so the test is loose. A saturated red (255) also counts.
*/
export const fingerOnLens = (s: Sample) => (s.red > 25 && s.red > s.green * 1.25 && s.red > s.blue * 1.25) || (s.red > 245 && s.green < 230)

/** Peak prominence: below NO_PULSE there is no clear pulse; from RELIABLE the estimate can be saved */
const NO_PULSE = 22
/** The first and second half of the recording must give the same rate within this many bpm */
const STEADY_BPM = 8
const RELIABLE = 30

export function estimateBpm(samples: Sample[]): { bpm: number; reliable: boolean; quality: number } | null {
  if (samples.length < 30) return null
  const span = (samples.at(-1)!.t - samples[0].t) / 1000
  if (span < 8) return null
  const { y, found } = bestChannel(samples)
  if (!found || found.q < NO_PULSE) return null
  /* A real heartbeat keeps the same rate through the recording; noise peaks wander. Both halves must agree. */
  const halfLen = Math.floor(y.length / 2) + HZ
  const first = rhythm(y.slice(0, halfLen))
  const second = rhythm(y.slice(-halfLen))
  if (!first || !second || Math.abs(first.bpm - found.bpm) > STEADY_BPM || Math.abs(second.bpm - found.bpm) > STEADY_BPM) return null
  const bpm = Math.round(found.bpm)
  return { bpm, reliable: found.q >= RELIABLE && bpm >= MIN_BPM && bpm <= MAX_BPM, quality: Math.round(found.q * 100) / 100 }
}
