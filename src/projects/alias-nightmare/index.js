import { compose, reduce, __, addIndex } from 'ramda'
import {
  generateBlankMapData,
  movePlayerTo,
  finalize,
  saveToDisk,
  setColor,
  addZone,
  randomBetween,
  circleOfVectors,
  setTexture,
  setPolygonGroup,
  unsetPolygonGroup,
} from '../../helpers'
import island from './island'
import { colors, NONE, ALL, NORTH, EAST, SOUTH, WEST } from './constants'
import { ambiences } from '../../assets/ambiences'
import {
  items,
  createItem,
  markAsUsed,
  moveTo,
  addScript,
  addDependencyAs,
  addDependency,
} from '../../assets/items'
import { declare, color, getInjections } from '../../scripting'
import bridges from './bridges'
import { createSmellyFlower } from './items/smellyFlower'
import { createStatue, defineStatue } from './items/statue'
import { plain } from '../../prefabs'
import { textures } from '../../assets/textures'
import { MAP_MAX_WIDTH, MAP_MAX_HEIGHT, PATH_RGB } from '../../constants'
import { disableBumping } from '../../prefabs/plain'

const createWelcomeMarker = (pos) => (config) => {
  return compose(
    markAsUsed,
    moveTo({ type: 'relative', coords: pos }, [0, 0, 0]),
    (item) => {
      declare('int', 'hadIntro', 0, item)
      addDependency('graph/levels/level1/map.bmp', item)
      addDependencyAs(
        'projects/alias-nightmare/loading.bmp',
        `graph/levels/level${config.levelIdx}/loading.bmp`,
        item,
      )
      addScript((self) => {
        return `
  // component: welcomeMarker
  ON INIT {
    ${getInjections('init', self)}
    SETCONTROLLEDZONE palette0
    // CINEMASCOPE ON
    // WORLDFADE OUT 0 ${color(colors.ambience[0])}
  
    ACCEPT
  }
  ON CONTROLLEDZONE_ENTER {
    if (${self.state.hadIntro} == 0) {
      TELEPORT -p ${self.ref}
      SET ${self.state.hadIntro} 1
      SETPLAYERCONTROLS OFF
      // TIMERfade 1 2 worldfade IN 2000
      GOTO READY // TIMERmove -m 1 10 SPEAK -p [alia_nightmare2] GOTO READY
  
      ACCEPT
    }
    ACCEPT
  }
  >>READY {
    CINEMASCOPE -s OFF
    SETPLAYERCONTROLS ON
  
    INVENTORY PLAYERADD special/wall_block/wall_block
    INVENTORY PLAYERADD special/wall_block/wall_block
    INVENTORY PLAYERADD special/wall_block/wall_block
    INVENTORY PLAYERADD special/wall_block/wall_block
  
    ACCEPT
  }
        `
      }, item)

      return item
    },
    createItem,
  )(items.marker)
}

const createFallSaver = (pos, target) => {
  return compose(
    markAsUsed,
    moveTo({ type: 'relative', coords: pos }, [0, 0, 0]),
    (item) => {
      declare('int', 'isCatching', 0, item)
      addDependencyAs(
        'projects/alias-nightmare/UruLink.wav',
        `sfx/UruLink.wav`,
        item,
      )
      addScript((self) => {
        return `
// component fallsaver
ON INIT {
  ${getInjections('init', self)}
  SETCONTROLLEDZONE "fall-detector"
  ACCEPT
}

ON CONTROLLEDZONE_ENTER {
  IF (${self.state.isCatching} == 1) {
    ACCEPT
  }
  SET ${self.state.isCatching} 1
  GOSUB FADEOUT
  TIMERfadein -m 1 300 GOSUB FADEIN NOP
  ACCEPT
}

>>FADEOUT {
  WORLDFADE OUT 300 ${color('black')}
  PLAY -o "UruLink"
  RETURN
}

>>FADEIN {
  TELEPORT -p ${target.ref}
  SET ${self.state.isCatching} 0
  TIMERfadein -m 1 2000 WORLDFADE IN 1000
  RETURN
}
        `
      }, item)

      return item
    },
    createItem,
  )(items.marker)
}

const generateAtLeastOneExit = () => {
  return (
    Math.round(randomBetween(NONE, ALL)) || 1 << Math.round(randomBetween(0, 3))
  )
}

const createFallInducer = (origin) => (mapData) => {
  const divider = 4

  return compose(
    (mapData) => {
      for (let x = 0; x < divider; x++) {
        for (let y = 0; y < divider; y++) {
          setPolygonGroup(`gravity-${x}-${y}`)(mapData)
          plain(
            [
              -origin.coords[0] +
                (MAP_MAX_WIDTH / divider) * 50 +
                (MAP_MAX_WIDTH / divider) * 100 * x,
              origin.coords[1] + 10000,
              -origin.coords[2] +
                (MAP_MAX_HEIGHT / divider) * 50 +
                (MAP_MAX_HEIGHT / divider) * 100 * y,
            ],
            [MAP_MAX_WIDTH / divider, MAP_MAX_HEIGHT / divider],
            'floor',
            disableBumping,
          )(mapData)
          unsetPolygonGroup(mapData)
        }
      }
      return mapData
    },
    setTexture(textures.none),
    setColor('white'),
  )(mapData)
}

const generate = async (config) => {
  const { origin } = config

  const islands = [
    {
      pos: [0, 0, 0],
      entrances: EAST,
      exits: NORTH,
      width: 12,
      height: 10,
    },
    {
      pos: [0, -200, 2500],
      entrances: SOUTH | NORTH,
      exits: EAST,
      width: 10,
      height: 10,
    },
    {
      pos: [3000, -100, 2400],
      entrances: WEST,
      exits: NONE,
      width: 10,
      height: 8,
    },
    {
      pos: [0, -500, 4500],
      entrances: SOUTH,
      exits: NONE,
      width: 6,
      height: 6,
    },
  ]

  const welcomeMarker = createWelcomeMarker(islands[0].pos)(config)
  /*
  createHangingCorpse([-300, -150, -200], [0, 145, 0], {
    name: "[public_falan_tomb]",
  });
  */

  circleOfVectors(islands[2].pos, 200, 9).forEach((pos) => {
    createSmellyFlower(pos)
  })

  defineStatue()
  createStatue(islands[2].pos)

  createFallSaver(islands[0].pos, welcomeMarker)

  return compose(
    saveToDisk,
    finalize,

    bridges(islands),
    addIndex(reduce)(
      (mapData, config, idx) => island({ ...config, idx })(mapData),
      __,
      islands,
    ),

    createFallInducer(origin),

    addZone(
      { type: 'relative', coords: [0, 5000, 0] },
      [MAP_MAX_WIDTH * 100, 1000, MAP_MAX_HEIGHT * 100],
      `fall-detector`,
      ambiences.none,
      0,
      PATH_RGB,
    ),
    setColor(colors.ambience[0]),

    addZone(
      {
        type: 'relative',
        coords: [-origin.coords[0], -origin.coords[1], -origin.coords[2]],
      },
      [100, 0, 100],
      'palette0',
      ambiences.sirs,
      5000,
    ),
    setColor(colors.ambience[0]),

    movePlayerTo({
      type: 'relative',
      coords: [-origin.coords[0], -origin.coords[1], -origin.coords[2]],
    }),
    (mapData) => {
      mapData.meta.mapName = "Alia's Nightmare"
      return mapData
    },
    generateBlankMapData,
  )(config)
}

export default generate
