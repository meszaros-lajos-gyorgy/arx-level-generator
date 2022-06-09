import { addDependencyAs, ItemRef } from '../../assets/items'

export const hideMinimap = (levelIdx: number, anyItemRef: ItemRef) => {
  addDependencyAs(
    'reset/map.bmp',
    `graph/levels/level${levelIdx}/map.bmp`,
    anyItemRef,
  )
}

export const hideHealthbar = (anyItemRef: ItemRef) => {
  addDependencyAs(
    'reset/graph/interface/bars/empty_gauge_red.bmp',
    'graph/interface/bars/empty_gauge_red.bmp',
    anyItemRef,
  )
  addDependencyAs(
    'reset/graph/interface/bars/filled_gauge_red.bmp',
    'graph/interface/bars/filled_gauge_red.bmp',
    anyItemRef,
  )
}

export const hideStealthIndicator = (anyItemRef: ItemRef) => {
  addDependencyAs(
    'reset/graph/interface/icons/stealth_gauge.bmp',
    'graph/interface/icons/stealth_gauge.bmp',
    anyItemRef,
  )
}

export const hideStelingIcon = (anyItemRef: ItemRef) => {
  addDependencyAs(
    'reset/graph/interface/icons/steal.bmp',
    'graph/interface/icons/steal.bmp',
    anyItemRef,
  )
}

export const removeSound = (filename: string, anyItemRef: ItemRef) => {
  addDependencyAs('reset/no-sound.wav', filename, anyItemRef)
}

export const useGlebRodinsFont = (anyItemRef: ItemRef) => {
  ;['arx.ttf', 'arx_base.ttf', 'arx_default.ttf', 'arx_russian.ttf'].forEach(
    (filename) => {
      addDependencyAs(
        `reset/font/glebRodin/${filename}`,
        `misc/${filename}`,
        anyItemRef,
      )
    },
  )
}
