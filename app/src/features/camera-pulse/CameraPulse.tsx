import { Camera, HeartPulse, RotateCcw, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EASE_OUT } from '@/components/motion-config'
import { Panel, PanelHeader } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import { Action } from '@/components/ui/action'
import { INDICATORS } from '@/data/indicators'
import { cn } from '@/lib/utils'
import { useStore } from '@/state/store'
import { estimateBpm, fingerOnLens, pulseSignal, type Sample } from './ppg'

/*
  Heart rate from the camera (features.cameraPulse), for phones and tablets.
  The user picks the camera. Front: the fingertip covers the front camera and
  the screen turns into a bright light that shines through the finger (front
  cameras have no torch). Back: the torch lights the finger where the device
  allows it. 20 seconds. Frames stay on the device; nothing is recorded.
*/

const SECONDS = 20
type Phase = 'idle' | 'starting' | 'measuring' | 'done' | 'error'
type Lens = 'front' | 'back'
const LENS_KEY = 'ahm:ppg-camera'
const readLens = (): Lens => {
  try {
    return localStorage.getItem(LENS_KEY) === 'back' ? 'back' : 'front'
  } catch {
    return 'front'
  }
}

function DeviceHint({ lens }: { lens: Lens }) {
  if (lens === 'back')
    return (
      <svg viewBox="0 0 120 96" className="h-24 w-auto shrink-0" aria-hidden="true">
        <rect x="6" y="18" width="44" height="74" rx="7" className="fill-muted stroke-border-strong" strokeWidth="2" />
        <circle cx="18" cy="30" r="4" className="fill-foreground" />
        <circle cx="18" cy="41" r="2" className="fill-status-caution" />
        <rect x="62" y="30" width="54" height="62" rx="6" className="fill-muted stroke-border-strong" strokeWidth="2" />
        <circle cx="74" cy="42" r="4" className="fill-foreground" />
        <g className="ppg-finger">
          <path d="M12 6 h12 a6 6 0 0 1 6 6 v20 a12 12 0 0 1 -24 0 v-20 a6 6 0 0 1 6 -6z" fill="var(--status-danger)" opacity="0.85" />
        </g>
        <g className="ppg-finger" style={{ animationDelay: '0.4s' }}>
          <path d="M68 18 h12 a6 6 0 0 1 6 6 v20 a12 12 0 0 1 -24 0 v-20 a6 6 0 0 1 6 -6z" fill="var(--status-danger)" opacity="0.85" />
        </g>
      </svg>
    )
  return (
    <svg viewBox="0 0 120 96" className="h-24 w-auto shrink-0" aria-hidden="true">
      <rect x="6" y="18" width="44" height="74" rx="7" className="fill-card stroke-border-strong" strokeWidth="2" />
      <circle cx="28" cy="25" r="2.4" className="fill-foreground" />
      <rect x="62" y="30" width="54" height="62" rx="6" className="fill-card stroke-border-strong" strokeWidth="2" />
      <circle cx="89" cy="36" r="2.4" className="fill-foreground" />
      <g className="ppg-finger">
        <path d="M22 2 h12 a6 6 0 0 1 6 6 v20 a12 12 0 0 1 -24 0 v-20 a6 6 0 0 1 6 -6z" fill="var(--status-danger)" opacity="0.85" />
      </g>
      <g className="ppg-finger" style={{ animationDelay: '0.4s' }}>
        <path d="M83 12 h12 a6 6 0 0 1 6 6 v20 a12 12 0 0 1 -24 0 v-20 a6 6 0 0 1 6 -6z" fill="var(--status-danger)" opacity="0.85" />
      </g>
    </svg>
  )
}

export function CameraPulse() {
  const { addReadings, simNow, theme } = useStore()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [left, setLeft] = useState(SECONDS)
  const [finger, setFinger] = useState(false)
  const [wave, setWave] = useState<number[]>([])
  const [result, setResult] = useState<{ bpm: number; reliable: boolean } | null>(null)
  const [saved, setSaved] = useState(false)
  const [lens, setLensState] = useState<Lens>(readLens)
  const setLens = (l: Lens) => {
    setLensState(l)
    try {
      localStorage.setItem(LENS_KEY, l)
    } catch {
      /* private mode */
    }
  }
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const wake = useRef<{ release: () => Promise<void> } | null>(null)
  const raf = useRef(0)

  const stop = () => {
    cancelAnimationFrame(raf.current)
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    wake.current?.release().catch(() => undefined)
    wake.current = null
  }
  useEffect(() => stop, [])

  const fullscreen = phase === 'starting' || phase === 'measuring'
  useEffect(() => {
    if (!fullscreen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stop()
        setPhase('idle')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [fullscreen])

  const start = async () => {
    setError('')
    setResult(null)
    setSaved(false)
    setWave([])
    setFinger(false)
    setLeft(SECONDS)
    setPhase('starting')
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: lens === 'front' ? 'user' : 'environment', width: { ideal: 160 }, height: { ideal: 120 } }, audio: false })
      stream.current = s
      if (lens === 'back') {
        const track = s.getVideoTracks()[0]
        const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean }
        if (caps.torch) await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] }).catch(() => undefined)
      }
      const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
      wake.current = (await wl?.request('screen').catch(() => null)) ?? null
      const v = video.current!
      v.srcObject = s
      await v.play()
      const canvas = document.createElement('canvas')
      canvas.width = 40
      canvas.height = 30
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!
      const samples: Sample[] = []
      let begin = 0
      setPhase('measuring')
      const tick = () => {
        ctx.drawImage(v, 0, 0, 40, 30)
        const d = ctx.getImageData(0, 0, 40, 30).data
        let r = 0
        let g = 0
        for (let i = 0; i < d.length; i += 4) {
          r += d[i]
          g += d[i + 1]
        }
        const n = d.length / 4
        const sample = { t: performance.now(), red: r / n, green: g / n }
        const on = fingerOnLens(sample)
        setFinger(on)
        if (on) {
          if (!begin) begin = sample.t
          samples.push(sample)
          if (samples.length % 3 === 0) setWave(pulseSignal(samples.slice(-150)).slice(-90))
        } else {
          begin = 0
          samples.length = 0
        }
        const elapsed = begin ? (sample.t - begin) / 1000 : 0
        setLeft(Math.max(0, Math.ceil(SECONDS - elapsed)))
        if (elapsed >= SECONDS) {
          stop()
          setResult(estimateBpm(samples))
          setPhase('done')
          return
        }
        raf.current = requestAnimationFrame(tick)
      }
      raf.current = requestAnimationFrame(tick)
    } catch {
      stop()
      setError(`The ${lens} camera is not available. Allow camera access, or enter the heart rate by hand below.`)
      setPhase('error')
    }
  }

  const cancel = () => {
    stop()
    setPhase('idle')
  }

  const lo = Math.min(...wave, 0)
  const hi = Math.max(...wave, 0)
  const pts = wave.map((v, i) => `${(i / 89) * 300},${60 - ((v - lo) / (hi - lo || 1)) * 52 - 4}`).join(' ')
  const status = result ? INDICATORS.hr.classify(result.bpm) : 'no-data'
  const night = theme === 'night'
  const lit = lens === 'front'
  const progress = finger ? (SECONDS - left) / SECONDS : 0

  return (
    <Panel aria-labelledby="ppg-title">
      <PanelHeader id="ppg-title" title="Heart rate from the camera" meta="Estimate, not a medical device" />
      <video ref={video} playsInline muted className="hidden" />
      <div className="grid gap-4 p-4 sm:p-5">
        {phase === 'done' ? (
          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center" aria-live="polite">
            {result ? (
              <div className="grid gap-1">
                <p className="flex flex-wrap items-baseline gap-3">
                  <span className="num text-5xl font-semibold">≈ {result.bpm}</span>
                  <span className="text-muted-foreground">bpm (estimate)</span>
                </p>
                <StatusBadge status={status} />
              </div>
            ) : (
              <p className="text-status-caution-ink text-sm">No clear pulse found. Cover the camera fully, press lightly and keep still.</p>
            )}
            <div className="grid gap-2 sm:justify-items-end">
              {result && !result.reliable && (
                <p className="text-status-caution-ink text-sm sm:text-right">The signal was noisy. Rest the device on a table, press lightly and try again.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {result?.reliable && !saved && (
                  <Action
                    variant="primary"
                    className="flex-1 sm:flex-none"
                    onClick={() => {
                      if (addReadings([{ indicatorId: 'hr', value: result.bpm, takenAt: new Date(simNow()).toISOString(), source: 'camera' }])) setSaved(true)
                    }}
                  >
                    <HeartPulse aria-hidden="true" /> Save as resting heart rate
                  </Action>
                )}
                <Action variant="secondary" className="flex-1 sm:flex-none" onClick={start}>
                  <RotateCcw aria-hidden="true" /> Measure again
                </Action>
              </div>
              {saved && (
                <p role="status" className="text-status-ok-ink text-sm font-medium">
                  Saved as a camera reading.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <DeviceHint lens={lens} />
            <div className="grid gap-3">
              <div role="radiogroup" aria-label="Camera" className="bg-muted grid grid-cols-2 gap-1 rounded-sm p-1 sm:w-80">
                {(['front', 'back'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={lens === l}
                    onClick={() => setLens(l)}
                    className={cn(
                      'min-h-11 rounded-[3px] px-3 text-sm font-medium transition-colors',
                      lens === l ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {l === 'front' ? 'Front camera' : 'Back camera'}
                  </button>
                ))}
              </div>
              <ol className="text-muted-foreground grid list-decimal gap-1 pl-5 text-sm">
                {lens === 'front' ? (
                  <>
                    <li>Rest the phone or tablet on a table, screen up.</li>
                    <li>Cover the front camera (the small lens at the edge of the screen) with your fingertip.</li>
                    <li>Keep still for {SECONDS} seconds. The screen lights up your finger.</li>
                  </>
                ) : (
                  <>
                    <li>Hold the phone or tablet with the screen facing you.</li>
                    <li>Cover the back camera and the flash next to it with your fingertip.</li>
                    <li>Keep still for {SECONDS} seconds. The flash lights up your finger where the device allows it.</li>
                  </>
                )}
              </ol>
              {error && (
                <p role="alert" className="text-status-danger-ink text-sm">
                  {error}
                </p>
              )}
              <div>
                <Action variant="secondary" className="w-full sm:w-auto" onClick={start}>
                  <Camera aria-hidden="true" /> Measure with {lens} camera
                </Action>
              </div>
              <p className="text-muted-foreground text-xs">Frames stay on this device; nothing is recorded or sent.</p>
            </div>
          </div>
        )}
      </div>

      {createPortal(
        <AnimatePresence>
          {fullscreen && (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Measuring heart rate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className={cn(
                'fixed inset-0 z-[80] flex flex-col items-center px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)] select-none',
                !lit ? 'bg-background text-foreground' : night ? 'bg-[#ff2a1a] text-[#2a0500]' : 'bg-white text-[#1d1d1f]',
              )}
            >
              <div className="flex flex-col items-center gap-2 pt-4 sm:pt-6" aria-hidden="true">
                {lit && <span className="ppg-target block size-14 rounded-full border-4 border-current opacity-60" />}
                <span className="text-sm font-semibold tracking-wide uppercase opacity-70">{lit ? 'Finger on the front camera' : 'Finger on the back camera and flash'}</span>
              </div>

              <div className="flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 landscape:max-w-2xl landscape:flex-row landscape:gap-10">
                <div className="relative grid size-44 shrink-0 place-items-center sm:size-56" aria-live="polite">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="6" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray="1"
                      strokeDashoffset={1 - progress}
                      style={{ transition: 'stroke-dashoffset 0.3s linear' }}
                    />
                  </svg>
                  <span className="num text-6xl font-semibold sm:text-7xl">{left}</span>
                  <span className="absolute bottom-9 text-xs font-medium opacity-70 sm:bottom-12">seconds</span>
                </div>
                <div className="grid w-full gap-3">
                  <p className="text-center text-lg font-semibold sm:text-xl landscape:text-left">
                    {phase === 'starting' ? 'Starting the camera…' : finger ? 'Good. Keep still…' : `Cover the ${lens} camera with your fingertip`}
                  </p>
                  <svg viewBox="0 0 300 64" className="h-16 w-full" aria-hidden="true">
                    <line x1="0" y1="32" x2="300" y2="32" stroke="currentColor" strokeOpacity="0.12" />
                    {wave.length > 2 && <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round" />}
                  </svg>
                  {!finger && phase === 'measuring' && (
                    <p className="text-center text-sm opacity-75 landscape:text-left">{lit ? 'Turn the screen brightness up. ' : 'Use a bright room if there is no flash. '}Press lightly; pressing hard stops the blood flow.</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={cancel}
                className="flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-sm border-2 border-current text-base font-semibold"
              >
                <X className="size-5" aria-hidden="true" /> Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </Panel>
  )
}
