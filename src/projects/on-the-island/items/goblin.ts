import { compose } from 'ramda'
import {
  addScript,
  items,
  createItem,
  markAsUsed,
  moveTo,
} from '../../../assets/items'
import { getInjections } from '../../../scripting'
import { RotationVector3 } from 'src/types'

export const createGoblin = (
  pos,
  angle: RotationVector3 = [0, 0, 0],
  props = {},
) => {
  return compose(
    markAsUsed,
    moveTo({ type: 'relative', coords: pos }, angle),
    addScript((self) => {
      return `
// component: goblin
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}
      `
    }),
    createItem,
  )(items.npc.goblin, props)
}
