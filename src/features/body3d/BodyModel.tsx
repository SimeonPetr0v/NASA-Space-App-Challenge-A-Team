import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { BodyRegion, Status } from '@/engine/types'
import { BODY_HEX, STATUS_HEX } from './palette'
import type { BodyModelData } from './useBodyModel'

/*
  Realistic body from the HuBMAP Human Reference Atlas (CC BY 4.0), prepared by
  scripts/build-body-model.mjs. Each mesh carries userData.region.
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

const BASE_COLOR: Record<BodyRegion, keyof (typeof BODY_HEX)['day']> = {
  'whole-body': 'skin',
  brain: 'brain',
  eyes: 'eye',
  heart: 'heart',
  lungs: 'lungs',
  immune: 'spleen',
  musculoskeletal: 'bone',
}

const regionOf = (obj: THREE.Object3D) => obj.userData.region as BodyRegion | undefined

const pickRegion = (e: ThreeEvent<MouseEvent | PointerEvent>) => {
  const regions = e.intersections.map((i) => regionOf(i.object)).filter((r): r is BodyRegion => r !== undefined)
  return regions.find((r) => r !== 'whole-body') ?? regions[0]
}

export function BodyModel({ model, theme, statusByRegion, selected, hovered, onSelect, onHover }: Props) {
  const materials = useMemo(() => {
    const entries = (Object.keys(model.meshesByRegion) as BodyRegion[]).map((region) => {
      const isSkin = region === 'whole-body'
      const material = new THREE.MeshStandardMaterial({
        transparent: true,
        roughness: isSkin ? 0.35 : 0.55,
        metalness: 0.05,
        side: isSkin ? THREE.DoubleSide : THREE.FrontSide,
        depthWrite: !isSkin,
      })
      return [region, material] as const
    })
    return Object.fromEntries(entries) as Record<BodyRegion, THREE.MeshStandardMaterial>
  }, [model])

  useEffect(() => {
    for (const [region, material] of Object.entries(materials) as [BodyRegion, THREE.MeshStandardMaterial][]) {
      const isSkin = region === 'whole-body'
      const isActive = selected === region || hovered === region
      const dimmed = selected !== null && selected !== region
      for (const mesh of model.meshesByRegion[region]) {
        mesh.material = material
        mesh.renderOrder = isSkin ? 2 : 1
      }
      material.color.set(BODY_HEX[theme][BASE_COLOR[region]])
      material.opacity = isSkin ? (dimmed ? 0.04 : selected === region ? 0.35 : 0.14) : dimmed ? (region === 'musculoskeletal' ? 0.3 : 0.12) : 1
      material.depthWrite = !isSkin && !dimmed
      material.emissive.set(isActive ? STATUS_HEX[theme][statusByRegion[region]] : '#000000')
      material.emissiveIntensity = selected === region ? 0.22 : isActive ? 0.3 : 0
      material.needsUpdate = true
    }
  }, [model, materials, theme, statusByRegion, selected, hovered])

  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])

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
