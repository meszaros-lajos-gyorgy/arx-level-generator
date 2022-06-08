import {
  addScript,
  createItem,
  markAsUsed,
  moveTo,
  createRootItem,
} from '../../../assets/items'
import { useTexture, textures } from '../../../assets/textures'
import { declare, getInjections } from '../../../scripting'

const itemDesc = {
  src: 'fix_inter/wall_plug/wall_plug.teo',
  native: true,
}

export const defineWallPlug = () => {
  useTexture(textures.backrooms.socket.clean)
  useTexture(textures.backrooms.socket.broken)
  useTexture(textures.backrooms.socket.old)

  declare('int', 'wallPlugHasPower', 1, 'global')

  const ref = createRootItem(itemDesc, {
    name: '[item--wallplug]',
    interactive: true,
    scale: 0.2,
    mesh: 'polytrans/polytrans.teo',
  })

  addScript((self) => {
    return `
// component: wallPlug
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}

ON INITEND {
  ${getInjections('initend', self)}
  TWEAK SKIN "[stone]_ground_caves_wet05" "socket-clean"
  ACCEPT
}
`
  }, ref)

  return ref
}

export const createWallPlug = (
  pos,
  angle = [0, 0, 0],
  config = {},
  jumpscareCtrl,
) => {
  const variant = config.variant ?? 'clean'
  const ref = createItem(itemDesc, {
    name:
      variant === 'old'
        ? '[item--wallplug-old]'
        : variant === 'broken'
        ? '[item--wallplug-broken]'
        : '[item--wallplug]',
    ...config,
  })

  declare('string', 'variant', variant, ref)

  addScript((self) => {
    return `
// component: wallPlug
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}

ON INITEND {
  ${getInjections('initend', self)}
  IF (${ref.state.variant} == "clean") {
    TWEAK SKIN "[stone]_ground_caves_wet05" "socket-clean"
  }
  IF (${ref.state.variant} == "old") {
    TWEAK SKIN "[stone]_ground_caves_wet05" "socket-old"
  }
  IF (${ref.state.variant} == "broken") {
    TWEAK SKIN "[stone]_ground_caves_wet05" "socket-broken"
  }
  ACCEPT
}

ON COMBINE {
  IF (#wallPlugHasPower == 0) {
    ACCEPT
  }

  IF ("key_" isin ^CLASS_~^$PARAM1~) {
    IF (${ref.state.variant} == "broken") {
      IF (^RND_100 < 70) {
        PLAY -p "sfx_spark"
        GOSUB ELECTROCUTE
        IF (^RND_100 < 30) {
          GOSUB SHUTDOWN
        }
      } ELSE {
        PLAY -p "thief_bag"
      }
    }
    IF (${ref.state.variant} == "old") {
      IF (^RND_100 < 30) {
        PLAY -p "sfx_spark"
        GOSUB ELECTROCUTE
        IF (^RND_100 < 30) {
          GOSUB SHUTDOWN
        }
      } ELSE {
        PLAY -p "thief_bag"
      }
    }
    IF (${ref.state.variant} == "old") {
      PLAY -p "thief_bag"
    }
  }
  ACCEPT
}

>>ELECTROCUTE {
  QUAKE 300 500 10
  SPEAK -p "player_ouch_medium"
  PLAY "player_heartb"
  RETURN
}

>>SHUTDOWN {
  SET #wallPlugHasPower 0
  SENDEVENT POWEROUT ${jumpscareCtrl.ref} NOP
  RETURN
}
    `
  }, ref)

  moveTo({ type: 'relative', coords: pos }, angle, ref)
  markAsUsed(ref)

  return ref
}
