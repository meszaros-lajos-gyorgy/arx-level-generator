import { addScript, createItem, items } from '../../../assets/items'
import { declare, FALSE, getInjections, TRUE } from '../../../scripting'

export const createPressurePlate = (id, eventBus) => {
  const ref = createItem(items.mechanisms.pressurePlate)

  declare('bool', 'onMe', FALSE, ref)

  addScript((self) => {
    return `
// component: island.${id}
ON INIT {
  SETSCALE 101
  ${getInjections('init', self)}
  ACCEPT
}

ON INITEND {
  TIMERontop -im 0 100 GOTO TOP
  ACCEPT
}

>>TOP {
  IF ( ^$OBJONTOP == "NONE" ) {
    IF ( ${self.state.onMe} == ${TRUE} ) {
      SET ${self.state.onMe} ${FALSE}
      PLAYANIM ACTION2
      SENDEVENT CUSTOM ${eventBus.ref} "${id}.released"
    }
    ACCEPT
  }

  // HEROSAY ^$OBJONTOP
  // HEROSAY #~^$objontop~___weight

  IF ( ${self.state.onMe} == ${FALSE} ) {
    SET ${self.state.onMe} ${TRUE}
    PLAYANIM ACTION1
    SENDEVENT CUSTOM ${eventBus.ref} "${id}.pressed"
  }
  ACCEPT
}
  `
  }, ref)

  return ref
}
