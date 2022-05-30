import {
  addScript,
  createItem,
  markAsUsed,
  moveTo,
  createRootItem,
  addDependencyAs,
} from '../../../assets/items'
import { useTexture, textures } from '../../../assets/textures'
import { getInjections, declare } from '../../../scripting'

const itemDesc = {
  src: 'fix_inter/ceiling_lamp/ceiling_lamp.teo',
  native: true,
}

export const defineCeilingLamp = () => {
  useTexture(textures.backrooms.ceilingLampOn)
  useTexture(textures.backrooms.ceilingLampOff)

  const ref = createRootItem(itemDesc, {
    name: 'Ceiling Lamp',
    interactive: false,
    mesh: 'polytrans/polytrans.teo',
  })

  declare('int', 'isOn', 0, ref)
  declare('int', 'oldIsOn', -1, ref)
  declare('int', 'savedIsOn', -1, ref)
  declare('int', 'muted', 0, ref)
  declare('int', 'oldMuted', -1, ref)
  declare('int', 'instantSwitching', 0, ref)

  addDependencyAs(
    'projects/the-backrooms/sfx/fluorescent-lamp-plink.wav',
    'sfx/fluorescent-lamp-plink.wav',
    ref,
  )
  addDependencyAs(
    'projects/the-backrooms/sfx/fluorescent-lamp-startup.wav',
    'sfx/fluorescent-lamp-startup.wav',
    ref,
  )
  addDependencyAs(
    'projects/the-backrooms/sfx/fluorescent-lamp-hum.wav',
    'sfx/fluorescent-lamp-hum.wav',
    ref,
  )
  addDependencyAs(
    'projects/the-backrooms/sfx/glass-pop-1.wav',
    'sfx/glass-pop-1.wav',
    ref,
  )
  addDependencyAs(
    'projects/the-backrooms/sfx/glass-pop-2.wav',
    'sfx/glass-pop-2.wav',
    ref,
  )
  addDependencyAs(
    'projects/the-backrooms/sfx/glass-pop-3.wav',
    'sfx/glass-pop-3.wav',
    ref,
  )

  addScript((self) => {
    return `
// component: ceilingLamp
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}

ON INITEND {
  SET ${self.state.oldIsOn} ${self.state.isOn}

  if (${self.state.isOn} == 1) {
    TWEAK SKIN "[stone]_ground_caves_wet05" "backrooms-[metal]-light-on"
    if (${self.state.muted} == 0) {
      PLAY -lip "fluorescent-lamp-hum" // [l] = loop, [i] = unique, [p] = variable pitch
    }
  } else {
    TWEAK SKIN "[stone]_ground_caves_wet05" "backrooms-[metal]-light-off"
  }

  ACCEPT
}

ON ON {
  SET ${self.state.isOn} 1
  if (^$PARAM1 == "instant") {
    SET ${self.state.instantSwitching} 1
  } else {
    SET ${self.state.instantSwitching} 0
  }
  GOTO SWITCH
  ACCEPT
}

ON OFF {
  SET ${self.state.isOn} 0
  if (^$PARAM1 == "instant") {
    SET ${self.state.instantSwitching} 1
  } else {
    SET ${self.state.instantSwitching} 0
  }
  GOTO SWITCH
  ACCEPT
}

ON SAVE {
  SET ${self.state.savedIsOn} ${self.state.isOn}
  ACCEPT
}

ON RESTORE {
  SET ${self.state.isOn} ${self.state.savedIsOn}
  GOTO SWITCH
  ACCEPT
}

ON RANDOM {
  IF (^RND_100 > 50) {
    SET ${self.state.isOn} 1
  } ELSE {
    SET ${self.state.isOn} 0
  }
  if (^$PARAM1 == "instant") {
    SET ${self.state.instantSwitching} 1
  } else {
    SET ${self.state.instantSwitching} 0
  }
  GOTO SWITCH
  ACCEPT
}

ON HIT {
  IF (^$PARAM2 == "spell") {
    IF (lightning_strike isin ^$PARAM3) {
      SENDEVENT ON SELF ""
    }
    IF (douse isin ^$PARAM3) {
      SENDEVENT OFF SELF ""
    }
  }
  REFUSE
}

>>SWITCH {
  if (${self.state.isOn} == ${self.state.oldIsOn}) {
    ACCEPT
  }

  SET ${self.state.oldIsOn} ${self.state.isOn}

  if (${self.state.isOn} == 1) {
    if (${self.state.instantSwitching} == 1) {
      SET #ANIM 0
    } else {
      SET #ANIM ^RND_5
      DEC #ANIM 1
      MUL #ANIM 120
    }
    SET #ANIM2 #ANIM1
    INC #ANIM2 500
    TIMERonStart -m 1 #ANIM GOSUB TURN_ON_START
    TIMERonEnd -m 1 #ANIM2 GOSUB TURN_ON_END
  } else {
    if (${self.state.instantSwitching} == 1) {
      SET #ANIM 0
    } else {
      SET #ANIM ^RND_5
      DEC #ANIM 1
      MUL #ANIM 120
    }
    SET #ANIM2 #ANIM1
    INC #ANIM2 500
    TIMERoffStart -m 1 #ANIM GOSUB TURN_OFF_START
    TIMERoffEnd -m 1 #ANIM2 GOSUB TURN_OFF_END
  }

  ACCEPT
}

>>TURN_ON_START {
  SPELLCAST -smfx 1 IGNIT self // [s] = no anim, [m] = no draw, [f] = no mana required, [x] = no sound
  if (${self.state.muted} == 0) {
    PLAY "fluorescent-lamp-startup"
  }
  RETURN
}

>>TURN_ON_END {
  TWEAK SKIN "[stone]_ground_caves_wet05" "backrooms-[metal]-light-on"
  if (${self.state.muted} == 0) {
    PLAY -lip "fluorescent-lamp-hum" // [l] = loop, [i] = unique, [p] = variable pitch
    PLAY "fluorescent-lamp-plink"
  }
  RETURN
}

>>TURN_OFF_START {
  SPELLCAST -smfx 1 DOUSE self
  RETURN
}

>>TURN_OFF_END {
  TWEAK SKIN "[stone]_ground_caves_wet05" "backrooms-[metal]-light-off"
  if (${self.state.muted} == 0) {
    PLAY -s "fluorescent-lamp-hum" // [s] = stop (only if unique)
    SET #TMP ^RND_100
    IF (#TMP < 33) {
      PLAY "glass-pop-1"
    } ELSE IF (#TMP < 66) {
      PLAY "glass-pop-2"
    } ELSE {
      PLAY "glass-pop-3"
    }
  }
  RETURN
}

ON MUTE {
  SET ${self.state.muted} 1
  GOTO VOLUME
  ACCEPT
}

ON UNMUTE {
  SET ${self.state.muted} 0
  GOTO VOLUME
  ACCEPT
}

>>VOLUME {
  if (${self.state.muted} == ${self.state.oldMuted}) {
    ACCEPT
  }

  SET ${self.state.oldMuted} ${self.state.muted}

  IF (${self.state.muted} == 1) {
    GOSUB MUTE
  } ELSE {
    GOSUB UNMUTE
  }

  ACCEPT
}

>>MUTE {
  PLAY -s "fluorescent-lamp-hum"
  PLAY -s "fluorescent-lamp-startup"
  PLAY -s "fluorescent-lamp-plink"

  RETURN
}

>>UNMUTE {
  IF (${self.state.isOn} == 1) {
    PLAY -lip "fluorescent-lamp-hum" // [l] = loop, [i] = unique, [p] = variable pitch
  }

  RETURN
}
      `
  }, ref)

  return ref
}

export const createCeilingLamp = (pos, angle = [0, 0, 0], config = {}) => {
  const ref = createItem(itemDesc, {})

  declare('int', 'muted', config.muted ?? false ? 1 : 0, ref)
  declare('int', 'isOn', config.on ?? false ? 1 : 0, ref)

  addScript((self) => {
    return `
// component: ceilingLamp
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
