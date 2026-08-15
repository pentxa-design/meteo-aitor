const RAINVIEWER_METADATA = 'https://api.rainviewer.com/public/weather-maps.json';
const OBSERVATION_MAX_AGE_SECONDS = 60 * 60;

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(RAINVIEWER_METADATA, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MeteoAitorBermeo/10.14 (+https://meteoaitorbermeo.vercel.app)'
      }
    });
    if (!response.ok) throw new Error(`RainViewer respondió HTTP ${response.status}`);
    const data = await response.json();
    const host = String(data?.host || '');
    if (!host.startsWith('https://')) throw new Error('RainViewer no devolvió un servidor de teselas seguro.');

    const frames = (Array.isArray(data?.radar?.past) ? data.radar.past.map(frame => ({ ...frame, kind: 'observed' })) : [])
      .filter(frame => Number.isFinite(Number(frame?.time)) && /^\/v\d+\/radar\//.test(String(frame?.path || '')))
      .sort((frameA, frameB) => Number(frameA.time) - Number(frameB.time))
      .slice(-12)
      .map(frame => ({ time: Number(frame.time), path: String(frame.path), kind: 'observed' }));

    if (!frames.length) throw new Error('RainViewer no publicó fotogramas de radar.');
    const latestFrameAge = Math.floor(Date.now() / 1000) - Number(frames[frames.length - 1].time);
    if (!Number.isFinite(latestFrameAge) || latestFrameAge < -300 || latestFrameAge > OBSERVATION_MAX_AGE_SECONDS) {
      throw new Error('RainViewer no publicó un fotograma de radar de la última hora.');
    }

    res.setHeader('Cache-Control', 's-maxage=240, stale-while-revalidate=600');
    return res.status(200).json({
      ok: true,
      source: 'RainViewer Weather Radar API',
      sourceUrl: 'https://www.rainviewer.com/api/weather-maps-api.html',
      generatedAt: new Date(Number(data.generated || 0) * 1000).toISOString(),
      host,
      frames
    });
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({
      ok: false,
      source: 'RainViewer',
      error: error?.name === 'AbortError'
        ? 'El radar mundial tardó demasiado en responder.'
        : error?.message || 'No se pudo cargar el radar mundial.'
    });
  } finally {
    clearTimeout(timeout);
  }
};
