import { useFrame, useThree } from '@react-three/fiber'
import { type RefObject, useRef } from 'react'
import * as THREE from 'three'
import { STATUS_META } from '@/components/StatusBadge'
import type { BodyRegion, Status } from '@/engine/types'
import { cn } from '@/lib/utils'
import { REGIONS } from './regions'
import type { BodyModelData } from './useBodyModel'

/*
  Medical-illustration style callouts: each organ gets a label in a side column,
  joined to the organ by a thin elbowed leader line. Positions are recomputed
  every frame from the 3D camera and written straight to the DOM (no re-render).
*/

export type Callout = { title: string; value?: string; status: Status }

export type CalloutRefs = {
  overlay: RefObject<HTMLDivElement | null>
  labels: Partial<Record<BodyRegion, HTMLButtonElement | null>>
  lines: Partial<Record<BodyRegion, SVGPolylineElement | null>>
  dots: Partial<Record<BodyRegion, SVGCircleElement | null>>
}

const GAP = 46
const EDGE = 20
const anchorOf = (model: BodyModelData, region: BodyRegion) => {
  const g = model.geometry[region]
  if (region === 'whole-body') return [0.04, 1.02, 0.11] as [number, number, number]
  return region === 'musculoskeletal' ? g.markerAt : g.center
}

export function CalloutTracker({ model, refs, visible }: { model: BodyModelData; refs: CalloutRefs; visible: boolean }) {
  const { camera, size } = useThree()
  const v = useRef(new THREE.Vector3())

  useFrame(() => {
    const placed: { region: BodyRegion; side: 1 | -1; x: number; y: number }[] = []
    for (const meta of REGIONS) {
      v.current.set(...anchorOf(model, meta.id)).project(camera)
      placed.push({ region: meta.id, side: meta.markerSide, x: ((v.current.x + 1) / 2) * size.width, y: ((1 - v.current.y) / 2) * size.height })
    }
    for (const side of [-1, 1] as const) {
      const column = placed.filter((p) => p.side === side).sort((a, b) => a.y - b.y)
      let last = -Infinity
      for (const p of column) {
        const ly = Math.min(Math.max(p.y, Math.max(last + GAP, 32)), size.height - 32)
        last = ly
        const label = refs.labels[p.region]
        const line = refs.lines[p.region]
        const dot = refs.dots[p.region]
        if (!label || !line || !dot) continue
        const w = label.offsetWidth
        const lx = side < 0 ? EDGE : size.width - EDGE - w
        label.style.transform = `translate(${lx}px, ${ly}px) translateY(-50%)`
        const edgeX = side < 0 ? lx + w + 6 : lx - 6
        const elbowX = side < 0 ? Math.min(edgeX + 28, p.x - 8) : Math.max(edgeX - 28, p.x + 8)
        line.setAttribute('points', `${edgeX},${ly} ${elbowX},${ly} ${p.x},${p.y}`)
        dot.setAttribute('cx', String(p.x))
        dot.setAttribute('cy', String(p.y))
      }
    }
    if (refs.overlay.current) refs.overlay.current.style.opacity = visible ? '1' : '0'
  })

  return null
}

type OverlayProps = {
  refs: CalloutRefs
  callouts: Partial<Record<BodyRegion, Callout>>
  visible: boolean
  onSelect: (region: BodyRegion) => void
  onHover: (region: BodyRegion | null) => void
}

export function CalloutOverlay({ refs, callouts, visible, onSelect, onHover }: OverlayProps) {
  return (
    <div ref={refs.overlay} className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200" aria-hidden={!visible}>
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        {REGIONS.map((r) => (
          <g key={r.id} className="text-muted-foreground">
            <polyline ref={(el) => void (refs.lines[r.id] = el)} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.55} />
            <circle ref={(el) => void (refs.dots[r.id] = el)} r={3} fill="var(--card)" stroke="currentColor" strokeWidth={1.25} />
          </g>
        ))}
      </svg>
      {REGIONS.map((r) => {
        const c = callouts[r.id] ?? { title: r.label, status: 'no-data' as Status }
        const { Icon, text, word } = STATUS_META[c.status]
        return (
          <button
            key={r.id}
            ref={(el) => void (refs.labels[r.id] = el)}
            type="button"
            tabIndex={visible ? 0 : -1}
            onClick={() => onSelect(r.id)}
            onPointerEnter={() => onHover(r.id)}
            onPointerLeave={() => onHover(null)}
            onFocus={() => onHover(r.id)}
            onBlur={() => onHover(null)}
            aria-label={`${c.title}${c.value ? `, ${c.value}` : ''}, ${word}`}
            className={cn(
              'bg-card hover:border-foreground/30 pointer-events-auto absolute top-0 left-0 flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left shadow-[0_1px_2px_rgb(16_35_58/0.06)] transition-colors duration-150',
            )}
          >
            <Icon size={15} strokeWidth={2.25} className={text} aria-hidden="true" />
            <span className="flex flex-col leading-tight">
              <span className="text-[13px] font-semibold">{c.title}</span>
              {c.value && <span className="text-muted-foreground font-numeric hidden text-[13px] tabular sm:block">{c.value}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
