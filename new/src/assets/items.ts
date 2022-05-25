import path from 'path'
import { clone, uniq } from '../faux-ramda'
import { declare } from '../scripting'
import {
  RelativeCoords,
  RotationVector3,
  RotationVertex3,
  Vertex3,
} from '../types'
import { getRootPath } from '../../rootpath'
import { PLAYER_HEIGHT_ADJUSTMENT } from '../constants'

export type InjectableProps = {
  name?: string
  speed?: number
  scale?: number
  hp?: number
  interactive?: boolean
  collision?: boolean
  variant?: string
}

export type RenderedInjectableProps = {
  init?: string[]
}

export type ItemRef = {
  src: string
  id: 'root' | number
  state: Record<string, any>
  injections: RenderedInjectableProps
  ref: string
}

export type Dependency = string | { source: string; target: string }

export type RootItem = {
  filename: string
  used: boolean
  identifier: 'root'
  script: string
  dependencies: Dependency[]
}

export type Item = {
  filename: string
  used: boolean
  identifier: number
  pos: Vertex3
  angle: RotationVertex3
  script: string
  flags: number
  dependencies: Dependency[]
}

export type ItemDefinition = {
  src: string
  native: boolean
  dependencies?: string[]
  props?: InjectableProps
}

// TODO: this should come from arx-level-json-converter
export type DlfInteractiveObject = {
  name: string
  pos: Vertex3
  angle: RotationVertex3
  identifier: number
  flags: number
}

export const items = {
  marker: {
    src: 'system/marker/marker.teo',
    native: true,
  },
  plants: {
    fern: {
      src: 'items/magic/fern/fern.teo',
      native: true,
    },
  },
  torch: {
    src: 'items/provisions/torch/torch.teo',
    native: true,
  },
  mechanisms: {
    pressurePlate: {
      src: 'fix_inter/pressurepad_gob/pressurepad_gob.teo',
      native: true,
    },
  },
  signs: {
    stone: {
      src: 'fix_inter/public_notice/public_notice.teo',
      native: true,
    },
  },
  keys: {
    oliverQuest: {
      src: 'items/quest_item/key_oliverquest/key_oliverquest.teo',
      native: true,
    },
  },
  doors: {
    portcullis: {
      src: 'fix_inter/porticullis/porticullis.teo',
      native: true,
    },
    ylside: {
      src: 'fix_inter/door_ylsides/door_ylsides.teo', // non functional
      native: true,
    },
    lightDoor: {
      src: 'fix_inter/light_door/light_door.teo',
      native: true,
    },
  },
  corpse: {
    hanging: {
      src: 'npc/tortured_corpse/tortured_corpse.teo',
      native: true,
    },
  },
  questItems: {
    mirror: {
      src: 'items/quest_item/mirror/mirror.teo',
      native: true,
    },
  },
  magic: {
    rune: {
      src: 'items/magic/rune_aam/rune_aam.teo',
      native: true,
    },
    potion: {
      mana: {
        src: 'items/magic/potion_mana/potion_mana.teo',
        native: true,
      },
    },
    amikarsRock: {
      src: 'items/quest_item/rock_amikar/rock_amikar.teo',
      native: true,
    },
  },
  npc: {
    statue: {
      src: 'npc/statue/statue.teo',
      native: false,
      dependencies: [
        'game/graph/obj3d/interactive/npc/statue/statue.ftl',
        'graph/obj3d/anims/npc/statue_rotate.tea',
        'graph/obj3d/anims/npc/statue_wait_1.tea',
        'graph/obj3d/anims/npc/statue_wait_2.tea',
        'graph/obj3d/anims/npc/statue_wait_3.tea',
        'graph/obj3d/anims/npc/statue_wait_4.tea',
        'graph/obj3d/anims/npc/statue_wait.tea',
        'graph/obj3d/textures/demon_statue.jpg',
      ],
    },
    player: {
      src: 'player/player.teo',
      native: true,
    },
    goblin: {
      src: 'npc/goblin_base/goblin_base.teo',
      native: true,
    },
    flyingCreature: {
      src: 'npc/flying_creature/flying_creature.teo',
      native: true,
    },
    lich: {
      src: 'npc/undead_liche/undead_liche.teo',
      native: true,
    },
    akbaa: {
      src: 'npc/akbaa_phase2/akbaa_phase2.teo',
      native: true,
    },
    ylside: {
      src: 'npc/human_base/human_base.teo',
      native: true,
      props: {
        variant: 'human_ylside',
      },
    },
    chicken: {
      src: 'npc/chicken_base/chicken_base.teo',
      native: true,
    },
  },
  shape: {
    cube: {
      src: 'fix_inter/polytrans/polytrans.teo',
      native: true,
    },
  },
  containers: {
    barrel: {
      src: 'fix_inter/barrel/barrel.teo',
      native: true,
    },
  },
  fishSpawn: {
    src: 'fix_inter/fish_spawn/fish_spawn.teo',
    native: true,
  },
  misc: {
    rope: {
      src: 'items/provisions/rope/rope.teo',
      native: true,
    },
    pole: {
      src: 'items/provisions/pole/pole.teo',
      native: true,
    },
    deckOfCards: {
      src: 'items/movable/cards/card.teo',
      native: true,
    },
    campfire: {
      src: 'fix_inter/fire_camp/fire_camp.teo',
      native: true,
    },
  },
}

const usedItems: Record<string, Item[] & { root?: RootItem }> = {}

const propsToInjections = (props: InjectableProps): RenderedInjectableProps => {
  const init: string[] = []

  if (props.name) {
    init.push(`SETNAME "${props.name}"`)
  }
  if (props.speed) {
    init.push(`SETSPEED ${props.speed}`)
  }
  if (props.scale) {
    init.push(`SETSCALE ${props.scale * 100}`)
  }
  if (props.hp) {
    init.push(`SET_NPC_STAT life ${props.hp}`)
  }
  if (typeof props.interactive === 'boolean') {
    init.push(`SET_INTERACTIVITY ${props.interactive ? 'ON' : 'NONE'}`)
  }
  if (typeof props.collision === 'boolean') {
    init.push(`COLLISION ${props.collision ? 'ON' : 'OFF'}`)
  }
  if (props.variant) {
    const tmpScope = {
      state: {},
      injections: {
        init: [],
      },
    }
    declare('string', 'type', props.variant, tmpScope)
    init.push(...tmpScope.injections.init)
  }

  if (init.length) {
    return {}
  } else {
    return { init }
  }
}

export const createItem = (
  item: ItemDefinition,
  props: InjectableProps = {},
): ItemRef => {
  if (typeof usedItems[item.src] === 'undefined') {
    usedItems[item.src] = []
  }

  const id = usedItems[item.src].length

  const itemInstance: Item = {
    filename: item.src,
    used: false,
    identifier: id + 1,
    pos: { x: 0, y: 0, z: 0 },
    angle: { a: 0, b: 0, g: 0 },
    script: '',
    flags: 0,
    dependencies: [...(item.dependencies ?? [])],
  }

  usedItems[item.src].push(itemInstance)

  const { name } = path.parse(item.src)
  const numericId = (id + 1).toString().padStart(4, '0')

  return {
    src: item.src,
    id,
    state: {}, // container for script variables
    injections: propsToInjections({ ...item.props, ...props }),
    ref: `${name}_${numericId}`,
  }
}

export const createRootItem = (
  item: ItemDefinition,
  props: InjectableProps = {},
): ItemRef => {
  if (typeof usedItems[item.src] === 'undefined') {
    usedItems[item.src] = []
  }

  const rootItem: RootItem = {
    filename: item.src,
    used: false,
    identifier: 'root',
    script: '',
    dependencies: [...(item.dependencies ?? [])],
  }

  usedItems[item.src].root = rootItem

  const { name } = path.parse(item.src)

  return {
    src: item.src,
    id: 'root',
    state: {}, // container for script variables
    injections: propsToInjections({ ...item.props, ...props }),
    ref: `${name}_root`,
  }
}

export const addDependency = (dependency, itemRef: ItemRef) => {
  const { src, id } = itemRef

  // @ts-ignore
  usedItems[src][id].dependencies.push(dependency)

  return itemRef
}

export const addDependencyAs = (
  source: string,
  target: string,
  itemRef: ItemRef,
) => {
  const { src, id } = itemRef

  // @ts-ignore
  usedItems[src][id].dependencies.push({
    source,
    target,
  })

  return itemRef
}

export const addScript = (
  script: string | ((self: ItemRef) => string),
  itemRef: ItemRef,
) => {
  const { src, id } = itemRef

  // @ts-ignore
  usedItems[src][id].script =
    (usedItems[src] &&
    usedItems[src][id] &&
    // @ts-ignore
    usedItems[src][id].script
      ? // @ts-ignore
        usedItems[src][id].script
      : '') +
    '\r\n' +
    '\r\n' +
    (typeof script === 'function' ? script(itemRef) : script).trim()

  return itemRef
}

export const moveTo = (
  { coords: [x, y, z] }: RelativeCoords,
  [a, b, g]: RotationVector3,
  itemRef: ItemRef,
) => {
  const { src, id } = itemRef

  // @ts-ignore
  usedItems[src][id].pos = { x, y, z }
  // @ts-ignore
  usedItems[src][id].angle = { a, b, g }

  return itemRef
}

export const whereIs = (itemRef: ItemRef): ItemRef => {
  const { src, id } = itemRef

  // @ts-ignore
  return clone(usedItems[src][id].pos)
}

export const markAsUsed = (itemRef: ItemRef) => {
  const { src, id } = itemRef

  // @ts-ignore
  usedItems[src][id].used = true
  if (usedItems[src].root) {
    // @ts-ignore
    usedItems[src].root.used = true
  }

  return itemRef
}

// source: https://stackoverflow.com/a/40011873/1806628
const capitalize = (str: string) => {
  const firstLetter = str[0].toUpperCase()
  const restOfTheString = str.slice(1)
  return firstLetter + restOfTheString
}

// asd/asd.teo -> Asd\\Asd.teo
const arxifyFilename = (filename: string) => {
  return filename.split('/').map(capitalize).join('\\')
}

export const exportUsedItems = (mapData: any) => {
  const { spawn } = mapData.state

  const copyOfUsedItems = clone(usedItems)

  const itemInstances: (Item | RootItem)[] = Object.values(
    copyOfUsedItems,
  ).flatMap((itemInstance) => Object.values(itemInstance))

  const itemsToBeExported = itemInstances.filter(({ identifier, used }) => {
    return identifier !== 'root' && used === true
  }) as Item[]

  mapData.dlf.interactiveObjects = itemsToBeExported.map(
    ({ filename, pos, angle, identifier, flags }): DlfInteractiveObject => {
      return {
        name: 'C:\\ARX\\Graph\\Obj3D\\Interactive\\' + arxifyFilename(filename),
        pos: {
          x: pos.x - spawn[0],
          y: pos.y - spawn[1] + PLAYER_HEIGHT_ADJUSTMENT,
          z: pos.z - spawn[2],
        },
        angle,
        identifier,
        flags,
      }
    },
  )
}

export const exportScripts = (outputDir: string) => {
  const copyOfUsedItems = clone(usedItems)

  const itemInstances: (Item | RootItem)[] = Object.values(
    copyOfUsedItems,
  ).flatMap((itemInstance) => Object.values(itemInstance))

  const scriptsToBeExported: Record<string, string> = {}

  return itemInstances
    .filter(({ used }) => used === true)
    .reduce((files, item) => {
      const { dir, name } = path.parse(item.filename)

      let filename: string
      if (item.identifier === 'root') {
        filename = `${outputDir}/graph/obj3d/interactive/${dir}/${name}.asl`
      } else {
        const id = item.identifier.toString().padStart(4, '0')
        filename = `${outputDir}/graph/obj3d/interactive/${dir}/${name}_${id}/${name}.asl`
      }
      files[filename] = item.script

      return files
    }, scriptsToBeExported)
}

export const exportDependencies = (outputDir: string) => {
  const copyOfUsedItems = clone(usedItems)

  const itemInstances: (Item | RootItem)[] = Object.values(
    copyOfUsedItems,
  ).flatMap((itemInstance) => Object.values(itemInstance))

  const dependencies = itemInstances
    .filter(({ used }) => used === true)
    .flatMap(({ dependencies }) => dependencies)

  const uniqDependencies = uniq(dependencies)

  const filesToBeExported: Record<string, string> = {}

  return uniqDependencies.reduce((files, dependency) => {
    if (typeof dependency === 'object') {
      const { target, source } = dependency
      const { dir: dir1, name: name1, ext: ext1 } = path.parse(target)
      const { dir: dir2, name: name2, ext: ext2 } = path.parse(source)
      files[
        `${outputDir}/${dir1}/${name1}${ext1}`
      ] = `${getRootPath()}/assets/${dir2}/${name2}${ext2}`
    } else {
      const { dir, name, ext } = path.parse(dependency)
      const target = `${outputDir}/${dir}/${name}${ext}`
      files[target] = `${getRootPath()}/assets/${dir}/${name}${ext}`
    }

    return files
  }, filesToBeExported)
}

export const resetItems = () => {
  // https://bobbyhadz.com/blog/javascript-clear-object-delete-all-properties#clear-an-object-in-javascript
  for (const key in usedItems) {
    delete usedItems[key]
  }
}
