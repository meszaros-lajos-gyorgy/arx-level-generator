import { compose, clone, filter, propEq, reduce, uniq } from 'ramda'
import { KVPair, RecursiveKVPair } from 'src/types'
import { getRootPath } from '../../rootpath'

export type Ambience = {
  name: string
  tracks?: string[]
  native: boolean
}

export const ambiences: RecursiveKVPair<Ambience> = {
  none: {
    name: 'NONE',
    native: true,
  },
  noden: {
    name: 'ambient_noden',
    native: true,
  },
  sirs: {
    name: 'ambient_sirs',
    tracks: ['sfx/ambiance/loop_sirs.wav'],
    native: false,
  },
}

let usedAmbiences: Ambience[] = []

export const useAmbience = (ambience: Ambience) => {
  usedAmbiences.push(ambience)
}

export const exportAmbiences = (outputDir: string) => {
  const copyOfUsedAmbiences = clone(usedAmbiences)
  const customAmbiences = copyOfUsedAmbiences.filter(
    ({ native }) => native === false,
  )
  const ambiencesToBeExported = uniq(customAmbiences)

  const filesToBeExported: KVPair<string> = {}

  return ambiencesToBeExported.reduce((files, { name, tracks }) => {
    const filename = `${outputDir}/sfx/ambiance/${name}.amb`
    files[filename] = `${getRootPath()}/assets/sfx/ambiance/${name}.amb`

    if (Array.isArray(tracks)) {
      tracks.forEach((track) => {
        files[`${outputDir}/${track}`] = `${getRootPath()}/assets/${track}`
      })
    }

    return files
  }, filesToBeExported)
}

export const resetAmbiences = () => {
  usedAmbiences = []
}
