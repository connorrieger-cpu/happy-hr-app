#!/usr/bin/env bash
# Switches on sign-in emails: saves RESEND_API_KEY and EMAIL_FROM from .env.local
# as Cloudflare Pages secrets (never printing them). Run from anywhere:
#   bash scripts/set-email-secrets.sh
# Then deploy (bash scripts/migrate-and-deploy.sh applies the accounts tables first).
#
# .env.local needs, from resend.com (free tier) after verifying a domain there:
#   RESEND_API_KEY=re_…
#   EMAIL_FROM=Happy HR <codes@your-domain>
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="/opt/homebrew/bin:$PATH"

for name in RESEND_API_KEY EMAIL_FROM; do
  # The value after "=", without surrounding quotes if there are any.
  value=$(grep "^$name=" .env.local | tail -1 | cut -d= -f2- | sed -e 's/^["'"'"']//' -e 's/["'"'"']$//')
  if [ -z "$value" ]; then
    echo "No $name found in .env.local" >&2
    exit 1
  fi
  printf '%s' "$value" | npx wrangler pages secret put "$name" --project-name happy-hr-beta
done
echo "Saved. Deploy so the live site picks them up."
