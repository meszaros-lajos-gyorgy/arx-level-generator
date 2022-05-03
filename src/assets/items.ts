import path from 'path'
import {
  map,
  values,
  compose,
  unnest,
  clone,
  join,
  juxt,
  toUpper,
  head,
  tail,
  reduce,
  toString,
  propEq,
  filter,
  curry,
  isEmpty,
  reject,
  pluck,
  uniq,
} from 'ramda'
import { padCharsStart } from 'ramda-adjunct'
import { declare } from '../scripting'
import {
  KVPair,
  RecursiveKVPair,
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

export type RootItem = {
  filename: string
  used: boolean
  identifier: 'root'
  script: string
  dependencies: string[]
}

export type Item = {
  filename: string
  used: boolean
  identifier: number
  pos: Vertex3
  angle: RotationVertex3
  script: string
  flags: number
  dependencies: string[]
}

export type ItemDefinition = {
  src: string
  native: boolean
  dependencies?: string[]
  props?: InjectableProps
}

export const items: RecursiveKVPair<ItemDefinition> = {
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

// TODO: make this more specific
let usedItems: KVPair<any> = {}

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

  if (isEmpty(init)) {
    return {}
  } else {
    return { init }
  }
}

export const createItem = (
  item: ItemDefinition,
  props: InjectableProps = {},
): ItemRef => {
  usedItems[item.src] = usedItems[item.src] || []

  const id = usedItems[item.src].length

  usedItems[item.src].push({
    filename: item.src,
    used: false,
    identifier: id + 1,
    pos: { x: 0, y: 0, z: 0 },
    angle: { a: 0, b: 0, g: 0 },
    script: '',
    flags: 0,
    dependencies: [...(item.dependencies ?? [])],
  })

  const { name } = path.parse(item.src)
  const numericId = padCharsStart('0', 4, toString(id + 1))

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
  usedItems[item.src] = usedItems[item.src] || []

  usedItems[item.src].root = {
    filename: item.src,
    used: false,
    identifier: 'root',
    script: '',
    dependencies: [...(item.dependencies ?? [])],
  }

  const { name } = path.parse(item.src)

  return {
    src: item.src,
    id: 'root',
    state: {}, // container for script variables
    injections: propsToInjections({ ...item.props, ...props }),
    ref: `${name}_root`,
  }
}

export const addDependency = curry((dependency, itemRef: ItemRef) => {
  const { src, id } = itemRef

  usedItems[src][id].dependencies.push(dependency)

  return itemRef
})

export const addDependencyAs = curry((source, target, itemRef: ItemRef) => {
  const { src, id } = itemRef

  usedItems[src][id].dependencies.push({
    source,
    target,
  })

  return itemRef
})

export const addScript = curry(
  (script: string | ((self: ItemRef) => string), itemRef: ItemRef) => {
    const { src, id } = itemRef

    usedItems[src][id].script =
      (usedItems &&
      usedItems[src] &&
      usedItems[src][id] &&
      usedItems[src][id].script
        ? usedItems[src][id].script
        : '') +
      '\r\n' +
      '\r\n' +
      (typeof script === 'function' ? script(itemRef) : script).trim()

    return itemRef
  },
)

export const moveTo = curry(
  (
    { coords: [x, y, z] }: RelativeCoords,
    [a, b, g]: RotationVector3,
    itemRef: ItemRef,
  ) => {
    const { src, id } = itemRef

    usedItems[src][id].pos = { x, y, z }
    usedItems[src][id].angle = { a, b, g }

    return itemRef
  },
)

export const whereIs = (itemRef: ItemRef): ItemRef => {
  const { src, id } = itemRef

  return clone(usedItems[src][id].pos)
}

export const markAsUsed = (itemRef: ItemRef) => {
  const { src, id } = itemRef

  usedItems[src][id].used = true
  if (usedItems[src].root) {
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

export const exportUsedItems = (mapData) => {
  const { spawn } = mapData.state

  const copyOfUsedItems = clone(usedItems)

  mapData.dlf.interactiveObjects = compose(
    map((item) => {
      item.name =
        'C:\\ARX\\Graph\\Obj3D\\Interactive\\' + arxifyFilename(item.filename)
      delete item.filename
      delete item.script

      item.pos.x -= spawn[0]
      item.pos.y -= spawn[1] + PLAYER_HEIGHT_ADJUSTMENT
      item.pos.z -= spawn[2]

      return item
    }),
    filter(propEq('used', true)),
    reject(propEq('identifier', 'root')),
    unnest,
    map(values),
    values,
  )(copyOfUsedItems)
}

export const exportScripts = (outputDir: string) => {
  const copyOfUsedItems = clone(usedItems)

  return compose(
    reduce((files, item) => {
      const { dir, name } = path.parse(item.filename)

      let filename
      if (item.identifier === 'root') {
        filename = `${outputDir}/graph/obj3d/interactive/${dir}/${name}.asl`
      } else {
        const id = padCharsStart('0', 4, toString(item.identifier))
        filename = `${outputDir}/graph/obj3d/interactive/${dir}/${name}_${id}/${name}.asl`
      }
      files[filename] = item.script

      return files
    }, {}),
    filter(propEq('used', true)),
    unnest,
    map(values),
    values,
  )(copyOfUsedItems)
}

export const exportDependencies = (outputDir: string) => {
  return compose(
    reduce((files, filename) => {
      if (typeof filename === 'object') {
        const {
          dir: dir1,
          name: name1,
          ext: ext1,
        } = path.parse(filename.target as string)
        const {
          dir: dir2,
          name: name2,
          ext: ext2,
        } = path.parse(filename.source as string)
        files[
          `${outputDir}/${dir1}/${name1}${ext1}`
        ] = `${getRootPath()}/assets/${dir2}/${name2}${ext2}`
      } else {
        const { dir, name, ext } = path.parse(filename)
        const target = `${outputDir}/${dir}/${name}${ext}`
        files[target] = `${getRootPath()}/assets/${dir}/${name}${ext}`
      }

      return files
    }, {}),
    uniq,
    unnest,
    pluck('dependencies'),
    filter(propEq('used', true)),
    unnest,
    map(values),
    values,
    clone,
  )(usedItems)
}

export const resetItems = () => {
  usedItems = {}
}
