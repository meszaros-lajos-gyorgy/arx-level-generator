import { times, repeat, clamp, flatten, uniq } from '../../faux-ramda'
import { textures } from '../../assets/textures'
import { HFLIP, VFLIP } from '../../constants'
import { setTexture, pickRandom, move } from '../../helpers'
import { plain, disableBumping } from '../../prefabs/plain'
import { UNIT } from './constants'
import wall from '../../prefabs/wall'

export const getRadius = (grid) => (grid.length - 1) / 2

const insertRoom = (left, top, width, height, grid) => {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      grid[top + y][left + x] = 1
    }
  }
}

const addFirstRoom = (width, height, grid) => {
  const radius = getRadius(grid)

  width = clamp(1, radius * 2 + 1, width)
  height = clamp(1, radius * 2 + 1, height)

  const left = radius - Math.floor(width / 2)
  const top = radius - Math.floor(height / 2)

  insertRoom(left, top, width, height, grid)
}

// is every cell of the grid === 0 ?
const isEmpty = (grid) => {
  const elementsInGrid = uniq(flatten(grid))
  return elementsInGrid.length === 1 && elementsInGrid[0] === 0
}

// is the X/Y position of the grid === 1 ?
export const isOccupied = (x, y, grid) => {
  if (typeof grid[y] === 'undefined') {
    return null
  }
  if (typeof grid[y][x] === 'undefined') {
    return null
  }

  return grid[y][x] === 1
}

// starting from left/top does a width/height sized rectangle only occupy 0 slots?
const canFitRoom = (left, top, width, height, grid) => {
  for (let y = top; y < top + height; y++) {
    for (let x = left; x < left + width; x++) {
      if (isOccupied(x, y, grid) !== false) {
        return false
      }
    }
  }

  return true
}

// is there a variation of a width/height sized rectangle containing the position x/y which
// can occupy only 0 slots?
const canFitRoomAtPos = (x, y, width, height, grid) => {
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      if (canFitRoom(x - i, y - j, width, height, grid)) {
        return true
      }
    }
  }

  return false
}

// is the x/y slot surrounded by at least 1 slot containing 1? (north/south/east/west, no diagonals)
const isConnected = (x, y, grid) => {
  return (
    isOccupied(x - 1, y, grid) ||
    isOccupied(x + 1, y, grid) ||
    isOccupied(x, y - 1, grid) ||
    isOccupied(x, y + 1, grid)
  )
}

const getFittingVariants = (x, y, width, height, grid) => {
  const variations = []

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      if (canFitRoom(x - i, y - j, width, height, grid)) {
        variations.push([x - i, y - j])
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

export const addRoom = (width, height, grid) => {
  if (isEmpty(grid)) {
    return addFirstRoom(width, height, grid)
  }

  let candidates = []

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] !== 1) {
        if (isConnected(x, y, grid)) {
          candidates.push([x, y])
        }
      }
    }
  }

  candidates = candidates.filter(([x, y]) => {
    return canFitRoomAtPos(x, y, width, height, grid)
  })

  if (!candidates.length) {
    return grid
  }

  const candidate = pickRandom(candidates)

  const variants = getFittingVariants(
    candidate[0],
    candidate[1],
    width,
    height,
    grid,
  )

  const startingPos = pickRandom(variants)

  insertRoom(startingPos[0], startingPos[1], width, height, grid)
}

const decalOffset = {
  right: [1, 0, 0],
  left: [-1, 0, 0],
  front: [0, 0, 1],
  back: [0, 0, -1],
}

const getRightWalls = (wallSegments) => {
  return wallSegments
    .filter(([x, y, direction]) => direction === 'right')
    .sort(([ax, ay], [bx, by]) => ax - bx || ay - by)
    .reduce((walls, [x, y]) => {
      const adjacentWallIdx = walls.findIndex(
        (wall) => wall.x === x && wall.y + wall.width === y,
      )

      if (adjacentWallIdx !== -1) {
        walls[adjacentWallIdx].width += 1
        return walls
      }

      walls.push({
        x,
        y,
        width: 1,
        isLeftCornerConcave: false,
        isRightCornerConcave: false,
      })

      return walls
    }, [])
}

const getLeftWalls = (wallSegments) => {
  return wallSegments
    .filter(([x, y, direction]) => direction === 'left')
    .sort(([ax, ay], [bx, by]) => ax - bx || ay - by)
    .reduce((walls, [x, y]) => {
      const adjacentWallIdx = walls.findIndex(
        (wall) => wall.x === x && wall.y + wall.width === y,
      )

      if (adjacentWallIdx !== -1) {
        walls[adjacentWallIdx].width += 1
        return walls
      }

      walls.push({
        x,
        y,
        width: 1,
        isLeftCornerConcave: false,
        isRightCornerConcave: false,
      })

      return walls
    }, [])
}

const getFrontWalls = (wallSegments) => {
  return wallSegments
    .filter(([x, y, direction]) => direction === 'front')
    .sort(([ax, ay], [bx, by]) => ay - by || ax - bx)
    .reduce((walls, [x, y]) => {
      const adjacentWallIdx = walls.findIndex(
        (wall) => wall.y === y && wall.x + wall.width === x,
      )

      if (adjacentWallIdx !== -1) {
        walls[adjacentWallIdx].width += 1
        return walls
      }

      walls.push({
        x,
        y,
        width: 1,
        isLeftCornerConcave: false,
        isRightCornerConcave: false,
      })

      return walls
    }, [])
}

const getBackWalls = (wallSegments) => {
  return wallSegments
    .filter(([x, y, direction]) => direction === 'back')
    .sort(([ax, ay], [bx, by]) => ay - by || ax - bx)
    .reduce((walls, [x, y]) => {
      const adjacentWallIdx = walls.findIndex(
        (wall) => wall.y === y && wall.x + wall.width === x,
      )

      if (adjacentWallIdx !== -1) {
        walls[adjacentWallIdx].width += 1
        return walls
      }

      walls.push({
        x,
        y,
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
  const top = -radius * UNIT + UNIT / 2
  const left = -radius * UNIT + UNIT / 2

  const wallSegments = []

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === 1) {
        if (isOccupied(x - 1, y, grid) !== true) {
          wallSegments.push([x, y, 'right'])
        }
        if (isOccupied(x + 1, y, grid) !== true) {
          wallSegments.push([x, y, 'left'])
        }
        if (isOccupied(x, y + 1, grid) !== true) {
          wallSegments.push([x, y, 'front'])
        }
        if (isOccupied(x, y - 1, grid) !== true) {
          wallSegments.push([x, y, 'back'])
        }
      }
    }
  }

  const rightWalls = getRightWalls(wallSegments)
  const leftWalls = getLeftWalls(wallSegments)
  const frontWalls = getFrontWalls(wallSegments)
  const backWalls = getBackWalls(wallSegments)

  rightWalls.forEach((wall) => {
    const { x, y, width } = wall

    const leftAdjacentWallIdx = frontWalls.findIndex((frontWall) => {
      return frontWall.x === x && frontWall.y === y + width - 1
    })
    const rightAdjacentWallIdx = backWalls.findIndex((backWall) => {
      return backWall.x === x && backWall.y === y
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
    const { x, y, width } = wall

    const leftAdjacentWallIdx = backWalls.findIndex((backWall) => {
      return backWall.x + backWall.width - 1 === x && backWall.y === y
    })
    const rightAdjacentWallIdx = frontWalls.findIndex((frontWall) => {
      return (
        frontWall.x + frontWall.width - 1 === x && frontWall.y === y + width - 1
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

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === 1) {
        setTexture(textures.backrooms.carpetDirty, mapData)
        plain(
          [left + x * UNIT, 0, -(top + y * UNIT)],
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
          [left + x * UNIT, -(UNIT * roomDimensions.height), -(top + y * UNIT)],
          [UNIT / 100, UNIT / 100],
          'ceiling',
          disableBumping,
        )(mapData)
      }
    }
  }

  rightWalls.forEach(
    ({ x, y, width, isLeftCornerConcave, isRightCornerConcave }) => {
      const coords = [
        left + x * UNIT - UNIT / 2,
        0,
        -(top + (y + width) * UNIT) - UNIT / 2,
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
    },
  )

  leftWalls.forEach(
    ({ x, y, width, isLeftCornerConcave, isRightCornerConcave }) => {
      const coords = [
        left + x * UNIT + UNIT / 2,
        0,
        -(top + (y + width) * UNIT) - UNIT / 2,
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
    },
  )

  frontWalls.forEach(
    ({ x, y, width, isLeftCornerConcave, isRightCornerConcave }) => {
      const coords = [
        left + (x - 1) * UNIT - UNIT / 2,
        0,
        -(top + y * UNIT) - UNIT / 2,
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
    },
  )

  backWalls.forEach(
    ({ x, y, width, isLeftCornerConcave, isRightCornerConcave }) => {
      const coords = [
        left + (x - 1) * UNIT - UNIT / 2,
        0,
        -(top + y * UNIT) + UNIT / 2,
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
    },
  )
}
