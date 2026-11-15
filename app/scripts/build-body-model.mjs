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
import { bp3dArm, insideTester, weldMesh } from "./bp3d-arms.mjs"

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
    for (const v of part.positions) positions.push(v)
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
  const hraSkinPts = []
  for (const n of nodesOf("whole-body")) {
    const m = n.getWorldMatrix()
    for (const p of n.getMesh().listPrimitives()) {
      const a = p.getAttribute("POSITION")
      const v = [0, 0, 0]
      for (let i = 0; i < a.getCount(); i++) {
        a.getElement(i, v)
        hraSkinPts.push(m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14])
      }
    }
  }
  /*
    The rib cage is placed by the lungs, but the BodyParts3D chest is deeper
    in front than ours, so the sternum and rib fronts came out through the
    skin. Per 1 cm height slice, the front half of the rib cage (in front of
    its middle) is pressed back so its front stays RIB_TISSUE behind the
    chest skin; the back half does not move.
  */
  const ribPos = mapBounds(toYUp(rib.positions, mirrorX), bpLungs, hraLungs)
  /*
    The lungs end well above the bottom of a real rib cage, so the cage is
    stretched down until its lowest rib is RIB_ABOVE_HIP above our iliac
    crest (highest hip bone point beside the spine). Only the part below the
    top of the sternum stretches, so the sternum stays where the collarbones
    meet it.
  */
  {
    const RIB_ABOVE_HIP = 0.08
    let crest = -Infinity
    for (const n of nodesOf("musculoskeletal")) {
      const m = n.getWorldMatrix()
      for (const p of n.getMesh().listPrimitives()) {
        const a = p.getAttribute("POSITION")
        const v = [0, 0, 0]
        for (let i = 0; i < a.getCount(); i++) {
          a.getElement(i, v)
          const x = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12]
          const y = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13]
          if (Math.abs(x) > 0.07 && y < hraLungs.min[1]) crest = Math.max(crest, y)
        }
      }
    }
    const rb = boundsOf(ribPos)
    const zc = (rb.min[2] + rb.max[2]) / 2
    let pivot = -Infinity
    for (let i = 0; i < ribPos.length; i += 3) if (Math.abs(ribPos[i]) < 0.02 && ribPos[i + 2] > zc + 0.03) pivot = Math.max(pivot, ribPos[i + 1])
    const k = (pivot - (crest + RIB_ABOVE_HIP)) / (pivot - rb.min[1])
    if (k > 1) for (let i = 1; i < ribPos.length; i += 3) if (ribPos[i] < pivot) ribPos[i] = pivot - (pivot - ribPos[i]) * k
    console.log(`rib cage: sternum top ${pivot.toFixed(3)} m, iliac crest ${crest.toFixed(3)} m, bottom ${rb.min[1].toFixed(3)} -> ${(pivot - (pivot - rb.min[1]) * Math.max(1, k)).toFixed(3)} m (x${k.toFixed(2)} below the sternum top)`)
  }
  {
    const RIB_TISSUE = 0.016
    const rb = boundsOf(ribPos)
    const zMid = (rb.min[2] + rb.max[2]) / 2
    const y0 = Math.floor(rb.min[1] * 100)
    const n = Math.floor(rb.max[1] * 100) - y0 + 1
    const skinFront = Array(n).fill(-Infinity)
    const ribFront = Array(n).fill(-Infinity)
    for (let i = 0; i < hraSkinPts.length; i += 3) {
      const k = Math.floor(hraSkinPts[i + 1] * 100) - y0
      /* Front skin only; each point counts for its slice and the two next to it (the skin mesh is sparse) */
      if (Math.abs(hraSkinPts[i]) >= 0.06 || hraSkinPts[i + 2] <= 0) continue
      for (let j = Math.max(0, k - 1); j <= Math.min(n - 1, k + 1); j++) skinFront[j] = Math.max(skinFront[j], hraSkinPts[i + 2])
    }
    for (let i = 0; i < ribPos.length; i += 3) {
      const k = Math.floor(ribPos[i + 1] * 100) - y0
      ribFront[k] = Math.max(ribFront[k], ribPos[i + 2])
    }
    /* Squeeze factor per slice: lowest within +-1 cm, then averaged over +-2 cm so the cage stays smooth */
    const raw = ribFront.map((f, k) => (f > zMid && Number.isFinite(skinFront[k]) ? Math.max(0.5, Math.min(1, (skinFront[k] - RIB_TISSUE - zMid) / (f - zMid))) : 1))
    const squeeze = raw.map((_, k) => {
      let m = 1
      for (let j = Math.max(0, k - 1); j <= Math.min(n - 1, k + 1); j++) m = Math.min(m, raw[j])
      return m
    })
    const smooth = squeeze.map((_, k) => {
      let t = 0
      let c = 0
      for (let j = Math.max(0, k - 2); j <= Math.min(n - 1, k + 2); j++) {
        t += squeeze[j]
        c++
      }
      return t / c
    })
    for (let i = 0; i < ribPos.length; i += 3) {
      if (ribPos[i + 2] <= zMid) continue
      const k = Math.floor(ribPos[i + 1] * 100) - y0
      ribPos[i + 2] = zMid + (ribPos[i + 2] - zMid) * smooth[k]
    }
    console.log(`rib cage front pressed back: depth x${Math.min(...smooth).toFixed(2)} at most`)
  }
  addPart("ribcage", ribPos, rib.indices, "musculoskeletal", 22000)

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
  /*
    The skull is placed by matching the BodyParts3D skin head (which fits its
    own skull) onto our skin head: nose tip, back of the head and width
    above the ears (BodyParts3D ears lie flatter than ours).
    Height: nose tip to crown.
  */
  const bpSkinRaw = readElements(dir, ["FJ2810"])
  const headMarks = (pts) => {
    const b = boundsOf(pts)
    const H = b.max[1] - b.min[1]
    const crown = b.max[1]
    const band = (lo, hi, f) => {
      for (let i = 0; i < pts.length; i += 3) if (pts[i + 1] <= crown - lo * H && pts[i + 1] >= crown - hi * H) f(pts[i], pts[i + 1], pts[i + 2])
    }
    let nose = [0, 0, -Infinity]
    band(0.05, 0.1, (x, y, z) => {
      if (z > nose[2]) nose = [x, y, z]
    })
    let back = Infinity
    band(0.02, 0.08, (x, y, z) => (back = Math.min(back, z)))
    let x0 = Infinity
    let x1 = -Infinity
    band(0.015, 0.045, (x) => {
      x0 = Math.min(x0, x)
      x1 = Math.max(x1, x)
    })
    return { nose, back, x0, x1, crown }
  }
  const bpMarks = headMarks(yUp(bpSkinRaw))
  const hraMarks = headMarks(hraSkinPts)
  const sx = (hraMarks.x1 - hraMarks.x0) / (bpMarks.x1 - bpMarks.x0)
  /* 2 % shorter front to back than the skins, so the back of the skull stays inside */
  const sz = (0.98 * (hraMarks.nose[2] - hraMarks.back)) / (bpMarks.nose[2] - bpMarks.back)
  const sy = (hraMarks.crown - hraMarks.nose[1]) / (bpMarks.crown - bpMarks.nose[1])
  /* Tilted back around the nose tip, as our skin's forehead slopes back more */
  const TILT = (4 * Math.PI) / 180
  const headMap = (g) => {
    const p = yUp(g)
    const out = new Float32Array(p.length)
    for (let i = 0; i < p.length; i += 3) {
      out[i] = (hraMarks.x0 + hraMarks.x1) / 2 + (p[i] - (bpMarks.x0 + bpMarks.x1) / 2) * sx
      const dy = (p[i + 1] - bpMarks.nose[1]) * sy
      const dz = (p[i + 2] - bpMarks.nose[2]) * sz
      out[i + 1] = hraMarks.nose[1] + dy * Math.cos(TILT) + dz * Math.sin(TILT)
      out[i + 2] = hraMarks.nose[2] + dz * Math.cos(TILT) - dy * Math.sin(TILT)
    }
    return out
  }
  console.log(`skull fit: scale x ${(sx * 1000).toFixed(3)} y ${(sy * 1000).toFixed(3)} z ${(sz * 1000).toFixed(3)} (m per m); nose tip ${hraMarks.nose.map((v) => v.toFixed(3)).join(", ")}`)
  addPart("skull", headMap(skull), skull.indices, "musculoskeletal", 13000)
  addPart("mandible", headMap(jaw), jaw.indices, "musculoskeletal", 3000)

  /*
    Arms: skin and bones both from BodyParts3D, posed into our skin's arm
    pose and stitched onto our skin at the shoulder (see bp3d-arms.mjs).
    Our skin is rebuilt as one new node in world space.
  */
  const skinNodes = nodesOf("whole-body")
  let skinMesh = { pos: [], idx: [] }
  for (const n of skinNodes) {
    const m = n.getWorldMatrix()
    for (const p of n.getMesh().listPrimitives()) {
      const a = p.getAttribute("POSITION")
      const ind = p.getIndices()
      const offset = skinMesh.pos.length / 3
      const v = [0, 0, 0]
      for (let i = 0; i < a.getCount(); i++) {
        a.getElement(i, v)
        skinMesh.pos.push(m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14])
      }
      const count = ind ? ind.getCount() : a.getCount()
      for (let i = 0; i < count; i++) skinMesh.idx.push(offset + (ind ? ind.getScalar(i) : i))
    }
  }
  skinMesh = weldMesh(skinMesh.pos, skinMesh.idx, 1e-6)
  const bpSkin = weldMesh(Array.from(fromLungs(bpSkinRaw)), bpSkinRaw.indices, 1e-6)
  const hands = handBoneConcepts(dir)
  const posedBones = []
  for (const side of ["right", "left"]) {
    const r = side === "right"
    const girdle = concepts(r ? "FMA13322" : "FMA13323", r ? "FMA13395" : "FMA13396")
    const humerus = concepts(r ? "FMA23130" : "FMA23131")
    const forearm = concepts(r ? "FMA23464" : "FMA23465", r ? "FMA23467" : "FMA23468")
    const hand = concepts(...hands.filter((h) => h.side === side).map((h) => h.concept))
    const humPos = fromLungs(humerus)
    const sign = Math.sign(boundsOf(humPos).min[0] + boundsOf(humPos).max[0])
    addPart(`shoulder_${side}`, fromLungs(girdle), girdle.indices, "musculoskeletal", 4000)
    const res = bp3dArm({ hra: skinMesh, bp: bpSkin, bones: { hum: humPos, fore: fromLungs(forearm), hand: fromLungs(hand) }, sign, side })
    skinMesh = res.skin
    for (let i = 0; i < res.armSkin.length; i += 3) armSkinKeys.add(res.armSkin.slice(i, i + 3).map((v) => Math.fround(v).toFixed(5)).join(","))
    posedBones.push({ side, ...res.bones })
    const armPos = new Float32Array(res.bones.hum.length + res.bones.fore.length)
    armPos.set(res.bones.hum)
    armPos.set(res.bones.fore, res.bones.hum.length)
    addPart(`arm_${side}`, armPos, [...humerus.indices, ...forearm.indices.map((i) => i + humerus.positions.length / 3)], "musculoskeletal", 6000)
    addPart(`hand_${side}`, res.bones.hand, hand.indices, "musculoskeletal", 4500)
  }
  {
    const material = skinNodes[0].getMesh().listPrimitives()[0].getMaterial()
    for (const n of skinNodes) n.dispose()
    const buffer = root.listBuffers()[0]
    const position = doc.createAccessor("skin_position").setType("VEC3").setArray(new Float32Array(skinMesh.pos)).setBuffer(buffer)
    const index = doc.createAccessor("skin_index").setType("SCALAR").setArray(new Uint32Array(skinMesh.idx)).setBuffer(buffer)
    const prim = doc.createPrimitive().setAttribute("POSITION", position).setIndices(index).setMaterial(material)
    scene.addChild(doc.createNode("VH_M_skin").setMesh(doc.createMesh("VH_M_skin").addPrimitive(prim)))
    const share = insideTester(skinMesh.pos, skinMesh.idx)
    for (const b of posedBones) console.log(`inside skin ${b.side}: humerus ${(share(b.hum) * 100).toFixed(1)} %, forearm ${(share(b.fore) * 100).toFixed(1)} %, hand ${(share(b.hand) * 100).toFixed(1)} %`)
    console.log(`skin with BodyParts3D arms: ${(skinMesh.idx.length / 3).toLocaleString()} tris`)
  }

  /*
    Foot bones (the HRA legs end at the ankle): every BodyParts3D tarsal,
    metatarsal and toe phalanx. Each foot is fitted in its own frame:
    - anchor: the ankle joint, i.e. the centre between the ankle knobs
      (lowest 3 cm of tibia + fibula) of our shin bones and of the
      BodyParts3D shin bones, so the talus sits in our ankle mortise;
    - direction: the heel-to-toe axis of each skin foot (main axis of the
      sole seen from above), so the bones turn with our foot;
    - size: heel, toes, width and height scaled separately to our skin
      foot, with a little extra soft tissue under the sole and at the toes.
  */
  {
    const FOOT = /^(right|left) (talus|calcaneus|cuboid bone|first metatarsal|second metatarsal|third metatarsal|fourth metatarsal|fifth metatarsal|medial cuneiform|intermediate cuneiform|lateral cuneiform)|^navicular bone of (right|left) foot|^(proximal|middle|distal) phalanx of (right|left) (big|second|third|fourth|little) toe/
    const footBones = readFileSync(join_(dir, "partof_parts_list_e.txt"), "utf8")
      .split(/\r?\n/)
      .slice(1)
      .map((l) => l.split("\t"))
      .filter(([c, , name]) => c && FOOT.test(name ?? ""))
      .map(([c, , name]) => ({ concept: c, side: /left/.test(name) ? "left" : "right" }))
    /* BodyParts3D side in its own true proportions (raw, Y up, mm -> m): the lungs mapping squashes heights */
    const raw = (g) => yUp(g).map((v) => v / 1000)
    const bpSkinFeet = raw(bpSkinRaw)
    const hraShin = { 1: [], [-1]: [] }
    for (const n of nodesOf("musculoskeletal")) {
      if (!n.getName().startsWith("VH_M")) continue
      const m = n.getWorldMatrix()
      for (const p of n.getMesh().listPrimitives()) {
        const a = p.getAttribute("POSITION")
        const v = [0, 0, 0]
        for (let i = 0; i < a.getCount(); i++) {
          a.getElement(i, v)
          const x = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12]
          const y = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13]
          const z = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]
          if (Math.abs(x) > 0.03 && y < 0.3) hraShin[Math.sign(x)].push(x, y, z)
        }
      }
    }
    const SOLE = 0.012
    const TOE = 0.016
    const SIDE = 0.004
    /* Ankle mortise: x/z centre of the lowest 3 cm of the shin bones, y at their lowest point */
    const mortise = (pts) => {
      const low = boundsOf(pts).min[1]
      const band = []
      for (let i = 0; i < pts.length; i += 3) if (pts[i + 1] < low + 0.03) band.push(pts[i], pts[i + 1], pts[i + 2])
      const b = boundsOf(band)
      return [(b.min[0] + b.max[0]) / 2, low, (b.min[2] + b.max[2]) / 2]
    }
    /* Skin foot below the ankle, its sole, and its heel-to-toe axis (sole band seen from above) */
    const skinFoot = (pts, sign, top) => {
      const foot = []
      for (let i = 0; i < pts.length; i += 3) if (pts[i] * sign > 0.02 && pts[i + 1] < top) foot.push(pts[i], pts[i + 1], pts[i + 2])
      const sole = boundsOf(foot).min[1]
      let cx = 0
      let cz = 0
      let n = 0
      for (let i = 0; i < foot.length; i += 3) {
        if (foot[i + 1] >= sole + 0.035) continue
        cx += foot[i]
        cz += foot[i + 2]
        n++
      }
      cx /= n
      cz /= n
      let sxx = 0
      let sxz = 0
      let szz = 0
      for (let i = 0; i < foot.length; i += 3) {
        if (foot[i + 1] >= sole + 0.035) continue
        const dx = foot[i] - cx
        const dz = foot[i + 2] - cz
        sxx += dx * dx
        sxz += dx * dz
        szz += dz * dz
      }
      const angle = 0.5 * Math.atan2(2 * sxz, szz - sxx)
      const along = [Math.sin(angle), 0, Math.cos(angle)]
      return { foot, sole, along: along[2] < 0 ? along.map((v) => -v) : along }
    }
    /* Foot frame coordinates relative to the anchor: [along, across, up] */
    const local = (p, o, along) => {
      const d = [p[0] - o[0], p[1] - o[1], p[2] - o[2]]
      return [d[0] * along[0] + d[2] * along[2], d[0] * along[2] - d[2] * along[0], d[1]]
    }
    const ranges = (pts, o, along) => {
      const r = [[Infinity, -Infinity], [Infinity, -Infinity]]
      for (let i = 0; i < pts.length; i += 3) {
        const q = local([pts[i], pts[i + 1], pts[i + 2]], o, along)
        r[0] = [Math.min(r[0][0], q[0]), Math.max(r[0][1], q[0])]
        /* Width from the forefoot only: the ankle is wider than the foot under it */
        if (q[0] > 0.03) r[1] = [Math.min(r[1][0], q[1]), Math.max(r[1][1], q[1])]
      }
      return r
    }
    for (const side of ["right", "left"]) {
      const g = concepts(...footBones.filter((b) => b.side === side).map((b) => b.concept))
      const pos = raw(g)
      const sign = Math.sign(boundsOf(fromLungs(g)).min[0] + boundsOf(fromLungs(g)).max[0])
      const bpSign = Math.sign(boundsOf(pos).min[0] + boundsOf(pos).max[0])
      const bpShin = raw(concepts(...(side === "right" ? ["FMA24477", "FMA24480"] : ["FMA24478", "FMA24481"])))
      const o0 = mortise(bpShin)
      const o1 = mortise(hraShin[sign])
      const f0 = skinFoot(bpSkinFeet, bpSign, o0[1])
      const f1 = skinFoot(hraSkinPts, sign, o1[1])
      const r0 = ranges(f0.foot, o0, f0.along)
      const r1 = ranges(f1.foot, o1, f1.along)
      const kToe = (r1[0][1] - TOE) / r0[0][1]
      const kHeel = r1[0][0] / r0[0][0]
      const kIn = (r1[1][0] + SIDE) / r0[1][0]
      const kOut = (r1[1][1] - SIDE) / r0[1][1]
      const kUp = (o1[1] - (f1.sole + SOLE)) / (o0[1] - f0.sole)
      const out = new Float32Array(pos.length)
      const [a1, , c1] = f1.along
      for (let i = 0; i < pos.length; i += 3) {
        const [u, w, h] = local([pos[i], pos[i + 1], pos[i + 2]], o0, f0.along)
        const u1 = u * (u > 0 ? kToe : kHeel)
        const w1 = w * (w < 0 ? kIn : kOut)
        const h1 = h * kUp
        out[i] = o1[0] + u1 * a1 + w1 * c1
        out[i + 1] = o1[1] + h1
        out[i + 2] = o1[2] + u1 * c1 - w1 * a1
      }
      const deg = (v) => ((Math.atan2(v[0], v[2]) * 180) / Math.PI).toFixed(1)
      console.log(`foot ${side}: ${footBones.filter((b) => b.side === side).length} bones; points ${deg(f1.along)} deg out (source ${deg(f0.along)}); scale toe ${kToe.toFixed(2)} heel ${kHeel.toFixed(2)} width ${kIn.toFixed(2)}/${kOut.toFixed(2)} height ${kUp.toFixed(2)}`)
      addPart(`foot_${side}`, out, g.indices, "musculoskeletal", 4000)
    }
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

/* Skin vertices of the BodyParts3D arms (position keys), kept out of the slimming */
const armSkinKeys = new Set()

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
if (!process.argv.includes("--no-slim")) await slimSkin(doc, console.log, armSkinKeys)
if (!process.argv.includes("--no-mannequin")) await smoothGroin(doc)

await doc.transform(quantize())
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE })

mkdirSync('public/models', { recursive: true })
await io.write(output, doc)
console.log(`wrote ${output}`)
