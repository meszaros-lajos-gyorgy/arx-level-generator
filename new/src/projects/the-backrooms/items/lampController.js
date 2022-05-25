import {
  markAsUsed,
  moveTo,
  addScript,
  createItem,
  items,
} from '../../../assets/items'
import { getInjections } from '../../../scripting'

export const createLampController = (pos, lamps) => {
  const ref = createItem(items.marker)

  addScript((self) => {
    return `
// component lampController
ON INIT {
${getInjections('init', self)}
ACCEPT
}

ON SAVE {
${lamps.map(({ ref }) => `SENDEVENT SAVE ${ref} NOP`).join(`\n  `)}
ACCEPT
}

ON RESTORE {
${lamps.map(({ ref }) => `SENDEVENT RESTORE ${ref} NOP`).join(`\n  `)}
ACCEPT
}

ON ON {
${lamps.map(({ ref }) => `SENDEVENT ON ${ref} ~^$PARAM1~`).join(`\n  `)}
ACCEPT
}

ON OFF {
${lamps.map(({ ref }) => `SENDEVENT OFF ${ref} ~^$PARAM1~`).join(`\n  `)}
ACCEPT
}

ON RANDOM {
${lamps.map(({ ref }) => `SENDEVENT RANDOM ${ref} ~^$PARAM1~`).join(`\n  `)}
ACCEPT
}

ON MUTE {
${lamps.map(({ ref }) => `SENDEVENT MUTE ${ref} NOP`).join(`\n  `)}
ACCEPT
}

ON UNMUTE {
${lamps.map(({ ref }) => `SENDEVENT UNMUTE ${ref} NOP`).join(`\n  `)}
ACCEPT
}
    `
  }, ref)
  moveTo({ type: 'relative', coords: pos }, [0, 0, 0], ref)
  markAsUsed(ref)

  return ref
}
