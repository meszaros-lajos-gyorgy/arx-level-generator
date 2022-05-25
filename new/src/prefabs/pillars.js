import { times, identity } from '../faux-ramda'
import { isBetweenInclusive, randomBetween, move } from '../helpers'
import pillar from './pillar'

const isInExcludeRadius = (pos, excludeRadius, x, z) => {
  const [originalX, originalY, originalZ] = pos
  let excludeRadiusX = excludeRadius
  let excludeRadiusZ = excludeRadius
  if (Array.isArray(excludeRadius)) {
    ;[excludeRadiusX, excludeRadiusZ] = excludeRadius
  }

  if (excludeRadiusX === 0 && excludeRadiusZ === 0) {
    return false
  }

  return (
    isBetweenInclusive(
      originalX - excludeRadiusX / 2,
      originalX + excludeRadiusX / 2,
      x,
    ) &&
    isBetweenInclusive(
      originalZ - excludeRadiusZ / 2,
      originalZ + excludeRadiusZ / 2,
      z,
    )
  )
}

const isInBorderGap = (pos, borderGap, x, z) => {
  const [originalX, originalY, originalZ] = pos
  const [top, right, bottom, left] = borderGap // clockwise order, like in CSS

  if (
    top > 0 &&
    z > 0 &&
    isBetweenInclusive(originalX - top / 2, originalX + top / 2, x)
  ) {
    return true
  }

  if (
    bottom > 0 &&
    z < 0 &&
    isBetweenInclusive(originalX - bottom / 2, originalX + bottom / 2, x)
  ) {
    return true
  }

  if (
    left > 0 &&
    x < 0 &&
    isBetweenInclusive(originalZ - left / 2, originalZ + left / 2, z)
  ) {
    return true
  }

  if (
    right > 0 &&
    x > 0 &&
    isBetweenInclusive(originalZ - right / 2, originalZ + right / 2, z)
  ) {
    return true
  }

  return false
}

const tooCloseToOtherPillars = (x, z) => {
  // TODO: generate them more evenly spaced out
  return false
}

const pillars =
  (pos, n, radius, excludeRadius = 100, borderGap = [0, 0, 0, 0]) =>
  (mapData) => {
    return times(identity, n).reduce((mapData) => {
      const [originalX, originalY, originalZ] = pos
      let radiusX = radius
      let radiusZ = radius
      if (Array.isArray(radius)) {
        ;[radiusX, radiusZ] = radius
      }

      do {
        x = originalX + randomBetween(-radiusX / 2, radiusX / 2)
        z = originalZ + randomBetween(-radiusZ / 2, radiusZ / 2)
      } while (
        isInExcludeRadius(pos, excludeRadius, x, z) ||
        isInBorderGap(pos, borderGap, x, z) ||
        tooCloseToOtherPillars(x, z)
      )

      return pillar(
        ...move(x, originalY, z, mapData.config.origin.coords),
        20,
      )(mapData)
    }, mapData)
  }

export default pillars
