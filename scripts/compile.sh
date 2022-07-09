#!/bin/bash

LEVEL=$(grep LEVEL .env | cut -d "=" -f2 | tr -d '"')

if [ "$LEVEL" = "" ]; then
  LEVEL=1
fi

OUTPUTDIR=$(grep OUTPUTDIR .env | cut -d "=" -f2 | tr -d '"')

if [ -z "$OUTPUTDIR" ]; then
  OUTPUTDIR=$(pwd)/dist
fi

cd "$OUTPUTDIR/game/graph/levels/level$LEVEL"

echo "FTS"

cat fast.fts.json | arx-convert --from=json --to=fts | implode -b -l --offset=280 --debug --output=fast.fts

cd "$OUTPUTDIR/graph/levels/level$LEVEL"

echo "LLF"

cat level$LEVEL.llf.json | arx-convert --from=json --to=dlf | implode -b -l --offset=0 --debug --output=level$LEVEL.llf

echo "DLF"

cat level$LEVEL.dlf.json | arx-convert --from=json --to=dlf | implode -b -l --offset=8520 --debug --output=level$LEVEL.dlf

echo "done"

tput bel
