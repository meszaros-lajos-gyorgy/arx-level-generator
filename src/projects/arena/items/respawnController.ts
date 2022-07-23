import {
  addScript,
  createItem,
  items,
  moveTo,
  markAsUsed,
  ItemRef,
} from '../../../assets/items'
import {
  declare,
  FALSE,
  getInjections,
  SCRIPT_EOL,
  TRUE,
} from '../../../scripting'
import { Vector3 } from '../../../types'

const SPAWN_PROTECT_TIME = 3000

// this has to be <= 7000 otherwise the player will fade out to the main menu after dying
// TODO: find a way to fake player's death animation without triggering the fadeout (immediately respawn him)
const DEATHCAM_TIME = 5000

export const createRespawnController = (
  pos: Vector3,
  numberOfBots: number,
  gameCtrl: ItemRef,
) => {
  const ref = createItem(items.marker, {})

  declare('bool', 'ignoreNextKillEvent', FALSE, ref)
  declare('int', 'respawnTimerCntr', 1, ref)
  declare('int', 'spawnProtectTimerCntr', 1, ref)

  declare('int', 'respawnQueueSize', 0, ref)
  for (let i = 1; i <= numberOfBots; i++) {
    declare('string', `respawnQueueItem${i}`, '', ref)
  }

  declare('int', 'spawnProtectQueueSize', 0, ref)
  for (let i = 1; i <= numberOfBots; i++) {
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
    ${[...Array(numberOfBots).keys()]
      .map((i) => {
        return `
    IF (${self.state.respawnTimerCntr} == ${i + 1}) {
      TIMERrespawnNpc${i + 1} -m 1 ${DEATHCAM_TIME} GOTO RESURRECT_NPC
    }`
      })
      .join('')}

    INC ${self.state.respawnTimerCntr} 1
    IF (${self.state.respawnTimerCntr} == ${numberOfBots + 1}) {
      SET ${self.state.respawnTimerCntr} 1
    }
  }

  ACCEPT
}

>>RESURRECT_NPC {
  if (${self.state.respawnQueueSize} > 0) {
    HEROSAY "resurrect npc"
    sendevent respawn £respawnQueueItem1 nop

    INC ${self.state.spawnProtectQueueSize} 1
    SET "£spawnProtectQueueItem~${
      self.state.spawnProtectQueueSize
    }~" £respawnQueueItem1

    // move respawn queue to the left
${[...Array(numberOfBots).keys()]
  .map((i) => {
    if (i === numberOfBots - 1) {
      return `    SET £respawnQueueItem${i + 1} ""`
    } else {
      return `    SET £respawnQueueItem${i + 1} £respawnQueueItem${i + 2}`
    }
  })
  .join(SCRIPT_EOL)}

    DEC ${self.state.respawnQueueSize} 1
    ${[...Array(numberOfBots).keys()]
      .map((i) => {
        return `
    IF (${self.state.spawnProtectTimerCntr} == ${i + 1}) {
      TIMERspawnProtectOffNpc${
        i + 1
      } -m 1 ${SPAWN_PROTECT_TIME} GOTO SPAWN_PROTECT_OFF_NPC
    }`
      })
      .join('')}
    
    INC ${self.state.spawnProtectTimerCntr} 1
    IF (${self.state.spawnProtectTimerCntr} == ${numberOfBots + 1}) {
      SET ${self.state.spawnProtectTimerCntr} 1
    }
  }

  ACCEPT
}

>>SPAWN_PROTECT_OFF_NPC {
  if (${self.state.spawnProtectQueueSize} > 0) {
    HEROSAY -d "spawn protect off npc ~${self.state.spawnProtectQueueSize}~"
    sendevent spawn_protect_off £spawnProtectQueueItem1 nop

  // move spawn protection queue to the left
${[...Array(numberOfBots).keys()]
  .map((i) => {
    if (i === numberOfBots - 1) {
      return `    SET £spawnProtectQueueItem${i + 1} ""`
    } else {
      return `    SET £spawnProtectQueueItem${i + 1} £spawnProtectQueueItem${
        i + 2
      }`
    }
  })
  .join(SCRIPT_EOL)}

    DEC ${self.state.spawnProtectQueueSize} 1
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
