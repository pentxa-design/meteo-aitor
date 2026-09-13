# -*- coding: utf-8 -*-
"""Tres iconos para que elija. Sin torres."""
from PIL import Image, ImageDraw, ImageFilter
import os

S, N = 4, 512 * 4
NAVY_A, NAVY_B = (0x16, 0x25, 0x40), (0x07, 0x0B, 0x14)
AMBAR  = (0xFF, 0xB0, 0x20)
BLANCO = (0xEC, 0xF1, 0xF9)
AGUA   = (0x4F, 0xA8, 0xFF)
ROJO   = (0xE8, 0x3B, 0x3B)
VERDE  = (0x2ECC, 0x00, 0x00)[0:1]  # no usado
VERDE  = (0x36, 0xC7, 0x59)

def p(x, y): return (x * S, y * S)

def fondo(a=NAVY_A, b=NAVY_B):
    im = Image.new('RGB', (N, N)); d = ImageDraw.Draw(im)
    for y in range(N):
        t = (y / (N - 1)) ** 0.85
        d.line([(0, y), (N, y)], fill=tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)))
    return im.convert('RGBA')

def resplandor(pts, color, radio=26, alfa=150):
    g = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    ImageDraw.Draw(g).polygon([p(*q) for q in pts], fill=color + (alfa,))
    return g.filter(ImageFilter.GaussianBlur(radio * S / 4))

def redondear(im, r=112):
    m = Image.new('L', (N, N), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, N - 1, N - 1], radius=int(r * S), fill=255)
    o = im.copy(); o.putalpha(m); return o

# ── A · SOLO EL RAYO ────────────────────────────────────────────────
RAYO_A = [(300, 62), (150, 292), (244, 292), (196, 450), (368, 214), (270, 214), (346, 62)]
def opcion_a():
    im = fondo()
    im = Image.alpha_composite(im, resplandor(RAYO_A, AMBAR, 34, 165))
    c = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    ImageDraw.Draw(c).polygon([p(*q) for q in RAYO_A], fill=AMBAR)
    return Image.alpha_composite(im, c)

# ── B · EL SEMÁFORO (lo que hace la app: ir o no ir) ────────────────
def opcion_b():
    im = fondo(); c = Image.new('RGBA', (N, N), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
    d.rounded_rectangle([p(166, 74), p(346, 438)], radius=76 * S,
                        fill=(0x10, 0x18, 0x28, 255), outline=BLANCO + (255,), width=11 * S)
    for i, (col, viva) in enumerate([(ROJO, False), (AMBAR, False), (VERDE, True)]):
        cy = 152 + i * 116
        if viva:
            g = Image.new('RGBA', (N, N), (0, 0, 0, 0))
            ImageDraw.Draw(g).ellipse([p(256 - 66, cy - 66), p(256 + 66, cy + 66)], fill=col + (170,))
            im = Image.alpha_composite(im, g.filter(ImageFilter.GaussianBlur(30 * S / 4)))
        rr = 46 if viva else 42
        d.ellipse([p(256 - rr, cy - rr), p(256 + rr, cy + rr)],
                  fill=col + (255 if viva else 80,))
    return Image.alpha_composite(im, c)

# ── C · SUS TRES: VIENTO, LLUVIA Y TORMENTA ─────────────────────────
RAYO_C = [(286, 150), (196, 306), (256, 306), (212, 424), (330, 268), (272, 268), (330, 150)]
def opcion_c():
    im = fondo()
    im = Image.alpha_composite(im, resplandor(RAYO_C, AMBAR, 28, 150))
    c = Image.new('RGBA', (N, N), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
    # viento: tres rachas
    for y, x0, x1 in [(118, 78, 330), (172, 118, 396), (226, 78, 286)]:
        d.line([p(x0, y), p(x1, y)], fill=BLANCO + (255,), width=22 * S)
        d.arc([p(x1 - 30, y - 34), p(x1 + 38, y + 34)], -95, 118,
              fill=BLANCO + (255,), width=22 * S)
    # lluvia: dos gotas
    for x, y in [(126, 320), (162, 402)]:
        d.line([p(x, y), p(x - 26, y + 62)], fill=AGUA + (255,), width=21 * S)
    d.polygon([p(*q) for q in RAYO_C], fill=AMBAR)
    return Image.alpha_composite(im, c)

aqui = os.path.dirname(os.path.abspath(__file__))
for nom, fn in [('A-rayo', opcion_a), ('B-semaforo', opcion_b), ('C-tres', opcion_c)]:
    redondear(fn()).resize((512, 512), Image.LANCZOS).save(os.path.join(aqui, nom + '.png'))
    # y una tira de cómo se ve pequeño de verdad, que es lo que importa
    g = redondear(fn())
    tira = Image.new('RGBA', (300 * 4, 96 * 4), (0, 0, 0, 0))
    x = 8 * 4
    for lado in (192, 96, 64, 48):
        ch = g.resize((lado * 4 // 2, lado * 4 // 2), Image.LANCZOS)
        tira.paste(ch, (x, (96 * 4 - ch.size[1]) // 2), ch)
        x += ch.size[0] + 10 * 4
    tira.resize((300, 96), Image.LANCZOS).save(os.path.join(aqui, nom + '-tira.png'))
    print('  ', nom)
