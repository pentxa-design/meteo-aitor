/* ═══════════════════════════════════════════════════════════════════
   EL MAPA DE RAYOS DE AEMET, LEÍDO EN EL SERVIDOR (04-10-2026)
   ───────────────────────────────────────────────────────────────────
   Suyo, 04-10-2026, con el móvil lleno de «⚡ Crítico» por código de
   tormenta de ECMWF 9 km e ICON y NADA en el radar ni en los rayos:
   «estos sobran y al final enredan» · «si no da muy claro, que no los
   envíe» · «pero si no hay ni rayos».

   Al móvil ya solo va el rayo MEDIDO por la red de AEMET. Para eso el
   vigilante tiene que leer el mismo PNG que lee la app, y en Vercel no
   hay navegador: ni createImageBitmap ni canvas. Esto descodifica el PNG
   a mano —trozos, inflate y los cinco filtros— y se lo da a
   `ReglasTiempo.lectorDeRayos` como `imagen`, así que el RECUENTO de
   descargas (manchas pegadas, polaridad rojo/azul, Mercator) es el
   mismo que en la app, en el Centro Operativo y en la agenda: una regla.

   MEDIDO sobre el mapa LOCL real del 04-10-2026 (6384×2293, paleta de 4
   colores a 2 bits, todas las filas con filtro 0): 22 KB bajados,
   inflate 9 ms, desfiltrar 8 ms. Con pngjs —que expande a RGBA la imagen
   entera— eran 1.017 ms: aquí solo se expande el recorte que se pide.
   ═══════════════════════════════════════════════════════════════════ */
import zlib from 'node:zlib';
import { ReglasTiempo } from './reglas.mjs';

const BPP_POR_TIPO = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };   // muestras por píxel según el tipo de color

/** Descodifica un PNG (bytes) y devuelve { W, H, pixeles(sx, sy, sw, sh) → RGBA }. */
export async function imagenPNG(bytes) {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes instanceof ArrayBuffer ? bytes : bytes.buffer ?? bytes);
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error('el mapa de rayos no es un PNG');
  let p = 8, W = 0, H = 0, bitDepth = 8, tipo = 6, interlace = 0, plte = null, trns = null;
  const idat = [];
  while (p + 8 <= buf.length) {
    const len = buf.readUInt32BE(p), nombre = buf.toString('ascii', p + 4, p + 8);
    const datos = buf.subarray(p + 8, p + 8 + len);
    if (nombre === 'IHDR') { W = datos.readUInt32BE(0); H = datos.readUInt32BE(4); bitDepth = datos[8]; tipo = datos[9]; interlace = datos[12]; }
    else if (nombre === 'PLTE') plte = datos;
    else if (nombre === 'tRNS') trns = datos;
    else if (nombre === 'IDAT') idat.push(datos);
    else if (nombre === 'IEND') break;
    p += 12 + len;
  }
  if (!W || !H || !idat.length) throw new Error('el PNG de rayos viene sin cabecera o sin datos');
  if (interlace) throw new Error('el PNG de rayos viene entrelazado y eso no se lee aquí');
  if (!(tipo in BPP_POR_TIPO)) throw new Error(`tipo de color ${tipo} del PNG de rayos no contemplado`);
  if (tipo === 3 && !plte) throw new Error('el PNG de rayos lleva paleta y no la trae');

  const muestras = BPP_POR_TIPO[tipo];
  const stride = Math.ceil(W * muestras * bitDepth / 8);
  const bpp = Math.max(1, Math.ceil(muestras * bitDepth / 8));   // bytes por píxel para los filtros
  const raw = zlib.inflateSync(Buffer.concat(idat));
  if (raw.length < H * (stride + 1)) throw new Error('el PNG de rayos viene cortado');

  /* Los cinco filtros de PNG, fila a fila. */
  const out = new Uint8Array(stride * H);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < H; y++) {
    const f = raw[y * (stride + 1)], o = y * (stride + 1) + 1;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    if (f === 0) cur.set(raw.subarray(o, o + stride));
    else if (f === 1) for (let i = 0; i < stride; i++) cur[i] = (raw[o + i] + (i >= bpp ? cur[i - bpp] : 0)) & 255;
    else if (f === 2) for (let i = 0; i < stride; i++) cur[i] = (raw[o + i] + prev[i]) & 255;
    else if (f === 3) for (let i = 0; i < stride; i++) cur[i] = (raw[o + i] + (((i >= bpp ? cur[i - bpp] : 0) + prev[i]) >> 1)) & 255;
    else if (f === 4) for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
      cur[i] = (raw[o + i] + ((pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c))) & 255;
    }
    else throw new Error(`filtro ${f} desconocido en el PNG de rayos`);
    prev = cur;
  }

  /* Un píxel → [r, g, b, a], según el tipo. */
  const alfaPaleta = i => (trns && i < trns.length) ? trns[i] : 255;
  const leerIndice = (y, x) => {
    if (bitDepth === 8) return out[y * stride + x];
    const ppb = 8 / bitDepth, b = out[y * stride + Math.floor(x / ppb)];
    return (b >> (8 - bitDepth * (1 + x % ppb))) & ((1 << bitDepth) - 1);
  };
  const rgba = (y, x, px, k) => {
    if (tipo === 3) {
      const i = leerIndice(y, x);
      px[k] = plte[i * 3] ?? 0; px[k + 1] = plte[i * 3 + 1] ?? 0; px[k + 2] = plte[i * 3 + 2] ?? 0; px[k + 3] = alfaPaleta(i);
      return;
    }
    if (bitDepth !== 8) { /* 16 bits: se coge el byte alto de cada muestra */
      const o = y * stride + x * muestras * 2;
      if (tipo === 6) { px[k] = out[o]; px[k + 1] = out[o + 2]; px[k + 2] = out[o + 4]; px[k + 3] = out[o + 6]; }
      else if (tipo === 2) { px[k] = out[o]; px[k + 1] = out[o + 2]; px[k + 2] = out[o + 4]; px[k + 3] = 255; }
      else if (tipo === 4) { px[k] = px[k + 1] = px[k + 2] = out[o]; px[k + 3] = out[o + 2]; }
      else { px[k] = px[k + 1] = px[k + 2] = out[o]; px[k + 3] = 255; }
      return;
    }
    const o = y * stride + x * muestras;
    if (tipo === 6) { px[k] = out[o]; px[k + 1] = out[o + 1]; px[k + 2] = out[o + 2]; px[k + 3] = out[o + 3]; }
    else if (tipo === 2) { px[k] = out[o]; px[k + 1] = out[o + 1]; px[k + 2] = out[o + 2]; px[k + 3] = 255; }
    else if (tipo === 4) { px[k] = px[k + 1] = px[k + 2] = out[o]; px[k + 3] = out[o + 1]; }
    else { px[k] = px[k + 1] = px[k + 2] = out[o]; px[k + 3] = 255; }
  };

  return {
    W, H,
    async pixeles(sx, sy, sw, sh) {
      const px = new Uint8ClampedArray(sw * sh * 4);
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) rgba(sy + y, sx + x, px, (y * sw + x) * 4);
      return px;
    },
  };
}

/** El lector de rayos de la regla única, con este descodificador puesto. */
export function lectorDeRayosServidor({ base }) {
  /* Con tope de tiempo, como toda petición del vigilante: AEMET colgado no
     puede comerse la pasada. */
  return ReglasTiempo.lectorDeRayos({ base, imagen: imagenPNG,
    pedir: (u, o = {}) => fetch(u, { ...o, signal: AbortSignal.timeout(8000) }) });
}
