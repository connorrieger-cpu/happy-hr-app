"""Five app-icon directions for Happy HR, as 1024 px SVGs, plus a contact sheet.

    python3 -I ios/design/icon-concepts/make.py   # writes the SVGs and sheet.html next to this file

Shared language: a honey squircle, a raised smiley with a near-black outline, and
Liquid Glass sheen (soft white caps, rim light, a lifted shadow).
"""
from pathlib import Path

HERE = Path(__file__).parent
INK = "#1C1300"


def svg(body: str, defs: str = "") -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
<defs>
  <clipPath id="sq"><rect width="1024" height="1024" rx="230"/></clipPath>
  <linearGradient id="honey" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stop-color="#FFEC7A"/><stop offset="0.5" stop-color="#FFD60A"/><stop offset="1" stop-color="#F5A000"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.28" cy="0.12" r="0.85">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.08"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="face" cx="0.36" cy="0.26" r="0.86">
    <stop offset="0" stop-color="#FFF6B0"/><stop offset="0.35" stop-color="#FFE23C"/><stop offset="0.75" stop-color="#FFC400"/><stop offset="1" stop-color="#EE9A00"/>
  </radialGradient>
  <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.85"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0.16"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.32"/>
  </linearGradient>
  <linearGradient id="beer" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFC21A"/><stop offset="1" stop-color="#D97400"/>
  </linearGradient>
  <linearGradient id="night" x1="0.2" y1="0" x2="0.8" y2="1">
    <stop offset="0" stop-color="#3A2A08"/><stop offset="0.5" stop-color="#1A1203"/><stop offset="1" stop-color="#0B0801"/>
  </linearGradient>
  <filter id="lift" x="-40%" y="-40%" width="180%" height="190%">
    <feDropShadow dx="0" dy="26" stdDeviation="30" flood-color="#6B3A00" flood-opacity="0.42"/>
  </filter>
  <filter id="liftDark" x="-40%" y="-40%" width="180%" height="190%">
    <feDropShadow dx="0" dy="30" stdDeviation="34" flood-color="#3D2200" flood-opacity="0.55"/>
  </filter>
  <filter id="blur"><feGaussianBlur stdDeviation="14"/></filter>
  {defs}
</defs>
<g clip-path="url(#sq)">
  <rect width="1024" height="1024" fill="url(#honey)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  {body}
  <rect x="4" y="4" width="1016" height="1016" rx="226" fill="none" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="8"/>
</g>
</svg>"""


def face_features(cx, cy, r, ink=INK, eyes=True):
    w = r * 0.085
    out = []
    if eyes:
        for s in (-1, 1):
            x0, x1 = cx + s * r * 0.40, cx + s * r * 0.12
            out.append(
                f'<path d="M{x0:.1f} {cy - r * 0.06:.1f} Q{(x0 + x1) / 2:.1f} {cy - r * 0.34:.1f} {x1:.1f} {cy - r * 0.06:.1f}" '
                f'fill="none" stroke="{ink}" stroke-width="{w:.1f}" stroke-linecap="round"/>')
    out.append(
        f'<path d="M{cx - r * 0.47:.1f} {cy + r * 0.16:.1f} Q{cx:.1f} {cy + r * 0.70:.1f} {cx + r * 0.47:.1f} {cy + r * 0.16:.1f}" '
        f'fill="none" stroke="{ink}" stroke-width="{w * 1.05:.1f}" stroke-linecap="round"/>')
    return "\n".join(out)


def smiley(cx, cy, r, cid, outline=INK):
    """A raised, black-outlined smiley with a glass cap and a specular glint."""
    return f"""
  <clipPath id="{cid}"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>
  <circle cx="{cx}" cy="{cy}" r="{r}" fill="#F2B000" filter="url(#lift)"/>
  <circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#face)"/>
  <g clip-path="url(#{cid})">
    <ellipse cx="{cx}" cy="{cy + r * 1.05}" rx="{r * 1.1}" ry="{r * 0.55}" fill="#C27000" opacity="0.22" filter="url(#blur)"/>
    {face_features(cx, cy, r)}
    <ellipse cx="{cx}" cy="{cy - r * 0.52}" rx="{r * 0.78}" ry="{r * 0.46}" fill="url(#sheen)" opacity="0.75"/>
    <ellipse cx="{cx - r * 0.45}" cy="{cy - r * 0.55}" rx="{r * 0.17}" ry="{r * 0.08}" fill="#FFFFFF" opacity="0.9" transform="rotate(-32 {cx - r * 0.45} {cy - r * 0.55})"/>
  </g>
  <circle cx="{cx}" cy="{cy}" r="{r - r * 0.04}" fill="none" stroke="{outline}" stroke-width="{r * 0.08:.1f}"/>
  <path d="M{cx - r * 0.78:.1f} {cy - r * 0.42:.1f} A{r * 0.9:.1f} {r * 0.9:.1f} 0 0 1 {cx + r * 0.2:.1f} {cy - r * 0.86:.1f}" fill="none" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="{r * 0.025:.1f}" stroke-linecap="round"/>"""


def glint(x, y, s, o=0.95):
    return (f'<path d="M{x} {y - s} C{x + s * 0.12} {y - s * 0.12} {x + s * 0.12} {y - s * 0.12} {x + s} {y} '
            f'C{x + s * 0.12} {y + s * 0.12} {x + s * 0.12} {y + s * 0.12} {x} {y + s} '
            f'C{x - s * 0.12} {y + s * 0.12} {x - s * 0.12} {y + s * 0.12} {x - s} {y} '
            f'C{x - s * 0.12} {y - s * 0.12} {x - s * 0.12} {y - s * 0.12} {x} {y - s}Z" fill="#FFFFFF" opacity="{o}"/>')


# 1. Glass smile: the smiley alone, raised on a glass puck. The calm, classic option.
glass_smile = svg(f"""
  <circle cx="512" cy="520" r="400" fill="url(#glass)" stroke="#FFFFFF" stroke-opacity="0.65" stroke-width="5"/>
  <circle cx="512" cy="520" r="400" fill="none" stroke="#B87400" stroke-opacity="0.18" stroke-width="2"/>
  {smiley(512, 512, 318, "f1")}
  {glint(760, 250, 34)}""")

# 2. Happy pin: Apple Maps' pin-on-a-map, made ours. A black glass pin with the smiley
# inside, standing on a honey street map with Ossington running through it.
pin_path = "M512 860 C470 780 252 640 252 448 A260 260 0 1 1 772 448 C772 640 554 780 512 860Z"
happy_pin = svg(f"""
  <g stroke="#FFFFFF" stroke-linecap="round" fill="none">
    <path d="M610 -40 L455 1064" stroke-width="58" stroke-opacity="0.62"/>
    <path d="M-40 250 L1064 330" stroke-width="40" stroke-opacity="0.5"/>
    <path d="M-40 780 L1064 845" stroke-width="40" stroke-opacity="0.5"/>
    <path d="M220 -40 L130 1064 M860 -40 L790 1064 M-40 520 L1064 585" stroke-width="18" stroke-opacity="0.35"/>
  </g>
  <ellipse cx="512" cy="868" rx="120" ry="30" fill="#5A3300" opacity="0.45" filter="url(#blur)"/>
  <path d="{pin_path}" fill="url(#night)" filter="url(#liftDark)"/>
  <path d="{pin_path}" fill="none" stroke="#FFD60A" stroke-opacity="0.55" stroke-width="6"/>
  <clipPath id="pinClip"><path d="{pin_path}"/></clipPath>
  <g clip-path="url(#pinClip)">
    <ellipse cx="470" cy="270" rx="230" ry="130" fill="url(#sheen)" opacity="0.28"/>
  </g>
  {smiley(512, 450, 188, "f2", outline="#FFE36A")}
  {glint(330, 300, 26, 0.8)}""")

# 3. Cheers: a pint and a coupe clinking over the smile. Clear glass with ink outlines.
pint = "M-110 -170 L110 -170 L86 170 Q84 190 64 190 L-64 190 Q-84 190 -86 170Z"
pint_beer = "M-100 -90 L100 -90 L86 170 Q84 190 64 190 L-64 190 Q-84 190 -86 170Z"
coupe_bowl = "M-150 -150 L150 -150 Q150 20 0 40 Q-150 20 -150 -150Z"
coupe_wine = "M-138 -100 L138 -100 Q128 14 0 30 Q-128 14 -138 -100Z"
cheers = svg(f"""
  <path d="M262 742 Q512 948 762 742" fill="none" stroke="{INK}" stroke-width="44" stroke-linecap="round" filter="url(#lift)"/>
  <g transform="translate(388 410) rotate(13) scale(0.9)" filter="url(#lift)">
    <path d="{pint_beer}" fill="url(#beer)"/>
    <path d="M-104 -150 Q-60 -200 -10 -160 Q30 -210 80 -165 Q120 -190 112 -120 L-100 -100Z" fill="#FFFDF2"/>
    <path d="{pint}" fill="url(#glass)" fill-opacity="0.5" stroke="{INK}" stroke-width="22" stroke-linejoin="round"/>
    <circle cx="-30" cy="40" r="12" fill="#FFFFFF" opacity="0.7"/><circle cx="20" cy="100" r="9" fill="#FFFFFF" opacity="0.7"/><circle cx="-10" cy="-20" r="7" fill="#FFFFFF" opacity="0.7"/>
    <rect x="-80" y="-140" width="26" height="290" rx="13" fill="#FFFFFF" opacity="0.45"/>
  </g>
  <g transform="translate(646 372) rotate(-13) scale(0.9)" filter="url(#lift)">
    <path d="{coupe_wine}" fill="url(#beer)"/>
    <path d="{coupe_bowl}" fill="url(#glass)" fill-opacity="0.5" stroke="{INK}" stroke-width="22" stroke-linejoin="round"/>
    <path d="M0 40 L0 190 M-80 196 L80 196" stroke="{INK}" stroke-width="22" stroke-linecap="round"/>
    <path d="M-120 -130 Q-118 -40 -60 -6" fill="none" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="18" stroke-linecap="round"/>
  </g>
  {glint(516, 196, 50)}
  {glint(596, 128, 22, 0.85)}""")

# 4. Smile in a pint: one glass of beer, foam on top, the smile in the bubbles.
glass_body = "M300 250 L724 250 L684 860 Q680 900 640 900 L384 900 Q344 900 340 860Z"
beer_body = "M312 360 L712 360 L684 860 Q680 900 640 900 L384 900 Q344 900 340 860Z"
smile_pint = svg(f"""
  <path d="{glass_body}" fill="#F2B000" filter="url(#lift)"/>
  <path d="{beer_body}" fill="url(#beer)"/>
  <clipPath id="beerClip"><path d="{beer_body}"/></clipPath>
  <g clip-path="url(#beerClip)">
    {face_features(512, 600, 230)}
    <circle cx="420" cy="800" r="14" fill="#FFFFFF" opacity="0.55"/><circle cx="600" cy="780" r="10" fill="#FFFFFF" opacity="0.55"/><circle cx="650" cy="470" r="12" fill="#FFFFFF" opacity="0.55"/>
  </g>
  <path d="M296 330 Q330 230 420 262 Q470 190 560 240 Q640 200 690 262 Q760 270 728 350 L716 372 Q600 400 512 380 Q420 400 308 372Z" fill="#FFFDF4"/>
  <path d="M640 368 Q660 420 648 440 Q636 456 628 430 Q622 400 640 368Z" fill="#FFFDF4"/>
  <path d="{glass_body}" fill="url(#glass)" opacity="0.55"/>
  <path d="{glass_body}" fill="none" stroke="{INK}" stroke-width="26" stroke-linejoin="round"/>
  <rect x="350" y="300" width="34" height="520" rx="17" fill="#FFFFFF" opacity="0.5" transform="rotate(-3 367 560)"/>
  {glint(770, 230, 40)}""")

# 5. Night glass: a black Liquid Glass disc on honey; the smile is gold, and the
# eyes are a pint and a martini.
mini_pint = "M-34 -50 L34 -50 L26 46 Q25 54 17 54 L-17 54 Q-25 54 -26 46Z"
mini_martini = "M-52 -46 L52 -46 L0 14Z M-5 12 L-5 50 L-30 50 Q-32 58 -24 58 L24 58 Q32 58 30 50 L5 50 L5 12Z"
night_glass = svg(f"""
  <circle cx="512" cy="512" r="360" fill="url(#night)" filter="url(#liftDark)"/>
  <circle cx="512" cy="512" r="356" fill="none" stroke="#FFD60A" stroke-opacity="0.6" stroke-width="8"/>
  <clipPath id="disc"><circle cx="512" cy="512" r="356"/></clipPath>
  <g clip-path="url(#disc)">
    <ellipse cx="470" cy="250" rx="330" ry="170" fill="url(#sheen)" opacity="0.26"/>
    <ellipse cx="512" cy="900" rx="300" ry="120" fill="#FFB800" opacity="0.18" filter="url(#blur)"/>
  </g>
  <g transform="translate(398 450) scale(1.45)"><path d="{mini_pint}" fill="#FFD60A"/><path d="M-32 -50 Q-20 -72 0 -60 Q20 -74 32 -50Z" fill="#FFF6D0"/></g>
  <g transform="translate(626 446) scale(1.45)"><path d="{mini_martini}" fill="#FFD60A"/><circle cx="18" cy="-30" r="9" fill="#9BD15A"/></g>
  <path d="M330 600 Q512 790 694 600" fill="none" stroke="#FFD60A" stroke-width="40" stroke-linecap="round"/>
  {glint(300, 300, 30, 0.9)}""")

CONCEPTS = [
    ("1-glass-smile", "Glass smile", "The smiley alone, raised on a glass disc. Calm and classic.", glass_smile),
    ("2-happy-pin", "Happy pin", "Apple Maps' pin on a honey street map, with the smiley inside.", happy_pin),
    ("3-cheers", "Cheers", "A pint and a coupe clinking over the smile.", cheers),
    ("4-smile-pint", "Smile in a pint", "One glass of beer; the smile is in the bubbles.", smile_pint),
    ("5-night-glass", "Night glass", "A black glass disc on honey; the eyes are a pint and a martini.", night_glass),
]

for slug, _, _, content in CONCEPTS:
    (HERE / f"{slug}.svg").write_text(content)


def inline(content: str, prefix: str, x: float, y: float, size: float) -> str:
    import re
    body = re.sub(r'id="([^"]+)"', lambda m: f'id="{prefix}{m.group(1)}"', content)
    body = re.sub(r"url\(#([^)]+)\)", lambda m: f"url(#{prefix}{m.group(1)})", body)
    body = body.replace('width="1024" height="1024"', f'x="{x}" y="{y}" width="{size}" height="{size}"', 1)
    return body


W = H = 2400
ICON, GAP = 600, 75
LEFT = (W - 3 * ICON - 2 * GAP) // 2
FONT = 'font-family="-apple-system, Helvetica"'
parts = [f'<rect width="{W}" height="{H}" fill="#141006"/>',
         f'<text x="{LEFT}" y="130" {FONT} font-size="72" font-weight="700" fill="#FFF8E1">Happy HR icon directions</text>',
         f'<text x="{LEFT}" y="196" {FONT} font-size="34" fill="#FFF8E1" fill-opacity="0.65">Honey yellow, a raised ink-outlined smile, and Liquid Glass light.</text>']
for i, (slug, name, blurb, content) in enumerate(CONCEPTS):
    row, col = divmod(i, 3)
    x = LEFT + col * (ICON + GAP)
    y = 270 + row * 840
    parts.append(inline(content, f"c{i}", x, y, ICON))
    parts.append(f'<text x="{x}" y="{y + ICON + 72}" {FONT} font-size="42" font-weight="700" fill="#FFF8E1">{i + 1}. {name}</text>')
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
# The home-screen row: the empty third slot of row two, plus a strip below.
px, py, pw, ph = LEFT + 2 * (ICON + GAP), 1110, ICON, ICON
parts.append('<defs><radialGradient id="wall" cx="0.2" cy="0" r="1.3"><stop offset="0" stop-color="#4B3A8A"/><stop offset="0.55" stop-color="#1B1638"/><stop offset="1" stop-color="#0D0B1C"/></radialGradient></defs>')
parts.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="70" fill="url(#wall)"/>')
parts.append(f'<text x="{px + pw / 2}" y="{py + 70}" text-anchor="middle" {FONT} font-size="30" fill="#FFFFFF" fill-opacity="0.75">At home-screen size</text>')
for i, (slug, _, _, content) in enumerate(CONCEPTS):
    r, c = divmod(i, 3)
    s_ = 130
    x = px + 50 + c * 180 + (90 if r == 1 else 0)
    y = py + 120 + r * 220
    parts.append(inline(content, f"h{i}", x, y, s_))
    parts.append(f'<text x="{x + s_ / 2}" y="{y + s_ + 44}" text-anchor="middle" {FONT} font-size="28" fill="#FFFFFF">{i + 1}</text>')
(HERE / "sheet.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">' + "\n".join(parts) + "</svg>")

cards = "\n".join(
    f"""<figure><img src="{slug}.svg" alt=""><figcaption><b>{i}. {name}</b><span>{blurb}</span></figcaption></figure>"""
    for i, (slug, name, blurb, _) in enumerate(CONCEPTS, 1))
dock = "\n".join(f"""<div class="app"><img src="{slug}.svg" alt=""><span>{i}</span></div>""" for i, (slug, _, _, _) in enumerate(CONCEPTS, 1))
(HERE / "sheet.html").write_text(f"""<!doctype html><html><head><meta charset="utf-8"><style>
body{{margin:0;background:#141006;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#FFF8E1}}
.wrap{{width:1600px;padding:56px 64px 64px;box-sizing:border-box}}
h1{{font-size:44px;margin:0 0 6px}} p.sub{{margin:0 0 40px;color:rgba(255,248,225,.65);font-size:22px}}
.grid{{display:grid;grid-template-columns:repeat(5,1fr);gap:28px}}
figure{{margin:0}} figure img{{width:100%;display:block;filter:drop-shadow(0 18px 30px rgba(0,0,0,.45))}}
figcaption{{margin-top:18px;font-size:20px;line-height:1.35}} figcaption b{{display:block;font-size:24px;margin-bottom:4px}}
figcaption span{{color:rgba(255,248,225,.7)}}
.home{{margin-top:48px;border-radius:44px;padding:44px 56px;background:radial-gradient(120% 140% at 20% 0%,#4b3a8a 0%,#1b1638 55%,#0d0b1c 100%);display:flex;gap:56px;align-items:flex-start}}
.home .label{{color:rgba(255,255,255,.75);font-size:18px;width:170px;padding-top:30px}}
.app{{text-align:center}} .app img{{width:128px;height:128px;display:block;filter:drop-shadow(0 8px 14px rgba(0,0,0,.4))}}
.app span{{display:block;margin-top:10px;font-size:20px;color:#fff}}
</style></head><body><div class="wrap">
<h1>Happy HR icon directions</h1><p class="sub">Honey yellow, a raised ink-outlined smile, and Liquid Glass light. Bottom row: actual home-screen size.</p>
<div class="grid">{cards}</div>
<div class="home"><div class="label">On a home screen</div>{dock}</div>
</div></body></html>""")
print("wrote", len(CONCEPTS), "concepts and sheet.html")
