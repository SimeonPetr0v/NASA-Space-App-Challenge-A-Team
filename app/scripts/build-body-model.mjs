/*
  Builds public/models/body.glb from the Human Reference Atlas "united male" model.

  Source: HuBMAP Human Reference Atlas, 3D Reference Organ Set for United, Male v1.10
  https://purl.humanatlas.io/ref-organ/united-male/v1.10  (CC BY 4.0)
  Download (242 MB, keep it OUT of the repo):
  https://cdn.humanatlas.io/digital-objects/ref-organ/united-male/v1.10/assets/3d-vh-m-united.glb

  Usage: node scripts/build-body-model.mjs <path-to-3d-vh-m-united.glb> [bodyparts3d-dir]

  Output: one material per body region (material name = region id used in the app),
  simplified meshes, Y-up, ~1.8 units tall with feet at y = 0, meshopt-compressed.
*/
import { mkdirSync, readFileSync } from 'node:fs'
import { join as join_ } from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions'
import { flatten, getBounds, join, normals, prune, quantize, simplifyPrimitive, weld, weldPrimitive } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import { slimSkin, smoothGroin } from './slim-skin.mjs'

const input = process.argv[2]
if (!input) {
  console.error('Usage: node scripts/build-body-model.mjs <path-to-3d-vh-m-united.glb>')
  process.exit(1)
}
const output = 'public/models/body.glb'
const bp3dDir = process.argv[3]

/*
  Optional rib cage (the HRA model has no ribs) from BodyParts3D,
  © The Database Center for Life Science, CC BY 4.0 (current licence page;
  the 2011 file headers state CC BY-SA 2.1 Japan).
  https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
  <bp3dDir> must contain obj/FJ*.obj extracted from partof_BP3D_4.0_obj_99.zip and
  ids_FMA7480.txt (rib cage), ids_FMA7309.txt + ids_FMA7310.txt (lungs) and
  ids_FMA7088.txt (heart): element file ids from partof_element_parts.txt.
  The rib cage is aligned to our body by mapping BodyParts3D lungs onto HRA lungs.
*/
const readObj = (path) => {
  const positions = []
  const indices = []
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (line.startsWith('v ')) {
      const [, x, y, z] = line.trim().split(/\s+/).map(Number)
      positions.push(x, y, z)
    } else if (line.startsWith('f ')) {
      const ids = line.trim().split(/\s+/).slice(1).map((t) => Number(t.split('/')[0]) - 1)
      for (let i = 1; i < ids.length - 1; i++) indices.push(ids[0], ids[i], ids[i + 1])
    }
  }
  return { positions, indices }
}

const readGroup = (dir, idsFiles) => readElements(dir, idsFiles.flatMap((f) => readFileSync(join_(dir, f), 'utf8').split(/\r?\n/).filter(Boolean)))

/* Element files for FMA concepts, from partof_element_parts.txt (concept id, name, element file id) */
const conceptElements = (dir) => {
  const map = new Map()
  for (const [concept, , element] of readFileSync(join_(dir, 'partof_element_parts.txt'), 'utf8').split(/\r?\n/).slice(1).map((l) => l.split('\t'))) {
    if (concept && element) map.set(concept, [...(map.get(concept) ?? []), element])
  }
  return map
}

/* Hand bones: every left/right carpal, metacarpal and phalanx concept in partof_parts_list_e.txt */
const handBoneConcepts = (dir) => {
  const BONE = /(carpal|metacarpal|phalanx of|scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate)/i
  const NOT = /(artery|vein|nerve|ligament|joint|muscle|tendon|branch|head of|base of|shaft of|body of|part of|surface|tubercle|articular|toe|foot|tars)/i
  return readFileSync(join_(dir, 'partof_parts_list_e.txt'), 'utf8')
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.split('\t'))
    .filter(([c, , name]) => c && BONE.test(name) && !NOT.test(name) && /(left|right)/.test(name))
    .map(([c, , name]) => ({ concept: c, side: /left/.test(name) ? 'left' : 'right' }))
}

const readElements = (dir, ids) => {
  const positions = []
  const indices = []
  for (const id of [...new Set(ids)]) {
    const part = readObj(join_(dir, 'obj', `${id}.obj`))
    const offset = positions.length / 3
    positions.push(...part.positions)
    for (const i of part.indices) indices.push(i + offset)
  }
  return { positions, indices }
}

const boundsOf = (positions) => {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < positions.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], positions[i + a])
      max[a] = Math.max(max[a], positions[i + a])
    }
  }
  return { min, max }
}

const toYUp = (p, mirrorX) => {
  const out = []
  for (let i = 0; i < p.length; i += 3) out.push(mirrorX ? -p[i] : p[i], p[i + 2], -p[i + 1])
  return out
}

const nodesOf = (region) => root.listNodes().filter((n) => n.getMesh()?.listPrimitives().some((p) => p.getMaterial()?.getName() === region))

const unionBounds = (nodes) => {
  const b = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }
  for (const n of nodes) {
    const nb = getBounds(n)
    for (let a = 0; a < 3; a++) {
      b.min[a] = Math.min(b.min[a], nb.min[a])
      b.max[a] = Math.max(b.max[a], nb.max[a])
    }
  }
  return b
}

const mapBounds = (positions, from, to) => {
  const out = new Float32Array(positions.length)
  for (let i = 0; i < positions.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      const t = (positions[i + a] - from.min[a]) / (from.max[a] - from.min[a])
      out[i + a] = to.min[a] + t * (to.max[a] - to.min[a])
    }
  }
  return out
}

const inflate = (b, k) => {
  const c = b.min.map((v, a) => (v + b.max[a]) / 2)
  return { min: b.min.map((v, a) => c[a] + (v - c[a]) * k), max: b.max.map((v, a) => c[a] + (v - c[a]) * k) }
}

const addPart = (name, positions, indices, materialName, targetTris) => {
  const buffer = root.listBuffers()[0]
  const material = root.listMaterials().find((m) => m.getName() === materialName)
  if (!material) throw new Error(`Material not found: ${materialName}`)
  const position = doc.createAccessor(`${name}_position`).setType("VEC3").setArray(positions).setBuffer(buffer)
  const index = doc.createAccessor(`${name}_index`).setType("SCALAR").setArray(new Uint32Array(indices)).setBuffer(buffer)
  const prim = doc.createPrimitive().setAttribute("POSITION", position).setIndices(index).setMaterial(material)
  scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)))
  weldPrimitive(prim)
  const before = indices.length / 3
  const simplified = simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: Math.min(1, targetTris / before), error: 0.5 })
  const after = (simplified.getIndices() ?? simplified.getAttribute("POSITION")).getCount() / 3
  console.log(`${name.padEnd(16)} ${Math.round(before).toLocaleString().padStart(9)} → ${Math.round(after).toLocaleString()} tris`)
}

async function addBodyParts3D(dir) {
  const lungs = readGroup(dir, ["ids_FMA7309.txt", "ids_FMA7310.txt"])
  const heart = readGroup(dir, ["ids_FMA7088.txt"])
  const hraLungs = unionBounds(nodesOf("lungs"))
  const hraHeart = unionBounds(nodesOf("heart"))
  const centerX = (b) => (b.min[0] + b.max[0]) / 2
  const bpHeartSide = Math.sign(centerX(boundsOf(toYUp(heart.positions, false))) - centerX(boundsOf(toYUp(lungs.positions, false))))
  const mirrorX = Math.sign(centerX(hraHeart) - centerX(hraLungs)) !== bpHeartSide
  console.log("BodyParts3D mirrorX", mirrorX)

  const rib = readGroup(dir, ["ids_FMA7480.txt"])
  const bpLungs = boundsOf(toYUp(lungs.positions, mirrorX))
  addPart("ribcage", mapBounds(toYUp(rib.positions, mirrorX), bpLungs, hraLungs), rib.indices, "musculoskeletal", 22000)

  doc.createMaterial("heart:artery").setBaseColorFactor([0.7, 0.08, 0.1, 1]).setRoughnessFactor(0.4).setMetallicFactor(0)
  doc.createMaterial("heart:vein").setBaseColorFactor([0.2, 0.25, 0.6, 1]).setRoughnessFactor(0.4).setMetallicFactor(0)
  const arteries = readGroup(dir, ["ids_heart_arteries.txt"])
  const veins = readGroup(dir, ["ids_heart_veins.txt"])
  const bpCoronary = boundsOf(toYUp([...arteries.positions, ...veins.positions], mirrorX))
  const heartTarget = inflate(hraHeart, 1.03)
  const map = (g) => mapBounds(toYUp(g.positions, mirrorX), bpCoronary, heartTarget)
  addPart("coronary_arteries", map(arteries), arteries.indices, "heart:artery", 14000)
  addPart("coronary_veins", map(veins), veins.indices, "heart:vein", 4000)

  /*
    The skeleton the HRA model lacks (skull, jaw, shoulder girdle, arms, hands)
    and the stomach. Each group is placed by mapping a BodyParts3D anchor onto
    the same anatomy in our body: lungs for the shoulders and arms (as the
    ribs), brain + eyes for the skull, lungs + liver for the stomach.
  */
  const elements = conceptElements(dir)
  const concepts = (...ids) => readElements(dir, ids.flatMap((c) => elements.get(c) ?? []))
  const yUp = (g) => toYUp(g.positions, mirrorX)
  const fromLungs = (g) => mapBounds(yUp(g), bpLungs, hraLungs)

  const skull = concepts("FMA46565")
  const jaw = concepts("FMA52748")
  const bpHead = boundsOf(yUp(concepts("FMA50801", "FMA12514", "FMA12515")))
  const hraHead = unionBounds([...nodesOf("brain"), ...nodesOf("eyes")])
  addPart("skull", mapBounds(yUp(skull), bpHead, hraHead), skull.indices, "musculoskeletal", 16000)
  addPart("mandible", mapBounds(yUp(jaw), bpHead, hraHead), jaw.indices, "musculoskeletal", 3000)

  /*
    Our skin holds the arms further from the body than BodyParts3D does, so each
    arm + hand is fitted to its own skin arm: the shoulder end stays where the
    lungs mapping puts it, and the bone chain is stretched until the fingertips
    sit just inside the skin's outermost and lowest hand points.
  */
  const skin = []
  for (const n of nodesOf("whole-body")) {
    const m = n.getWorldMatrix()
    for (const p of n.getMesh().listPrimitives()) {
      const a = p.getAttribute("POSITION")
      const v = [0, 0, 0]
      for (let i = 0; i < a.getCount(); i++) {
        a.getElement(i, v)
        skin.push(
          m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
          m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
          m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14],
        )
      }
    }
  }
  const SOFT_TISSUE = 0.012
  /*
    Exact inside-the-skin test for fitting the arm and hand bones: the skin
    triangles are bucketed in 2 cm height slabs, and a point is inside when a
    ray from it toward +x crosses the closed skin surface an odd number of
    times.
  */
  const SLAB = 0.02
  const skinTri = []
  const slabs = new Map()
  for (const n of nodesOf("whole-body")) {
    const m = n.getWorldMatrix()
    for (const p of n.getMesh().listPrimitives()) {
      const a = p.getAttribute("POSITION")
      const idx = p.getIndices()
      const count = idx ? idx.getCount() : a.getCount()
      const v = [0, 0, 0]
      const world = (i) => {
        a.getElement(i, v)
        return [m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]]
      }
      for (let t = 0; t < count; t += 3) {
        const tri = [0, 1, 2].map((j) => world(idx ? idx.getScalar(t + j) : t + j))
        const id = skinTri.length
        skinTri.push(tri)
        const y0 = Math.min(tri[0][1], tri[1][1], tri[2][1])
        const y1 = Math.max(tri[0][1], tri[1][1], tri[2][1])
        for (let k = Math.floor(y0 / SLAB); k <= Math.floor(y1 / SLAB); k++) {
          if (!slabs.has(k)) slabs.set(k, [])
          slabs.get(k).push(id)
        }
      }
    }
  }
  const insideSkin = (x, y, z) => {
    let crossings = 0
    for (const id of slabs.get(Math.floor(y / SLAB)) ?? []) {
      const [A, B, C] = skinTri[id]
      const det = (B[1] - A[1]) * (C[2] - A[2]) - (C[1] - A[1]) * (B[2] - A[2])
      if (!det) continue
      const l1 = ((y - A[1]) * (C[2] - A[2]) - (C[1] - A[1]) * (z - A[2])) / det
      const l2 = ((B[1] - A[1]) * (z - A[2]) - (y - A[1]) * (B[2] - A[2])) / det
      if (l1 < 0 || l2 < 0 || l1 + l2 > 1) continue
      if (A[0] + l1 * (B[0] - A[0]) + l2 * (C[0] - A[0]) > x) crossings++
    }
    return crossings % 2 === 1
  }
  /* Share of (up to max) sampled points of the given position arrays that lie inside the skin */
  const insideShare = (arrays, max = 700) => {
    const total = arrays.reduce((t, a) => t + a.length / 3, 0)
    const step = Math.max(1, Math.floor(total / max))
    let hit = 0
    let n = 0
    let k = 0
    for (const arr of arrays)
      for (let i = 0; i < arr.length; i += 3, k++) {
        if (k % step) continue
        n++
        if (insideSkin(arr[i], arr[i + 1], arr[i + 2])) hit++
      }
    return hit / Math.max(1, n)
  }
  /*
    Then each arm is fitted as a jointed chain, so the bones keep their real
    shape. The upper arm (humerus), the forearm (radius + ulna) and the hand
    each move as one rigid piece, stretched only along their own length:
    - the hand is fitted into the skin hand (one scale per axis) and its
      spread fingers are drawn in smoothly toward the tips;
    - the shoulder end of the humerus stays where the lungs mapping put it;
    - the elbow is placed on the centre line of the skin arm, splitting the
      shoulder-to-wrist distance in the bones' own length ratio;
    - the humerus runs shoulder -> elbow and the forearm elbow -> wrist.
    The skin arm per 1 cm slice is the outermost connected run of skin
    points, cut off at the gap to the torso.
  */
  const fitArmJointed = (humPos, forePos, handPos, sign) => {
    const all = [...humPos, ...forePos, ...handPos]
    const ab = boundsOf(all)
    const y0 = Math.floor(ab.min[1] * 100)
    const n = Math.floor(ab.max[1] * 100) - y0 + 1
    const flesh = Array.from({ length: n }, () => null)
    const bySlice = Array.from({ length: n }, () => [])
    for (let i = 0; i < skin.length; i += 3) {
      if (skin[i] * sign <= 0.1) continue
      const k = Math.floor(skin[i + 1] * 100) - y0
      for (let j = Math.max(0, k - 2); j <= Math.min(n - 1, k + 2); j++) bySlice[j].push(skin[i], skin[i + 2])
    }
    bySlice.forEach((pts, k) => {
      const order = []
      for (let i = 0; i < pts.length; i += 2) order.push(i)
      order.sort((a, b) => pts[b] * sign - pts[a] * sign)
      const f = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity }
      let last = Infinity
      for (const i of order) {
        const d = pts[i] * sign
        if (last !== Infinity && last - d > 0.04) break
        last = d
        f.x0 = Math.min(f.x0, pts[i])
        f.x1 = Math.max(f.x1, pts[i])
        f.z0 = Math.min(f.z0, pts[i + 1])
        f.z1 = Math.max(f.z1, pts[i + 1])
      }
      if (Number.isFinite(f.x0) && f.x1 - f.x0 <= 0.22) flesh[k] = f
    })
    const sliceAt = (y) => flesh[Math.min(n - 1, Math.max(0, Math.floor(y * 100) - y0))]

    /* Centre of the vertices within 1.5 cm of a segment's top or bottom end */
    const endCentre = (pos, top) => {
      const b = boundsOf(pos)
      const c = [0, 0, 0]
      let m = 0
      for (let i = 0; i < pos.length; i += 3) {
        if (top ? pos[i + 1] < b.max[1] - 0.015 : pos[i + 1] > b.min[1] + 0.015) continue
        c[0] += pos[i]
        c[1] += pos[i + 1]
        c[2] += pos[i + 2]
        m++
      }
      return c.map((v) => v / m)
    }
    const sub = (a, b) => a.map((v, i) => v - b[i])
    const add = (a, b) => a.map((v, i) => v + b[i])
    const mul = (a, k) => a.map((v) => v * k)
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
    const len = (a) => Math.hypot(...a)
    const unit = (a) => mul(a, 1 / (len(a) || 1))
    /* Rotation taking unit vector u onto unit vector v (Rodrigues) */
    const rotation = (u, v) => {
      const axis = cross(u, v)
      const s = len(axis)
      const c = dot(u, v)
      if (s < 1e-9) return (p) => p
      const k = mul(axis, 1 / s)
      return (p) => add(add(mul(p, c), mul(cross(k, p), s)), mul(k, dot(k, p) * (1 - c)))
    }
    /* Move a rigid segment so a0 -> a1 and b0 -> b1, stretching only along its own axis */
    const place = (pos, a0, b0, a1, b1) => {
      const u0 = unit(sub(b0, a0))
      const u1 = unit(sub(b1, a1))
      const k = len(sub(b1, a1)) / len(sub(b0, a0))
      const rot = rotation(u0, u1)
      const out = new Float32Array(pos.length)
      for (let i = 0; i < pos.length; i += 3) {
        const d = [pos[i] - a0[0], pos[i + 1] - a0[1], pos[i + 2] - a0[2]]
        const along = dot(d, u0)
        const local = add(mul(u0, along * k), sub(d, mul(u0, along)))
        out.set(add(a1, rot(local)), i)
      }
      return out
    }

    /*
      Hand: fitted as one piece along the skin hand's own axes. For the skin
      hand and the bone hand we measure the long axis (wrist -> fingertips),
      the width axis (thumb side <-> little finger, the main spread across
      the long axis) and the thickness axis. The bone hand is rotated onto
      the skin hand's axes and scaled to its length, width and thickness
      (5th-95th percentile, minus a little soft tissue), so the fingers point
      where the skin fingers point and never leave the skin.
    */
    const hb = boundsOf(handPos)
    /*
      The skin wrist: the narrowest cross-section of the skin arm between 12
      and 30 cm above the skin fingertips. The bone wrist goes there and the
      bone fingertips just inside the skin fingertips; the forearm then
      stretches to meet the wrist, so the arm may get a little longer.
    */
    let low = Infinity
    for (let i = 0; i < skin.length; i += 3) {
      if (skin[i] * sign >= 0.27 && skin[i + 1] < hb.max[1] + 0.1 && skin[i + 1] > hb.min[1] - 0.08) low = Math.min(low, skin[i + 1])
    }
    let wristY = hb.max[1]
    let narrowest = Infinity
    for (let y = low + 0.12; y <= low + 0.3; y += 0.005) {
      const f = sliceAt(y)
      if (!f) continue
      const area = (f.x1 - f.x0) * (f.z1 - f.z0)
      if (area < narrowest) {
        narrowest = area
        wristY = y
      }
    }
    const skinHand = []
    for (let i = 0; i < skin.length; i += 3) {
      if (skin[i] * sign < 0.27 || skin[i + 1] > wristY || skin[i + 1] < hb.min[1] - 0.08) continue
      skinHand.push(skin[i], skin[i + 1], skin[i + 2])
    }
    console.log(`skin wrist ${sign > 0 ? 'left' : 'right'}: ${wristY.toFixed(3)} m (bone wrist was ${hb.max[1].toFixed(3)}), skin hand length ${(wristY - low).toFixed(3)} m`)
    const frameOf = (pos) => {
      const b = boundsOf(pos)
      const top = endCentre(pos, true)
      const tip = endCentre(pos, false)
      const e1 = unit(sub(tip, top))
      const cov = [0, 0, 0, 0, 0, 0, 0, 0, 0]
      let m = 0
      for (let i = 0; i < pos.length; i += 3) {
        const d = sub([pos[i], pos[i + 1], pos[i + 2]], top)
        const r = sub(d, mul(e1, dot(d, e1)))
        for (let a = 0; a < 3; a++) for (let c = 0; c < 3; c++) cov[a * 3 + c] += r[a] * r[c]
        m++
      }
      let e2 = [1, 0, 0]
      for (let k = 0; k < 40; k++) {
        const v = [0, 1, 2].map((a) => cov[a * 3] * e2[0] + cov[a * 3 + 1] * e2[1] + cov[a * 3 + 2] * e2[2])
        e2 = unit(sub(v, mul(e1, dot(v, e1))))
      }
      if (e2[0] * sign < 0) e2 = mul(e2, -1)
      const e3 = cross(e1, e2)
      const coords = [[], [], []]
      for (let i = 0; i < pos.length; i += 3) {
        const d = sub([pos[i], pos[i + 1], pos[i + 2]], top)
        coords[0].push(dot(d, e1))
        coords[1].push(dot(d, e2))
        coords[2].push(dot(d, e3))
      }
      const pct = (xs, q) => {
        const s = [...xs].sort((x, y) => x - y)
        return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))]
      }
      const range = coords.map((c, a) => (a === 0 ? [0, pct(c, 0.995)] : [pct(c, 0.05), pct(c, 0.95)]))
      void b
      return { top, axes: [e1, e2, e3], range }
    }
    const bf = frameOf(handPos)
    const sf = frameOf(skinHand)
    const TISSUE = [0.005, 0.008, 0.006]
    const fit = [0, 1, 2].map((a) => {
      const [b0, b1] = bf.range[a]
      const [s0, s1] = sf.range[a]
      const lenS = a === 0 ? s1 - s0 - TISSUE[0] : s1 - s0 - 2 * TISSUE[a]
      /* Length keeps the bone hand's proportions (0.9-1.15x) and lines the fingertips up with the skin fingertips; the wrist follows */
      const k = a === 0 ? Math.min(1.15, Math.max(0.9, lenS / Math.max(1e-6, b1 - b0))) : Math.min(1.15, Math.max(0.3, lenS / Math.max(1e-6, b1 - b0)))
      const mid = a === 0 ? lenS - b1 * k : (s0 + s1) / 2 - ((b0 + b1) / 2) * k
      return { k, mid }
    })
    const hand = new Float32Array(handPos.length)
    for (let i = 0; i < handPos.length; i += 3) {
      const d = sub([handPos[i], handPos[i + 1], handPos[i + 2]], bf.top)
      let p = sf.top
      for (let a = 0; a < 3; a++) p = add(p, mul(sf.axes[a], dot(d, bf.axes[a]) * fit[a].k + fit[a].mid))
      hand.set(p, i)
    }
    /*
      Then the bone hand is bent smoothly onto the skin hand (see below):
      the BodyParts3D hand is posed with curled, fanned fingers while the
      skin hand is flat and open, which no rigid turn can match.
    */
    {
      const [u, wv, nv] = sf.axes
      const top = sf.top
      const toPlane = (arr) => {
        const out = []
        for (let i = 0; i < arr.length; i += 3) {
          const d = sub([arr[i], arr[i + 1], arr[i + 2]], top)
          out.push([dot(d, u), dot(d, wv), dot(d, nv)])
        }
        return out
      }
      const skinPts = toPlane(skinHand)
      const bonePts = toPlane(hand)
      const lenOf = (pts) => pts.reduce((m, p) => Math.max(m, p[0]), 0)
      const Lb = lenOf(bonePts)
      /*
        Along the hand's length (a), in 16 bands, the centre and half-width of
        the skin hand and of the bone hand are measured across (b) and through
        (c) the hand (5th-95th percentile). Smooth quadratic curves are fitted
        to them, and every bone point is moved so its band's centre and width
        match the skin's. One smooth curve over the whole length, so fingers
        stay connected; it straightens the forward curl of the bone fingers
        and lines them up with the skin fingers.
      */
      const BANDS = 16
      const L = Math.max(Lb, 1e-6)
      const bandStats = (pts) => {
        const rows = []
        for (let k = 0; k < BANDS; k++) {
          const lo = (k / BANDS) * L
          const hi = ((k + 1) / BANDS) * L
          const f = pts.filter((q) => q[0] >= lo && q[0] < hi)
          if (f.length < 8) continue
          const pc = (axis, t) => {
            const v = f.map((q) => q[axis]).sort((x, y) => x - y)
            return v[Math.min(v.length - 1, Math.max(0, Math.round(t * (v.length - 1))))]
          }
          const b5 = pc(1, 0.05)
          const b95 = pc(1, 0.95)
          const c5 = pc(2, 0.05)
          const c95 = pc(2, 0.95)
          rows.push({ a: (lo + hi) / 2, n: f.length, cb: (b5 + b95) / 2, hb: (b95 - b5) / 2, cc: (c5 + c95) / 2, hc: (c95 - c5) / 2 })
        }
        return rows
      }
      /* Weighted least-squares quadratic y = k0 + k1 a + k2 a^2 */
      const quad = (rows, key) => {
        const S = Array(5).fill(0)
        const T = Array(3).fill(0)
        for (const r of rows) {
          const w = Math.sqrt(r.n)
          let ap = 1
          for (let e = 0; e < 5; e++) {
            S[e] += w * ap
            if (e < 3) T[e] += w * ap * r[key]
            ap *= r.a
          }
        }
        const M = [
          [S[0], S[1], S[2], T[0]],
          [S[1], S[2], S[3], T[1]],
          [S[2], S[3], S[4], T[2]],
        ]
        for (let i = 0; i < 3; i++) {
          let piv = i
          for (let j = i + 1; j < 3; j++) if (Math.abs(M[j][i]) > Math.abs(M[piv][i])) piv = j
          ;[M[i], M[piv]] = [M[piv], M[i]]
          for (let j = 0; j < 3; j++) {
            if (j === i || !M[i][i]) continue
            const f = M[j][i] / M[i][i]
            for (let k = i; k < 4; k++) M[j][k] -= f * M[i][k]
          }
        }
        const k = M.map((row, i) => (row[i] ? row[3] / row[i] : 0))
        return (x) => k[0] + k[1] * x + k[2] * x * x
      }
      const skinRows = bandStats(skinPts.filter((q) => q[0] <= L))
      const boneRows = bandStats(bonePts)
      const sCb = quad(skinRows, 'cb')
      const sHb = quad(skinRows, 'hb')
      const sCc = quad(skinRows, 'cc')
      const sHc = quad(skinRows, 'hc')
      const bCb = quad(boneRows, 'cb')
      const bHb = quad(boneRows, 'hb')
      const bCc = quad(boneRows, 'cc')
      const bHc = quad(boneRows, 'hc')
      const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x))
      const INSET_B = 0.006
      const INSET_C = 0.005
      bonePts.forEach((q, k) => {
        const x = clamp(q[0], 0, L)
        const kb = clamp((sHb(x) - INSET_B) / Math.max(1e-4, bHb(x)), 0.55, 1.1)
        const kc = clamp((sHc(x) - INSET_C) / Math.max(1e-4, bHc(x)), 0.55, 1.1)
        const b2 = sCb(x) + (q[1] - bCb(x)) * kb
        const c2 = sCc(x) + (q[2] - bCc(x)) * kc
        hand.set(add(add(add(top, mul(u, q[0])), mul(wv, b2)), mul(nv, c2)), k * 3)
      })
      let off = 0
      for (const q of bonePts) if (q[0] > 0.5 * L) off++
      console.log(`finger fit ${sign > 0 ? 'left' : 'right'}: bent along ${BANDS} bands (${skinRows.length} skin, ${boneRows.length} bone) onto the skin hand; ${off} finger points`)
    }
    console.log(`hand fit ${sign > 0 ? 'left' : 'right'}: scale ${fit.map((f) => f.k.toFixed(2)).join(' / ')}, skin axis ${sf.axes[0].map((v) => v.toFixed(2)).join(', ')}, bone axis ${bf.axes[0].map((v) => v.toFixed(2)).join(', ')}`)

    /*
      Final hand fit: small turns around the wrist (all three axes) and small
      shifts, searched coarse to fine, keeping whatever puts the most hand
      bone inside the skin. Rigid, so the hand keeps its shape.
    */
    {
      const pivot = endCentre(hand, true)
      const base = Float32Array.from(hand)
      const apply = (q) => {
        const rx = rotation([0, 1, 0], unit([0, Math.cos(q[0]), Math.sin(q[0])]))
        const rz = rotation([0, 1, 0], unit([Math.sin(q[2]), Math.cos(q[2]), 0]))
        const ry = rotation([1, 0, 0], unit([Math.cos(q[1]), 0, -Math.sin(q[1])]))
        const out = new Float32Array(base.length)
        for (let i = 0; i < base.length; i += 3) {
          const d = [base[i] - pivot[0], base[i + 1] - pivot[1], base[i + 2] - pivot[2]]
          out.set(add(add(pivot, ry(rz(rx(d)))), [q[3], q[4], q[5]]), i)
        }
        return out
      }
      let q = [0, 0, 0, 0, 0, 0]
      const start = insideShare([base])
      let best = start
      for (const [ang, mv] of [[0.12, 0.012], [0.06, 0.006], [0.03, 0.003], [0.015, 0.0015]]) {
        for (let pass = 0; pass < 2; pass++)
          for (let k = 0; k < 6; k++) {
            for (const dir of [-1, 1]) {
              const t = [...q]
              t[k] += dir * (k < 3 ? ang : mv)
              const sc = insideShare([apply(t)])
              if (sc > best + 1e-6) {
                best = sc
                q = t
              }
            }
          }
      }
      hand.set(apply(q))
      console.log(`hand search ${sign > 0 ? 'left' : 'right'}: inside skin ${(start * 100).toFixed(0)} % -> ${(best * 100).toFixed(0)} % (turns ${q.slice(0, 3).map((a) => ((a * 180) / Math.PI).toFixed(1)).join('/')} deg, shift ${q.slice(3).map((a) => (a * 100).toFixed(1)).join('/')} cm)`)
    }

    /* Joints */
    const shoulder = endCentre(humPos, true)
    const elbowH = endCentre(humPos, false)
    const elbowF = endCentre(forePos, true)
    const wristF = endCentre(forePos, false)
    const wrist = endCentre(hand, true)
    const lh = len(sub(elbowH, shoulder))
    const lf = len(sub(wristF, elbowF))
    /* Elbow height from the bone length ratio; its x/z from the skin arm (smoothed over 5 cm). Where the arm touches the torso the slice runs on into the body, so x is taken at most ARM_HALF in from the outer edge. */
    const ARM_HALF = 0.042
    const ey = shoulder[1] + (wrist[1] - shoulder[1]) * (lh / (lh + lf))
    const c = [0, 0]
    let m = 0
    for (let y = ey - 0.025; y <= ey + 0.025; y += 0.01) {
      const f = sliceAt(y)
      if (!f) continue
      c[0] += sign > 0 ? Math.max((f.x0 + f.x1) / 2, f.x1 - ARM_HALF) : Math.min((f.x0 + f.x1) / 2, f.x0 + ARM_HALF)
      c[1] += (f.z0 + f.z1) / 2
      m++
    }
    const straight = add(shoulder, mul(sub(wrist, shoulder), lh / (lh + lf)))
    const elbow = m ? [c[0] / m, ey, c[1] / m] : straight
    /* Then the elbow is moved (up to 3 cm across, 2 cm up/down) to where the most upper-arm and forearm bone lies inside the skin */
    const tryElbow = (e) => [place(humPos, shoulder, elbowH, shoulder, e), place(forePos, elbowF, wristF, e, wrist)]
    let bestElbow = elbow
    const elbowStart = insideShare(tryElbow(elbow))
    let elbowScore = elbowStart
    for (const step of [0.01, 0.005, 0.0025]) {
      for (let pass = 0; pass < 2; pass++)
        for (const axis of [0, 2, 1])
          for (const dir of [-1, 1]) {
            const e = [...bestElbow]
            e[axis] += dir * step
            if (Math.abs(e[0] - elbow[0]) > 0.03 || Math.abs(e[2] - elbow[2]) > 0.03 || Math.abs(e[1] - elbow[1]) > 0.02) continue
            const sc = insideShare(tryElbow(e))
            if (sc > elbowScore + 1e-6) {
              elbowScore = sc
              bestElbow = e
            }
          }
    }
    console.log(`elbow search ${sign > 0 ? 'left' : 'right'}: inside skin ${(elbowStart * 100).toFixed(0)} % -> ${(elbowScore * 100).toFixed(0)} %, moved ${sub(bestElbow, elbow).map((v) => (v * 100).toFixed(1)).join('/')} cm`)
    const [hum, fore] = tryElbow(bestElbow)
    console.log(`arm joints ${sign > 0 ? 'left' : 'right'}: elbow ${bestElbow.map((v) => v.toFixed(3)).join(', ')}, humerus ${lh.toFixed(3)} -> ${len(sub(elbow, shoulder)).toFixed(3)} m, forearm ${lf.toFixed(3)} -> ${len(sub(wrist, elbow)).toFixed(3)} m`)
    return { hum, fore, hand }
  }
  const hands = handBoneConcepts(dir)
  for (const side of ["right", "left"]) {
    const r = side === "right"
    const girdle = concepts(r ? "FMA13322" : "FMA13323", r ? "FMA13395" : "FMA13396")
    const humerus = concepts(r ? "FMA23130" : "FMA23131")
    const forearm = concepts(r ? "FMA23464" : "FMA23465", r ? "FMA23467" : "FMA23468")
    const arm = { positions: [...humerus.positions, ...forearm.positions], indices: [...humerus.indices, ...forearm.indices.map((i) => i + humerus.positions.length / 3)] }
    const hand = concepts(...hands.filter((h) => h.side === side).map((h) => h.concept))
    const armPos = fromLungs(arm)
    const handPos = fromLungs(hand)
    const from = boundsOf([...armPos, ...handPos])
    const sign = Math.sign(from.min[0] + from.max[0])
    let outer = 0
    let lowest = Infinity
    for (let i = 0; i < skin.length; i += 3) {
      if (skin[i] * sign < 0.3) continue
      outer = Math.max(outer, skin[i] * sign)
      lowest = Math.min(lowest, skin[i + 1])
    }
    const to = { min: [...from.min], max: [...from.max] }
    if (sign > 0) to.max[0] = outer - SOFT_TISSUE
    else to.min[0] = -(outer - SOFT_TISSUE)
    to.min[1] = lowest + SOFT_TISSUE
    console.log(`arm fit ${side}: outer x ${(from.max[0] * sign > 0 ? from.max[0] : -from.min[0]).toFixed(3)} → ${(outer - SOFT_TISSUE).toFixed(3)}, bottom ${from.min[1].toFixed(3)} → ${to.min[1].toFixed(3)}`)
    addPart(`shoulder_${side}`, fromLungs(girdle), girdle.indices, "musculoskeletal", 4000)
    const fit = fitArmJointed(fromLungs(humerus), fromLungs(forearm), mapBounds(handPos, from, to), sign)
    const armFit = new Float32Array(fit.hum.length + fit.fore.length)
    armFit.set(fit.hum)
    armFit.set(fit.fore, fit.hum.length)
    addPart(`arm_${side}`, armFit, arm.indices, "musculoskeletal", 6000)
    addPart(`hand_${side}`, fit.hand, hand.indices, "musculoskeletal", 6000)
  }

  doc.createMaterial("whole-body:stomach").setBaseColorFactor([0.85, 0.55, 0.5, 1]).setRoughnessFactor(0.5).setMetallicFactor(0)
  const stomach = concepts("FMA7148")
  const bpLiver = boundsOf(yUp(concepts("FMA7197")))
  const union = (a, b) => ({ min: a.min.map((v, i) => Math.min(v, b.min[i])), max: a.max.map((v, i) => Math.max(v, b.max[i])) })
  const hraLiver = unionBounds(nodesOf("whole-body:liver"))
  addPart("stomach", mapBounds(yUp(stomach), union(bpLungs, bpLiver), union(hraLungs, hraLiver)), stomach.indices, "whole-body:stomach", 6000)

  await doc.transform(normals({ overwrite: false }))
}

const REGIONS = {
  'whole-body': { nodes: ['VH_M_skin'], targetTris: 45000, color: [0.62, 0.72, 0.79, 1] },
  brain: { nodes: ['Allen_brain'], targetTris: 60000, maxError: 0.5, color: [0.91, 0.66, 0.7, 1] },
  eyes: { nodes: ['VH_M_eyes'], targetTris: 6000, maxError: 1, color: [0.95, 0.95, 0.93, 1] },
  heart: { nodes: ['VH_M_cardiac_chamber'], targetTris: 70000, maxError: 0.2, color: [0.78, 0.25, 0.29, 1] },
  lungs: { nodes: ['VH_M_lungs'], targetTris: 20000, color: [0.89, 0.55, 0.56, 1] },
  immune: { nodes: ['VH_M_spleen'], targetTris: 12000, color: [0.55, 0.23, 0.32, 1] },
  musculoskeletal: { nodes: ['VH_M_vertebral_column', 'VH_M_pelvis', 'VH_M_lower_limb'], targetTris: 45000, maxError: 0.5, color: [0.91, 0.89, 0.83, 1] },
  /* More organs, grouped under the body system (app region) they relate to; material = `${region}:${part}` */
  'brain:spinal-cord': { nodes: ['VH_M_spinal_cord'], targetTris: 4000, maxError: 0.5, color: [0.93, 0.85, 0.7, 1] },
  'lungs:airway': { nodes: ['VH_M_tracheobronchial_tree'], targetTris: 14000, maxError: 0.5, color: [0.9, 0.8, 0.75, 1] },
  'immune:thymus': { nodes: ['VH_M_thymus'], targetTris: 2000, color: [0.8, 0.6, 0.55, 1] },
  'immune:lymph': { nodes: ['Yao_lymph_node'], targetTris: 8000, maxError: 0.5, color: [0.6, 0.75, 0.45, 1] },
  'whole-body:liver': { nodes: ['VH_M_liver'], targetTris: 14000, color: [0.5, 0.18, 0.15, 1] },
  'whole-body:gallbladder': { nodes: ['VH_M_gallbladder_'], targetTris: 1500, color: [0.3, 0.55, 0.3, 1] },
  'whole-body:pancreas': { nodes: ['VH_M_pancreas'], targetTris: 6000, color: [0.9, 0.75, 0.55, 1] },
  'whole-body:intestine': { nodes: ['VH_M_small_intestine', 'VH_M_colon'], targetTris: 22000, maxError: 0.5, color: [0.85, 0.6, 0.55, 1] },
  'whole-body:kidney': { nodes: ['VH_M_upper_urinary_tract'], targetTris: 10000, maxError: 0.5, color: [0.55, 0.2, 0.2, 1] },
  'whole-body:bladder': { nodes: ['VH_M_urinary_bladder'], targetTris: 2500, color: [0.85, 0.75, 0.5, 1] },
}

const TARGET_HEIGHT = 1.8

await MeshoptSimplifier.ready
await MeshoptEncoder.ready

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
const doc = await io.read(input)
const root = doc.getRoot()
const scene = root.getDefaultScene() ?? root.listScenes()[0]

const byName = new Map(root.listNodes().map((n) => [n.getName(), n]))
const triCount = (prims) =>
  prims.reduce((sum, p) => sum + (p.getIndices() ?? p.getAttribute('POSITION')).getCount() / 3, 0)

const kept = []
for (const [region, cfg] of Object.entries(REGIONS)) {
  const material = doc.createMaterial(region).setBaseColorFactor(cfg.color).setRoughnessFactor(0.6).setMetallicFactor(0)
  for (const name of cfg.nodes) {
    const node = byName.get(name)
    if (!node) throw new Error(`Node not found: ${name}`)
    kept.push({ node, region, material, cfg })
  }
}

const meshNodesUnder = (node) => {
  const out = []
  node.traverse((n) => {
    if (n.getMesh()) out.push(n)
  })
  return out
}

const regionOfMesh = new Map()
for (const { node, region, material } of kept) {
  for (const n of meshNodesUnder(node)) {
    for (const prim of n.getMesh().listPrimitives()) prim.setMaterial(material)
    regionOfMesh.set(n.getMesh(), region)
  }
}

const keptMeshNodes = new Set(kept.flatMap(({ node }) => meshNodesUnder(node)))
await doc.transform(flatten())
for (const child of scene.listChildren()) {
  if (!keptMeshNodes.has(child)) child.dispose()
}
for (const n of root.listNodes()) {
  if (!keptMeshNodes.has(n)) n.dispose()
}
for (const prim of root.listMeshes().flatMap((m) => m.listPrimitives())) {
  for (const semantic of prim.listSemantics()) {
    if (semantic !== 'POSITION') prim.setAttribute(semantic, null)
  }
}
await doc.transform(prune(), weld())

for (const [region, cfg] of Object.entries(REGIONS)) {
  const prims = root.listMeshes().filter((m) => regionOfMesh.get(m) === region).flatMap((m) => m.listPrimitives())
  const before = triCount(prims)
  const ratio = Math.min(1, cfg.targetTris / before)
  if (ratio < 1) {
    for (const prim of prims) simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio, error: cfg.maxError ?? 0.01 })
  }
  console.log(`${region.padEnd(16)} ${Math.round(before).toLocaleString().padStart(9)} → ${Math.round(triCount(prims)).toLocaleString()} tris`)
}

await doc.transform(join({ keepNamed: false }), normals({ overwrite: true }), prune())

const before = getBounds(scene)
const size = before.max.map((v, i) => v - before.min[i])
const upAxis = size.indexOf(Math.max(...size))
console.log('raw bounds min', before.min.map((v) => v.toFixed(3)), 'max', before.max.map((v) => v.toFixed(3)), 'up axis', 'xyz'[upAxis])

const body = doc.createNode('Body')
for (const child of scene.listChildren()) {
  scene.removeChild(child)
  body.addChild(child)
}
scene.addChild(body)

if (upAxis === 2) body.setRotation([-Math.SQRT1_2, 0, 0, Math.SQRT1_2])
const rotated = getBounds(scene)
const height = rotated.max[1] - rotated.min[1]
const s = TARGET_HEIGHT / height
const cx = (rotated.min[0] + rotated.max[0]) / 2
const cz = (rotated.min[2] + rotated.max[2]) / 2
body.setScale([s, s, s]).setTranslation([-cx * s, -rotated.min[1] * s, -cz * s])

const final = getBounds(scene)
console.log('final bounds min', final.min.map((v) => v.toFixed(3)), 'max', final.max.map((v) => v.toFixed(3)))

if (bp3dDir) await addBodyParts3D(bp3dDir)
if (!process.argv.includes("--no-slim")) await slimSkin(doc)
if (!process.argv.includes("--no-mannequin")) await smoothGroin(doc)

await doc.transform(quantize())
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE })

mkdirSync('public/models', { recursive: true })
await io.write(output, doc)
console.log(`wrote ${output}`)
