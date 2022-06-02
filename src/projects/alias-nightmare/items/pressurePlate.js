import { addScript, createItem, items } from '../../../assets/items'
import { declare, getInjections } from '../../../scripting'

export const createPressurePlate = (id, eventBus) => {
  const ref = createItem(items.mechanisms.pressurePlate)
  declare('int', 'onme', 0, ref)
  addScript((self) => {
    return `
// component: island.${id}
ON INIT {
  SETSCALE 101
  ${getInjections('init', self)}
  ACCEPT
}

ON INITEND {
  TIMERontop -im 0 500 GOTO TOP
  ACCEPT
}

>>TOP {
  IF ( ^$OBJONTOP == "NONE" ) {
    IF ( ${self.state.onme} == 1 ) {
      SET ${self.state.onme} 0
      PLAYANIM ACTION2
      SENDEVENT CUSTOM ${eventBus.ref} "${id}.released"
    }
    ACCEPT
  }

  // HEROSAY ^$OBJONTOP
  // HEROSAY #~^$objontop~___weight

  IF ( ${self.state.onme} == 0 ) {
    SET ${self.state.onme} 1
    PLAYANIM ACTION1
    SENDEVENT CUSTOM ${eventBus.ref} "${id}.pressed"
  }
  ACCEPT
}
  `
  }, ref)

  return ref
}
