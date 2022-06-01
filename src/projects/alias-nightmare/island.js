import { props, any } from '../../faux-ramda'
import {
  setColor,
  move,
  isPointInPolygon,
  addLight,
  setTexture,
  setPolygonGroup,
  unsetPolygonGroup,
  pickRandom,
} from '../../helpers'
import { colors, NORTH, SOUTH, WEST, EAST, NONE } from './constants'
import {
  plain,
  connectToNearPolygons,
  disableBumping,
} from '../../prefabs/plain'
import { moveTo, markAsUsed } from '../../assets/items'
import { textures } from '../../assets/textures'
import { nanoid } from 'nanoid'
import {
  ISLAND_JOINT_LENGTH,
  ISLAND_JOINT_WIDTH,
  HFLIP,
  VFLIP,
} from '../../constants'
import { createPressurePlate } from './items/pressurePlate'
import { createEventBus } from './items/eventBus'
import { createGate } from './items/gate'

// PP = pressure plate

const getPPIndices = (exits) => {
  // [0 1]
  // [2 3]
  switch (exits) {
    case NORTH | SOUTH | WEST | EAST:
    case NORTH | SOUTH | EAST:
    case NORTH | SOUTH | WEST:
    case NORTH | EAST | WEST:
    case SOUTH | EAST | WEST:
    case NORTH | SOUTH:
    case EAST | WEST:
      return [0, 1, 2, 3]
    case NORTH | WEST:
      return [0, 1, 2]
    case NORTH | EAST:
      return [0, 1, 3]
    case SOUTH | WEST:
      return [0, 2, 3]
    case SOUTH | EAST:
      return [1, 2, 3]
    case NORTH:
      return [0, 1]
    case SOUTH:
      return [2, 3]
    case EAST:
      return [1, 3]
    case WEST:
      return [0, 2]
    default:
      return []
  }
}

const createPressurePlates = (eventBus) => {
  return [
    createPressurePlate('pp0', eventBus),
    createPressurePlate('pp1', eventBus),
    createPressurePlate('pp2', eventBus),
    createPressurePlate('pp3', eventBus),
  ]
}

const createGates = () => {
  return {
    north: createGate('north', { isWide: true, isOpen: false }),
    south: createGate('south', { isWide: true, isOpen: false }),
    west: createGate('west', { isWide: true, isOpen: false }),
    east: createGate('east', { isWide: true, isOpen: false }),
  }
}

const island = (config, mapData) => {
  const id = nanoid(6)
  const { pos, entrances = NONE, width, height } = config
  // exits are locked connection points, entrances are not
  let { exits = NONE } = config
  exits = exits & ~entrances
  const spawn = move(...mapData.config.origin.coords, mapData.state.spawn)

  const quartX = width * 50 - 300
  const quartZ = height * 50 - 300

  const ppCoords = [
    move(-quartX, -6, quartZ, pos),
    move(quartX, -6, quartZ, pos),
    move(-quartX, -6, -quartZ, pos),
    move(quartX, -6, -quartZ, pos),
  ]
  const ppIndices = getPPIndices(exits)

  const jointOffset = (ISLAND_JOINT_LENGTH * 100) / 2 - 100

  const gates = createGates()
  const eventBus = createEventBus(gates)
  const pps = createPressurePlates(eventBus)

  for (let i = 0; i < 4; i++) {
    moveTo({ type: 'relative', coords: ppCoords[i] }, [0, 0, 0], pps[i])
  }

  props(ppIndices, pps).forEach((pp) => {
    markAsUsed(pp)
  })

  if (ppIndices.length) {
    markAsUsed(eventBus)
  }

  // TODO: moveTo the used gates + add small bridge segments
  if (exits & NORTH) {
    markAsUsed(gates.north)
    moveTo(
      {
        type: 'relative',
        coords: move(
          -25,
          0,
          (height * 100) / 2 + ISLAND_JOINT_LENGTH * 100 - 200,
          pos,
        ),
      },
      [0, 90, 0],
      gates.north,
    )
  }
  if (exits & SOUTH) {
    markAsUsed(gates.south)
    moveTo(
      {
        type: 'relative',
        coords: move(
          25,
          0,
          -(height * 100) / 2 - ISLAND_JOINT_LENGTH * 100 + 200,
          pos,
        ),
      },
      [0, 270, 0],
      gates.south,
    )
  }
  if (exits & EAST) {
    markAsUsed(gates.east)
    moveTo(
      {
        type: 'relative',
        coords: move(
          (width * 100) / 2 + ISLAND_JOINT_LENGTH * 100 - 200,
          0,
          25,
          pos,
        ),
      },
      [0, 0, 0],
      gates.east,
    )
  }
  if (exits & WEST) {
    markAsUsed(gates.west)
    moveTo(
      {
        type: 'relative',
        coords: move(
          -(width * 100) / 2 - ISLAND_JOINT_LENGTH * 100 + 200,
          0,
          -25,
          pos,
        ),
      },
      [0, 180, 0],
      gates.west,
    )
  }

  setColor(colors.terrain, mapData)
  setTexture(textures.stone.humanWall1, mapData)
  setPolygonGroup(`${id}-island-top`, mapData)

  plain(pos, [width, height], 'floor', (polygons) => {
    const ppAbsoluteCoords = props(ppIndices, ppCoords).map((pos) =>
      move(...mapData.config.origin.coords, pos),
    )

    return polygons.map((polygon) => {
      if (isPointInPolygon(pos, polygon)) {
        polygon.config.bumpable = false
      }

      if (
        isPointInPolygon(move(...mapData.config.origin.coords, spawn), polygon)
      ) {
        polygon.config.bumpable = false
      }

      if (
        any(
          (point) => isPointInPolygon(point, polygon),
          ppAbsoluteCoords.map((pos) => move(0, 6, 0, pos)),
        )
      ) {
        polygon.tex = 0
        polygon.config.bumpable = false
      }

      return polygon
    })
  })(mapData)

  setTexture(textures.gravel.ground1, mapData)
  setPolygonGroup(`${id}-island-bottom`, mapData)

  plain(
    move(0, 100, 0, pos),
    [width, height],
    'ceiling',
    connectToNearPolygons(`${id}-island-top`),
    () => ({
      textureRotation: pickRandom([0, 90, 180, 270]),
      textureFlags: pickRandom([0, HFLIP, VFLIP, HFLIP | VFLIP]),
    }),
  )(mapData)

  if ((exits | entrances) & NORTH) {
    setTexture(textures.stone.humanWall1, mapData)
    setPolygonGroup(`${id}-north-island-joint-top`, mapData)
    plain(
      move(0, 0, (height * 100) / 2 + jointOffset, pos),
      [ISLAND_JOINT_WIDTH, ISLAND_JOINT_LENGTH],
      'floor',
    )(mapData)

    setTexture(textures.gravel.ground1, mapData)
    setPolygonGroup(`${id}-north-island-joint-bottom`, mapData)
    plain(
      move(0, 100, (height * 100) / 2 + jointOffset, pos),
      [ISLAND_JOINT_WIDTH, ISLAND_JOINT_LENGTH],
      'ceiling',
      (polygon, mapData) => {
        return connectToNearPolygons(`${id}-north-island-joint-top`)(
          disableBumping(polygon),
          mapData,
        )
      },
      () => ({
        textureRotation: pickRandom([0, 90, 180, 270]),
        textureFlags: pickRandom([0, HFLIP, VFLIP, HFLIP | VFLIP]),
      }),
    )(mapData)
  }

  if ((exits | entrances) & SOUTH) {
    setTexture(textures.stone.humanWall1, mapData)
    setPolygonGroup(`${id}-south-island-joint-top`, mapData)
    plain(
      move(0, 0, -((height * 100) / 2 + jointOffset), pos),
      [ISLAND_JOINT_WIDTH, ISLAND_JOINT_LENGTH],
      'floor',
    )(mapData)
    setTexture(textures.gravel.ground1, mapData)
    setPolygonGroup(`${id}-south-island-joint-bottom`, mapData)
    plain(
      move(0, 100, -((height * 100) / 2 + jointOffset), pos),
      [ISLAND_JOINT_WIDTH, ISLAND_JOINT_LENGTH],
      'ceiling',
      (polygon, mapData) => {
        return connectToNearPolygons(`${id}-south-island-joint-top`)(
          disableBumping(polygon),
          mapData,
        )
      },
      () => ({
        textureRotation: pickRandom([0, 90, 180, 270]),
        textureFlags: pickRandom([0, HFLIP, VFLIP, HFLIP | VFLIP]),
      }),
    )(mapData)
  }

  if ((exits | entrances) & EAST) {
    setTexture(textures.stone.humanWall1, mapData)
    setPolygonGroup(`${id}-east-island-joint-top`, mapData)
    plain(
      move((width * 100) / 2 + jointOffset, 0, 0, pos),
      [ISLAND_JOINT_LENGTH, ISLAND_JOINT_WIDTH],
      'floor',
    )(mapData)
    setTexture(textures.gravel.ground1, mapData)
    setPolygonGroup(`${id}-east-island-joint-bottom`, mapData)
    plain(
      move((width * 100) / 2 + jointOffset, 100, 0, pos),
      [ISLAND_JOINT_LENGTH, ISLAND_JOINT_WIDTH],
      'ceiling',
      (polygon, mapData) => {
        return connectToNearPolygons(`${id}-east-island-joint-top`)(
          disableBumping(polygon),
          mapData,
        )
      },
      () => ({
        textureRotation: pickRandom([0, 90, 180, 270]),
        textureFlags: pickRandom([0, HFLIP, VFLIP, HFLIP | VFLIP]),
      }),
    )(mapData)
  }

  if ((exits | entrances) & WEST) {
    setTexture(textures.stone.humanWall1, mapData)
    setPolygonGroup(`${id}-west-island-joint-top`, mapData)
    plain(
      move(-((width * 100) / 2 + jointOffset), 0, 0, pos),
      [ISLAND_JOINT_LENGTH, ISLAND_JOINT_WIDTH],
      'floor',
    )(mapData)
    setTexture(textures.gravel.ground1, mapData)
    setPolygonGroup(`${id}-west-island-joint-bottom`, mapData)
    plain(
      move(-((width * 100) / 2 + jointOffset), 100, 0, pos),
      [ISLAND_JOINT_LENGTH, ISLAND_JOINT_WIDTH],
      'ceiling',
      (polygon, mapData) => {
        return connectToNearPolygons(`${id}-west-island-joint-top`)(
          disableBumping(polygon),
          mapData,
        )
      },
      () => ({
        textureRotation: pickRandom([0, 90, 180, 270]),
        textureFlags: pickRandom([0, HFLIP, VFLIP, HFLIP | VFLIP]),
      }),
    )(mapData)
  }

  setColor(colors.lights, mapData)
  props(ppIndices, ppCoords).forEach((ppCoord) => {
    addLight(move(0, -10, 0, ppCoord), {}, mapData)
  })
  unsetPolygonGroup(mapData)
}

export default island
