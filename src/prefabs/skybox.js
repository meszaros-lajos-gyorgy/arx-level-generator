import { compose } from 'ramda'
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

const skybox = (x, y, z, size) => (mapData) => {
  return compose(
    (mapData) => {
      unsetPolygonGroup(mapData)
      return mapData
    },
    floor(
      { type: 'absolute', coords: [x, y - size / 2, z] },
      'ceiling',
      null,
      0,
      size,
    ),
    (mapData) => {
      setTexture(textures.skybox.top, mapData)
      return mapData
    },
    floor(
      { type: 'absolute', coords: [x, y + size / 2, z] },
      'floor',
      null,
      2,
      size,
    ),
    (mapData) => {
      setTexture(textures.skybox.bottom, mapData)
      return mapData
    },
    wallX([x + size, y, z], 'left', null, 0, size, HFLIP),
    (mapData) => {
      setTexture(textures.skybox.left, mapData)
      return mapData
    },
    wallX([x, y, z], 'right', null, 0, size),
    (mapData) => {
      setTexture(textures.skybox.right, mapData)
      return mapData
    },
    wallZ([x, y, z], 'front', null, 0, size, HFLIP),
    (mapData) => {
      setTexture(textures.skybox.front, mapData)
      return mapData
    },
    wallZ([x, y, z + size], 'back', null, 0, size),
    (mapData) => {
      setColor('white', mapData)
      setTexture(textures.skybox.back, mapData)
      setPolygonGroup('skybox', mapData)
      return mapData
    },
  )(mapData)
}

export default skybox
