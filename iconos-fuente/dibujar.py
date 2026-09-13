# -*- coding: utf-8 -*-
"""
EL ICONO DE LA APP DE AITOR.

El que había era sol + nube + monte: el icono de cualquier app del tiempo.
Con esta se decide si sube gente a una torre de 40 m, y su veto es el RAYO.
Eso es lo que tiene que verse en la pantalla del móvil, entre otras veinte
apps y a 48 píxeles.

Se dibuja a 2048 y se reduce, que es lo que da el borde limpio.
"""
from PIL import Image, ImageDraw, ImageFilter
import os

S = 4                      # 512 * 4
N = 512 * S

FONDO_ALTO = (0x16, 0x25, 0x40)
FONDO_BAJO = (0x07, 0x0B, 0x14)
HIERRO     = (0xEC, 0xF1, 0xF9)
RAYO       = (0xFF, 0xB0, 0x20)

def p(x, y):
    return (x * S, y * S)

def lienzo():
    """Fondo con degradado, de navy arriba a casi negro abajo."""
    im = Image.new('RGB', (N, N))
    d = ImageDraw.Draw(im)
    for y in range(N):
        t = y / (N - 1)
        t = t ** 0.85
        d.line([(0, y), (N, y)], fill=tuple(
            int(FONDO_ALTO[i] + (FONDO_BAJO[i] - FONDO_ALTO[i]) * t) for i in range(3)))
    return im.convert('RGBA')

def barra(d, a, b, grosor, color):
    d.line([p(*a), p(*b)], fill=color, width=int(grosor * S), joint='curve')

def torre(d, color=HIERRO):
    """Torre de celosía. Pocos tramos y barras gordas: a 48 px lo fino se funde."""
    BASE_Y, TOP_Y = 442, 196
    BASE_W, TOP_W = 84, 24
    CX = 256

    niveles = [BASE_Y - (BASE_Y - TOP_Y) * i / 4 for i in range(5)]
    def ancho(y):
        t = (BASE_Y - y) / (BASE_Y - TOP_Y)
        return BASE_W + (TOP_W - BASE_W) * t

    # las dos patas
    for lado in (-1, 1):
        barra(d, (CX + lado * BASE_W, BASE_Y), (CX + lado * TOP_W, TOP_Y), 14, color)

    # travesaños y aspas
    for i in range(4):
        y0, y1 = niveles[i], niveles[i + 1]
        w0, w1 = ancho(y0), ancho(y1)
        barra(d, (CX - w1, y1), (CX + w1, y1), 11, color)
        barra(d, (CX - w0, y0), (CX + w1, y1), 10, color)
        barra(d, (CX + w0, y0), (CX - w1, y1), 10, color)

    # el mástil y la cruceta con los dos paneles de antena
    barra(d, (CX, TOP_Y), (CX, 128), 13, color)
    barra(d, (CX - 62, 160), (CX + 62, 160), 12, color)
    for lado in (-1, 1):
        x = CX + lado * 62
        d.rounded_rectangle([p(x - 13, 132), p(x + 13, 190)],
                            radius=7 * S, fill=color)
    # patas al suelo, que no quede flotando
    barra(d, (CX - BASE_W - 16, BASE_Y), (CX + BASE_W + 16, BASE_Y), 13, color)

RAYO_PTS = [(196, 96), (104, 268), (156, 268), (92, 424), (232, 236), (172, 236), (238, 96)]

def rayo(d, color=RAYO):
    d.polygon([p(*q) for q in RAYO_PTS], fill=color)

def dibujo(recorte=None):
    """recorte: cuánto se encoge el contenido (para el maskable)."""
    im = lienzo()

    # resplandor del rayo, para que se despegue del fondo
    glow = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.polygon([p(*q) for q in RAYO_PTS], fill=RAYO + (150,))
    glow = glow.filter(ImageFilter.GaussianBlur(26 * S / 4))
    im = Image.alpha_composite(im, glow)

    capa = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    torre(d)
    rayo(d)

    if recorte:
        chico = capa.resize((int(N * recorte), int(N * recorte)), Image.LANCZOS)
        capa = Image.new('RGBA', (N, N), (0, 0, 0, 0))
        o = int(N * (1 - recorte) / 2)
        capa.paste(chico, (o, o), chico)

    return Image.alpha_composite(im, capa)

def redondear(im, radio_512):
    m = Image.new('L', (N, N), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, N - 1, N - 1],
                                        radius=int(radio_512 * S), fill=255)
    out = im.copy(); out.putalpha(m); return out

aqui = os.path.dirname(os.path.abspath(__file__))
sal = os.path.join(aqui, '..', 'icons')

base = redondear(dibujo(), 112)
for nombre, lado in [('icon-512.png', 512), ('icon-192.png', 192),
                     ('favicon-64.png', 64), ('apple-touch-icon.png', 180)]:
    base.resize((lado, lado), Image.LANCZOS).save(os.path.join(sal, nombre))
    print('  ', nombre, lado)

# El maskable lo recorta Android en círculo: fondo a sangre y contenido al 82 %
msk = dibujo(recorte=0.82).convert('RGB')
msk.resize((512, 512), Image.LANCZOS).save(os.path.join(sal, 'maskable-512.png'))
print('   maskable-512.png 512')
