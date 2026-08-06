const TIDE_TABLE_URL = 'https://tablademareas.com/es/vizcaya/bilbao';
const MADRID_TIME_ZONE = 'Europe/Madrid';

function addDays(isoDate, amount) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function isoDateFromDmy(value) {
  const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}

function xmlTag(source, name) {
  const match = String(source).match(new RegExp(`<${name}>\\s*([\\s\\S]*?)\\s*</${name}>`, 'i'));
  return match
    ? match[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim()
    : '';
}

function clockFromXml(value) {
  return String(value || '').match(/\[(\d{2}):(\d{2})(?::\d{2})?\]/)?.slice(1, 3).join(':') || '';
}

function utcTideToMadrid(date, time) {
  const instant = new Date(`${date}T${time}:00Z`);
  if (Number.isNaN(instant.getTime())) return null;

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: MADRID_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(instant).map(part => [part.type, part.value])
  );

  return {
    eventDate: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`
  };
}

function parseOpenDataXml(source) {
  const days = [];
  const forecastPattern = /<forecast\b[^>]*periodDate=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/forecast>/gi;
  let forecastMatch;

  while ((forecastMatch = forecastPattern.exec(source)) !== null) {
    const date = isoDateFromDmy(forecastMatch[1]);
    const block = forecastMatch[2];
    if (!date) continue;

    const definitions = [
      ['firstHighTideTime', 'firstHighTide', 'high', 'Pleamar'],
      ['firstLowTideTime', 'firstLowTide', 'low', 'Bajamar'],
      ['secondHighTideTime', 'secondHighTide', 'high', 'Pleamar'],
      ['secondLowTideTime', 'secondLowTide', 'low', 'Bajamar']
    ];

    const events = definitions.flatMap(([timeTag, heightTag, type, label]) => {
      const utcClock = clockFromXml(xmlTag(block, timeTag));
      const localClock = utcClock ? utcTideToMadrid(date, utcClock) : null;
      const height = Number(String(xmlTag(block, heightTag)).replace(',', '.'));
      if (!localClock || !Number.isFinite(height)) return [];
      return [{ ...localClock, type, label, height }];
    }).sort((eventA, eventB) => `${eventA.eventDate}${eventA.time}`.localeCompare(`${eventB.eventDate}${eventB.time}`));

    if (events.length) days.push({ date, events });
  }

  return days;
}

function parseTides(source) {
  const pattern = /(\d{8}):(\d{2}):(\d{2}):(\d{2}):(high|low)#(-?\d+(?:[.,]\d+)?)/g;
  const events = [];
  const seen = new Set();
  let match;

  while ((match = pattern.exec(source)) !== null) {
    const [, compactDate, hour, minute, second, rawType, rawHeight] = match;
    const eventKey = `${compactDate}-${hour}:${minute}-${rawType}`;
    if (seen.has(eventKey)) continue;
    seen.add(eventKey);

    const date = `${compactDate.slice(0, 4)}-${compactDate.slice(4, 6)}-${compactDate.slice(6, 8)}`;
    events.push({
      eventDate: date,
      type: rawType === 'high' ? 'high' : 'low',
      label: rawType === 'high' ? 'Pleamar' : 'Bajamar',
      time: `${hour}:${minute}`,
      seconds: Number(second),
      height: Number(String(rawHeight).replace(',', '.'))
    });
  }

  const validEvents = events.filter(event => Number.isFinite(event.height));
  if (!validEvents.length) return [];

  const firstForecastDate = validEvents[0].eventDate;
  const days = [];

  for (let index = 0; index < validEvents.length; index += 4) {
    days.push({
      date: addDays(firstForecastDate, Math.floor(index / 4)),
      events: validEvents.slice(index, index + 4)
    });
  }

  return days;
}

function parseOfficialPage(source) {
  const text = String(source)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&ordm;|&#186;/gi, 'º')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

  const publicationDate = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1];
  if (!publicationDate) return [];

  const blockPattern = /Pleamar\s+(\d{2}:\d{2})\s*\/\s*(-?\d+(?:[.,]\d+)?)\s*m\s+(\d{2}:\d{2})\s*\/\s*(-?\d+(?:[.,]\d+)?)\s*m\s+Bajamar\s+(\d{2}:\d{2})\s*\/\s*(-?\d+(?:[.,]\d+)?)\s*m\s+(\d{2}:\d{2})\s*\/\s*(-?\d+(?:[.,]\d+)?)\s*m/gi;
  const days = [];
  let match;
  let dayIndex = 0;

  while ((match = blockPattern.exec(text)) !== null) {
    const date = addDays(publicationDate, dayIndex);
    const highOne = { eventDate: date, type: 'high', label: 'Pleamar', time: match[1], height: Number(match[2].replace(',', '.')) };
    const highTwo = { eventDate: date, type: 'high', label: 'Pleamar', time: match[3], height: Number(match[4].replace(',', '.')) };
    const lowOne = { eventDate: date, type: 'low', label: 'Bajamar', time: match[5], height: Number(match[6].replace(',', '.')) };
    const lowTwoDate = match[7] < highOne.time ? addDays(date, 1) : date;
    const lowTwo = { eventDate: lowTwoDate, type: 'low', label: 'Bajamar', time: match[7], height: Number(match[8].replace(',', '.')) };
    const events = [highOne, highTwo, lowOne, lowTwo]
      .filter(event => Number.isFinite(event.height))
      .sort((eventA, eventB) => `${eventA.eventDate}${eventA.time}`.localeCompare(`${eventB.eventDate}${eventB.time}`));

    if (events.length) days.push({ date, events });
    dayIndex += 1;
  }

  return days;
}

function parseBilbaoPortTides(source) {
  const monthNumbers = {
    january: 1, enero: 1, february: 2, febrero: 2, march: 3, marzo: 3,
    april: 4, abril: 4, may: 5, mayo: 5, june: 6, junio: 6,
    july: 7, julio: 7, august: 8, agosto: 8, september: 9, septiembre: 9,
    october: 10, octubre: 10, november: 11, noviembre: 11, december: 12, diciembre: 12
  };
  const text = String(source)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/t[dh]>/gi, ' | ')
    .replace(/<\/(?:tr|table|h[1-6]|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\r/g, '');
  const days = [];
  const seen = new Set();
  let month = 0;
  let year = 0;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\s+/g, ' ').trim();
    const heading = line.match(/Tabla de mareas\s*-\s*([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+(20\d{2})/i);
    if (heading) {
      const monthName = heading[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      month = monthNumbers[monthName] || 0;
      year = Number(heading[2]);
      continue;
    }
    if (!month || !year || !line.includes('|')) continue;
    const cells = line.split('|').map(cell => cell.trim()).filter(Boolean);
    const day = Number(cells[0]?.match(/^\d{1,2}/)?.[0]);
    if (!day || cells.length < 9) continue;
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (seen.has(date)) continue;
    const definitions = [
      [cells[1], cells[2], 'high', 'Pleamar'],
      [cells[3], cells[4], 'high', 'Pleamar'],
      [cells[5], cells[6], 'low', 'Bajamar'],
      [cells[7], cells[8], 'low', 'Bajamar']
    ];
    const events = definitions.flatMap(([time, rawHeight, type, label]) => {
      const height = Number(String(rawHeight).replace(/m/gi, '').replace(',', '.'));
      if (!/^\d{1,2}:\d{2}$/.test(time) || !Number.isFinite(height)) return [];
      // La tabla del Puerto de Bilbao indica expresamente sus horas en GMT.
      // Las convertimos a la hora oficial peninsular, incluido el cambio de día.
      const localClock = utcTideToMadrid(date, time.padStart(5, '0'));
      return localClock ? [{ ...localClock, type, label, height }] : [];
    }).sort((a, b) => `${a.eventDate}${a.time}`.localeCompare(`${b.eventDate}${b.time}`));
    if (events.length) { seen.add(date); days.push({ date, events }); }
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

function parseTableDeMareas(source) {
  const rows = String(source).match(/<tr\b[^>]*\bonclick=["']Day\(['"]?(20\d{2}-\d{2}-\d{1,2})['"]?\)[^>]*>[\s\S]*?<\/tr>/gi) || [];
  const days = [];
  const seen = new Set();

  for (const row of rows) {
    const rawDate = row.match(/Day\(['"]?(20\d{2}-\d{2}-\d{1,2})['"]?\)/i)?.[1];
    if (!rawDate) continue;
    const [year, month, day] = rawDate.split('-');
    const date = `${year}-${month}-${day.padStart(2, '0')}`;
    if (seen.has(date)) continue;
    const cells = row.match(/<td\b[^>]*class=["'][^"']*tabla_mareas_marea(?:\s|["'])[^"']*["'][^>]*>[\s\S]*?<\/td>/gi) || [];
    const events = cells.flatMap(cell => {
      const rawTime = cell.match(/tabla_mareas_marea_hora[^"']*["'][^>]*>\s*(\d{1,2}:\d{2})/i)?.[1];
      const rawHeight = cell.match(/tabla_mareas_marea_altura_numero["'][^>]*>\s*(-?\d+(?:[.,]\d+)?)/i)?.[1];
      const isLow = /tabla_mareas_marea_bajamar/i.test(cell);
      const isHigh = /tabla_mareas_marea_pleamar/i.test(cell);
      const height = Number(String(rawHeight || '').replace(',', '.'));
      if (!rawTime || !Number.isFinite(height) || (!isLow && !isHigh)) return [];
      return [{ eventDate: date, type: isHigh ? 'high' : 'low', label: isHigh ? 'Pleamar' : 'Bajamar', time: rawTime.padStart(5, '0'), height }];
    });
    if (events.length) { seen.add(date); days.push({ date, events }); }
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchParsedSource(url, parser, signal, encoding = 'utf-8') {
  const response = await fetch(url, {
    signal,
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'MeteoAitorBermeo/10.14 (+https://meteoaitorbermeo.vercel.app)'
    }
  });
  if (!response.ok) throw new Error(`La fuente respondió HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  const source = new TextDecoder(encoding).decode(bytes);
  const days = parser(source);
  if (!days.length) throw new Error('La fuente no publicó una tabla de mareas reconocible.');
  return { days, sourceUrl: url };
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

  try {
    const tideController = new AbortController();
    const tideTimeout = setTimeout(() => tideController.abort(), 7000);
    try {
      const result = await fetchParsedSource(TIDE_TABLE_URL, parseTableDeMareas, tideController.signal);
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=21600');
      return res.status(200).json({
        ok: true,
        source: 'TablaDeMareas · Bilbao',
        sourceLabel: 'Tabla diaria',
        official: false,
        heightDatum: 'referencia de TablaDeMareas',
        area: 'Bizkaia · Bilbao',
        timezone: 'Hora oficial peninsular',
        retrievedAt: new Date().toISOString(),
        publicationDate: result.days[0].date,
        sourceUrl: result.sourceUrl,
        days: result.days
      });
    } finally {
      clearTimeout(tideTimeout);
      tideController.abort();
    }
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({
      ok: false,
      source: 'TablaDeMareas · Bilbao',
      error: error?.name === 'AbortError'
        ? 'La consulta de mareas superó el tiempo de espera.'
        : error?.cause?.message || error?.message || 'No se pudieron consultar las mareas.'
    });
  }
};

module.exports._test = {
  parseOpenDataXml,
  parseOfficialPage,
  parseTableDeMareas,
  parseTides
};
