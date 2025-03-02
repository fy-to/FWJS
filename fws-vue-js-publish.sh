#!/usr/bin/env sh

set -e
pnpm run build:vue-js
cd packages/fws-vue-js/dist

npm publish --access public
