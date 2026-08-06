module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const apiKeyReady = Boolean(String(process.env.AEMET_API_KEY || '').trim());
  return res.status(apiKeyReady ? 200 : 503).json({
    ok: apiKeyReady,
    configured: apiKeyReady,
    apiKeyReady,
    checkedAt: new Date().toISOString(),
    message: apiKeyReady
      ? 'La clave privada de AEMET está preparada en el servidor.'
      : 'Falta la variable privada AEMET_API_KEY.'
  });
};
