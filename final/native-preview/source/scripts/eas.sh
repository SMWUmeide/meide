#!/bin/sh
set -eu
APP_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
LOCAL_NODE="$APP_DIR/../../.local-tools/node-v22.23.5-darwin-arm64/bin"
if [ -x "$LOCAL_NODE/node" ]; then export PATH="$LOCAL_NODE:$PATH"; fi
cd "$APP_DIR"
# This workspace also contains unrelated design and server files. Restrict the
# build archive to this app without creating a commit or uploading to GitHub.
export EAS_NO_VCS=1
export EAS_PROJECT_ROOT="$APP_DIR"
exec npx --yes eas-cli@latest "$@"
