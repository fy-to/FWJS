#!/usr/bin/env sh

set -e
pnpm run build:js
cd packages/fws-js/dist

npm publish --access public
