/**
 * The Backrooms
 *
 * Issues:
 *  - https://bugs.arx-libertatis.org/arx/issues/1599
 *
 * To be reported:
 *   -x flag a spellcast-nál nem némítja el a douse-ot, meg az ignite-ot
 *   a light-oknak lehet extra flag-eknél NO_IGNIT-et megadni, de nincs NO_DOUSE
 *   nem lehet level 0-nál lightningbolt-ot ellőni: https://github.com/arx/ArxLibertatis/blob/master/src/game/Spells.cpp#L742
 *
 * Neon light sound effects: https://www.youtube.com/watch?v=UKoktRXJZLM (Peter Seeba)
 * Glass popping sound effects: https://www.youtube.com/watch?v=6nKbpLUpqiQ (SOUND EFFECT EN & FR)
 */

const { compose } = require("ramda");
const { textures } = require("../../assets/textures.js");
const {
  generateBlankMapData,
  finalize,
  saveToDisk,
  setColor,
  movePlayerTo,
  addLight,
  move,
  randomBetween,
  circleOfVectors,
  pickRandoms,
  pickRandom,
  toRgba,
  toFloatRgb,
  addZone,
  pickRandomLoot,
} = require("../../helpers.js");
const { wallX, wallZ, plain } = require("../../prefabs");
const {
  defineCeilingLamp,
  createCeilingLamp,
} = require("./items/ceilingLamp.js");
const {
  EXTRAS_SEMIDYNAMIC,
  EXTRAS_EXTINGUISHABLE,
  EXTRAS_STARTEXTINGUISHED,
  EXTRAS_NO_IGNIT,
  HFLIP,
  VFLIP,
} = require("../../constants.js");
const {
  markAsUsed,
  moveTo,
  addScript,
  createItem,
  items,
  addDependencyAs,
  addDependency,
} = require("../../assets/items.js");
const { getInjections, declare, color } = require("../../scripting.js");
const {
  generateGrid,
  addRoom,
  getRadius,
  isOccupied,
  renderGrid,
} = require("./rooms.js");
const { disableBumping } = require("../../prefabs/plain.js");
const {
  defineCeilingDiffuser,
  createCeilingDiffuser,
} = require("./items/ceilingDiffuser.js");
const { overridePlayerScript } = require("../shared/player.js");
const { createLampController } = require("./items/lampController.js");
const { ambiences } = require("../../assets/ambiences.js");
const { wall } = require("./wall.js");
const { UNIT, COLORS } = require("./constants.js");

const addLamp = (pos, angle, config = {}) => {
  return (mapData) => {
    const isOn = config.on ?? false;
    const lampEntity = createCeilingLamp(pos, angle, { on: isOn });

    const roomHeight = mapData.config.roomDimensions.height;

    compose(
      addLight(move(0, 20, 0, pos), {
        fallstart: 100,
        fallend: 500 * roomHeight,
        intensity: 1.3 - roomHeight * 0.1,
        exFlicker: toFloatRgb(toRgba("#1f1f07")),
        extras:
          EXTRAS_SEMIDYNAMIC |
          EXTRAS_EXTINGUISHABLE |
          (isOn ? 0 : EXTRAS_STARTEXTINGUISHED) |
          EXTRAS_NO_IGNIT,
      }),
      setColor("white")
    )(mapData);

    return lampEntity;
  };
};

const addAmbientLight = (pos, config = {}) => {
  return (mapData) => {
    const isOn = config.on ?? false;
    const lightColor = config.color ?? "red";
    const radius = config.radius ?? 10000;

    const lightConfig = {
      fallstart: 0,
      fallend: 100000,
      intensity: 1,
      extras:
        EXTRAS_SEMIDYNAMIC |
        EXTRAS_EXTINGUISHABLE |
        (isOn ? 0 : EXTRAS_STARTEXTINGUISHED) |
        EXTRAS_NO_IGNIT,
    };

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
    };

    compose(
      addLight(move(0, -radius + 20, 0, pos), lightConfig),
      addLight(move(0, radius + 20, 0, pos), lightConfig),
      addLight(move(-radius, 20, 0, pos), lightConfig),
      addLight(move(radius, 20, 0, pos), lightConfig),
      addLight(move(0, 20, -radius, pos), lightConfig),
      addLight(move(0, 20, radius, pos), lightConfig),
      setColor(lightColor)
    )(mapData);

    return lampEntities;
  };
};

const createWelcomeMarker = (pos, config) => {
  return compose(
    markAsUsed,
    moveTo(pos, [0, 0, 0]),
    addScript((self) => {
      return `
// component: welcomeMarker
ON INIT {
  ${getInjections("init", self)}

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
  HEROSAY "You've noclipped out of reality and landed in the backrooms! You might leave by exiting through an unmarked fire exit."
  QUEST "You've noclipped out of reality and landed in the backrooms! You might leave by exiting through an unmarked fire exit."
  RETURN
}

>>TUTORIAL_LIGHT {
  PLAY -o "system"
  HEROSAY "Fluorescent lights require electricity, try shooting them with a lightning bolt."
  QUEST "Fluorescent lights require electricity, try shooting them with a lightning bolt."
  RETURN
}
      `;
    }),
    addDependency("graph/levels/level1/map.bmp"),
    addDependencyAs(
      "projects/the-backrooms/loading.bmp",
      `graph/levels/level${config.levelIdx}/loading.bmp`
    ),
    addDependencyAs(
      "projects/the-backrooms/sfx/no-sound.wav",
      "sfx/magic_spell_ignite.wav"
    ),
    addDependencyAs(
      "projects/the-backrooms/sfx/no-sound.wav",
      "sfx/magic_spell_douse.wav"
    ),
    addDependencyAs(
      "projects/the-backrooms/sfx/no-sound.wav",
      "sfx/player_level_up.wav"
    ),
    declare("int", "hasAam", 0),
    declare("int", "hasFolgora", 0),
    declare("int", "hasTaar", 0),
    createItem
  )(items.marker);
};

const createJumpscareController = (pos, lampCtrl, ambientLights, config) => {
  return compose(
    markAsUsed,
    moveTo(pos, [0, 0, 0]),
    addScript((self) => {
      return `
// component jumpscareController
ON INIT {
  ${getInjections("init", self)}

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
    GOSUB BABY
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

>>WHISPER_NOEXIT {
  SPEAK -p [whisper--no-exit]
  // HEROSAY [whisper--no-exit]
  HEROSAY "It is no use trying to find an exit, Am Sheagar! You will never leave this place!"
  RETURN
}

>>WHISPER_DRINK1 {
  SPEAK -p [whisper--drink-the-almond-water]
  // HEROSAY [whisper--drink-the-almond-water]
  HEROSAY "Drink the almond water! It will be over faster with that!"
  RETURN
}

>>WHISPER_DRINK2 {
  SPEAK -p [whisper--drink-it]
  // HEROSAY [whisper--drink-it]
  HEROSAY "Drink it! Drink it! Drink it! Drink it! Drink it!"
  RETURN
}

>>WHISPER_SMELL {
  SPEAK -p [whisper--do-you-smell-it]
  // HEROSAY [whisper--do-you-smell-it]
  HEROSAY "Do you smell it? It is the smell of how you will rot here next to your precious Alia!"
  RETURN
}

>>WHISPER_MAGIC {
  SPEAK -p [whisper--magic-wont-save-you]
  // HEROSAY [whisper--magic-wont-save-you]
  HEROSAY "Do you really think magic will save you this time?"
  RETURN
}

>>BABY {
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

  TIMERbaby -m 1 2000 PLAY -o "baby"
  
  TIMERstopheartbeat -m 1 15000 PLAY -os "player_heartb"
  
  TIMERambOff1 -m 1 15000 SENDEVENT OFF ${ambientLights.ceiling.ref} NOP

  TIMERlampUnmute -m 1 15000 SENDEVENT UNMUTE ${lampCtrl.ref} NOP
  TIMERend -m 1 15500 SENDEVENT RESTORE ${lampCtrl.ref} NOP
  TIMERspeedrestore -m 1 15500 SENDEVENT SETSPEED player 1

  RETURN
}

>>OUTRO {
  TIMERmute -m 1 1500 SENDEVENT MUTE ${lampCtrl.ref} NOP
  PLAYERINTERFACE HIDE
  SETPLAYERCONTROLS OFF
  TIMERfadeout -m 1 700 WORLDFADE OUT 300 ${color("khaki")}
  PLAY -o "backrooms-outro" // [o] = emit from player
  TIMERfadeout2 -m 1 18180 WORLDFADE OUT 0 ${color("black")}
  TIMERendgame -m 1 20000 END_GAME
  RETURN
}
      `;
    }),
    addDependencyAs(
      "projects/the-backrooms/whispers/english/do-you-smell-it.wav",
      "speech/english/whisper--do-you-smell-it.wav"
    ),
    addDependencyAs(
      "projects/the-backrooms/whispers/german/do-you-smell-it.wav",
      "speech/deutsch/whisper--do-you-smell-it.wav"
    ),
    addDependencyAs(
      "projects/the-backrooms/whispers/english/drink-it.wav",
      "speech/english/whisper--drink-it.wav"
    ),
    addDependencyAs(
      "projects/the-backrooms/whispers/german/drink-it.wav",
      "speech/deutsch/whisper--drink-it.wav"
    ),
    addDependencyAs(
      "projects/the-backrooms/whispers/english/drink-the-almond-water.wav",
      "speech/english/whisper--drink-the-almond-water.wav"
    ),
    addDependencyAs(
      "projects/the-backrooms/whispers/german/drink-the-almond-water.wav",
      "speech/deutsch/whisper--drink-the-almond-water.wav"
    ),
    addDependencyAs(
      "projects/the-backrooms/whispers/english/magic-wont-save-you.wav",
      "speech/english/whisper--magic-wont-save-you.wav"
    ),
    addDependencyAs(
      "projects/the-backrooms/whispers/german/magic-wont-save-you.wav",
      "speech/deutsch/whisper--magic-wont-save-you.wav"
    ),
    addDependencyAs(
      "projects/the-backrooms/whispers/english/no-exit.wav",
      "speech/english/whisper--no-exit.wav"
    ),
    addDependencyAs(
      "projects/the-backrooms/whispers/german/no-exit.wav",
      "speech/deutsch/whisper--no-exit.wav"
    ),
    addDependencyAs("projects/the-backrooms/sfx/baby.wav", "sfx/baby.wav"),
    declare("int", "magicCntr", 0),
    declare("int", "harmfulAlmondWaterCounter", 0),
    declare("int", "previousHarmfulAlmondWaterCounter", -1),
    createItem
  )(items.marker);
};

const createRune = (runeName, pos, angle = [0, 0, 0], welcomeMarker) => {
  return compose(
    markAsUsed,
    moveTo(pos, angle),
    addScript((self) => {
      return `
// component: rune
ON INIT {
  ${getInjections("init", self)}
  ACCEPT
}

ON INVENTORYUSE {
  SENDEVENT GOT_RUNE ${welcomeMarker.ref} "${runeName}"
  ACCEPT
}
      `;
    }),
    declare("string", "rune_name", runeName),
    createItem
  )(items.magic.rune);
};

const createExit = (top, left, wallSegment, key, jumpscareController) => {
  const [wallX, wallZ, wallFace] = wallSegment;

  let translate = [0, 0, 0];
  let rotate = [0, 0, 0];

  switch (wallFace) {
    case "left":
      translate = [-80, 0, -75];
      rotate = [0, 180, 0];
      break;
    case "right":
      translate = [80, 0, 75];
      rotate = [0, 0, 0];
      break;
    case "back":
      translate = [75, 0, -80];
      rotate = [0, 270, 0];
      break;
    case "front":
      translate = [-75, 0, 80];
      rotate = [0, 90, 0];
      break;
  }

  const pos = move(...translate, [
    left + wallX * UNIT,
    0,
    -(top + wallZ * UNIT),
  ]);
  const angle = rotate;

  return compose(
    markAsUsed,
    moveTo(pos, angle),
    addScript((self) => {
      return `
// component: exit
ON INIT {
  ${getInjections("init", self)}
  ACCEPT
}
 
ON LOAD {
  USE_MESH "DOOR_YLSIDES\\DOOR_YLSIDES.TEO"
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
      `;
    }),
    declare("int", "lockpickability", 100),
    declare("string", "type", "Door_Ylsides"),
    declare("string", "key", key.ref),
    declare("int", "open", 0),
    declare("int", "unlock", 0),
    addDependencyAs(
      "projects/the-backrooms/sfx/backrooms-outro.wav",
      "sfx/backrooms-outro.wav"
    ),
    createItem
    // )(items.doors.lightDoor, { name: "[door--exit]" });
  )(items.doors.lightDoor, { name: "Unmarked fire exit" });
};

const createKey = (pos, angle = [0, 0, 0], jumpscareCtrl) => {
  return compose(
    markAsUsed,
    moveTo(pos, angle),
    addScript((self) => {
      return `
// component: key
ON INIT {
  ${getInjections("init", self)}
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
      `;
    }),
    declare("int", "pickedUp", 0),
    createItem
    // )(items.keys.oliverQuest, { name: "[key--exit]" });
  )(items.keys.oliverQuest, { name: "Fire exit key" });
};

const createAlmondWater = (
  pos,
  angle = [0, 0, 0],
  variant = "mana",
  jumpscareCtrl
) => {
  return compose(
    markAsUsed,
    moveTo(pos, angle),
    addScript((self) => {
      return `
// component: almondWater
ON INIT {
  ${getInjections("init", self)}
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

  IF (${self.state.variant} == "xp") {
    // TODO: add an effect
    ADDXP 2000
  }

  IF (${self.state.variant} == "mana") {
    SPECIALFX MANA 25
  }

  IF (${self.state.variant} == "slow") {
    PLAY -o "magic_spell_slow_down"
    PLAY -oil "player_heartb"
    SENDEVENT SETSPEED player 0.5
    TIMERpenalty -m 1 7000 SENDEVENT SETSPEED player 1
    TIMERend -m 1 7000 PLAY -o "magic_spell_slow_down_end"
    TIMERstopheartbeat -m 1 7000 PLAY -os "player_heartb"
  }

  OBJECT_HIDE SELF YES
  // can't call destroy self immediately, because it kills timers too
  TIMERgarbagecollect -m 1 15000 DESTROY SELF

  REFUSE
}
      `;
    }),
    addDependencyAs(
      "projects/the-backrooms/almondwater.bmp",
      "graph/obj3d/interactive/items/magic/potion_mana/potion_mana[icon].bmp"
    ),
    declare("string", "variant", variant),
    declare("int", "pickedUp", 0),
    createItem
  )(items.magic.potion.mana, {
    // name: `[item--almond-water]`,
    name: "Almond water",
  });
};

const generate = async (config) => {
  const { origin } = config;

  defineCeilingLamp();
  defineCeilingDiffuser();

  overridePlayerScript();

  const welcomeMarker = createWelcomeMarker([0, 0, 0], config);

  const runes = ["aam", "folgora", "taar"];
  circleOfVectors([0, 0, UNIT / 2], 40, 3).forEach((pos, idx) => {
    createRune(runes[idx], pos, [0, 0, 0], welcomeMarker);
  });

  const grid = compose(
    (grid) => {
      for (let i = 0; i < config.numberOfRooms; i++) {
        grid = addRoom(
          randomBetween(...config.roomDimensions.width),
          randomBetween(...config.roomDimensions.depth),
          grid
        );
      }
      return grid;
    },
    addRoom(3, 3),
    generateGrid
  )(50);

  return compose(
    saveToDisk,
    finalize,

    (mapData) => {
      const radius = getRadius(grid);
      const top = -radius * UNIT + UNIT / 2;
      const left = -radius * UNIT + UNIT / 2;

      const wallSegments = [];
      const floors = [];

      const ambientLights = addAmbientLight([0, 200, 0], {
        color: COLORS.BLOOD,
        on: false,
      })(mapData);

      const lamps = [];

      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          if (isOccupied(x, y, grid)) {
            floors.push([x, y]);

            const offsetX = Math.floor(randomBetween(0, UNIT / 100)) * 100;
            const offsetZ = Math.floor(randomBetween(0, UNIT / 100)) * 100;

            if (x % 3 === 0 && y % 3 === 0) {
              const lampConfig = {
                on: randomBetween(0, 100) < config.percentOfLightsOn,
              };

              const lamp = addLamp(
                [
                  left + x * UNIT - 50 + offsetX,
                  -(config.roomDimensions.height * UNIT - 10),
                  -(top + y * UNIT) - 50 + offsetZ,
                ],
                [0, 0, 0],
                lampConfig
              )(mapData);

              lamps.push(lamp);
            } else {
              if (Math.random() < 0.05) {
                createCeilingDiffuser([
                  left + x * UNIT - 50 + offsetX,
                  -(config.roomDimensions.height * UNIT - 5),
                  -(top + y * UNIT) - 50 + offsetZ,
                ]);
              }
            }

            if (isOccupied(x - 1, y, grid) !== true) {
              wallSegments.push([x - 1, y, "right"]);
            }
            if (isOccupied(x + 1, y, grid) !== true) {
              wallSegments.push([x + 1, y, "left"]);
            }
            if (isOccupied(x, y + 1, grid) !== true) {
              wallSegments.push([x, y + 1, "front"]);
            }
            if (isOccupied(x, y - 1, grid) !== true) {
              wallSegments.push([x, y - 1, "back"]);
            }
          }
        }
      }

      const lampCtrl = createLampController([10, 0, 10], lamps, config);

      const jumpscareCtrl = createJumpscareController(
        [-10, 0, -10],
        lampCtrl,
        ambientLights,
        config
      );

      const [[keyX, keyZ], ...lootSlot] = pickRandoms(
        Math.floor(mapData.config.numberOfRooms / 3) + 5,
        floors
      );

      const key = createKey(
        [left + keyX * UNIT - 50, 0, -(top + keyZ * UNIT) - 50],
        [0, 0, 0],
        jumpscareCtrl
      );

      createExit(top, left, pickRandom(wallSegments), key, jumpscareCtrl);

      lootSlot.forEach(([x, z]) => {
        const offsetX = Math.floor(randomBetween(0, UNIT / 100)) * 100;
        const offsetZ = Math.floor(randomBetween(0, UNIT / 100)) * 100;
        const pos = [
          left + x * UNIT - 50 + offsetX,
          0,
          -(top + z * UNIT) - 50 + offsetZ,
        ];

        const loot = pickRandomLoot(config.lootTable);

        switch (loot.name) {
          case "almondWater":
            {
              createAlmondWater(pos, [0, 0, 0], loot.variant, jumpscareCtrl);
            }
            break;
          default:
            console.error("unknown item", loot);
        }
      });

      return mapData;
    },

    renderGrid(grid),
    setColor("#0b0c10"),

    addZone(
      [-origin[0], 0, -origin[2]],
      [100, 0, 100],
      "palette0",
      ambiences.none,
      5000
    ),
    setColor("black"),

    movePlayerTo([-origin[0], 0, -origin[2]]),
    (mapData) => {
      mapData.meta.mapName = "The Backrooms";
      return mapData;
    },
    generateBlankMapData
  )(config);
};

module.exports = generate;
