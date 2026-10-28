"""Round two: concept 1 (the glass smile) without the dated black outline.

    python3 -I ios/design/icon-concepts/round2.py   # writes 1a–1e SVGs and sheet2.svg next to this file

Each version keeps the honey squircle and glass disc, and draws the face's edge
another way: rim light, emboss, clear glass. Two of them make the drink the wink.
"""
import re
from pathlib import Path

HERE = Path(__file__).parent
FEAT = "#4A2B00"  # warm espresso instead of black: softer, still crisp at small sizes
CX = CY = 512
R = 318


def svg(body: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
<defs>
  <clipPath id="sq"><rect width="1024" height="1024" rx="230"/></clipPath>
  <clipPath id="faceClip"><circle cx="{CX}" cy="{CY}" r="{R}"/></clipPath>
  <linearGradient id="honey" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stop-color="#FFEC7A"/><stop offset="0.5" stop-color="#FFD60A"/><stop offset="1" stop-color="#F5A000"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.28" cy="0.12" r="0.85">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.08"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="face" cx="0.36" cy="0.26" r="0.86">
    <stop offset="0" stop-color="#FFF6B0"/><stop offset="0.35" stop-color="#FFE23C"/><stop offset="0.75" stop-color="#FFC400"/><stop offset="1" stop-color="#EE9A00"/>
  </radialGradient>
  <linearGradient id="embossFace" x1="0.2" y1="0" x2="0.8" y2="1">
    <stop offset="0" stop-color="#FFE96A"/><stop offset="1" stop-color="#FFBE00"/>
  </linearGradient>
  <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.85"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="rimLight" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="rimShade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0.55" stop-color="#B86A00" stop-opacity="0"/><stop offset="1" stop-color="#B86A00" stop-opacity="0.55"/>
  </linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0.16"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.32"/>
  </linearGradient>
  <linearGradient id="lens" x1="0.15" y1="0" x2="0.85" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.62"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.12"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.38"/>
  </linearGradient>
  <linearGradient id="beer" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFC21A"/><stop offset="1" stop-color="#D97400"/>
  </linearGradient>
  <filter id="lift" x="-40%" y="-40%" width="180%" height="190%">
    <feDropShadow dx="0" dy="30" stdDeviation="34" flood-color="#6B3A00" flood-opacity="0.45"/>
  </filter>
  <filter id="liftSmall" x="-60%" y="-60%" width="220%" height="220%">
    <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#6B3A00" flood-opacity="0.4"/>
  </filter>
  <filter id="blur"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="soft"><feGaussianBlur stdDeviation="3"/></filter>
</defs>
<g clip-path="url(#sq)">
  <rect width="1024" height="1024" fill="url(#honey)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  <circle cx="{CX}" cy="{CY + 8}" r="400" fill="url(#glass)" stroke="#FFFFFF" stroke-opacity="0.65" stroke-width="5"/>
  {body}
  <rect x="4" y="4" width="1016" height="1016" rx="226" fill="none" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="8"/>
</g>
</svg>"""


def eye(side, kind="happy", color=FEAT, w=R * 0.085):
    """side -1 = left, 1 = right. happy: ∩ arc. wink: a gentle closed-eye curve with a flick."""
    x0, x1 = CX + side * R * 0.40, CX + side * R * 0.12
    y = CY - R * 0.06
    if kind == "wink":
        return (f'<path d="M{min(x0, x1):.1f} {y - R * 0.10:.1f} Q{(x0 + x1) / 2:.1f} {y + R * 0.06:.1f} {max(x0, x1):.1f} {y - R * 0.12:.1f}" '
                f'fill="none" stroke="{color}" stroke-width="{w:.1f}" stroke-linecap="round"/>')
    return (f'<path d="M{x0:.1f} {y:.1f} Q{(x0 + x1) / 2:.1f} {y - R * 0.28:.1f} {x1:.1f} {y:.1f}" '
            f'fill="none" stroke="{color}" stroke-width="{w:.1f}" stroke-linecap="round"/>')


def smile(color=FEAT, w=R * 0.09, lift=0.0):
    return (f'<path d="M{CX - R * 0.47:.1f} {CY + R * 0.16:.1f} Q{CX + lift:.1f} {CY + R * 0.70:.1f} {CX + R * 0.47:.1f} {CY + R * (0.16 - lift / R):.1f}" '
            f'fill="none" stroke="{color}" stroke-width="{w:.1f}" stroke-linecap="round"/>')


def glass_cap(strength=0.75):
    return f"""<g clip-path="url(#faceClip)">
    <ellipse cx="{CX}" cy="{CY - R * 0.52}" rx="{R * 0.78}" ry="{R * 0.46}" fill="url(#sheen)" opacity="{strength}"/>
    <ellipse cx="{CX - R * 0.45}" cy="{CY - R * 0.55}" rx="{R * 0.17}" ry="{R * 0.08}" fill="#FFFFFF" opacity="0.9" transform="rotate(-32 {CX - R * 0.45} {CY - R * 0.55})"/>
  </g>"""


def rim():
    """The edge, drawn with light instead of a line: bright on top, warm shade underneath."""
    return f"""<circle cx="{CX}" cy="{CY}" r="{R - 5}" fill="none" stroke="url(#rimLight)" stroke-width="10"/>
  <circle cx="{CX}" cy="{CY}" r="{R - 9}" fill="none" stroke="url(#rimShade)" stroke-width="18"/>"""


def glint(x, y, s, o=0.95):
    return (f'<path d="M{x} {y - s} C{x + s * 0.12} {y - s * 0.12} {x + s * 0.12} {y - s * 0.12} {x + s} {y} '
            f'C{x + s * 0.12} {y + s * 0.12} {x + s * 0.12} {y + s * 0.12} {x} {y + s} '
            f'C{x - s * 0.12} {y + s * 0.12} {x - s * 0.12} {y + s * 0.12} {x - s} {y} '
            f'C{x - s * 0.12} {y - s * 0.12} {x - s * 0.12} {y - s * 0.12} {x} {y - s}Z" fill="#FFFFFF" opacity="{o}"/>')


def soft_face(features: str) -> str:
    """The raised honey face with a light-drawn rim, glass cap and the given features."""
    return f"""<circle cx="{CX}" cy="{CY}" r="{R}" fill="#F2B000" filter="url(#lift)"/>
  <circle cx="{CX}" cy="{CY}" r="{R}" fill="url(#face)"/>
  <g clip-path="url(#faceClip)">
    <ellipse cx="{CX}" cy="{CY + R * 1.05}" rx="{R * 1.1}" ry="{R * 0.55}" fill="#C27000" opacity="0.2" filter="url(#blur)"/>
    {features}
  </g>
  {glass_cap()}
  {rim()}"""


# 1a. Soft glass: the face's edge is light (a bright top rim, a warm shade below) and a
# deeper shadow, so it floats without a line. Espresso features instead of black.
soft_glass = svg(f"""{soft_face(eye(-1) + eye(1) + smile())}
  {glint(760, 250, 34)}""")

# 1b. Embossed: one honey surface, the face pressed up from it and the features carved in,
# like a machined Apple badge.
def carved(path_svg: str) -> str:
    light = path_svg.replace(f'stroke="{FEAT}"', 'stroke="#FFF4B8"')
    dark = path_svg.replace(f'stroke="{FEAT}"', 'stroke="#B86400"')
    return (f'<g transform="translate(0 6)" opacity="0.9">{light}</g>'
            f'<g>{dark}</g>')

embossed = svg(f"""<circle cx="{CX}" cy="{CY}" r="{R}" fill="#F2B000" filter="url(#lift)"/>
  <circle cx="{CX}" cy="{CY}" r="{R}" fill="url(#embossFace)"/>
  <g clip-path="url(#faceClip)">
    <circle cx="{CX + 24}" cy="{CY + 30}" r="{R}" fill="none" stroke="#C27000" stroke-opacity="0.35" stroke-width="40" filter="url(#blur)"/>
    {carved(eye(-1))}{carved(eye(1))}{carved(smile())}
  </g>
  <circle cx="{CX}" cy="{CY}" r="{R - 4}" fill="none" stroke="url(#rimLight)" stroke-width="8"/>
  {glint(760, 250, 30, 0.85)}""")

# 1c. Clear lens: the face is a disc of Liquid Glass over the honey, its features etched in amber.
clear_lens = svg(f"""<circle cx="{CX}" cy="{CY}" r="{R}" fill="#FFF3A6" opacity="0.55" filter="url(#lift)"/>
  <circle cx="{CX}" cy="{CY}" r="{R}" fill="url(#lens)"/>
  <g clip-path="url(#faceClip)">
    <circle cx="{CX - 30}" cy="{CY - 40}" r="{R * 0.9}" fill="#FFE34A" opacity="0.35"/>
    {eye(-1, color="#9A5A00")}{eye(1, color="#9A5A00")}{smile(color="#9A5A00")}
    <ellipse cx="{CX}" cy="{CY + R * 0.95}" rx="{R * 0.9}" ry="{R * 0.35}" fill="#FFFFFF" opacity="0.25" filter="url(#blur)"/>
  </g>
  {glass_cap(0.9)}
  <circle cx="{CX}" cy="{CY}" r="{R - 3}" fill="none" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="6"/>
  {glint(760, 250, 34)}""")

# 1d. Wink and a pint: the right eye winks while a little pint comes up for a cheers.
pint = "M-62 -96 L62 -96 L50 92 Q49 104 37 104 L-37 104 Q-49 104 -50 92Z"
pint_beer = "M-57 -50 L57 -50 L50 92 Q49 104 37 104 L-37 104 Q-49 104 -50 92Z"
wink_pint = svg(f"""{soft_face(eye(-1) + eye(1) + smile(lift=18))}
  <g transform="translate(770 700) rotate(-16) scale(1.45)" filter="url(#liftSmall)">
    <path d="{pint_beer}" fill="url(#beer)"/>
    <path d="M-66 -92 Q-40 -126 -8 -100 Q22 -132 52 -102 Q78 -112 70 -66 L-58 -52Z" fill="#FFFDF2"/>
    <path d="{pint}" fill="url(#glass)" fill-opacity="0.55" stroke="{FEAT}" stroke-width="12" stroke-linejoin="round"/>
    <rect x="-44" y="-80" width="14" height="164" rx="7" fill="#FFFFFF" opacity="0.5"/>
    <circle cx="10" cy="30" r="7" fill="#FFFFFF" opacity="0.7"/><circle cx="-12" cy="62" r="5" fill="#FFFFFF" opacity="0.7"/>
  </g>
  {glint(700, 520, 24, 0.9)}
  {glint(250, 250, 30)}""")

# 1e. Martini wink: the winking eye is a little martini glass, olive and all.
martini = (f'<g transform="translate({CX + R * 0.27:.1f} {CY - R * 0.22:.1f}) rotate(-10) scale(1.12)">'
           f'<path d="M-52 -44 L52 -44 L7 10 L7 40 L28 40 Q34 40 34 46 Q34 50 28 50 L-28 50 Q-34 50 -34 46 Q-34 40 -28 40 L-7 40 L-7 10Z" fill="{FEAT}" stroke="{FEAT}" stroke-width="8" stroke-linejoin="round"/>'
           f'<path d="M-36 -34 L36 -34 L22 -17 L-22 -17Z" fill="#FFE27A"/>'
           f'<circle cx="16" cy="-24" r="10" fill="#8CC152"/><path d="M16 -24 L36 -66" stroke="{FEAT}" stroke-width="6" stroke-linecap="round"/></g>')
martini_wink = svg(f"""{soft_face(eye(-1) + martini + smile(lift=18))}
  {glint(760, 250, 34)}""")

CONCEPTS = [
    ("1a-soft-glass", "Soft glass", "No outline: a rim of light on top, a warm shade below, a deeper float."),
    ("1b-embossed", "Embossed", "One honey surface; the face presses up and the features are carved in."),
    ("1c-clear-lens", "Clear lens", "The face is a disc of Liquid Glass, its features etched in amber."),
    ("1d-wink-pint", "Wink and a pint", "One eye winks while a little pint comes up for a cheers."),
    ("1e-martini-wink", "Martini wink", "The winking eye is a tiny martini, olive and all."),
]
CONTENT = {"1a-soft-glass": soft_glass, "1b-embossed": embossed, "1c-clear-lens": clear_lens,
           "1d-wink-pint": wink_pint, "1e-martini-wink": martini_wink}
for slug, content in CONTENT.items():
    (HERE / f"{slug}.svg").write_text(content)


def inline(content: str, prefix: str, x: float, y: float, size: float) -> str:
    body = re.sub(r'id="([^"]+)"', lambda m: f'id="{prefix}{m.group(1)}"', content)
    body = re.sub(r"url\(#([^)]+)\)", lambda m: f"url(#{prefix}{m.group(1)})", body)
    return body.replace('width="1024" height="1024"', f'x="{x}" y="{y}" width="{size}" height="{size}"', 1)


W = H = 2400
ICON, GAP = 600, 75
LEFT = (W - 3 * ICON - 2 * GAP) // 2
FONT = 'font-family="-apple-system, Helvetica"'
parts = [f'<rect width="{W}" height="{H}" fill="#141006"/>',
         f'<text x="{LEFT}" y="130" {FONT} font-size="72" font-weight="700" fill="#FFF8E1">Glass smile, round two</text>',
         f'<text x="{LEFT}" y="196" {FONT} font-size="34" fill="#FFF8E1" fill-opacity="0.65">No black outline. The edge is drawn with light, emboss or glass; two make the drink the wink.</text>']
for i, (slug, name, blurb) in enumerate(CONCEPTS):
    row, col = divmod(i, 3)
    x, y = LEFT + col * (ICON + GAP), 270 + row * 840
    parts.append(inline(CONTENT[slug], f"c{i}", x, y, ICON))
    parts.append(f'<text x="{x}" y="{y + ICON + 72}" {FONT} font-size="42" font-weight="700" fill="#FFF8E1">{chr(97 + i).upper()}. {name}</text>')
    words, line, lines = blurb.split(), "", []
    for w in words:
        if len(line + " " + w) > 36:
            lines.append(line)
            line = w
        else:
            line = (line + " " + w).strip()
    lines.append(line)
    for j, l in enumerate(lines):
        parts.append(f'<text x="{x}" y="{y + ICON + 122 + j * 42}" {FONT} font-size="31" fill="#FFF8E1" fill-opacity="0.7">{l}</text>')
px, py = LEFT + 2 * (ICON + GAP), 1110
parts.append('<defs><radialGradient id="wall" cx="0.2" cy="0" r="1.3"><stop offset="0" stop-color="#4B3A8A"/><stop offset="0.55" stop-color="#1B1638"/><stop offset="1" stop-color="#0D0B1C"/></radialGradient></defs>')
parts.append(f'<rect x="{px}" y="{py}" width="{ICON}" height="{ICON}" rx="70" fill="url(#wall)"/>')
parts.append(f'<text x="{px + ICON / 2}" y="{py + 70}" text-anchor="middle" {FONT} font-size="30" fill="#FFFFFF" fill-opacity="0.75">At home-screen size</text>')
for i, (slug, _, _) in enumerate(CONCEPTS):
    r, c = divmod(i, 3)
    x, y = px + 50 + c * 180 + (90 if r == 1 else 0), py + 120 + r * 220
    parts.append(inline(CONTENT[slug], f"h{i}", x, y, 130))
    parts.append(f'<text x="{x + 65}" y="{y + 174}" text-anchor="middle" {FONT} font-size="28" fill="#FFFFFF">{chr(65 + i)}</text>')
(HERE / "sheet2.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">' + "\n".join(parts) + "</svg>")
print("wrote", len(CONCEPTS), "round-two concepts and sheet2.svg")
