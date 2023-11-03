#!/usr/bin/env sh

set -e
pnpm run build:types
cd packages/fws-types/dist

npm publish --access public
