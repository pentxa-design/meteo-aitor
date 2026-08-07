const EUSKALMET_TIDES_FEED_URL = 'https://www.euskalmet.euskadi.eus/vamet/sea/es/webmet00-latest.html';
const EUSKALMET_TIDES_PUBLIC_URL = 'https://www.euskalmet.euskadi.eus/la-mar/euskadi/';
const MADRID_TIME_ZONE = 'Europe/Madrid';

function madridDate(value = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: MADRID_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(value).map(part => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function parseTides(source) {
  const pattern = /(\d{8}):(\d{2}):(\d{2}):(\d{2}):(high|low)#(-?\d+(?:[.,]\d+)?)/g;
  const days = new Map();
  const seen = new Set();
  let match;

  while ((match = pattern.exec(String(source))) !== null) {
    const [, compactDate, hour, minute, , rawType, rawHeight] = match;
    const date = `${compactDate.slice(0, 4)}-${compactDate.slice(4, 6)}-${compactDate.slice(6, 8)}`;
    const time = `${hour}:${minute}`;
    const height = Number(rawHeight.replace(',', '.'));
    const eventKey = `${date}-${time}-${rawType}`;
    if (seen.has(eventKey) || !Number.isFinite(height)) continue;

    seen.add(eventKey);
    if (!days.has(date)) days.set(date, []);
    days.get(date).push({
      eventDate: date,
      type: rawType,
      label: rawType === 'high' ? 'Pleamar' : 'Bajamar',
      time,
      height
    });
  }

  return [...days.entries()]
    .map(([date, events]) => ({
      date,
      events: events.sort((eventA, eventB) => eventA.time.localeCompare(eventB.time))
    }))
    .sort((dayA, dayB) => dayA.date.localeCompare(dayB.date));
}

async function fetchEuskalmetTides(signal) {
  const response = await fetch(EUSKALMET_TIDES_FEED_URL, {
    signal,
    headers: {
      Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'MeteoAitorBermeo/10.15 (+https://meteoaitorbermeo.vercel.app)'
    }
  });
  if (!response.ok) throw new Error(`Euskalmet respondió HTTP ${response.status}`);

  const source = await response.text();
  const days = parseTides(source);
  if (!days.length) throw new Error('Euskalmet no publicó mareas reconocibles.');

  const today = madridDate();
  if (!days.some(day => day.date >= today)) {
    throw new Error('Euskalmet todavía no ha publicado mareas vigentes.');
  }
  return days;
}

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
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const days = await fetchEuskalmetTides(controller.signal);
    res.setHeader('Cache-Control', 's-maxage=900');
    return res.status(200).json({
      ok: true,
      source: 'Euskalmet · La mar',
      sourceLabel: 'Fuente oficial',
      official: true,
      heightDatum: 'altura publicada por Euskalmet',
      timezone: 'Hora oficial peninsular',
      retrievedAt: new Date().toISOString(),
      publicationDate: days[0].date,
      sourceUrl: EUSKALMET_TIDES_PUBLIC_URL,
      days
    });
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({
      ok: false,
      source: 'Euskalmet · La mar',
      error: error?.name === 'AbortError'
        ? 'La consulta a Euskalmet superó el tiempo de espera.'
        : error?.cause?.message || error?.message || 'No se pudieron consultar las mareas de Euskalmet.'
    });
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
};

module.exports._test = { parseTides, madridDate };
