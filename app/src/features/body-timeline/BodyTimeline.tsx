import { Clock } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { EASE_OUT } from '@/components/motion-config'
import { HAZARD_SOURCE_URL } from '@/data/indicators'
import { MISSION_DAY_TODAY } from '@/data/missions'
import { effectsAt, TIMELINE_MAX_DAY } from './timeline'

/*
  Body over mission time (features.bodyTimeline). A slider from day 1 to 180
  drives the 3D body: weight-bearing bone fades (about 1-1.5 % density lost
  per month without countermeasures) and the eyes are tinted for the fluid
  shift toward the head and the SANS eye changes seen after weeks in flight.
  Rates from NASA HRP; the visual is illustrative, not to scale.
*/

export function BodyTimelineToggle({ day, onChange }: { day: number | null; onChange: (d: number | null) => void }) {
  return (
    <button
      type="button"
      aria-pressed={day !== null}
      onClick={() => onChange(day === null ? MISSION_DAY_TODAY : null)}
      className="bg-card border-border-strong hover:bg-muted flex min-h-11 items-center gap-2 rounded-sm border px-3 text-sm font-medium"
    >
      <Clock className="size-4" aria-hidden="true" /> {day === null ? 'Body over time' : 'Hide timeline'}
    </button>
  )
}

export function BodyTimelinePanel({ day, onChange }: { day: number | null; onChange: (d: number) => void }) {
  return (
    <AnimatePresence>
      {day !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          className="bg-card/95 border-border-strong absolute inset-x-3 bottom-10 z-20 rounded-md border p-3 shadow-[var(--shadow-pop)] backdrop-blur sm:right-auto sm:w-80"
        >
          <label className="grid gap-1">
            <span className="flex items-baseline justify-between text-sm">
              <span className="font-semibold">Mission day</span>
              <span className="num text-lg font-semibold">{day}</span>
            </span>
            <input
              type="range"
              min={1}
              max={TIMELINE_MAX_DAY}
              value={day}
              onChange={(e) => onChange(Number(e.target.value))}
              className="accent-primary h-8 w-full"
              aria-label="Mission day for the body changes"
            />
          </label>
          <dl className="mt-1 grid gap-1 text-xs">
            {(() => {
              const e = effectsAt(day)
              return (
                <>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Hip and spine bone density</dt>
                    <dd className="num font-semibold">
                      −{e.boneLossPct.low.toFixed(1)} to −{e.boneLossPct.high.toFixed(1)} %
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Fluid moved toward the head</dt>
                    <dd className="num font-semibold">~{e.fluidL.toFixed(1)} L</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Eye changes (SANS) risk</dt>
                    <dd className="font-semibold">{day < 14 ? 'low' : day < 90 ? 'rising' : 'high'}</dd>
                  </div>
                </>
              )
            })()}
          </dl>
          <p className="text-muted-foreground mt-2 text-[11px] leading-snug">
            Without exercise countermeasures. Rates from{' '}
            <a href={HAZARD_SOURCE_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              NASA HRP
            </a>
            ; the 3D view is illustrative, not to scale.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
