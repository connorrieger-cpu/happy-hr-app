"""Wordmark options: "Happy HR" against "Happy Hr" (and friends), in the app's top bar.

    python3 -I ios/design/icon-concepts/wordmark.py   # writes wordmarks.svg next to this file

Each row shows the glass top-bar capsule with the new mark (concept 1d) in dark and light
mode; the strip at the bottom shows the name under the home-screen icon.
"""
import re
from pathlib import Path

HERE = Path(__file__).parent
MARK = (HERE / "1d-wink-pint.svg").read_text()
ROUNDED = 'font-family="ui-rounded, SF Pro Rounded, -apple-system, Helvetica"'
SANS = 'font-family="-apple-system, Helvetica"'

# (letter, label, note, [(text, accent?, extra attrs)], chip?)
OPTIONS = [
    ("A", "Happy HR", "Today’s: HR as an acronym, honey.", [("Happy ", False), ("HR", True)], False),
    ("B", "Happy Hr", "Reads as a word; less corporate, still short.", [("Happy ", False), ("Hr", True)], False),
    ("C", "Happy hr", "Lowercase hr, like a time unit (5 hr).", [("Happy ", False), ("hr", True)], False),
    ("D", "happy hr", "All lowercase: the friendliest, most casual.", [("happy ", False), ("hr", True)], False),
    ("E", "Happy Hr chip", "Happy Hr with Hr in a small glass chip.", [("Happy ", False), ("Hr", True)], True),
]


def mark(prefix, x, y, size):
    """The app icon's face, cropped to a circle, for the top bar."""
    body = re.sub(r'id="([^"]+)"', lambda m: f'id="{prefix}{m.group(1)}"', MARK)
    body = re.sub(r"url\(#([^)]+)\)", lambda m: f"url(#{prefix}{m.group(1)})", body)
    body = body.replace('viewBox="0 0 1024 1024" width="1024" height="1024"',
                        f'viewBox="150 150 724 724" x="{x}" y="{y}" width="{size}" height="{size}"', 1)
    return (f'<clipPath id="{prefix}m"><circle cx="{x + size / 2}" cy="{y + size / 2}" r="{size / 2}"/></clipPath>'
            f'<g clip-path="url(#{prefix}m)">{body}</g>')


def capsule(prefix, x, y, words, chip, dark):
    text, accent = ("#FFF8E1", "#FFD60A") if dark else ("#2B1D00", "#B88400")
    fill = 'fill="#2A2112" fill-opacity="0.78" stroke="#FFFFFF" stroke-opacity="0.16"' if dark \
        else 'fill="#FFFFFF" fill-opacity="0.78" stroke="#7A5200" stroke-opacity="0.16"'
    size, h = 104, 140
    # Rough widths for SF Pro Rounded heavy at 74 px, to size the capsule.
    width = sum(len(t) * 41 + t.count(" ") * -8 for t, _ in words) + (70 if chip else 0)
    w = 40 + size + 26 + width + 44
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h / 2}" {fill} stroke-width="3"/>',
           f'<rect x="{x + 6}" y="{y + 4}" width="{w - 12}" height="{h / 2}" rx="{h / 2 - 4}" fill="#FFFFFF" fill-opacity="{0.07 if dark else 0.35}"/>',
           mark(prefix, x + 22, y + (h - size) / 2, size)]
    tx, ty = x + 22 + size + 26, y + h / 2 + 26
    spans = []
    for t, is_accent in words:
        color = accent if is_accent else text
        if chip and is_accent:
            cw = len(t) * 41 + 52
            out.append(f'<rect x="{tx + len(words[0][0]) * 41 + 2}" y="{y + 26}" width="{cw}" height="{h - 52}" rx="{(h - 52) / 2}" '
                       f'fill="{"#FFD60A" if dark else "#FFD60A"}" fill-opacity="{0.2 if dark else 0.35}" stroke="{accent}" stroke-opacity="0.6" stroke-width="3"/>')
        gap = ' dx="26"' if chip and is_accent else ''
        spans.append(f'<tspan fill="{color}"{gap}>{t.replace(" ", "&#160;")}</tspan>')
    out.append(f'<text x="{tx + (6 if chip else 0)}" y="{ty}" {ROUNDED} font-size="74" font-weight="800">{"".join(spans)}</text>')
    return "\n".join(out)


def map_panel(x, y, w, h, dark):
    base = "#231A0C" if dark else "#F4E7C6"
    road = "#FFFFFF"
    op = 0.06 if dark else 0.55
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="40" fill="{base}"/>'
            f'<g stroke="{road}" stroke-opacity="{op}" stroke-linecap="round">'
            f'<path d="M{x + w * 0.62} {y} L{x + w * 0.55} {y + h}" stroke-width="22"/>'
            f'<path d="M{x} {y + h * 0.3} L{x + w} {y + h * 0.36}" stroke-width="14"/>'
            f'<path d="M{x + w * 0.2} {y} L{x + w * 0.16} {y + h}" stroke-width="8"/></g>')


W = H = 2400
parts = [f'<rect width="{W}" height="{H}" fill="#141006"/>',
         f'<text x="150" y="130" {SANS} font-size="72" font-weight="700" fill="#FFF8E1">Happy HR or Happy Hr?</text>',
         f'<text x="150" y="196" {SANS} font-size="34" fill="#FFF8E1" fill-opacity="0.65">The top bar in dark and light mode, with the new mark. Bottom: the name under the icon.</text>']
for i, (letter, label, note, words, chip) in enumerate(OPTIONS):
    y = 250 + i * 330
    parts.append(f'<text x="150" y="{y + 52}" {SANS} font-size="40" font-weight="700" fill="#FFF8E1">{letter}. {label}</text>')
    parts.append(f'<text x="150" y="{y + 98}" {SANS} font-size="30" fill="#FFF8E1" fill-opacity="0.65">{note}</text>')
    parts.append(map_panel(150, y + 120, 1020, 190, True))
    parts.append(capsule(f"d{i}", 190, y + 145, words, chip, True))
    parts.append(map_panel(1230, y + 120, 1020, 190, False))
    parts.append(capsule(f"l{i}", 1270, y + 145, words, chip, False))

# Home screen: the label under the icon is plain system text, so only the casing differs.
hy = 1930
parts.append('<defs><radialGradient id="wall" cx="0.2" cy="0" r="1.3"><stop offset="0" stop-color="#4B3A8A"/><stop offset="0.55" stop-color="#1B1638"/><stop offset="1" stop-color="#0D0B1C"/></radialGradient></defs>')
parts.append(f'<rect x="150" y="{hy}" width="2100" height="400" rx="60" fill="url(#wall)"/>')
parts.append(f'<text x="210" y="{hy + 210}" {SANS} font-size="32" fill="#FFFFFF" fill-opacity="0.75">Under the icon</text>')
icon = re.sub(r'id="([^"]+)"', lambda m: f'id="hs{m.group(1)}"', MARK)
for k, name in enumerate(["Happy HR", "Happy Hr", "Happy hr", "happy hr"]):
    x = 640 + k * 420
    body = re.sub(r'id="([^"]+)"', lambda m: f'id="h{k}{m.group(1)}"', MARK)
    body = re.sub(r"url\(#([^)]+)\)", lambda m: f"url(#h{k}{m.group(1)})", body)
    parts.append(body.replace('width="1024" height="1024"', f'x="{x}" y="{hy + 70}" width="190" height="190"', 1))
    parts.append(f'<text x="{x + 95}" y="{hy + 320}" text-anchor="middle" {SANS} font-size="34" fill="#FFFFFF">{name}</text>')

(HERE / "wordmarks.svg").write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">' + "\n".join(parts) + "</svg>")
print("wrote wordmarks.svg")
