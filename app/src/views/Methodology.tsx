import { PageBanner } from '@/components/PageBanner'
import { FEATURES } from '@/config/features'
import { WhyItMatters } from '@/features/why/WhyItMatters'
import { RevealGrid } from '@/components/motion'
import { Page } from '@/shell/Page'
import { Panel, PanelHeader } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import { COMBINATION_RULES, HAZARD_SOURCE_URL, HAZARDS, INDICATOR_ORDER, INDICATORS } from '@/data/indicators'
import type { Hazard, Status } from '@/engine/types'

const HAZ: Hazard[] = ['R', 'I', 'D', 'G', 'E']

export function Methodology() {
  return (
    <>
    <PageBanner eyebrow="Science and sources" title="Methodology">
      How readings become a status, guidance and escalation, and where every threshold comes from.
    </PageBanner>
    <Page>
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
    {FEATURES.whyItMatters && <WhyItMatters />}
    <RevealGrid className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Panel aria-labelledby="how-title">
        <PanelHeader id="how-title" title="How the assessment works" />
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-px sm:grid-cols-4">
          {[
            ['Log', 'The crew member enters readings from on-board devices or self-report.'],
            ['Assess', 'Each value is compared with its range and the personal baseline. Combinations are checked.'],
            ['Guide', 'Every non-nominal result gets what to do now, when to re-check and when to escalate.'],
            ['Escalate', 'Reports go to the crew medical officer or to flight surgeons on Earth, with the real signal delay.'],
          ].map(([t, d], i) => (
            <li key={t} className="border-border border-b p-4 sm:border-r sm:border-b-0 sm:p-5 sm:last:border-r-0">
              <p className="num text-muted-foreground text-xs">0{i + 1}</p>
              <p className="mt-1 text-sm font-semibold">{t}</p>
              <p className="text-muted-foreground mt-1 text-sm">{d}</p>
            </li>
          ))}
        </ol>
        <div className="border-border text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 border-t px-4 py-3 text-xs sm:px-5">
          {(['normal', 'caution', 'danger', 'stale'] as Status[]).map((s) => (
            <span key={s} className="flex items-center gap-2">
              <StatusBadge status={s} />
              {s === 'normal' ? 'within range' : s === 'caution' ? 'self-care and re-check' : s === 'danger' ? 'escalate now' : 'reading too old'}
            </span>
          ))}
        </div>
      </Panel>

      <Panel aria-labelledby="ridge-title">
        <PanelHeader
          id="ridge-title"
          title="Five hazards of human spaceflight (RIDGE)"
          meta={
            <a href={HAZARD_SOURCE_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              NASA Human Research Program
            </a>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="text-muted-foreground border-border border-b">
              <tr>
                <th className="label w-14 px-4 py-2 text-left sm:px-5">Code</th>
                <th className="label px-4 py-2 text-left">Hazard</th>
                <th className="label px-4 py-2 text-left">Effect on the body</th>
                <th className="label px-4 py-2 text-left">Tracked by</th>
              </tr>
            </thead>
            <tbody>
              {HAZ.map((h) => (
                <tr key={h} className="border-border border-b align-top last:border-b-0">
                  <td className="num px-4 py-3 font-semibold sm:px-5">{h}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{HAZARDS[h].name}</td>
                  <td className="text-muted-foreground px-4 py-3">{HAZARDS[h].effect}</td>
                  <td className="px-4 py-3">
                    {h === 'D'
                      ? 'Escalation logic and the Earth link'
                      : INDICATOR_ORDER.filter((id) => INDICATORS[id].hazards.includes(h))
                          .map((id) => INDICATORS[id].label)
                          .join(', ') || (FEATURES.radiation ? 'Radiation budget: mission dose vs the 600 mSv career limit' : 'Planned: dosimeter dose')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel aria-labelledby="thr-title">
        <PanelHeader id="thr-title" title="Thresholds and sources" meta="Self-assessment defaults pending science review, not medical criteria" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="text-muted-foreground border-border border-b">
              <tr>
                <th className="label px-4 py-2 text-left sm:px-5">Indicator</th>
                <th className="label px-4 py-2 text-left">Unit</th>
                <th className="label px-4 py-2 text-left">
                  <StatusBadge status="normal" />
                </th>
                <th className="label px-4 py-2 text-left">
                  <StatusBadge status="caution" />
                </th>
                <th className="label px-4 py-2 text-left">
                  <StatusBadge status="danger" />
                </th>
                <th className="label px-4 py-2 text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {INDICATOR_ORDER.map((id) => {
                const d = INDICATORS[id]
                return (
                  <tr key={id} className="border-border border-b align-top last:border-b-0">
                    <td className="px-4 py-3 font-medium sm:px-5">{d.label}</td>
                    <td className="num text-muted-foreground px-4 py-3">{d.unit}</td>
                    <td className="num px-4 py-3">{d.ranges.normal}</td>
                    <td className="num px-4 py-3">{d.ranges.caution}</td>
                    <td className="num px-4 py-3">{d.ranges.danger}</td>
                    <td className="px-4 py-3">
                      <a href={d.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-border-strong underline-offset-4 hover:decoration-foreground">
                        {d.sourceLabel}
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel aria-labelledby="combo-title">
        <PanelHeader id="combo-title" title="Combination rules" meta="Escalate even when each single value is only caution" />
        <ul className="divide-border divide-y">
          {COMBINATION_RULES.map((r) => (
            <li key={r.id} className="grid grid-cols-[minmax(0,1fr)] gap-1 p-4 text-sm sm:grid-cols-[16rem_1fr] sm:gap-6 sm:p-5">
              <p className="font-medium">{r.title}</p>
              <p className="text-muted-foreground">{r.detail}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
        <span className="text-foreground font-medium">This tool supports self-assessment. It does not diagnose or treat.</span> All readings shown are synthetic demo
        data. Built for the NASA Space Apps Challenge 2026; not affiliated with or endorsed by NASA.
      </p>
    </RevealGrid>
    </div>
    </Page>
    </>
  )
}
