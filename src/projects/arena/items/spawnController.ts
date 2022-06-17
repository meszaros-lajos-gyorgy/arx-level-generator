import {
  addScript,
  createItem,
  items,
  moveTo,
  markAsUsed,
} from '../../../assets/items'
import { getInjections } from '../../../scripting'
import { Vector3 } from '../../../types'

export const createSpawnController = (pos: Vector3) => {
  const ref = createItem(items.marker, {})

  addScript((self) => {
    return `
// component: spawnController
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}

ON KILLED {
  IF (^$PARAM1 == "player") {
    TIMERrespawn -m 1 5000 GOSUB RESURRECT
  }
  ACCEPT
}

>>RESURRECT {
  gosub respawn
  gosub spawn_protect_on
  TIMERspawnprotectoff -m 1 5000 gosub spawn_protect_off
  return
}
>>RESPAWN {
  setplayercontrols on specialfx heal ^player_maxlife
  // TODO: the player remains in darkened state
  RETURN
}
>>SPAWN_PROTECT_ON {
  sendevent glow player on
  invulnerability -p on
  RETURN
}
>>SPAWN_PROTECT_OFF {
  sendevent glow player off
  invulnerability -p off
  RETURN
}
    `
  }, ref)

  moveTo({ type: 'relative', coords: pos }, [0, 0, 0], ref)

  markAsUsed(ref)

  return ref
}
