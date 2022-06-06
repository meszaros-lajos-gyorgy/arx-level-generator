import { addScript, createItem, items } from '../../../assets/items'
import { declare, getInjections } from '../../../scripting'

const meshes = {
  wide: 'L2_Gobel_portcullis_big\\L2_Gobel_portcullis_big.teo',
  narrow: 'L2_Gobel_portcullis\\L2_Gobel_portcullis.teo',
}

const FPS = 30
const fpsInMs = 1000 / FPS

export const createGate = (orientation, props = {}) => {
  const isWide = props.isWide ?? false

  const ref = createItem(items.doors.portcullis, {
    mesh: isWide ? meshes.wide : meshes.narrow,
  })

  // TODO: handle props.isOpen
  // declare('int', 'isOpen', props.isOpen ?? false ? 1 : 0, ref)

  addScript((self) => {
    return `
// component island:gates.${orientation}
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}
ON INITEND {
  ${getInjections('initend', self)}
  COLLISION ON
  ACCEPT
}

ON RAISE {
  GOSUB STOPANIM
  GOSUB STOPSOUND
  PLAY -i ~£opensfx~
  GOSUB RAISE_STEP
  ACCEPT
}

>>RAISE_STEP {
  MOVE 0 -100 0
  ACCEPT
}

ON LOWER {
  GOSUB STOPANIM
  GOSUB STOPSOUND
  PLAY -i ~£closesfx~
  GOSUB LOWER_STEP
  ACCEPT
}

>>LOWER_STEP {
  MOVE 0 100 0
  ACCEPT
}

>>STOPSOUND {
  PLAY -s ~£opensfx~
  PLAY -s ~£closesfx~
  RETURN
}

>>STOPANIM {
  TIMERmove OFF
  RETURN
}
`
  }, ref)

  // TODO: create custom animation with timer (raise and lower gate)
  // TODO: variable speed for the custom animation

  return ref
}
