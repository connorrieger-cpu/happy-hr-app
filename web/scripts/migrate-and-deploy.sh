#!/usr/bin/env bash
# Applies any new database migrations to the live site's D1 database, then
# rebuilds and deploys. The migration has to land first: the new code reads the
# new columns. Run from anywhere:
#   bash scripts/migrate-and-deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."
# nvm on the Linux machine; Homebrew's Node (20+) on the Mac.
if [ -s ~/.nvm/nvm.sh ]; then source ~/.nvm/nvm.sh; else export PATH="/opt/homebrew/bin:$PATH"; fi

npx wrangler d1 migrations apply happy-hr-community --remote
npm run deploy
