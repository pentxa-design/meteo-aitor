'use strict';

const METEOGALICIA_CAMERAS = 'https://servizos.meteogalicia.gal/mgrss/observacion/jsonCamaras.action';
const METEOGALICIA_IMAGE_HOST = 'www.meteogalicia.gal';

function text(value, maxLength = 90) {
  return String(value || '').trim().slice(0, maxLength);
}

function safeImageUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'https:' || url.hostname !== METEOGALICIA_IMAGE_HOST) return '';
    if (!url.pathname.startsWith('/datosred/camaras/')) return '';
    return url.toString();
  } catch (_) {
    return '';
  }
}

module.exports = async function webcamsHandler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(METEOGALICIA_CAMERAS, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !Array.isArray(payload?.listaCamaras)) {
      throw new Error(`MeteoGalicia respondió HTTP ${response.status}`);
    }
    const cameras = payload.listaCamaras.map((camera) => ({
      id: Number(camera?.identificador) || 0,
      name: text(camera?.nomeCamara),
      town: text(camera?.concello),
      province: text(camera?.provincia),
      updatedAt: text(camera?.dataUltimaAct, 40),
      imageUrl: safeImageUrl(camera?.imaxeCamara)
    })).filter(camera => camera.id && camera.name && camera.imageUrl).slice(0, 80);
    if (!cameras.length) throw new Error('MeteoGalicia no devolvió cámaras válidas.');

    res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=600');
    return res.status(200).json({
      ok: true,
      source: 'MeteoGalicia · Xunta de Galicia',
      fetchedAt: new Date().toISOString(),
      cameras
    });
  } catch (error) {
    const timedOut = error?.name === 'AbortError';
    res.setHeader('Cache-Control', 'no-store');
    return res.status(timedOut ? 504 : 502).json({
      ok: false,
      source: 'MeteoGalicia · Xunta de Galicia',
      error: timedOut ? 'La red de cámaras tardó demasiado en responder.' : (error?.message || 'No se pudo cargar la red de cámaras.')
    });
  } finally {
    clearTimeout(timeout);
  }
};
