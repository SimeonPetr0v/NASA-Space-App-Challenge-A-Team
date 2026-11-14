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
    Then the arm and hand bones are fitted slice by slice (1 cm along the
    height): at each height the bones are centred in the skin arm and shrunk
    where they are wider than the skin minus a little soft tissue. The
    BodyParts3D hand is posed with spread fingers in front of the palm, so
    this pulls it into the skin hand. Near the shoulder the fit fades out so
    the joint stays where the lungs mapping put it.
  */
  const LIMB_INSET = 0.008
  const fitLimb = (armPos, handPos, sign) => {
    const all = new Float32Array(armPos.length + handPos.length)
    all.set(armPos)
    all.set(handPos, armPos.length)
    const ab = boundsOf(all)
    const y0 = Math.floor(ab.min[1] * 100)
    const n = Math.floor(ab.max[1] * 100) - y0 + 1
    const box = () => Array.from({ length: n }, () => ({ x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity }))
    const bone = box()
    const flesh = box()
    const add = (arr, x, y, z) => {
      const k = Math.floor(y * 100) - y0
      if (k < 0 || k >= n) return
      const b = arr[k]
      b.x0 = Math.min(b.x0, x)
      b.x1 = Math.max(b.x1, x)
      b.z0 = Math.min(b.z0, z)
      b.z1 = Math.max(b.z1, z)
    }
    for (let i = 0; i < all.length; i += 3) add(bone, all[i], all[i + 1], all[i + 2])
    /* Skin arm per slice: the outermost connected run of skin, cut off at the gap to the torso */
    const bySlice = Array.from({ length: n }, () => [])
    for (let i = 0; i < skin.length; i += 3) {
      const k = Math.floor(skin[i + 1] * 100) - y0
      if (skin[i] * sign <= 0.1) continue
      for (let j = Math.max(0, k - 2); j <= Math.min(n - 1, k + 2); j++) bySlice[j].push(skin[i], skin[i + 2])
    }
    bySlice.forEach((pts, k) => {
      const order = []
      for (let i = 0; i < pts.length; i += 2) order.push(i)
      order.sort((a, b) => pts[b] * sign - pts[a] * sign)
      let last = Infinity
      for (const i of order) {
        const d = pts[i] * sign
        if (last - d > 0.04) {
          if (last !== Infinity) break
        }
        last = d
        add(flesh, pts[i], (k + y0 + 0.5) / 100, pts[i + 1])
      }
      const f = flesh[k]
      if (f.x1 - f.x0 > 0.22) flesh[k] = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity }
    })
    const raw = bone.map((b, k) => {
      const f = flesh[k]
      if (!Number.isFinite(b.x0) || !Number.isFinite(f.x0)) return null
      const half = (lo, hi) => Math.max(0.001, (hi - lo) / 2)
      return {
        bx: (b.x0 + b.x1) / 2,
        bz: (b.z0 + b.z1) / 2,
        sx: (f.x0 + f.x1) / 2,
        sz: (f.z0 + f.z1) / 2,
        kx: Math.min(1, Math.max(0.2, (half(f.x0, f.x1) - LIMB_INSET) / half(b.x0, b.x1))),
        kz: Math.min(1, Math.max(0.2, (half(f.z0, f.z1) - LIMB_INSET) / half(b.z0, b.z1))),
      }
    })
    const W = 1
    const smooth = raw.map((_, k) => {
      const acc = { bx: 0, bz: 0, sx: 0, sz: 0, kx: 0, kz: 0 }
      let c = 0
      for (let j = Math.max(0, k - W); j <= Math.min(n - 1, k + W); j++) {
        const r = raw[j]
        if (!r) continue
        for (const key in acc) acc[key] += r[key]
        c++
      }
      if (!c) return null
      for (const key in acc) acc[key] /= c
      return acc
    })
    const fadeTop = ab.max[1] - 0.06
    const fadeBottom = ab.max[1] - 0.2
    const apply = (pos) => {
      const out = new Float32Array(pos.length)
      for (let i = 0; i < pos.length; i += 3) {
        const [x, y, z] = [pos[i], pos[i + 1], pos[i + 2]]
        const r = smooth[Math.min(n - 1, Math.max(0, Math.floor(y * 100) - y0))]
        const t = Math.min(1, Math.max(0, (fadeTop - y) / (fadeTop - fadeBottom)))
        const w = t * t * (3 - 2 * t)
        if (!r || w === 0) {
          out.set([x, y, z], i)
          continue
        }
        const fx = r.sx + (x - r.bx) * r.kx
        const fz = r.sz + (z - r.bz) * r.kz
        out[i] = x + (fx - x) * w
        out[i + 1] = y
        out[i + 2] = z + (fz - z) * w
      }
      return out
    }
    return { arm: apply(armPos), hand: apply(handPos) }
  }
  const hands = handBoneConcepts(dir)
  for (const side of ["right", "left"]) {
    const r = side === "right"
    const girdle = concepts(r ? "FMA13322" : "FMA13323", r ? "FMA13395" : "FMA13396")
    const arm = concepts(r ? "FMA23130" : "FMA23131", r ? "FMA23464" : "FMA23465", r ? "FMA23467" : "FMA23468")
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
    const fit = fitLimb(mapBounds(armPos, from, to), mapBounds(handPos, from, to), sign)
    addPart(`arm_${side}`, fit.arm, arm.indices, "musculoskeletal", 6000)
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
