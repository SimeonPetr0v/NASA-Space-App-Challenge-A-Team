import { ArrowRight, Earth, Orbit, Radiation, Users, Wind } from 'lucide-react'
import { motion } from 'motion/react'
import { Reveal } from '@/components/motion'
import { staggerChild, staggerParent } from '@/components/motion-config'
import { StatusBadge } from '@/components/StatusBadge'
import { HAZARD_SOURCE_URL, HAZARDS, INDICATOR_ORDER, INDICATORS } from '@/data/indicators'
import { SEVERITY, worstStatus } from '@/engine/assess'
import type { Hazard } from '@/engine/types'
import { delayText } from '@/lib/format'
import { href } from '@/state/route'
import { useStore } from '@/state/store'
import { useHealth } from '@/state/useHealth'

const WORDS = ['Heart rate', 'Blood pressure', 'Oxygen saturation', 'Body temperature', 'Blood glucose', 'Sleep', 'Mood', 'Exercise', 'Radiation dose']

/** Scrolling ticker of everything the app watches */
export function VitalsMarquee() {
  const line = WORDS.map((w) => `${w} •`).join(' ')
  return (
    <div aria-hidden="true" className="bg-space-band overflow-hidden py-5">
      <div className="marquee flex w-max text-2xl font-light tracking-tight whitespace-nowrap uppercase sm:text-4xl">
        <span className="pr-6">{line}</span>
        <span className="pr-6">{line}</span>
      </div>
    </div>
  )
}

const ICON: Record<Hazard, typeof Radiation> = { R: Radiation, I: Users, D: Earth, G: Orbit, E: Wind }

/** RIDGE: five hazards, each with the indicators that watch for it */
export function HazardGrid() {
  const { assessments } = useHealth()
  const { delaySec } = useStore()
  const list: Hazard[] = ['R', 'I', 'D', 'G', 'E']
  return (
    <section aria-labelledby="ridge-title" className="grid gap-8">
      <Reveal className="max-w-2xl">
        <p className="label text-primary">NASA Human Research Program</p>
        <h2 id="ridge-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Five hazards. One daily routine.
        </h2>
        <p className="text-muted-foreground mt-3 text-base">
          Every reading in this app watches for at least one of the five hazards of human spaceflight (
          <a href={HAZARD_SOURCE_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4">
            RIDGE
          </a>
          ). Changes are slow and silent, so the trend matters as much as today’s value.
        </p>
      </Reveal>
      <motion.ul
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        {list.map((h) => {
          const Icon = ICON[h]
          const ids = INDICATOR_ORDER.filter((id) => INDICATORS[id].hazards.includes(h))
          const related = assessments.filter((a) => ids.includes(a.indicatorId))
          const status = related.length ? worstStatus(related) : 'no-data'
          const off = related.filter((a) => SEVERITY[a.status] >= 2).length
          return (
            <motion.li
              key={h}
              variants={staggerChild}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="panel group relative flex flex-col overflow-hidden p-5"
            >
              <span aria-hidden="true" className="bg-space-band absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
              <div className="flex items-center justify-between">
                <Icon className="text-primary size-6" strokeWidth={1.5} aria-hidden="true" />
                <span className="num text-subtle-foreground text-3xl font-light">{h}</span>
              </div>
              <h3 className="mt-5 text-base font-semibold">{HAZARDS[h].name}</h3>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{HAZARDS[h].effect}</p>
              <div className="border-border mt-auto border-t pt-3 text-xs">
                {h === 'D' ? (
                  <p className="text-muted-foreground">
                    Earth link <span className="num text-foreground font-semibold">{delayText(delaySec)}</span> one way
                  </p>
                ) : ids.length ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      {off ? `${off} of ${ids.length} off-nominal` : `${ids.length} tracked`}
                    </span>
                    <StatusBadge status={status} />
                  </div>
                ) : (
                  <p className="text-muted-foreground">Dosimeter planned</p>
                )}
              </div>
            </motion.li>
          )
        })}
      </motion.ul>
    </section>
  )
}

/** Closing call to action, like a landing page footer band */
export function ClosingBand() {
  return (
    <section className="bg-space relative overflow-hidden">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Reveal>
          <h2 className="text-3xl tracking-tight sm:text-4xl">
            <span className="font-semibold">Forty seconds a morning.</span> <span className="text-space-muted font-light">Months of mission.</span>
          </h2>
          <p className="text-space-muted mt-3 max-w-xl text-sm">
            Supports self-assessment only; it does not diagnose or treat. Readings shown are synthetic demo data. Built for the NASA Space Apps Challenge 2026,
            not affiliated with or endorsed by NASA.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <a
            href={href('log')}
            className="bg-space-foreground text-space-1 inline-flex min-h-12 items-center gap-2 rounded-sm px-6 text-sm font-semibold transition-transform hover:-translate-y-0.5"
          >
            Log today’s check <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
