import { clone, uniq } from '../faux-ramda'
import { MapData } from '../helpers'
import { getRootPath } from '../rootpath'
import { POLY_QUAD, POLY_TRANS, POLY_NO_SHADOW, POLY_WATER } from '../constants'

export type TextureDefinition = {
  src: string
  native: boolean
  width?: number
  height?: number
  path?: string
  flags?: number
}

export type Texture = TextureDefinition

export const textures = {
  none: null,
  gravel: {
    ground1: {
      src: 'L5_CAVES_[GRAVEL]_GROUND05',
      native: true,
    },
  },
  wood: {
    aliciaRoomMur02: {
      src: '[WOOD]_ALICIAROOM_MUR02.jpg',
      native: true,
    },
  },
  stone: {
    humanWall1: {
      src: '[STONE]_HUMAN_STONE_WALL1.jpg',
      native: true,
    },
    akbaa4f: {
      src: '[STONE]_HUMAN_AKBAA4_F.jpg',
      native: true,
    },
    humanPriest4: {
      src: '[STONE]_HUMAN_PRIEST4.jpg',
      native: true,
    },
    stairs: {
      src: '[STONE]_HUMAN_STONE_ORNAMENT.jpg',
      native: true,
      width: 256,
      height: 256,
    },
  },
  skybox: {
    top: {
      src: 'skybox_01_top.jpg',
      native: false,
    },
    left: {
      src: 'skybox_01_left.jpg',
      native: false,
    },
    right: {
      src: 'skybox_01_right.jpg',
      native: false,
    },
    front: {
      src: 'skybox_01_front.jpg',
      native: false,
    },
    back: {
      src: 'skybox_01_back.jpg',
      native: false,
    },
    bottom: {
      src: 'skybox_01_bottom.jpg',
      native: false,
    },
  },
  backrooms: {
    wall: {
      path: 'projects/the-backrooms/textures',
      src: 'backrooms-[stone]-wall.jpg',
      native: false,
    },
    wall2: {
      path: 'projects/the-backrooms/textures',
      src: 'backrooms-[stone]-wall2.jpg',
      native: false,
    },
    carpet: {
      path: 'projects/the-backrooms/textures',
      src: 'backrooms-[fabric]-carpet.jpg',
      native: false,
    },
    carpetDirty: {
      path: 'projects/the-backrooms/textures',
      src: 'backrooms-[fabric]-carpet-dirty.jpg',
      native: false,
    },
    carpet2: {
      path: 'projects/the-backrooms/textures',
      src: 'backrooms-[fabric]-carpet2.jpg',
      native: false,
    },
    ceiling: {
      path: 'projects/the-backrooms/textures',
      src: 'backrooms-[stone]-ceiling-tile.jpg',
      native: false,
    },
    ceilingDiffuser: {
      path: 'projects/the-backrooms/textures',
      src: 'backrooms-[metal]-ceiling-air-diffuser.jpg',
      native: false,
    },
    ceilingLampOn: {
      path: 'projects/the-backrooms/textures',
      src: 'backrooms-[metal]-light-on.jpg',
      native: false,
    },
    ceilingLampOff: {
      path: 'projects/the-backrooms/textures',
      src: 'backrooms-[metal]-light-off.jpg',
      native: false,
    },
    moldEdge: {
      path: 'projects/the-backrooms/textures',
      src: 'mold-edge.jpg',
      native: false,
      flags: POLY_QUAD | POLY_TRANS | POLY_NO_SHADOW,
    },
  },
  water: {
    cave: {
      src: '(WATER)CAVEWATER.jpg',
      native: true,
      flags: POLY_QUAD | POLY_NO_SHADOW | POLY_WATER | POLY_TRANS,
    },
  },
}

let usedTextures: Texture[] = []

export const useTexture = (texture: TextureDefinition | null) => {
  if (texture === textures.none) {
    return 0
  }

  if (!usedTextures.includes(texture)) {
    usedTextures.push(texture)
  }

  return usedTextures.indexOf(texture) + 1
}

export const createTextureContainers = (mapData: any) => {
  mapData.fts.textureContainers = usedTextures.map((texture, idx) => {
    return {
      tc: idx + 1,
      temp: 0,
      fic: `GRAPH\\OBJ3D\\TEXTURES\\${texture.src}`,
    }
  })
}

export const exportTextures = (outputDir: string) => {
  const copyOfUsedTextures = clone(usedTextures)
  const customTextures = copyOfUsedTextures.filter(
    ({ native }) => native === false,
  )
  const texturesToBeExported = uniq(customTextures)

  return texturesToBeExported.reduce((files, texture) => {
    const filename = `${outputDir}/graph/obj3d/textures/${texture.src}`
    files[filename] = `${getRootPath()}/assets/${
      texture.path ?? 'graph/obj3d/textures'
    }/${texture.src}`

    return files
  }, {} as Record<string, string>)
}

export const resetTextures = () => {
  usedTextures = []
}
