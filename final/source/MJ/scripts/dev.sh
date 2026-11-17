#!/bin/sh
set -eu
APP_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
LOCAL_NODE="$APP_DIR/../../.local-tools/node-v22.23.5-darwin-arm64/bin"
if [ -x "$LOCAL_NODE/node" ]; then
  export PATH="$LOCAL_NODE:$PATH"
fi
cd "$APP_DIR"
exec npm "$@"
