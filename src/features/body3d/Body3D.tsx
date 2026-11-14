import { CameraControls, ContactShadows, Html } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import type { BodyRegion, Status } from '@/engine/types'
import { BodyModel } from './BodyModel'
import { STATUS_HEX } from './palette'
import { HOME_VIEW, REGIONS } from './regions'

const GLYPH: Record<Status, string> = { normal: '●', caution: '▲', danger: '◆', 'no-data': '○', stale: '○' }
const WORD: Record<Status, string> = { normal: 'nominal', caution: 'caution', danger: 'act now', 'no-data': 'not measured', stale: 'needs re-measuring' }

export type Body3DProps = {
  theme: 'day' | 'night'
  statusByRegion: Record<BodyRegion, Status>
  selected: BodyRegion | null
  onSelect: (region: BodyRegion | null) => void
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Body3D({ theme, statusByRegion, selected, onSelect }: Body3DProps) {
  const [controls, setControls] = useState<CameraControls | null>(null)
  const [hovered, setHovered] = useState<BodyRegion | null>(null)
  const placed = useRef(false)

  useEffect(() => {
    const c = controls
    if (!c) return
    const animate = placed.current && !reducedMotion()
    placed.current = true
    const region = REGIONS.find((r) => r.id === selected)
    if (!region) {
      void c.setLookAt(...HOME_VIEW.position, ...HOME_VIEW.target, animate)
      return
    }
    const [x, y, z] = region.focusTarget
    void c.setLookAt(x + region.focusDistance * 0.35, y + region.focusDistance * 0.1, z + region.focusDistance, x, y, z, animate)
  }, [selected, controls])

  return (
    <Canvas
      camera={{ position: HOME_VIEW.position, fov: 35, near: 0.05, far: 50 }}
      dpr={[1, 2]}
      aria-label="Interactive 3D body. Use the status markers or the region list to inspect each body system."
    >
      <ambientLight intensity={theme === 'night' ? 0.35 : 0.7} />
      <directionalLight position={[2, 3, 2]} intensity={theme === 'night' ? 0.6 : 1.2} color={theme === 'night' ? '#ffb27a' : '#ffffff'} />
      <directionalLight position={[-2, 1.5, -2]} intensity={0.4} color={theme === 'night' ? '#ff8a5c' : '#cfe3ff'} />

      <BodyModel
        theme={theme}
        statusByRegion={statusByRegion}
        selected={selected}
        hovered={hovered}
        onSelect={(r) => onSelect(r === selected ? null : r)}
        onHover={setHovered}
      />

      {REGIONS.map((r) => {
        const status = statusByRegion[r.id]
        const active = selected === r.id
        const hidden = selected !== null && !active
        return (
          <Html key={r.id} position={r.markerAt} center zIndexRange={[20, 0]} style={{ pointerEvents: hidden ? 'none' : 'auto' }}>
            <button
              type="button"
              onClick={() => onSelect(active ? null : r.id)}
              onPointerEnter={() => setHovered(r.id)}
              onPointerLeave={() => setHovered(null)}
              aria-pressed={active}
              aria-label={`${r.label}, ${WORD[status]}`}
              className="bg-card/90 text-card-foreground flex size-8 items-center justify-center rounded-full border text-sm shadow-sm transition-opacity duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              style={{ color: STATUS_HEX[theme][status], opacity: hidden ? 0 : 1 }}
              tabIndex={hidden ? -1 : 0}
            >
              <span aria-hidden="true">{GLYPH[status]}</span>
            </button>
          </Html>
        )
      })}

      <ContactShadows position={[0, 0, 0]} opacity={theme === 'night' ? 0.25 : 0.35} scale={2.5} blur={2.4} far={1} />
      <CameraControls ref={setControls} minDistance={0.3} maxDistance={5} smoothTime={0.35} />
    </Canvas>
  )
}
