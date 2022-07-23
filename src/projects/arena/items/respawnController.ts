import {
  addScript,
  createItem,
  items,
  moveTo,
  markAsUsed,
  ItemRef,
} from '../../../assets/items'
import { declare, FALSE, getInjections, TRUE } from '../../../scripting'
import { Vector3 } from '../../../types'

const SPAWN_PROTECT_TIME = 3000

// this has to be <= 7000 otherwise the player will fade out to the main menu after dying
// TODO: find a way to fake player's death animation without triggering the fadeout (immediately respawn him)
const DEATHCAM_TIME = 5000

export const createRespawnController = (pos: Vector3, gameCtrl: ItemRef) => {
  const ref = createItem(items.marker, {})

  declare('bool', 'ignoreNextKillEvent', FALSE, ref)

  addScript((self) => {
    return `
// component: respawnController
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}

ON KILLED {
  SET £victimID ^$param1
  SET £killerID ^$param2

  HEROSAY "victim '~£victimID~' got killed by killer '~£killerID~'"

  IF (£victimID == "player") {
    IF (${ref.state.ignoreNextKillEvent} == ${TRUE}) {
      SET ${ref.state.ignoreNextKillEvent} ${FALSE}
    } ELSE {
      sendevent died gameCtrl "~£victimID~ ~£killerID~"
      TIMERrespawn -m 1 ${DEATHCAM_TIME} GOTO RESURRECT
    }
  } ELSE {
    // TODO: need some sort of queue here for the targets
    sendevent died gameCtrl "~£victimID~ ~£killerID~"
    TIMERrespawn -m 1 ${DEATHCAM_TIME} sendevent respawn £victimID nop
    TIMERspawnprotectOff -m 1 ${
      DEATHCAM_TIME + SPAWN_PROTECT_TIME
    } sendevent spawn_protect_off £victimID nop
  }
  ACCEPT
}

>>RESURRECT {
  gosub respawn
  gosub spawn_protect_on
  TIMERspawnprotectOff -m 1 ${SPAWN_PROTECT_TIME} goto spawn_protect_off
  ACCEPT
}

>>RESPAWN {
  setplayercontrols on specialfx heal 1
  SET ${ref.state.ignoreNextKillEvent} ${TRUE}
  dodamage player 1
  setplayercontrols on specialfx heal ^player_maxlife
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
  ACCEPT
}
    `
  }, ref)

  moveTo({ type: 'relative', coords: pos }, [0, 0, 0], ref)

  markAsUsed(ref)

  return ref
}
