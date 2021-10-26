const { POLY_QUAD, POLY_NO_SHADOW, HFLIP, VFLIP } = require("../constants.js");
const { useTexture } = require("../textures.js");

const wallZ =
  (
    x,
    y,
    z,
    texture,
    direction = "front", // front|back
    quad = 0,
    textureRotation = 0,
    size = 100,
    flags = 0,
    _uv = {
      a: { u: 1, v: 0 },
      b: { u: 1, v: 1 },
      c: { u: 0, v: 0 },
      d: { u: 0, v: 1 },
    }
  ) =>
  (mapData) => {
    let texU = 0;
    let texV = 0;
    let sizeX = size;
    let sizeY = size;
    let sizeZ = size;
    if (Array.isArray(size)) {
      [sizeX, sizeY, sizeZ] = size;
    }

    let a = { u: 0.5, v: 0 };
    let b = { u: 0.5, v: 0.5 };
    let c = { u: 0, v: 0 };
    let d = { u: 0, v: 0.5 };

    if (quad === null) {
      a = _uv.a;
      b = _uv.b;
      c = _uv.c;
      d = _uv.d;
    } else {
      switch (quad) {
        case 0:
          texU = 0;
          texV = 0;
          break;
        case 1:
          texU = 0.5;
          texV = 0;
          break;
        case 2:
          texU = 0.5;
          texV = 0.5;
          break;
        case 3:
          texU = 0;
          texV = 0.5;
          break;
      }
    }

    let uv = [c, d, a, b]; // 0
    switch (textureRotation) {
      case 90:
        uv = [a, c, b, d]; // 90
        break;
      case 180:
        uv = [b, a, d, c]; // 180
        break;
      case 270:
        uv = [d, b, c, a]; // 270
    }

    if (flags & HFLIP) {
      uv = [uv[2], uv[3], uv[0], uv[1]];
    }

    if (flags & VFLIP) {
      uv = [uv[1], uv[0], uv[3], uv[2]];
    }

    const textureFlags = texture.flags ?? POLY_QUAD | POLY_NO_SHADOW;

    mapData.fts.polygons.push({
      config: {
        color: mapData.state.lightColor,
        isQuad: (textureFlags & POLY_QUAD) > 0,
        minX: x - sizeX / 2,
        minZ: z - sizeZ / 2,
      },
      vertices: [
        {
          posX: x - sizeX / 2,
          posY: y - sizeY / 2,
          posZ: z - sizeZ / 2,
          texU: texU + uv[0].u,
          texV: texV + uv[0].v,
        },
        {
          posX: x - sizeX / 2,
          posY: y + sizeY / 2,
          posZ: z - sizeZ / 2,
          texU: texU + uv[1].u,
          texV: texV + uv[1].v,
        },
        {
          posX: x + sizeX / 2,
          posY: y - sizeY / 2,
          posZ: z - sizeZ / 2,
          texU: texU + uv[2].u,
          texV: texV + uv[2].v,
        },
        {
          posX: x + sizeX / 2,
          posY: y + sizeY / 2,
          posZ: z - sizeZ / 2,
          texU: texU + uv[3].u,
          texV: texV + uv[3].v,
        },
      ],
      tex: useTexture(texture),
      norm: { x: 0, y: 0, z: direction === "front" ? 1 : -1 },
      norm2: { x: 0, y: 0, z: direction === "front" ? 1 : -1 },
      normals: [
        { x: 0, y: 0, z: direction === "front" ? 1 : -1 },
        { x: 0, y: 0, z: direction === "front" ? 1 : -1 },
        { x: 0, y: 0, z: direction === "front" ? 1 : -1 },
        { x: 0, y: 0, z: direction === "front" ? 1 : -1 },
      ],
      transval: 0,
      area: 10000,
      type: textureFlags,
      room: 1,
      paddy: 0,
    });

    return mapData;
  };

module.exports = wallZ;
