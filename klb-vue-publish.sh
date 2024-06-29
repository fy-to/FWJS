#!/usr/bin/env sh

set -e
npx pnpm run build:klb
cd packages/klb-vue/dist

npm publish --access public
