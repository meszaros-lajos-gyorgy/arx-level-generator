import { times, repeat, clamp, uniq, isEven } from '../../faux-ramda'
import { textures } from '../../assets/textures'
import { HFLIP, VFLIP } from '../../constants'
import { setTexture, pickRandom, move, setColor } from '../../helpers'
import { plain, disableBumping } from '../../prefabs/plain'
import { UNIT } from './constants'
import wall from '../../prefabs/wall'

export const OCCUPIED = 1 << 0
export const CONNECT_LEFT = 1 << 1
export const CONNECT_RIGHT = 1 << 2
export const CONNECT_TOP = 1 << 3
export const CONNECT_BOTTOM = 1 << 4
export const CONNECT_FRONT = 1 << 5
export const CONNECT_BACK = 1 << 6
export const CONNECT_X = CONNECT_LEFT | CONNECT_RIGHT
export const CONNECT_Y = CONNECT_TOP | CONNECT_BOTTOM
export const CONNECT_Z = CONNECT_FRONT | CONNECT_BACK
export const CONNECT_ALL = CONNECT_X | CONNECT_Y | CONNECT_Z

export const getRadius = (grid) => {
  const sizeX = (grid[0][0].length - 1) / 2
  const sizeY = (grid[0].length - 1) / 2
  const sizeZ = (grid.length - 1) / 2
  return [sizeX, sizeY, sizeZ]
}

const insertRoom = (
  originX,
  originY,
  originZ,
  width,
  height,
  depth,
  connectivity,
  grid,
) => {
  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        grid[originZ + z][originY + y][originX + x] = OCCUPIED | connectivity
      }
    }
  }
}

const addFirstRoom = (width, height, depth, connectivity, grid) => {
  const [radiusX, radiusY, radiusZ] = getRadius(grid)

  width = clamp(1, radiusX * 2 + 1, width)
  height = clamp(1, radiusY * 2 + 1, height)
  depth = clamp(1, radiusZ * 2 + 1, depth)

  const originX = radiusX - Math.floor(width / 2)
  const originY = radiusY - Math.floor(height / 2)
  const originZ = radiusZ - Math.floor(depth / 2)

  insertRoom(
    originX,
    originY,
    originZ,
    width,
    height,
    depth,
    connectivity,
    grid,
  )
}

const isEveryCellEmpty = (grid) => {
  const elementsInGrid = uniq(grid.flat(2))
  return elementsInGrid.length === 1 && elementsInGrid[0] === 0
}

// is the x/z position of the grid === 1 ?
export const isOccupied = (x, y, z, grid) => {
  if (typeof grid[z] === 'undefined') {
    return null
  }
  if (typeof grid[z][y] === 'undefined') {
    return null
  }
  if (typeof grid[z][y][x] === 'undefined') {
    return null
  }

  return grid[z][y][x] > 0
}

// starting from originX/originY/originZ does a width/height/depth sized rectangle only occupy 0 slots?
const canFitRoom = (originX, originY, originZ, width, height, depth, grid) => {
  for (let z = originZ; z < originZ + depth; z++) {
    for (let y = originY; y < originY + height; y++) {
      for (let x = originX; x < originX + width; x++) {
        if (isOccupied(x, y, z, grid) !== false) {
          return false
        }
      }
    }
  }

  return true
}

// is there a variation of a width/depth sized rectangle containing the position x/z which
// can occupy only 0 slots?
const canFitRoomAtPos = (x, y, z, width, height, depth, grid) => {
  for (let k = 0; k < depth; k++) {
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        if (canFitRoom(x - i, y - j, z - k, width, height, depth, grid)) {
          return true
        }
      }
    }
  }

  return false
}

// is the x/y/z slot surrounded by at least 1 slot containing > 0?
// (north/south/east/west/top/bottom, no diagonals)
const isConnected = (x, y, z, connectivity, grid) => {
  return (
    (isOccupied(x - 1, y, z, grid) &&
      connectivity & CONNECT_RIGHT &&
      grid[z][y][x - 1] & CONNECT_LEFT) ||
    (isOccupied(x + 1, y, z, grid) &&
      connectivity & CONNECT_LEFT &&
      grid[z][y][x + 1] & CONNECT_RIGHT) ||
    (isOccupied(x, y - 1, z, grid) &&
      connectivity & CONNECT_BOTTOM &&
      grid[z][y - 1][x] & CONNECT_TOP) ||
    (isOccupied(x, y + 1, z, grid) &&
      connectivity & CONNECT_TOP &&
      grid[z][y + 1][x] & CONNECT_BOTTOM) ||
    (isOccupied(x, y, z - 1, grid) &&
      connectivity & CONNECT_BACK &&
      grid[z - 1][y][x] & CONNECT_FRONT) ||
    (isOccupied(x, y, z + 1, grid) &&
      connectivity & CONNECT_FRONT &&
      grid[z + 1][y][x] & CONNECT_BACK)
  )
}

const getFittingVariants = (x, y, z, width, height, depth, grid) => {
  const variations = []

  for (let k = 0; k < depth; k++) {
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        if (canFitRoom(x - i, y - j, z - k, width, height, depth, grid)) {
          variations.push([x - i, y - j, z - k])
        }
      }
    }
  }

  return variations
}

export const generateGrid = (sizeX, sizeY, sizeZ) => {
  if (isEven(sizeX)) {
    sizeX++
  }
  if (isEven(sizeY)) {
    sizeY++
  }
  if (isEven(sizeZ)) {
    sizeZ++
  }

  return times(() => times(() => repeat(0, sizeX), sizeY), sizeZ)
}

export const addRoom = (width, height, depth, connectivity, grid) => {
  if (isEveryCellEmpty(grid)) {
    addFirstRoom(width, height, depth, connectivity, grid)
    return true
  }

  let candidates = []

  for (let z = 0; z < grid.length; z++) {
    for (let y = 0; y < grid[z].length; y++) {
      for (let x = 0; x < grid[z][y].length; x++) {
        if (grid[z][y][x] !== 1) {
          if (isConnected(x, y, z, connectivity, grid)) {
            candidates.push([x, y, z])
          }
        }
      }
    }
  }

  candidates = candidates.filter(([x, y, z]) => {
    // TODO: also filter adjacent cells' connectivity
    // TODO: also filter out diagonal connections
    return canFitRoomAtPos(x, y, z, width, height, depth, grid)
  })

  if (!candidates.length) {
    return false
  }

  const [candidateX, candidateY, candidateZ] = pickRandom(candidates)

  const variants = getFittingVariants(
    candidateX,
    candidateY,
    candidateZ,
    width,
    height,
    depth,
    grid,
  )

  const [startX, startY, startZ] = pickRandom(variants)

  insertRoom(startX, startY, startZ, width, height, depth, connectivity, grid)
  return true
}

/*
const decalOffset = {
  right: [1, 0, 0],
  left: [-1, 0, 0],
  front: [0, 0, 1],
  back: [0, 0, -1],
}

const decalOffset2 = {
  right: [2, 0, 0],
  left: [-2, 0, 0],
  front: [0, 0, 2],
  back: [0, 0, -2],
}

const getRightWalls = (wallSegments) => {
  return wallSegments
    .filter(([x, y, z, direction]) => direction === 'right')
    .sort(([ax, ay, az], [bx, by, bz]) => ax - bx || ay - by || az - bz)
    .reduce((walls, [x, y, z]) => {
      const adjacentWallIdx = walls.findIndex(
        (wall) => wall.x === x && wall.z + wall.width === z,
      )

      if (adjacentWallIdx !== -1) {
        walls[adjacentWallIdx].width += 1
        return walls
      }

      walls.push({
        x,
        z,
        width: 1,
        isLeftCornerConcave: false,
        isRightCornerConcave: false,
      })

      return walls
    }, [])
}

const getLeftWalls = (wallSegments) => {
  return wallSegments
    .filter(([x, y, z, direction]) => direction === 'left')
    .sort(([ax, ay, az], [bx, by, bz]) => ax - bx || ay - by || az - bz)
    .reduce((walls, [x, y, z]) => {
      const adjacentWallIdx = walls.findIndex(
        (wall) => wall.x === x && wall.z + wall.width === z,
      )

      if (adjacentWallIdx !== -1) {
        walls[adjacentWallIdx].width += 1
        return walls
      }

      walls.push({
        x,
        z,
        width: 1,
        isLeftCornerConcave: false,
        isRightCornerConcave: false,
      })

      return walls
    }, [])
}

const getFrontWalls = (wallSegments) => {
  return wallSegments
    .filter(([x, y, z, direction]) => direction === 'front')
    .sort(([ax, ay, az], [bx, by, bz]) => az - bz || ay - by || ax - bx)
    .reduce((walls, [x, y, z]) => {
      const adjacentWallIdx = walls.findIndex(
        (wall) => wall.z === z && wall.x + wall.width === x,
      )

      if (adjacentWallIdx !== -1) {
        walls[adjacentWallIdx].width += 1
        return walls
      }

      walls.push({
        x,
        z,
        width: 1,
        isLeftCornerConcave: false,
        isRightCornerConcave: false,
      })

      return walls
    }, [])
}

const getBackWalls = (wallSegments) => {
  return wallSegments
    .filter(([x, y, z, direction]) => direction === 'back')
    .sort(([ax, ay, az], [bx, by, bz]) => az - bz || ay - by || ax - bx)
    .reduce((walls, [x, y, z]) => {
      const adjacentWallIdx = walls.findIndex(
        (wall) => wall.z === z && wall.x + wall.width === x,
      )

      if (adjacentWallIdx !== -1) {
        walls[adjacentWallIdx].width += 1
        return walls
      }

      walls.push({
        x,
        z,
        width: 1,
        isLeftCornerConcave: false,
        isRightCornerConcave: false,
      })

      return walls
    }, [])
}
*/

export const renderGrid = (grid, mapData) => {
  const [radiusX, radiusY, radiusZ] = getRadius(grid)
  const originX = -radiusX * UNIT + UNIT / 2
  const originY = -radiusY * UNIT + UNIT / 2
  const originZ = -radiusZ * UNIT + UNIT / 2

  /*
  const wallSegments = []

  for (let z = 0; z < grid.length; z++) {
    let y = 0
    for (let x = 0; x < grid[z][0].length; x++) {
      if (grid[z][0][x] === 1) {
        if (isOccupied(x - 1, y, z, grid) !== true) {
          wallSegments.push([x, 0, z, 'right'])
        }
        if (isOccupied(x + 1, y, z, grid) !== true) {
          wallSegments.push([x, 0, z, 'left'])
        }
        if (isOccupied(x, y, z + 1, grid) !== true) {
          wallSegments.push([x, 0, z, 'front'])
        }
        if (isOccupied(x, y, z - 1, grid) !== true) {
          wallSegments.push([x, 0, z, 'back'])
        }
      }
    }
  }

  const rightWalls = getRightWalls(wallSegments)
  const leftWalls = getLeftWalls(wallSegments)
  const frontWalls = getFrontWalls(wallSegments)
  const backWalls = getBackWalls(wallSegments)

  rightWalls.forEach((wall) => {
    const { x, z, width } = wall

    const leftAdjacentWallIdx = frontWalls.findIndex((frontWall) => {
      return frontWall.x === x && frontWall.z === z + width - 1
    })
    const rightAdjacentWallIdx = backWalls.findIndex((backWall) => {
      return backWall.x === x && backWall.z === z
    })

    if (leftAdjacentWallIdx !== -1) {
      wall.isLeftCornerConcave = true
      frontWalls[leftAdjacentWallIdx].isRightCornerConcave = true
    }
    if (rightAdjacentWallIdx !== -1) {
      wall.isRightCornerConcave = true
      backWalls[rightAdjacentWallIdx].isLeftCornerConcave = true
    }
  })

  leftWalls.forEach((wall) => {
    const { x, z, width } = wall

    const leftAdjacentWallIdx = backWalls.findIndex((backWall) => {
      return backWall.x + backWall.width - 1 === x && backWall.z === z
    })
    const rightAdjacentWallIdx = frontWalls.findIndex((frontWall) => {
      return (
        frontWall.x + frontWall.width - 1 === x && frontWall.z === z + width - 1
      )
    })

    if (leftAdjacentWallIdx !== -1) {
      wall.isLeftCornerConcave = true
      backWalls[leftAdjacentWallIdx].isRightCornerConcave = true
    }
    if (rightAdjacentWallIdx !== -1) {
      wall.isRightCornerConcave = true
      frontWalls[rightAdjacentWallIdx].isLeftCornerConcave = true
    }
  })
  */

  for (let z = 0; z < grid.length; z++) {
    for (let y = 0; y < grid[z].length; y++) {
      for (let x = 0; x < grid[z][y].length; x++) {
        if (grid[z][y][x] > 0) {
          if (isOccupied(x, y - 1, z, grid) !== true) {
            setTexture(textures.backrooms.carpetDirty, mapData)
            plain(
              [
                originX + x * UNIT,
                -(originY + y * UNIT),
                -(originZ + z * UNIT),
              ],
              [UNIT / 100, UNIT / 100],
              'floor',
              disableBumping,
              () => ({
                textureRotation: pickRandom([0, 90, 180, 270]),
                textureFlags: pickRandom([0, HFLIP, VFLIP, HFLIP | VFLIP]),
              }),
            )(mapData)
          }
          if (isOccupied(x, y + 1, z, grid) !== true) {
            setTexture(textures.backrooms.ceiling, mapData)
            plain(
              [
                originX + x * UNIT,
                -(originY + (y + 1) * UNIT),
                -(originZ + z * UNIT),
              ],
              [UNIT / 100, UNIT / 100],
              'ceiling',
              disableBumping,
            )(mapData)
          }

          setTexture(textures.backrooms.wall, mapData)

          if (isOccupied(x + 1, y, z, grid) !== true) {
            const coords = [
              originX + x * UNIT + UNIT / 2,
              -(originY + y * UNIT),
              -(originZ + (z + 1) * UNIT) - UNIT / 2,
            ]
            wall(coords, 'left', { width: 1, height: 1, unit: UNIT }, mapData)
          }

          if (isOccupied(x - 1, y, z, grid) !== true) {
            const coords = [
              originX + x * UNIT - UNIT / 2,
              -(originY + y * UNIT),
              -(originZ + (z + 1) * UNIT) - UNIT / 2,
            ]
            wall(coords, 'right', { width: 1, height: 1, unit: UNIT }, mapData)
          }

          if (isOccupied(x, y, z + 1, grid) !== true) {
            const coords = [
              originX + (x - 1) * UNIT - UNIT / 2,
              -(originY + y * UNIT),
              -(originZ + (z + 1) * UNIT) + UNIT / 2,
            ]
            wall(coords, 'front', { width: 1, height: 1, unit: UNIT }, mapData)
          }
          if (isOccupied(x, y, z - 1, grid) !== true) {
            const coords = [
              originX + (x - 1) * UNIT - UNIT / 2,
              -(originY + y * UNIT),
              -(originZ + z * UNIT) + UNIT / 2,
            ]
            wall(coords, 'back', { width: 1, height: 1, unit: UNIT }, mapData)
          }
        }
      }
    }
  }

  /*
  rightWalls.forEach(
    ({ x, z, width, isLeftCornerConcave, isRightCornerConcave }) => {
      const coords = [
        originX + x * UNIT - UNIT / 2,
        0,
        -(originZ + (z + width) * UNIT) - UNIT / 2,
      ]

      setTexture(
        textures.backrooms[Math.random() > 0.5 ? 'wall' : 'wall2'],
        mapData,
      )
      wall(coords, 'right', { width, unit: UNIT }, mapData)

      setTexture(textures.backrooms.moldEdge, mapData)
      wall(move(...decalOffset.right, coords), 'right', {
        height: 1,
        width,
        unit: UNIT,
      }, mapData)
      wall(
        move(
          ...decalOffset.right,
          move(
            0,
            -(UNIT * 2 - UNIT / 2),
            0,
            coords,
          ),
        ),
        'right',
        {
          height: 1,
          width,
          textureRotation: 180,
          unit: UNIT,
        },
      mapData)

      if (isLeftCornerConcave) {
        wall(move(...decalOffset.right, coords), 'right', {
          width: 1 / (UNIT / 100),
          textureRotation: 270,
          unit: UNIT,
        }, mapData)
      }

      if (isRightCornerConcave) {
        wall(
          move(
            ...decalOffset.right,
            move(0, 0, UNIT * width - UNIT / 2, coords),
          ),
          'right',
          {
            width: 1 / (UNIT / 100),
            textureRotation: 90,
            unit: UNIT,
          },
        mapData)
      }

      setTexture(textures.backrooms.rails, mapData)
      wall(move(...decalOffset2.right, coords), 'right', {
        height: 1,
        width,
        unit: UNIT,
      }, mapData)
    },
  )

  leftWalls.forEach(
    ({ x, z, width, isLeftCornerConcave, isRightCornerConcave }) => {
      const coords = [
        originX + x * UNIT + UNIT / 2,
        0,
        -(originZ + (z + width) * UNIT) - UNIT / 2,
      ]

      setTexture(
        textures.backrooms[Math.random() > 0.5 ? 'wall' : 'wall2'],
        mapData,
      )
      wall(coords, 'left', { width, unit: UNIT }, mapData)

      setTexture(textures.backrooms.moldEdge, mapData)
      wall(move(...decalOffset.left, coords), 'left', {
        height: 1,
        width,
        unit: UNIT,
      }, mapData)
      wall(
        move(
          ...decalOffset.left,
          move(
            0,
            -(UNIT * 2 - UNIT / 2),
            0,
            coords,
          ),
        ),
        'left',
        {
          height: 1,
          width,
          textureRotation: 180,
          unit: UNIT,
        },
      mapData)

      if (isLeftCornerConcave) {
        wall(
          move(
            ...decalOffset.left,
            move(0, 0, UNIT * width - UNIT / 2, coords),
          ),
          'left',
          {
            width: 1 / (UNIT / 100),
            textureRotation: 90,
            unit: UNIT,
          },
        mapData)
      }

      if (isRightCornerConcave) {
        wall(move(...decalOffset.left, coords), 'left', {
          width: 1 / (UNIT / 100),
          textureRotation: 270,
          unit: UNIT,
        }, mapData)
      }

      setTexture(textures.backrooms.rails, mapData)
      wall(move(...decalOffset2.left, coords), 'left', {
        height: 1,
        width,
        unit: UNIT,
      }, mapData)
    },
  )

  frontWalls.forEach(
    ({ x, z, width, isLeftCornerConcave, isRightCornerConcave }) => {
      const coords = [
        originX + (x - 1) * UNIT - UNIT / 2,
        0,
        -(originZ + z * UNIT) - UNIT / 2,
      ]

      setTexture(
        textures.backrooms[Math.random() > 0.5 ? 'wall' : 'wall2'],
        mapData,
      )
      wall(coords, 'front', { width, unit: UNIT }, mapData)

      setTexture(textures.backrooms.moldEdge, mapData)
      wall(move(...decalOffset.front, coords), 'front', {
        height: 1,
        width,
        unit: UNIT,
      }, mapData)
      wall(
        move(
          ...decalOffset.front,
          move(
            0,
            -(UNIT * 2 - UNIT / 2),
            0,
            coords,
          ),
        ),
        'front',
        {
          height: 1,
          width,
          textureRotation: 180,
          unit: UNIT,
        },
      mapData)

      if (isLeftCornerConcave) {
        wall(
          move(
            ...decalOffset.front,
            move(UNIT * width - UNIT / 2, 0, 0, coords),
          ),
          'front',
          {
            width: 1 / (UNIT / 100),
            textureRotation: 90,
            unit: UNIT,
          },
        mapData)
      }

      if (isRightCornerConcave) {
        wall(move(...decalOffset.front, coords), 'front', {
          width: 1 / (UNIT / 100),
          textureRotation: 270,
          unit: UNIT,
        }, mapData)
      }

      setTexture(textures.backrooms.rails, mapData)
      wall(move(...decalOffset2.front, coords), 'front', {
        height: 1,
        width,
        unit: UNIT,
      }, mapData)
    },
  )

  backWalls.forEach(
    ({ x, z, width, isLeftCornerConcave, isRightCornerConcave }) => {
      const coords = [
        originX + (x - 1) * UNIT - UNIT / 2,
        0,
        -(originZ + z * UNIT) + UNIT / 2,
      ]
      setTexture(
        textures.backrooms[Math.random() > 0.5 ? 'wall' : 'wall2'],
        mapData,
      )
      wall(coords, 'back', { width, unit: UNIT }, mapData)

      setTexture(textures.backrooms.moldEdge, mapData)
      wall(move(...decalOffset.back, coords), 'back', {
        height: 1,
        width,
        unit: UNIT,
      }, mapData)
      wall(
        move(
          ...decalOffset.back,
          move(
            0,
            -(UNIT * 2 - UNIT / 2),
            0,
            coords,
          ),
        ),
        'back',
        {
          height: 1,
          width,
          textureRotation: 180,
          unit: UNIT,
        },
      mapData)

      if (isLeftCornerConcave) {
        wall(move(...decalOffset.back, coords), 'back', {
          width: 1 / (UNIT / 100),
          textureRotation: 270,
          unit: UNIT,
        }, mapData)
      }

      if (isRightCornerConcave) {
        wall(
          move(
            ...decalOffset.back,
            move(UNIT * width - UNIT / 2, 0, 0, coords),
          ),
          'back',
          {
            width: 1 / (UNIT / 100),
            textureRotation: 90,
            unit: UNIT,
          },
        mapData)
      }

      setTexture(textures.backrooms.rails, mapData)
      wall(move(...decalOffset2.back, coords), 'back', {
        height: 1,
        width,
        unit: UNIT,
      }, mapData)
    },
  )
  */
}
