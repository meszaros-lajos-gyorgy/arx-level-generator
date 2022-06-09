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
  IF ("key_" isin ^CLASS_~^$PARAM1~) {
    GOSUB TOUCH_POWER
    GOSUB SHUTDOWN
  }

  ACCEPT
}

ON ACTION {
  GOSUB TOUCH_POWER
  ACCEPT
}

>>TOUCH_POWER {
  IF (#powerOn == 0) {
    RETURN
  }

  IF (${ref.state.variant} == "old") {
    IF (^RND_100 < 50) {
      GOSUB ELECTROCUTE
      RETURN
    }
  }

  IF (${ref.state.variant} == "broken") {
    GOSUB ELECTROCUTE
    RETURN
  }

  PLAY -p "thief_bag"

  RETURN
}

>>ELECTROCUTE {
  DODAMAGE -n player ^player_mana
  PLAY -p "sfx_spark"
  QUAKE 300 500 10
  SPEAK -op "player_ouch_medium"
  PLAY -oil "player_heartb"
  TIMERstopheartbeat -m 1 1700 PLAY -s "player_heartb"
  RETURN
}

>>SHUTDOWN {
  SENDEVENT POWEROUT ${jumpscareCtrl.ref} NOP
  TIMERsmalldelay -m 1 200 SET #powerOn 0
  RETURN
}
    `
  }, ref)

  moveTo({ type: 'relative', coords: pos }, angle, ref)
  markAsUsed(ref)

  return ref
}
