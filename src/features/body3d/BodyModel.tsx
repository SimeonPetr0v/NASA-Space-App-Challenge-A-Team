import type { ThreeEvent } from '@react-three/fiber'
import type { ReactNode } from 'react'
import type { BodyRegion, Status } from '@/engine/types'
import { BODY_HEX, STATUS_HEX } from './palette'
import type { Vec3 } from './regions'

/*
  Stylized "glass" body built from primitives. Swap for a real anatomy GLB later:
  keep the same region ids and the rest of the feature keeps working.
*/

type Theme = 'day' | 'night'

type ModelProps = {
  theme: Theme
  statusByRegion: Record<BodyRegion, Status>
  selected: BodyRegion | null
  hovered: BodyRegion | null
  onSelect: (region: BodyRegion) => void
  onHover: (region: BodyRegion | null) => void
}

type PartProps = {
  region: BodyRegion
  color: string
  position: Vec3
  scale?: Vec3
  rotation?: Vec3
  skin?: boolean
  children: ReactNode
} & Pick<ModelProps, 'selected' | 'hovered' | 'onSelect' | 'onHover' | 'statusByRegion' | 'theme'>

function Part({ region, color, position, scale, rotation, skin, children, selected, hovered, onSelect, onHover, statusByRegion, theme }: PartProps) {
  const isActive = selected === region || hovered === region
  const dimmed = selected !== null && selected !== region
  const glow = STATUS_HEX[theme][statusByRegion[region]]

  const opacity = skin ? (dimmed ? 0.05 : selected === region ? 0.32 : 0.16) : dimmed ? 0.12 : 1

  const organBehind = (e: ThreeEvent<MouseEvent | PointerEvent>) =>
    skin === true && e.intersections.some((i) => i.object.userData.skin !== true)

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (organBehind(e)) return
    e.stopPropagation()
    onSelect(region)
  }
  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    if (organBehind(e)) return
    e.stopPropagation()
    onHover(region)
    document.body.style.cursor = 'pointer'
  }
  const handleOut = () => {
    onHover(null)
    document.body.style.cursor = ''
  }

  return (
    <mesh userData={{ skin: skin === true }} position={position} scale={scale} rotation={rotation} onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
      {children}
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={!skin && !dimmed}
        roughness={skin ? 0.35 : 0.55}
        metalness={0.05}
        emissive={isActive ? glow : '#000000'}
        emissiveIntensity={isActive ? 0.45 : 0}
      />
    </mesh>
  )
}

export function BodyModel(props: ModelProps) {
  const c = BODY_HEX[props.theme]
  const shared = {
    selected: props.selected,
    hovered: props.hovered,
    onSelect: props.onSelect,
    onHover: props.onHover,
    statusByRegion: props.statusByRegion,
    theme: props.theme,
  }
  const sides = [-1, 1] as const

  return (
    <group>
      <Part {...shared} region="brain" color={c.brain} position={[0, 1.65, 0]} scale={[0.95, 0.8, 1.1]}>
        <sphereGeometry args={[0.085, 32, 24]} />
      </Part>
      {sides.map((s) => (
        <Part key={`eye${s}`} {...shared} region="eyes" color={c.eye} position={[0.035 * s, 1.615, 0.088]}>
          <sphereGeometry args={[0.016, 16, 12]} />
        </Part>
      ))}
      <Part {...shared} region="heart" color={c.heart} position={[0.03, 1.24, 0.04]} scale={[0.9, 1.1, 0.85]}>
        <sphereGeometry args={[0.05, 32, 24]} />
      </Part>
      {sides.map((s) => (
        <Part key={`lung${s}`} {...shared} region="lungs" color={c.lungs} position={[0.085 * s, 1.28, -0.005]} scale={[0.75, 1.35, 0.8]}>
          <sphereGeometry args={[0.09, 32, 24]} />
        </Part>
      ))}
      <Part {...shared} region="immune" color={c.spleen} position={[0.11, 1.08, -0.02]} scale={[0.8, 1.3, 0.7]}>
        <sphereGeometry args={[0.035, 24, 16]} />
      </Part>

      <Part {...shared} region="musculoskeletal" color={c.bone} position={[0, 1.2, -0.055]}>
        <cylinderGeometry args={[0.016, 0.018, 0.58, 12]} />
      </Part>
      {[1.13, 1.2, 1.27, 1.34].map((y) => (
        <Part key={`rib${y}`} {...shared} region="musculoskeletal" color={c.bone} position={[0, y, -0.01]} scale={[1.12, 0.75, 1]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.15, 0.006, 8, 40]} />
        </Part>
      ))}
      {sides.map((s) => (
        <group key={`bones${s}`}>
          <Part {...shared} region="musculoskeletal" color={c.bone} position={[0.1 * s, 0.62, 0]}>
            <cylinderGeometry args={[0.018, 0.016, 0.4, 12]} />
          </Part>
          <Part {...shared} region="musculoskeletal" color={c.bone} position={[0.1 * s, 0.22, 0]}>
            <cylinderGeometry args={[0.015, 0.013, 0.38, 12]} />
          </Part>
          <Part {...shared} region="musculoskeletal" color={c.bone} position={[0.27 * s, 1.24, 0]} rotation={[0, 0, 0.1 * s]}>
            <cylinderGeometry args={[0.014, 0.012, 0.28, 12]} />
          </Part>
          <Part {...shared} region="musculoskeletal" color={c.bone} position={[0.3 * s, 0.92, 0.02]}>
            <cylinderGeometry args={[0.012, 0.01, 0.26, 12]} />
          </Part>
        </group>
      ))}

      <Part {...shared} skin region="whole-body" color={c.skin} position={[0, 1.62, 0]} scale={[0.9, 1.05, 1]}>
        <sphereGeometry args={[0.11, 32, 24]} />
      </Part>
      <Part {...shared} skin region="whole-body" color={c.skin} position={[0, 1.49, 0]}>
        <cylinderGeometry args={[0.045, 0.05, 0.1, 16]} />
      </Part>
      <Part {...shared} skin region="whole-body" color={c.skin} position={[0, 1.18, 0]} scale={[1.3, 1, 0.7]}>
        <capsuleGeometry args={[0.16, 0.38, 8, 24]} />
      </Part>
      <Part {...shared} skin region="whole-body" color={c.skin} position={[0, 0.92, 0]} scale={[1.25, 1, 0.75]}>
        <capsuleGeometry args={[0.14, 0.1, 8, 24]} />
      </Part>
      {sides.map((s) => (
        <group key={`limbs${s}`}>
          <Part {...shared} skin region="whole-body" color={c.skin} position={[0.27 * s, 1.24, 0]} rotation={[0, 0, 0.1 * s]}>
            <capsuleGeometry args={[0.05, 0.26, 8, 16]} />
          </Part>
          <Part {...shared} skin region="whole-body" color={c.skin} position={[0.3 * s, 0.92, 0.02]}>
            <capsuleGeometry args={[0.042, 0.24, 8, 16]} />
          </Part>
          <Part {...shared} skin region="whole-body" color={c.skin} position={[0.1 * s, 0.62, 0]}>
            <capsuleGeometry args={[0.075, 0.34, 8, 16]} />
          </Part>
          <Part {...shared} skin region="whole-body" color={c.skin} position={[0.1 * s, 0.22, 0]}>
            <capsuleGeometry args={[0.055, 0.34, 8, 16]} />
          </Part>
        </group>
      ))}
    </group>
  )
}
