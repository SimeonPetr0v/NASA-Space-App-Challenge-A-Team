import { Radiation, ShieldCheck } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { EASE_OUT } from '@/components/motion-config'
import { Panel, PanelHeader } from '@/components/Panel'
import { Action } from '@/components/ui/action'
import { CREW } from '@/data/crew'
import { MISSION_DAY_TODAY } from '@/data/missions'
import { CAREER_LIMIT_MSV, CAREER_LIMIT_SOURCE, DOSE_RATE, PRIOR_CAREER_MSV, SHELTER_STEPS, SOLAR_EVENT } from '@/data/radiation'
import { cn } from '@/lib/utils'
import { useStore } from '@/state/store'

/*
  Radiation budget (features.radiation): career dose so far + this mission's
  dose against the 600 mSv career limit, and a solar particle event drill.
  Drill doses are kept per crew member on this device.
*/

const KEY = 'ahm:radiation-drill-v1'
const loadExtra = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, number>
  } catch {
    return {}
  }
}

export function RadiationBudget() {
  const { mode, crewId } = useStore()
  const [extra, setExtra] = useState(loadExtra)
  const [event, setEvent] = useState<'idle' | 'alert' | 'sheltered'>('idle')
  const rate = DOSE_RATE[mode]
  const prior = PRIOR_CAREER_MSV[crewId]
  const mission = rate.mSvPerDay * MISSION_DAY_TODAY + (extra[crewId] ?? 0)
  const total = prior + mission
  const pct = (v: number) => `${Math.min(100, (v / CAREER_LIMIT_MSV) * 100)}%`
  const daysLeft = Math.max(0, Math.floor((CAREER_LIMIT_MSV - total) / rate.mSvPerDay))
  const status = total >= CAREER_LIMIT_MSV ? 'danger' : total >= CAREER_LIMIT_MSV * 0.8 ? 'caution' : 'normal'

  const addDose = (mSv: number) => {
    const next = { ...extra, [crewId]: (extra[crewId] ?? 0) + mSv }
    setExtra(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* keep working in memory */
    }
  }

  return (
    <Panel aria-labelledby="rad-title">
      <PanelHeader
        id="rad-title"
        title="Radiation budget"
        meta={
          <a href={CAREER_LIMIT_SOURCE.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
            Career limit {CAREER_LIMIT_MSV} mSv
          </a>
        }
      />
      <div className="grid gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="num text-3xl font-semibold tracking-tight">
            {Math.round(total)}
            <span className="text-muted-foreground text-base font-medium"> / {CAREER_LIMIT_MSV} mSv</span>
          </p>
          <p className="text-muted-foreground text-sm">
            {CREW[crewId].callsign} career dose · <span className="num">{Math.round(mission)} mSv</span> this mission ·{' '}
            <span className="num">{rate.mSvPerDay} mSv/day</span> here
          </p>
        </div>
        <div className="bg-muted relative h-3 overflow-hidden rounded-full" role="img" aria-label={`${Math.round(total)} of ${CAREER_LIMIT_MSV} millisievert used`}>
          <motion.span
            className="bg-muted-foreground/50 absolute inset-y-0 left-0 w-full origin-left"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: prior / CAREER_LIMIT_MSV }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EASE_OUT }}
          />
          <motion.span
            className={cn('absolute inset-y-0 rounded-r-full', status === 'normal' ? 'bg-primary' : status === 'caution' ? 'bg-status-caution' : 'bg-status-danger')}
            style={{ left: pct(prior), width: pct(mission) }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          />
          <span className="bg-foreground absolute inset-y-0 w-px" style={{ left: '80%' }} aria-hidden="true" />
        </div>
        <p className="text-muted-foreground text-xs">
          Grey = earlier missions, colour = this mission. Mark at 80 %. At today’s rate the limit is reached in{' '}
          <span className="num text-foreground font-semibold">{daysLeft.toLocaleString()} days</span>.{' '}
          <a href={rate.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
            {rate.label}
          </a>
        </p>

        <AnimatePresence mode="wait" initial={false}>
          {event === 'alert' ? (
            <motion.div
              key="alert"
              role="alert"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="border-status-danger bg-status-danger-soft text-status-danger-ink danger-once border-l-2 p-4"
            >
              <p className="flex items-center gap-2 font-semibold">
                <Radiation className="size-4" aria-hidden="true" /> Solar particle event: go to the storm shelter now
              </p>
              <ol className="mt-2 grid gap-1 text-sm">
                {SHELTER_STEPS.map((s, i) => (
                  <li key={s}>
                    {i + 1}. {s}
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex flex-wrap gap-2">
                <Action
                  variant="primary"
                  onClick={() => {
                    addDose(SOLAR_EVENT.shelteredMSv)
                    setEvent('sheltered')
                  }}
                >
                  <ShieldCheck aria-hidden="true" /> I am in the shelter
                </Action>
              </div>
              <p className="mt-2 text-xs">
                Sheltered: about {SOLAR_EVENT.shelteredMSv} mSv. Unsheltered it could be about {SOLAR_EVENT.unshelteredMSv} mSv (illustrative).
              </p>
            </motion.div>
          ) : event === 'sheltered' ? (
            <motion.p key="ok" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-status-ok-ink text-sm font-medium">
              Sheltered. {SOLAR_EVENT.shelteredMSv} mSv added to this mission’s dose instead of about {SOLAR_EVENT.unshelteredMSv}.
            </motion.p>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Action variant="secondary" onClick={() => setEvent('alert')}>
                <Radiation aria-hidden="true" /> Simulate solar event
              </Action>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Panel>
  )
}
