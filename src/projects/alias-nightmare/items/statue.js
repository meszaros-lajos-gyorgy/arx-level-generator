import {
  addScript,
  createItem,
  items,
  markAsUsed,
  moveTo,
  createRootItem,
  addDependency,
} from '../../../assets/items'
import { getInjections, declare } from '../../../scripting'

export const defineStatue = () => {
  const ref = createRootItem(items.npc.statue, {
    name: '...redacted...',
    speed: 3,
    hp: 1000,
  })

  declare('int', 'idle', 1, ref)
  declare('int', 'idleSoundIdx', 0, ref)

  addScript((self) => {
    return `
// component: statue
ON INIT {
  ${getInjections('init', self)}
  SET_MATERIAL STONE
  SETDETECT 2000

  PHYSICAL RADIUS 30

  SET_NPC_STAT RESISTMAGIC 100
  SET_NPC_STAT RESISTPOISON 100
  SET_NPC_STAT RESISTFIRE 100

  LOADANIM ACTION1 "statue_wait_4"
  LOADANIM WAIT "statue_wait"
  LOADANIM WALK "snake_woman_normal_walk"
  LOADANIM RUN "snake_woman_normal_run"

  BEHAVIOR NONE
  SETTARGET PLAYER

  TWEAK SKIN "FIXINTER_STATUE01" "DEMON_STATUE"

  PLAYANIM WAIT

  TIMERmisc_reflection -i 0 7 SENDEVENT IDLE SELF ""

  SENDEVENT IDLE SELF ""
  SET_EVENT HEAR ON

  ACCEPT
}

ON IDLE {
  INC ${self.state.idleSoundIdx} 1
  IF (${self.state.idleSoundIdx} == 5) {
    SET ${self.state.idleSoundIdx} 1
  }
  
  IF (${self.state.idle} == 0) {
    ACCEPT
  }
  
  IF (${self.state.idleSoundIdx} == 1) {
    PLAY -p "statue_idle1"
  }

  IF (${self.state.idleSoundIdx} == 2) {
    PLAY -p "statue_idle2"
  }
  
  IF (${self.state.idleSoundIdx} == 3) {
    PLAY -p "statue_idle1"
  }
  
  IF (${self.state.idleSoundIdx} == 3) {
    PLAY -p "statue_idle3"
  }

  ACCEPT
}

ON HEAR {
  BEHAVIOR MOVE_TO
  SETTARGET -n ^SENDER
  SETMOVEMODE WALK
  
  IF (${self.state.idle} == 1) {
    SET ${self.state.idle} 0

    IF (${self.state.idleSoundIdx} == 1) {
      PLAY -p "statue_jumpscare1"
    }
    IF (${self.state.idleSoundIdx} == 2) {
      PLAY -p "statue_jumpscare2"
    }
    IF (${self.state.idleSoundIdx} == 3) {
      PLAY -p "statue_jumpscare1"
    }
    IF (${self.state.idleSoundIdx} == 4) {
      PLAY -p "statue_jumpscare2"
    }
  }
  
  ACCEPT
}

ON DETECTPLAYER {
  >>PLAYER_DETECTED
  
  IF (§idleSoundIdx == 1) {
    PLAY -p "statue_jumpscare1"
  }
  IF (§idleSoundIdx == 2) {
    PLAY -p "statue_jumpscare2"
  }
  IF (§idleSoundIdx == 3) {
    PLAY -p "statue_jumpscare1"
  }
  IF (§idleSoundIdx == 4) {
    PLAY -p "statue_jumpscare2"
  }
  
  GOTO ATTACK_PLAYER
  
  ACCEPT
}

ON ATTACK_PLAYER {
  GOTO ATTACK_PLAYER
  ACCEPT
}

>>ATTACK_PLAYER {
  WEAPON ON
  SET_EVENT HEAR OFF
  BEHAVIOR -f MOVE_TO
  SETTARGET PLAYER
  SETMOVEMODE RUN
  
  ACCEPT
}

ON REACHEDTARGET 
{
 IF (^TARGET == PLAYER) 
 {
   DO_DAMAGE ~^SENDER~ 1000
 }
 ACCEPT
}

ON MOVE {
  SETMOVEMODE WALK
  ACCEPT
}

ON LOSTTARGET {
  GOTO LOOK_FOR
  ACCEPT
}

ON LOOK_FOR {
  GOTO LOOK_FOR
  ACCEPT
}

ON UNDETECTPLAYER {
  GOTO LOOK_FOR
  ACCEPT
}

>>LOOK_FOR {
  IF (^DIST_PLAYER < 500) GOTO PLAYER_DETECTED
 
  BEHAVIOR LOOK_FOR 500
  SETTARGET PLAYER
  SETMOVEMODE WALK

  SET_EVENT HEAR ON
  
  TIMERhome 1 18 GOTO GO_HOME

  ACCEPT
}

>>GO_HOME {
  BEHAVIOR NONE
  SETTARGET PLAYER

  SET §idle 1

  ACCEPT
}

ON COLLIDE_NPC {
  IF (^SENDER == PLAYER) {
    DO_DAMAGE ~^SENDER~ 1000
  }
  ACCEPT
}
      `
  }, ref)
  addDependency('sfx/statue_idle1.wav', ref)
  addDependency('sfx/statue_idle2.wav', ref)
  addDependency('sfx/statue_idle3.wav', ref)
  addDependency('sfx/statue_jumpscare1.wav', ref)
  addDependency('sfx/statue_jumpscare2.wav', ref)
  addDependency('sfx/statue_no.wav', ref)

  return ref
}

export const createStatue = (pos, angle = [0, 0, 0], props = {}) => {
  const ref = createItem(items.npc.statue, props)

  addScript((self) => {
    return `
// component: statue
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}
    `
  }, ref)

  moveTo({ type: 'relative', coords: pos }, angle, ref)
  markAsUsed(ref)

  return ref
}
