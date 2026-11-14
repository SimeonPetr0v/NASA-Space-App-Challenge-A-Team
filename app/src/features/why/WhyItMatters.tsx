import { Check, Clock } from 'lucide-react'
import { Panel, PanelHeader } from '@/components/Panel'
import { HAZARD_SOURCE_URL, HAZARDS, INDICATOR_ORDER, INDICATORS } from '@/data/indicators'
import { CAREER_LIMIT_SOURCE } from '@/data/radiation'
import { SIGN_OFF } from '@/data/signoff'
import { ESCALATION_TEXT } from '@/engine/assess'
import type { Hazard } from '@/engine/types'

/*
  NASA's five challenge questions, each answered from the app's own data and
  sources (features.whyItMatters), plus the science sign-off table.
*/

const HAZ: Hazard[] = ['R', 'I', 'D', 'G', 'E']
const A = ({ href, children }: { href: string; children: string }) => (
  <a href={href} target="_blank" rel="noreferrer" className="underline decoration-border-strong underline-offset-4 hover:decoration-foreground">
    {children}
  </a>
)

export function WhyItMatters() {
  const questions = [
    {
      q: 'Which measurements can be performed in space?',
      a: (
        <ul className="grid gap-1">
          {INDICATOR_ORDER.map((id) => (
            <li key={id}>
              <span className="font-medium">{INDICATORS[id].label}:</span> <span className="text-muted-foreground">{INDICATORS[id].howToMeasure}</span>
            </li>
          ))}
        </ul>
      ),
      src: { href: 'https://www.nasa.gov/hrp/risks/', label: 'NASA HRP risks' },
    },
    {
      q: 'Why is an exam needed?',
      a: (
        <p>
          Spaceflight changes the body slowly and quietly: bone and muscle loss, fluid shift, poorer sleep, a weaker immune system. Without a routine, a change is
          noticed only when it is already a problem, and far from Earth help is minutes or months away.
        </p>
      ),
      src: { href: HAZARD_SOURCE_URL, label: 'NASA HRP five hazards' },
    },
    {
      q: 'How do spaceflight hazards affect these indicators?',
      a: (
        <ul className="grid gap-1">
          {HAZ.map((h) => (
            <li key={h}>
              <span className="font-medium">
                {h} · {HAZARDS[h].name}:
              </span>{' '}
              <span className="text-muted-foreground">
                {h === 'R'
                  ? 'tracked as mission dose against the career limit.'
                  : h === 'D'
                    ? 'shapes the escalation logic and the delayed Earth link.'
                    : INDICATOR_ORDER.filter((id) => INDICATORS[id].hazards.includes(h))
                        .map((id) => INDICATORS[id].label.toLowerCase())
                        .join(', ')}
              </span>
            </li>
          ))}
        </ul>
      ),
      src: { href: HAZARD_SOURCE_URL, label: 'NASA HRP five hazards' },
    },
    {
      q: 'When does a result warrant attention from the crew or flight surgeons?',
      a: (
        <ul className="grid gap-1">
          {(['self-care', 'crew-medical-officer', 'flight-surgeon'] as const).map((e) => (
            <li key={e}>
              <span className="font-medium">{ESCALATION_TEXT[e].title}:</span>{' '}
              <span className="text-muted-foreground">
                {e === 'self-care'
                  ? 'one value in caution, or a slow trend in the wrong direction.'
                  : e === 'crew-medical-officer'
                    ? 'two related values off together (for example fever with a raised heart rate).'
                    : 'any value in the danger zone, or caution that does not improve after the re-check.'}
              </span>
            </li>
          ))}
        </ul>
      ),
      src: { href: 'https://www.nasa.gov/hrp/risks/', label: 'NASA HRP risks' },
    },
    {
      q: 'What actions prevent a critical condition?',
      a: (
        <p>
          Every caution and danger result comes with what to do now, when to re-check and when to escalate. Trend warnings catch slow changes before a threshold is
          crossed, the exercise log tracks the main countermeasure for bone and muscle loss, and the solar event drill sends the crew to the storm shelter.
        </p>
      ),
      src: { href: CAREER_LIMIT_SOURCE.url, label: 'NASA-STD-3001 radiation protection' },
    },
  ]

  return (
    <>
      <Panel aria-labelledby="why-title">
        <PanelHeader id="why-title" title="Why it matters: NASA’s five questions" meta="Answered from the app’s own data and sources" />
        <ol className="divide-border divide-y">
          {questions.map((x, i) => (
            <li key={x.q} className="grid gap-2 p-4 text-sm sm:grid-cols-[2.5rem_16rem_1fr] sm:gap-6 sm:p-5">
              <p className="num text-muted-foreground">0{i + 1}</p>
              <p className="font-semibold">{x.q}</p>
              <div className="grid gap-2">
                {x.a}
                <p className="text-muted-foreground text-xs">
                  Source: <A href={x.src.href}>{x.src.label}</A>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel aria-labelledby="signoff-title">
        <PanelHeader
          id="signoff-title"
          title="Science sign-off"
          meta={`${INDICATOR_ORDER.filter((id) => SIGN_OFF[id].status === 'verified').length} of ${INDICATOR_ORDER.length} indicators checked by our science lead`}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="text-muted-foreground border-border border-b">
              <tr>
                <th className="label px-4 py-2 text-left sm:px-5">Indicator</th>
                <th className="label px-4 py-2 text-left">Source</th>
                <th className="label px-4 py-2 text-left">Checked</th>
              </tr>
            </thead>
            <tbody>
              {INDICATOR_ORDER.map((id) => {
                const s = SIGN_OFF[id]
                return (
                  <tr key={id} className="border-border border-b align-top last:border-b-0">
                    <td className="px-4 py-3 font-medium sm:px-5">{INDICATORS[id].label}</td>
                    <td className="px-4 py-3">
                      <A href={INDICATORS[id].sourceUrl}>{INDICATORS[id].sourceLabel}</A>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {s.status === 'verified' ? (
                        <span className="text-status-ok-ink flex items-center gap-1.5 font-medium">
                          <Check className="size-4" aria-hidden="true" /> {s.by} {s.date && <span className="num text-muted-foreground font-normal">· {s.date}</span>}
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Clock className="size-4" aria-hidden="true" /> Pending review
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}
