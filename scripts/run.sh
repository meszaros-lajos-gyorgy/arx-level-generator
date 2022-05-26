#!/bin/bash

LEVEL=$(grep LEVEL .env | cut -d "=" -f2 | tr -d '"')

if [ "$LEVEL" = "" ]; then
  LEVEL=1
fi

OUTPUTDIR=$(grep OUTPUTDIR .env | cut -d "=" -f2 | tr -d '"')

if [ -z "$OUTPUTDIR" ]; then
  OUTPUTDIR=$(pwd)/dist
fi

# windows
if [ -e "$OUTPUTDIR/arx.exe" ]; then
  $("$OUTPUTDIR/arx.exe" --loadlevel "$LEVEL")
fi

# linux
if [ -e "$OUTPUTDIR/arx" ]; then
  $("$OUTPUTDIR/arx" --loadlevel "$LEVEL")
fi
