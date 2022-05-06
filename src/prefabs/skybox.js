import floor from './base/floor'
import wallX from './base/wallX'
import wallZ from './base/wallZ'
import { HFLIP } from '../constants'
import { textures } from '../assets/textures'
import {
  setTexture,
  setColor,
  setPolygonGroup,
  unsetPolygonGroup,
} from '../helpers'

const skybox = (x, y, z, size, mapData) => {
  setColor('white', mapData)

  setPolygonGroup('skybox', mapData)

  setTexture(textures.skybox.back, mapData)
  wallZ([x, y, z + size], 'back', null, 0, size)(mapData)

  setTexture(textures.skybox.front, mapData)
  wallZ([x, y, z], 'front', null, 0, size, HFLIP)(mapData)

  setTexture(textures.skybox.right, mapData)
  wallX([x, y, z], 'right', null, 0, size)(mapData)

  setTexture(textures.skybox.left, mapData)
  wallX([x + size, y, z], 'left', null, 0, size, HFLIP)(mapData)

  setTexture(textures.skybox.bottom, mapData)
  floor(
    { type: 'absolute', coords: [x, y + size / 2, z] },
    'floor',
    null,
    2,
    size,
  )(mapData)

  setTexture(textures.skybox.top, mapData)
  floor(
    { type: 'absolute', coords: [x, y - size / 2, z] },
    'ceiling',
    null,
    0,
    size,
  )(mapData)

  unsetPolygonGroup(mapData)

  return mapData
}

export default skybox
