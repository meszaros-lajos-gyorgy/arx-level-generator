import seedrandom from 'seedrandom'
import aliasNightmare from './projects/alias-nightmare/index'
import theBackrooms from './projects/the-backrooms/index'
import onTheIsland from './projects/on-the-island/index'
import { MapConfig } from './types'

const seed: string =
  process.env.SEED ?? Math.floor(Math.random() * 1e20).toString()

seedrandom(seed, { global: true })
console.log(`seed: ${seed}`)

const config: MapConfig = {
  origin: { type: 'absolute', coords: [6000, 0, 6000] },
  levelIdx: parseInt(process.env.LEVEL ?? '1'),
  seed,
  lootTable: [],
  bumpFactor: 3,
}

const project: string = process.env.PROJECT ?? 'alias-nightmare'

;(async () => {
  switch (project) {
    case 'the-backrooms':
      await theBackrooms({
        ...config,
        numberOfRooms: 20,
        roomDimensions: { width: [1, 5], depth: [1, 5], height: 2 },
        percentOfLightsOn: 100,
        lootTable: [
          {
            name: 'almondWater',
            weight: 10,
            variant: 'mana',
          },
          {
            name: 'almondWater',
            weight: 1,
            variant: 'xp',
          },
          {
            name: 'almondWater',
            weight: 4,
            variant: 'slow',
          },
          {
            name: 'almondWater',
            weight: 2,
            variant: 'speed',
          },
        ],
      })
      break
    case 'alias-nightmare':
      await aliasNightmare({
        ...config,
      })
      break
    case 'on-the-island':
      await onTheIsland({
        ...config,
      })
      break
  }

  console.log('done')
})()
