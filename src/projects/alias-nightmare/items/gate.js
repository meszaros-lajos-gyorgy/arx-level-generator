import { addScript, createItem, items } from '../../../assets/items'
import { declare, getInjections } from '../../../scripting'

const meshes = {
  wide: 'L2_Gobel_portcullis_big\\L2_Gobel_portcullis_big.teo',
  narrow: 'L2_Gobel_portcullis\\L2_Gobel_portcullis.teo',
}

export const createGate = (orientation, props = {}) => {
  const isWide = props.isWide ?? false

  const ref = createItem(items.doors.portcullis, {
    mesh: isWide ? meshes.wide : meshes.narrow,
  })

  declare('int', 'isOpen', props.isOpen ?? false ? 1 : 0, ref)

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
  MOVE 0 -80 0
  GOSUB STOPSOUND
  PLAY -i ~£opensfx~
  TIMERstopsound -m 1 600 GOSUB STOPSOUND
  ACCEPT
}

ON LOWER {
  MOVE 0 80 0
  GOSUB STOPSOUND
  PLAY -i ~£closesfx~
  TIMERstopsound -m 1 600 GOSUB STOPSOUND
  ACCEPT
}

>>STOPSOUND {
  PLAY -s ~£opensfx~
  PLAY -s ~£closesfx~
  RETURN
}
`
  }, ref)

  // TODO: create custom animation with timer (raise and lower gate)
  // TODO: variable speed for the custom animation

  return ref
}
