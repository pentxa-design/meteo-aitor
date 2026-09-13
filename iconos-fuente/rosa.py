# -*- coding: utf-8 -*-
"""Rosa de los vientos con sol y nube. Cuatro versiones para que elija."""
import math, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

S = 4; N = 512 * S
def p(x, y): return (x * S, y * S)
def px(v):   return int(v * S)

def fuente(tam):
    for f in ['/System/Library/Fonts/Supplemental/Arial Bold.ttf',
              '/System/Library/Fonts/HelveticaNeue.ttc',
              '/System/Library/Fonts/SFNSDisplay.ttf']:
        try: return ImageFont.truetype(f, px(tam))
        except Exception: pass
    return ImageFont.load_default()

def degradado(arriba, abajo, gamma=0.9):
    im = Image.new('RGB', (N, N)); d = ImageDraw.Draw(im)
    for y in range(N):
        t = (y / (N - 1)) ** gamma
        d.line([(0, y), (N, y)],
               fill=tuple(int(arriba[i] + (abajo[i] - arriba[i]) * t) for i in range(3)))
    return im.convert('RGBA')

def capa(): return Image.new('RGBA', (N, N), (0, 0, 0, 0))

def sombra(forma, desenfoque=18, baja=10, alfa=110):
    s = forma.copy()
    s.putdata([(0, 0, 0, int(a * alfa / 255)) for (_, _, _, a) in s.getdata()])
    s = s.filter(ImageFilter.GaussianBlur(desenfoque * S / 4))
    out = capa(); out.paste(s, (0, px(baja)), s); return out

# ── ROSA DE LOS VIENTOS ────────────────────────────────────────────
def rosa(cx, cy, R, claro, oscuro, corto=0.58, valle=0.15):
    c = capa(); d = ImageDraw.Draw(c)
    def xy(a, r): return (cx + r * math.cos(a), cy + r * math.sin(a))
    vert = [math.radians(-90 + i * 45) for i in range(8)]
    vall = [(math.radians(-90 + i * 45 + 22.5), R * valle) for i in range(8)]
    for i, a in enumerate(vert):
        r = R if i % 2 == 0 else R * corto
        ap = xy(a, r)
        vp = xy(*vall[(i - 1) % 8]); vn = xy(*vall[i])
        d.polygon([p(cx, cy), p(*ap), p(*vp)], fill=oscuro)   # media punta en sombra
        d.polygon([p(cx, cy), p(*ap), p(*vn)], fill=claro)    # media a la luz
    return c

def aro(cx, cy, R, color, grosor=7, marcas=True):
    c = capa(); d = ImageDraw.Draw(c)
    d.ellipse([p(cx - R, cy - R), p(cx + R, cy + R)], outline=color, width=px(grosor))
    if marcas:
        for i in range(32):
            a = math.radians(i * 11.25)
            larga = (i % 4 == 0)
            r0, r1 = R - (14 if larga else 7), R - 2
            d.line([p(cx + r0 * math.cos(a), cy + r0 * math.sin(a)),
                    p(cx + r1 * math.cos(a), cy + r1 * math.sin(a))],
                   fill=color, width=px(5 if larga else 3))
    return c

def letras(cx, cy, R, color, tam=42):
    c = capa(); d = ImageDraw.Draw(c); f = fuente(tam)
    for txt, a in [('N', -90), ('E', 0), ('S', 90), ('O', 180)]:
        x = cx + R * math.cos(math.radians(a)); y = cy + R * math.sin(math.radians(a))
        d.text(p(x, y), txt, font=f, fill=color, anchor='mm')
    return c

# ── SOL ────────────────────────────────────────────────────────────
def sol(im, cx, cy, R, centro=(0xFF, 0xE1, 0x8A), borde=(0xFF, 0xA6, 0x1E),
        rayos=0, brillo=150):
    g = capa()
    ImageDraw.Draw(g).ellipse([p(cx - R * 2.1, cy - R * 2.1), p(cx + R * 2.1, cy + R * 2.1)],
                              fill=borde + (brillo,))
    im = Image.alpha_composite(im, g.filter(ImageFilter.GaussianBlur(52 * S / 4)))
    c = capa(); d = ImageDraw.Draw(c)
    if rayos:
        for i in range(rayos):
            a = math.radians(i * 360 / rayos + 11)
            r0, r1 = R * 1.30, R * 1.78
            d.line([p(cx + r0 * math.cos(a), cy + r0 * math.sin(a)),
                    p(cx + r1 * math.cos(a), cy + r1 * math.sin(a))],
                   fill=borde + (255,), width=px(13))
    pasos = 46
    for i in range(pasos, 0, -1):
        t = i / pasos; r = R * t
        col = tuple(int(centro[k] + (borde[k] - centro[k]) * (1 - t) ** 0.7) for k in range(3))
        d.ellipse([p(cx - r, cy - r), p(cx + r, cy + r)], fill=col + (255,))
    return Image.alpha_composite(im, c)

# ── NUBE ───────────────────────────────────────────────────────────
def nube(cx, cy, w, alto=(0xFF, 0xFF, 0xFF), bajo=(0xC8, 0xD8, 0xEC)):
    m = Image.new('L', (N, N), 0); d = ImageDraw.Draw(m)
    u = w / 100.0
    bolas = [(-30, 2, 30), (-2, -16, 38), (26, -2, 30), (46, 10, 22)]
    for dx, dy, r in bolas:
        d.ellipse([p(cx + dx * u - r * u, cy + dy * u - r * u),
                   p(cx + dx * u + r * u, cy + dy * u + r * u)], fill=255)
    d.rounded_rectangle([p(cx - 58 * u, cy + 6 * u), p(cx + 66 * u, cy + 34 * u)],
                        radius=px(17 * u), fill=255)
    g = Image.new('RGB', (N, N)); gd = ImageDraw.Draw(g)
    for y in range(N):
        t = min(1, max(0, (y / S - (cy - 55 * u)) / (95 * u)))
        gd.line([(0, y), (N, y)], fill=tuple(int(alto[i] + (bajo[i] - alto[i]) * t) for i in range(3)))
    c = g.convert('RGBA'); c.putalpha(m); return c

def redondear(im, r=112):
    m = Image.new('L', (N, N), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, N - 1, N - 1], radius=px(r), fill=255)
    o = im.copy(); o.putalpha(m); return o

NAVY   = ((0x1B, 0x2E, 0x4E), (0x06, 0x0A, 0x13))
CIELO  = ((0x4E, 0xA6, 0xE8), (0x0E, 0x3E, 0x6E))
ORO_C, ORO_O   = (0xFF, 0xD9, 0x82) + (255,), (0xC0, 0x83, 0x1C) + (255,)
PLATA_C, PLATA_O = (0xFF, 0xFF, 0xFF) + (255,), (0x8E, 0xA6, 0xC4) + (255,)

def A():
    im = degradado(*NAVY)
    im = sol(im, 340, 178, 74, rayos=12)
    r = rosa(256, 268, 200, ORO_C, ORO_O)
    im = Image.alpha_composite(im, sombra(r))
    im = Image.alpha_composite(im, aro(256, 268, 218, (0xFF, 0xD9, 0x82, 110), 6))
    im = Image.alpha_composite(im, r)
    n = nube(212, 372, 210)
    im = Image.alpha_composite(im, sombra(n, 22, 12, 120))
    return Image.alpha_composite(im, n)

def B():
    im = degradado(*CIELO, gamma=1.15)
    im = sol(im, 356, 162, 66, rayos=12, brillo=175)
    r = rosa(256, 262, 196, PLATA_C, PLATA_O)
    im = Image.alpha_composite(im, sombra(r, 20, 12, 130))
    im = Image.alpha_composite(im, r)
    n = nube(228, 376, 224)
    im = Image.alpha_composite(im, sombra(n, 24, 14, 110))
    return Image.alpha_composite(im, n)

def C():
    im = degradado(*NAVY)
    im = sol(im, 256, 240, 60, rayos=0, brillo=130)
    im = Image.alpha_composite(im, aro(256, 256, 208, PLATA_C, 9))
    im = Image.alpha_composite(im, letras(256, 256, 176, (0xFF, 0xFF, 0xFF, 235), 40))
    r = rosa(256, 256, 136, ORO_C, ORO_O)
    im = Image.alpha_composite(im, sombra(r, 14, 8, 120))
    im = Image.alpha_composite(im, r)
    n = nube(238, 356, 176)
    im = Image.alpha_composite(im, sombra(n, 20, 12, 130))
    return Image.alpha_composite(im, n)

def D():
    im = degradado((0x24, 0x3A, 0x60), (0x08, 0x0D, 0x18))
    im = sol(im, 256, 216, 96, rayos=16, brillo=165)
    r = rosa(256, 256, 224, ORO_C, ORO_O, corto=0.52, valle=0.12)
    im = Image.alpha_composite(im, sombra(r, 22, 12, 140))
    im = Image.alpha_composite(im, r)
    n = nube(256, 392, 250)
    im = Image.alpha_composite(im, sombra(n, 26, 14, 120))
    return Image.alpha_composite(im, n)

aqui = os.path.dirname(os.path.abspath(__file__))
for nom, fn in [('1-oro', A), ('2-dia', B), ('3-brujula', C), ('4-grande', D)]:
    g = redondear(fn())
    g.resize((512, 512), Image.LANCZOS).save(os.path.join(aqui, 'rosa-' + nom + '.png'))
    tira = Image.new('RGBA', (320 * 4, 110 * 4), (0, 0, 0, 0)); x = 10 * 4
    for lado in (192, 120, 72, 48):
        ch = g.resize((lado * 2, lado * 2), Image.LANCZOS)
        tira.paste(ch, (x, (110 * 4 - ch.size[1]) // 2), ch); x += ch.size[0] + 40
    tira.resize((320, 110), Image.LANCZOS).save(os.path.join(aqui, 'rosa-' + nom + '-tira.png'))
    print('  ', nom)
