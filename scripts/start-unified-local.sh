#!/bin/zsh
# Compatibility entrypoint. All normal previews use this checkout on port 3100.
set -eu
cd "${0:A:h:h}"
exec /usr/local/bin/node scripts/start-local.mjs
