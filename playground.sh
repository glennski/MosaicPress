#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"
exec npx --yes @wp-playground/cli@latest server --mount-dir-before-install=build /wordpress --login "$@"
