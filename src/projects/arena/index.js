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
  addLight,
  addZone,
  circleOfVectors,
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
import { declare, getInjections } from '../../scripting'
import { overridePlayerScript } from '../shared/player'
import { hideMinimap } from '../shared/reset'
import { createSpawnController } from './items/spawnController'

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

const createNPC = (pos, angle, config) => {
  const type = config.type ?? 'ct'
  const variant = config.variant ?? 1

  const ref = createItem(items.npc.human, {
    ...(type === 't' ? { mesh: 'human_priest/human_priest.teo' } : {}),
  })

  if (type === 'ct') {
    switch (variant) {
      case 1:
        declare('string', 'type', 'human_guard_kingdom', ref)
        declare('string', 'voice', '_vc', ref)
        break
      case 2:
        declare('string', 'type', 'human_guard_ss', ref)
        declare('string', 'voice', '_vb', ref)
        break
    }
  } else {
    switch (variant) {
      case 1:
        declare('string', 'type', 'human_priest_base', ref)
        break
      case 2:
        declare('string', 'type', 'human_priest_high', ref)
    }
  }

  addScript((self) => {
    return `
// component: NPC
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}
ON INITEND {
  ${getInjections('initend', self)}
  ${
    type === 't' && variant === 2
      ? `
  TWEAK SKIN "npc_human_priest_akbaa_body""npc_Human_priest_fcult_body"
  TWEAK SKIN "npc_human_priest_akbaa_head""npc_Human_priest_fcult_head"
  `
      : ``
  }
  ACCEPT
}
    `
  }, ref)

  moveTo({ type: 'relative', coords: pos }, angle, ref)
  markAsUsed(ref)
  return ref
}

const generate = async (config) => {
  const { origin } = config

  const mapData = generateBlankMapData(config)
  mapData.meta.mapName = 'Arena'

  const welcomeMaker = createWelcomeMarker([0, 0, 0], config)
  const spawnCtrl = createSpawnController([10, 0, 10])

  overridePlayerScript({
    __injections: {
      die: [`sendevent killed ${spawnCtrl.ref} "player"`],
    },
  })

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

  plain([0, 0, 0], 20, 'floor', disableBumping, () => ({
    quad: pickRandom([0, 1, 2, 3]),
    textureRotation: pickRandom([0, 90, 180, 270]),
    textureFlags: pickRandom([0, HFLIP, VFLIP, HFLIP | VFLIP]),
  }))(mapData)

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

  createNPC([300, 0, -100], [0, 90, 0], { type: 'ct', variant: 1 })
  createNPC([300, 0, 100], [0, 90, 0], { type: 'ct', variant: 2 })
  createNPC([-300, 0, 100], [0, 270, 0], { type: 't', variant: 1 })
  createNPC([-300, 0, -100], [0, 270, 0], { type: 't', variant: 2 })

  const finalizedMapData = finalize(mapData)
  return saveToDisk(finalizedMapData)
}

export default generate
