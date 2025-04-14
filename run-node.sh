#!/bin/bash
docker run --rm -it \
  -v "$(pwd):/app" \
  -p 3000:3000 \
  -p 9229:9229 \
  --name my-node-app \
  $(docker build -q -f Dockerfile.node .) \
  bash
