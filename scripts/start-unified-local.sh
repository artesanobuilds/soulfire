#!/bin/zsh
# Local manual-test runner. Reads the existing authorized config without copying secrets.
set -eu
cd /Users/miguelalvarado/Coding/soulfire-unified
export SOULFIRE_EXPERIMENT_REASONED_VOICE=1
export SOULFIRE_DATA_DIR="$HOME/Library/Application Support/soulfire-unified-test"
exec /usr/local/bin/node --env-file=/Users/miguelalvarado/Coding/soulfire/.env.local node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3102
