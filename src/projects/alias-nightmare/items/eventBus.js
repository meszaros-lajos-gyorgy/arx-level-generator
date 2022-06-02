import { addScript, createItem, items } from '../../../assets/items'
import { declare, getInjections } from '../../../scripting'

export const createEventBus = (gates) => {
  const ref = createItem(items.marker)

  addScript((self) => {
    return `
  // component: island.eventBus
  ON INIT {
    ${getInjections('init', self)}
    ACCEPT
  }
  
  ON CUSTOM {
    if ("pp0." isin ^$PARAM1) {
      if ("pressed" isin ^$PARAM1) {
        sendevent raise ${gates.north.ref} nop
        sendevent raise ${gates.west.ref} nop
      } else {
        sendevent lower ${gates.north.ref} nop
        sendevent lower ${gates.west.ref} nop
      }
    }
  
    if ("pp1." isin ^$PARAM1) {
      if ("pressed" isin ^$PARAM1) {
        sendevent raise ${gates.north.ref} nop
        sendevent raise ${gates.east.ref} nop
      } else {
        sendevent lower ${gates.north.ref} nop
        sendevent lower ${gates.east.ref} nop
      }
    }
  
    if ("pp2." isin ^$PARAM1) {
      if ("pressed" isin ^$PARAM1) {
        sendevent raise ${gates.south.ref} nop
        sendevent raise ${gates.west.ref} nop
      } else {
        sendevent lower ${gates.south.ref} nop
        sendevent lower ${gates.west.ref} nop
      }
    }
  
    if ("pp3." isin ^$PARAM1) {
      if ("pressed" isin ^$PARAM1) {
        sendevent raise ${gates.south.ref} nop
        sendevent raise ${gates.east.ref} nop
      } else {
        sendevent lower ${gates.south.ref} nop
        sendevent lower ${gates.east.ref} nop
      }
    }

    ACCEPT
  }
    `
  }, ref)

  return ref
}
