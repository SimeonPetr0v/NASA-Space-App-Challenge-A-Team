import { BedDouble, BookOpen, ChartLine, ClipboardPlus, LayoutDashboard, Menu, Moon, RadioTower, Rocket, Sparkles, Users } from 'lucide-react'
import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { FEATURES } from '@/config/features'
import { href, type Route } from '@/state/route'
import { useStore } from '@/state/store'
import './solar-nav.css'

/*
  Solar page menu (features.solarNav). A sun half off the edge of the screen:
  at the right on computers and landscape tablets, at the bottom on phones
  and portrait tablets (where it replaces the bottom bar). Its planets carry
  the app's pages and turn into page icons.
  - Pointing at it opens it; it stays open 3.5 s after the pointer leaves.
  - Clicking or tapping the sun pins it open until the sun is clicked again
    (Escape also closes it). Choosing a page keeps a pinned menu open.
*/

const PLANETS = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const

/* short: the label at the bottom of the screen, where the planets sit close together */
type Page = { route: Route; label: string; short: string; icon: typeof LayoutDashboard; on: boolean }
const PAGES: Page[] = [
  { route: 'overview', label: 'Overview', short: 'Home', icon: LayoutDashboard, on: true },
  { route: 'crew', label: 'Crew board', short: 'Crew', icon: Users, on: FEATURES.crewBoard },
  { route: 'log', label: 'Log reading', short: 'Log', icon: ClipboardPlus, on: true },
  { route: 'trends', label: 'Trends', short: 'Trends', icon: ChartLine, on: true },
  { route: 'tot', label: 'TOT assistant', short: 'TOT', icon: Sparkles, on: FEATURES.tot },
  { route: 'link', label: 'Earth link', short: 'Link', icon: RadioTower, on: true },
  { route: 'method', label: 'Methodology', short: 'Method', icon: BookOpen, on: true },
  { route: 'brief', label: 'Mission brief', short: 'Brief', icon: Rocket, on: true },
]
const SLEEP: Page = { route: 'sleep', label: 'Sleep shift', short: 'Sleep', icon: BedDouble, on: true }

/* Phones, and tablets held upright, get the sun at the bottom of the screen */
const BOTTOM_DOCK_QUERY = '(max-width: 639px), (max-width: 1023px) and (orientation: portrait)'
const subscribeDock = (cb: () => void) => {
  const mq = window.matchMedia(BOTTOM_DOCK_QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const useBottomDock = () =>
  useSyncExternalStore(
    subscribeDock,
    () => window.matchMedia(BOTTOM_DOCK_QUERY).matches,
    () => false,
  )

/* Arc the planets sit on: centred on "left" (180 deg) at the right edge, on "up" (90 deg) at the bottom */
const ARC = { right: { centre: 180, spread: 124 }, bottom: { centre: 90, spread: 150 } }
/* After the pointer leaves, the menu stays open this long */
const LEAVE_MS = 3500
const BLUR_MS = 250
/* Circle around a bubble for the curved label: from lower left, over the top, to lower right (radius 29 in an 80 x 80 box) */
const ARC_PATH = (() => {
  const r = 29
  const a = (25 * Math.PI) / 180
  const x = (r * Math.cos(a)).toFixed(2)
  const y = (r * Math.sin(a)).toFixed(2)
  return `M -${x} ${y} A ${r} ${r} 0 1 1 ${x} ${y}`
})()

export function SolarNav({ route }: { route: Route }) {
  const theme = useStore().theme
  const base = PAGES.filter((p) => p.on)
  const pages = theme === 'night' ? [base[0], SLEEP, ...base.slice(1)] : base
  const lunar = theme === 'dark'
  const HubIcon = lunar ? Moon : Menu
  const bottom = useBottomDock()
  const arc = bottom ? ARC.bottom : ARC.right
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const root = useRef<HTMLElement>(null)
  const sun = useRef<HTMLButtonElement>(null)
  const leave = useRef(0)
  const quiet = useRef(false)
  const state = useRef({ open: false, pinned: false })
  useEffect(() => {
    state.current = { open, pinned }
  }, [open, pinned])
  const id = useId()

  const close = () => {
    window.clearTimeout(leave.current)
    setOpen(false)
    setPinned(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        sun.current?.focus()
      }
    }
    /* An unpinned menu closes when you press anywhere else; a pinned one waits for the sun */
    const onDown = (e: PointerEvent) => {
      if (!state.current.pinned && !root.current?.contains(e.target as Node)) close()
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
    if (quiet.current || state.current.open) return
    setOpen(true)
  }
  const hideAfter = (ms: number) => {
    window.clearTimeout(leave.current)
    if (state.current.pinned) return
    leave.current = window.setTimeout(() => {
      if (!state.current.pinned) setOpen(false)
    }, ms)
  }

  return (
    <nav
      ref={root}
      aria-label="Pages"
      className="solar"
      data-open={open}
      data-dock={bottom ? 'bottom' : 'right'}
      style={{ '--n': pages.length } as CSSProperties}
      onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'mouse') return
        quiet.current = false
        hideAfter(LEAVE_MS)
      }}
      onFocus={(e) => {
        if (e.target.matches(':focus-visible')) show()
      }}
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node)) hideAfter(BLUR_MS)
      }}
    >
      <button
        ref={sun}
        type="button"
        className={lunar ? 'solar-sun solar-moon' : 'solar-sun'}
        aria-expanded={open}
        aria-controls={id}
        aria-label={pinned ? 'Close the page menu' : 'Open and keep the page menu open'}
        onClick={() => {
          window.clearTimeout(leave.current)
          if (state.current.pinned) {
            /* Second click: close, and do not reopen while the pointer is still on the sun */
            quiet.current = true
            close()
          } else {
            setPinned(true)
            setOpen(true)
          }
        }}
      >
        <span className="solar-hub-face" aria-hidden="true">
          <HubIcon className="solar-hub-icon" strokeWidth={2} />
          <span className="solar-hub-text">{pinned ? 'Close' : 'Menu'}</span>
        </span>
      </button>
      <ul id={id} className="solar-list">
        {pages.map((p, i) => {
          /* Right edge: top to bottom. Bottom edge: left to right */
          const step = (arc.spread * i) / Math.max(1, pages.length - 1)
          const deg = bottom ? arc.centre + arc.spread / 2 - step : arc.centre - arc.spread / 2 + step
          const a = (deg * Math.PI) / 180
          const Icon = p.icon
          return (
            <li
              key={p.route}
              className="solar-item"
              data-edge={i === 0 ? 'start' : i === pages.length - 1 ? 'end' : undefined}
              style={{ '--i': i, '--cx': Math.cos(a).toFixed(4), '--cy': (-Math.sin(a)).toFixed(4) } as CSSProperties}
            >
              <a
                href={href(p.route)}
                className="solar-link"
                aria-current={route === p.route ? 'page' : undefined}
                aria-label={p.label}
                tabIndex={open ? 0 : -1}
                aria-hidden={!open}
                onClick={(e) => {
                  e.currentTarget.blur()
                  if (state.current.pinned) return
                  quiet.current = true
                  close()
                }}
              >
                <span className={`solar-planet planet-${PLANETS[i % PLANETS.length]}`} aria-hidden="true" />
                <span className="solar-icon" aria-hidden="true">
                  <Icon strokeWidth={1.75} />
                </span>
                {bottom ? (
                  /* At the bottom the name curves over the top of its bubble, no box */
                  <svg className="solar-arc-label" viewBox="-40 -40 80 80" aria-hidden="true">
                    <path id={`${id}-arc-${i}`} d={ARC_PATH} fill="none" />
                    <text>
                      <textPath href={`#${id}-arc-${i}`} startOffset="50%" textAnchor="middle">
                        {p.short}
                      </textPath>
                    </text>
                  </svg>
                ) : (
                  <span className="solar-label">{p.label}</span>
                )}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
