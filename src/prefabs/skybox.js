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
    (mapData) => unsetPolygonGroup(mapData),
    floor(
      { type: 'absolute', coords: [x, y - size / 2, z] },
      'ceiling',
      null,
      0,
      size,
    ),
    setTexture(textures.skybox.top),
    floor(
      { type: 'absolute', coords: [x, y + size / 2, z] },
      'floor',
      null,
      2,
      size,
    ),
    setTexture(textures.skybox.bottom),
    wallX([x + size, y, z], 'left', null, 0, size, HFLIP),
    setTexture(textures.skybox.left),
    wallX([x, y, z], 'right', null, 0, size),
    setTexture(textures.skybox.right),
    wallZ([x, y, z], 'front', null, 0, size, HFLIP),
    setTexture(textures.skybox.front),
    wallZ([x, y, z + size], 'back', null, 0, size),
    (mapData) => setPolygonGroup('skybox', mapData),
    setTexture(textures.skybox.back),
    setColor('white'),
  )(mapData)
}

export default skybox
