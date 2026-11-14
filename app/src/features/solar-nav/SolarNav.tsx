import { BookOpen, ChartLine, ClipboardPlus, LayoutDashboard, RadioTower, Rocket, Sparkles, Users } from 'lucide-react'
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { FEATURES } from '@/config/features'
import { href, type Route } from '@/state/route'
import './solar-nav.css'

/*
  Solar section menu (features.solarNav). A sun half off the right edge;
  pointing at it, focusing it or tapping it sends the app's pages out as
  planets on an arc, which then turn into page icons. Choosing one goes to
  that page and folds the planets back into the sun.
*/

const PLANETS = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'] as const

const PAGES: { route: Route; label: string; icon: typeof LayoutDashboard; on: boolean }[] = [
  { route: 'overview', label: 'Overview', icon: LayoutDashboard, on: true },
  { route: 'crew', label: 'Crew board', icon: Users, on: FEATURES.crewBoard },
  { route: 'log', label: 'Log reading', icon: ClipboardPlus, on: true },
  { route: 'trends', label: 'Trends', icon: ChartLine, on: true },
  { route: 'tot', label: 'TOT assistant', icon: Sparkles, on: FEATURES.tot },
  { route: 'link', label: 'Earth link', icon: RadioTower, on: true },
  { route: 'method', label: 'Methodology', icon: BookOpen, on: true },
  { route: 'brief', label: 'Mission brief', icon: Rocket, on: true },
]

const ARC_DEG = 124
const LEAVE_MS = 220

export function SolarNav({ route }: { route: Route }) {
  const pages = PAGES.filter((p) => p.on)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLElement>(null)
  const sun = useRef<HTMLButtonElement>(null)
  const leave = useRef(0)
  const quiet = useRef(false)
  const openedAt = useRef(0)
  const isOpen = useRef(false)
  useEffect(() => {
    isOpen.current = open
  }, [open])
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        sun.current?.focus()
      }
    }
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(leave.current), [])

  const show = () => {
    window.clearTimeout(leave.current)
    if (quiet.current || isOpen.current) return
    openedAt.current = performance.now()
    setOpen(true)
  }
  const hide = () => {
    window.clearTimeout(leave.current)
    leave.current = window.setTimeout(() => setOpen(false), LEAVE_MS)
  }

  return (
    <nav
      ref={root}
      aria-label="Pages"
      className="solar"
      data-open={open}
      style={{ '--n': pages.length } as CSSProperties}
      onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'mouse') return
        quiet.current = false
        hide()
      }}
      onFocus={(e) => {
        if (e.target.matches(':focus-visible')) show()
      }}
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node)) hide()
      }}
    >
      <button
        ref={sun}
        type="button"
        className="solar-sun"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? 'Close the page menu' : 'Open the page menu'}
        onClick={() => {
          quiet.current = false
          if (isOpen.current && performance.now() - openedAt.current < 500) return
          openedAt.current = performance.now()
          setOpen((o) => !o)
        }}
      />
      <ul id={id} className="solar-list">
        {pages.map((p, i) => {
          const a = ((180 - ARC_DEG / 2 + (ARC_DEG * i) / Math.max(1, pages.length - 1)) * Math.PI) / 180
          const Icon = p.icon
          return (
            <li
              key={p.route}
              className="solar-item"
              style={{ '--i': i, '--cx': Math.cos(a).toFixed(4), '--cy': (-Math.sin(a)).toFixed(4) } as CSSProperties}
            >
              <a
                href={href(p.route)}
                className="solar-link"
                aria-current={route === p.route ? 'page' : undefined}
                tabIndex={open ? 0 : -1}
                aria-hidden={!open}
                onClick={(e) => {
                  quiet.current = true
                  setOpen(false)
                  e.currentTarget.blur()
                }}
              >
                <span className={`solar-planet planet-${PLANETS[i % PLANETS.length]}`} aria-hidden="true" />
                <span className="solar-icon" aria-hidden="true">
                  <Icon strokeWidth={1.75} />
                </span>
                <span className="solar-label">{p.label}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
