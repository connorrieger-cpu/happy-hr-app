#!/usr/bin/env bash
# One-time setup on the Mac. From the project folder:
#   bash setup-mac.sh
# Installs XcodeGen and Node with Homebrew (if missing), installs the web app's
# packages, generates the Xcode project, tests the shared Swift core, and makes
# the first git commit. Safe to run again.
set -euo pipefail
cd "$(dirname "$0")"

say() { printf '\n\033[1;33m▸ %s\033[0m\n' "$1"; }

say "Checking Xcode"
if ! xcodebuild -version >/dev/null 2>&1; then
  echo "Xcode isn't ready. Install Xcode 26 from the App Store, open it once, then run:"
  echo "  sudo xcode-select -s /Applications/Xcode.app"
  exit 1
fi
xcodebuild -version | head -1

say "Checking Homebrew"
if ! command -v brew >/dev/null; then
  echo "Homebrew is needed for XcodeGen and Node. Install it from https://brew.sh, then run this again."
  exit 1
fi

say "Installing XcodeGen and Node (if missing)"
command -v xcodegen >/dev/null || brew install xcodegen
command -v node >/dev/null || brew install node
echo "xcodegen $(xcodegen --version 2>/dev/null | tail -1), node $(node --version)"

say "Installing the web app's packages"
(cd web && npm install)
secrets="$HOME/Downloads/happy-hr-secrets.zip"
if [ ! -f web/.env.local ] && [ -f "$secrets" ]; then
  # Adds web/.env.local and web/.dev.vars; never overwrites existing files.
  unzip -n -q "$secrets" -d .
fi
if [ -f web/.env.local ]; then
  echo "Found web/.env.local (Google Maps key and owner password)."
else
  echo "No web/.env.local yet: put happy-hr-secrets.zip in Downloads and run this again, or copy web/.env.example to web/.env.local."
  echo "The web app still runs without it (free map, no owner page)."
fi

say "Generating the Xcode project"
(cd ios && xcodegen)

say "Testing the shared Swift core"
(cd ios/HappyHRCore && swift test)

say "Saving a first git commit"
if [ -d .git ]; then
  echo "Already a git repository; left as is."
elif [ -z "$(git config user.email || true)" ]; then
  echo "Skipped: git doesn't know who you are yet. Run these, then this script again:"
  echo '  git config --global user.name "Your Name"'
  echo '  git config --global user.email "you@example.com"'
else
  git init -q -b main
  git add -A
  git commit -q -m "Happy HR: web app, API and iOS starter from the Linux handoff" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  echo "Committed. Secrets and generated files are git-ignored."
fi

say "Ready"
echo "Open the app:  open ios/HappyHR.xcodeproj   (choose your team under Signing & Capabilities, then ⌘R)"
echo "Or open Claude Code in this folder and ask it to get ios/HappyHR compiling. CLAUDE.md has the context."
