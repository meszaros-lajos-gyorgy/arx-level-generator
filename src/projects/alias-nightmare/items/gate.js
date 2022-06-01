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
  ACCEPT
}
ON CLOSE {
  IF (${self.state.isOpen} == 0) {
    ACCEPT
  }
  SET ${self.state.isOpen} 0
  PLAYANIM -e ACTION2 COLLISION ON
  VIEWBLOCK ON
  PLAY ~£closesfx~
  REFUSE
}
ON OPEN {
  IF (${self.state.isOpen} == 1) {
    ACCEPT
  }
  SET ${self.state.isOpen} 1
  PLAYANIM -e ACTION1 COLLISION OFF
  PLAY ~£opensfx~
  VIEWBLOCK OFF
  ANCHOR_BLOCK OFF
  REFUSE
}
`
  }, ref)

  return ref
}
