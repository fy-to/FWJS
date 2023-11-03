#!/usr/bin/env sh

set -e
pnpm run build:vue
cd packages/fws-vue/dist

npm publish --access public
