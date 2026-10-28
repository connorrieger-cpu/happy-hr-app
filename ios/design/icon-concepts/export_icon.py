"""Exports a concept as the iOS app icon: full-bleed (iOS rounds the corners) and opaque.

    python3 -I ios/design/icon-concepts/export_icon.py 1d-wink-pint

Writes <concept>-appicon.svg, renders it with Quick Look, then flattens it to an RGB PNG
with no alpha channel (App Store Connect rejects icons that have one) at
ios/HappyHR/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png.
"""
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE.parents[1] / "HappyHR/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png"

slug = sys.argv[1]
svg = (HERE / f"{slug}.svg").read_text()
svg = svg.replace('<rect width="1024" height="1024" rx="230"/>', '<rect width="1024" height="1024"/>', 1)
svg = "\n".join(line for line in svg.splitlines() if 'rx="226" fill="none"' not in line)
full = HERE / f"{slug}-appicon.svg"
full.write_text(svg)

with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(["qlmanage", "-t", "-s", "1024", "-o", tmp, str(full)], check=True, capture_output=True)
    rendered = Path(tmp) / f"{full.name}.png"
    flatten = Path(tmp) / "flatten.swift"
    flatten.write_text("""
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: args[1]) as CFURL, nil)!
let image = CGImageSourceCreateImageAtIndex(source, 0, nil)!
let context = CGContext(data: nil, width: 1024, height: 1024, bitsPerComponent: 8, bytesPerRow: 0,
                        space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
context.draw(image, in: CGRect(x: 0, y: 0, width: 1024, height: 1024))
let destination = CGImageDestinationCreateWithURL(URL(fileURLWithPath: args[2]) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(destination, context.makeImage()!, nil)
CGImageDestinationFinalize(destination)
""")
    subprocess.run(["swift", str(flatten), str(rendered), str(OUT)], check=True)
print("wrote", OUT)
