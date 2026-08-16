'use strict';

const METEOGALICIA_CAMERAS = 'https://servizos.meteogalicia.gal/mgrss/observacion/jsonCamaras.action';
const METEOGALICIA_IMAGE_HOST = 'www.meteogalicia.gal';
const THREECAT_CAMERAS = 'https://api.3cat.cat/v2/beauties?_format=json&llista=totes&version=2.0&https=true';
const THREECAT_IMAGE_HOST = 'statics.3cat.cat';
const THREECAT_SOURCE_URL = 'https://www.3cat.cat/3catinfo/el-temps/cameres/';
const SNAPSHOT_MAX_AGE_MS = 45 * 60 * 1000;
const SNAPSHOT_FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
const SNAPSHOT_HEAD_TIMEOUT_MS = 5500;

const VALENCIA_CAMERAS = Object.freeze([
  ['alicante_explanada', 'Alicante · Explanada', 'AlicanteExplanada', 'https://www.comunitatvalenciana.com/es/alacant-alicante/alacant-alicante/webcams/alicante-explanada'],
  ['alicante_callosa', 'Callosa d’en Sarrià', 'CallosadenSarria', 'https://www.comunitatvalenciana.com/es/alacant-alicante/callosa-den-sarria/webcams/callosa-d-en-sarria'],
  ['alicante_guadalest', 'El Castell de Guadalest', 'CastellGuadalest', 'https://www.comunitatvalenciana.com/es/alacant-alicante/el-castell-de-guadalest/webcams/el-castell-de-guadalest-1'],
  ['alicante_pilar', 'Pilar de la Horadada', 'PilardelaHoradada', 'https://www.comunitatvalenciana.com/es/alacant-alicante/pilar-de-la-horadada/webcams/pilar-de-la-horadada-1'],
  ['castellon_forcall', 'Forcall', 'Forcall', 'https://www.comunitatvalenciana.com/es/castello-castellon/forcall/webcams/forcall-1'],
  ['castellon_vinaros', 'Vinaròs', 'Vinaros', 'https://www.comunitatvalenciana.com/es/castello-castellon/vinaros/webcams/vinaros-2'],
  ['valencia_las_arenas', 'València · Las Arenas', 'ValenciaLasArenas', 'https://www.comunitatvalenciana.com/es/valencia/valencia/webcams/valencia-las-arenas'],
  ['valencia_plaza_ayuntamiento', 'València · plaza del Ayuntamiento', 'ValenciaPlazaAyuntamiento', 'https://www.comunitatvalenciana.com/es/valencia/valencia/webcams/valencia-plaza-ayuntamiento'],
  ['valencia_el_saler', 'València · El Saler', 'ElSaler', 'https://www.comunitatvalenciana.com/es/valencia/valencia/webcams/valencia-el-saler'],
  ['valencia_patacona', 'Alboraia · playa de la Patacona', 'AlborayaPatacona', 'https://www.comunitatvalenciana.com/es/valencia/alboraia-alboraya/webcams/alboraya-playa-de-la-patacona'],
  ['valencia_port_saplaya', 'Alboraia · Port Saplaya', 'AlborayaPortSaplaya', 'https://www.comunitatvalenciana.com/es/valencia/alboraia-alboraya/webcams/alboraya-port-saplaya'],
  ['valencia_canet', 'Canet d’en Berenguer · playa', 'CanetdeBerenguer', 'https://www.comunitatvalenciana.com/es/valencia/canet-den-berenguer/webcams/canet-d-en-berenguer'],
  ['valencia_cullera', 'Cullera · castillo', 'CulleraCastillo', 'https://www.comunitatvalenciana.com/es/valencia/cullera/webcams/castillo-de-cullera-1']
]);

const AMETLLA_CAMERAS = Object.freeze([
  ['ametlla_alguer', 'L’Ametlla de Mar · playa de l’Alguer', 'W9DP0Je5rKU'],
  ['ametlla_port', 'L’Ametlla de Mar · puerto pesquero', 'pWISP2XV-NY']
]);

const CADIZ_CAMERAS = Object.freeze([
  ['cadiz_plaza_sevilla', 'Cádiz · plaza de Sevilla', '0dKNLFFcHFU', 'https://www.youtube.com/@aguasdecadiz5312', 'Aguas de Cádiz · municipal'],
  ['cadiz_sancti_petri', 'Chiclana · playa de Sancti Petri', '_JePjxo-Qk0', 'https://www.lacostadecadiz.com/webcam-chiclana-2-playa-de-sancti-petri/', 'La Costa de Cádiz'],
  ['cadiz_la_barrosa', 'Chiclana · La Barrosa · Campanario', 'w6FUEH7JJ3Y', 'https://www.lacostadecadiz.com/webcam-chiclana-3-la-barrosa-campanario/', 'La Costa de Cádiz'],
  ['cadiz_salina_santa_teresa', 'Chiclana · salina Santa Teresa', 'bMYjYoCNuXc', 'https://www.lacostadecadiz.com/webcam-chiclana-8-salina-santa-teresa/', 'La Costa de Cádiz'],
  ['cadiz_el_palmar', 'Vejer · playa de El Palmar', 'dZOJ0u1x-3g', 'https://www.youtube.com/@Lacostadecadiz1/streams', 'La Costa de Cádiz'],
  ['cadiz_conil_fontanilla', 'Conil · playa de la Fontanilla', 'KmBrwm5T-Dc', 'https://www.youtube.com/@Lacostadecadiz1/streams', 'La Costa de Cádiz']
]);

function text(value, maxLength = 100) {
  return String(value || '').trim().slice(0, maxLength);
}

function safeMeteoGaliciaImageUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'https:' || url.hostname !== METEOGALICIA_IMAGE_HOST) return '';
    if (!url.pathname.startsWith('/datosred/camaras/')) return '';
    return url.toString();
  } catch (_) {
    return '';
  }
}

function safeThreeCatImageUrl(value) {
  try {
    const url = new URL(String(value || ''), `https://${THREECAT_IMAGE_HOST}`);
    if (url.protocol !== 'https:' || url.hostname !== THREECAT_IMAGE_HOST) return '';
    if (!url.pathname.startsWith('/meteo/beauties/v1/img/') || !url.pathname.endsWith('.jpg')) return '';
    return url.toString();
  } catch (_) {
    return '';
  }
}

async function fetchJson(url, sourceName) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) throw new Error(`${sourceName} respondió HTTP ${response.status}`);
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function snapshotAgeMinutes(capturedAt, now = Date.now()) {
  const timestamp = Date.parse(String(capturedAt || ''));
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.round((now - timestamp) / 60000));
}

function isFreshSnapshot(capturedAt, now = Date.now()) {
  const timestamp = Date.parse(String(capturedAt || ''));
  if (!Number.isFinite(timestamp)) return false;
  const age = now - timestamp;
  return age >= -SNAPSHOT_FUTURE_TOLERANCE_MS && age <= SNAPSHOT_MAX_AGE_MS;
}

async function lastModifiedTimestamp(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SNAPSHOT_HEAD_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { Accept: 'image/avif,image/webp,image/png,image/jpeg,image/*' },
      signal: controller.signal
    });
    if (!response.ok) return '';
    const timestamp = Date.parse(response.headers.get('last-modified') || '');
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : '';
  } catch (_) {
    return '';
  } finally {
    clearTimeout(timeout);
  }
}

function directCamera(camera) {
  return { ...camera, freshness: 'direct', capturedAt: '', ageMinutes: null };
}

function verifiedSnapshot(camera, capturedAt, now = Date.now(), timeBasis = 'source') {
  if (!isFreshSnapshot(capturedAt, now)) return null;
  return {
    ...camera,
    capturedAt,
    freshness: 'verified',
    timeBasis,
    ageMinutes: snapshotAgeMinutes(capturedAt, now),
    status: 'Captura oficial reciente'
  };
}

async function verifySnapshotsByHeader(cameras) {
  const now = Date.now();
  const checked = await Promise.all(cameras.map(async camera => {
    const capturedAt = await lastModifiedTimestamp(camera.url);
    return verifiedSnapshot(camera, capturedAt, now, 'last-modified');
  }));
  return checked.filter(Boolean);
}

async function loadMeteoGalicia() {
  const payload = await fetchJson(METEOGALICIA_CAMERAS, 'MeteoGalicia');
  if (!Array.isArray(payload?.listaCamaras)) throw new Error('MeteoGalicia no devolvió una lista válida.');
  const cameras = payload.listaCamaras.map((camera, index) => {
    const id = Number(camera?.identificador) || 0;
    const name = text(camera?.nomeCamara);
    const town = text(camera?.concello);
    const province = text(camera?.provincia);
    const imageUrl = safeMeteoGaliciaImageUrl(camera?.imaxeCamara);
    const place = [town, province].filter(Boolean).join(' · ');
    return {
      id,
      key: `galicia_${id}_${index}`,
      name,
      optionLabel: place ? `${name} — ${place}` : name,
      town,
      province,
      sourceUpdatedAt: text(camera?.dataUltimaAct, 40),
      mode: 'snapshot',
      url: imageUrl,
      refreshMs: 60000,
      title: `Galicia · ${name}`,
      description: `Imagen oficial de MeteoGalicia${place ? ` · ${place}` : ''}.`,
      alt: `Cámara de ${name}`,
      status: 'Imagen MeteoGalicia actualizada',
      originalUrl: 'https://www.meteogalicia.gal/web/observacion/camaras?request_locale=es',
      sourceUrl: 'https://www.meteogalicia.gal/web/observacion/camaras?request_locale=es',
      sourceLabel: 'MeteoGalicia · Xunta'
    };
  }).filter(camera => camera.id && camera.name && camera.url).slice(0, 80);
  if (!cameras.length) throw new Error('MeteoGalicia no devolvió cámaras válidas.');
  const verified = await verifySnapshotsByHeader(cameras);
  if (!verified.length) throw new Error('MeteoGalicia no devolvió capturas recientes verificables.');
  return verified;
}

async function loadThreeCat() {
  const payload = await fetchJson(THREECAT_CAMERAS, '3Cat');
  const items = payload?.resposta?.items?.item;
  if (!Array.isArray(items)) throw new Error('3Cat no devolvió una lista válida.');
  const now = Date.now();
  const cameras = items.map((camera) => {
    const id = Number(camera?.id) || 0;
    const name = text(camera?.nom);
    const snapshots = Array.isArray(camera?.snapshots) ? camera.snapshots : [];
    const snapshot = snapshots.find(item => item?.format === 'gran') || snapshots[0];
    const imageUrl = safeThreeCatImageUrl(snapshot?.fitxer);
    const createdSeconds = Number(camera?.data_creacio);
    const updatedAt = Number.isFinite(createdSeconds) && createdSeconds > 0 ? new Date(createdSeconds * 1000).toISOString() : '';
    return verifiedSnapshot({
      id,
      key: `catalonia_${id}`,
      name,
      optionLabel: name,
      sourceUpdatedAt: updatedAt,
      mode: 'snapshot',
      url: imageUrl,
      refreshMs: 60000,
      title: `Cataluña · ${name}`,
      description: 'Última imagen meteorológica publicada por 3Cat. La ruta se renueva desde su catálogo oficial.',
      alt: `Cámara meteorológica de ${name}`,
      status: 'Captura oficial reciente',
      originalUrl: THREECAT_SOURCE_URL,
      sourceUrl: THREECAT_SOURCE_URL,
      sourceLabel: '3Cat · El Temps'
    }, updatedAt, now);
  }).filter(camera => camera?.id && camera.name && camera.url).slice(0, 80);
  if (!cameras.length) throw new Error('3Cat no devolvió cámaras válidas.');
  return cameras;
}

async function fixedValenciaCameras() {
  const cameras = VALENCIA_CAMERAS.map(([key, name, streamId, originalUrl], index) => ({
    id: index + 1,
    key,
    name,
    optionLabel: name,
    mode: 'snapshot',
    url: `https://streaming.comunitatvalenciana.com/static/${streamId}/webcam_mini.png`,
    dashUrl: `https://streaming.comunitatvalenciana.com/webcam/${streamId}/manifest.mpd`,
    refreshMs: 60000,
    title: `${name} · imagen actual`,
    description: 'Vista previa actual del directo oficial de Turisme Comunitat Valenciana. El vídeo continuo se abre en la fuente original.',
    alt: `Vista actual de la cámara ${name}`,
    status: 'Captura oficial reciente',
    originalUrl,
    sourceUrl: originalUrl,
    sourceLabel: 'Turisme Comunitat Valenciana'
  }));
  return verifySnapshotsByHeader(cameras);
}

function fixedAmetllaCameras() {
  const originalUrl = 'https://www.visitametllademar.com/ca/live';
  return AMETLLA_CAMERAS.map(([key, name, videoId], index) => directCamera({
    id: index + 1,
    key,
    name,
    optionLabel: `${name} · directo`,
    mode: 'iframe',
    url: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`,
    title: `${name} · directo`,
    description: 'Emisión continua publicada por el Patronat Municipal de Turisme de l’Ametlla de Mar.',
    alt: `Emisión en directo de ${name}`,
    status: 'Directo municipal cargado',
    originalUrl,
    sourceUrl: originalUrl,
    sourceLabel: 'Turisme l’Ametlla de Mar'
  }));
}

function fixedCadizCameras() {
  return CADIZ_CAMERAS.map(([key, name, videoId, originalUrl, sourceLabel], index) => directCamera({
    id: index + 1,
    key,
    name,
    optionLabel: `${name} · directo`,
    mode: 'iframe',
    url: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`,
    title: `${name} · directo`,
    description: 'Emisión pública en directo. El operador puede cambiar el identificador si reinicia la señal; se conserva el enlace original.',
    alt: `Emisión en directo de ${name}`,
    status: 'Directo cargado',
    originalUrl,
    sourceUrl: originalUrl,
    sourceLabel
  }));
}

function catalog(id, label, source, sourceUrl, cameras, error = '') {
  return { id, label, source, sourceUrl, ok: !error, error, count: cameras.length, cameras };
}

function errorMessage(error, fallback) {
  if (error?.name === 'AbortError') return `${fallback} tardó demasiado en responder.`;
  return text(error?.message || `No se pudo cargar ${fallback}.`, 180);
}

module.exports = async function webcamsHandler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const [galiciaResult, cataloniaResult, valenciaResult] = await Promise.allSettled([loadMeteoGalicia(), loadThreeCat(), fixedValenciaCameras()]);
  const galiciaCameras = galiciaResult.status === 'fulfilled' ? galiciaResult.value : [];
  const cataloniaCameras = cataloniaResult.status === 'fulfilled' ? cataloniaResult.value : [];
  const valenciaCameras = valenciaResult.status === 'fulfilled' ? valenciaResult.value : [];
  const catalogs = {
    galicia: catalog('galicia', 'Galicia · MeteoGalicia', 'MeteoGalicia · Xunta de Galicia', 'https://www.meteogalicia.gal/web/observacion/camaras?request_locale=es', galiciaCameras, galiciaResult.status === 'rejected' ? errorMessage(galiciaResult.reason, 'MeteoGalicia') : ''),
    catalonia: catalog('catalonia', 'Cataluña · 3Cat', '3Cat · El Temps', THREECAT_SOURCE_URL, cataloniaCameras, cataloniaResult.status === 'rejected' ? errorMessage(cataloniaResult.reason, '3Cat') : ''),
    valencia: catalog('valencia', 'Comunitat Valenciana · Turisme CV', 'Turisme Comunitat Valenciana', 'https://www.comunitatvalenciana.com/es/webcams', valenciaCameras, valenciaResult.status === 'rejected' ? errorMessage(valenciaResult.reason, 'Turisme Comunitat Valenciana') : ''),
    ametlla: catalog('ametlla', 'Cataluña · l’Ametlla en directo', 'Turisme l’Ametlla de Mar', 'https://www.visitametllademar.com/ca/live', fixedAmetllaCameras()),
    cadiz: catalog('cadiz', 'Andalucía · Cádiz en directo', 'Fuentes públicas de Cádiz', 'https://www.youtube.com/@Lacostadecadiz1/streams', fixedCadizCameras())
  };
  const total = Object.values(catalogs).reduce((sum, item) => sum + item.count, 0);
  const partial = Object.values(catalogs).some(item => !item.ok);

  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=90');
  return res.status(200).json({
    ok: true,
    partial,
    source: 'Catálogo consolidado de cámaras públicas',
    fetchedAt: new Date().toISOString(),
    total,
    catalogs,
    cameras: galiciaCameras
  });
};
