import { nanoid } from 'nanoid'
import floor from './base/floor'
import { compose, times, identity, reduce, __ } from 'ramda'
import wallZ from './base/wallZ'
import { textures } from '../assets/textures'
import {
  setPolygonGroup,
  unsetPolygonGroup,
  setTexture,
  move,
} from '../helpers'
import { HFLIP, VFLIP } from '../constants'

const STEP = {
  WIDTH: 180,
  HEIGHT: 25,
  DEPTH: 43,
}

const PIXEL = 1 / textures.stone.stairs.height

const stairTopLeft = (pos, isLeftFlipped, areSidesFlipped) => {
  return floor(
    {
      type: 'absolute',
      coords: move(
        areSidesFlipped ? STEP.WIDTH / 4 : -STEP.WIDTH / 4,
        -STEP.HEIGHT,
        STEP.DEPTH / 2,
        pos,
      ),
    },
    'floor',
    null,
    STEP.WIDTH / 2,
    [STEP.WIDTH / 2, 0, STEP.DEPTH],
    HFLIP | isLeftFlipped ? 0 : VFLIP,
    {
      a: { u: 0.5, v: PIXEL * 160 },
      b: { u: 0.5, v: PIXEL * 222 },
      c: { u: 0, v: PIXEL * 160 },
      d: { u: 0, v: PIXEL * 222 },
    },
  )
}

const stairTopRight = (pos, isRightFlipped, areSidesFlipped) => {
  return floor(
    {
      type: 'absolute',
      coords: move(
        areSidesFlipped ? -STEP.WIDTH / 4 : STEP.WIDTH / 4,
        -STEP.HEIGHT,
        STEP.DEPTH / 2,
        pos,
      ),
    },
    'floor',
    null,
    STEP.WIDTH / 2,
    [STEP.WIDTH / 2, 0, STEP.DEPTH],
    HFLIP | isRightFlipped ? 0 : VFLIP,
    {
      a: { u: 1, v: PIXEL * 160 },
      b: { u: 1, v: PIXEL * 222 },
      c: { u: 0.5, v: PIXEL * 160 },
      d: { u: 0.5, v: PIXEL * 222 },
    },
  )
}

const stairFrontRight = (pos, isRightFlipped, areSidesFlipped) => {
  return wallZ(
    move(
      areSidesFlipped ? -STEP.WIDTH / 4 : STEP.WIDTH / 4,
      -STEP.HEIGHT / 2,
      0,
      pos,
    ),
    'back',
    null,
    0,
    [STEP.WIDTH / 2, STEP.HEIGHT, 0],
    isRightFlipped ? HFLIP : 0,
    {
      a: { u: 1, v: PIXEL * 222 },
      b: { u: 1, v: PIXEL * 255 },
      c: { u: 0.5, v: PIXEL * 222 },
      d: { u: 0.5, v: PIXEL * 255 },
    },
  )
}

const stairFrontLeft = (pos, isLeftFlipped, areSidesFlipped) => {
  return wallZ(
    move(
      areSidesFlipped ? STEP.WIDTH / 4 : -STEP.WIDTH / 4,
      -STEP.HEIGHT / 2,
      0,
      pos,
    ),
    'back',
    null,
    0,
    [STEP.WIDTH / 2, STEP.HEIGHT, 0],
    isLeftFlipped ? HFLIP : 0,
    {
      a: { u: 0.5, v: PIXEL * 222 },
      b: { u: 0.5, v: PIXEL * 255 },
      c: { u: 0, v: PIXEL * 222 },
      d: { u: 0, v: PIXEL * 255 },
    },
  )
}

const stairStep = (pos, isLeftFlipped, isRightFlipped, areSidesFlipped) => {
  return compose(
    stairTopRight(pos, isRightFlipped, areSidesFlipped),
    stairTopLeft(pos, isLeftFlipped, areSidesFlipped),
    stairFrontRight(pos, isRightFlipped, areSidesFlipped),
    stairFrontLeft(pos, isLeftFlipped, areSidesFlipped),
  )
}

const stairs = (pos) => (mapData) => {
  const id = nanoid(6)
  const { origin } = mapData.config

  const absPos = move(...pos, origin.coords)

  return compose(
    (mapData) => unsetPolygonGroup(mapData),

    reduce(
      (mapData, idx) => {
        return stairStep(
          move(0, -STEP.HEIGHT * idx, STEP.DEPTH * idx, absPos),
          Math.random() > 0.5,
          Math.random() > 0.5,
          Math.random() > 0.5,
        )(mapData)
      },
      __,
      times(identity, 15),
    ),

    setTexture(textures.stone.stairs),
    (mapData) => setPolygonGroup(`${id}-stairs`, mapData),
  )(mapData)
}

export default stairs
