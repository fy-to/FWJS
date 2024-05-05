#!/usr/bin/env sh

set -e
pnpm run build:obelix
cd packages/fws-obelix/dist

npm publish --access public
