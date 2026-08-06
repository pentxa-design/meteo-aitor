const crypto = require('node:crypto');

function encodeBase64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function normalizePrivateKey(value) {
  return String(value || '').replace(/\\n/g, '\n').trim();
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const issuer = process.env.EUSKALMET_ISSUER;
  const email = process.env.EUSKALMET_EMAIL;
  const loginId = process.env.EUSKALMET_LOGIN_ID;
  const privateKey = normalizePrivateKey(process.env.EUSKALMET_PRIVATE_KEY);
  const missing = [
    !issuer && 'EUSKALMET_ISSUER',
    !(email || loginId) && 'EUSKALMET_EMAIL o EUSKALMET_LOGIN_ID',
    !privateKey && 'EUSKALMET_PRIVATE_KEY'
  ].filter(Boolean);

  if (missing.length) {
    return res.status(503).json({
      ok: false,
      configured: false,
      missing,
      message: 'Faltan variables privadas de Euskalmet.'
    });
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      aud: 'met01.apikey',
      iss: issuer,
      iat: now,
      exp: now + 300,
      version: '1.0.0',
      ...(email ? { email } : { loginId })
    };
    const unsignedToken = `${encodeBase64Url(header)}.${encodeBase64Url(payload)}`;
    const signature = crypto.sign('RSA-SHA256', Buffer.from(unsignedToken), privateKey).toString('base64url');

    if (!signature) throw new Error('No se pudo firmar el JWT.');

    return res.status(200).json({
      ok: true,
      configured: true,
      jwtReady: true,
      issuerConfigured: true,
      ownerConfigured: true,
      privateKeyParsed: true,
      expiresInSeconds: 300,
      checkedAt: new Date().toISOString(),
      message: 'Autenticación segura de Euskalmet preparada en el servidor.'
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      configured: true,
      jwtReady: false,
      message: 'Las variables existen, pero la clave privada no se pudo validar.',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
