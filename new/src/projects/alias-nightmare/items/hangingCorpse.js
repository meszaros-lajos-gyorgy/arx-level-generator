import {
  addScript,
  createItem,
  items,
  markAsUsed,
  moveTo,
} from '../../../assets/items'
import { getInjections } from '../../../scripting'

export const createHangingCorpse = (pos, angle = [0, 0, 0], props = {}) => {
  const ref = createItem(items.corpse.hanging, {
    hp: 0,
    ...props,
  })

  addScript((self) => {
    return `
// component: hangingCorpse
ON INIT {
  ${getInjections('init', self)}
  INVENTORY CREATE
  INVENTORY SKIN "ingame_inventory_corpse"
  INVENTORY ADD "jewelry\\gold_coin\\gold_coin"
  ACCEPT
}

ON DIE {
  REFUSE
}
    `
  }, ref)

  moveTo({ type: 'relative', coords: pos }, angle, ref)
  markAsUsed(ref)

  return ref
}
