const { compose } = require("ramda");
const {
  generateBlankMapData,
  movePlayerTo,
  finalize,
  saveToDisk,
  setColor,
  addZone,
  randomBetween,
  move,
} = require("../../helpers");
const island = require("./island.js");
const {
  colors,
  NONE,
  ALL,
  NORTH,
  EAST,
  SOUTH,
  WEST,
} = require("./constants.js");
const { ambiences } = require("../../assets/ambiences");
const {
  items,
  createItem,
  markAsUsed,
  moveTo,
  addScript,
} = require("../../assets/items");
const { declare, color, getInjections } = require("../../scripting");
const bridge = require("./bridge");

const createWelcomeMarker = (pos) => {
  return compose(
    markAsUsed,
    moveTo(pos, [0, 0, 0]),
    addScript((self) => {
      return `
// component: welcomeMarker
ON INIT {
  ${getInjections("init", self)}
  SETCONTROLLEDZONE palette0
  CINEMASCOPE ON
  WORLDFADE OUT 0 ${color(colors.ambience[0])}
  ACCEPT
}
ON CONTROLLEDZONE_ENTER {
  if (${self.state.hadIntro} == 0) {
    TELEPORT -p ${self.ref}
    SET ${self.state.hadIntro} 1
    SETPLAYERCONTROLS OFF
    TIMERfade 1 2 worldfade IN 2000
    TIMERmove -m 1 10 SPEAK -p [alia_nightmare2] GOTO READY
    ACCEPT
  }
  ACCEPT
}
>>READY {
  CINEMASCOPE -s OFF
  SETPLAYERCONTROLS ON
  ACCEPT
}
      `;
    }),
    declare("int", "hadIntro", 0),
    createItem
  )(items.marker);
};

const createHangingCorpse = (pos, angle = [0, 0, 0]) => {
  return compose(
    markAsUsed,
    moveTo(pos, angle),
    addScript((self) => {
      return `
// component: hangingCorpse
ON INIT {
  ${getInjections("init", self)}
  SET_NPC_STAT life 0
  SETNAME [public_falan_tomb]
  INVENTORY CREATE
  INVENTORY SKIN "ingame_inventory_corpse"
  INVENTORY ADD "jewelry\\gold_coin\\gold_coin"
  ACCEPT
}

ON DIE {
  REFUSE
}
      `;
    }),
    createItem
  )(items.corpse.hanging);
};

const generateAtLeastOneExit = () => {
  return (
    Math.round(randomBetween(NONE, ALL)) || 1 << Math.round(randomBetween(0, 3))
  );
};

const createSmellyFlower = (pos, angle = [0, 0, 0]) => {
  return compose(
    markAsUsed,
    moveTo(pos, angle),
    addScript((self) => {
      return `
// component: smellyFlower
ON INIT {
  SETNAME "Smelly flower"
  ACCEPT
}
      `;
    }),
    createItem
  )(items.plants.fern);
};

const generate = async (config) => {
  const { origin } = config;
  createWelcomeMarker([0, 0, 0]);
  createHangingCorpse([-300, -150, -200], [0, 145, 0]);
  createSmellyFlower([300, 0, -300]);
  createSmellyFlower([330, 0, -330], [7, 70, 10]);
  createSmellyFlower([280, 0, -290], [2, 24, 0]);
  createSmellyFlower([290, 0, -310]);
  createSmellyFlower([300, 0, -330]);

  return compose(
    saveToDisk,
    finalize,

    island({
      pos: [3000, 0, 3000],
      entrances: WEST,
      exits: NONE,
      width: 10,
      height: 14,
    }),

    /*
    // calculations are not working here
    // bridge({
    //   height: 2,
    //   to: move(-(14 / 2) * 100, 0, 0, [3000, 0, 3000]),
    //   from: move((10 / 2) * 100, 0, 0, [0, 0, 3000]),
    // }),
    */

    island({
      pos: [0, 0, 3000],
      entrances: SOUTH,
      exits: EAST,
      width: 10,
      height: 10,
    }),

    /*
    bridge({
      to: move(0, 0, -(10 / 2) * 100, [0, 0, 3000]),
      from: move(0, 0, (9 / 2) * 100, [0, 0, 0]),
      width: 2,
    }),
    */

    island({
      pos: [0, 0, 0],
      entrances: NONE,
      exits: NORTH,
      width: 14,
      height: 10,
    }),

    addZone(
      [-origin[0], 0, -origin[2]],
      [100, 0, 100],
      "palette0",
      ambiences.sirs,
      5000
    ),
    setColor(colors.ambience[0]),

    movePlayerTo([-origin[0], 0, -origin[2]]),
    generateBlankMapData
  )(config);
};

module.exports = generate;
