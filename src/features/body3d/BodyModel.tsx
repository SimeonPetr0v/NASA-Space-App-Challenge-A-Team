import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { BodyRegion, Status } from '@/engine/types'
import { FALLBACK_TISSUE, STATUS_HEX, TISSUE } from './palette'
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
}

const regionOf = (obj: THREE.Object3D) => obj.userData.region as BodyRegion | undefined

const pickRegion = (e: ThreeEvent<MouseEvent | PointerEvent>) => {
  const regions = e.intersections.map((i) => regionOf(i.object)).filter((r): r is BodyRegion => r !== undefined)
  return regions.find((r) => r !== 'whole-body') ?? regions[0]
}

const allMeshes = (model: BodyModelData) => Object.values(model.meshesByRegion).flat()

export function BodyModel({ model, theme, statusByRegion, selected, hovered, onSelect, onHover }: Props) {
  const materials = useMemo(() => {
    const map = new Map<string, THREE.MeshPhysicalMaterial>()
    for (const mesh of allMeshes(model)) {
      const tissue = mesh.userData.tissue as string
      if (map.has(tissue)) continue
      const look = TISSUE[tissue] ?? FALLBACK_TISSUE
      const isSkin = tissue.startsWith('whole-body')
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
      const region = mesh.userData.region as BodyRegion
      const material = materials.get(tissue)
      if (!material) continue
      mesh.material = material
      mesh.renderOrder = region === 'whole-body' ? 2 : 1
    }
    for (const [tissue, material] of materials) {
      const region = tissue.split(':')[0] as BodyRegion
      const look = TISSUE[tissue] ?? FALLBACK_TISSUE
      const isSkin = region === 'whole-body'
      const isActive = selected === region || hovered === region
      const dimmed = selected !== null && selected !== region
      material.color.set(theme === 'night' ? look.night : look.day)
      material.opacity = isSkin ? (dimmed ? 0.04 : selected === region ? 0.35 : 0.14) : dimmed ? (region === 'musculoskeletal' ? 0.3 : 0.12) : 1
      material.depthWrite = !isSkin && !dimmed
      material.emissive.set(isActive ? STATUS_HEX[theme][statusByRegion[region]] : '#000000')
      material.emissiveIntensity = selected === region ? 0.1 : isActive ? 0.25 : 0
      material.needsUpdate = true
    }
  }, [model, materials, theme, statusByRegion, selected, hovered])

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
        const region = pickRegion(e) ?? null
        if (region !== hovered) onHover(region)
        document.body.style.cursor = region ? 'pointer' : ''
      }}
      onPointerOut={() => {
        onHover(null)
        document.body.style.cursor = ''
      }}
    />
  )
}
