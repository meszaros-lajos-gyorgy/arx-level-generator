// flags for polygons
export const POLY_NO_SHADOW = 0x1
export const POLY_DOUBLESIDED = 0x2
export const POLY_TRANS = 0x4
export const POLY_WATER = 0x8
export const POLY_GLOW = 0x10
export const POLY_IGNORE = 0x20
export const POLY_QUAD = 0x40
export const POLY_TILED = 0x80 // unused
export const POLY_METAL = 0x100
export const POLY_HIDE = 0x200
export const POLY_STONE = 0x400
export const POLY_WOOD = 0x800
export const POLY_GRAVEL = 0x1000
export const POLY_EARTH = 0x2000
export const POLY_NOCOL = 0x4000
export const POLY_LAVA = 0x8000
export const POLY_CLIMB = 0x10000
export const POLY_FALL = 0x20000
export const POLY_NOPATH = 0x40000
export const POLY_NODRAW = 0x80000
export const POLY_PRECISE_PATH = 0x100000
export const POLY_NO_CLIMB = 0x200000 // unused
export const POLY_ANGULAR = 0x400000 // unused
export const POLY_ANGULAR_IDX0 = 0x800000 // unused
export const POLY_ANGULAR_IDX1 = 0x1000000 // unused
export const POLY_ANGULAR_IDX2 = 0x2000000 // unused
export const POLY_ANGULAR_IDX3 = 0x4000000 // unused
export const POLY_LATE_MIP = 0x8000000

// flags for lighting
export const EXTRAS_SEMIDYNAMIC = 0x1
export const EXTRAS_EXTINGUISHABLE = 0x2
export const EXTRAS_STARTEXTINGUISHED = 0x4
export const EXTRAS_SPAWNFIRE = 0x8
export const EXTRAS_SPAWNSMOKE = 0x10
export const EXTRAS_OFF = 0x20
export const EXTRAS_COLORLEGACY = 0x40
export const EXTRAS_NOCASTED = 0x80 // unused
export const EXTRAS_FIXFLARESIZE = 0x100
export const EXTRAS_FIREPLACE = 0x200
export const EXTRAS_NO_IGNIT = 0x400 // = it will not react to player casting ignite spell. douse will still work!
export const EXTRAS_FLARE = 0x800

// zone.flags
export const PATH_AMBIANCE = 0x02
export const PATH_RGB = 0x04
export const PATH_FARCLIP = 0x08

export const HFLIP = 0x100
export const VFLIP = 0x200

export const MAP_MAX_WIDTH = 160
export const MAP_MAX_HEIGHT = 160

// in the quest book's map view the coordinates 0/0 and 16000/16000 end up forming a 472x472 square, which is too big
// based on what fits on one page and taking in account the fact, that 0/0 is positioned from the edge of the book
// with a left padding of 20 pixels and a top padding of 98 pixels: if we crop the same amount from the bottom and
// the middle of the book we are left with a 377x337 rectangle. This rectangle is able to display the player anywhere
// within a 12780/11424 size map:
// width = 16000 * 377 / 472 = 12779.661016949
// height = 16000 * 337 / 472 = 11423.728813559
export const MAP_WIDTH = 127.8
export const MAP_HEIGHT = 114.24

export const PLAYER_HEIGHT_ADJUSTMENT = -140

export const ISLAND_JOINT_LENGTH = 5
export const ISLAND_JOINT_WIDTH = 3
