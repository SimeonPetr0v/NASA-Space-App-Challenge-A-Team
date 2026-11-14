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
import { slimSkin } from './slim-skin.mjs'

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

const readGroup = (dir, idsFiles) => {
  const positions = []
  const indices = []
  const ids = idsFiles.flatMap((f) => readFileSync(join_(dir, f), 'utf8').split(/\r?\n/).filter(Boolean))
  for (const id of ids) {
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

await doc.transform(quantize())
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE })

mkdirSync('public/models', { recursive: true })
await io.write(output, doc)
console.log(`wrote ${output}`)
