import { times, repeat, clamp, uniq } from '../../faux-ramda'
import { textures } from '../../assets/textures'
import { HFLIP, VFLIP } from '../../constants'
import { setTexture, pickRandom, move } from '../../helpers'
import { plain, disableBumping } from '../../prefabs/plain'
import { UNIT } from './constants'
import wall from '../../prefabs/wall'

export const getRadius = (grid) => (grid.length - 1) / 2

const insertRoom = (originX, originZ, width, depth, grid) => {
  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      grid[originZ + z][originX + x] = 1
    }
  }
}

const addFirstRoom = (width, depth, grid) => {
  const radius = getRadius(grid)

  width = clamp(1, radius * 2 + 1, width)
  depth = clamp(1, radius * 2 + 1, depth)

  const originX = radius - Math.floor(width / 2)
  const originZ = radius - Math.floor(depth / 2)

  insertRoom(originX, originZ, width, depth, grid)
}

const isEveryCellEmpty = (grid) => {
  const elementsInGrid = uniq(grid.flat(1))
  return elementsInGrid.length === 1 && elementsInGrid[0] === 0
}

// is the x/z position of the grid === 1 ?
export const isOccupied = (x, z, grid) => {
  if (typeof grid[z] === 'undefined') {
    return null
  }
  if (typeof grid[z][x] === 'undefined') {
    return null
  }

  return grid[z][x] === 1
}

// starting from originX/originZ does a width/depth sized rectangle only occupy 0 slots?
const canFitRoom = (originX, originZ, width, depth, grid) => {
  for (let z = originZ; z < originZ + depth; z++) {
    for (let x = originX; x < originX + width; x++) {
      if (isOccupied(x, z, grid) !== false) {
        return false
      }
    }
  }

  return true
}

// is there a variation of a width/depth sized rectangle containing the position x/z which
// can occupy only 0 slots?
const canFitRoomAtPos = (x, z, width, depth, grid) => {
  for (let j = 0; j < depth; j++) {
    for (let i = 0; i < width; i++) {
      if (canFitRoom(x - i, z - j, width, depth, grid)) {
        return true
      }
    }
  }

  return false
}

// is the x/z slot surrounded by at least 1 slot containing 1? (north/south/east/west, no diagonals)
const isConnected = (x, z, grid) => {
  return (
    isOccupied(x - 1, z, grid) ||
    isOccupied(x + 1, z, grid) ||
    isOccupied(x, z - 1, grid) ||
    isOccupied(x, z + 1, grid)
  )
}

const getFittingVariants = (x, z, width, depth, grid) => {
  const variations = []

  for (let j = 0; j < depth; j++) {
    for (let i = 0; i < width; i++) {
      if (canFitRoom(x - i, z - j, width, depth, grid)) {
        variations.push([x - i, z - j])
      }
    }
  }

  return variations
}

export const generateGrid = (size) => {
  if (size % 2 === 0) {
    size++
  }

  return times(() => repeat(0, size), size)
}

export const addRoom = (width, height, depth, grid) => {
  if (isEveryCellEmpty(grid)) {
    addFirstRoom(width, depth, grid)
    return true
  }

  let candidates = []

  for (let z = 0; z < grid.length; z++) {
    for (let x = 0; x < grid[z].length; x++) {
      if (grid[z][x] !== 1) {
        if (isConnected(x, z, grid)) {
          candidates.push([x, z])
        }
      }
    }
  }

  candidates = candidates.filter(([x, z]) => {
    return canFitRoomAtPos(x, z, width, depth, grid)
  })

  if (!candidates.length) {
    return false
  }

  const candidate = pickRandom(candidates)

  const variants = getFittingVariants(
    candidate[0],
    candidate[1],
    width,
    depth,
    grid,
  )

  const [startX, startZ] = pickRandom(variants)

  insertRoom(startX, startZ, width, depth, grid)
  return true
}

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

export const renderGrid = (grid, mapData) => {
  const { roomDimensions } = mapData.config
  const radius = getRadius(grid)
  const originZ = -radius * UNIT + UNIT / 2
  const originX = -radius * UNIT + UNIT / 2

  const wallSegments = []

  for (let z = 0; z < grid.length; z++) {
    for (let x = 0; x < grid[z].length; x++) {
      if (grid[z][x] === 1) {
        if (isOccupied(x - 1, z, grid) !== true) {
          wallSegments.push([x, 0, z, 'right'])
        }
        if (isOccupied(x + 1, z, grid) !== true) {
          wallSegments.push([x, 0, z, 'left'])
        }
        if (isOccupied(x, z + 1, grid) !== true) {
          wallSegments.push([x, 0, z, 'front'])
        }
        if (isOccupied(x, z - 1, grid) !== true) {
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

  for (let z = 0; z < grid.length; z++) {
    for (let x = 0; x < grid[z].length; x++) {
      if (grid[z][x] === 1) {
        setTexture(textures.backrooms.carpetDirty, mapData)
        plain(
          [originX + x * UNIT, 0, -(originZ + z * UNIT)],
          [UNIT / 100, UNIT / 100],
          'floor',
          disableBumping,
          () => ({
            textureRotation: pickRandom([0, 90, 180, 270]),
            textureFlags: pickRandom([0, HFLIP, VFLIP, HFLIP | VFLIP]),
          }),
        )(mapData)

        setTexture(textures.backrooms.ceiling, mapData)
        plain(
          [
            originX + x * UNIT,
            -(UNIT * roomDimensions.height),
            -(originZ + z * UNIT),
          ],
          [UNIT / 100, UNIT / 100],
          'ceiling',
          disableBumping,
        )(mapData)
      }
    }
  }

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
      wall(coords, 'right', { width, unit: UNIT })(mapData)

      setTexture(textures.backrooms.moldEdge, mapData)
      wall(move(...decalOffset.right, coords), 'right', {
        height: 1,
        width,
        unit: UNIT,
      })(mapData)
      wall(
        move(
          ...decalOffset.right,
          move(
            0,
            -(UNIT * mapData.config.roomDimensions.height - UNIT / 2),
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
      )(mapData)

      if (isLeftCornerConcave) {
        wall(move(...decalOffset.right, coords), 'right', {
          width: 1 / (UNIT / 100),
          textureRotation: 270,
          unit: UNIT,
        })(mapData)
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
        )(mapData)
      }

      setTexture(textures.backrooms.rails, mapData)
      wall(move(...decalOffset2.right, coords), 'right', {
        height: 1,
        width,
        unit: UNIT,
      })(mapData)
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
      wall(coords, 'left', { width, unit: UNIT })(mapData)

      setTexture(textures.backrooms.moldEdge, mapData)
      wall(move(...decalOffset.left, coords), 'left', {
        height: 1,
        width,
        unit: UNIT,
      })(mapData)
      wall(
        move(
          ...decalOffset.left,
          move(
            0,
            -(UNIT * mapData.config.roomDimensions.height - UNIT / 2),
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
      )(mapData)

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
        )(mapData)
      }

      if (isRightCornerConcave) {
        wall(move(...decalOffset.left, coords), 'left', {
          width: 1 / (UNIT / 100),
          textureRotation: 270,
          unit: UNIT,
        })(mapData)
      }

      setTexture(textures.backrooms.rails, mapData)
      wall(move(...decalOffset2.left, coords), 'left', {
        height: 1,
        width,
        unit: UNIT,
      })(mapData)
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
      wall(coords, 'front', { width, unit: UNIT })(mapData)

      setTexture(textures.backrooms.moldEdge, mapData)
      wall(move(...decalOffset.front, coords), 'front', {
        height: 1,
        width,
        unit: UNIT,
      })(mapData)
      wall(
        move(
          ...decalOffset.front,
          move(
            0,
            -(UNIT * mapData.config.roomDimensions.height - UNIT / 2),
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
      )(mapData)

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
        )(mapData)
      }

      if (isRightCornerConcave) {
        wall(move(...decalOffset.front, coords), 'front', {
          width: 1 / (UNIT / 100),
          textureRotation: 270,
          unit: UNIT,
        })(mapData)
      }

      setTexture(textures.backrooms.rails, mapData)
      wall(move(...decalOffset2.front, coords), 'front', {
        height: 1,
        width,
        unit: UNIT,
      })(mapData)
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
      wall(coords, 'back', { width, unit: UNIT })(mapData)

      setTexture(textures.backrooms.moldEdge, mapData)
      wall(move(...decalOffset.back, coords), 'back', {
        height: 1,
        width,
        unit: UNIT,
      })(mapData)
      wall(
        move(
          ...decalOffset.back,
          move(
            0,
            -(UNIT * mapData.config.roomDimensions.height - UNIT / 2),
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
      )(mapData)

      if (isLeftCornerConcave) {
        wall(move(...decalOffset.back, coords), 'back', {
          width: 1 / (UNIT / 100),
          textureRotation: 270,
          unit: UNIT,
        })(mapData)
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
        )(mapData)
      }

      setTexture(textures.backrooms.rails, mapData)
      wall(move(...decalOffset2.back, coords), 'back', {
        height: 1,
        width,
        unit: UNIT,
      })(mapData)
    },
  )
}
