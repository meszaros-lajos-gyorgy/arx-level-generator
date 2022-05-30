import {
  createItem,
  addScript,
  createRootItem,
  moveTo,
  markAsUsed,
} from '../../../assets/items'
import { useTexture, textures } from '../../../assets/textures'
import { getInjections } from '../../../scripting'

const itemDesc = {
  src: 'fix_inter/ceiling_diffuser/ceiling_diffuser.teo',
  native: true,
}

export const defineCeilingDiffuser = () => {
  useTexture(textures.backrooms.ceilingDiffuser)

  const ref = createRootItem(itemDesc, {
    name: 'Ceiling Diffuser',
    interactive: false,
    scale: 0.6,
    mesh: 'polytrans/polytrans.teo',
  })

  addScript((self) => {
    return `
// component: ceilingDiffuser
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}

ON INITEND {
  ${getInjections('initend', self)}
  TWEAK SKIN "[stone]_ground_caves_wet05" "backrooms-[metal]-ceiling-air-diffuser"
  ACCEPT
}
    `
  }, ref)

  return ref
}

export const createCeilingDiffuser = (pos, angle = [0, 0, 0], config = {}) => {
  const ref = createItem(itemDesc, {})

  addScript((self) => {
    return `
// component: ceilingDiffuser
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
