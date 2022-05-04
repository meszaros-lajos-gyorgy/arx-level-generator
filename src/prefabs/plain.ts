import floor from './base/floor'
import {
  categorizeVertices,
  bumpByMagnitude,
  adjustVertexBy,
  randomBetween,
  pickRandoms,
  move,
  posVertexToVector,
  distance,
  isBetween,
} from '../helpers'
import { identity, clamp, pluck } from 'ramda'
import { AbsoluteCoords, KVPair, PosVertex3, Vector3 } from 'src/types'

export type AdjustablePosVertex3 = PosVertex3 & { haveBeenAdjusted?: boolean }

export type Candidate = {
  polygon: any // TODO
  vertex: AdjustablePosVertex3
  distance: number
  coordinates: Vector3
}

// pos is relative to origin
export const plain = (
  pos,
  size,
  facing: 'floor' | 'ceiling' = 'floor',
  onBeforeBumping = identity,
  getConfig: () => {
    textureRotation?: number
    textureFlags?: number
  } = () => ({}),
) => {
  return (mapData) => {
    const { origin } = mapData.config

    const [x, y, z] = move(...pos, origin.coords)

    let sizeX = size
    let sizeZ = size

    if (Array.isArray(size)) {
      sizeX = size[0]
      sizeZ = size[1]
    }

    let tmp = {
      config: mapData.config,
      state: mapData.state,
      fts: {
        polygons: {
          [mapData.state.polygonGroup]: [],
        },
      },
    }

    for (let j = 0; j < sizeZ; j++) {
      for (let i = 0; i < sizeX; i++) {
        const config = getConfig()
        const position: AbsoluteCoords = {
          type: 'absolute',
          coords: [
            x + 100 * i - (sizeX * 100) / 2 + 100 / 2,
            y,
            z + 100 * j - (sizeZ * 100) / 2 + 100 / 2,
          ],
        }
        floor(
          position,
          facing,
          null,
          config.textureRotation ?? 90,
          100,
          config.textureFlags ?? 0,
        )(tmp)
      }
    }

    let polygons = onBeforeBumping(
      tmp.fts.polygons[mapData.state.polygonGroup],
      mapData,
    )

    const nonBumpablePolygons = polygons.filter(
      (polygon) => polygon.config.bumpable === false,
    )

    if (polygons.length > nonBumpablePolygons.length) {
      const nonBumpableVertices = nonBumpablePolygons.reduce(
        (acc, { vertices }) => {
          acc.push(
            ...vertices.map(
              ({ posX, posY, posZ }) => `${posX}|${posY}|${posZ}`,
            ),
          )
          return acc
        },
        [],
      )

      let { corners, edges, middles } = categorizeVertices(polygons)

      corners
        .filter(
          ({ posX, posY, posZ }) =>
            !nonBumpableVertices.includes(`${posX}|${posY}|${posZ}`),
        )
        .forEach((corner) => {
          const magnitude = 5 * mapData.config.bumpFactor
          adjustVertexBy(
            corner,
            bumpByMagnitude(
              randomBetween(-magnitude, magnitude) +
                (facing === 'floor' ? -80 : 80),
            ),
            polygons,
          )
        })

      edges
        .filter(
          ({ posX, posY, posZ }) =>
            !nonBumpableVertices.includes(`${posX}|${posY}|${posZ}`),
        )
        .forEach((edge) => {
          const magnitude = 5 * mapData.config.bumpFactor
          adjustVertexBy(
            edge,
            bumpByMagnitude(
              randomBetween(-magnitude, magnitude) +
                (facing === 'floor' ? -40 : 40),
            ),
            polygons,
          )
        })

      middles = middles.filter(
        ({ posX, posY, posZ }) =>
          !nonBumpableVertices.includes(`${posX}|${posY}|${posZ}`),
      )
      pickRandoms(15, middles).forEach((middle) => {
        const magnitude = 10 * mapData.config.bumpFactor
        adjustVertexBy(
          middle,
          bumpByMagnitude(
            facing === 'floor'
              ? clamp(-50, Infinity, randomBetween(-magnitude, magnitude))
              : clamp(
                  -Infinity,
                  50,
                  randomBetween(-magnitude, magnitude) * 3 -
                    randomBetween(5, 25) * mapData.config.bumpFactor,
                ),
          ),
          polygons,
        )
      })
    }

    if (!mapData.fts.polygons[mapData.state.polygonGroup]) {
      mapData.fts.polygons[mapData.state.polygonGroup] = polygons
    } else {
      mapData.fts.polygons[mapData.state.polygonGroup].push(...polygons)
    }

    return mapData
  }
}

export const disableBumping = (polygons) => {
  polygons.forEach((polygon) => {
    polygon.config.bumpable = false
  })
  return polygons
}

export const connectToNearPolygons = (targetGroup, distanceThreshold = 100) => {
  return (polygons, mapData) => {
    const target = categorizeVertices(mapData.fts.polygons[targetGroup] || [])
    const targetVertices: Vector3[] = [...target.corners, ...target.edges].map(
      posVertexToVector,
    )

    if (targetVertices.length === 0) {
      return polygons
    }

    const candidates: KVPair<Candidate[]> = {}

    const vertices: AdjustablePosVertex3[] = []

    const source = categorizeVertices(polygons)

    ;[...source.corners, ...source.edges].forEach((polygon) => {
      adjustVertexBy(
        polygon,
        (vertex: AdjustablePosVertex3, polyOfVertex) => {
          const targets = targetVertices.filter((targetVertex) => {
            const d = distance(posVertexToVector(vertex), targetVertex)
            return isBetween(10, distanceThreshold, d)
          })

          if (targets.length) {
            vertex.haveBeenAdjusted = false // TODO: remove the need for mutation
            vertices.push(vertex)
          }

          targets.forEach((targetVertex) => {
            const [x, y, z] = targetVertex
            candidates[`${x}|${y}|${z}`] = candidates[`${x}|${y}|${z}`] || []
            candidates[`${x}|${y}|${z}`].push({
              polygon: polyOfVertex,
              vertex,
              distance: distance(posVertexToVector(vertex), targetVertex),
              coordinates: [x, y, z],
            })
          })

          return vertex
        },
        polygons,
      )
    })

    Object.values(candidates)
      .sort((a, b) => {
        const aDistance = Math.min(...pluck('distance', a))
        const bDistance = Math.min(...pluck('distance', b))
        return aDistance - bDistance
      })
      .forEach((candidate) => {
        const smallestDistance = Math.min(...pluck('distance', candidate))

        candidate
          .filter(
            (x) =>
              x.distance === smallestDistance &&
              x.vertex.haveBeenAdjusted !== true,
          )
          .forEach(({ coordinates, polygon, vertex }) => {
            const [x, y, z] = coordinates
            vertex.haveBeenAdjusted = true
            polygon.config.bumpable = false
            vertex.posX = x
            vertex.posY = y
            vertex.posZ = z
          })
      })

    vertices.forEach((vertex) => {
      delete vertex.haveBeenAdjusted
    })

    return polygons
  }
}
