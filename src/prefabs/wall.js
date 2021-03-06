import wallX from './base/wallX'
import wallZ from './base/wallZ'
import { move } from '../helpers'

const internalUnit = 100

const wall = ([x, y, z], face, config = {}, mapData) => {
  const { origin } = mapData.config

  const h = config.height ?? 1
  const w = config.width ?? 1
  const textureRotation = config.textureRotation ?? 0
  const textureFlags = config.textureFlags ?? 0

  for (let height = 0; height < h * (config.unit / 100); height++) {
    for (let width = 0; width < w * (config.unit / 100); width++) {
      ;(face === 'left' || face === 'right' ? wallX : wallZ)(
        move(
          x +
            internalUnit / 2 +
            (face === 'front' || face === 'back'
              ? width * internalUnit + config.unit
              : 0),
          y - internalUnit / 2 - height * internalUnit,
          z +
            internalUnit / 2 +
            (face === 'left' || face === 'right'
              ? width * internalUnit + config.unit
              : 0),
          origin.coords,
        ),
        face,
        null,
        textureRotation,
        internalUnit,
        textureFlags,
      )(mapData)
    }
  }
}

export default wall
