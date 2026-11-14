import { CameraControls, ContactShadows, Environment, Html, Lightformer, useProgress } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import { motion } from 'motion/react'
import { StatusGlyph } from '@/components/StatusBadge'
import { STATUS_META } from '@/components/status-meta'
import type { BodyRegion, Status } from '@/engine/types'
import { BodyModel } from './BodyModel'
import { HOME_VIEW, REGIONS } from './regions'
import { useBodyModel } from './useBodyModel'

const WORD: Record<Status, string> = { normal: 'nominal', caution: 'caution', danger: 'act now', 'no-data': 'not measured', stale: 'needs re-measuring' }

export type Body3DProps = {
  theme: 'day' | 'night'
  statusByRegion: Record<BodyRegion, Status>
  selected: BodyRegion | null
  onSelect: (region: BodyRegion | null) => void
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Loading() {
  const { progress } = useProgress()
  return (
    <Html center>
      <p className="text-muted-foreground text-sm whitespace-nowrap">Loading body model… {Math.round(progress)}%</p>
    </Html>
  )
}

type MarkerEls = { label: HTMLButtonElement | null; dot: HTMLSpanElement | null; line: SVGLineElement | null }
type Markers = RefObject<Partial<Record<BodyRegion, MarkerEls>>>

type SceneProps = Body3DProps & { hovered: BodyRegion | null; setHovered: (r: BodyRegion | null) => void; markers: Markers; onPlaced: () => void }

/*
  Projects each region's marker point to screen space every frame and moves the
  DOM buttons rendered outside the canvas. Replaces drei <Html>, whose separate
  React roots raced under React 19 and dropped the first marker.
*/
function MarkerProjector({ geometry, markers, onPlaced }: { geometry: ReturnType<typeof useBodyModel>['geometry']; markers: Markers; onPlaced: () => void }) {
  const { camera, size } = useThree()
  const v = useRef(new THREE.Vector3())
  const placed = useRef(false)
  useFrame(() => {
    const items: { id: BodyRegion; side: 1 | -1; ax: number; ay: number; behind: boolean }[] = []
    for (const r of REGIONS) {
      v.current.set(...geometry[r.id].markerAt).project(camera)
      items.push({
        id: r.id,
        side: r.markerSide,
        ax: (v.current.x * 0.5 + 0.5) * size.width,
        ay: (-v.current.y * 0.5 + 0.5) * size.height,
        behind: v.current.z > 1,
      })
    }
    /* Callout layout: labels sit in a column beside the body, pushed apart so they never overlap */
    const GAP = 34
    const OFFSET = Math.min(64, size.width * 0.12)
    for (const side of [-1, 1] as const) {
      let prev = -Infinity
      for (const it of items.filter((i) => i.side === side).sort((a, b) => a.ay - b.ay)) {
        const els = markers.current?.[it.id]
        if (!els?.label || !els.dot || !els.line) continue
        const ly = Math.max(it.ay, prev + GAP)
        prev = ly
        const w = els.label.offsetWidth
        let lx = side < 0 ? it.ax - OFFSET - w : it.ax + OFFSET
        lx = Math.min(Math.max(lx, 6), size.width - w - 6)
        const edgeX = side < 0 ? lx + w : lx
        // oxlint-disable-next-line react/immutability -- imperative per-frame DOM update is the R3F pattern
        els.label.style.transform = `translate(${lx.toFixed(1)}px, ${(ly - 14).toFixed(1)}px)`
        els.dot.style.transform = `translate(${(it.ax - 4).toFixed(1)}px, ${(it.ay - 4).toFixed(1)}px)`
        els.line.setAttribute('x1', it.ax.toFixed(1))
        els.line.setAttribute('y1', it.ay.toFixed(1))
        els.line.setAttribute('x2', edgeX.toFixed(1))
        els.line.setAttribute('y2', ly.toFixed(1))
        const vis = it.behind ? 'hidden' : 'visible'
        els.label.style.visibility = vis
        els.dot.style.visibility = vis
        els.line.style.visibility = vis
      }
    }
    if (!placed.current) {
      placed.current = true
      onPlaced()
    }
  })
  return null
}

function Scene({ theme, statusByRegion, selected, onSelect, hovered, setHovered, markers, onPlaced }: SceneProps) {
  const model = useBodyModel()
  const [controls, setControls] = useState<CameraControls | null>(null)
  const placed = useRef(false)

  useEffect(() => {
    if (!controls) return
    const animate = placed.current && !reducedMotion()
    placed.current = true
    if (!selected) {
      void controls.setLookAt(...HOME_VIEW.position, ...HOME_VIEW.target, animate)
      return
    }
    const { focusTarget: [x, y, z], focusDistance: d } = model.geometry[selected]
    void controls.setLookAt(x + d * 0.35, y + d * 0.1, z + d, x, y, z, animate)
  }, [selected, controls, model])

  return (
    <>
      <BodyModel
        model={model}
        theme={theme}
        statusByRegion={statusByRegion}
        selected={selected}
        hovered={hovered}
        onSelect={(r) => onSelect(r === selected ? null : r)}
        onHover={setHovered}
      />
      <MarkerProjector geometry={model.geometry} markers={markers} onPlaced={onPlaced} />
      <CameraControls ref={setControls} minDistance={0.25} maxDistance={5} smoothTime={0.35} />
    </>
  )
}

export default function Body3D(props: Body3DProps) {
  const { theme, statusByRegion, selected, onSelect } = props
  const [hovered, setHovered] = useState<BodyRegion | null>(null)
  const markers = useRef<Partial<Record<BodyRegion, MarkerEls>>>({})
  const [placed, setPlaced] = useState(false)
  const slot = (id: BodyRegion) => (markers.current[id] ??= { label: null, dot: null, line: null })
  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: HOME_VIEW.position, fov: 35, near: 0.02, far: 50 }}
        dpr={[1, 2]}
        aria-label="Interactive 3D body. Use the status markers or the body systems list to inspect each system."
      >
        <ambientLight intensity={theme === 'night' ? 0.35 : 0.75} />
        <directionalLight position={[2, 3, 2]} intensity={theme === 'night' ? 0.6 : 1.3} color={theme === 'night' ? '#ffb27a' : '#ffffff'} />
        <directionalLight position={[-2, 1.5, -2]} intensity={0.45} color={theme === 'night' ? '#ff8a5c' : '#cfe3ff'} />
        <directionalLight position={[0, 1, 3]} intensity={theme === 'night' ? 0.25 : 0.5} />

        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={theme === 'night' ? 1.2 : 2.4} color={theme === 'night' ? '#ffb27a' : '#ffffff'} position={[0, 4, 3]} scale={[6, 3, 1]} />
          <Lightformer form="rect" intensity={theme === 'night' ? 0.6 : 1.2} color={theme === 'night' ? '#ff8a5c' : '#dfeaff'} position={[-4, 1.5, 1]} rotation-y={Math.PI / 2} scale={[4, 2, 1]} />
          <Lightformer form="rect" intensity={theme === 'night' ? 0.5 : 1} color={theme === 'night' ? '#ffb27a' : '#fff4e8'} position={[4, 1, -1]} rotation-y={-Math.PI / 2} scale={[4, 2, 1]} />
          <Lightformer form="ring" intensity={theme === 'night' ? 0.4 : 0.8} position={[0, 1, -4]} scale={2} />
        </Environment>

        <Suspense fallback={<Loading />}>
          <Scene {...props} hovered={hovered} setHovered={setHovered} markers={markers} onPlaced={() => setPlaced(true)} />
        </Suspense>

        <ContactShadows position={[0, 0, 0]} opacity={theme === 'night' ? 0.25 : 0.35} scale={2.5} blur={2.4} far={1} />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          {REGIONS.map((r, i) => {
            const hidden = selected !== null && selected !== r.id
            const hot = hovered === r.id || selected === r.id
            return (
              <motion.line
                key={r.id}
                ref={(el) => {
                  slot(r.id).line = el
                }}
                stroke={hot ? 'var(--foreground)' : 'var(--border-strong)'}
                strokeWidth={hot ? 1.5 : 1}
                style={{ visibility: 'hidden' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: placed && !hidden ? 1 : 0 }}
                transition={{ duration: 0.4, delay: placed ? 0.15 + i * 0.09 : 0 }}
              />
            )
          })}
        </svg>
        {REGIONS.map((r, i) => {
          const status = statusByRegion[r.id]
          const active = selected === r.id
          const hidden = selected !== null && !active
          const hot = hovered === r.id || active
          const meta = STATUS_META[status]
          return (
            <div key={r.id}>
              <span
                ref={(el) => {
                  slot(r.id).dot = el
                }}
                aria-hidden="true"
                className="absolute top-0 left-0 size-2"
                style={{ visibility: 'hidden' }}
              >
                <motion.span
                  className={`block size-2 rounded-full ring-2 ring-[var(--card)] ${meta.rule}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: placed && !hidden ? (hot ? 1.5 : 1) : 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22, delay: placed ? i * 0.09 : 0 }}
                />
              </span>
              <motion.button
                ref={(el) => {
                  slot(r.id).label = el
                }}
                type="button"
                onClick={() => onSelect(active ? null : r.id)}
                onPointerEnter={() => setHovered(r.id)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(r.id)}
                onBlur={() => setHovered(null)}
                aria-pressed={active}
                aria-label={`${r.label}, ${WORD[status]}`}
                className={`bg-card/95 text-card-foreground absolute top-0 left-0 flex h-7 items-center gap-1.5 rounded-sm border px-2 text-[10px] font-semibold tracking-[0.08em] whitespace-nowrap uppercase shadow-[var(--shadow-card)] backdrop-blur ${hot ? 'border-foreground' : 'border-border-strong'} ${hidden ? 'pointer-events-none' : 'pointer-events-auto'}`}
                style={{ visibility: 'hidden' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: placed && !hidden ? 1 : 0 }}
                transition={{ duration: 0.4, delay: placed ? 0.25 + i * 0.09 : 0 }}
                tabIndex={hidden ? -1 : 0}
              >
                <StatusGlyph status={status} />
                <span aria-hidden="true">{r.short}</span>
              </motion.button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
