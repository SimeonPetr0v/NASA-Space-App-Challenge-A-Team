import { PageBanner } from '@/components/PageBanner'
import { FEATURES } from '@/config/features'
import { CameraPulse } from '@/features/camera-pulse/CameraPulse'
import { Page } from '@/shell/Page'
import { Check, Minus, Plus, Send } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { staggerChild, staggerParent } from '@/components/motion-config'
import { useMemo, useState } from 'react'
import { Panel, PanelHeader } from '@/components/Panel'
import { StatusBadge, StatusGlyph } from '@/components/StatusBadge'
import { STATUS_META } from '@/components/status-meta'
import { Action, ActionLink } from '@/components/ui/action'
import { INDICATOR_GROUPS, INDICATORS } from '@/data/indicators'
import { BP_LIMITS, INPUT_LIMITS } from '@/data/input-limits'
import { readingError } from '@/engine/validate'
import { WellbeingCheckIn } from '@/views/WellbeingCheckIn'
import { classify, formatValue, summarize, assess } from '@/engine/assess'
import type { IndicatorId, Reading, ReadingValue } from '@/engine/types'
import { cn } from '@/lib/utils'
import { href } from '@/state/route'
import { useStore } from '@/state/store'
import { useHealth } from '@/state/useHealth'

/*
  Data entry with instant status preview (astro-ui-design §9): steppers with the
  last value as default, unit always visible, validation as you type, and the
  assessment shown before saving.
*/

type Draft = Record<string, string>

const fieldKeys = (id: IndicatorId) => (id === 'bp' ? ['bp.sys', 'bp.dia'] : [id])

function initialDraft(readings: Reading[]): Draft {
  const d: Draft = {}
  for (const r of readings) {
    if (typeof r.value === 'number') d[r.indicatorId] = formatValue(r.indicatorId, r.value)
    else {
      d['bp.sys'] = String(r.value.systolic)
      d['bp.dia'] = String(r.value.diastolic)
    }
  }
  return d
}

/* Entry envelopes and messages come from src/engine/validate.ts + src/data/input-limits.ts */
function limitsOf(k: string): { min: number; max: number } {
  if (k === 'bp.sys') return BP_LIMITS.systolic
  if (k === 'bp.dia') return BP_LIMITS.diastolic
  return INPUT_LIMITS[k as Exclude<IndicatorId, 'bp'>]
}

function parse(id: IndicatorId, draft: Draft): { value?: ReadingValue; error?: string } {
  let value: ReadingValue
  if (id === 'bp') {
    if (!draft['bp.sys'] || !draft['bp.dia']) return { error: 'Enter both blood pressure values.' }
    value = { systolic: Number(draft['bp.sys']), diastolic: Number(draft['bp.dia']) }
  } else {
    if (draft[id] === undefined || draft[id] === '') return { error: 'Enter a number.' }
    value = Number(draft[id])
  }
  const error = readingError({ indicatorId: id, value, takenAt: new Date().toISOString(), source: 'manual' })
  return error ? { error } : { value }
}

function Stepper({ id, k, label, draft, setDraft, invalid }: { id: IndicatorId; k: string; label: string; draft: Draft; setDraft: (d: Draft) => void; invalid: boolean }) {
  const def = INDICATORS[id]
  const { step, decimals } = def.input
  const { min, max } = limitsOf(k)
  const bump = (dir: 1 | -1) => {
    const cur = Number(draft[k] || 0)
    const next = Math.min(max, Math.max(min, Math.round((cur + dir * step) * 10 ** decimals) / 10 ** decimals))
    setDraft({ ...draft, [k]: next.toFixed(decimals) })
  }
  const inputId = `f-${k}`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-muted-foreground text-xs">
        {label}
      </label>
      <div className={cn('border-input bg-card flex h-11 w-full max-w-[13rem] items-stretch rounded-sm border', invalid && 'border-status-danger')}>
        <button type="button" onClick={() => bump(-1)} aria-label={`Decrease ${label}`} className="text-muted-foreground hover:bg-muted hover:text-foreground border-input flex w-11 shrink-0 items-center justify-center border-r">
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <input
          id={inputId}
          inputMode="decimal"
          value={draft[k] ?? ''}
          aria-invalid={invalid}
          aria-describedby={`${id}-msg`}
          onChange={(e) => setDraft({ ...draft, [k]: e.target.value.replace(',', '.') })}
          className="num min-w-0 flex-1 bg-transparent px-2 text-center text-lg font-semibold outline-none"
        />
        <span className="text-muted-foreground flex items-center pr-3 text-xs">{def.unit}</span>
        <button type="button" onClick={() => bump(1)} aria-label={`Increase ${label}`} className="text-muted-foreground hover:bg-muted hover:text-foreground border-input flex w-11 shrink-0 items-center justify-center border-l">
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export function LogReading() {
  const { readings: latest } = useHealth()
  const { addReadings, history, simNow, sendReport, storageError } = useStore()
  const [draft, setDraft] = useState<Draft>(() => initialDraft(latest))
  const [include, setInclude] = useState<Record<IndicatorId, boolean>>(() => ({ hr: true, bp: true, spo2: true, temp: true, glu: false, sleep: true, mood: false, exercise: true }))
  const [saved, setSaved] = useState<number | null>(null)

  const parsed = useMemo(() => {
    const out = {} as Record<IndicatorId, { value?: ReadingValue; error?: string }>
    for (const g of INDICATOR_GROUPS) for (const id of g.ids) out[id] = parse(id, draft)
    return out
  }, [draft])

  const ids = INDICATOR_GROUPS.flatMap((g) => g.ids)
  const chosen = ids.filter((id) => include[id])
  const errors = chosen.filter((id) => parsed[id].error)
  const preview = useMemo(() => {
    const now = new Date(simNow()).toISOString()
    const rs: Reading[] = chosen.flatMap((id) => (parsed[id].value !== undefined ? [{ indicatorId: id, value: parsed[id].value!, takenAt: now, source: 'manual' as const }] : []))
    return { rs, assessments: rs.map((r) => assess(r, history)) }
  }, [chosen, parsed, history, simNow])
  const sum = summarize(preview.assessments)

  const save = () => {
    if (errors.length || preview.rs.length === 0) return
    if (!addReadings(preview.rs)) return
    sendReport(preview.assessments, preview.rs, 'Health check report')
    setSaved(preview.rs.length)
  }

  if (saved !== null) {
    return (
      <Page>
      <Panel className="view-in mx-auto max-w-xl p-6 sm:p-8">
        <p className="text-status-ok-ink flex items-center gap-2 text-sm font-semibold">
          <Check className="size-4" aria-hidden="true" /> Saved
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">{saved} readings saved and sent to Earth</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          The overview and trends now use these values. Overall result: <StatusBadge status={sum.overall} className="align-middle" />
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <ActionLink variant="primary" href={href('overview')}>
            View overview
          </ActionLink>
          <ActionLink href={href('link')}>Open Earth link</ActionLink>
          <Action variant="ghost" onClick={() => setSaved(null)}>Log another</Action>
        </div>
      </Panel>
      </Page>
    )
  }

  return (
    <>
    <PageBanner eyebrow="Morning check" title="Log a reading">
      Values start at your last reading. Status updates as you type; saving sends the report to Earth.
    </PageBanner>
    <Page>
    <div className="view-in grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid min-w-0 gap-6">
      {storageError && (
        <p role="alert" className="border-status-danger bg-status-danger-soft text-status-danger-ink border-l-2 px-4 py-3 text-sm">
          {storageError}
        </p>
      )}
      {FEATURES.cameraPulse && <CameraPulse onSaved={(bpm) => setDraft((d) => ({ ...d, hr: String(bpm) }))} />}
      <Panel aria-labelledby="form-title">
        <PanelHeader id="form-title" title="New reading" meta="Untick anything you did not measure." />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <motion.div variants={staggerParent} initial="hidden" animate="show">
          {INDICATOR_GROUPS.map((g) => (
            <motion.fieldset variants={staggerChild} key={g.title} className="border-border border-b px-4 py-4 sm:px-5">
              <legend className="label text-muted-foreground float-left mb-3 w-full">{g.title}</legend>
              <div className="clear-both grid gap-5">
                {g.ids.map((id) => {
                  const def = INDICATORS[id]
                  const p = parsed[id]
                  const status = p.value !== undefined ? classify(id, p.value) : 'no-data'
                  const on = include[id]
                  return (
                    <div key={id} className={cn('grid gap-3 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-6', !on && 'opacity-55')}>
                      <div>
                        <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={(e) => setInclude({ ...include, [id]: e.target.checked })}
                            className="accent-primary mt-0.5 size-4 shrink-0"
                          />
                          <span>
                            <span className="block text-sm font-medium">{def.label}</span>
                            <span className="text-muted-foreground block text-xs leading-snug">{def.howToMeasure}</span>
                          </span>
                        </label>
                      </div>
                      {on && (
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-end gap-3">
                            {(
                              fieldKeys(id).map((k) => (
                                <Stepper key={k} id={id} k={k} label={k === 'bp.sys' ? 'Systolic' : k === 'bp.dia' ? 'Diastolic' : `${def.label}`} draft={draft} setDraft={setDraft} invalid={Boolean(p.error)} />
                              ))
                            )}
                          </div>
                          <p id={`${id}-msg`} className="flex min-h-5 items-center gap-2 text-xs" aria-live="polite">
                            {p.error ? (
                              <span className="text-status-danger-ink">{p.error}</span>
                            ) : (
                              <>
                                <motion.span key={status} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                                  <StatusBadge status={status} />
                                </motion.span>
                                <span className="text-muted-foreground">Normal {def.ranges.normal} {def.unit}</span>
                              </>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.fieldset>
          ))}
          </motion.div>
          <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
            <Action type="submit" variant="primary" disabled={errors.length > 0 || preview.rs.length === 0}>
              <Send aria-hidden="true" /> Save and send {preview.rs.length} readings
            </Action>
            <ActionLink variant="ghost" href={href('overview')}>
              Cancel
            </ActionLink>
            {errors.length > 0 && <p className="text-status-danger-ink text-sm">Fix {errors.length} field{errors.length > 1 ? 's' : ''} to save.</p>}
          </div>
        </form>
      </Panel>
      <WellbeingCheckIn />
      </div>

      <Panel aria-labelledby="preview-title" className="lg:sticky lg:top-20">
        <PanelHeader id="preview-title" title="Preview" meta="Updates as you type" />
        <div className="p-4 sm:p-5">
          <p className="label text-muted-foreground">Result if saved</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={sum.overall}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className={cn('mt-1 flex origin-left items-center gap-2 text-xl font-semibold uppercase', STATUS_META[sum.overall].ink)}
            >
              <StatusGlyph status={sum.overall} className="size-4" />
              {STATUS_META[sum.overall].word}
            </motion.p>
          </AnimatePresence>
          <ul className="border-border mt-4 border-t">
            {preview.rs.map((r, i) => (
              <li key={r.indicatorId} className="border-border flex items-center justify-between gap-3 border-b py-2 text-sm">
                <span className="truncate">{INDICATORS[r.indicatorId].label}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="num text-muted-foreground text-xs">
                    {formatValue(r.indicatorId, r.value)} {INDICATORS[r.indicatorId].unit}
                  </span>
                  <StatusBadge status={preview.assessments[i].status} className="w-24 justify-end" />
                </span>
              </li>
            ))}
          </ul>
          {sum.priority[0]?.guidance && (
            <div className="mt-4">
              <p className="label text-muted-foreground">Guidance after saving</p>
              <p className="mt-1 text-sm font-medium">{INDICATORS[sum.priority[0].indicatorId].label}</p>
              <ul className="text-muted-foreground mt-1 grid gap-1 text-sm">
                {sum.priority[0].guidance.doNow.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          )}
          {sum.combinations.map((c) => (
            <p key={c.id} className="border-status-caution bg-status-caution-soft mt-4 border-l-2 px-3 py-2 text-sm">
              <span className="font-semibold">{c.title}.</span> {c.detail}
            </p>
          ))}
        </div>
      </Panel>
    </div>
    </Page>
    </>
  )
}
