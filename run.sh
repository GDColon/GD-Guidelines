#!/usr/bin/env bash

if ! command -v "node" &> /dev/null
then
  echo "Node, the JavaScript runtime was not found. Aborting."
  exit
fi

node lines.js
