import { createRune } from '../../items/createRune'
import { identity, uniq } from '../../faux-ramda'
import { ambiences } from '../../assets/ambiences'
import {
  items,
  createItem,
  moveTo,
  markAsUsed,
  addScript,
} from '../../assets/items'
import { textures } from '../../assets/textures'
import { HFLIP, VFLIP } from '../../constants'
import {
  saveToDisk,
  finalize,
  generateBlankMapData,
  movePlayerTo,
  addZone,
  setColor,
  setTexture,
  addLight,
  pickRandom,
  circleOfVectors,
  setPolygonGroup,
  unsetPolygonGroup,
} from '../../helpers'
import { plain } from '../../prefabs'
import { disableBumping, connectToNearPolygons } from '../../prefabs/plain'
import { getInjections } from '../../scripting'
import { createCampfire } from './items/campfire'
import { createGoblin } from './items/goblin'

const createWelcomeMarker = (pos) => {
  const ref = createItem(items.marker)

  addScript((self) => {
    return `
// component: welcomeMarker
ON INIT {
  ${getInjections('init', self)}
  SETCONTROLLEDZONE palette0
  ACCEPT
}

ON CONTROLLEDZONE_ENTER {
  TELEPORT -p ${self.ref}
  ACCEPT
}
      `
  }, ref)

  markAsUsed(ref)
  moveTo({ type: 'relative', coords: pos }, [0, 0, 0], ref)

  return ref
}

const createFishSpawn = (pos) => {
  const ref = createItem(items.fishSpawn)
  moveTo({ type: 'relative', coords: pos }, [0, 0, 0], ref)
  markAsUsed(ref)
  return ref
}

const createBarrel = (pos, angle, contents = []) => {
  const ref = createItem(items.containers.barrel)
  addScript((self) => {
    return `
// component: barrel
ON INIT {
${getInjections('init', self)}

// setscale 75

${contents
  .map(({ ref }) => {
    return `inventory addfromscene "${ref}"`
  })
  .join('  \n')}

ACCEPT
}
    `
  }, ref)
  moveTo({ type: 'relative', coords: pos }, angle, ref)
  markAsUsed(ref)
  return ref
}

const createCards = (pos, angle = [0, 0, 0], props = {}) => {
  const ref = createItem(items.misc.deckOfCards, props)
  moveTo({ type: 'relative', coords: pos }, angle, ref)
  markAsUsed(ref)
  return ref
}

const generate = async (config) => {
  const { origin } = config

  const islandSizeInTiles = 8
  const islandSize = islandSizeInTiles * 100
  const islandRadius = islandSize / 2
  const islandCenter = { x: islandSize / 2, z: islandSize / 2 }
  const islandEdgeOffset = 150

  createWelcomeMarker([islandCenter.x, 0, islandCenter.z + islandRadius * 0.5])

  createGoblin(
    [
      islandCenter.x - islandRadius + islandEdgeOffset,
      0,
      islandCenter.z - islandRadius + islandEdgeOffset,
    ],
    [0, 135, 0],
  )

  const fishSpawnCoords = []

  const distanceBetweenSpawns = 800

  for (
    let x = 0;
    x <= Math.floor(islandCenter.x / distanceBetweenSpawns) + 1;
    x++
  ) {
    for (
      let z = 0;
      z <= Math.floor(islandCenter.z / distanceBetweenSpawns) + 1;
      z++
    ) {
      fishSpawnCoords.push([
        -islandCenter.x - islandRadius + x * distanceBetweenSpawns,
        islandCenter.z - islandRadius + z * distanceBetweenSpawns,
      ])
      fishSpawnCoords.push([
        -islandCenter.x - islandRadius + x * distanceBetweenSpawns,
        -islandCenter.z - islandRadius + z * distanceBetweenSpawns,
      ])
      fishSpawnCoords.push([
        islandCenter.x - islandRadius + x * distanceBetweenSpawns,
        -islandCenter.z - islandRadius + z * distanceBetweenSpawns,
      ])
    }
  }

  uniq(fishSpawnCoords).forEach(([x, z]) => {
    createFishSpawn([x, 50, z])
  })

  const startingLoot = [
    markAsUsed(createItem(items.misc.pole)),
    markAsUsed(createItem(items.misc.rope)),
    createRune('aam'),
    createRune('yok'),
  ]

  createBarrel(
    [islandCenter.x - islandRadius + islandEdgeOffset, 0, islandCenter.z],
    [0, 0, 0],
    startingLoot,
  )
  createCards([
    islandCenter.x - islandRadius + islandEdgeOffset,
    -120,
    islandCenter.z + 30,
  ])

  const mapData = generateBlankMapData(config)

  mapData.meta.mapName = 'On the island'
  mapData.state.spawnAngle = 180
  movePlayerTo(
    {
      type: 'relative',
      coords: [-origin.coords[0], -origin.coords[1], -origin.coords[2]],
    },
    mapData,
  )
  setColor('#DBF4FF', mapData)

  addZone(
    {
      type: 'relative',
      coords: [-origin.coords[0], -origin.coords[1], -origin.coords[2]],
    },
    [100, 0, 100],
    'palette0',
    ambiences.none,
    2000,
  )(mapData)

  setColor('hsv(150, 37%, 70%)', mapData)
  setTexture(textures.gravel.ground1, mapData)
  setPolygonGroup('island-1', mapData)

  plain(
    [islandCenter.x, 0, islandCenter.z],
    [islandSizeInTiles, islandSizeInTiles],
    'floor',
    identity,
    () => ({
      textureRotation: pickRandom([0, 90, 180, 270]),
      textureFlags: pickRandom([0, HFLIP, VFLIP, HFLIP | VFLIP]),
    }),
  )(mapData)

  setPolygonGroup('island-2', mapData)

  plain(
    [islandCenter.x, 70, -islandCenter.z],
    [islandSizeInTiles, islandSizeInTiles],
    'floor',
    connectToNearPolygons('island-1'),
    () => ({
      textureRotation: pickRandom([0, 90, 180, 270]),
      textureFlags: pickRandom([0, HFLIP, VFLIP, HFLIP | VFLIP]),
    }),
  )(mapData)

  setPolygonGroup('island-3', mapData)

  plain(
    [-islandCenter.x, 140, -islandCenter.z],
    [islandSizeInTiles, islandSizeInTiles],
    'floor',
    connectToNearPolygons('island-2'),
    () => ({
      textureRotation: pickRandom([0, 90, 180, 270]),
      textureFlags: pickRandom([0, HFLIP, VFLIP, HFLIP | VFLIP]),
    }),
  )(mapData)

  setPolygonGroup('island-4', mapData)

  plain(
    [-islandCenter.x, 210, islandCenter.z],
    [islandSizeInTiles, islandSizeInTiles],
    'floor',
    (polygons, mapData) => {
      // TODO: don't know why this only works in this particular order and not the other way around
      polygons = connectToNearPolygons('island-1', 200)(polygons, mapData)
      polygons = connectToNearPolygons('island-3', 100)(polygons, mapData)
      return polygons
    },
    () => ({
      textureRotation: pickRandom([0, 90, 180, 270]),
      textureFlags: pickRandom([0, HFLIP, VFLIP, HFLIP | VFLIP]),
    }),
  )(mapData)

  setColor('lightblue', mapData)
  setTexture(textures.water.cave, mapData)
  unsetPolygonGroup(mapData)

  plain([0, 10, 0], [50, 50], 'floor', disableBumping)(mapData)

  createCampfire(
    {
      type: 'relative',
      coords: [islandCenter.x, -20, islandCenter.z],
    },
    [0, 0, 0],
    mapData,
  )
  setColor('white', mapData)
  circleOfVectors([0, -1000, 0], 1000, 3).forEach((pos) => {
    addLight(
      pos,
      {
        fallstart: 1,
        fallend: 3000,
        intensity: 3,
      },
      mapData,
    )
  })

  const finalizedMapData = finalize(mapData)
  return saveToDisk(finalizedMapData)
}

export default generate
