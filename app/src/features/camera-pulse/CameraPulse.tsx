import { Camera, HeartPulse, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Panel, PanelHeader } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import { Action } from '@/components/ui/action'
import { INDICATORS } from '@/data/indicators'
import { useStore } from '@/state/store'
import { estimateBpm, fingerOnLens, pulseSignal, type Sample } from './ppg'

/*
  Heart rate from the camera (features.cameraPulse). Fingertip over the rear
  camera (torch on where the phone allows it) for 20 seconds. Frames stay on
  the device; nothing is recorded or sent.
*/

const SECONDS = 20
type Phase = 'idle' | 'starting' | 'measuring' | 'done' | 'error'

export function CameraPulse() {
  const { addReadings, simNow } = useStore()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [left, setLeft] = useState(SECONDS)
  const [finger, setFinger] = useState(false)
  const [wave, setWave] = useState<number[]>([])
  const [result, setResult] = useState<{ bpm: number; reliable: boolean } | null>(null)
  const [saved, setSaved] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const raf = useRef(0)

  const stop = () => {
    cancelAnimationFrame(raf.current)
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
  }
  useEffect(() => stop, [])

  const start = async () => {
    setError('')
    setResult(null)
    setSaved(false)
    setWave([])
    setLeft(SECONDS)
    setPhase('starting')
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 160 }, height: { ideal: 120 } }, audio: false })
      stream.current = s
      const track = s.getVideoTracks()[0]
      const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean }
      if (caps.torch) await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] }).catch(() => undefined)
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
      setError('The camera is not available. Allow camera access, or enter the heart rate by hand.')
      setPhase('error')
    }
  }

  const lo = Math.min(...wave, 0)
  const hi = Math.max(...wave, 0)
  const pts = wave.map((v, i) => `${(i / 89) * 300},${50 - ((v - lo) / (hi - lo || 1)) * 44 - 3}`).join(' ')
  const status = result ? INDICATORS.hr.classify(result.bpm) : 'no-data'

  return (
    <Panel aria-labelledby="ppg-title">
      <PanelHeader id="ppg-title" title="Heart rate from the camera" meta="Estimate, not a medical device" />
      <div className="grid gap-4 p-4 sm:p-5">
        <video ref={video} playsInline muted className="hidden" />
        {phase === 'idle' || phase === 'error' ? (
          <>
            <p className="text-muted-foreground text-sm">
              Cover the rear camera completely with your fingertip and hold still for {SECONDS} seconds. The colour of your skin changes with every heartbeat
              (photoplethysmography). Frames stay on this device.
            </p>
            {error && (
              <p role="alert" className="text-status-danger-ink text-sm">
                {error}
              </p>
            )}
            <div>
              <Action variant="secondary" onClick={start}>
                <Camera aria-hidden="true" /> Measure with camera
              </Action>
            </div>
          </>
        ) : phase === 'done' ? (
          <div className="grid gap-3" aria-live="polite">
            {result ? (
              <>
                <p className="flex flex-wrap items-baseline gap-3">
                  <span className="num text-4xl font-semibold">≈ {result.bpm}</span>
                  <span className="text-muted-foreground">bpm (estimate)</span>
                  <StatusBadge status={status} />
                </p>
                {!result.reliable && <p className="text-status-caution-ink text-sm">The signal was noisy. Hold still, press lightly and try again before saving.</p>}
              </>
            ) : (
              <p className="text-status-caution-ink text-sm">No clear pulse found. Cover the camera fully, press lightly and keep still.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {result?.reliable && !saved && (
                <Action
                  variant="primary"
                  onClick={() => {
                    if (addReadings([{ indicatorId: 'hr', value: result.bpm, takenAt: new Date(simNow()).toISOString(), source: 'camera' }])) setSaved(true)
                  }}
                >
                  <HeartPulse aria-hidden="true" /> Save as resting heart rate
                </Action>
              )}
              <Action variant="secondary" onClick={start}>
                <RotateCcw aria-hidden="true" /> Measure again
              </Action>
            </div>
            {saved && (
              <p role="status" className="text-status-ok-ink text-sm font-medium">
                Saved as a camera reading.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-2" aria-live="polite">
            <p className="flex items-baseline justify-between text-sm">
              <span className={finger ? 'font-medium' : 'text-status-caution-ink font-medium'}>
                {phase === 'starting' ? 'Starting the camera…' : finger ? 'Hold still…' : 'Cover the camera with your fingertip'}
              </span>
              <span className="num text-2xl font-semibold">{left}s</span>
            </p>
            <svg viewBox="0 0 300 50" className="bg-muted/50 h-14 w-full rounded-sm" aria-hidden="true">
              {wave.length > 2 && <polyline points={pts} fill="none" stroke="var(--status-danger)" strokeWidth={2} strokeLinejoin="round" />}
            </svg>
            <div>
              <Action
                variant="ghost"
                onClick={() => {
                  stop()
                  setPhase('idle')
                }}
              >
                Cancel
              </Action>
            </div>
          </div>
        )}
      </div>
    </Panel>
  )
}
