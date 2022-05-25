import { without } from '../../faux-ramda'
import { NORTH, SOUTH, EAST, WEST } from './constants'
import {
  move,
  magnitude,
  subtractVec3,
  radToDeg,
  isBetweenInclusive,
} from '../../helpers'
import { ISLAND_JOINT_LENGTH } from '../../constants'

const jointOffset = (ISLAND_JOINT_LENGTH * 100) / 2 - 100

const getJoints = ({ pos, entrances, exits, width, height }) => {
  const joints = {}

  if ((exits | entrances) & NORTH) {
    joints.north = move(
      0,
      0,
      (height * 100) / 2 + jointOffset + (ISLAND_JOINT_LENGTH * 100) / 2,
      pos,
    )
  }

  if ((exits | entrances) & SOUTH) {
    joints.south = move(
      0,
      0,
      -((height * 100) / 2 + jointOffset + (ISLAND_JOINT_LENGTH * 100) / 2),
      pos,
    )
  }

  if ((exits | entrances) & EAST) {
    joints.east = move(
      (width * 100) / 2 + jointOffset + (ISLAND_JOINT_LENGTH * 100) / 2,
      0,
      0,
      pos,
    )
  }

  if ((exits | entrances) & WEST) {
    joints.west = move(
      -((width * 100) / 2 + jointOffset + (ISLAND_JOINT_LENGTH * 100) / 2),
      0,
      0,
      pos,
    )
  }

  return joints
}

const findClosestJoint = (a, bx) => {
  if (bx.length === 1) {
    return bx[0]
  }

  const distances = bx.map((b) => Math.abs(magnitude(subtractVec3(a, b))))
  return bx[distances.indexOf(Math.min(...distances))]
}

/*
island = {
  pos: [0, 0, 0],
  entrances: EAST,
  exits: NORTH,
  width: 12,
  height: 10,
}
islands = island[]
*/
const bridges = (islands, mapData) => {
  const pairs = islands
    .map(getJoints)
    .reduce((candidates, joint, idx, joints) => {
      const otherIslands = without([joint], joints)

      const viewAngle = 20

      if (joint.north) {
        const souths = otherIslands
          .filter(({ south }) => south !== undefined)
          .map(({ south }) => south)
          .filter((south) => {
            const [x, y, z] = subtractVec3(joint.north, south)
            const angle = radToDeg(Math.atan2(x, z))
            return isBetweenInclusive(-viewAngle, viewAngle, angle)
          })
        if (souths.length) {
          candidates.push([joint.north, findClosestJoint(joint.north, souths)])
        }
      }
      if (joint.south) {
        const norths = otherIslands
          .filter(({ north }) => north !== undefined)
          .map(({ north }) => north)
          .filter((north) => {
            const [x, y, z] = subtractVec3(joint.south, north)
            const angle = (radToDeg(Math.atan2(x, z)) + 180) % 360
            return isBetweenInclusive(-viewAngle, viewAngle, angle)
          })
        if (norths.length) {
          candidates.push([joint.south, findClosestJoint(joint.south, norths)])
        }
      }
      if (joint.east) {
        const wests = otherIslands
          .filter(({ west }) => west !== undefined)
          .map(({ west }) => west)
          .filter((west) => {
            const [x, y, z] = subtractVec3(joint.east, west)
            const angle = radToDeg(Math.atan2(x, z)) - 90
            return isBetweenInclusive(-viewAngle, viewAngle, angle)
          })
        if (wests.length) {
          candidates.push([joint.east, findClosestJoint(joint.east, wests)])
        }
      }
      if (joint.west) {
        const easts = otherIslands
          .filter(({ east }) => east !== undefined)
          .map(({ east }) => east)
          .filter((east) => {
            const [x, y, z] = subtractVec3(joint.west, east)
            const angle = radToDeg(Math.atan2(x, z)) + 90
            return isBetweenInclusive(-viewAngle, viewAngle, angle)
          })
        if (easts.length) {
          candidates.push([joint.west, findClosestJoint(joint.west, easts)])
        }
      }

      return candidates
    }, [])
    .filter((pair, idx, pairs) => {
      // filter out pairs, which have no pair
      return pairs
        .map(JSON.stringify)
        .includes(JSON.stringify([pair[1], pair[0]]))
    })
    .reduce((acc, pair) => {
      // duplicates can now be safely reduce into single pairs
      const accStr = acc.map(JSON.stringify)
      if (
        accStr.includes(JSON.stringify(pair)) ||
        accStr.includes(JSON.stringify([pair[1], pair[0]]))
      ) {
        return acc
      }
      acc.push(pair)
      return acc
    }, [])

  return pairs.reduce((mapData, [a, b], idx) => {
    // TODO: render polygons between the 2 points
    console.log('TODO: render bridge between', a, 'and', b)

    return mapData
  }, mapData)
}

export default bridges
