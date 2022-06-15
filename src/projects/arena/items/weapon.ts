import {
  addScript,
  createItem,
  createRootItem,
  markAsUsed,
  moveTo,
} from '../../../assets/items'
import { declare, getInjections } from '../../../scripting'
import { RotationVector3, Vector3 } from '../../../types'

const itemDesc = {
  src: 'items/weapons/weapon.ftl',
  native: true,
}

export const defineWeapon = () => {
  const ref = createRootItem(itemDesc, {})

  declare('string', 'type', 'club', ref)

  addScript((self) => {
    return `
// component: weapon
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}

ON INITEND {
  ${getInjections('initend', self)}

  IF (${self.state.type} == "dagger") {
    USEMESH "dagger/dagger.teo"
  }
  IF (${self.state.type} == "club") {
    USEMESH "club/club.teo"
  }
  IF (${self.state.type} == "shortSword") {
    USEMESH "short_sword/short_sword.teo"
  }

  ACCEPT
}
    `
  }, ref)

  return ref
}

type WeaponProps = {
  type?: string
}

export const createWeapon = (
  pos: Vector3,
  angle: RotationVector3 = [0, 0, 0],
  config: WeaponProps = {},
) => {
  const ref = createItem(itemDesc, {})

  declare('string', 'type', config.type ?? 'club', ref)

  addScript((self) => {
    return `
// component: weapon
ON INIT {
  ${getInjections('init', self)}
  ACCEPT
}

ON INITEND {
  ${getInjections('initend', self)}
  ACCEPT
}
    `
  }, ref)

  moveTo({ type: 'relative', coords: pos }, angle, ref)
  markAsUsed(ref)

  return ref
}
