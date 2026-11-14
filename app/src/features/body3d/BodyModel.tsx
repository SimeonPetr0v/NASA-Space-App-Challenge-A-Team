import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { BodyRegion, Status } from '@/engine/types'
import { effectsAt } from '@/features/body-timeline/BodyTimeline'
import { FALLBACK_TISSUE, STATUS_HEX, TISSUE } from './palette'

const LOSS_TINT = new THREE.Color('#9aa0a6')
import type { BodyModelData } from './useBodyModel'

/*
  Realistic body from the HuBMAP Human Reference Atlas plus BodyParts3D ribs and
  heart vessels (both CC BY 4.0), prepared by scripts/build-body-model.mjs.
  Each mesh carries userData.region and userData.tissue (`${region}:${part}`).
*/

type Theme = 'day' | 'night'

type Props = {
  model: BodyModelData
  theme: Theme
  statusByRegion: Record<BodyRegion, Status>
  selected: BodyRegion | null
  hovered: BodyRegion | null
  onSelect: (region: BodyRegion) => void
  onHover: (region: BodyRegion | null) => void
  onHoverPart?: (tissue: string | null) => void
  timelineDay?: number | null
}

const SKIN = 'whole-body:base'

const regionOf = (obj: THREE.Object3D) => obj.userData.region as BodyRegion | undefined

/* Nearest part that is not the see-through skin; the skin only when nothing is behind it */
const pickPart = (e: ThreeEvent<MouseEvent | PointerEvent>) => {
  const hits = e.intersections.map((i) => i.object).filter((o) => regionOf(o) !== undefined)
  return hits.find((o) => o.userData.tissue !== SKIN) ?? hits[0]
}
const pickRegion = (e: ThreeEvent<MouseEvent | PointerEvent>) => {
  const o = pickPart(e)
  return o ? regionOf(o) : undefined
}

const allMeshes = (model: BodyModelData) => Object.values(model.meshesByRegion).flat()

export function BodyModel({ model, theme, statusByRegion, selected, hovered, onSelect, onHover, onHoverPart, timelineDay = null }: Props) {
  const materials = useMemo(() => {
    const map = new Map<string, THREE.MeshPhysicalMaterial>()
    for (const mesh of allMeshes(model)) {
      const tissue = mesh.userData.tissue as string
      if (map.has(tissue)) continue
      const look = TISSUE[tissue] ?? FALLBACK_TISSUE
      const isSkin = tissue === SKIN
      map.set(
        tissue,
        new THREE.MeshPhysicalMaterial({
          transparent: true,
          roughness: look.roughness,
          metalness: 0,
          clearcoat: look.clearcoat,
          clearcoatRoughness: 0.28,
          sheen: look.sheen ? 0.6 : 0,
          sheenRoughness: 0.5,
          sheenColor: new THREE.Color(look.sheen ?? '#000000'),
          side: isSkin ? THREE.DoubleSide : THREE.FrontSide,
          depthWrite: !isSkin,
        }),
      )
    }
    return map
  }, [model])

  useEffect(() => {
    for (const mesh of allMeshes(model)) {
      const tissue = mesh.userData.tissue as string
      const material = materials.get(tissue)
      if (!material) continue
      mesh.material = material
      mesh.renderOrder = tissue === SKIN ? 2 : 1
    }
    for (const [tissue, material] of materials) {
      const region = tissue.split(':')[0] as BodyRegion
      const look = TISSUE[tissue] ?? FALLBACK_TISSUE
      const isSkin = tissue === SKIN
      const isActive = selected === region || hovered === region
      const dimmed = selected !== null && selected !== region
      material.color.set(theme === 'night' ? look.night : look.day)
      material.opacity = isSkin ? (dimmed ? 0.04 : selected === region ? 0.35 : 0.14) : dimmed ? (region === 'musculoskeletal' ? 0.3 : 0.12) : 1
      material.depthWrite = !isSkin && !dimmed
      material.emissive.set(isActive ? STATUS_HEX[theme][statusByRegion[region]] : '#000000')
      material.emissiveIntensity = selected === region ? 0.1 : isActive ? 0.25 : 0
      if (timelineDay !== null && !dimmed) {
        const fx = effectsAt(timelineDay)
        if (region === 'musculoskeletal') {
          material.opacity = 1 - 0.55 * fx.bone
          material.color.lerp(LOSS_TINT, 0.35 * fx.bone)
          material.depthWrite = fx.bone < 0.3
        }
        if (region === 'eyes' && !isActive) {
          material.emissive.set(STATUS_HEX[theme].caution)
          material.emissiveIntensity = 0.45 * fx.eyes
        }
      }
      material.needsUpdate = true
    }
  }, [model, materials, theme, statusByRegion, selected, hovered, timelineDay])

  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials])

  return (
    <primitive
      object={model.scene}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        const region = pickRegion(e)
        if (region) onSelect(region)
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        const part = pickPart(e)
        const region = part ? (regionOf(part) ?? null) : null
        if (region !== hovered) onHover(region)
        onHoverPart?.((part?.userData.tissue as string | undefined) ?? null)
        document.body.style.cursor = region ? 'pointer' : ''
      }}
      onPointerOut={() => {
        onHover(null)
        onHoverPart?.(null)
        document.body.style.cursor = ''
      }}
    />
  )
}
