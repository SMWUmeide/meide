#!/bin/sh
set -eu
APP_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TOOL_ROOT="$APP_DIR/../../.local-tools"
export CLOUDSDK_CONFIG="$TOOL_ROOT/gcloud-config"
exec "$TOOL_ROOT/google-cloud-sdk/bin/gcloud" "$@"
