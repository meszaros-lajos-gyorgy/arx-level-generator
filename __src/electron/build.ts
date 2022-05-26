import { build } from 'esbuild'
import { sassPlugin } from 'esbuild-sass-plugin'
import path from 'path'
import fs from 'fs'

const OUTPUT = path.resolve(__dirname, './build')

const initOutputFolder = async () => {
  try {
    await fs.promises.rm(OUTPUT, { recursive: true })
  } catch (e) {}

  return fs.promises.mkdir(OUTPUT, { recursive: true })
}

const buildJsAndCss = async () => {
  return build({
    entryPoints: [path.resolve(__dirname, './src/app.jsx')],
    outdir: OUTPUT,
    minify: true,
    bundle: true,
    sourcemap: true,
    format: 'cjs',
    target: 'node16',
    platform: 'node',
    external: [
      'electron',
      'arx-level-json-converter',
      'color-rgba',
      'nanoid',
      'node-pkware',
      'ramda',
      'seedrandom',
      '*.png',
    ],
    plugins: [sassPlugin()],
  })
}

;(async () => {
  await initOutputFolder()
  await buildJsAndCss()
})()
