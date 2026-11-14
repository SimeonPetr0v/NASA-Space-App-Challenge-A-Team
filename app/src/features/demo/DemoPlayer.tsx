import { Pause, Play } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { startDemo, stopDemo, useRunning } from './demo-state'
import { EASE_OUT } from '@/components/motion-config'
import type { LinkMessage } from '@/engine/types'
import { cn } from '@/lib/utils'
import { navigate, type Route } from '@/state/route'
import { useStore } from '@/state/store'
import { useHealth } from '@/state/useHealth'

/*
  "Play demo" (features.playDemo): runs the whole story by itself with
  captions, for the 30-second video and for judges who do not click around.
  Uses the app's real actions (crew, mission, report, reply, clock, night).
*/


class Cancelled extends Error {}

const scrollToId = (id: string) => {
  const el = document.getElementById(id)
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' })
}

export function PlayDemoButton({ className }: { className?: string }) {
  const on = useRunning()
  return (
    <button
      type="button"
      onClick={on ? stopDemo : startDemo}
      aria-pressed={on}
      aria-label={on ? 'Stop demo' : 'Play demo'}
      title={on ? 'Stop demo' : 'Play demo: runs the whole story by itself'}
      className={cn(
        'border-border-strong hover:bg-muted flex h-9 items-center gap-2 rounded-sm border px-3 text-xs font-semibold whitespace-nowrap transition-colors',
        on && 'bg-foreground text-background hover:bg-foreground/90',
        className,
      )}
    >
      {on ? <Pause className="size-3.5" aria-hidden="true" /> : <Play className="size-3.5" aria-hidden="true" />}
      <span className="hidden xl:inline">{on ? 'Stop demo' : 'Play demo'}</span>
    </button>
  )
}

const STEPS = 9

export function DemoPlayer() {
  const on = useRunning()
  const store = useStore()
  const health = useHealth()
  const ref = useRef({ store, health })
  useLayoutEffect(() => {
    ref.current = { store, health }
  })
  const [caption, setCaption] = useState<{ step: number; text: string } | null>(null)

  useEffect(() => {
    if (!on) return
    let cancelled = false
    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const t0 = Date.now()
        const id = window.setInterval(() => {
          if (cancelled) {
            window.clearInterval(id)
            reject(new Cancelled())
          } else if (Date.now() - t0 >= ms) {
            window.clearInterval(id)
            resolve()
          }
        }, 50)
      })
    const until = async (cond: () => boolean, maxMs = 15000) => {
      const t0 = Date.now()
      while (!cond() && Date.now() - t0 < maxMs) await wait(150)
    }
    const say = (step: number, text: string) => setCaption({ step, text })
    const go = async (route: Route) => {
      navigate(route)
      await wait(700)
    }
    const s = () => ref.current.store

    const run = async () => {
      s().clearTransmission()
      s().setTheme('day')
      s().setCrew('cm2')
      s().setMode('mars-transit')
      s().setMarsDelayMin(14)
      s().setSpeed(1)
      await go('overview')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      say(1, 'Day 47 of a Mars transit, 14 light-minutes from Earth. CM-2 runs the morning check.')
      await wait(4200)
      scrollToId('status')
      say(2, 'Heart rate 108 and temperature 37.9 °C: caution. The guidance appears at once; nobody waits for Earth.')
      await wait(5000)
      scrollToId('trend-title')
      say(3, 'Trend watch catches slow changes, and the radiation budget tracks dose against NASA’s 600 mSv career limit.')
      await wait(5000)
      scrollToId('body-title')
      say(4, 'The 3D body shows which systems need attention.')
      await wait(4500)
      await go('link')
      say(5, 'The report leaves for Earth with the real light delay.')
      const { assessments, readings } = ref.current.health
      const report: LinkMessage = s().sendReport(assessments, readings, 'Health report')
      await wait(5200)
      s().clearTransmission()
      scrollToId('link-title')
      s().setSpeed(600)
      say(6, 'Demo clock ×600: fourteen minutes pass in seconds while the crew is already acting.')
      await until(() => s().simNow() >= Date.parse(report.arrivesAt))
      await wait(1200)
      s().sendReply(report, 'Rest for the remainder of this shift and increase fluids to 2.5 L today.')
      say(7, 'The flight surgeon replies. The answer needs another fourteen minutes to come back.')
      await wait(4500)
      s().setSpeed(1)
      await go('crew')
      say(8, 'The crew medical officer sees the whole crew at once: CM-3 needs action now.')
      await wait(5000)
      s().setTheme('night')
      await go('sleep')
      say(9, 'At night the whole app switches to low-blue colours for the sleep shift.')
      await wait(5000)
      s().setTheme('day')
      await go('overview')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      stopDemo()
    }
    run().catch((e) => {
      if (!(e instanceof Cancelled)) throw e
    })
    return () => {
      cancelled = true
      ref.current.store.setSpeed(1)
      setCaption(null)
    }
  }, [on])

  return (
    <AnimatePresence>
      {on && caption && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="bg-space text-space-foreground fixed inset-x-3 bottom-20 z-[70] mx-auto max-w-2xl rounded-md p-4 shadow-[var(--shadow-pop)] lg:bottom-6"
        >
          <div className="flex items-start gap-4">
            <AnimatePresence mode="wait">
              <motion.p
                key={caption.step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
                className="flex-1 text-base leading-snug sm:text-lg"
              >
                {caption.text}
              </motion.p>
            </AnimatePresence>
            <button type="button" onClick={stopDemo} className="text-space-muted hover:text-space-foreground min-h-11 shrink-0 px-2 text-sm underline underline-offset-4">
              Stop
            </button>
          </div>
          <div className="mt-3 flex gap-1" aria-hidden="true">
            {Array.from({ length: STEPS }, (_, i) => (
              <span key={i} className={cn('h-1 flex-1 rounded-full', i < caption.step ? 'bg-signal' : 'bg-space-line')} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
