import { PageBanner } from '@/components/PageBanner'
import { RevealGrid } from '@/components/motion'
import { Page } from '@/shell/Page'
import { Send, Stethoscope } from 'lucide-react'
import { Panel, PanelHeader } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import { Action } from '@/components/ui/action'
import { INDICATORS } from '@/data/indicators'
import { MISSIONS } from '@/data/missions'
import { formatValue, worstStatus } from '@/engine/assess'
import type { LinkMessage } from '@/engine/types'
import { countdown, delayText, utcTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useSimNow, useStore } from '@/state/store'
import { useHealth } from '@/state/useHealth'

/*
  Flight surgeon view (docs/flight-surgeon-view.md). Reports and replies travel
  with the real one-way light-time delay for the mission mode. Simulated in the
  browser; sped-up time is labelled.
*/

const REPLIES = [
  'Report received. Continue the guidance shown and re-measure in 1 hour.',
  'Rest for the remainder of this shift and increase fluids to 2.5 L today.',
  'Re-measure heart rate and temperature every 4 hours and send the next report.',
  'Start the onboard medical kit protocol discussed pre-flight; CMO to supervise.',
  'Schedule a private medical conference at the next communication window.',
]

const SPEEDS = [1, 60, 600]

function Transit({ msg, now }: { msg: LinkMessage; now: number }) {
  const start = Date.parse(msg.createdAt)
  const end = Date.parse(msg.arrivesAt)
  const p = end > start ? Math.min(1, (now - start) / (end - start)) : 1
  const arrived = now >= end
  return (
    <div className="mt-2">
      <div className="bg-muted relative h-1 overflow-hidden" aria-hidden="true">
        <div className={cn('absolute inset-y-0 left-0', arrived ? 'bg-foreground/30' : 'bg-primary')} style={{ width: `${p * 100}%` }} />
      </div>
      <p className="num text-muted-foreground mt-1.5 text-xs" aria-live="off">
        {arrived ? `Delivered ${utcTime(end)} UTC` : `In transit · arrives in ${countdown(end - now)}`}
      </p>
    </div>
  )
}

function ReportBody({ msg }: { msg: LinkMessage }) {
  const a = msg.payload.assessments ?? []
  const off = a.filter((x) => x.status === 'caution' || x.status === 'danger')
  const readings = msg.payload.readings ?? []
  return (
    <div className="mt-2 text-sm">
      <div className="flex items-center gap-3">
        <span className="font-medium">{msg.payload.note ?? 'Health report'}</span>
        <StatusBadge status={worstStatus(a)} />
      </div>
      {off.length > 0 && (
        <ul className="text-muted-foreground mt-1.5 grid gap-0.5 text-xs">
          {off.map((x) => {
            const r = readings.find((rr) => rr.indicatorId === x.indicatorId)
            return (
              <li key={x.indicatorId} className="num">
                {INDICATORS[x.indicatorId].label}: {r ? `${formatValue(x.indicatorId, r.value)} ${INDICATORS[x.indicatorId].unit}` : ''} ({x.status})
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function EarthLink() {
  const store = useStore()
  const { messages, mode, delaySec, marsDelayMin, setMarsDelayMin, clock, setSpeed, sendReport, sendReply } = store
  const { readings, assessments } = useHealth()
  const now = useSimNow(250)
  const mission = MISSIONS[mode]
  const reports = messages.filter((m) => m.kind === 'report')
  const replies = messages.filter((m) => m.kind === 'reply')
  const inbox = reports.filter((m) => now >= Date.parse(m.arrivesAt))
  const inFlight = messages.filter((m) => now < Date.parse(m.arrivesAt))

  return (
    <>
    <PageBanner eyebrow="Distance from Earth" title="Earth link">
      Reports and replies travel at the speed of light. Far from Earth, the crew acts first.
    </PageBanner>
    <Page>
    <RevealGrid className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Panel aria-labelledby="link-title">
        <PanelHeader
          id="link-title"
          title={`Signal path · ${mission.name}`}
          meta={<span className="num">{delayText(delaySec)} one way · {delayText(delaySec * 2)} round trip</span>}
        />
        <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flex items-center gap-3 text-xs">
              <span className="label text-muted-foreground w-12">Crew</span>
              <div className="bg-border relative h-px flex-1">
                {inFlight.map((m) => {
                  const s = Date.parse(m.createdAt)
                  const e = Date.parse(m.arrivesAt)
                  const p = Math.min(1, Math.max(0, (now - s) / Math.max(1, e - s)))
                  const pos = m.direction === 'to-earth' ? p : 1 - p
                  return (
                    <span
                      key={m.id}
                      aria-hidden="true"
                      className={cn('absolute top-1/2 h-2.5 w-6 -translate-x-1/2 -translate-y-1/2', m.direction === 'to-earth' ? 'bg-primary' : 'bg-foreground')}
                      style={{ left: `${pos * 100}%` }}
                    />
                  )
                })}
              </div>
              <span className="label text-muted-foreground w-12 text-right">Earth</span>
            </div>
            <p className="text-muted-foreground mt-3 text-sm">{mission.context}</p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            {mission.delayRangeMin && (
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">
                  One-way delay <span className="num text-foreground font-semibold">{marsDelayMin} min</span>
                </span>
                <input
                  type="range"
                  min={mission.delayRangeMin[0]}
                  max={mission.delayRangeMin[1]}
                  value={marsDelayMin}
                  onChange={(e) => setMarsDelayMin(Number(e.target.value))}
                  className="accent-primary h-11 w-44"
                />
              </label>
            )}
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">Demo clock</span>
              <div role="radiogroup" aria-label="Demo time speed" className="border-border-strong flex h-11 rounded-sm border">
                {SPEEDS.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={clock.speed === s}
                    onClick={() => setSpeed(s)}
                    className={cn('num px-3 text-xs font-medium', i > 0 && 'border-border-strong border-l', clock.speed === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                  >
                    ×{s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {clock.speed > 1 && (
          <p className="border-border bg-status-caution-soft text-status-caution-ink border-t px-4 py-2 text-xs font-semibold sm:px-5">
            Time ×{clock.speed}: simulated for the demo, not real time.
          </p>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel aria-labelledby="crew-title">
          <PanelHeader id="crew-title" title="Crew side" meta="CM-2 (synthetic) · guidance is shown immediately" />
          <div className="border-border flex flex-wrap gap-2 border-b p-4 sm:p-5">
            <Action variant="primary" onClick={() => sendReport(assessments, readings, 'Health report')}>
              <Send aria-hidden="true" /> Send health report
            </Action>
            <Action variant="secondary" onClick={() => sendReport(assessments, readings, 'Crew member feels unwell')}>
              I feel unwell
            </Action>
          </div>
          <ul aria-label="Crew messages" className="divide-border divide-y">
            {messages.length === 0 && <li className="text-muted-foreground p-4 text-sm sm:p-5">No messages yet. Send a report to start the link.</li>}
            {[...messages]
              .filter((m) => m.direction === 'to-earth' || now >= Date.parse(m.arrivesAt))
              .reverse()
              .map((m) => (
                <li key={m.id} className="p-4 sm:p-5">
                  <p className="label text-muted-foreground">
                    {m.direction === 'to-earth' ? 'Sent to Earth' : 'Reply from flight surgeon'} · <span className="num">{utcTime(Date.parse(m.createdAt))} UTC</span>
                  </p>
                  {m.kind === 'report' ? <ReportBody msg={m} /> : <p className="mt-2 text-sm">{m.payload.replyTemplate}</p>}
                  {m.direction === 'to-earth' && <Transit msg={m} now={now} />}
                </li>
              ))}
            {replies
              .filter((m) => now < Date.parse(m.arrivesAt))
              .map((m) => (
                <li key={`pending-${m.id}`} className="bg-muted/50 p-4 sm:p-5">
                  <p className="label text-muted-foreground">Reply from Earth on its way</p>
                  <Transit msg={m} now={now} />
                </li>
              ))}
          </ul>
        </Panel>

        <Panel aria-labelledby="ground-title">
          <PanelHeader
            id="ground-title"
            title="Flight surgeon · Earth"
            meta={
              <span className="flex items-center gap-1.5">
                <Stethoscope className="size-3.5" aria-hidden="true" /> Mission Control inbox
              </span>
            }
          />
          <ul aria-label="Flight surgeon inbox" className="divide-border divide-y">
            {inbox.length === 0 && (
              <li className="text-muted-foreground p-4 text-sm sm:p-5">
                {reports.length ? 'Reports are in transit. Speed up the demo clock to see them arrive.' : 'Inbox empty.'}
              </li>
            )}
            {[...inbox].reverse().map((m) => {
              const replied = replies.some((r) => r.payload.inReplyTo === m.id)
              return (
                <li key={m.id} className="p-4 sm:p-5">
                  <p className="label text-muted-foreground">
                    Received <span className="num">{utcTime(Date.parse(m.arrivesAt))} UTC</span> · sent <span className="num">{utcTime(Date.parse(m.createdAt))}</span>
                  </p>
                  <ReportBody msg={m} />
                  {replied ? (
                    <p className="text-muted-foreground mt-3 text-xs">Reply sent.</p>
                  ) : (
                    <div className="mt-3">
                      <p className="text-muted-foreground mb-1.5 text-xs">Reply with</p>
                      <div className="grid gap-1.5">
                        {REPLIES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => sendReply(m, t)}
                            className="border-border hover:border-border-strong hover:bg-muted min-h-11 rounded-sm border px-3 py-2 text-left text-sm"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>
      <p className="text-muted-foreground text-xs">Simulated link. Reply templates are examples, not medical instructions. Crew member and messages are synthetic.</p>
      <div>
        <Action variant="ghost" onClick={store.resetDemo}>
          Reset link and settings
        </Action>
      </div>
    </RevealGrid>
    </Page>
    </>
  )
}
