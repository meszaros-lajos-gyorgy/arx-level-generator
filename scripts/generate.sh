#!/bin/bash

tsc --project ./tsconfig.json

esbuild ./src/generate.ts\
  --bundle\
  --platform=node\
  --minify\
  --outdir=build\
  --sourcemap\
  --external:arx-level-json-converter\
  --external:color-rgba\
  --external:nanoid\
  --external:node-pkware\
  --external:seedrandom\
  --external:tiny-glob

node --require dotenv/config --enable-source-maps ./build/generate.js
