# -*- coding: utf-8 -*-
"""
EL ICONO DEFINITIVO: la brújula con N-E-S-O, sol y nube.
Elegida por él el 27-08-2026 («de momento pon la segunda foto»).

No lleva torre A PROPÓSITO: la del Centro Operativo ya es una torre azul,
y dos torres en la misma pantalla de inicio se confunden. Dicho por él:
«ya tiene un icono de torre la web operativa».
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rosa import (C, redondear, degradado, sol, aro, letras, rosa, nube,
                  sombra, capa, N, S, NAVY, ORO_C, ORO_O, px)
from PIL import Image, ImageDraw

aqui = os.path.dirname(os.path.abspath(__file__))
sal  = os.path.join(aqui, '..', 'icons')

base = C()                       # el dibujo, a 2048, sin recortar

# ── el normal, con las esquinas redondeadas ────────────────────────
red = redondear(base)
for nombre, lado in [('icon-512.png', 512), ('icon-192.png', 192),
                     ('favicon-64.png', 64), ('apple-touch-icon.png', 180)]:
    red.resize((lado, lado), Image.LANCZOS).save(os.path.join(sal, nombre))
    print('  ', nombre, lado)

# ── EL MASKABLE, que es donde esto se estropea ─────────────────────
# Android lo recorta en CÍRCULO. Con el aro a R=208 sobre 256, la N y la
# S se quedan justo en el filo y se las come. Se encoge el contenido al
# 82 % y el fondo va a sangre, sin esquinas.
chico = base.resize((int(N * 0.82), int(N * 0.82)), Image.LANCZOS)
msk = degradado(*NAVY)
o = int(N * 0.09)
msk.paste(chico, (o, o), chico)
msk.convert('RGB').resize((512, 512), Image.LANCZOS).save(os.path.join(sal, 'maskable-512.png'))
print('   maskable-512.png 512  (contenido al 82 %, para que el círculo no corte la N)')
