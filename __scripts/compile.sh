#!/bin/bash

if [ -z "$OUTPUTDIR" ]; then
  OUTPUTDIR=$(pwd)/dist
fi

LEVEL=1

cd "$OUTPUTDIR/game/graph/levels/level$LEVEL"

echo "FTS"

cat fast.fts.json | from-json --ext=fts | implode -b -l --offset=280 --debug --output=fast.fts

cd "$OUTPUTDIR/graph/levels/level$LEVEL"

echo "LLF"

cat level$LEVEL.llf.json | from-json --ext=dlf | implode -b -l --offset=0 --debug --output=level$LEVEL.llf

echo "DLF"

cat level$LEVEL.dlf.json | from-json --ext=dlf | implode -b -l --offset=8520 --debug --output=level$LEVEL.dlf

echo "done"

tput bel
