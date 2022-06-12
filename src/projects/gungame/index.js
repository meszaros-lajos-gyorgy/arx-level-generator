import { ambiences } from '../../assets/ambiences'
import {
  addScript,
  createItem,
  items,
  markAsUsed,
  moveTo,
} from '../../assets/items'
import { textures } from '../../assets/textures'
import { HFLIP, VFLIP } from '../../constants'
import {
  addZone,
  finalize,
  generateBlankMapData,
  movePlayerTo,
  pickRandom,
  saveToDisk,
  setColor,
  setTexture,
} from '../../helpers'
import { plain } from '../../prefabs'
import { disableBumping } from '../../prefabs/plain'
import { getInjections } from '../../scripting'
import { overridePlayerScript } from '../shared/player'
import { hideMinimap } from '../shared/reset'

const createWelcomeMarker = (pos, config) => {
  const ref = createItem(items.marker)

  hideMinimap(config.levelIdx, ref)

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

  moveTo({ type: 'relative', coords: pos }, [0, 0, 0], ref)
  markAsUsed(ref)

  return ref
}

const generate = async (config) => {
  const { origin } = config

  const mapData = generateBlankMapData(config)
  mapData.meta.mapName = 'Gungame'

  overridePlayerScript()

  const welcomeMaker = createWelcomeMarker([0, 0, 0], config)

  movePlayerTo(
    {
      type: 'relative',
      coords: [-origin.coords[0], -origin.coords[1], -origin.coords[2]],
    },
    mapData,
  )
  setColor('#333333', mapData)
  addZone(
    {
      type: 'relative',
      coords: [-origin.coords[0], -origin.coords[1], -origin.coords[2]],
    },
    [100, 0, 100],
    'palette0',
    ambiences.none,
    5000,
  )(mapData)

  setColor('#a7a7a7', mapData)
  setTexture(textures.stone.humanAkbaaPavingF, mapData)

  plain([0, 0, 0], 10, 'floor', disableBumping, () => ({
    quad: pickRandom([0, 1, 2, 3]),
    textureRotation: pickRandom([0, 90, 180, 270]),
    textureFlags: pickRandom([0, HFLIP, VFLIP, HFLIP | VFLIP]),
  }))(mapData)

  const finalizedMapData = finalize(mapData)
  return saveToDisk(finalizedMapData)
}

export default generate
