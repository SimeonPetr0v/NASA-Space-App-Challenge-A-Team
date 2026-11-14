import { CameraControls, ContactShadows, Environment, Html, Lightformer, useProgress } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import type { BodyRegion, Status } from '@/engine/types'
import { BodyModel } from './BodyModel'
import { type Callout, CalloutOverlay, type CalloutRefs, CalloutTracker } from './Callouts'
import { HOME_VIEW } from './regions'
import { useBodyModel } from './useBodyModel'

export type Body3DProps = {
  theme: 'day' | 'night'
  statusByRegion: Record<BodyRegion, Status>
  callouts: Partial<Record<BodyRegion, Callout>>
  selected: BodyRegion | null
  onSelect: (region: BodyRegion | null) => void
}

type SceneProps = Omit<Body3DProps, 'callouts'> & {
  hovered: BodyRegion | null
  onHover: (region: BodyRegion | null) => void
  refs: CalloutRefs
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

function Scene({ theme, statusByRegion, selected, onSelect, hovered, onHover, refs }: SceneProps) {
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
        onHover={onHover}
      />
      <CalloutTracker model={model} refs={refs} visible={selected === null} />
      <CameraControls ref={setControls} minDistance={0.25} maxDistance={5} smoothTime={0.35} />
    </>
  )
}

export default function Body3D({ callouts, ...props }: Body3DProps) {
  const { theme } = props
  const [hovered, setHovered] = useState<BodyRegion | null>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const refs = useRef<CalloutRefs>({ overlay, labels: {}, lines: {}, dots: {} }).current

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: HOME_VIEW.position, fov: 35, near: 0.02, far: 50 }}
        dpr={[1, 2]}
        aria-label="Interactive 3D body. Use the labels or the readings list to inspect each body system."
      >
        <ambientLight intensity={theme === 'night' ? 0.35 : 0.75} />
        <directionalLight position={[2, 3, 2]} intensity={theme === 'night' ? 0.6 : 1.3} color={theme === 'night' ? '#ffe2c4' : '#ffffff'} />
        <directionalLight position={[-2, 1.5, -2]} intensity={0.45} color={theme === 'night' ? '#f3d2b0' : '#cfe3ff'} />
        <directionalLight position={[0, 1, 3]} intensity={theme === 'night' ? 0.25 : 0.5} />

        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={theme === 'night' ? 0.9 : 2.4} color={theme === 'night' ? '#ffe2c4' : '#ffffff'} position={[0, 4, 3]} scale={[6, 3, 1]} />
          <Lightformer form="rect" intensity={theme === 'night' ? 0.6 : 1.2} color={theme === 'night' ? '#f3d2b0' : '#dfeaff'} position={[-4, 1.5, 1]} rotation-y={Math.PI / 2} scale={[4, 2, 1]} />
          <Lightformer form="rect" intensity={theme === 'night' ? 0.5 : 1} color={theme === 'night' ? '#ffe2c4' : '#fff4e8'} position={[4, 1, -1]} rotation-y={-Math.PI / 2} scale={[4, 2, 1]} />
          <Lightformer form="ring" intensity={theme === 'night' ? 0.4 : 0.8} position={[0, 1, -4]} scale={2} />
        </Environment>

        <Suspense fallback={<Loading />}>
          <Scene {...props} hovered={hovered} onHover={setHovered} refs={refs} />
        </Suspense>

        <ContactShadows position={[0, 0, 0]} opacity={theme === 'night' ? 0.25 : 0.35} scale={2.5} blur={2.4} far={1} />
      </Canvas>

      <CalloutOverlay
        refs={refs}
        callouts={callouts}
        visible={props.selected === null}
        onSelect={(r) => props.onSelect(r)}
        onHover={setHovered}
      />
    </div>
  )
}
