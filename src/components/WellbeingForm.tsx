import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { WHO5_FOLLOWUP, WHO5_ITEMS, WHO5_OPTIONS, WHO5_SOURCE } from '@/data/wellbeing'
import { scoreWellbeing, wellbeingError } from '@/engine/wellbeing'
import type { WellbeingCheck } from '@/engine/wellbeing'
import { Button } from './ui/button'

const timestampNow = () => new Date().toISOString()

export function WellbeingForm({ onSave }: { onSave: (check: WellbeingCheck) => boolean }) {
  const [answers, setAnswers] = useState<number[]>(Array(5).fill(-1))
  const [submitted, setSubmitted] = useState(false)
  const [saved, setSaved] = useState(false)
  const error = wellbeingError(answers)
  const score = error ? null : scoreWellbeing(answers)

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    setSaved(false)
    if (!error && onSave({ instrument: 'WHO-5', answers: [...answers], takenAt: timestampNow() })) {
      setSaved(true)
    }
  }

  return (
    <section className="bg-card grid gap-4 rounded-xl border p-5" aria-labelledby="wellbeing-title">
      <h2 className="text-lg font-semibold" id="wellbeing-title">Well-being check-in (WHO-5)</h2>
      <p>Think about the last two weeks. Choose how often each statement was true for you.</p>
      <p className="text-muted-foreground text-sm">
        This personal self-report checks several aspects of well-being. It does not diagnose a condition
        or establish fitness for duty, and it has not been validated here for spaceflight.
      </p>
      <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
        {WHO5_ITEMS.map((item, index) => (
          <label className="grid gap-2" key={item}>{item}
            <select
              className="bg-background min-h-11 w-full rounded-md border px-3 focus-visible:outline-2 focus-visible:outline-ring"
              value={answers[index] < 0 ? '' : answers[index]}
              aria-invalid={submitted && answers[index] < 0}
              aria-describedby="wellbeing-feedback"
              onChange={(event) => {
                setAnswers((previous) =>
                  previous.map((answer, answerIndex) =>
                    answerIndex === index
                      ? event.target.value === '' ? -1 : Number(event.target.value)
                      : answer,
                  ),
                )
                setSaved(false)
              }}
            >
              <option value="">Choose frequency</option>
              {WHO5_OPTIONS.map((option, value) => <option value={value} key={option}>{option}</option>)}
            </select>
          </label>
        ))}
        <div id="wellbeing-feedback" aria-live="polite">
          {submitted && error && <p>{error}</p>}
          {score && (
            <p>
              WHO-5 score: {score.percent}/100.{' '}
              {score.needsFollowup
                ? WHO5_FOLLOWUP
                : 'The screening cutoff is not met. You can still request support at any score.'}
            </p>
          )}
          {saved && <p>Well-being check-in saved on this device.</p>}
        </div>
        <p className="text-sm">
          If you feel unsafe or cannot perform essential tasks safely, seek crew medical support now
          regardless of the score.
        </p>
        <Button className="min-h-11" type="submit">Save well-being check-in</Button>
      </form>
      <p className="text-muted-foreground text-xs">
        WHO-5 items and response options © World Health Organization 2024.{' '}
        <a className="underline" href={WHO5_SOURCE} target="_blank" rel="noreferrer">Source</a>
        {' · '}
        <a
          className="underline"
          href="https://creativecommons.org/licenses/by-nc-sa/3.0/igo/"
          target="_blank"
          rel="noreferrer"
        >
          CC BY-NC-SA 3.0 IGO
        </a>
        . Noncommercial educational use; no WHO endorsement. Answers stay in this browser and are
        visible to anyone with access to this browser profile.
      </p>
    </section>
  )
}
