import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { BP_LIMITS, INPUT_LIMITS } from '@/data/input-limits'
import { INDICATORS } from '@/data/indicators'
import { assess } from '@/engine/assess'
import type { IndicatorId, Reading } from '@/engine/types'
import { readingError } from '@/engine/validate'
import { StatusBadge } from './StatusBadge'
import { Button } from './ui/button'

const timestampNow = () => new Date().toISOString()

export function ReadingForm({ onSave }: { onSave: (reading: Reading) => boolean }) {
  const [id, setId] = useState<IndicatorId>('hr')
  const [value, setValue] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saved, setSaved] = useState(false)
  const definition = INDICATORS[id]
  const limit = id === 'bp' ? BP_LIMITS.systolic : INPUT_LIMITS[id]
  const reading: Reading = {
    indicatorId: id,
    value:
      id === 'bp'
        ? {
            systolic: value.trim() ? Number(value) : Number.NaN,
            diastolic: diastolic.trim() ? Number(diastolic) : Number.NaN,
          }
        : value.trim()
          ? Number(value)
          : Number.NaN,
    takenAt: '2000-01-01T00:00:00.000Z',
    source: 'manual',
  }
  const error = readingError(reading)
  const inputClass =
    'bg-background min-h-11 w-full rounded-md border px-3 focus-visible:outline-2 focus-visible:outline-ring'

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    setSaved(false)
    if (!error && onSave({ ...reading, takenAt: timestampNow() })) {
      setValue('')
      setDiastolic('')
      setSubmitted(false)
      setSaved(true)
    }
  }

  return (
    <section className="bg-card rounded-xl border p-5" aria-labelledby="entry-title">
      <h2 id="entry-title" className="mb-4 text-lg font-semibold">Log a measurement</h2>
      <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
        <label className="grid gap-2">Indicator
          <select
            className={inputClass}
            value={id}
            onChange={(event) => {
              setId(event.target.value as IndicatorId)
              setValue('')
              setDiastolic('')
              setSubmitted(false)
              setSaved(false)
            }}
          >
            {Object.values(INDICATORS)
              .filter((indicator) => indicator.id !== 'mood')
              .map((indicator) => <option key={indicator.id} value={indicator.id}>{indicator.label}</option>)}
          </select>
        </label>
        <p className="text-muted-foreground text-sm">{definition.howToMeasure}</p>
        <p className="text-muted-foreground text-sm">
          {id === 'bp' ? BP_LIMITS.note : INPUT_LIMITS[id].note}
        </p>
        <a
          className="text-sm underline"
          href={id === 'bp' ? BP_LIMITS.sourceUrl : INPUT_LIMITS[id].sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Entry range source (not a safe range)
        </a>
        <label className="grid gap-2">{id === 'bp' ? 'Systolic' : definition.label} ({definition.unit})
          <input
            className={inputClass}
            type="number"
            min={limit.min}
            max={limit.max}
            step={limit.step}
            value={value}
            aria-invalid={Boolean(error && (submitted || value))}
            aria-describedby="reading-feedback"
            onChange={(event) => {
              setValue(event.target.value)
              setSaved(false)
            }}
          />
        </label>
        {id === 'bp' && <label className="grid gap-2">Diastolic (mmHg)
          <input
            className={inputClass}
            type="number"
            min={BP_LIMITS.diastolic.min}
            max={BP_LIMITS.diastolic.max}
            step={1}
            value={diastolic}
            aria-invalid={Boolean(error && (submitted || diastolic))}
            aria-describedby="reading-feedback"
            onChange={(event) => {
              setDiastolic(event.target.value)
              setSaved(false)
            }}
          />
        </label>}
        <div id="reading-feedback" aria-live="polite">
          {error
            ? (submitted || value) && <p>{error}</p>
            : <StatusBadge status={assess(reading).status} />}
          {saved && <p>Measurement saved on this device.</p>}
        </div>
        <a className="text-sm underline" href={definition.sourceUrl} target="_blank" rel="noreferrer">
          Assessment source (defaults pending science review)
        </a>
        <Button className="min-h-11" type="submit">Save reading</Button>
      </form>
    </section>
  )
}
