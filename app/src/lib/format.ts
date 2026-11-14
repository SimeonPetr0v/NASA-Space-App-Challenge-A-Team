/** Formatting helpers shared by views */

export function pad(n: number, w = 2) {
  return String(Math.floor(n)).padStart(w, '0')
}

/** Mission time HH:MM (UTC is the ISS standard) */
export function utcTime(ms: number) {
  const d = new Date(ms)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

export function relativeAge(fromIso: string, now: number) {
  const mins = Math.max(0, Math.round((now - Date.parse(fromIso)) / 60_000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const h = Math.round(mins / 60)
  if (h < 48) return `${h} h ago`
  return `${Math.round(h / 24)} d ago`
}

/** Countdown text like 13:58 or 1:02:05 */
export function countdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

export function delayText(sec: number) {
  if (sec < 1) return '< 1 s'
  if (sec < 60) return `${sec.toFixed(1)} s`
  return `${Math.round(sec / 60)} min`
}
