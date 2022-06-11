/**
 * The Backrooms
 *
 * Issues to be reported/discussed:
 *   -x flag a spellcast-nál nem némítja el a douse-ot, meg az ignite-ot
 *   a light-oknak lehet extra flag-eknél NO_IGNIT-et megadni, de nincs NO_DOUSE
 *   nem lehet level 0-nál lightningbolt-ot ellőni: https://github.com/arx/ArxLibertatis/blob/master/src/game/Spells.cpp#L742
 *
 * Neon light sound effects: https://www.youtube.com/watch?v=UKoktRXJZLM (Peter Seeba)
 * Glass popping sound effects: https://www.youtube.com/watch?v=6nKbpLUpqiQ (SOUND EFFECT EN & FR)
 */

import {
  generateBlankMapData,
  finalize,
  saveToDisk,
  setColor,
  movePlayerTo,
  addLight,
  move,
  randomBetween,
  pickRandoms,
  toRgba,
  toFloatRgb,
  addZone,
  pickRandomLoot,
  sortByDistance,
  pickRandomIdx,
} from '../../helpers'
import { defineCeilingLamp, createCeilingLamp } from './items/ceilingLamp'
import {
  EXTRAS_SEMIDYNAMIC,
  EXTRAS_EXTINGUISHABLE,
  EXTRAS_STARTEXTINGUISHED,
  EXTRAS_NO_IGNIT,
} from '../../constants'
import {
  markAsUsed,
  moveTo,
  addScript,
  createItem,
  items,
  addDependencyAs,
} from '../../assets/items'
import { getInjections, declare, color } from '../../scripting'
import {
  generateGrid,
  addRoom,
  getRadius,
  isOccupied,
  renderGrid,
} from './rooms'
import {
  defineCeilingDiffuser,
  createCeilingDiffuser,
} from './items/ceilingDiffuser'
import { overridePlayerScript } from '../shared/player'
import { createLampController } from './items/lampController'
import { ambiences } from '../../assets/ambiences'
import { UNIT, COLORS } from './constants'
import { createRune } from '../../items/createRune'
import { addTranslations } from '../../assets/i18n'
import translations from './i18n.json'
import { defineWallPlug, createWallPlug } from './items/wallPlug'
import {
  hideHealthbar,
  hideMinimap,
  hideStealthIndicator,
  removeSound,
  useWillowModifiedFont,
} from '../shared/reset'

const addLamp = (pos, angle, config = {}) => {
  return (mapData) => {
    const isOn = config.on ?? false
    const lampEntity = createCeilingLamp(pos, angle, { on: isOn })

    const size = 2

    setColor('white', mapData)
    addLight(
      move(0, 20, 0, pos),
      {
        fallstart: 100,
        fallend: 500 * size,
        intensity: 1.3 - size * 0.1,
        exFlicker: toFloatRgb(toRgba('#1f1f07')),
        extras:
          EXTRAS_SEMIDYNAMIC |
          EXTRAS_EXTINGUISHABLE |
          (isOn ? 0 : EXTRAS_STARTEXTINGUISHED) |
          EXTRAS_NO_IGNIT,
      },
      mapData,
    )

    return lampEntity
  }
}

const addAmbientLight = (pos, config = {}) => {
  return (mapData) => {
    const isOn = config.on ?? false
    const lightColor = config.color ?? 'red'
    const radius = config.radius ?? 10000

    const lightConfig = {
      fallstart: 0,
      fallend: 100000,
      intensity: 1,
      extras:
        EXTRAS_SEMIDYNAMIC |
        EXTRAS_EXTINGUISHABLE |
        (isOn ? 0 : EXTRAS_STARTEXTINGUISHED) |
        EXTRAS_NO_IGNIT,
    }

    const lampEntities = {
      floor: createCeilingLamp(move(0, -radius, 0, pos), [0, 0, 0], {
        on: isOn,
        muted: true,
      }),
      ceiling: createCeilingLamp(move(0, radius, 0, pos), [0, 0, 0], {
        on: isOn,
        muted: true,
      }),
      right: createCeilingLamp(move(-radius, 0, 0, pos), [0, 0, 0], {
        on: isOn,
        muted: true,
      }),
      left: createCeilingLamp(move(radius, 0, 0, pos), [0, 0, 0], {
        on: isOn,
        muted: true,
      }),
      front: createCeilingLamp(move(0, 0, -radius, pos), [0, 0, 0], {
        on: isOn,
        muted: true,
      }),
      back: createCeilingLamp(move(0, 0, radius, pos), [0, 0, 0], {
        on: isOn,
        muted: true,
      }),
    }

    setColor(lightColor, mapData)
    addLight(move(0, 20, radius, pos), lightConfig, mapData)
    addLight(move(0, 20, -radius, pos), lightConfig, mapData)
    addLight(move(radius, 20, 0, pos), lightConfig, mapData)
    addLight(move(-radius, 20, 0, pos), lightConfig, mapData)
    addLight(move(0, radius + 20, 0, pos), lightConfig, mapData)
    addLight(move(0, -radius + 20, 0, pos), lightConfig, mapData)

    return lampEntities
  }
}

const createWelcomeMarker = (pos, config) => {
  const ref = createItem(items.marker)

  hideMinimap(config.levelIdx, ref)
  hideHealthbar(ref)
  hideStealthIndicator(ref)

  removeSound('sfx/magic_spell_ignite.wav', ref)
  removeSound('sfx/magic_spell_douse.wav', ref)
  removeSound('sfx/player_level_up.wav', ref)

  useWillowModifiedFont(ref)

  addDependencyAs('projects/the-backrooms/graph/**/*.{jpg,bmp}', 'graph', ref)

  addDependencyAs(
    'projects/the-backrooms/loading.bmp',
    `graph/levels/level${config.levelIdx}/loading.bmp`,
    ref,
  )

  declare('int', 'hasAam', 0, ref)
  declare('int', 'hasFolgora', 0, ref)
  declare('int', 'hasTaar', 0, ref)

  addScript((self) => {
    return `
// component: welcomeMarker
ON INIT {
  ${getInjections('init', self)}

  SETCONTROLLEDZONE palette0

  ADDXP 2000 // can't cast lightning bolt at level 0

  TIMERwelcome -m 1 2000 GOSUB WELCOME_MESSAGE

  ACCEPT
}

ON CONTROLLEDZONE_ENTER {
  TELEPORT -p ${self.ref}
  ACCEPT
}

ON GOT_RUNE {
  IF (^$PARAM1 == "aam") {
    SET ${self.state.hasAam} 1
  }
  IF (^$PARAM1 == "folgora") {
    SET ${self.state.hasFolgora} 1
  }
  IF (^$PARAM1 == "taar") {
    SET ${self.state.hasTaar} 1
  }

  IF (${self.state.hasAam} == 1) {
    IF (${self.state.hasFolgora} == 1) {
      IF (${self.state.hasTaar} == 1) {
        GOSUB TUTORIAL_LIGHT
      }
    }
  }

  ACCEPT
}

>>WELCOME_MESSAGE {
  PLAY -o "system"
  HEROSAY [tutorial--welcome]
  QUEST [tutorial--welcome]
  RETURN
}

>>TUTORIAL_LIGHT {
  PLAY -o "system"
  HEROSAY [tutorial--lighting]
  QUEST [tutorial--lighting]
  RETURN
}
    `
  }, ref)

  moveTo({ type: 'relative', coords: pos }, [0, 0, 0], ref)
  markAsUsed(ref)
  return ref
}

const createJumpscareController = (pos, lampCtrl, ambientLights, config) => {
  const ref = createItem(items.marker)

  addDependencyAs(
    'projects/the-backrooms/whispers/english/do-you-smell-it.wav',
    'speech/english/whisper--do-you-smell-it.wav',
    ref,
  )
  addDependencyAs(
    'projects/the-backrooms/whispers/german/do-you-smell-it.wav',
    'speech/deutsch/whisper--do-you-smell-it.wav',
    ref,
  )
  addDependencyAs(
    'projects/the-backrooms/whispers/english/drink-it.wav',
    'speech/english/whisper--drink-it.wav',
    ref,
  )
  addDependencyAs(
    'projects/the-backrooms/whispers/german/drink-it.wav',
    'speech/deutsch/whisper--drink-it.wav',
    ref,
  )
  addDependencyAs(
    'projects/the-backrooms/whispers/english/drink-the-almond-water.wav',
    'speech/english/whisper--drink-the-almond-water.wav',
    ref,
  )
  addDependencyAs(
    'projects/the-backrooms/whispers/german/drink-the-almond-water.wav',
    'speech/deutsch/whisper--drink-the-almond-water.wav',
    ref,
  )
  addDependencyAs(
    'projects/the-backrooms/whispers/english/magic-wont-save-you.wav',
    'speech/english/whisper--magic-wont-save-you.wav',
    ref,
  )
  addDependencyAs(
    'projects/the-backrooms/whispers/german/magic-wont-save-you.wav',
    'speech/deutsch/whisper--magic-wont-save-you.wav',
    ref,
  )
  addDependencyAs(
    'projects/the-backrooms/whispers/english/no-exit.wav',
    'speech/english/whisper--no-exit.wav',
    ref,
  )
  addDependencyAs(
    'projects/the-backrooms/whispers/german/no-exit.wav',
    'speech/deutsch/whisper--no-exit.wav',
    ref,
  )
  addDependencyAs('projects/the-backrooms/sfx/baby.wav', 'sfx/baby.wav', ref)
  declare('int', 'magicCntr', 0, ref)
  declare('int', 'harmfulAlmondWaterCounter', 0, ref)
  declare('int', 'previousHarmfulAlmondWaterCounter', -1, ref)
  declare('int', 'hadTutorialPowerout', 0, ref)
  declare('int', 'whisperEnabled', 1, ref)
  declare('int', 'hadBabyHallucination', 0, ref)

  addScript((self) => {
    return `
// component jumpscareController
ON INIT {
  ${getInjections('init', self)}

  SET #noexitTrigger ^RND_30000
  INC #noexitTrigger 30000
  SET #smellTrigger ^RND_60000
  INC #smellTrigger 40000

  TIMERnoexit -m 1 #noexitTrigger GOSUB WHISPER_NOEXIT
  TIMERsmell -m 1 #smellTrigger GOSUB WHISPER_SMELL

  ACCEPT
}

ON PICKUP {
  IF ("almondwater" isin ^$PARAM1) {
    IF (":slow" isin ^$PARAM1) {
      INC ${self.state.harmfulAlmondWaterCounter} 1
    }
    // TODO: add more harmful almondwater effects here
  }

  if (${self.state.harmfulAlmondWaterCounter} != ${
      self.state.previousHarmfulAlmondWaterCounter
    }) {
    if (${self.state.harmfulAlmondWaterCounter} > 2) {
      set ${self.state.harmfulAlmondWaterCounter} 1
    }

    SET ${self.state.previousHarmfulAlmondWaterCounter} ${
      self.state.harmfulAlmondWaterCounter
    }

    IF (${self.state.harmfulAlmondWaterCounter} == 1) {
      GOSUB WHISPER_DRINK1
    }
    IF (${self.state.harmfulAlmondWaterCounter} == 2) {
      GOSUB WHISPER_DRINK2
    }
  }

  if (^$PARAM1 == "key:exit") {
    if (#powerOn == 1) {
      if (${self.state.hadBabyHallucination} == 0) {
        set ${self.state.hadBabyHallucination} 1
        GOSUB BABY
      }
    }
  }

  ACCEPT
}

ON SPELLCAST {
  IF (^SENDER != PLAYER) {
    ACCEPT
  }

  INC ${self.state.magicCntr} 1
  IF (${self.state.magicCntr} == 1) {
    TIMERspeak -m 1 3000 GOSUB WHISPER_MAGIC
  }

  ACCEPT
}

ON OPEN {
  IF (^$PARAM1 == "exit") {
    GOSUB OUTRO
  }

  ACCEPT
}

ON POWEROUT {
  PLAY -p "sfx_electric"
  PLAY -o power_down

  SENDEVENT SAVE ${lampCtrl.ref} NOP
  SENDEVENT OFF ${lampCtrl.ref} NOP

  IF(${self.state.hadTutorialPowerout} == 0) {
    SET ${self.state.hadTutorialPowerout} 1
    TIMERtutorial -m 1 2000 GOSUB TUTORIAL_POWEROUT
  }

  ACCEPT
}

>>WHISPER_NOEXIT {
  IF (${self.state.whisperEnabled} == 0) {
    RETURN
  }
  SET ${self.state.whisperEnabled} 0
  SPEAK -p [whisper--no-exit] TIMERspeakAgain -m 1 200 SET ${
    self.state.whisperEnabled
  } 1
  HEROSAY [whisper--no-exit]
  RETURN
}

>>WHISPER_DRINK1 {
  IF (${self.state.whisperEnabled} == 0) {
    RETURN
  }
  SET ${self.state.whisperEnabled} 0
  SPEAK -p [whisper--drink-the-almond-water] TIMERspeakAgain -m 1 200 SET ${
    self.state.whisperEnabled
  } 1
  HEROSAY [whisper--drink-the-almond-water]
  RETURN
}

>>WHISPER_DRINK2 {
  IF (${self.state.whisperEnabled} == 0) {
    RETURN
  }
  SET ${self.state.whisperEnabled} 0
  SPEAK -p [whisper--drink-it] TIMERspeakAgain -m 1 200 SET ${
    self.state.whisperEnabled
  } 1
  HEROSAY [whisper--drink-it]
  RETURN
}

>>WHISPER_SMELL {
  IF (${self.state.whisperEnabled} == 0) {
    RETURN
  }
  SET ${self.state.whisperEnabled} 0
  SPEAK -p [whisper--do-you-smell-it] TIMERspeakAgain -m 1 200 SET ${
    self.state.whisperEnabled
  } 1
  HEROSAY [whisper--do-you-smell-it]
  RETURN
}

>>WHISPER_MAGIC {
  IF (${self.state.whisperEnabled} == 0) {
    RETURN
  }
  SET ${self.state.whisperEnabled} 0
  SPEAK -p [whisper--magic-wont-save-you] TIMERspeakAgain -m 1 200 SET ${
    self.state.whisperEnabled
  } 1
  HEROSAY [whisper--magic-wont-save-you]
  RETURN
}

>>BABY {
  SET ${self.state.whisperEnabled} 0
  PLAY -o "magic_spell_slow_down"
  PLAY -o "strange_noise1"
  PLAY -oil "player_heartb"
  SENDEVENT SAVE ${lampCtrl.ref} NOP
  SENDEVENT SETSPEED player 0.3
  WORLDFADE OUT 10 ${color(COLORS.BLOOD)}
  TIMERblinkend -m 1 500 WORLDFADE IN 500 NOP

  SENDEVENT ON ${ambientLights.ceiling.ref} NOP

  SENDEVENT MUTE ${lampCtrl.ref} NOP
  SENDEVENT OFF ${lampCtrl.ref} "instant"

  TIMERpowerOff -m 1 100 SET #powerOn 0

  TIMERbaby -m 1 2000 PLAY -o "baby"

  TIMERstopheartbeat -m 1 15000 PLAY -s "player_heartb"

  TIMERambOff1 -m 1 15000 SENDEVENT OFF ${ambientLights.ceiling.ref} NOP

  TIMERpowerOn -m 1 14900 SET #powerOn 1
  TIMERlampUnmute -m 1 15000 SENDEVENT UNMUTE ${lampCtrl.ref} NOP
  TIMERend -m 1 15500 SENDEVENT RESTORE ${lampCtrl.ref} NOP
  TIMERspeedrestore -m 1 15500 SENDEVENT SETSPEED player 1 SET ${
    self.state.whisperEnabled
  } 1

  RETURN
}

>>OUTRO {
  SET ${self.state.whisperEnabled} 0
  TIMERmute -m 1 1500 SENDEVENT MUTE ${lampCtrl.ref} NOP
  PLAYERINTERFACE HIDE
  SETPLAYERCONTROLS OFF
  TIMERfadeout -m 1 700 WORLDFADE OUT 300 ${color('khaki')}
  PLAY -o "backrooms-outro" // [o] = emit from player
  TIMERfadeout2 -m 1 18180 WORLDFADE OUT 0 ${color('black')}
  TIMERendgame -m 1 20000 END_GAME
  RETURN
}

>>TUTORIAL_POWEROUT {
  PLAY -o "system"
  HEROSAY [tutorial--powerout]
  QUEST [tutorial--powerout]
  RETURN
}
    `
  }, ref)
  moveTo({ type: 'relative', coords: pos }, [0, 0, 0], ref)
  markAsUsed(ref)

  return ref
}

const createExit = (
  originX,
  originZ,
  wallSegment,
  key,
  jumpscareController,
) => {
  const [wallX, wallY, wallZ, wallFace] = wallSegment

  let translate = [0, 0, 0]
  let rotate = [0, 0, 0]

  switch (wallFace) {
    case 'left':
      translate = [-80, 0, -75]
      rotate = [0, 180, 0]
      break
    case 'right':
      translate = [80, 0, 75]
      rotate = [0, 0, 0]
      break
    case 'back':
      translate = [75, 0, -80]
      rotate = [0, 270, 0]
      break
    case 'front':
      translate = [-75, 0, 80]
      rotate = [0, 90, 0]
      break
  }

  const pos = move(...translate, [
    originX + wallX * UNIT,
    0,
    -(originZ + wallZ * UNIT),
  ])
  const angle = rotate

  const ref = createItem(items.doors.lightDoor, { name: '[door--exit]' })

  declare('int', 'lockpickability', 100, ref)
  declare('string', 'type', 'Door_Ylsides', ref)
  declare('string', 'key', key.ref, ref)
  declare('int', 'open', 0, ref)
  declare('int', 'unlock', 0, ref)
  addDependencyAs(
    'projects/the-backrooms/sfx/backrooms-outro.wav',
    'sfx/backrooms-outro.wav',
    ref,
  )

  addScript((self) => {
    return `
// component: exit
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}
  
ON LOAD {
  USEMESH "DOOR_YLSIDES\\DOOR_YLSIDES.TEO"
  ACCEPT
}

ON ACTION {
  IF (${self.state.unlock} == 0) {
    ACCEPT
  }

  IF (${self.state.open} == 1) {
    ACCEPT
  }

  SENDEVENT OPEN ${jumpscareController.ref} "exit"

  ACCEPT
}
        `
  }, ref)

  moveTo({ type: 'relative', coords: pos }, angle, ref)
  markAsUsed(ref)
  return ref
}

const createKey = (pos, angle = [0, 0, 0], jumpscareCtrl) => {
  const ref = createItem(items.keys.oliverQuest, { name: '[key--exit]' })

  declare('int', 'pickedUp', 0, ref)

  addScript((self) => {
    return `
// component: key
ON INIT {
  ${getInjections('init', self)}
  OBJECT_HIDE SELF NO
  ACCEPT
}

ON INVENTORYIN {
  IF (${self.state.pickedUp} == 0) {
    SET ${self.state.pickedUp} 0
    SENDEVENT PICKUP ${jumpscareCtrl.ref} "key:exit"
  }

  ACCEPT
}
    `
  }, ref)
  moveTo({ type: 'relative', coords: pos }, angle, ref)
  markAsUsed(ref)

  return ref
}

const createAlmondWater = (
  pos,
  angle = [0, 0, 0],
  variant = 'mana',
  jumpscareCtrl,
) => {
  const ref = createItem(items.magic.potion.mana, {
    name: `[item--almond-water]`,
  })

  addDependencyAs(
    'projects/the-backrooms/almondwater.bmp',
    'graph/obj3d/interactive/items/magic/potion_mana/potion_mana[icon].bmp',
    ref,
  )
  declare('string', 'variant', variant, ref)
  declare('int', 'pickedUp', 0, ref)

  addScript((self) => {
    return `
// component: almondWater
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}

ON IDENTIFY {
  REFUSE
}

ON INVENTORYIN {
  IF (${self.state.pickedUp} == 0) {
    SET ${self.state.pickedUp} 0
    SENDEVENT PICKUP ${jumpscareCtrl.ref} "almondwater:${variant}"
  }

  ACCEPT
}

ON INVENTORYUSE {
  PLAY "drink"

  // TODO: make sure to handle effects, which have duration from running parallel

  IF (${self.state.variant} == "xp") {
    // TODO: add an effect
    ADDXP 2000
  }

  IF (${self.state.variant} == "mana") {
    IF (^PLAYER_MAXMANA > 0) {
      // only in ArxLibertatis 1.3+
      SPECIALFX MANA ^PLAYER_MAXMANA // TODO: only add half the player's mana
    } ELSE {
      SPECIALFX MANA 25
    }
  }

  IF (${self.state.variant} == "slow") {
    PLAY -o "magic_spell_slow_down"
    PLAY -oil "player_heartb"
    SENDEVENT SETSPEED player 0.5
    TIMERpenalty -m 1 7000 SENDEVENT SETSPEED player 1
    TIMERend -m 1 7000 PLAY -o "magic_spell_slow_down_end"
    TIMERstopheartbeat -m 1 7000 PLAY -s "player_heartb"
  }

  IF (${self.state.variant} == "speed") {
    PLAY -o "magic_spell_speedstart"
    PLAY -oil "player_heartb"
    SENDEVENT SETSPEED player 2
    TIMERbonusend -m 1 10000 SENDEVENT SETSPEED player 1
    TIMERend -m 1 10000 PLAY -o "magic_spell_speedend"
    TIMERstopheartbeat -m 1 10000 PLAY -s "player_heartb"
  }

  OBJECT_HIDE SELF YES
  // can't call destroy self immediately, because it kills timers too
  TIMERgarbagecollect -m 1 15000 DESTROY SELF

  REFUSE
}
    `
  }, ref)

  moveTo({ type: 'relative', coords: pos }, angle, ref)
  markAsUsed(ref)

  return ref
}

const createSpawnContainer = (pos, angle, contents = []) => {
  const ref = createItem(items.containers.barrel, {
    scale: 0.75,
  })

  addScript((self) => {
    return `
// component: spawn container
ON INIT {
  ${getInjections('init', self)}

  ${contents
    .map(({ ref }) => {
      return `inventory addfromscene "${ref}"`
    })
    .join('  \n')}

  ACCEPT
}
    `
  }, ref)

  moveTo({ type: 'relative', coords: pos }, angle, ref)
  markAsUsed(ref)
  return ref
}

const placeWallPlug = (
  originX,
  originZ,
  wallSegment,
  config = {},
  jumpscareCtrl,
) => {
  const [wallX, wallY, wallZ, wallFace] = wallSegment

  let translate = [0, 0, 0]
  let rotate = [0, 0, 0]

  const wallOffset = 91

  switch (wallFace) {
    case 'left':
      translate = [-wallOffset, -50, -0]
      rotate = [0, 180, 0]
      break
    case 'right':
      translate = [wallOffset, -50, 0]
      rotate = [0, 0, 0]
      break
    case 'back':
      translate = [0, -50, -wallOffset]
      rotate = [0, 270, 0]
      break
    case 'front':
      translate = [-0, -50, wallOffset]
      rotate = [0, 90, 0]
      break
  }

  const pos = move(...translate, [
    originX + wallX * UNIT,
    0,
    -(originZ + wallZ * UNIT),
  ])
  const angle = rotate

  return createWallPlug(pos, angle, config, jumpscareCtrl)
}

const generate = async (config) => {
  const { origin } = config

  defineWallPlug()
  defineCeilingLamp()
  defineCeilingDiffuser()

  overridePlayerScript()

  const welcomeMarker = createWelcomeMarker([0, 0, 0], config)

  const grid = generateGrid(20) // 50*50 = 2500, okay; 50^3 = 12500!!! not okay
  addRoom(3, 2, 3, grid)

  let roomCounter = 1
  const notFittingCombos = []
  for (let i = 0; i < config.numberOfRooms; i++) {
    const width = Math.round(randomBetween(...config.roomDimensions.width))
    const height = 2
    const depth = Math.round(randomBetween(...config.roomDimensions.depth))
    const hash = `${width}|${height}|${depth}`
    if (notFittingCombos.includes(hash)) {
      continue
    }
    const newRoomAdded = addRoom(width, height, depth, grid)
    if (newRoomAdded) {
      roomCounter++
    } else {
      notFittingCombos.push(hash)
    }
  }

  config.originalNumberOfRooms = config.numberOfRooms
  config.numberOfRooms = roomCounter

  const mapData = generateBlankMapData(config)

  mapData.meta.mapName = 'The Backrooms'

  movePlayerTo(
    {
      type: 'relative',
      coords: [-origin.coords[0], -origin.coords[1], -origin.coords[2]],
    },
    mapData,
  )
  setColor('black', mapData)

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
  setColor('#0b0c10', mapData)
  renderGrid(grid, mapData)

  const radius = getRadius(grid)
  const originX = -radius * UNIT + UNIT / 2
  const originY = -radius * UNIT + UNIT / 2
  const originZ = -radius * UNIT + UNIT / 2

  const wallSegments = []
  const floors = []

  const ambientLights = addAmbientLight([0, 0, 0], {
    color: COLORS.BLOOD,
    on: false,
  })(mapData)

  const lampsToBeCreated = []

  for (let z = 0; z < grid.length; z++) {
    for (let y = 0; y < grid[z].length; y++) {
      for (let x = 0; x < grid[z][y].length; x++) {
        if (isOccupied(x, y, z, grid)) {
          floors.push([x, y, z])

          const offsetX = Math.floor(randomBetween(0, UNIT / 100)) * 100
          const offsetY = 100
          const offsetZ = Math.floor(randomBetween(0, UNIT / 100)) * 100

          if (y === 12) {
            if (x % 3 === 0 && z % 3 === 0) {
              lampsToBeCreated.push({
                pos: [
                  originX + x * UNIT - 50 + offsetX,
                  -(originY + y * UNIT) + 10 + offsetY,
                  -(originZ + z * UNIT) - 50 + offsetZ,
                ],
                config: {
                  on: randomBetween(0, 100) < config.percentOfLightsOn,
                },
              })
            } else {
              if (Math.random() < 0.05) {
                createCeilingDiffuser([
                  originX + x * UNIT - 50 + offsetX,
                  -(originY + y * UNIT) + 5 + offsetY,
                  -(originZ + z * UNIT) - 50 + offsetZ,
                ])
              }
            }
          }

          if (isOccupied(x - 1, y, z, grid) !== true) {
            wallSegments.push([x - 1, y, z, 'right'])
          }
          if (isOccupied(x + 1, y, z, grid) !== true) {
            wallSegments.push([x + 1, y, z, 'left'])
          }
          if (isOccupied(x, y, z + 1, grid) !== true) {
            wallSegments.push([x, y, z + 1, 'front'])
          }
          if (isOccupied(x, y, z - 1, grid) !== true) {
            wallSegments.push([x, y, z - 1, 'back'])
          }
        }
      }
    }
  }

  const spawnContainerPos = [0, 0, UNIT]

  const aam = createRune('aam', spawnContainerPos, [0, 0, 0], welcomeMarker)
  const folgora = createRune(
    'folgora',
    spawnContainerPos,
    [0, 0, 0],
    welcomeMarker,
  )
  const taar = createRune('taar', spawnContainerPos, [0, 0, 0], welcomeMarker)

  createSpawnContainer(spawnContainerPos, [0, 0, 0], [aam, folgora, taar])

  const importantLocations = [spawnContainerPos]

  importantLocations.forEach((pos) => {
    const sortedLamps = lampsToBeCreated.sort((a, b) => {
      return sortByDistance(pos)(a.pos, b.pos)
    })

    sortedLamps[0].config.on = true
  })

  const lamps = lampsToBeCreated.reduce((lamps, { pos, config }) => {
    lamps.push(addLamp(pos, [0, 0, 0], config)(mapData))
    return lamps
  }, [])

  const lampCtrl = createLampController([10, 0, 10], lamps, config)

  const jumpscareCtrl = createJumpscareController(
    [-10, 0, -10],
    lampCtrl,
    ambientLights,
    config,
  )

  const lootSlots = pickRandoms(
    Math.floor(mapData.config.numberOfRooms / 3) + 5,
    floors,
  )

  // TODO: filter 5 of the farthest lootSlots compared to spawn and select a random from that
  const keySlot = pickRandomIdx(lootSlots)
  const [keyX, keyY, keyZ] = lootSlots[keySlot]
  lootSlots.splice(keySlot, 1)

  const key = createKey(
    [originX + keyX * UNIT - 50, 0, -(originZ + keyZ * UNIT) - 50],
    [0, 0, 0],
    jumpscareCtrl,
  )

  const wallPlugTypes = pickRandomLoot(20, [
    { variant: 'clean', weight: 7 },
    { variant: 'old', weight: 4 },
    { variant: 'broken', weight: 1 },
  ])

  pickRandoms(21, wallSegments).forEach((wallSegment, idx) => {
    if (idx === 0) {
      createExit(originX, originZ, wallSegment, key, jumpscareCtrl)
      return
    }

    placeWallPlug(
      originX,
      originZ,
      wallSegment,
      {
        variant: wallPlugTypes[idx - 1].variant,
      },
      jumpscareCtrl,
    )
  })

  const generalLoot = pickRandomLoot(lootSlots.length, config.lootTable)

  lootSlots.forEach(([x, y, z], idx) => {
    const offsetX = Math.floor(randomBetween(0, UNIT / 100)) * 100
    const offsetY = Math.floor(randomBetween(0, UNIT / 100)) * 100
    const offsetZ = Math.floor(randomBetween(0, UNIT / 100)) * 100
    const pos = [
      originX + x * UNIT - 50 + offsetX,
      0,
      -(originZ + z * UNIT) - 50 + offsetZ,
    ]

    const loot = generalLoot[idx]

    switch (loot.name) {
      case 'almondWater':
        {
          createAlmondWater(pos, [0, 0, 0], loot.variant, jumpscareCtrl)
        }
        break
      default:
        console.error('unknown loot item', loot)
    }
  })

  addTranslations(translations)

  const finalizedMapData = finalize(mapData)
  return saveToDisk(finalizedMapData)
}

export default generate
