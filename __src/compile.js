import path from 'path'
import { DLF, FTS, LLF } from 'arx-level-json-converter'
import { implode, stream, constants } from 'node-pkware'
import fs from 'fs'
import { Transform } from 'stream'

const { COMPRESSION_BINARY, DICTIONARY_SIZE_LARGE } = constants
const { through, transformSplitBy, splitAt, transformIdentity } = stream

// copied from arx-level-json-converter (should be exposed)
const outputInChunks = (buffer, stream) => {
  const chunks = Math.ceil(buffer.length / 1000)
  for (let i = 0; i < chunks - 1; i++) {
    stream.write(buffer.slice(i * 1000, (i + 1) * 1000))
  }
  stream.write(buffer.slice((chunks - 1) * 1000))
  stream.end()
}

export const compileFTS = (config) => {
  return new Promise(async (resolve, reject) => {
    const { levelIdx, outputDir } = config
    const src = path.resolve(
      outputDir,
      `./game/graph/levels/level${levelIdx}/fast.fts.json`,
    )

    const dest = path.resolve(
      outputDir,
      `./game/graph/levels/level${levelIdx}/fast.fts`,
    )

    let json
    try {
      const raw = await fs.promises.readFile(src)
      json = JSON.parse(raw)
    } catch (e) {
      reject(e)
    }

    const offset = 280

    let outputStream = new Transform()
    outputStream._transform = function (chunk, encoding, done) {
      this.push(chunk)
      done()
    }

    outputStream
      .pipe(
        through(
          transformSplitBy(
            splitAt(offset),
            transformIdentity(),
            implode(COMPRESSION_BINARY, DICTIONARY_SIZE_LARGE, {
              debug: false,
            }),
          ),
        ).on('error', reject),
      )
      .pipe(fs.createWriteStream(dest).on('error', reject))
      .on('error', reject)
      .on('finish', resolve)

    outputInChunks(FTS.save(json), outputStream)
  })
}

export const compileLLF = (config) => {
  return new Promise(async (resolve, reject) => {
    const { levelIdx, outputDir } = config
    const src = path.resolve(
      outputDir,
      `./graph/levels/level${levelIdx}/level${levelIdx}.llf.json`,
    )
    const dest = path.resolve(
      outputDir,
      `./graph/levels/level${levelIdx}/level${levelIdx}.llf`,
    )

    let json
    try {
      const raw = await fs.promises.readFile(src)
      json = JSON.parse(raw)
    } catch (e) {
      reject(e)
    }

    const offset = 0

    let outputStream = new Transform()
    outputStream._transform = function (chunk, encoding, done) {
      this.push(chunk)
      done()
    }

    outputStream
      .pipe(
        through(
          transformSplitBy(
            splitAt(offset),
            transformIdentity(),
            implode(COMPRESSION_BINARY, DICTIONARY_SIZE_LARGE, {
              debug: false,
            }),
          ),
        ).on('error', reject),
      )
      .pipe(fs.createWriteStream(dest).on('error', reject))
      .on('error', reject)
      .on('finish', resolve)

    outputInChunks(LLF.save(json), outputStream)
  })
}

export const compileDLF = (config) => {
  return new Promise(async (resolve, reject) => {
    const { levelIdx, outputDir } = config
    const src = path.resolve(
      outputDir,
      `./graph/levels/level${levelIdx}/level${levelIdx}.dlf.json`,
    )
    const dest = path.resolve(
      outputDir,
      `./graph/levels/level${levelIdx}/level${levelIdx}.dlf`,
    )

    let json
    try {
      const raw = await fs.promises.readFile(src)
      json = JSON.parse(raw)
    } catch (e) {
      reject(e)
    }

    const offset = 8520

    let outputStream = new Transform()
    outputStream._transform = function (chunk, encoding, done) {
      this.push(chunk)
      done()
    }

    outputStream
      .pipe(
        through(
          transformSplitBy(
            splitAt(offset),
            transformIdentity(),
            implode(COMPRESSION_BINARY, DICTIONARY_SIZE_LARGE, {
              debug: false,
            }),
          ),
        ).on('error', reject),
      )
      .pipe(fs.createWriteStream(dest).on('error', reject))
      .on('error', reject)
      .on('finish', resolve)

    outputInChunks(DLF.save(json), outputStream)
  })
}
