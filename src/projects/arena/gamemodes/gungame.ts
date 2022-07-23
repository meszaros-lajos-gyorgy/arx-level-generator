// everyone is against everyone
// we have a list of weapons with increasing damage
// 2 kills will level you up and you get the next tier weapon
// killing with bare fists result in stealing a level from the enemy (same as knife in gungame)
// the last level will be fists only (same as knife in gungame)
// score board?
// whoever kills 2 with bare hands will win

import {
  addScript,
  createItem,
  items,
  markAsUsed,
  moveTo,
} from '../../../assets/items'
import { getInjections } from '../../../scripting'
import { RelativeCoords } from '../../../types'

// different spawn/respawn points - respawnCtrl should handle it?
// random NPC names?

// https://wiki.arx-libertatis.org/Script:setweapon

type WeaponData = {
  weapon: string
  damage: number
}

export const tiers: WeaponData[] = [
  {
    weapon: 'bone_weap',
    damage: 1,
  },
  {
    weapon: 'dagger',
    damage: 2,
  },
  {
    weapon: 'club',
    damage: 3,
  },
  {
    weapon: 'short_sword',
    damage: 4,
  },
  {
    weapon: 'long_sword',
    damage: 5,
  },
  {
    weapon: 'sabre',
    damage: 6,
  },
  {
    weapon: 'long_sword_ciprian',
    damage: 7,
  },
  {
    // TODO: need quiver (weapons/arrows/arrows)
    weapon: 'bow',
    damage: 6,
  },
]

export const createGungameController = (pos: RelativeCoords) => {
  const ref = createItem(items.marker, {})

  const startingTier = tiers[3]

  addScript(
    `
// component: GunGame
ON INIT {
  ${getInjections('init', ref)}
  ACCEPT
}

ON INITEND {
  TIMERgameStart -m 1 3000 GOTO RESET_WEAPONS
  ACCEPT
}

>>RESET_WEAPONS {
  SENDEVENT CHANGE_WEAPON player "${startingTier.weapon} ${startingTier.damage}"
  SENDEVENT -g bot CHANGE_WEAPON "${startingTier.weapon} ${startingTier.damage}"
  ACCEPT
}
  `,
    ref,
  )

  // TODO: when the npc or player dies it drops it's weapon

  moveTo(pos, [0, 0, 0], ref)
  markAsUsed(ref)

  return ref
}
