#!/usr/bin/env bash
# The fast loop for the iOS app: build, install and relaunch on a simulator,
# then save a screenshot. From ios/:
#   ./sim.sh                 # build, install, launch, screenshot to screens/latest.png
#   ./sim.sh shot name       # just a screenshot, to screens/name.png
#   SIM="iPhone 17" ./sim.sh # pick a simulator by name or UDID (default: the booted one, else iPhone 17)
#   ./sim.sh device          # build, install and launch on the plugged-in iPhone instead
set -euo pipefail
cd "$(dirname "$0")"

BUNDLE=com.happyhr.app
APP=DerivedData/Build/Products/Debug-iphonesimulator/HappyHR.app
UUID_RE='[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}'
mkdir -p screens DerivedData

# A free (Personal Team) build stops opening after about a week; run this again to renew it.
if [ "${1:-}" = device ]; then
  PHONE=$(xcrun devicectl list devices 2>/dev/null | grep -E '(connected|available).*physical' | grep -oE '[0-9A-F]{8}-[0-9A-F]{16}' | head -1 || true)
  [ -n "$PHONE" ] || { echo "No iPhone found. Plug it in (or keep it on the same Wi-Fi), unlock it, and check Developer Mode is on."; exit 1; }
  [ -d HappyHR.xcodeproj ] || xcodegen
  # Release: the debug build runs the deal and map code many times slower, which a phone feels.
  if ! xcodebuild -project HappyHR.xcodeproj -scheme HappyHR -configuration Release -destination "platform=iOS,id=$PHONE" \
    -derivedDataPath DerivedData -allowProvisioningUpdates -quiet build >DerivedData/device-build.log 2>&1; then
    grep -E 'error:|errSec' DerivedData/device-build.log | sort -u
    echo "Build failed. Full log: ios/DerivedData/device-build.log"
    exit 1
  fi
  xcrun devicectl device install app --device "$PHONE" DerivedData/Build/Products/Release-iphoneos/HappyHR.app >/dev/null
  xcrun devicectl device process launch --device "$PHONE" "$BUNDLE" >/dev/null
  echo "Installed and launched on the iPhone."
  exit 0
fi

if [[ "${SIM:-}" =~ ^$UUID_RE$ ]]; then
  DEVICE=$SIM
elif [ -n "${SIM:-}" ]; then
  DEVICE=$(xcrun simctl list devices available | grep -F "$SIM (" | head -1 | grep -oE "$UUID_RE" || true)
else
  DEVICE=$(xcrun simctl list devices booted | grep -oE "$UUID_RE" | head -1 || true)
  [ -n "$DEVICE" ] || DEVICE=$(xcrun simctl list devices available | grep -F "iPhone 17 (" | head -1 | grep -oE "$UUID_RE" || true)
fi
[ -n "$DEVICE" ] || { echo "No simulator found. List them with: xcrun simctl list devices available"; exit 1; }
xcrun simctl bootstatus "$DEVICE" -b >/dev/null

shot() {
  xcrun simctl io "$DEVICE" screenshot "screens/$1.png" >/dev/null 2>&1
  echo "screens/$1.png"
}

if [ "${1:-}" = shot ]; then
  shot "${2:-latest}"
  exit 0
fi

xcodegen >/dev/null  # quick, and picks up added or removed files
if ! xcodebuild -project HappyHR.xcodeproj -scheme HappyHR -destination "platform=iOS Simulator,id=$DEVICE" \
  -derivedDataPath DerivedData -quiet build >DerivedData/build.log 2>&1; then
  grep -E 'error:' DerivedData/build.log | sort -u
  echo "Build failed. Full log: ios/DerivedData/build.log"
  exit 1
fi
grep -E 'warning:' DerivedData/build.log | grep -F '/HappyHR/' | sort -u || true

# Walking times start from Ossington & Dundas, as on the web.
# Ossington & Dundas, unless SIM_LOCATION says otherwise (e.g. SIM_LOCATION=43.5446,-80.2482 for downtown Guelph).
xcrun simctl location "$DEVICE" set "${SIM_LOCATION:-43.6496,-79.4209}" >/dev/null 2>&1 || true
xcrun simctl privacy "$DEVICE" grant location "$BUNDLE" >/dev/null 2>&1 || true
xcrun simctl terminate "$DEVICE" "$BUNDLE" >/dev/null 2>&1 || true
xcrun simctl install "$DEVICE" "$APP"
xcrun simctl launch "$DEVICE" "$BUNDLE" "$@" >/dev/null
sleep "${WAIT:-6}"
shot latest
