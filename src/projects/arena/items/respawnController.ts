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
  declare('int', 'respawnTimerCntr', 0, ref)
  declare('int', 'spawnProtectTimerCntr', 0, ref)

  declare('int', 'respawnQueueSize', 0, ref)
  for (let i = 1; i <= 8; i++) {
    declare('string', `respawnQueueItem${i}`, '', ref)
  }

  declare('int', 'spawnProtectQueueSize', 0, ref)
  for (let i = 1; i <= 8; i++) {
    declare('string', `spawnProtectQueueItem${i}`, '', ref)
  }

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

  IF (£victimID == "player") {
    IF (${ref.state.ignoreNextKillEvent} == ${TRUE}) {
      SET ${ref.state.ignoreNextKillEvent} ${FALSE}
    } ELSE {
      sendevent died gameCtrl "~£victimID~ ~£killerID~"
      TIMERrespawn -m 1 ${DEATHCAM_TIME} GOTO RESURRECT
    }
  } ELSE {
    sendevent died gameCtrl "~£victimID~ ~£killerID~"
    
    INC ${self.state.respawnQueueSize} 1
    SET "£respawnQueueItem~${self.state.respawnQueueSize}~" £victimID

    INC ${self.state.respawnTimerCntr} 1
    IF (${self.state.respawnTimerCntr} == 9) {
      SET ${self.state.respawnTimerCntr} 1
    }

    ${[1, 2, 3, 4, 5, 6, 7, 8]
      .map((i) => {
        return `
    IF (${self.state.respawnTimerCntr} == ${i}) {
      TIMERrespawnNpc${i} -m 1 ${DEATHCAM_TIME} GOTO RESURRECT_NPC
    }`
      })
      .join('')}
  }

  ACCEPT
}

>>RESURRECT_NPC {
  sendevent respawn £respawnQueueItem1 nop

  INC ${self.state.spawnProtectQueueSize} 1
  SET "£spawnProtectQueueItem~${
    self.state.spawnProtectQueueSize
  }~" £respawnQueueItem1

  // move respawn queue to the left
  SET £respawnQueueItem1 £respawnQueueItem2
  SET £respawnQueueItem2 £respawnQueueItem3
  SET £respawnQueueItem3 £respawnQueueItem4
  SET £respawnQueueItem4 £respawnQueueItem5
  SET £respawnQueueItem5 £respawnQueueItem6
  SET £respawnQueueItem6 £respawnQueueItem7
  SET £respawnQueueItem7 £respawnQueueItem8
  SET £respawnQueueItem8 ""

  DEC ${self.state.respawnQueueSize} 1

  INC ${self.state.spawnProtectTimerCntr} 1
  IF (${self.state.spawnProtectTimerCntr} == 9) {
    SET ${self.state.spawnProtectTimerCntr} 1
  }

  ${[1, 2, 3, 4, 5, 6, 7, 8]
    .map((i) => {
      return `
  IF (${self.state.spawnProtectTimerCntr} == ${i}) {
    TIMERspawnProtectOffNpc${i} -m 1 ${SPAWN_PROTECT_TIME} GOTO SPAWN_PROTECT_OFF_NPC
  }`
    })
    .join('')}

  ACCEPT
}

>>SPAWN_PROTECT_OFF_NPC {
  sendevent spawn_protect_off £spawnProtectQueueItem1 nop

  // move spawn protection queue to the left
  SET £spawnProtectQueueItem1 £spawnProtectQueueItem2
  SET £spawnProtectQueueItem2 £spawnProtectQueueItem3
  SET £spawnProtectQueueItem3 £spawnProtectQueueItem4
  SET £spawnProtectQueueItem4 £spawnProtectQueueItem5
  SET £spawnProtectQueueItem5 £spawnProtectQueueItem6
  SET £spawnProtectQueueItem6 £spawnProtectQueueItem7
  SET £spawnProtectQueueItem7 £spawnProtectQueueItem8
  SET £spawnProtectQueueItem8 ""
  
  DEC ${self.state.spawnProtectQueueSize} 1

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
