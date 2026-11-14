/*
  Photoplethysmography (PPG) from the camera of a phone or tablet: each heartbeat pushes blood
  into the fingertip, which changes how much light passes through it. We take
  the mean red value of each frame, remove the slow drift, smooth it and count
  the peaks. Estimate only; not a medical device.
*/

export type Sample = { t: number; red: number; green: number }

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

/** Even 30 Hz series from irregular frame times */
const resample = (samples: Sample[], hz = 30) => {
  if (samples.length < 2) return []
  const out: number[] = []
  const t0 = samples[0].t
  const t1 = samples.at(-1)!.t
  let j = 0
  for (let t = t0; t <= t1; t += 1000 / hz) {
    while (j < samples.length - 2 && samples[j + 1].t < t) j++
    const a = samples[j]
    const b = samples[j + 1]
    const k = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t)
    out.push(a.red + (b.red - a.red) * k)
  }
  return out
}

/** Detrended, smoothed signal (30 Hz), for drawing and peak counting */
export function pulseSignal(samples: Sample[]) {
  const x = resample(samples)
  const trend = movingAverage(x, 30)
  const detrended = x.map((v, i) => v - trend[i])
  /* Brighter = less blood, so invert: peaks are beats */
  return movingAverage(detrended, 5).map((v) => -v)
}

/**
  A finger covering the camera, lit by the torch (back) or the bright screen
  (front), makes the image red: blood lets red light through and blocks green.
*/
export const fingerOnLens = (s: Sample) => s.red > 40 && s.red > s.green * 1.4

export function estimateBpm(samples: Sample[]): { bpm: number; reliable: boolean } | null {
  const y = pulseSignal(samples)
  if (y.length < 30 * 8) return null
  const hz = 30
  const minGap = Math.round(hz * 0.33)
  const sd = Math.sqrt(y.reduce((s, v) => s + v * v, 0) / y.length)
  const peaks: number[] = []
  for (let i = 2; i < y.length - 2; i++) {
    if (y[i] > 0.3 * sd && y[i] >= y[i - 1] && y[i] >= y[i + 1] && y[i] > y[i - 2] && y[i] > y[i + 2]) {
      if (peaks.length && i - peaks.at(-1)! < minGap) {
        if (y[i] > y[peaks.at(-1)!]) peaks[peaks.length - 1] = i
      } else peaks.push(i)
    }
  }
  if (peaks.length < 5) return null
  const gaps = peaks.slice(1).map((p, i) => (p - peaks[i]) / hz)
  const sorted = [...gaps].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const bpm = Math.round(60 / median)
  const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length
  const cv = Math.sqrt(gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length) / mean
  return { bpm, reliable: bpm >= 40 && bpm <= 180 && cv < 0.25 }
}
