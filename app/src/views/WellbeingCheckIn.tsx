import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Panel, PanelHeader } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import { Action } from '@/components/ui/action'
import { WHO5_FOLLOWUP, WHO5_ITEMS, WHO5_OPTIONS, WHO5_SOURCE } from '@/data/wellbeing'
import { scoreWellbeing, wellbeingError } from '@/engine/wellbeing'
import { cn } from '@/lib/utils'
import { useStore } from '@/state/store'

/*
  WHO-5 well-being check-in (replaces the legacy 1–5 mood entry).
  Scoring and wording live in src/engine/wellbeing.ts and src/data/wellbeing.ts.
*/
export function WellbeingCheckIn() {
  const { addWellbeing, simNow } = useStore()
  const [answers, setAnswers] = useState<number[]>(Array(5).fill(-1))
  const [submitted, setSubmitted] = useState(false)
  const [saved, setSaved] = useState(false)
  const error = wellbeingError(answers)
  const score = error ? null : scoreWellbeing(answers)

  return (
    <Panel aria-labelledby="who5-title">
      <PanelHeader id="who5-title" title="Well-being check-in (WHO-5)" meta="Think about the last two weeks" />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitted(true)
          setSaved(false)
          if (!error && addWellbeing({ instrument: 'WHO-5', answers: [...answers], takenAt: new Date(simNow()).toISOString() })) setSaved(true)
        }}
      >
        <ol className="divide-border divide-y">
          {WHO5_ITEMS.map((item, qi) => (
            <li key={item} className="px-4 py-4 sm:px-5">
              <fieldset>
                <legend className="text-sm font-medium">
                  <span className="num text-muted-foreground mr-2">{qi + 1}</span>
                  {item}
                </legend>
                <div
                  className={cn(
                    'border-input mt-3 grid grid-cols-3 overflow-hidden rounded-sm border sm:grid-cols-6',
                    submitted && answers[qi] < 0 && 'border-status-danger',
                  )}
                >
                  {WHO5_OPTIONS.map((opt, v) => {
                    const on = answers[qi] === v
                    return (
                      <label
                        key={opt}
                        className={cn(
                          'border-input flex min-h-11 cursor-pointer items-center justify-center border-r border-b px-2 py-1.5 text-center text-xs leading-tight transition-colors sm:border-b-0 [&:nth-child(3n)]:border-r-0 sm:[&:nth-child(3n)]:border-r sm:last:border-r-0',
                          on ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                        )}
                      >
                        <input
                          type="radio"
                          name={`who5-${qi}`}
                          value={v}
                          checked={on}
                          onChange={() => {
                            setAnswers((a) => a.map((x, i) => (i === qi ? v : x)))
                            setSaved(false)
                          }}
                          className="sr-only"
                        />
                        {opt}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            </li>
          ))}
        </ol>
        <div className="border-border grid gap-3 border-t px-4 py-4 sm:px-5" aria-live="polite">
          {submitted && error && <p className="text-status-danger-ink text-sm">{error}</p>}
          {score && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3 text-sm">
              <span className="num text-lg font-semibold">{score.percent}/100</span>
              <StatusBadge status={score.needsFollowup ? 'caution' : 'normal'} />
              <span className="text-muted-foreground">
                {score.needsFollowup ? WHO5_FOLLOWUP : 'Screening cutoff not met. You can still request support at any score.'}
              </span>
            </motion.div>
          )}
          {saved && (
            <p className="text-status-ok-ink flex items-center gap-2 text-sm font-medium">
              <Check className="size-4" aria-hidden="true" /> Well-being check-in saved on this device.
            </p>
          )}
          <p className="text-muted-foreground text-sm">
            If you feel unsafe or cannot perform essential tasks safely, seek crew medical support now, regardless of the score.
          </p>
          <div>
            <Action type="submit" variant="primary">
              Save well-being check-in
            </Action>
          </div>
          <p className="text-subtle-foreground text-xs leading-relaxed">
            Self-report screening, not a diagnosis or fitness-for-duty decision; not validated for spaceflight. WHO-5 items and response options ©
            World Health Organization 2024,{' '}
            <a className="underline" href={WHO5_SOURCE} target="_blank" rel="noreferrer">
              source
            </a>
            ,{' '}
            <a className="underline" href="https://creativecommons.org/licenses/by-nc-sa/3.0/igo/" target="_blank" rel="noreferrer">
              CC BY-NC-SA 3.0 IGO
            </a>
            . Noncommercial educational use; no WHO endorsement.
          </p>
        </div>
      </form>
    </Panel>
  )
}
