#!/bin/bash
dir=$(cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
curl -X PATCH http://localhost:8082/_special/dev --data "{\"DevDir\": \"${dir}\"}"
