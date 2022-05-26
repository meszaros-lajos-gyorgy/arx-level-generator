import fs from 'fs'
import React, { useState, useEffect } from 'react'
import AliasNightmare from '../projects/AliasNightmare'
import TheBackrooms from '../projects/TheBackrooms'
import OnTheIsland from '../projects/OnTheIsland'
import Loading from './Loading'
import MenuItem from './MenuItem'
import path from 'path'
import seedrandom from 'seedrandom'
import { ipcRenderer } from 'electron'
import { cleanupCache, uninstall } from '../../../helpers'
import aliasNightmareGenerator from '../../../projects/alias-nightmare/index'
import theBackroomsGenerator from '../../../projects/the-backrooms/index'
import onTheIslandGenerator from '../../../projects/on-the-island/index'
import { compileFTS, compileLLF, compileDLF } from '../../../compile'

const generateSeed = () => Math.floor(Math.random() * 1e20)

const App = () => {
  const [projects, setProjects] = useState([
    {
      name: "Alia's Nightmare",
      id: 'alias-nightmare',
      Page: AliasNightmare,
      isInstalled: false,
    },
    {
      name: 'The Backrooms',
      id: 'the-backrooms',
      Page: TheBackrooms,
      isInstalled: false,
    },
    {
      name: 'On the island',
      id: 'on-the-island',
      Page: OnTheIsland,
      isInstalled: false,
    },
  ])
  const [project, setProject] = useState(projects[0].id)

  const [seed, setSeed] = useState(generateSeed())
  const [outputDir, setOutputDir] = useState(path.resolve('./dist'))
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [loadingProgressbarPercent, setLoadingProgressbarPercent] = useState(0)
  const [isLoadingDoneBtnVisible, setIsLoadingDoneBtnVisible] = useState(false)

  useEffect(() => {
    ipcRenderer.on('output directory changed', (e, folder) => {
      setOutputDir(folder)
      checkForInstalledMaps(folder)
    })

    checkForInstalledMaps(outputDir)
  }, [])

  const checkForInstalledMaps = async (folder) => {
    let mapName = null

    try {
      const raw = await fs.promises.readFile(`${folder}/manifest.json`, 'utf-8')
      const manifest = JSON.parse(raw)
      mapName = manifest.meta.mapName.toLowerCase()
    } catch (e) {}

    setProjects(
      projects.map((project) => {
        project.isInstalled = project.name.toLowerCase() === mapName
        return project
      }),
    )
  }

  const onRandomizeBtnClick = () => {
    if (isLoading) {
      return
    }

    setSeed(generateSeed())
  }

  const onGenerateBtnClick = (settings) => {
    if (isLoading) {
      return
    }

    setIsLoading(true)
    setLoadingText('(1/4) Generating level data')
    setLoadingProgressbarPercent(0)
    setIsLoadingDoneBtnVisible(false)

    setTimeout(async () => {
      seedrandom(seed, { global: true })

      const config = {
        origin: { type: 'absolute', coords: [6000, 0, 6000] },
        levelIdx: 1,
        seed,
        outputDir,
        lootTable: [],
        bumpFactor: 3,
        ...settings,
      }

      switch (project) {
        case 'the-backrooms':
          await theBackroomsGenerator({
            ...config,
            percentOfLightsOn: 30,
            roomDimensions: {
              width: [1, 5],
              depth: [1, 5],
              height: 2,
            },
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
          await aliasNightmareGenerator({
            ...config,
          })
          break
        case 'on-the-island':
          await onTheIslandGenerator({
            ...config,
          })
          break
      }

      setLoadingText('(2/4) Compiling level mesh')
      setLoadingProgressbarPercent(25)

      setTimeout(async () => {
        await compileFTS(config)

        setLoadingText('(3/4) Compiling lighting information')
        setLoadingProgressbarPercent(50)

        setTimeout(async () => {
          await compileLLF(config)

          setLoadingText('(4/4) Compiling entities and paths')
          setLoadingProgressbarPercent(75)

          setTimeout(async () => {
            await compileDLF(config)

            cleanupCache()

            setLoadingProgressbarPercent(100)
            setLoadingText('Done!')
            setIsLoadingDoneBtnVisible(true)
            checkForInstalledMaps(outputDir)
          }, 100)
        }, 100)
      }, 100)
    }, 100)
  }

  return (
    <>
      <aside>
        <ul>
          {projects.map(({ name, id, isInstalled }) => (
            <li key={id}>
              <MenuItem
                isSelected={project === id}
                onClick={() => setProject(id)}
                label={name}
                badgeLabel="installed"
                showBadge={isInstalled}
              />
            </li>
          ))}
        </ul>
      </aside>
      <main>
        {projects.map(({ id, Page, isInstalled }) => (
          <Page
            key={id}
            isVisible={project === id}
            outputDir={outputDir}
            onOutputDirChange={(e) => setOutputDir(e.target.value)}
            onBrowseBtnClick={() => {
              ipcRenderer.send('change output directory')
            }}
            seed={seed}
            onSeedChange={(e) => setSeed(e.target.value)}
            onRandomizeBtnClick={onRandomizeBtnClick}
            onGenerateBtnClick={onGenerateBtnClick}
            onUninstallBtnClick={async () => {
              setIsLoading(true)
              setLoadingText('Uninstalling level')
              setLoadingProgressbarPercent(0)
              setIsLoadingDoneBtnVisible(false)
              setTimeout(async () => {
                await uninstall(outputDir)

                setLoadingText('Done!')
                setLoadingProgressbarPercent(100)
                setIsLoadingDoneBtnVisible(true)
                checkForInstalledMaps(outputDir)
              }, 100)
            }}
            isInstalled={isInstalled}
          />
        ))}
      </main>
      <Loading
        isVisible={isLoading}
        message={loadingText}
        progressbarPercent={loadingProgressbarPercent}
        showDoneBtn={isLoadingDoneBtnVisible}
        onDoneClick={() => {
          setIsLoading(false)
        }}
      />
    </>
  )
}

export default App
