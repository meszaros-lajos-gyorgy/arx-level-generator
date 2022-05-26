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
  const ref = createItem(items.npc.goblin, props)

  addScript((self) => {
    return `
// component: goblin
ON INIT {
${getInjections('init', self)}
ACCEPT
}
    `
  }, ref)

  moveTo({ type: 'relative', coords: pos }, angle, ref)
  markAsUsed(ref)

  return ref
}
