import {
  addScript,
  createItem,
  items,
  markAsUsed,
  moveTo,
} from '../../../assets/items'
import { getInjections } from '../../../scripting'

export const createSmellyFlower = (pos, angle = [0, 0, 0], props = {}) => {
  const ref = createItem(items.plants.fern, {
    name: 'Smelly flower',
    ...props,
  })

  addScript((self) => {
    return `
// component: smellyFlower
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
