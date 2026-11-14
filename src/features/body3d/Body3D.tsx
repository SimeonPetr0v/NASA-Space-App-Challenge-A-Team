import { CameraControls, ContactShadows, Environment, Html, Lightformer, useProgress } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import type { BodyRegion, Status } from '@/engine/types'
import { BodyModel } from './BodyModel'
import { STATUS_HEX } from './palette'
import { HOME_VIEW, REGIONS } from './regions'
import { useBodyModel } from './useBodyModel'

const GLYPH: Record<Status, string> = { normal: '●', caution: '▲', danger: '◆', 'no-data': '○', stale: '○' }
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

function Scene({ theme, statusByRegion, selected, onSelect }: Body3DProps) {
  const model = useBodyModel()
  const [controls, setControls] = useState<CameraControls | null>(null)
  const [hovered, setHovered] = useState<BodyRegion | null>(null)
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

      {REGIONS.map((r) => {
        const status = statusByRegion[r.id]
        const active = selected === r.id
        const hidden = selected !== null && !active
        return (
          <Html key={r.id} position={model.geometry[r.id].markerAt} center zIndexRange={[20, 0]} style={{ pointerEvents: hidden ? 'none' : 'auto' }}>
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

      <CameraControls ref={setControls} minDistance={0.25} maxDistance={5} smoothTime={0.35} />
    </>
  )
}

export default function Body3D(props: Body3DProps) {
  const { theme } = props
  return (
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
        <Scene {...props} />
      </Suspense>

      <ContactShadows position={[0, 0, 0]} opacity={theme === 'night' ? 0.25 : 0.35} scale={2.5} blur={2.4} far={1} />
    </Canvas>
  )
}
