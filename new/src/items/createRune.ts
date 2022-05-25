import { RotationVector3, Vector3 } from 'src/types'
import {
  items,
  markAsUsed,
  moveTo,
  createItem,
  addScript,
  ItemRef,
} from '../assets/items'
import { getInjections, declare } from '../scripting'

export const createRune = (
  runeName,
  pos: Vector3 | null = null,
  angle: RotationVector3 = [0, 0, 0],
  onEquipTarget?: ItemRef,
) => {
  const ref = createItem(items.magic.rune)

  declare('string', 'rune_name', runeName, ref)

  addScript((self) => {
    return `
// component: rune
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}

${
  onEquipTarget &&
  `
ON INVENTORYUSE {
  SENDEVENT GOT_RUNE ${onEquipTarget.ref} "${runeName}"
  ACCEPT
}
`
}
    `
  }, ref)

  if (pos !== null) {
    moveTo({ type: 'relative', coords: pos }, angle, ref)
  }

  markAsUsed(ref)

  return ref
}
