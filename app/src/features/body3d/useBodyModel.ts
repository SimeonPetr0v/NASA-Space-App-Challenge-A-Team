import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { BodyRegion } from '@/engine/types'
import { MODEL_URL, REGIONS, type Vec3 } from './regions'

export type RegionGeometry = {
  center: Vec3
  size: Vec3
  markerAt: Vec3
  focusTarget: Vec3
  focusDistance: number
}

export type BodyModelData = {
  scene: THREE.Group
  meshesByRegion: Record<BodyRegion, THREE.Mesh[]>
  geometry: Record<BodyRegion, RegionGeometry>
}

const regionIds = REGIONS.map((r) => r.id)

export function useBodyModel(): BodyModelData {
  const gltf = useGLTF(MODEL_URL)

  return useMemo(() => {
    const scene = gltf.scene.clone(true)
    scene.updateMatrixWorld(true)

    const meshesByRegion = Object.fromEntries(regionIds.map((id) => [id, [] as THREE.Mesh[]])) as Record<BodyRegion, THREE.Mesh[]>
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      const [region, part = 'base'] = (obj.material as THREE.Material).name.split(':') as [BodyRegion, string?]
      if (!(region in meshesByRegion)) return
      obj.userData.region = region
      obj.userData.tissue = `${region}:${part}`
      meshesByRegion[region].push(obj)
    })

    const geometry = {} as Record<BodyRegion, RegionGeometry>
    for (const meta of REGIONS) {
      const box = new THREE.Box3()
      /* Markers and zoom use the region's main organ (e.g. the spleen for immune), not every part in the system */
      const meshes = meshesByRegion[meta.id]
      const anchor = meshes.filter((m) => m.userData.tissue === `${meta.id}:base`)
      for (const mesh of anchor.length ? anchor : meshes) box.expandByObject(mesh)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const isWholeBody = meta.id === 'whole-body'
      const markerY = isWholeBody ? 0.95 : meta.id === 'musculoskeletal' ? 0.55 : center.y
      const markerX = isWholeBody ? meta.markerSide * 0.32 : meta.id === 'musculoskeletal' ? meta.markerSide * 0.11 : center.x + meta.markerSide * (size.x / 2 + 0.07)
      geometry[meta.id] = {
        center: center.toArray() as Vec3,
        size: size.toArray() as Vec3,
        markerAt: [markerX, markerY, center.z + 0.08],
        focusTarget: center.toArray() as Vec3,
        focusDistance: THREE.MathUtils.clamp(Math.max(size.x, size.y) * 3, 0.4, 2.9),
      }
    }

    return { scene, meshesByRegion, geometry }
  }, [gltf.scene])
}

useGLTF.preload(MODEL_URL)
