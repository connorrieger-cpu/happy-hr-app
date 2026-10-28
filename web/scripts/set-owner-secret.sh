#!/usr/bin/env bash
# Saves OWNER_TOKEN from .env.local as a Cloudflare Pages secret (never printing it),
# then redeploys so the live site picks it up. Run from anywhere:
#   bash scripts/set-owner-secret.sh
set -euo pipefail
cd "$(dirname "$0")/.."
# nvm on the Linux machine; Homebrew's Node (20+) on the Mac.
if [ -s ~/.nvm/nvm.sh ]; then source ~/.nvm/nvm.sh; else export PATH="/opt/homebrew/bin:$PATH"; fi

token=$(grep '^OWNER_TOKEN=' .env.local | cut -d= -f2-)
if [ -z "$token" ]; then
  echo "No OWNER_TOKEN found in .env.local" >&2
  exit 1
fi

printf '%s' "$token" | npx wrangler pages secret put OWNER_TOKEN --project-name happy-hr-beta
npm run deploy
