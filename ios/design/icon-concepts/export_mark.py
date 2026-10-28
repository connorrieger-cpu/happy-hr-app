"""Exports the in-app logo (LogoMark) from a concept: the face and pint on transparency.

    python3 -I ios/design/icon-concepts/export_mark.py 1d-wink-pint

Drops the icon's background, glass disc and rim, crops to the face, renders with Quick
Look and writes ios/HappyHR/Assets.xcassets/LogoMark.imageset/LogoMark.png (1024 px).
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).parent
SET = HERE.parents[1] / "HappyHR/Assets.xcassets/LogoMark.imageset"

slug = sys.argv[1]
drop = ('fill="url(#honey)"', 'fill="url(#glow)"', 'r="400" fill="url(#glass)"', 'rx="226" fill="none"', "M250 220")
lines = [line for line in (HERE / f"{slug}.svg").read_text().splitlines() if not any(d in line for d in drop)]
svg = "\n".join(lines)
svg = svg.replace('<g clip-path="url(#sq)">', "<g>", 1)
svg = svg.replace('viewBox="0 0 1024 1024"', 'viewBox="112 112 800 800"', 1)
mark = HERE / f"{slug}-mark.svg"
mark.write_text(svg)

# Quick Look always paints a white background, so render on white and on black and recover
# each pixel's alpha from the difference (white − black = 1 − alpha).
MATTE = """
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

func pixels(_ path: String) -> [UInt8] {
    let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil)!
    let image = CGImageSourceCreateImageAtIndex(source, 0, nil)!
    var data = [UInt8](repeating: 0, count: 1024 * 1024 * 4)
    let context = CGContext(data: &data, width: 1024, height: 1024, bitsPerComponent: 8, bytesPerRow: 4096,
                            space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
    context.draw(image, in: CGRect(x: 0, y: 0, width: 1024, height: 1024))
    return data
}

let args = CommandLine.arguments
let white = pixels(args[1]), black = pixels(args[2])
var out = [UInt8](repeating: 0, count: white.count)
for i in stride(from: 0, to: white.count, by: 4) {
    let difference = (0..<3).map { Int(white[i + $0]) - Int(black[i + $0]) }.reduce(0, +) / 3
    let alpha = UInt8(max(0, min(255, 255 - difference)))
    for c in 0..<3 { out[i + c] = min(black[i + c], alpha) }  // black-backed = premultiplied colour
    out[i + 3] = alpha
}
let context = CGContext(data: &out, width: 1024, height: 1024, bitsPerComponent: 8, bytesPerRow: 4096,
                        space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
let destination = CGImageDestinationCreateWithURL(URL(fileURLWithPath: args[3]) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(destination, context.makeImage()!, nil)
CGImageDestinationFinalize(destination)
"""

with tempfile.TemporaryDirectory() as tmp:
    renders = []
    for name, colour in (("white", "#FFFFFF"), ("black", "#000000")):
        backed = Path(tmp) / f"{name}.svg"
        backed.write_text(svg.replace("<g>", f'<rect x="0" y="0" width="1024" height="1024" fill="{colour}"/><g>', 1))
        subprocess.run(["qlmanage", "-t", "-s", "1024", "-o", tmp, str(backed)], check=True, capture_output=True)
        renders.append(str(Path(tmp) / f"{name}.svg.png"))
    script = Path(tmp) / "matte.swift"
    script.write_text(MATTE)
    SET.mkdir(parents=True, exist_ok=True)
    for old in SET.glob("LogoMark.*"):
        old.unlink()
    subprocess.run(["swift", str(script), *renders, str(SET / "LogoMark.png")], check=True)
(SET / "Contents.json").write_text(json.dumps(
    {"images": [{"filename": "LogoMark.png", "idiom": "universal"}], "info": {"author": "xcode", "version": 1}}, indent=2) + "\n")
print("wrote", SET / "LogoMark.png")
