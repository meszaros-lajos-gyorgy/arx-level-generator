import { clone, uniq } from '../faux-ramda'
import { getRootPath } from '../../rootpath'

export type AmbienceDefinition = {
  name: string
  tracks?: string[]
  native: boolean
}

export type Ambience = AmbienceDefinition

export const ambiences = {
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

export const useAmbience = (ambience: AmbienceDefinition) => {
  usedAmbiences.push(ambience)
}

export const exportAmbiences = (outputDir: string) => {
  const copyOfUsedAmbiences = clone(usedAmbiences)
  const customAmbiences = copyOfUsedAmbiences.filter(
    ({ native }) => native === false,
  )
  const ambiencesToBeExported = uniq(customAmbiences)

  const filesToBeExported: Record<string, string> = {}

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
