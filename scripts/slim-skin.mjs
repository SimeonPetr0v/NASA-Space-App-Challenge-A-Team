/*
  Slims the skin mesh toward an athletic astronaut build.

  - Works in final body space (Y up, feet at y = 0, ~1.8 m tall, facing +z).
  - Torso and legs are scaled horizontally (x/z) toward a per-slice centre;
    the amount follows SLIM_KEYS (most at the waist, none at head/hands/feet).
  - Arms are left alone (the model has no arm bones to protect them against).
  - Safety: a skin vertex is never moved closer than MARGIN to any organ or bone;
    if the full move would break that, the largest safe partial move is used.
*/
import { normals } from '@gltf-transform/functions'

const HEIGHT = 1.8
const MARGIN = 0.015
const VOXEL = 0.01
const CELL = 0.03

const SLIM_KEYS = [
  [0, 0],
  [0.06, 0],
  [0.15, 0.04],
  [0.28, 0.07],
  [0.4, 0.08],
  [0.47, 0.08],
  [0.53, 0.1],
  [0.6, 0.15],
  [0.66, 0.15],
  [0.72, 0.08],
  [0.78, 0.03],
  [0.82, 0],
  [1, 0],
]

const smooth = (t) => t * t * (3 - 2 * t)

const slimAt = (h) => {
  for (let i = 1; i < SLIM_KEYS.length; i++) {
    const [h1, f1] = SLIM_KEYS[i]
    const [h0, f0] = SLIM_KEYS[i - 1]
    if (h <= h1) return f0 + (f1 - f0) * smooth((h - h0) / (h1 - h0))
  }
  return 0
}

const apply = (m, x, y, z) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
]

const invertAffine = (m) => {
  const [a, b, c, , d, e, f, , g, h, i] = m
  const det = a * (e * i - f * h) - d * (b * i - c * h) + g * (b * f - c * e)
  const inv = [
    (e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det, 0,
    (f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det, 0,
    (d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det, 0,
    0, 0, 0, 1,
  ]
  const [tx, ty, tz] = [m[12], m[13], m[14]]
  inv[12] = -(inv[0] * tx + inv[4] * ty + inv[8] * tz)
  inv[13] = -(inv[1] * tx + inv[5] * ty + inv[9] * tz)
  inv[14] = -(inv[2] * tx + inv[6] * ty + inv[10] * tz)
  return inv
}

const meshNodes = (root) => root.listNodes().filter((n) => n.getMesh())
const isSkin = (node) => node.getMesh().listPrimitives().some((p) => p.getMaterial()?.getName() === 'whole-body')

function buildEnvelope(nodes) {
  const voxels = new Map()
  for (const node of nodes) {
    const m = node.getWorldMatrix()
    for (const prim of node.getMesh().listPrimitives()) {
      const arr = prim.getAttribute('POSITION').getArray()
      for (let i = 0; i < arr.length; i += 3) {
        const p = apply(m, arr[i], arr[i + 1], arr[i + 2])
        const key = `${Math.floor(p[0] / VOXEL)},${Math.floor(p[1] / VOXEL)},${Math.floor(p[2] / VOXEL)}`
        if (!voxels.has(key)) voxels.set(key, p)
      }
    }
  }
  const grid = new Map()
  for (const p of voxels.values()) {
    const key = `${Math.floor(p[0] / CELL)},${Math.floor(p[1] / CELL)},${Math.floor(p[2] / CELL)}`
    if (!grid.has(key)) grid.set(key, [])
    grid.get(key).push(p)
  }
  return { points: [...voxels.values()], grid }
}

function tooClose(env, p) {
  const cx = Math.floor(p[0] / CELL)
  const cy = Math.floor(p[1] / CELL)
  const cz = Math.floor(p[2] / CELL)
  const m2 = MARGIN * MARGIN
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++)
      for (let dz = -1; dz <= 1; dz++) {
        const cell = env.grid.get(`${cx + dx},${cy + dy},${cz + dz}`)
        if (!cell) continue
        for (const q of cell) {
          const ex = p[0] - q[0]
          const ey = p[1] - q[1]
          const ez = p[2] - q[2]
          if (ex * ex + ey * ey + ez * ez < m2) return true
        }
      }
  return false
}

function torsoHalfWidth(env) {
  const bins = new Map()
  for (const p of env.points) {
    if (Math.abs(p[0]) > 0.3 || p[1] < 0.7 || p[1] > 1.55) continue
    const b = Math.round(p[1] * 100)
    bins.set(b, Math.max(bins.get(b) ?? 0, Math.abs(p[0])))
  }
  return (y) => {
    let w = 0
    const b = Math.round(y * 100)
    for (let k = b - 3; k <= b + 3; k++) w = Math.max(w, bins.get(k) ?? 0)
    return w
  }
}

export async function slimSkin(doc, log = console.log) {
  const root = doc.getRoot()
  const nodes = meshNodes(root)
  const skins = nodes.filter(isSkin)
  const env = buildEnvelope(nodes.filter((n) => !isSkin(n)))
  const halfWidth = torsoHalfWidth(env)

  let moved = 0
  let clamped = 0
  let total = 0

  for (const node of skins) {
    const m = node.getWorldMatrix()
    const inv = invertAffine(m)
    for (const prim of node.getMesh().listPrimitives()) {
      const accessor = prim.getAttribute('POSITION')
      const arr = accessor.getArray().slice()
      const world = []
      for (let i = 0; i < arr.length; i += 3) world.push(apply(m, arr[i], arr[i + 1], arr[i + 2]))

      const armWeight = (p) => {
        if (p[1] < 0.75 || p[1] > 1.5) return 0
        const edge = halfWidth(p[1]) + 0.05
        return smooth(Math.min(1, Math.max(0, (Math.abs(p[0]) - edge) / 0.04)))
      }
      const legSide = (p) => (p[1] < 0.47 * HEIGHT ? Math.sign(p[0]) || 1 : 0)

      const slices = new Map()
      for (const p of world) {
        if (armWeight(p) > 0.5) continue
        const key = `${Math.round(p[1] * 100)}:${legSide(p)}`
        const s = slices.get(key) ?? { sx: 0, n: 0, minZ: Infinity, maxZ: -Infinity }
        s.sx += p[0]
        s.n++
        s.minZ = Math.min(s.minZ, p[2])
        s.maxZ = Math.max(s.maxZ, p[2])
        slices.set(key, s)
      }
      const centreOf = (p) => {
        const side = legSide(p)
        const b = Math.round(p[1] * 100)
        let sx = 0
        let n = 0
        let minZ = Infinity
        let maxZ = -Infinity
        for (let k = b - 2; k <= b + 2; k++) {
          const s = slices.get(`${k}:${side}`)
          if (!s) continue
          sx += s.sx
          n += s.n
          minZ = Math.min(minZ, s.minZ)
          maxZ = Math.max(maxZ, s.maxZ)
        }
        if (n === 0) return null
        const zBias = side === 0 ? 0.45 : 0.5
        return [sx / n, minZ + (maxZ - minZ) * zBias]
      }

      for (let v = 0; v < world.length; v++) {
        total++
        const p = world[v]
        const f = slimAt(p[1] / HEIGHT) * (1 - armWeight(p))
        if (f <= 0.001) continue
        const c = centreOf(p)
        if (!c) continue
        const target = [c[0] + (p[0] - c[0]) * (1 - f), p[1], c[1] + (p[2] - c[1]) * (1 - f)]
        let t = 1
        if (tooClose(env, target)) {
          if (tooClose(env, p)) continue
          let lo = 0
          let hi = 1
          for (let k = 0; k < 7; k++) {
            const mid = (lo + hi) / 2
            const q = [p[0] + (target[0] - p[0]) * mid, p[1], p[2] + (target[2] - p[2]) * mid]
            if (tooClose(env, q)) hi = mid
            else lo = mid
          }
          t = lo
          clamped++
        }
        const q = [p[0] + (target[0] - p[0]) * t, p[1], p[2] + (target[2] - p[2]) * t]
        const local = apply(inv, q[0], q[1], q[2])
        arr[v * 3] = local[0]
        arr[v * 3 + 1] = local[1]
        arr[v * 3 + 2] = local[2]
        moved++
      }
      accessor.setArray(arr)
    }
  }

  for (const node of skins) for (const prim of node.getMesh().listPrimitives()) prim.setAttribute('NORMAL', null)
  await doc.transform(normals({ overwrite: true }))
  log(`skin slimmed: ${moved.toLocaleString()} of ${total.toLocaleString()} vertices moved, ${clamped.toLocaleString()} limited by the organ/bone margin`)
}
