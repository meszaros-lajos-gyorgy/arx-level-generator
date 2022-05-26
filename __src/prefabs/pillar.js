import wallX from './base/wallX'
import wallZ from './base/wallZ'
import { HFLIP } from '../constants'

const segment = (x, y, z, size) => (mapData) => {
  const height = 500

  const uv = {
    a: { u: 0.51, v: 0 },
    b: { u: 0.51, v: 1 },
    c: { u: 0.49, v: 0 },
    d: { u: 0.49, v: 1 },
  }

  mapData = wallX(
    [x - size / 2, y, z - size / 2],
    'left',
    null,
    0,
    [size, height, size],
    0,
    uv,
  )(mapData)

  mapData = wallX(
    [x + size / 2, y, z - size / 2],
    'right',
    null,
    0,
    [size, height, size],
    HFLIP,
    uv,
  )(mapData)

  mapData = wallZ(
    [x - size / 2, y, z - size / 2],
    'back',
    null,
    0,
    [size, height, size],
    0,
    uv,
  )(mapData)

  mapData = wallZ(
    [x - size / 2, y, z + size / 2],
    'front',
    null,
    0,
    [size, height, size],
    HFLIP,
    uv,
  )(mapData)

  return mapData
}

const pillar = (x, y, z, diameter) => (mapData) => {
  for (let i = -10; i < 10; i++) {
    mapData = segment(x, y + i * 500, z, diameter)(mapData)
  }

  return mapData
}

export default pillar
