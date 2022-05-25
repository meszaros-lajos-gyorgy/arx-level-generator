import { ambiences } from '../../../assets/ambiences'
import {
  EXTRAS_EXTINGUISHABLE,
  EXTRAS_SEMIDYNAMIC,
  EXTRAS_SPAWNFIRE,
  EXTRAS_SPAWNSMOKE,
  EXTRAS_STARTEXTINGUISHED,
} from '../../../constants'
import { addCoords, addLight, addZone, setColor } from '../../../helpers'
import { declare, getInjections } from '../../../scripting'
import { RelativeCoords, RotationVector3 } from '../../../types'
import {
  markAsUsed,
  createItem,
  items,
  moveTo,
  InjectableProps,
  addScript,
} from '../../../assets/items'

const createCampfireFlames = (pos: RelativeCoords, mapData) => {
  setColor('white', mapData)
  addLight(
    pos.coords,
    {
      fallstart: 63,
      fallend: 241,
      intensity: 2.18,
      i: 0,
      exFlicker: {
        r: 0.25,
        g: 0.25,
        b: 0.25,
      },
      exRadius: 20, // how large the flame particles spread out as a whole
      exFrequency: 0.8,
      exSize: 0.5, // how large the individual flame particles are
      exSpeed: 0.65, // how fast the flame particles travel upwards
      exFlareSize: 80,
      extras:
        EXTRAS_SEMIDYNAMIC |
        EXTRAS_EXTINGUISHABLE |
        EXTRAS_STARTEXTINGUISHED |
        EXTRAS_SPAWNFIRE |
        EXTRAS_SPAWNSMOKE,
    },
    mapData,
  )
}

const createCampfireCookZone = (
  pos: RelativeCoords,
  zoneName: string = 'cookzone',
  mapData,
) => {
  addZone(pos, [100, 0, 100], zoneName, ambiences.none, 0, 0)(mapData)
}

const createCampfireCookMarker = (
  pos: RelativeCoords,
  zoneName: string,
  props: InjectableProps = {},
) => {
  const cookMarker = createItem(items.marker, props)
  moveTo(pos, [0, 0, 0], cookMarker)
  markAsUsed(cookMarker)

  declare('int', 'ignit', 1, cookMarker)
  addScript((self) => {
    return `
// component campfire cook marker
ON INIT {
  ${getInjections('init', self)}
  SETCONTROLLEDZONE "${zoneName}"
  ACCEPT
}

ON CONTROLLEDZONE_ENTER {
  IF (^$PARAM1 ISGROUP FOOD) {
    SENDEVENT COOK ^$PARAM1 ""
  }
  ACCEPT
}

ON CUSTOM {
  IF (^$PARAM1 == "FIRE") {
    SET ${self.state.ignit} 1
    SETCONTROLLEDZONE "${zoneName}"
    SENDEVENT -iz COOK ${zoneName} ""
    ACCEPT
  }
  IF (^$PARAM1 == "DOUSE") {
    SET ${self.state.ignit} 0
    UNSET_CONTROLLED_ZONE "${zoneName}"
    ACCEPT
  }
  ACCEPT
}

ON SPELLCAST {
  IF (^SENDER != PLAYER) {
    ACCEPT
  }
  IF (^$PARAM1 == DOUSE) {
    GOSUB TESTDIST
    UNSET_CONTROLLED_ZONE "${zoneName}" 
    SET ${self.state.ignit} 0
    ACCEPT
  }
  IF (^$PARAM1 == IGNIT) {
    GOSUB TESTDIST
    IF (${self.state.ignit} == 0) {
      SENDEVENT -r FIRE_AFFRAID 300 ""
    }
    SET ${self.state.ignit} 1
    SETCONTROLLEDZONE "${zoneName}"
    SENDEVENT -iz COOK ${zoneName} ""
    ACCEPT
  }
  ACCEPT
}

>>TESTDIST {
  SET #TMP ~^#PARAM2~
  MUL #TMP 30
  INC #TMP 400
  IF (^DIST_PLAYER > #TMP) {
    ACCEPT
  }
  RETURN
}
    `
  }, cookMarker)

  return cookMarker
}

export const createCampfire = (
  pos: RelativeCoords,
  angle: RotationVector3 = [0, 0, 0],
  mapData,
) => {
  const campfire = createItem(items.misc.campfire)

  moveTo(pos, angle, campfire)
  markAsUsed(campfire)

  createCampfireFlames(
    addCoords(pos, {
      type: 'relative',
      coords: [-6, -30, 0],
    }) as RelativeCoords,
    mapData,
  )
  createCampfireCookZone(pos, 'cookzone', mapData)
  createCampfireCookMarker(pos, 'cookzone')

  return campfire
}
