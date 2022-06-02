import {
  addScript,
  createItem,
  items,
  markAsUsed,
  moveTo,
} from '../../../assets/items'
import { declare, getInjections } from '../../../scripting'

export const createStone = (pos, angle = [0, 0, 0], props = {}) => {
  const weight = props.weight ?? 1

  const ref = createItem(items.misc.stone, {
    name: `a stone (weight = ${weight} kg)`,
    ...props,
  })

  declare('public int', 'weight', weight, ref)

  addScript((self) => {
    return `
// component: stone
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}
    `
  }, ref)

  // Arx Libertatis TODOs:
  //  - scale is not making the hitbox scale correctly
  //  - can the item move slower when heavier? (SET_WEIGHT purpose?)

  moveTo({ type: 'relative', coords: pos }, angle, ref)
  markAsUsed(ref)

  return ref
}
