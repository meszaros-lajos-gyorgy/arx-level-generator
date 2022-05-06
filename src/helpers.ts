import fs from 'fs'
import rgba from 'color-rgba'
import {
  createTextureContainers,
  textures,
  exportTextures,
  resetTextures,
  TextureDefinition,
} from './assets/textures'
import {
  createDlfData,
  createFtsData,
  createLlfData,
  DlfData,
  FtsData,
  LlfData,
} from './blankMap'
import {
  pluck,
  compose,
  countBy,
  partition,
  nth,
  equals,
  adjust,
  repeat,
  either,
  clone,
  flatten,
} from 'ramda'
import {
  POLY_QUAD,
  MAP_MAX_HEIGHT,
  MAP_MAX_WIDTH,
  POLY_NODRAW,
  PLAYER_HEIGHT_ADJUSTMENT,
  PATH_RGB,
  PATH_AMBIANCE,
  PATH_FARCLIP,
} from './constants'
import {
  exportUsedItems,
  exportScripts,
  exportDependencies,
  resetItems,
} from './assets/items'
import {
  ambiences,
  exportAmbiences,
  useAmbience,
  resetAmbiences,
  AmbienceDefinition,
} from './assets/ambiences'
import { dirname, resolve } from 'path'
import {
  AbsoluteCoords,
  FloatRgb,
  MapConfig,
  PosVertex3,
  RelativeCoords,
  RgbaBytes,
  RotationVector3,
  Vector3,
  Vertex3,
} from './types'

export type MapData = {
  meta: {
    createdAt: string
    generatorVersion: string
  }
  config: MapConfig
  state: {
    color: RgbaBytes
    texture: TextureDefinition | null
    spawn: Vector3
    spawnAngle: number
    vertexCounter: number
    polygonGroup: string
  }
  items: any[] // TODO
  dlf: DlfData
  fts: FtsData
  llf: LlfData
}

export const normalize = (vector: Vector3): Vector3 => {
  const [x, y, z] = vector
  const mag = magnitude(vector)
  return [x / mag, y / mag, z / mag]
}

export const move = (
  x: number,
  y: number,
  z: number,
  vector: Vector3,
): Vector3 => {
  const [vx, vy, vz] = vector
  return [vx + x, vy + y, vz + z]
}

export const addCoords = (
  a: RelativeCoords | AbsoluteCoords,
  b: RelativeCoords | AbsoluteCoords,
): RelativeCoords | AbsoluteCoords => {
  if (a.type !== b.type) {
    throw new Error('Incompatible coords')
  }

  return {
    type: a.type,
    coords: [
      a.coords[0] + b.coords[0],
      a.coords[1] + b.coords[1],
      a.coords[2] + b.coords[2],
    ],
  }
}

// "#ff07a4" -> { r: [0..255], g: [0..255], b: [0..255], a: [0..255] }
export const toRgba = (cssColor: string): RgbaBytes => {
  const [r, g, b, a] = rgba(cssColor)

  return {
    r,
    g,
    b,
    a: Math.round(255 * a),
  }
}

// { r: 127, g: 0, b: 0, a: 1 } -> { r: [0.0..1.0], g: [0.0..1.0], b: [0.0..1.0] }
export const toFloatRgb = (color: RgbaBytes): FloatRgb => {
  const { r, g, b } = color
  return { r: r / 256, g: g / 256, b: b / 256 }
}

export const movePlayerTo = (pos: RelativeCoords, mapData: MapData) => {
  mapData.state.spawn = pos.coords
  return mapData
}

export const isBetween = (min: number, max: number, value: number) => {
  return value >= min && value < max
}

export const isBetweenInclusive = (min: number, max: number, value: number) => {
  return value >= min && value <= max
}

const generateLights = (mapData) => {
  let colorIdx = 0

  const colors: RgbaBytes[] = []

  const p = mapData.fts.polygons.reduce(
    (acc, { vertices }: { vertices: PosVertex3[] }, idx) => {
      const x = Math.min(...vertices.map(({ posX }) => posX))
      const z = Math.min(...pluck('posZ', vertices))

      const cellX = Math.floor(x / 100)
      const cellZ = Math.floor(z / 100) + 1

      if (!acc[`${cellZ}-${cellX}`]) {
        acc[`${cellZ}-${cellX}`] = [idx]
      } else {
        acc[`${cellZ}-${cellX}`].push(idx)
      }

      return acc
    },
    {},
  )

  for (let z = 0; z < MAP_MAX_HEIGHT; z++) {
    for (let x = 0; x < MAP_MAX_WIDTH; x++) {
      ;(p[`${z}-${x}`] || []).forEach((idx) => {
        const { config, vertices } = mapData.fts.polygons[idx]
        let { color, isQuad } = config

        colors.push(color, color, color)
        vertices[0].llfColorIdx = colorIdx++
        vertices[1].llfColorIdx = colorIdx++
        vertices[2].llfColorIdx = colorIdx++

        if (isQuad) {
          colors.push(color)
          vertices[3].llfColorIdx = colorIdx++
        }
      })
    }
  }

  mapData.llf.colors = colors
}

export const posVertexToVector = ({
  posX,
  posY,
  posZ,
}: PosVertex3): Vector3 => {
  return [posX, posY, posZ]
}

const vectorToXYZ = ([x, y, z]: Vector3): Vertex3 => {
  return { x, y, z }
}

const calculateNormals = (mapData) => {
  // https://computergraphics.stackexchange.com/questions/4031/programmatically-generating-vertex-normals

  mapData.fts.polygons.forEach((polygon) => {
    const { vertices, config } = polygon

    const points = vertices.map(posVertexToVector)

    // vertices are laid down in a russian i shape (И):
    // a c
    // b d
    const [a, b, c, d] = points

    if (config.isQuad) {
      polygon.norm2 = vectorToXYZ(
        normalize(cross(subtractVec3(c, d), subtractVec3(b, d))),
      )
    } else {
      polygon.norm2 = vectorToXYZ([0, 0, 0])
    }

    polygon.norm = vectorToXYZ(
      normalize(cross(subtractVec3(b, a), subtractVec3(c, a))),
    )

    polygon.normals = [polygon.norm, polygon.norm, polygon.norm, polygon.norm2]
  })
}

export const finalize = (mapData: MapData) => {
  const ungroupedPolygons = Object.values(mapData.fts.polygons).flatMap(
    (polygonGroup) => polygonGroup,
  )
  const numberOfPolygons = ungroupedPolygons.length

  mapData.fts.polygons = ungroupedPolygons
  mapData.dlf.header.numberOfBackgroundPolygons = numberOfPolygons
  mapData.llf.header.numberOfBackgroundPolygons = numberOfPolygons

  const { spawn, spawnAngle } = mapData.state

  const [x, y, z] = move(
    0,
    PLAYER_HEIGHT_ADJUSTMENT,
    0,
    move(...mapData.config.origin.coords, spawn),
  )
  mapData.fts.sceneHeader.mScenePosition = { x, y, z }

  mapData.llf.lights.forEach((light) => {
    light.pos.x -= spawn[0]
    light.pos.y -= spawn[1] + PLAYER_HEIGHT_ADJUSTMENT
    light.pos.z -= spawn[2]
  })

  mapData.dlf.paths.forEach((zone) => {
    zone.header.initPos.x -= spawn[0]
    zone.header.initPos.y -= spawn[1] + PLAYER_HEIGHT_ADJUSTMENT
    zone.header.initPos.z -= spawn[2]

    zone.header.pos.x -= spawn[0]
    zone.header.pos.y -= spawn[1] + PLAYER_HEIGHT_ADJUSTMENT
    zone.header.pos.z -= spawn[2]
  })

  mapData.dlf.header.angleEdit.b = spawnAngle

  createTextureContainers(mapData)
  exportUsedItems(mapData)
  calculateNormals(mapData)
  generateLights(mapData)

  return mapData
}

const addOriginPolygon = (mapData: MapData) => {
  mapData.fts.polygons.global.push({
    config: {
      color: toRgba('black'),
      isQuad: true,
      bumpable: false,
    },
    vertices: [
      { posX: 0, posY: 0, posZ: 0, texU: 0, texV: 0 },
      { posX: 1, posY: 0, posZ: 0, texU: 0, texV: 1 },
      { posX: 0, posY: 0, posZ: 1, texU: 1, texV: 0 },
      { posX: 1, posY: 0, posZ: 1, texU: 1, texV: 1 },
    ],
    tex: 0, // no texture at all!
    transval: 0,
    area: 1,
    type: POLY_QUAD | POLY_NODRAW,
    room: 1,
    paddy: 0,
  })
}

const timestampToDate = (timestamp: number) => {
  const date = new Date()
  date.setTime(timestamp * 1000)
  return date.toUTCString()
}

export const generateBlankMapData = (config) => {
  const now = Math.floor(Date.now() / 1000)
  const generatorVersion = require('../package.json').version as string

  const mapData: MapData = {
    meta: {
      createdAt: timestampToDate(now),
      generatorVersion,
    },
    config: {
      ...config,
    },
    state: {
      color: toRgba('white'),
      texture: textures.none,
      spawn: [0, 0, 0],
      spawnAngle: 0,
      vertexCounter: 0,
      polygonGroup: 'global',
    },
    items: [],
    dlf: createDlfData(config.levelIdx, now),
    fts: createFtsData(config.levelIdx),
    llf: createLlfData(now),
  }

  addOriginPolygon(mapData)

  return mapData
}

export const uninstall = async (dir) => {
  try {
    const manifest = require(`${dir}/manifest.json`)
    for (let file of manifest.files) {
      try {
        await fs.promises.rm(file)
      } catch (f) {}
    }
    await fs.promises.rm(`${dir}/manifest.json`)
  } catch (e) {}
}

export const saveToDisk = async (mapData) => {
  const { levelIdx } = mapData.config

  const defaultOutputDir = resolve('./dist')

  const outputDir =
    process.env.OUTPUTDIR ?? mapData.config.outputDir ?? defaultOutputDir

  if (outputDir === defaultOutputDir) {
    try {
      await fs.promises.rm('dist', { recursive: true })
    } catch (e) {}
  } else {
    await uninstall(outputDir)
  }

  let scripts = exportScripts(outputDir)
  let textures = exportTextures(outputDir)
  let ambiences = exportAmbiences(outputDir)
  let dependencies = exportDependencies(outputDir)

  const files = {
    fts: `${outputDir}/game/graph/levels/level${levelIdx}/fast.fts.json`,
    dlf: `${outputDir}/graph/levels/level${levelIdx}/level${levelIdx}.dlf.json`,
    llf: `${outputDir}/graph/levels/level${levelIdx}/level${levelIdx}.llf.json`,
  }

  const manifest = {
    meta: mapData.meta,
    config: mapData.config,
    files: [
      ...Object.values(files),
      ...Object.keys(scripts),
      ...Object.keys(ambiences),
      ...Object.keys(dependencies),
      ...Object.keys(textures),
      files.fts.replace('.fts.json', '.fts'),
      files.dlf.replace('.dlf.json', '.dlf'),
      files.llf.replace('.llf.json', '.llf'),
    ].sort(),
  }

  const tasks = manifest.files.map((path) => {
    return fs.promises.mkdir(dirname(path), { recursive: true })
  })

  for (let task of tasks) {
    await task
  }

  // ------------

  for (let [filename, script] of Object.entries(scripts)) {
    await fs.promises.writeFile(filename, script, 'latin1')
  }

  // ------------

  const ambiencesPairs = Object.entries(ambiences)
  const dependenciesPairs = Object.entries(dependencies)
  const texturesPairs = Object.entries(textures)

  for (let [target, source] of [
    ...ambiencesPairs,
    ...dependenciesPairs,
    ...texturesPairs,
  ]) {
    await fs.promises.copyFile(source, target)
  }

  // ------------

  await fs.promises.writeFile(files.dlf, JSON.stringify(mapData.dlf))
  await fs.promises.writeFile(files.fts, JSON.stringify(mapData.fts))
  await fs.promises.writeFile(files.llf, JSON.stringify(mapData.llf))

  await fs.promises.writeFile(
    `${outputDir}/manifest.json`,
    JSON.stringify(manifest, null, 2),
  )
}

export const setColor = (color: string, mapData: MapData) => {
  mapData.state.color = toRgba(color)
}

export const setTexture = (texture, mapData: MapData) => {
  mapData.state.texture = clone(texture)
}

export const setPolygonGroup = (group, mapData: MapData) => {
  mapData.state.polygonGroup = group
}

export const unsetPolygonGroup = (mapData: MapData) => {
  mapData.state.polygonGroup = 'global'
}

const unpackCoords = (coords: any[]) => {
  return coords.map((coord) => {
    const [posX, posY, posZ] = coord[0].split('|').map((x) => parseInt(x))
    return { posX, posY, posZ }
  })
}

export const categorizeVertices = (polygons) => {
  const vertices = polygons.flatMap(({ vertices: { posX, posY, posZ } }) => {
    return { posX, posY, posZ }
  })

  const summary: Record<string, number> = countBy(
    ({ posX, posY, posZ }: PosVertex3) => `${posX}|${posY}|${posZ}`,
    vertices,
  )

  const [corner, [edge, middle]] = compose(
    adjust(1, partition(compose(equals(2), nth(1)))),
    partition(compose(either(equals(1), equals(3)), nth(1))),
  )(Object.entries(summary))

  return {
    corners: unpackCoords(corner),
    edges: unpackCoords(edge),
    middles: unpackCoords(middle),
  }
}

export const bumpByMagnitude = (magnitude) => (vertex) => {
  if (!vertex.modified) {
    vertex.posY -= magnitude
    vertex.modified = true
  }

  return vertex
}

export const adjustVertexBy = (ref, fn, polygons) => {
  polygons.forEach((polygon) => {
    polygon.vertices = polygon.vertices.map((vertex) => {
      if (
        vertex.posX === ref.posX &&
        vertex.posY === ref.posY &&
        vertex.posZ === ref.posZ
      ) {
        return fn(vertex, polygon)
      }

      return vertex
    })
  })
}

export const randomBetween = (min: number, max: number) => {
  return Math.random() * (max - min) + min
}

export const pickRandoms = (n, set) => {
  if (set.length <= n) {
    return set
  } else {
    let remaining = set.slice()
    let matches = []
    for (let i = 0; i < n; i++) {
      let idx = randomBetween(0, remaining.length)
      matches = matches.concat(remaining.splice(idx, 1))
    }
    return matches
  }
}

export const pickRandom = (set) => {
  return pickRandoms(1, set)[0]
}

export const pickRandomIdx = (set) => {
  return pickRandom(Object.keys(set))
}

const cross = (u: Vector3, v: Vector3): Vector3 => {
  return [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ]
}

export const subtractVec3 = (a: Vector3, b: Vector3): Vector3 => {
  return [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
}

export const magnitude = ([x, y, z]: Vector3) => {
  return Math.sqrt(x ** 2 + y ** 2 + z ** 2)
}

const triangleArea = (a: Vector3, b: Vector3, c: Vector3) => {
  return magnitude(cross(subtractVec3(a, b), subtractVec3(a, c))) / 2
}

export const distance = (a: Vector3, b: Vector3) => {
  return Math.abs(magnitude(subtractVec3(a, b)))
}

// source: https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/barycentric-coordinates
const isPointInTriangle = (p: Vector3, a, b, c) => {
  const area = triangleArea(a, b, c)

  const u = triangleArea(c, a, p) / area
  const v = triangleArea(a, b, p) / area
  const w = triangleArea(b, c, p) / area

  return (
    isBetweenInclusive(0, 1, u) &&
    isBetweenInclusive(0, 1, v) &&
    isBetweenInclusive(0, 1, w) &&
    u + v + w === 1
  )
}

export const isPointInPolygon = (point: Vector3, polygon) => {
  const [a, b, c, d] = polygon.vertices.map(posVertexToVector)

  if (polygon.config.isQuad) {
    return (
      isPointInTriangle(point, a, b, c) || isPointInTriangle(point, b, c, d)
    )
  } else {
    return isPointInTriangle(point, a, b, c)
  }
}

export const addLight = (pos: Vector3, props = {}, mapData: MapData) => {
  let [x, y, z] = pos

  mapData.llf.lights.push({
    ...{
      pos: { x, y, z },
      rgb: toFloatRgb(mapData.state.color),
      fallstart: 100,
      fallend: 180,
      intensity: 1.3,
      i: 0,
      exFlicker: toFloatRgb(toRgba('black')), // this gets subtracted from light.rgb when flickering
      exRadius: 0,
      exFrequency: 0.01,
      exSize: 0,
      exSpeed: 0,
      exFlareSize: 0,
      extras: 0,
    },
    ...props,
  })

  return mapData
}

export const addZone = (
  pos: RelativeCoords,
  size,
  name,
  ambience: AmbienceDefinition = ambiences.none,
  drawDistance = 2000,
  flags = PATH_RGB | PATH_AMBIANCE | PATH_FARCLIP,
) => {
  return (mapData) => {
    let [x, y, z] = pos.coords

    useAmbience(ambience)

    const zoneData = {
      header: {
        name,
        idx: 0,
        flags,
        initPos: { x, y, z },
        pos: { x, y, z },
        rgb: toFloatRgb(mapData.state.color),
        farClip: drawDistance,
        reverb: 0,
        ambianceMaxVolume: 100,
        height: size[1] === 0 ? -1 : size[1],
        ambiance: ambience.name,
      },
      pathways: [
        { rpos: { x: -size[0] / 2, y: 0, z: size[2] / 2 }, flag: 0, time: 0 },
        {
          rpos: { x: -size[0] / 2, y: 0, z: -size[2] / 2 },
          flag: 0,
          time: 2000,
        },
        {
          rpos: { x: size[0] / 2, y: 0, z: -size[2] / 2 },
          flag: 0,
          time: 2000,
        },
        { rpos: { x: size[0] / 2, y: 0, z: size[2] / 2 }, flag: 0, time: 0 },
      ],
    }

    mapData.dlf.paths.push(zoneData)
    return mapData
  }
}

export const flipPolygon = (vertices) => {
  const [a, b, c, d] = vertices
  // vertices are laid down in a russian i shape (И):
  // a c
  // b d
  // to flip both triangles I'm flipping the middle 2 vertices
  return [a, c, b, d]
}

export const sortByDistance =
  (fromPoint: Vector3) => (a: Vector3, b: Vector3) => {
    const distanceA = distance(fromPoint, a)
    const distanceB = distance(fromPoint, b)

    return distanceA - distanceB
  }

// [ a, b, c  [ x      [ ax + by + cz
//   d, e, f    y    =   dx + ey + fz
//   g, h, i ]  z ]      gx + hy + iz ]
const matrix3MulVec3: (matrix: number[], vector: Vector3) => Vector3 = (
  [a, b, c, d, e, f, g, h, i],
  [x, y, z],
) => {
  return [a * x + b * y + c * z, d * x + e * y + f * z, g * x + h * y + i * z]
}

export const degToRad = (deg: number) => (deg * Math.PI) / 180
export const radToDeg = (rad: number) => rad * (180 / Math.PI)

export const rotateVec3 = (point: Vector3, [a, b, g]: RotationVector3) => {
  a = degToRad(a)
  b = degToRad(b)
  g = degToRad(g)

  const { sin, cos } = Math

  const rotation = [
    cos(a) * cos(b),
    cos(a) * sin(b) * sin(g) - sin(a) * cos(g),
    cos(a) * sin(b) * cos(g) + sin(a) * sin(g),
    sin(a) * cos(b),
    sin(a) * sin(b) * sin(g) + cos(a) * cos(g),
    sin(a) * sin(b) * cos(g) - cos(a) * sin(g),
    -sin(b),
    cos(b) * sin(g),
    cos(b) * cos(g),
  ]

  return matrix3MulVec3(rotation, point)
}

export const circleOfVectors = (center, radius: number, division) => {
  const angle = 360 / division

  const vectors: Vector3[] = []

  for (let i = 0; i < division; i++) {
    const point: Vector3 = [0, 0, 1 * radius]
    const rotation: RotationVector3 = [0, angle * i, 0]
    vectors.push(move(...rotateVec3(point, rotation), center))
  }

  return vectors
}

export const cleanupCache = () => {
  resetItems()
  resetAmbiences()
  resetTextures()
}

export const pickRandomLoot = (lootTable) => {
  const idx = pickRandom(
    flatten(lootTable.map(({ weight }, idx) => repeat(idx, weight))),
  )
  return lootTable[idx]
}
