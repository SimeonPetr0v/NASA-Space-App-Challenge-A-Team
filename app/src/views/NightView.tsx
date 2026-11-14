import { Moon } from 'lucide-react'
import { PageBanner } from '@/components/PageBanner'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { EASE_OUT } from '@/components/motion-config'
import { StatusGlyph } from '@/components/StatusBadge'
import { STATUS_META } from '@/components/status-meta'
import { Action } from '@/components/ui/action'
import { INDICATORS } from '@/data/indicators'
import { assess, classify } from '@/engine/assess'
import type { Reading } from '@/engine/types'
import { delayText, utcTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useSimNow, useStore } from '@/state/store'

const PANEL_MOTION = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: EASE_OUT },
} as const
import { useHealth } from '@/state/useHealth'

/*
  Sleep shift page (docs/night-mode.md): status, one action and three quick night
  actions for a crew member who wakes up. Night mode itself is a token swap for
  the whole app (warm, low-blue, no looping motion). Danger still escalates.
*/

type Panel = null | 'waking' | 'vitals' | 'unwell'

const REASONS = ['Noise', 'Temperature', 'Worry', 'Bathroom', 'Other']

export function NightView() {
  const { theme, setTheme, logWaking, wakings, addReadings, sendReport, history, delaySec, simNow } = useStore()
  const { readings, assessments, summary } = useHealth()
  const now = useSimNow(10_000)
  const [panel, setPanel] = useState<Panel>(null)
  const [done, setDone] = useState<string | null>(null)
  const [hr, setHr] = useState('')
  const [spo2, setSpo2] = useState('')
  const meta = STATUS_META[summary.overall]
  const top = summary.priority[0]

  const quickStatus = (() => {
    const h = Number(hr)
    const s = Number(spo2)
    if (!hr || !spo2 || Number.isNaN(h) || Number.isNaN(s)) return null
    return [classify('hr', h), classify('spo2', s)]
  })()

  return (
    <>
      <PageBanner eyebrow={`Sleep shift · ${utcTime(now)} UTC`} title="Rest well">
        Only what you need if you wake up. The full app stays in warm, low-blue colours until day mode.
      </PageBanner>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-10 sm:py-14">
        <section aria-labelledby="night-status" className={cn(summary.overall === 'danger' && 'danger-once')}>
          <p id="night-status" className="label text-muted-foreground">
            Overall status
          </p>
          <p className={cn('mt-2 flex items-center gap-3 text-4xl font-semibold tracking-tight uppercase', meta.ink)}>
            <StatusGlyph status={summary.overall} className="size-7" />
            {meta.word}
          </p>
          {top?.guidance ? (
            <p className="mt-4 text-lg leading-snug">
              <span className="text-muted-foreground">{INDICATORS[top.indicatorId].label}: </span>
              {top.guidance.doNow[0]}
            </p>
          ) : (
            <p className="text-muted-foreground mt-4 text-lg">Nothing needs attention. Rest well.</p>
          )}
          {summary.overall === 'danger' && (
            <p className="border-status-danger bg-status-danger-soft text-status-danger-ink mt-4 border-l-2 px-4 py-3 text-sm font-semibold">
              A reading needs action now. Tell the crew medical officer.
            </p>
          )}
        </section>

        <section aria-label="Night actions" className="grid gap-2">
          {(
            [
              ['waking', 'Log night waking'],
              ['vitals', 'Quick vitals'],
              ['unwell', 'I feel unwell'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-expanded={panel === k}
              onClick={() => {
                setDone(null)
                setPanel(panel === k ? null : k)
              }}
              className={cn('border-border-strong hover:bg-muted flex min-h-14 items-center justify-between rounded-sm border px-5 text-left text-base font-medium', panel === k && 'bg-muted')}
            >
              {label}
              <span aria-hidden="true" className="text-muted-foreground text-sm">
                {panel === k ? 'Close' : 'Open'}
              </span>
            </button>
          ))}
        </section>

        {done && (
          <p role="status" className="text-status-ok-ink text-sm font-medium">
            {done}
          </p>
        )}

        <AnimatePresence mode="wait" initial={false}>
        {panel === 'waking' && (
          <motion.div key="waking" {...PANEL_MOTION}>
          <section aria-label="Why did you wake up?" className="grid gap-3">
            <p className="text-muted-foreground text-sm">Why did you wake up? {wakings.length > 0 && <span className="num">({wakings.length} logged)</span>}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {REASONS.map((r) => (
                <Action
                  key={r}
                  onClick={() => {
                    logWaking(r)
                    setDone(`Waking logged at ${utcTime(simNow())} UTC. It will feed tomorrow’s sleep entry.`)
                    setPanel(null)
                  }}
                >
                  {r}
                </Action>
              ))}
            </div>
          </section>
          </motion.div>
        )}

        {panel === 'vitals' && (
          <motion.div key="vitals" {...PANEL_MOTION}>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!quickStatus) return
              const at = new Date(simNow()).toISOString()
              const rs: Reading[] = [
                { indicatorId: 'hr', value: Number(hr), takenAt: at, source: 'manual' },
                { indicatorId: 'spo2', value: Number(spo2), takenAt: at, source: 'manual' },
              ]
              addReadings(rs)
              const worst = rs.map((r) => assess(r, history).status)
              setDone(`Saved. Heart rate ${STATUS_META[worst[0]].word.toLowerCase()}, oxygen ${STATUS_META[worst[1]].word.toLowerCase()}.`)
              setPanel(null)
            }}
          >
            {(
              [
                ['Heart rate', 'bpm', hr, setHr],
                ['Oxygen saturation', '%', spo2, setSpo2],
              ] as const
            ).map(([label, unit, v, set], i) => (
              <label key={label} className="grid gap-1">
                <span className="text-muted-foreground text-sm">
                  {label} ({unit})
                </span>
                <span className="flex items-center gap-3">
                  <input
                    inputMode="numeric"
                    value={v}
                    onChange={(e) => set(e.target.value)}
                    className="num border-input bg-card h-14 w-40 rounded-sm border px-4 text-2xl font-semibold outline-none"
                  />
                  {quickStatus && (
                    <span className={cn('flex items-center gap-2 text-sm font-semibold uppercase', STATUS_META[quickStatus[i]].ink)}>
                      <StatusGlyph status={quickStatus[i]} /> {STATUS_META[quickStatus[i]].word}
                    </span>
                  )}
                </span>
              </label>
            ))}
            <div>
              <Action type="submit" variant="primary" disabled={!quickStatus}>
                Save quick vitals
              </Action>
            </div>
          </form>
          </motion.div>
        )}

        {panel === 'unwell' && (
          <motion.div key="unwell" {...PANEL_MOTION}>
          <section aria-label="Feeling unwell" className="grid gap-3 text-base">
            <ol className="grid gap-2">
              <li>1. Sit or lie down and stay where you are.</li>
              <li>2. Wake the crew medical officer.</li>
              <li>3. Measure heart rate and oxygen if you can.</li>
            </ol>
            <p className="text-muted-foreground text-sm">A report to the flight surgeon takes {delayText(delaySec)} to reach Earth. Do not wait for the reply to act.</p>
            <div>
              <Action
                variant="primary"
                onClick={() => {
                  sendReport(assessments, readings, 'Crew member feels unwell (night)')
                  setDone(`Report sent at ${utcTime(simNow())} UTC. Arrives on Earth in ${delayText(delaySec)}.`)
                  setPanel(null)
                }}
              >
                Notify flight surgeon
              </Action>
            </div>
          </section>
          </motion.div>
        )}
        </AnimatePresence>
        {theme === 'day' && (
          <Action variant="secondary" onClick={() => setTheme('night')}>
            <Moon aria-hidden="true" /> Turn on night colours
          </Action>
        )}
      </div>
    </>
  )
}
