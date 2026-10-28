#!/usr/bin/env bash
# Archives a release build and uploads it to App Store Connect for TestFlight. From ios/:
#   ./testflight.sh
# Apple signs it in the cloud (no distribution key on this Mac), and Xcode bumps the build
# number if it's taken. Testers on the public link get it once Apple has processed it
# (and, after a big change, passed beta review).
set -euo pipefail
cd "$(dirname "$0")"

xcodegen >/dev/null
rm -rf DerivedData/HappyHR.xcarchive DerivedData/export
if ! xcodebuild -project HappyHR.xcodeproj -scheme HappyHR -configuration Release -destination 'generic/platform=iOS' \
  -archivePath DerivedData/HappyHR.xcarchive -derivedDataPath DerivedData -allowProvisioningUpdates -quiet archive >DerivedData/archive.log 2>&1; then
  grep -E 'error:|errSec' DerivedData/archive.log | sort -u
  echo "Archive failed. Full log: ios/DerivedData/archive.log"
  exit 1
fi
if ! xcodebuild -exportArchive -archivePath DerivedData/HappyHR.xcarchive -exportOptionsPlist ExportOptions.plist \
  -exportPath DerivedData/export -allowProvisioningUpdates >DerivedData/upload.log 2>&1; then
  grep -iE 'error' DerivedData/upload.log | sort -u
  echo "Upload failed. Full log: ios/DerivedData/upload.log"
  exit 1
fi
echo "Uploaded. App Store Connect emails when it's processed (usually 5–30 minutes)."
