/*
  Arms from one source: the BodyParts3D (CC BY 4.0) arm skin and arm bones,
  posed together into the arm pose of our body's (HRA) skin and stitched onto
  the HRA skin at the shoulder.

  All positions are in final body space (Y up, ~1.8 m tall, facing +z).
  - The BodyParts3D arm skin is cut off its torso by an upright plane
    through its armpit (the top of the arm-torso gap seen from the front).
  - Each segment of the BodyParts3D arm (skin + humerus, radius/ulna, hand
    bones) (upper arm, forearm, hand) is turned and
    stretched onto the HRA arm: shoulder fixed, elbow and wrist on the HRA
    arm's centre line. Skin and bones get the identical transform per
    segment, so the bones stay inside their own skin; the skin is blended
    smoothly between segments over a few centimetres at elbow and wrist.
  - The inner elbow is smoothed (the source arm was bent and pressed flat).
  - Both the posed arm skin and the HRA skin are cut at one seam plane
    through the posed armpit; the arm rim is morphed over a few centimetres
    onto the HRA rim, the rims are zipped together and a narrow band along
    the seam is smoothed.
*/
import { MeshoptSimplifier } from 'meshoptimizer'

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const len = (a) => Math.hypot(a[0], a[1], a[2])
const unit = (a) => mul(a, 1 / (len(a) || 1))
const at = (pos, i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]
const smoothstep = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t))

/* Rotation taking unit vector u onto unit vector v (Rodrigues) */
const rotation = (u, v) => {
  const axis = cross(u, v)
  const s = len(axis)
  const c = dot(u, v)
  if (s < 1e-9) return (p) => p
  const k = mul(axis, 1 / s)
  return (p) => add(add(mul(p, c), mul(cross(k, p), s)), mul(k, dot(k, p) * (1 - c)))
}

/* Merge vertices closer than eps and drop degenerate triangles */
export const weldMesh = (pos, idx, eps = 1e-5) => {
  const map = new Map()
  const out = []
  const remap = new Uint32Array(pos.length / 3)
  for (let i = 0; i < pos.length / 3; i++) {
    const key = `${Math.round(pos[i * 3] / eps)},${Math.round(pos[i * 3 + 1] / eps)},${Math.round(pos[i * 3 + 2] / eps)}`
    let id = map.get(key)
    if (id === undefined) {
      id = out.length / 3
      map.set(key, id)
      out.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])
    }
    remap[i] = id
  }
  const tris = []
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [remap[idx[t]], remap[idx[t + 1]], remap[idx[t + 2]]]
    if (a !== b && b !== c && a !== c) tris.push(a, b, c)
  }
  return { pos: out, idx: tris }
}

/* Keep only the vertices used by idx */
const compact = (pos, idx) => {
  const remap = new Map()
  const out = []
  const tris = idx.map((i) => {
    let id = remap.get(i)
    if (id === undefined) {
      id = out.length / 3
      remap.set(i, id)
      out.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])
    }
    return id
  })
  return { pos: out, idx: tris }
}

/*
  Split a mesh by the plane dot(n, p) = d. Returns the extended positions and
  the triangles on each side; new vertices on the plane are shared by both.
*/
const clipByPlane = (pos, idx, n, d) => {
  const out = [...pos]
  const s = []
  for (let i = 0; i < pos.length / 3; i++) {
    const v = dot(n, at(pos, i)) - d
    s.push(Math.abs(v) < 1e-7 ? 0 : v)
  }
  const cut = new Map()
  const cutVertex = (a, b) => {
    const key = a < b ? `${a},${b}` : `${b},${a}`
    let id = cut.get(key)
    if (id === undefined) {
      const t = s[a] / (s[a] - s[b])
      const p = add(at(out, a), mul(sub(at(out, b), at(out, a)), t))
      id = out.length / 3
      out.push(...p)
      cut.set(key, id)
    }
    return id
  }
  const above = []
  const below = []
  const fan = (poly, list) => {
    for (let k = 1; k < poly.length - 1; k++) list.push(poly[0], poly[k], poly[k + 1])
  }
  for (let t = 0; t < idx.length; t += 3) {
    const tri = [idx[t], idx[t + 1], idx[t + 2]]
    const sg = tri.map((i) => s[i])
    if (sg.every((v) => v >= 0)) {
      above.push(...tri)
      continue
    }
    if (sg.every((v) => v <= 0)) {
      below.push(...tri)
      continue
    }
    const pa = []
    const pb = []
    for (let k = 0; k < 3; k++) {
      const a = tri[k]
      const b = tri[(k + 1) % 3]
      if (s[a] >= 0) pa.push(a)
      if (s[a] <= 0) pb.push(a)
      if (s[a] * s[b] < 0) {
        const c = cutVertex(a, b)
        pa.push(c)
        pb.push(c)
      }
    }
    fan(pa, above)
    fan(pb, below)
  }
  return { pos: out, above, below, side: (i) => (i < s.length ? s[i] : 0) }
}

/* Connected components of a triangle list: component id per triangle */
const triComponents = (idx, nv) => {
  const parent = new Int32Array(nv).map((_, i) => i)
  const find = (i) => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]]
    return i
  }
  for (let t = 0; t < idx.length; t += 3) {
    const a = find(idx[t])
    parent[find(idx[t + 1])] = a
    parent[find(idx[t + 2])] = a
  }
  const comp = []
  for (let t = 0; t < idx.length; t += 3) comp.push(find(idx[t]))
  return comp
}

/* Closed boundary loops (vertex index lists) of a triangle list */
const boundaryLoops = (idx) => {
  const count = new Map()
  for (let t = 0; t < idx.length; t += 3)
    for (let k = 0; k < 3; k++) {
      const a = idx[t + k]
      const b = idx[t + ((k + 1) % 3)]
      const key = a < b ? `${a},${b}` : `${b},${a}`
      count.set(key, (count.get(key) ?? 0) + 1)
    }
  const next = new Map()
  for (let t = 0; t < idx.length; t += 3)
    for (let k = 0; k < 3; k++) {
      const a = idx[t + k]
      const b = idx[t + ((k + 1) % 3)]
      if (count.get(a < b ? `${a},${b}` : `${b},${a}`) === 1) next.set(a, b)
    }
  const loops = []
  const seen = new Set()
  for (const startV of next.keys()) {
    if (seen.has(startV)) continue
    const loop = []
    let v = startV
    while (v !== undefined && !seen.has(v)) {
      seen.add(v)
      loop.push(v)
      v = next.get(v)
    }
    if (v === startV && loop.length > 2) loops.push(loop)
  }
  return loops
}

/*
  The armpit seen from the front: the top of the gap between arm and torso
  in the skin's front silhouette (x-y), searched below the shoulder joint.
*/
const armpit = (pos, idx, sign, shoulder) => {
  const R = 0.003
  const x0 = 0
  const x1 = 0.7
  const y1 = shoulder[1] + 0.02
  const y0 = shoulder[1] - 0.35
  const nx = Math.ceil((x1 - x0) / R)
  const ny = Math.ceil((y1 - y0) / R)
  const grid = new Uint8Array(nx * ny)
  for (let t = 0; t < idx.length; t += 3) {
    const P = [0, 1, 2].map((k) => {
      const p = at(pos, idx[t + k])
      return [(p[0] * sign - x0) / R, (p[1] - y0) / R]
    })
    const minX = Math.max(0, Math.floor(Math.min(P[0][0], P[1][0], P[2][0])))
    const maxX = Math.min(nx - 1, Math.ceil(Math.max(P[0][0], P[1][0], P[2][0])))
    const minY = Math.max(0, Math.floor(Math.min(P[0][1], P[1][1], P[2][1])))
    const maxY = Math.min(ny - 1, Math.ceil(Math.max(P[0][1], P[1][1], P[2][1])))
    const den = (P[1][1] - P[2][1]) * (P[0][0] - P[2][0]) + (P[2][0] - P[1][0]) * (P[0][1] - P[2][1])
    if (!den) continue
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        const w0 = ((P[1][1] - P[2][1]) * (x + 0.5 - P[2][0]) + (P[2][0] - P[1][0]) * (y + 0.5 - P[2][1])) / den
        const w1 = ((P[2][1] - P[0][1]) * (x + 0.5 - P[2][0]) + (P[0][0] - P[2][0]) * (y + 0.5 - P[2][1])) / den
        if (w0 >= -0.02 && w1 >= -0.02 && w0 + w1 <= 1.02) grid[y * nx + x] = 1
      }
  }
  /* For each row: the first gap (empty run between filled runs) outward from the middle */
  const gapAt = (y) => {
    let x = 0
    while (x < nx && !grid[y * nx + x]) x++
    while (x < nx && grid[y * nx + x]) x++
    const g0 = x
    while (x < nx && !grid[y * nx + x]) x++
    if (x >= nx) return null
    return [g0, x]
  }
  for (let y = ny - 1; y >= 5; y--) {
    const run = [0, 1, 2, 3, 4].map((k) => gapAt(y - k))
    if (run.every(Boolean)) {
      const [g0, g1] = run[0]
      return [sign * (x0 + ((g0 + g1) / 2) * R), y0 + (y + 0.5) * R, 0]
    }
  }
  throw new Error('armpit not found')
}

/* Main axis of a point set (power iteration), oriented downward */
const mainAxis = (pos) => {
  const n = pos.length / 3
  const c = [0, 0, 0]
  for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) c[a] += pos[i * 3 + a] / n
  const cov = Array(9).fill(0)
  for (let i = 0; i < n; i++) {
    const d = sub(at(pos, i), c)
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) cov[a * 3 + b] += d[a] * d[b]
  }
  let v = [0, -1, 0]
  for (let k = 0; k < 50; k++) v = unit([0, 1, 2].map((a) => cov[a * 3] * v[0] + cov[a * 3 + 1] * v[1] + cov[a * 3 + 2] * v[2]))
  return v[1] > 0 ? mul(v, -1) : v
}

/* Centres of the vertices within 1.5 cm of each end of a bone along its main axis */
const boneEnds = (pos) => {
  const u = mainAxis(pos)
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < pos.length / 3; i++) {
    const s = dot(at(pos, i), u)
    lo = Math.min(lo, s)
    hi = Math.max(hi, s)
  }
  const centre = (pick) => {
    const c = [0, 0, 0]
    let m = 0
    for (let i = 0; i < pos.length / 3; i++) {
      if (!pick(dot(at(pos, i), u))) continue
      for (let a = 0; a < 3; a++) c[a] += pos[i * 3 + a]
      m++
    }
    return mul(c, 1 / m)
  }
  return { top: centre((s) => s < lo + 0.015), bottom: centre((s) => s > hi - 0.015) }
}

/* Cross-section of a point set at the plane through c with normal u (+-w): centre and mean half-size */
const section = (pos, c, u, w = 0.01) => {
  const e1 = unit(cross(u, Math.abs(u[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]))
  const e2 = cross(u, e1)
  let a0 = Infinity
  let a1 = -Infinity
  let b0 = Infinity
  let b1 = -Infinity
  let m = 0
  for (let i = 0; i < pos.length / 3; i++) {
    const d = sub(at(pos, i), c)
    if (Math.abs(dot(d, u)) > w) continue
    const a = dot(d, e1)
    const b = dot(d, e2)
    if (Math.hypot(a, b) > 0.12) continue
    a0 = Math.min(a0, a)
    a1 = Math.max(a1, a)
    b0 = Math.min(b0, b)
    b1 = Math.max(b1, b)
    m++
  }
  if (m < 6) return null
  return { centre: add(c, add(mul(e1, (a0 + a1) / 2), mul(e2, (b0 + b1) / 2))), radius: (a1 - a0 + b1 - b0) / 4, area: (a1 - a0) * (b1 - b0) }
}

/* Cut an arm off a skin mesh: plane through the armpit, keep the piece holding the hand */
const cutArm = (pos, idx, sign, n, d) => {
  const clip = clipByPlane(pos, idx, n, d)
  const comp = triComponents(clip.above, clip.pos.length / 3)
  /* The arm piece holds the vertex farthest out along n */
  let best = -Infinity
  let armComp = -1
  for (let t = 0; t < clip.above.length; t += 3) {
    const v = dot(n, at(clip.pos, clip.above[t]))
    if (v > best) {
      best = v
      armComp = comp[t / 3]
    }
  }
  const arm = []
  const rest = [...clip.below]
  for (let t = 0; t < clip.above.length; t += 3) (comp[t / 3] === armComp ? arm : rest).push(clip.above[t], clip.above[t + 1], clip.above[t + 2])
  const onPlane = (i) => Math.abs(dot(n, at(clip.pos, i)) - d) < 1e-6
  const loops = boundaryLoops(arm).filter((l) => l.every(onPlane))
  loops.sort((a, b) => b.length - a.length)
  return { pos: clip.pos, arm, rest, rim: loops[0] ?? [] }
}

/*
  Polar outline of a closed planar rim around centre o (plane axes ea, eb):
  radius at angle theta = farthest crossing of the ray with the rim.
*/
const polarRim = (pos, rim, o, ea, eb) => {
  const pts = rim.map((i) => {
    const d = sub(at(pos, i), o)
    return [dot(d, ea), dot(d, eb)]
  })
  return (theta) => {
    const dx = Math.cos(theta)
    const dy = Math.sin(theta)
    let r = 0
    for (let k = 0; k < pts.length; k++) {
      const [ax, ay] = pts[k]
      const [bx, by] = pts[(k + 1) % pts.length]
      const ex = bx - ax
      const ey = by - ay
      const den = dx * ey - dy * ex
      if (Math.abs(den) < 1e-12) continue
      const t = (ax * ey - ay * ex) / den
      const s = (ax * dy - ay * dx) / den
      if (t > 0 && s >= 0 && s <= 1) r = Math.max(r, t)
    }
    return r
  }
}

/*
  hra: { pos, idx } HRA skin; bp: { pos, idx } BodyParts3D skin (same space);
  bones: { hum, fore, hand } BodyParts3D bone positions (same space).
  Returns the HRA skin without this arm plus the posed BodyParts3D arm
  stitched on, and the posed bones.
*/
export function bp3dArm({ hra, bp, bones, sign, side, armTris = 10500, log = console.log }) {
  const hum = boneEnds(bones.hum)
  const fore = boneEnds(bones.fore)
  const S = hum.top
  const E = mul(add(hum.bottom, fore.top), 0.5)
  const W = fore.bottom

  /*
    1. Both skins are first cut by an upright plane through their own armpit
    (the top of the gap between arm and torso seen from the front).
  */
  const n = [sign, 0, 0]
  const hraPit = armpit(hra.pos, hra.idx, sign, S)
  const bpPit = armpit(bp.pos, bp.idx, sign, S)
  log(`armpit ${side}: HRA ${hraPit.slice(0, 2).map((v) => v.toFixed(3)).join(', ')}, BodyParts3D ${bpPit.slice(0, 2).map((v) => v.toFixed(3)).join(', ')} (shoulder ${S.map((v) => v.toFixed(3)).join(', ')})`)
  const hraCut0 = cutArm(hra.pos, hra.idx, sign, n, dot(n, hraPit))
  const bpCut = cutArm(bp.pos, bp.idx, sign, n, dot(n, bpPit))
  let piece = compact(bpCut.pos, bpCut.arm)
  piece = weldMesh(piece.pos, piece.idx)
  {
    const [out] = MeshoptSimplifier.simplify(new Uint32Array(piece.idx), new Float32Array(piece.pos), 3, Math.min(piece.idx.length, armTris * 3), 0.05, ['LockBorder'])
    log(`BodyParts3D arm skin ${side}: ${piece.idx.length / 3} -> ${out.length / 3} tris`)
    piece = compact(piece.pos, [...out])
  }

  /* 2. HRA arm landmarks: fingertip, wrist (narrowest section 12-30 cm above the tip), elbow */
  const hraArm = compact(hraCut0.pos, hraCut0.arm).pos
  let F1 = S
  for (let i = 0; i < hraArm.length / 3; i++) if (len(sub(at(hraArm, i), S)) > len(sub(F1, S))) F1 = at(hraArm, i)
  const axis1 = unit(sub(F1, S))
  let W1 = null
  let narrow = Infinity
  for (let dist = 0.12; dist <= 0.3; dist += 0.005) {
    const sec = section(hraArm, sub(F1, mul(axis1, dist)), axis1)
    if (sec && sec.area < narrow) {
      narrow = sec.area
      W1 = sec.centre
    }
  }
  const lh = len(sub(E, S))
  const lf = len(sub(W, E))
  const E1guess = add(S, mul(sub(W1, S), lh / (lh + lf)))
  const E1 = section(hraArm, E1guess, unit(sub(W1, S)), 0.015)?.centre ?? E1guess

  /* BodyParts3D fingertip: the arm skin point farthest beyond the wrist */
  const uF0 = unit(sub(W, E))
  let F0 = W
  for (let i = 0; i < piece.pos.length / 3; i++) {
    const p = at(piece.pos, i)
    if (dot(sub(p, W), uF0) > 0 && len(sub(p, W)) > len(sub(F0, W))) F0 = p
  }

  /* 3. Segment transforms: turn + stretch along the bone, radial scale from the skin thickness */
  const uH0 = unit(sub(E, S))
  const uH1 = unit(sub(E1, S))
  const uF1 = unit(sub(W1, E1))
  const radiusRatio = (a0, b0, a1, b1) => {
    const r0 = []
    const r1 = []
    for (const t of [0.35, 0.45, 0.55, 0.65]) {
      const s0 = section(piece.pos, add(a0, mul(sub(b0, a0), t)), unit(sub(b0, a0)))
      const s1 = section(hraArm, add(a1, mul(sub(b1, a1), t)), unit(sub(b1, a1)))
      if (s0 && s1) {
        r0.push(s0.radius)
        r1.push(s1.radius)
      }
    }
    const k = r1.reduce((a, b) => a + b, 0) / Math.max(1e-6, r0.reduce((a, b) => a + b, 0))
    return Math.min(1.4, Math.max(0.85, k || 1))
  }
  const segment = (a0, b0, a1, b1, kr, rot) => {
    const u0 = unit(sub(b0, a0))
    const ka = len(sub(b1, a1)) / len(sub(b0, a0))
    const R = rot ?? rotation(u0, unit(sub(b1, a1)))
    return { ka, kr, R, map: (p) => {
      const d = sub(p, a0)
      const along = dot(d, u0)
      return add(a1, R(add(mul(u0, along * ka), mul(sub(d, mul(u0, along)), kr))))
    } }
  }
  const Th = segment(S, E, S, E1, radiusRatio(S, E, S, E1))
  /* The forearm first follows the upper arm's turn, then bends at the elbow only (no twist between the two) */
  const bend = rotation(Th.R(uF0), uF1)
  const Tf = segment(E, W, E1, W1, radiusRatio(E, W, E1, W1), (p) => bend(Th.R(p)))
  /* Hand: same turn as the forearm, then aimed at the HRA fingertips; uniform scale to the HRA hand length */
  const uHand0 = unit(sub(F0, W))
  const uHand1 = unit(sub(F1, W1))
  const aim = rotation(Tf.R(uHand0), uHand1)
  const kHand = Math.min(1.35, Math.max(0.8, len(sub(F1, W1)) / len(sub(F0, W))))
  const Rhand = (p) => aim(Tf.R(p))
  const Thand = { map: (p) => add(W1, Rhand(mul(sub(p, W), kHand))) }
  const deg = (a, b) => ((Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) * 180) / Math.PI).toFixed(1)
  log(`elbow ${side}: ${E1.map((v) => v.toFixed(3)).join(", ")}; wrist ${W1.map((v) => v.toFixed(3)).join(", ")}`)
  log(`arm pose ${side}: upper arm turned ${deg(uH0, uH1)} deg (x${Th.ka.toFixed(2)} long, x${Th.kr.toFixed(2)} thick), forearm ${deg(uF0, uF1)} deg (x${Tf.ka.toFixed(2)}, x${Tf.kr.toFixed(2)}), hand aimed ${deg(Tf.R(uHand0), uHand1)} deg, x${kHand.toFixed(2)}`)

  /* Skin weights: smooth blends across the elbow and wrist bisector planes */
  const nE = unit(add(uH0, uF0))
  const nW = unit(add(uF0, uHand0))
  const BE = 0.055
  const BW = 0.02
  const posed = []
  for (let i = 0; i < piece.pos.length / 3; i++) {
    const p = at(piece.pos, i)
    const wf = smoothstep((dot(sub(p, E), nE) + BE) / (2 * BE))
    const wh = smoothstep((dot(sub(p, W), nW) + BW) / (2 * BW))
    const a = Th.map(p)
    const b = Tf.map(p)
    const c = Thand.map(p)
    const q = add(mul(add(mul(a, 1 - wf), mul(b, wf)), 1 - wh), mul(c, wh))
    posed.push(...q)
  }
  const mapAll = (pos, f) => {
    const out = new Float32Array(pos.length)
    for (let i = 0; i < pos.length / 3; i++) out.set(f(at(pos, i)), i * 3)
    return out
  }
  const boneOut = { hum: mapAll(bones.hum, Th.map), fore: mapAll(bones.fore, Tf.map), hand: mapAll(bones.hand, Thand.map) }

  /*
    The BodyParts3D arm was scanned bent with its inner upper arm pressed
    flat, which leaves a step at the inner elbow once straightened. The skin
    around the elbow (fading out by ELBOW_SMOOTH) is smoothed without
    shrinking (Taubin: alternating +0.5 / -0.53 Laplacian steps).
  */
  {
    const ELBOW_SMOOTH = 0.09
    /* Zone: within ELBOW_SMOOTH of the line from 4 cm above the elbow to 14 cm down the forearm */
    const z0 = sub(E1, mul(uH1, 0.04))
    const z1 = add(E1, mul(uF1, 0.14))
    const zoneDist = (p) => {
      const d = sub(z1, z0)
      const t = Math.max(0, Math.min(1, dot(sub(p, z0), d) / dot(d, d)))
      return len(sub(p, add(z0, mul(d, t))))
    }
    const nb = Array.from({ length: posed.length / 3 }, () => new Set())
    for (let t = 0; t < piece.idx.length; t += 3)
      for (let k = 0; k < 3; k++) {
        const a = piece.idx[t + k]
        nb[a].add(piece.idx[t + ((k + 1) % 3)]).add(piece.idx[t + ((k + 2) % 3)])
      }
    const edgeVerts = new Set(boundaryLoops(piece.idx).flat())
    const w = nb.map((_, i) => (edgeVerts.has(i) ? 0 : smoothstep(1 - zoneDist(at(posed, i)) / ELBOW_SMOOTH)))
    for (let it = 0; it < 120; it++) {
      const k = it % 2 ? -0.53 : 0.5
      const next = posed.slice()
      for (let i = 0; i < nb.length; i++) {
        if (!w[i] || !nb[i].size) continue
        const avg = [0, 0, 0]
        for (const j of nb[i]) for (let a = 0; a < 3; a++) avg[a] += posed[j * 3 + a] / nb[i].size
        for (let a = 0; a < 3; a++) next[i * 3 + a] = posed[i * 3 + a] + (avg[a] - posed[i * 3 + a]) * k * w[i]
      }
      for (let i = 0; i < posed.length; i++) posed[i] = next[i]
    }
  }

  /*
    4. Seam plane through the posed BodyParts3D armpit, its top leaning out by
    12 degrees so it stays between the inner upper arm and the torso. The posed arm skin and our skin are both cut
    there, and the arm rim is morphed over MORPH cm onto our skin's rim.
  */
  const SEAM_LEAN = (-12 * Math.PI) / 180
  const nP = unit([sign * Math.cos(SEAM_LEAN), Math.sin(SEAM_LEAN), 0])
  /* Just outside the arm piece's own cut edge, so the seam plane crosses the piece cleanly */
  const edge = Math.max(...boundaryLoops(piece.idx).flat().map((i) => dot(nP, at(posed, i))))
  const dP = edge + 0.003
  log(`seam ${side}: plane ${((dP - dot(nP, Th.map(bpPit))) * 100).toFixed(1)} cm outside the posed armpit, ${((dP - dot(nP, hraPit)) * 100).toFixed(1)} cm outside our armpit`)
  const hraCut = cutArm(hra.pos, hra.idx, sign, nP, dP)
  const armCut = cutArm(posed, piece.idx, sign, nP, dP)
  const arm = compact(armCut.pos, armCut.arm)
  const armRim = boundaryLoops(arm.idx).filter((l) => l.every((i) => Math.abs(dot(nP, at(arm.pos, i)) - dP) < 1e-5)).sort((a, b) => b.length - a.length)[0]
  const hraRim = hraCut.rim
  if (!armRim || !hraRim.length) throw new Error(`shoulder rim not found (${side})`)
  const centreOf = (pos, rim) => mul(rim.reduce((c, i) => add(c, at(pos, i)), [0, 0, 0]), 1 / rim.length)
  const O = centreOf(hraCut.pos, hraRim)
  const ea = unit(sub([0, 0, 1], mul(nP, nP[2])))
  const eb = cross(nP, ea)
  const rH = polarRim(hraCut.pos, hraRim, O, ea, eb)
  const rB = polarRim(arm.pos, armRim, O, ea, eb)
  const MORPH = 0.06
  let maxMove = 0
  for (let i = 0; i < arm.pos.length / 3; i++) {
    const p = at(arm.pos, i)
    const dist = dot(nP, p) - dP
    const f = smoothstep(1 - dist / MORPH)
    if (f <= 0) continue
    const q = sub(sub(p, O), mul(nP, dist))
    const a = dot(q, ea)
    const b = dot(q, eb)
    const theta = Math.atan2(b, a)
    const rb = rB(theta)
    const k = rb > 1e-6 ? rH(theta) / rb : 1
    const np = add(add(O, mul(nP, dist)), mul(add(mul(ea, a), mul(eb, b)), 1 + f * (k - 1)))
    maxMove = Math.max(maxMove, len(sub(np, p)))
    arm.pos.splice(i * 3, 3, ...np)
  }
  log(`shoulder seam ${side}: HRA rim ${hraRim.length} pts, arm rim ${armRim.length} pts, rim morph up to ${(maxMove * 100).toFixed(1)} cm`)

  /* 5. Join: HRA skin without the arm + the arm, rims zipped by angle */
  const base = compact(hraCut.pos, hraCut.rest)
  /* compact() renumbers; find the HRA rim in the compacted mesh by position */
  const keyOf = (p) => p.map((v) => v.toFixed(6)).join(',')
  const baseIndex = new Map()
  for (let i = 0; i < base.pos.length / 3; i++) baseIndex.set(keyOf(at(base.pos, i)), i)
  const rimH = hraRim.map((i) => baseIndex.get(keyOf(at(hraCut.pos, i)))).filter((i) => i !== undefined)
  const offset = base.pos.length / 3
  const pos = [...base.pos, ...arm.pos]
  const idx = [...base.idx, ...arm.idx.map((i) => i + offset)]
  const angle = (i) => {
    const d = sub(at(pos, i), O)
    return Math.atan2(dot(d, eb), dot(d, ea))
  }
  const ringH = rimH.map((i) => ({ i, a: angle(i) })).sort((x, y) => x.a - y.a)
  const ringB = armRim.map((i) => ({ i: i + offset, a: angle(i + offset) })).sort((x, y) => x.a - y.a)
  let h = 0
  let b = 0
  const NH = ringH.length
  const NB = ringB.length
  while (h < NH || b < NB) {
    const h0 = ringH[h % NH]
    const b0 = ringB[b % NB]
    const nextH = h < NH ? ringH[(h + 1) % NH].a + (h + 1 >= NH ? 2 * Math.PI : 0) : Infinity
    const nextB = b < NB ? ringB[(b + 1) % NB].a + (b + 1 >= NB ? 2 * Math.PI : 0) : Infinity
    if (nextH <= nextB) {
      idx.push(h0.i, ringH[(h + 1) % NH].i, b0.i)
      h++
    } else {
      idx.push(h0.i, ringB[(b + 1) % NB].i, b0.i)
      b++
    }
  }
  /* Smooth a band of SEAM_BAND on both sides of the seam (Taubin, no shrinking) */
  {
    const SEAM_BAND = 0.035
    const nv = pos.length / 3
    const nb = Array.from({ length: nv }, () => new Set())
    for (let t = 0; t < idx.length; t += 3)
      for (let k = 0; k < 3; k++) nb[idx[t + k]].add(idx[t + ((k + 1) % 3)]).add(idx[t + ((k + 2) % 3)])
    const reach = 1.4 * Math.max(...hraRim.map((i) => len(sub(at(hraCut.pos, i), O))))
    const w = []
    for (let i = 0; i < nv; i++) {
      const p = at(pos, i)
      w.push(len(sub(p, O)) > reach ? 0 : smoothstep(1 - Math.abs(dot(nP, p) - dP) / SEAM_BAND))
    }
    for (let it = 0; it < 30; it++) {
      const k = it % 2 ? -0.53 : 0.5
      const next = pos.slice()
      for (let i = 0; i < nv; i++) {
        if (!w[i] || !nb[i].size) continue
        const avg = [0, 0, 0]
        for (const j of nb[i]) for (let c = 0; c < 3; c++) avg[c] += pos[j * 3 + c] / nb[i].size
        for (let c = 0; c < 3; c++) next[i * 3 + c] = pos[i * 3 + c] + (avg[c] - pos[i * 3 + c]) * k * w[i]
      }
      for (let i = 0; i < pos.length; i++) pos[i] = next[i]
    }
  }
  return { skin: { pos, idx }, armSkin: pos.slice(offset * 3), bones: boneOut, landmarks: { S, E1, W1, F1 } }
}

/*
  Exact inside-the-skin test: skin triangles bucketed in 2 cm height slabs;
  a point is inside when a ray toward +x crosses the skin an odd number of times.
*/
export const insideTester = (pos, idx) => {
  const SLAB = 0.02
  const slabs = new Map()
  for (let t = 0; t < idx.length; t += 3) {
    const ys = [0, 1, 2].map((k) => pos[idx[t + k] * 3 + 1])
    for (let k = Math.floor(Math.min(...ys) / SLAB); k <= Math.floor(Math.max(...ys) / SLAB); k++) {
      if (!slabs.has(k)) slabs.set(k, [])
      slabs.get(k).push(t)
    }
  }
  const inside = (x, y, z) => {
    let crossings = 0
    for (const t of slabs.get(Math.floor(y / SLAB)) ?? []) {
      const A = at(pos, idx[t])
      const B = at(pos, idx[t + 1])
      const C = at(pos, idx[t + 2])
      const det = (B[1] - A[1]) * (C[2] - A[2]) - (C[1] - A[1]) * (B[2] - A[2])
      if (!det) continue
      const l1 = ((y - A[1]) * (C[2] - A[2]) - (C[1] - A[1]) * (z - A[2])) / det
      const l2 = ((B[1] - A[1]) * (z - A[2]) - (y - A[1]) * (B[2] - A[2])) / det
      if (l1 < 0 || l2 < 0 || l1 + l2 > 1) continue
      if (A[0] + l1 * (B[0] - A[0]) + l2 * (C[0] - A[0]) > x) crossings++
    }
    return crossings % 2 === 1
  }
  /* Share of (up to max) sampled points inside */
  return (arr, max = 2000) => {
    const step = Math.max(1, Math.floor(arr.length / 3 / max))
    let hit = 0
    let n = 0
    for (let i = 0; i < arr.length; i += 3 * step) {
      n++
      if (inside(arr[i], arr[i + 1], arr[i + 2])) hit++
    }
    return hit / Math.max(1, n)
  }
}
