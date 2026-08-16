'use strict';

const METEOGALICIA_CAMERAS = 'https://servizos.meteogalicia.gal/mgrss/observacion/jsonCamaras.action';
const METEOGALICIA_IMAGE_HOST = 'www.meteogalicia.gal';
const THREECAT_CAMERAS = 'https://api.3cat.cat/v2/beauties?_format=json&llista=totes&version=2.0&https=true';
const THREECAT_IMAGE_HOST = 'statics.3cat.cat';
const THREECAT_SOURCE_URL = 'https://www.3cat.cat/3catinfo/el-temps/cameres/';
const VALENCIA_CAMERAS_URL = 'https://www.comunitatvalenciana.com/es/web/guest/webcams?p_p_id=landingsearch_INSTANCE_CS5rAFaSLyuY&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_cacheability=cacheLevelPage';
const VALENCIA_SOURCE_URL = 'https://www.comunitatvalenciana.com/es/webcams';
const BURGOS_CAMERAS_URL = 'https://movilidad.aytoburgos.es/o/aytoburgos-movilidad-ws/trafficCameras?groupId=413443';
const BURGOS_SOURCE_URL = 'https://movilidad.aytoburgos.es/camaras-de-trafico';
const DGT_SOURCE_URL = 'https://www.dgt.es/conoce-el-estado-del-trafico/camaras-de-trafico/';
const VENTUSKY_SOURCE_URL = 'https://www.ventusky.com/es';
const SNAPSHOT_MAX_AGE_MS = 20 * 60 * 1000;
const SNAPSHOT_FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
const SNAPSHOT_HEAD_TIMEOUT_MS = 5500;

const CANTABRIA_CAMERAS = Object.freeze([
  ['cantabria_abra_pas', 'Abra del Pas', 'https://cantur.com/camaras/home/cantucom/public_html/camaras/abra000.jpg', 'https://cantur.com/webcam/abra-de-pas/'],
  ['cantabria_fuente_de', 'Fuente Dé', 'https://cantur.com/camaras/home/cantucom/public.html/camaras/fuentede.jpg', 'https://cantur.com/webcam/fuente-de/'],
  ['cantabria_calgosa', 'Calgosa · Alto Campoo', 'https://cantur.com/camaras/multi/calgosa_vista_calgosa.jpg', 'https://cantur.com/webcam/calgosa/'],
  ['cantabria_sierra_hijar', 'Sierra del Híjar', 'https://cantur.com/camaras/multi/calgosa_cuchillon_superior.jpg', 'https://cantur.com/webcam/sierra-del-hijar/'],
  ['cantabria_tres_mares', 'Tres Mares', 'https://cantur.com/camaras/3mares/3mares_vista_cornon.jpg', 'https://cantur.com/webcam/tres-mares/'],
  ['cantabria_el_chivo', 'El Chivo · Alto Campoo', 'https://cantur.com/camaras/chivo/chivo_vista_valle.jpg', 'https://cantur.com/webcam/el-chivo/']
]);

const MADRID_CAMERAS = Object.freeze([
  ['madrid_alcala_goya', 'Alcalá con Goya', 'https://informo.madrid.es/cameras/Camara04307.jpg'],
  ['madrid_alcala_sevilla', 'Alcalá con Sevilla', 'https://informo.madrid.es/cameras/Camara01316.jpg'],
  ['madrid_castellana_ortega', 'Castellana con Ortega y Gasset', 'https://informo.madrid.es/cameras/Camara07303.jpg']
]);

const AVILA_CAMERAS = Object.freeze([
  ['avila_navaquesera', 'Navaquesera · vista sur', 'https://www.meteonavalacruz.es/webcamnavaquesera.jpg', 'https://navaquesera.meteonavalacruz.es/']
]);

const DGT_CAMERAS = Object.freeze([
  ['93', 'N-330 · Cuarte de Huerva · PK 488,35', 'Zaragoza'],
  ['627', 'A-2 · Trijueque · PK 78', 'Guadalajara'],
  ['1419', 'A-7 · Maro · PK 927,2', 'Málaga'],
  ['542', 'A-7 · Carboneras · PK 734,825', 'Almería'],
  ['164338', 'A-66 · PK 614,87', 'Badajoz'],
  ['768', 'A-4 · enlace A-44 · PK 292,85', 'Jaén'],
  ['147', 'A-7 · Elx · PK 514,2', 'Alicante'],
  ['1241', 'A-7 · Lorca · PK 640,5', 'Murcia'],
  ['165068', 'N-232 · Alcañiz · PK 151,085', 'Teruel'],
  ['812', 'A-5 · Almaraz · PK 193,8', 'Cáceres'],
  ['119', 'A-30 · Blanca · PK 111,6', 'Murcia'],
  ['126', 'A-31 · Villena · PK 182,45', 'Alicante'],
  ['856', 'A-5 · Torrefresneda · PK 315,5', 'Badajoz'],
  ['487', 'A-66 · Castiello · PK 18,6', 'Asturias'],
  ['90', 'N-330 · Sabiñánigo · PK 630,2', 'Huesca']
]);

const VENTUSKY_CAMERAS = Object.freeze([
  ['178406834', 'Prats de Lluçanès · AEMET', 'Cataluña', 'Meteosona', 'https://www.meteosona.com/webcams/Catalunya'],
  ['724542435', 'Arte Vida · Tarifa', 'Andalucía', 'Spotfav', 'https://spotfav.com/'],
  ['192836461', 'Gibraltar · playa', 'Gibraltar', 'Beaches.gi', 'https://beaches.gi/'],
  ['866258612', 'Cazorla · castillo', 'Andalucía', 'Turismo en Cazorla', 'https://www.turismoencazorla.com/'],
  ['611449923', 'Moraira · estación meteorológica', 'Comunitat Valenciana', 'Meteobridge', 'https://admin.meteobridge.com/'],
  ['860021513', 'Alt del Governador · Altea', 'Comunitat Valenciana', 'Camping Cap-Blanch', 'https://www.camping-capblanch.com/'],
  ['553173713', 'Hoyos del Espino · Sierra de Gredos', 'Castilla y León', 'La Bodeguilla', 'https://restaurantebarlabodeguilla.com/'],
  ['187226856', 'Apartamentos Montemar · Asturias', 'Asturias', 'Montemar', 'https://monte-mar.es/'],
  ['887761986', 'La Llacuna · Villalonga', 'Comunitat Valenciana', 'AVAMET', 'https://avamet.org/'],
  ['563780921', 'Paterna · Quart de Poblet', 'Comunitat Valenciana', 'AVAMET', 'https://avamet.org/'],
  ['730998560', 'Piñuecar · Sierra Norte', 'Comunidad de Madrid', 'Meteo Piñuecar', 'http://xn--meteopiuecar-ghb.es/'],
  ['433878410', 'Jasa · Pirineo aragonés', 'Aragón', 'Clima y Nieve Pirineos', 'https://climaynievepirineos.com/'],
  ['877551801', 'Port Ainé · FGC', 'Cataluña', 'FGC Roundshot', 'https://fgc.roundshot.com/'],
  ['634950066', 'Base sector La Coma · Ordino', 'Andorra', 'Feratel', 'https://www.feratel.com/']
]);

const ROSES_CAMERAS = Object.freeze([
  ['roses_el_nautil', 'Roses · El Nautil · Costa Brava', 'es_roses06', 'https://www.whatsupcams.com/es/webcams/espana/cataluna/roses-es/camera-roses-el-nautil-costa-brava/'],
  ['roses_puerto', 'Roses · puerto y bahía', 'es_roses02', 'https://www.whatsupcams.com/es/webcams/espana/cataluna/roses-es/roses-puerto-pesquero-y-la-bahia-de-roses/'],
  ['roses_santa_margarida', 'Roses · playa Santa Margarida', 'es_roses03', 'https://www.whatsupcams.com/es/webcams/espana/cataluna/roses-es/camera-en-vivo-roses-playa-hotel-montecarlo/']
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

async function fetchJson(url, sourceName, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {
      ...options,
      headers: { Accept: 'application/json', ...(options.headers || {}) },
      signal: controller.signal
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) throw new Error(`${sourceName} respondió HTTP ${response.status}`);
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchHtml(url, sourceName) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.7'
      },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`${sourceName} respondió HTTP ${response.status}`);
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function safeVentuskyImageUrl(value, cameraId) {
  try {
    const url = new URL(decodeHtml(value));
    if (url.protocol !== 'https:' || url.hostname !== 'webcams.ventusky.com') return '';
    if (!url.pathname.startsWith('/data/') || !url.pathname.includes(`/${cameraId}/hour/`) || !/\.jpe?g$/i.test(url.pathname)) return '';
    return url.toString();
  } catch (_) {
    return '';
  }
}

function ventuskyCapturedAt(imageUrl) {
  try {
    const query = new URL(imageUrl).search.slice(1);
    const token = query.match(/(?:^|[=&])(\d{9,13})(?:$|[=&])/)?.[1] || query.match(/^\d{9,13}$/)?.[0] || '';
    if (!token) return '';
    const value = Number(token);
    const milliseconds = token.length > 10 ? value : value * 1000;
    if (!Number.isFinite(milliseconds)) return '';
    return new Date(milliseconds).toISOString();
  } catch (_) {
    return '';
  }
}

function safeHttpsSourceUrl(value, fallback) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' ? url.toString() : fallback;
  } catch (_) {
    return fallback;
  }
}

function safeValenciaImageUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'https:' || url.hostname !== 'streaming.comunitatvalenciana.com') return '';
    if (!url.pathname.startsWith('/static/') || !url.pathname.endsWith('/webcam_mini.png')) return '';
    return url.toString();
  } catch (_) {
    return '';
  }
}

function safeValenciaSourceUrl(value) {
  try {
    const url = new URL(String(value || ''), 'https://www.comunitatvalenciana.com');
    if (url.protocol !== 'https:' || url.hostname !== 'www.comunitatvalenciana.com') return VALENCIA_SOURCE_URL;
    return url.toString();
  } catch (_) {
    return VALENCIA_SOURCE_URL;
  }
}

function safeBurgosImageUrl(value) {
  try {
    const url = new URL(String(value || ''), 'https://movilidad.aytoburgos.es');
    if (url.protocol !== 'https:' || url.hostname !== 'movilidad.aytoburgos.es') return '';
    if (!url.pathname.startsWith('/documents/848507/848509/')) return '';
    return url.toString();
  } catch (_) {
    return '';
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

async function lastModifiedTimestamp(url, relativeToServerDate = false) {
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
    if (!Number.isFinite(timestamp)) return '';
    if (relativeToServerDate) {
      const serverDate = Date.parse(response.headers.get('date') || '');
      const sourceAge = serverDate - timestamp;
      if (Number.isFinite(serverDate) && sourceAge >= -SNAPSHOT_FUTURE_TOLERANCE_MS && sourceAge <= SNAPSHOT_MAX_AGE_MS) {
        return new Date(Date.now() - Math.max(0, sourceAge)).toISOString();
      }
    }
    return new Date(timestamp).toISOString();
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

async function verifySnapshotsByHeader(cameras, { relativeToServerDate = false } = {}) {
  const now = Date.now();
  const checked = new Array(cameras.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < cameras.length) {
      const index = nextIndex++;
      const camera = cameras[index];
      const capturedAt = await lastModifiedTimestamp(camera.url, relativeToServerDate);
      checked[index] = verifiedSnapshot(camera, capturedAt, now, relativeToServerDate ? 'last-modified-relative-to-server-date' : 'last-modified');
    }
  }
  await Promise.all(Array.from({ length: Math.min(10, cameras.length) }, () => worker()));
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

function valenciaRequestBody(page) {
  const data = {
    page,
    language: 'es',
    isFirstCalled: page === 0,
    params: { resource_type_code: ['TIPRECWEBCAM'] },
    filters: { resource_type_code: ['TIPRECWEBCAM'] }
  };
  return new URLSearchParams({ _landingsearch_INSTANCE_CS5rAFaSLyuY_data: JSON.stringify(data) }).toString();
}

async function fetchValenciaPage(page) {
  return fetchJson(VALENCIA_CAMERAS_URL, 'Turisme Comunitat Valenciana', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: valenciaRequestBody(page)
  });
}

async function loadValencia() {
  const first = await fetchValenciaPage(0);
  if (!Array.isArray(first?.list)) throw new Error('Turisme Comunitat Valenciana no devolvió una lista válida.');
  const pageSize = Math.max(1, Number(first.pageSize) || 9);
  const total = Math.min(100, Math.max(first.list.length, Number(first.summary_count) || 0));
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const remaining = pages > 1 ? await Promise.all(Array.from({ length: pages - 1 }, (_, index) => fetchValenciaPage(index + 1))): [];
  const items = [first, ...remaining].flatMap(payload => Array.isArray(payload?.list) ? payload.list : []).slice(0, 100);
  const cameras = items.map((camera, index) => {
    const id = Number(camera?.id) || index + 1;
    const name = text(camera?.name || camera?.township);
    const town = text(camera?.township);
    const province = text(camera?.province);
    const imageUrl = safeValenciaImageUrl(camera?.image);
    const originalUrl = safeValenciaSourceUrl(camera?.url);
    const label = town && !name.toLocaleLowerCase('es').includes(town.toLocaleLowerCase('es')) ? `${town} · ${name}` : name;
    return {
      id,
      key: `valencia_${id}`,
      name,
      optionLabel: province ? `${label} — ${province}` : label,
      town,
      province,
      mode: 'snapshot',
      url: imageUrl,
      refreshMs: 60000,
      title: `${label} · imagen actual`,
      description: 'Vista previa del directo oficial de Turisme Comunitat Valenciana.',
      alt: `Vista actual de la cámara ${label}`,
      status: 'Captura oficial reciente',
      originalUrl,
      sourceUrl: originalUrl,
      sourceLabel: 'Turisme Comunitat Valenciana'
    };
  }).filter(camera => camera.name && camera.url);
  const verified = await verifySnapshotsByHeader(cameras, { relativeToServerDate: true });
  if (!verified.length) throw new Error('Turisme Comunitat Valenciana no devolvió capturas recientes verificables.');
  return verified;
}

async function loadBurgos() {
  const payload = await fetchJson(BURGOS_CAMERAS_URL, 'Movilidad Burgos');
  if (!Array.isArray(payload)) throw new Error('Movilidad Burgos no devolvió una lista válida.');
  const now = Date.now();
  const cameras = payload.map((camera, index) => {
    const id = Number(camera?.id) || index + 1;
    const name = text(camera?.name);
    const imageUrl = safeBurgosImageUrl(camera?.url);
    let capturedAt = '';
    try {
      const timestamp = Number(new URL(imageUrl).searchParams.get('t'));
      if (Number.isFinite(timestamp) && timestamp > 0) capturedAt = new Date(timestamp).toISOString();
    } catch (_) {}
    return verifiedSnapshot({
      id,
      key: `burgos_${id}`,
      name,
      optionLabel: name,
      mode: 'snapshot',
      url: imageUrl,
      refreshMs: 60000,
      title: `Burgos · ${name}`,
      description: 'Imagen actual de la red municipal de cámaras de tráfico de Burgos.',
      alt: `Cámara municipal de ${name} en Burgos`,
      status: 'Captura municipal reciente',
      originalUrl: BURGOS_SOURCE_URL,
      sourceUrl: BURGOS_SOURCE_URL,
      sourceLabel: 'Ayuntamiento de Burgos · Movilidad'
    }, capturedAt, now, 'source-url');
  }).filter(camera => camera?.name && camera.url);
  if (!cameras.length) throw new Error('Movilidad Burgos no devolvió capturas recientes verificables.');
  return cameras;
}

async function fixedCantabriaCameras() {
  const cameras = CANTABRIA_CAMERAS.map(([key, name, url, originalUrl], index) => ({
    id: index + 1,
    key,
    name,
    optionLabel: name,
    mode: 'snapshot',
    url,
    refreshMs: 60000,
    title: `Cantabria · ${name}`,
    description: 'Imagen actual publicada por la red de cámaras de CANTUR.',
    alt: `Cámara de ${name} en Cantabria`,
    status: 'Captura oficial reciente',
    originalUrl,
    sourceUrl: originalUrl,
    sourceLabel: 'CANTUR · Gobierno de Cantabria'
  }));
  return verifySnapshotsByHeader(cameras);
}

async function fixedMadridCameras() {
  const originalUrl = 'https://informo.madrid.es/';
  const cameras = MADRID_CAMERAS.map(([key, name, url], index) => ({
    id: index + 1,
    key,
    name,
    optionLabel: name,
    mode: 'snapshot',
    url,
    refreshMs: 30000,
    title: `Madrid · ${name}`,
    description: 'Imagen actual publicada por el sistema municipal Informo Madrid.',
    alt: `Cámara municipal de ${name} en Madrid`,
    status: 'Captura municipal reciente',
    originalUrl,
    sourceUrl: originalUrl,
    sourceLabel: 'Ayuntamiento de Madrid · Informo'
  }));
  return verifySnapshotsByHeader(cameras);
}

async function fixedAvilaCameras() {
  const cameras = AVILA_CAMERAS.map(([key, name, url, originalUrl], index) => ({
    id: index + 1,
    key,
    name,
    optionLabel: name,
    mode: 'snapshot',
    url,
    refreshMs: 60000,
    title: `Ávila · ${name}`,
    description: 'Imagen actual publicada por la estación Meteo Navalacruz.',
    alt: `Cámara meteorológica de ${name} en Ávila`,
    status: 'Captura meteorológica reciente',
    originalUrl,
    sourceUrl: originalUrl,
    sourceLabel: 'Meteo Navalacruz'
  }));
  return verifySnapshotsByHeader(cameras);
}

async function fixedDgtCameras() {
  const cameras = DGT_CAMERAS.map(([id, name, province]) => ({
    id: Number(id),
    key: `dgt_${id}`,
    name,
    optionLabel: `${name} — ${province}`,
    province,
    mode: 'snapshot',
    url: `https://etraffic.dgt.es/camarasEtraffic/${id}.jpg`,
    refreshMs: 30000,
    title: `${name} · ${province}`,
    description: 'Imagen actual de la cámara oficial de tráfico de la DGT.',
    alt: `Cámara DGT ${name} en ${province}`,
    status: 'Captura DGT reciente',
    originalUrl: DGT_SOURCE_URL,
    sourceUrl: DGT_SOURCE_URL,
    sourceLabel: 'DGT · fuente oficial'
  }));
  const verified = await verifySnapshotsByHeader(cameras, { relativeToServerDate: true });
  if (!verified.length) throw new Error('DGT no devolvió capturas recientes verificables.');
  return verified;
}

async function loadVentuskyCamera(definition, now) {
  const [id, name, region, providerLabel, providerUrl] = definition;
  const pageUrl = `https://www.ventusky.com/es/webcam-${id}`;
  const html = await fetchHtml(pageUrl, `Ventusky · ${name}`);
  const candidates = html.match(/https:\/\/webcams\.ventusky\.com\/data\/[^"'<>\s]+/gi) || [];
  const imageUrl = candidates.map(value => safeVentuskyImageUrl(value, id)).find(Boolean) || '';
  if (!imageUrl) throw new Error(`Ventusky no publicó una imagen válida para ${name}.`);
  const capturedAt = ventuskyCapturedAt(imageUrl);
  return verifiedSnapshot({
    id: Number(id),
    key: `ventusky_${id}`,
    name,
    optionLabel: `${name} — ${region}`,
    region,
    mode: 'snapshot',
    url: imageUrl,
    refreshMs: 60000,
    title: `${name} · ${region}`,
    description: `Captura localizada por Ventusky y publicada por ${providerLabel}.`,
    alt: `Cámara de ${name}`,
    status: 'Captura reciente localizada por Ventusky',
    originalUrl: pageUrl,
    sourceUrl: safeHttpsSourceUrl(providerUrl, pageUrl),
    sourceLabel: `${providerLabel} · proveedor`
  }, capturedAt, now, 'ventusky-image-token');
}

async function loadVentusky() {
  const now = Date.now();
  const results = await Promise.allSettled(VENTUSKY_CAMERAS.map(definition => loadVentuskyCamera(definition, now)));
  const cameras = results.filter(result => result.status === 'fulfilled' && result.value).map(result => result.value);
  if (!cameras.length) throw new Error('Ventusky no devolvió capturas recientes verificables.');
  return cameras;
}

function fixedRosesCameras() {
  return ROSES_CAMERAS.map(([key, name, streamId, originalUrl], index) => directCamera({
    id: index + 1,
    key,
    name,
    optionLabel: `${name} · directo`,
    mode: 'iframe',
    url: `https://services.whatsupcams.com/wgt/${streamId}/`,
    title: `${name} · directo`,
    description: 'Emisión pública mediante la URL de inserción publicada por WhatsUpCams.',
    alt: `Cámara en directo de ${name}`,
    status: 'Directo cargado',
    originalUrl,
    sourceUrl: originalUrl,
    sourceLabel: 'WhatsUpCams'
  }));
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

  const [galiciaResult, cataloniaResult, cantabriaResult, valenciaResult, burgosResult, madridResult, avilaResult, dgtResult, ventuskyResult] = await Promise.allSettled([
    loadMeteoGalicia(),
    loadThreeCat(),
    fixedCantabriaCameras(),
    loadValencia(),
    loadBurgos(),
    fixedMadridCameras(),
    fixedAvilaCameras(),
    fixedDgtCameras(),
    loadVentusky()
  ]);
  const galiciaCameras = galiciaResult.status === 'fulfilled' ? galiciaResult.value : [];
  const cataloniaCameras = cataloniaResult.status === 'fulfilled' ? cataloniaResult.value : [];
  const cantabriaCameras = cantabriaResult.status === 'fulfilled' ? cantabriaResult.value : [];
  const valenciaCameras = valenciaResult.status === 'fulfilled' ? valenciaResult.value : [];
  const burgosCameras = burgosResult.status === 'fulfilled' ? burgosResult.value : [];
  const madridCameras = madridResult.status === 'fulfilled' ? madridResult.value : [];
  const avilaCameras = avilaResult.status === 'fulfilled' ? avilaResult.value : [];
  const dgtCameras = dgtResult.status === 'fulfilled' ? dgtResult.value : [];
  const ventuskyCameras = ventuskyResult.status === 'fulfilled' ? ventuskyResult.value : [];
  const catalogs = {
    galicia: catalog('galicia', 'Galicia · MeteoGalicia', 'MeteoGalicia · Xunta de Galicia', 'https://www.meteogalicia.gal/web/observacion/camaras?request_locale=es', galiciaCameras, galiciaResult.status === 'rejected' ? errorMessage(galiciaResult.reason, 'MeteoGalicia') : ''),
    catalonia: catalog('catalonia', 'Cataluña · 3Cat', '3Cat · El Temps', THREECAT_SOURCE_URL, cataloniaCameras, cataloniaResult.status === 'rejected' ? errorMessage(cataloniaResult.reason, '3Cat') : ''),
    cantabria: catalog('cantabria', 'Cantabria · CANTUR', 'CANTUR · Gobierno de Cantabria', 'https://cantur.com/webcams/', cantabriaCameras, cantabriaResult.status === 'rejected' ? errorMessage(cantabriaResult.reason, 'CANTUR') : ''),
    valencia: catalog('valencia', 'Comunitat Valenciana · Turisme CV', 'Turisme Comunitat Valenciana', VALENCIA_SOURCE_URL, valenciaCameras, valenciaResult.status === 'rejected' ? errorMessage(valenciaResult.reason, 'Turisme Comunitat Valenciana') : ''),
    burgos: catalog('burgos', 'Castilla y León · Burgos', 'Ayuntamiento de Burgos · Movilidad', BURGOS_SOURCE_URL, burgosCameras, burgosResult.status === 'rejected' ? errorMessage(burgosResult.reason, 'Movilidad Burgos') : ''),
    madrid: catalog('madrid', 'Centro · Madrid', 'Ayuntamiento de Madrid · Informo', 'https://informo.madrid.es/', madridCameras, madridResult.status === 'rejected' ? errorMessage(madridResult.reason, 'Informo Madrid') : ''),
    avila: catalog('avila', 'Castilla y León · Ávila', 'Meteo Navalacruz', 'https://navaquesera.meteonavalacruz.es/', avilaCameras, avilaResult.status === 'rejected' ? errorMessage(avilaResult.reason, 'Meteo Navalacruz') : ''),
    dgt: catalog('dgt', 'Carreteras · DGT oficial', 'Dirección General de Tráfico', DGT_SOURCE_URL, dgtCameras, dgtResult.status === 'rejected' ? errorMessage(dgtResult.reason, 'DGT') : ''),
    ventusky: catalog('ventusky', 'Ventusky · proveedores localizados', 'Ventusky y proveedor original indicado', VENTUSKY_SOURCE_URL, ventuskyCameras, ventuskyResult.status === 'rejected' ? errorMessage(ventuskyResult.reason, 'Ventusky') : ''),
    roses: catalog('roses', 'Cataluña · Roses en directo', 'WhatsUpCams', 'https://www.whatsupcams.com/es/webcams/espana/cataluna/roses-es/', fixedRosesCameras()),
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
