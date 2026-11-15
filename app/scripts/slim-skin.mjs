/*
  Slims the skin mesh toward an athletic astronaut build.

  - Works in final body space (Y up, feet at y = 0, ~1.8 m tall, facing +z).
  - Torso and legs are scaled horizontally (x/z) toward a per-slice centre;
    the amount follows SLIM_KEYS (most at the waist, none at head/hands/feet).
  - Arms are left alone: the outer arm by distance from the torso, and the
    BodyParts3D arm skin (frozenKeys: vertex positions) entirely, fading out
    over a few vertex rings around the shoulder seam.
  - Safety: a skin vertex is never moved closer than MARGIN to any organ or bone;
    if the full move would break that, the largest safe partial move is used.
*/
import { normals } from '@gltf-transform/functions'

const HEIGHT = 1.8
const MARGIN = 0.015
const VOXEL = 0.01
const CELL = 0.03
const MIN_ARM_X = 0.22
const SMOOTH_ITERATIONS = 25

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
    for (let k = b - 8; k <= b + 8; k++) w = Math.max(w, bins.get(k) ?? 0)
    return w
  }
}

function weldedView(prim, m) {
  const arr = prim.getAttribute("POSITION").getArray()
  const count = arr.length / 3
  const canon = new Int32Array(count)
  const keyToId = new Map()
  const pos = []
  for (let i = 0; i < count; i++) {
    const key = `${arr[i * 3].toFixed(5)},${arr[i * 3 + 1].toFixed(5)},${arr[i * 3 + 2].toFixed(5)}`
    let id = keyToId.get(key)
    if (id === undefined) {
      id = pos.length
      keyToId.set(key, id)
      pos.push(apply(m, arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]))
    }
    canon[i] = id
  }
  const neighbours = pos.map(() => new Set())
  const idx = prim.getIndices()?.getArray()
  const triCount = idx ? idx.length / 3 : count / 3
  for (let t = 0; t < triCount; t++) {
    const [a, b, c] = [0, 1, 2].map((k) => canon[idx ? idx[t * 3 + k] : t * 3 + k])
    neighbours[a].add(b).add(c)
    neighbours[b].add(a).add(c)
    neighbours[c].add(a).add(b)
  }
  return { canon, pos, neighbours: neighbours.map((s) => [...s]) }
}

function writeBack(prim, inv, canon, pos) {
  const accessor = prim.getAttribute("POSITION")
  const arr = accessor.getArray().slice()
  for (let i = 0; i < canon.length; i++) {
    const local = apply(inv, ...pos[canon[i]])
    arr[i * 3] = local[0]
    arr[i * 3 + 1] = local[1]
    arr[i * 3 + 2] = local[2]
  }
  accessor.setArray(arr)
  prim.setAttribute("NORMAL", null)
}

/*
  Mannequin groin: Laplacian smoothing restricted to an ellipsoid around the
  genitals, with its edge pinned, so the area becomes a smooth surface.
*/
const GROIN = { centre: [0, 0.79, 0.06], radius: [0.085, 0.085, 0.09], minZ: -0.03, iterations: 500, step: 0.6 }

export async function smoothGroin(doc, log = console.log) {
  const root = doc.getRoot()
  const skins = meshNodes(root).filter(isSkin)
  let freed = 0
  for (const node of skins) {
    const m = node.getWorldMatrix()
    const inv = invertAffine(m)
    for (const prim of node.getMesh().listPrimitives()) {
      const { canon, pos, neighbours } = weldedView(prim, m)

      const weight = pos.map((p) => {
        if (p[2] < GROIN.minZ) return 0
        const d = Math.hypot(...[0, 1, 2].map((a) => (p[a] - GROIN.centre[a]) / GROIN.radius[a]))
        return d >= 1 ? 0 : smooth(1 - d)
      })
      const free = weight.map((w, i) => (w > 0 ? i : -1)).filter((i) => i >= 0)
      freed += free.length

      for (let it = 0; it < GROIN.iterations; it++) {
        const next = free.map((i) => {
          const nb = neighbours[i]
          const avg = [0, 0, 0]
          for (const j of nb) for (let a = 0; a < 3; a++) avg[a] += pos[j][a] / nb.length
          const k = GROIN.step * Math.min(1, weight[i] * 2)
          return pos[i].map((v, a) => v + (avg[a] - v) * k)
        })
        free.forEach((i, n) => (pos[i] = next[n]))
      }

      writeBack(prim, inv, canon, pos)
    }
  }
  await doc.transform(normals({ overwrite: true }))
  log(`groin smoothed: ${freed.toLocaleString()} skin vertices reshaped`)
}

export async function slimSkin(doc, log = console.log, frozenKeys = new Set()) {
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
      const { canon, pos: world, neighbours } = weldedView(prim, m)

      /* 1 on the BodyParts3D arm skin, fading over ~8 vertex rings into the torso */
      let frozen = world.map((p) => (frozenKeys.has(p.map((v) => v.toFixed(5)).join(',')) ? 1 : 0))
      const isArm = frozen.slice()
      for (let it = 0; it < 8; it++) {
        frozen = frozen.map((w, i) => {
          if (isArm[i]) return 1
          const nb = neighbours[i]
          return nb.length ? Math.max(w, nb.reduce((m, j) => Math.max(m, frozen[j]), 0) * 0.82) : w
        })
      }
      const armWeight0 = (p) => {
        if (p[1] < 0.75 || p[1] > 1.5) return 0
        const edge = Math.max(halfWidth(p[1]) + 0.05, MIN_ARM_X)
        return smooth(Math.min(1, Math.max(0, (Math.abs(p[0]) - edge) / 0.04)))
      }
      const legSide = (p) => (p[1] < 0.47 * HEIGHT ? Math.sign(p[0]) || 1 : 0)

      const slices = new Map()
      for (const p of world) {
        if (armWeight0(p) > 0.5) continue
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

      const safeT = (p, d) => {
        const q = (k) => [p[0] + d[0] * k, p[1], p[2] + d[1] * k]
        if (!tooClose(env, q(1))) return 1
        if (tooClose(env, p)) return 0
        let lo = 0
        let hi = 1
        for (let k = 0; k < 7; k++) {
          const mid = (lo + hi) / 2
          if (tooClose(env, q(mid))) hi = mid
          else lo = mid
        }
        return lo
      }

      const armWeight = (p, i) => Math.max(armWeight0(p), frozen[i])
      let disp = world.map((p, i) => {
        const f = slimAt(p[1] / HEIGHT) * (1 - armWeight(p, i))
        if (f <= 0.001) return [0, 0]
        const c = centreOf(p)
        if (!c) return [0, 0]
        const d = [(c[0] - p[0]) * f, (c[1] - p[2]) * f]
        const k = safeT(p, d)
        return [d[0] * k, d[1] * k]
      })

      for (let it = 0; it < SMOOTH_ITERATIONS; it++) {
        disp = disp.map((d, i) => {
          const nb = neighbours[i]
          if (nb.length === 0) return d
          let ax = 0
          let az = 0
          for (const j of nb) {
            ax += disp[j][0]
            az += disp[j][1]
          }
          return [(d[0] + ax / nb.length) / 2, (d[1] + az / nb.length) / 2]
        })
      }

      const out = world.map((p, i) => {
        total++
        const d = disp[i].map((v) => v * (1 - frozen[i]))
        if (Math.abs(d[0]) + Math.abs(d[1]) < 1e-5) return p
        const k = safeT(p, d)
        if (k < 1) clamped++
        if (k > 0) moved++
        return [p[0] + d[0] * k, p[1], p[2] + d[1] * k]
      })
      writeBack(prim, inv, canon, out)
    }
  }

  await doc.transform(normals({ overwrite: true }))
  log(`skin slimmed: ${moved.toLocaleString()} of ${total.toLocaleString()} vertices moved, ${clamped.toLocaleString()} limited by the organ/bone margin`)
}
