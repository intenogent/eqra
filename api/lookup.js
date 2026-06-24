import { GoogleGenAI } from '@google/genai';

const FIPS_ABBREV = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE',
  '12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS',
  '21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN','28':'MS',
  '29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY',
  '37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC',
  '46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV',
  '55':'WI','56':'WY',
};

const TEMPLATE = `\
[◉/★] [PREFIX]·[CALLSIGN] | [SITE NAME], [COUNTY] | [BAND] [MODE]
RX: [OUTPUT FREQ] MHz | TX: [INPUT FREQ] MHz | Offset: [OFFSET] MHz | Tone TX: [CTCSS] Hz | Tone RX: [CTCSS] Hz
Bearing: [BEARING] | Coverage: [COVERAGE DESCRIPTION] | Coords: [LAT], [LON]

VOIP PLATFORMS:
EchoLink [NODE######]: [NODE # or NOT LISTED / REMOVED (reason + date)]
AllStar [NODE#####]: [NODE # or NOT LISTED]
WINS: [NODE # or NOT LISTED]
Broadcastify: [URL or NOT LISTED]

WEB LISTEN: [URL or NOT LISTED]

Last Verified: [DATE] | Status: [ACTIVE 🟢 / INACTIVE 🔴 / UNKNOWN ⚪]
QSO Log: [Ready for first contact]

===================================================================
STATION DETAILS
===================================================================

Official Callsign: [CALLSIGN + FULL NAME IF KNOWN]
Repeater Name: [COMMON NAME IF KNOWN or NOT LISTED]
Location: [SITE NAME, COUNTY, STATE]
Elevation: [FEET or NOT LISTED]
Sponsor: [SPONSOR ORG]
Status: [OPEN / CLOSED / PRIVATE]
Coordinator: [COORDINATING BODY + URL]

Organization: [FULL ORG NAME]
Website: [URL or NOT LISTED]
Trustee: [NAME, CALLSIGN or NOT LISTED]

Coverage Area: [GENERAL DESCRIPTION]
- [DIRECTIONAL DETAILS IF KNOWN]

Radio Nets: [LIST IF FOUND or NOT LISTED]

Club Activities: [LIST IF FOUND or NOT LISTED]

Broadcastify Streaming: [FEED DETAILS or NOT LISTED]

===================================================================
EMERGENCY SERVICES
===================================================================

Classification: [RACES / ARES / CERT / SKYWARN / AUXCOMM /
                 MARS / EMCOMM / SA or NOT LISTED]
  RACES    = Radio Amateur Civil Emergency Service (FCC/Gov)
  ARES     = Amateur Radio Emergency Service (ARRL)
  CERT     = Community Emergency Response Team (FEMA/Local)
  SKYWARN  = Severe Weather Spotters (Nat'l Weather Service)
  AUXCOMM  = Auxiliary Communications (FEMA/DHS)
  MARS     = Military Auxiliary Radio System (Dept of Defense)
  EMCOMM   = General Emergency Comms (unspecified affiliation)
  SA       = Served Agency (ARES supporting Red Cross, etc.)

Served Agency: [GOVERNMENT BODY / ORGANIZATION or NOT LISTED]
Activation Authority: [WHO CAN ACTIVATE or NOT LISTED]
Affiliation: [PROGRAM NAME / CHAPTER or NOT LISTED]
Emergency Callsign: [CALLSIGN or NOT LISTED]
Emergency Simplex: [FREQUENCY MHz or NOT LISTED]
Contact: [NAME, CALLSIGN, EMAIL or NOT LISTED]

Special Notes: [EMERGENCY POWER / BACKUP COMMS /
                ACTIVATION PROTOCOL / FUSION MODE /
                ACCESS RESTRICTIONS / OTHER NOTES
                or NOT LISTED]

===================================================================
REFERENCE & NAMING
===================================================================

Grid Square: [MAIDENHEAD GRID or NOT LISTED]
RepeaterBook ID: [ID NUMBER or NOT LISTED]

HT CHANNEL NAME: [PREFIX CALLSIGN]  e.g. AR N6WB
GAIA WAYPOINT NAME: [◉/★ PREFIX·CALLSIGN FREQ]  e.g. ◉ AR·N6WB 146.880
GAIA FOLDER: [NETWORK NAME / COLOR]  e.g. EARS Network — Blue

---
HT PREFIX CODES (7-char CHIRP limit):
  RC  = RACES    — Radio Amateur Civil Emergency Service
  AR  = ARES     — Amateur Radio Emergency Service (ARRL)
  CT  = CERT     — Community Emergency Response Team
  SK  = SKYWARN  — Severe Weather / Nat'l Weather Service
  MR  = MARS     — Military Auxiliary Radio System
  AX  = AUXCOMM  — Auxiliary Comms / FEMA/DHS
  EM  = EMCOMM   — General/unspecified emergency
  SA  = SERVED   — ARES serving Red Cross/Salvation Army etc.
  EL  = EchoLink repeater
  WN  = WIN System
  Rpt = Standard repeater (no VoIP/emergency affiliation)
  [##]= AllStar Hub # prefix  e.g. 54 = Hub 54697

GAIA WAYPOINT ICONS:
  ★  = Hub/root node
  ◉  = Linked or member node

GAIA NAMING FORMAT:
  Hub node   : ★ [HUB#] [CALLSIGN]
  Linked node: ◉ [HUB#]·[CALLSIGN] [FREQ]
  Non-hub    : ◉ [PREFIX]·[CALLSIGN] [FREQ]`;

const SYSTEM_PROMPT = `\
You are a ham radio repeater database assistant. Fill in STATION cards accurately from provided data and web searches. Never rely on training data for frequencies, CTCSS tones, coordinates, or status.

DATA SOURCES:
- When RepeaterBook data is provided in the user message, use it as the authoritative source for:
  frequency, offset, CTCSS tones (TX and RX), coverage, nets, coordinator, sponsor, status,
  last verified date, and RepeaterBook ID — extract these exactly as shown
- Use Google Search to supplement: coordinates, grid square, EchoLink/AllStar/IRLP nodes,
  club website, radio nets not in RB data, emergency affiliations, Broadcastify
- If no RepeaterBook data is pre-provided, search repeaterbook.com, qrz.com, and club websites directly

SEARCH BEHAVIOR (when no RB data is pre-provided):
- Parse the query: extract callsign, frequency, zip code, city, county, or area name
- Search repeaterbook.com, qrz.com, and local ham radio club websites
- If a zip code is given, resolve it to a city/county/state and use that in the search

OUTPUT RULES:
- Output STATION cards ONLY — repeater and club stations, not individual operators
- Use NOT LISTED for any field not found after searching
- Output ONLY the filled card(s) — no commentary, no preamble, no markdown fences
- Do NOT include citation markers, footnotes, or reference numbers such as [1] or superscripts
- Separate multiple stations with the exact string ===NEW STATION=== on its own line
- Coordinates: signed decimal degrees (e.g., 37.3861, -122.0839) — GAIA GPS compatible; positive = N/E, negative = S/W
- ◉ = linked/networked repeater — use ◉ if ANY of EchoLink, AllStar, IRLP, WINS, or Broadcastify has a listed node or URL; ★ = standalone (all VOIP fields are NOT LISTED)
- Only output NO REPEATER DATA — [IDENTIFIER] if after searching you confirm this is an individual operator with no repeater association, or no repeater data exists for the query
- Output ALL static reference text in the card verbatim — the classification definitions, HT PREFIX CODES table, GAIA WAYPOINT ICONS, and GAIA NAMING FORMAT lines are fixed reference text, not placeholders; copy them exactly as shown

PREFIX SELECTION (for HT CHANNEL NAME and GAIA WAYPOINT NAME):
- Use the HT PREFIX CODES table to select the correct prefix based on Classification
- Priority: RC > AR > CT > SK > AX > MR > EM > SA (emergency affiliation takes priority over VoIP)
- If no emergency classification: use EL if EchoLink node listed; WN if WINS listed; Rpt for standard repeater
- If AllStar hub node: use hub number as prefix (e.g. [54] for Hub 54697)
- HT CHANNEL NAME format: [PREFIX] [CALLSIGN] — space-separated, 7 chars max total for CHIRP compatibility
- GAIA WAYPOINT NAME: follow the GAIA NAMING FORMAT rules at the bottom of the card exactly

STATION CARD:
${TEMPLATE}`;

// ── RepeaterBook fetch helpers ────────────────────────────────────────────────

const RB_BASE = 'https://www.repeaterbook.com/repeaters';

async function rbFetch(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; eQRA/2.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[eQRA timing] rbFetch TIMEOUT (8s): ${url}`);
    }
    throw err;
  }
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#?\w+;/g, ' ')
    .replace(/\s{2,}/g, ' ').trim();
}

function extractDetailUrls(html) {
  const seen = new Set();
  const urls = [];
  for (const m of html.matchAll(/href="(details\.php\?state_id=\d+&(?:amp;)?ID=\d+)"/gi)) {
    const url = `${RB_BASE}/${m[1].replace(/&amp;/g, '&')}`;
    if (!seen.has(url)) { seen.add(url); urls.push(url); }
  }
  return urls;
}

async function fetchDetailText(detailUrl) {
  const html = await rbFetch(detailUrl);
  const idMatch = detailUrl.match(/ID=(\d+)/);
  const rbId = idMatch ? idMatch[1] : '';
  return `[RepeaterBook ID: ${rbId}]\n${stripHtml(html).slice(0, 2500)}`;
}

// ── Haversine distance (miles) ───────────────────────────────────────────────

function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// ── Query type detection ──────────────────────────────────────────────────────

function detectQuery(query) {
  // Callsign takes priority: AKNW prefix, optional second letter/digit, district digit, 1-3 suffix letters
  const callMatch = query.match(/\b([AKNW][A-Z0-9]?[0-9][A-Z]{1,3})\b/i);
  if (callMatch) return { type: 'callsign', callsign: callMatch[1].toUpperCase() };

  const freqMatch = query.match(/\b(1[0-9]{2}\.\d+|[2-9]\d{2}\.\d+)\b/);
  const zipMatch = query.match(/\b(\d{5})\b/);
  if (freqMatch) return { type: 'freq_location', freq: freqMatch[1], zip: zipMatch?.[1] ?? null };

  return { type: 'general' };
}

// ── Location resolution ───────────────────────────────────────────────────────

async function resolveLocationFull(ai, locationText, knownCoords = null) {
  try {
    let prompt;
    if (knownCoords) {
      prompt =
        `List up to 4 US counties within 50 miles of ${knownCoords.lat},${knownCoords.lon}, nearest first.\n` +
        `Reply ONLY: ${knownCoords.lat}|${knownCoords.lon}|County:StateFIPS|County:StateFIPS|...\n` +
        `StateFIPS = 2-digit code. Example: 33.7116|-117.5340|Orange:06|Los Angeles:06|San Bernardino:06|Riverside:06`;
    } else {
      prompt =
        `Geocode this US ham radio location and list nearby counties: "${locationText}"\n` +
        `Reply ONLY: LAT|LON|County:StateFIPS|County:StateFIPS|County:StateFIPS|County:StateFIPS\n` +
        `LAT/LON = decimal degrees of location center. Up to 4 counties within 50 miles, nearest first. StateFIPS = 2-digit code.\n` +
        `Example: 33.7116|-117.5340|Orange:06|Los Angeles:06|San Bernardino:06|Riverside:06`;
    }
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const parts = (result.text ?? '').trim().split('|');
    if (parts.length < 3) return null;
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lon)) return null;
    const counties = parts.slice(2).map(p => {
      const [county, fips] = p.trim().split(':');
      return { county: county?.trim(), fips: fips?.trim().padStart(2, '0') };
    }).filter(c => c.county && c.fips);
    if (!counties.length) return null;
    return { lat, lon, counties };
  } catch { return null; }
}

// ── ZIP → lat/lon via US Census Geocoder (P-2 fast-path) ────────────────────

async function geocodeZip(zip) {
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      headers: { 'User-Agent': 'eQRA/2.0 (ham radio field card app)' },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const place = data?.places?.[0];
    if (!place) return null;
    const lat = parseFloat(place.latitude);
    const lon = parseFloat(place.longitude);
    if (isNaN(lat) || isNaN(lon)) return null;
    return { lat, lon };
  } catch { return null; }
}

// ── GPS coordinate parser ─────────────────────────────────────────────────────

function parseCoords(text) {
  const m = text.match(/(-?\d{1,3}\.\d{2,6})[,\s]+(-?\d{1,3}\.\d{2,6})/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lon = parseFloat(m[2]);
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

// ── Scope header builder ──────────────────────────────────────────────────────

function buildScopeHeader(freq, counties) {
  const abbr = c => FIPS_ABBREV[c.fips] ?? c.fips;
  const center = `${counties[0].county} County, ${abbr(counties[0])}`;
  const list = counties.map(c => `${c.county} (${abbr(c)})`).join(', ');
  return `[Search: ${freq} MHz within 50mi of ${center}\n Counties checked: ${list}]`;
}

// ── Coordinator CSV fallback (FL / MN) ───────────────────────────────────────

async function fetchCoordinatorCsv(url, freq, lat, lon) {
  try {
    const text = await rbFetch(url);
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return null;

    const headers = lines[0].split(',').map(h => h.trim().replace(/["']/g, '').toLowerCase());
    const findCol = (...names) => headers.findIndex(h => names.some(n => h.includes(n)));
    const freqIdx = findCol('output', 'frequency', 'freq', 'downlink');
    const latIdx  = findCol('lat');
    const lonIdx  = findCol('lon', 'lng');
    if (freqIdx === -1 || latIdx === -1 || lonIdx === -1) return null;

    const targetFreq = parseFloat(freq);
    const matching = [];
    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;
      const cols = line.split(',');
      const rowFreq = parseFloat(cols[freqIdx]?.replace(/["']/g, ''));
      if (isNaN(rowFreq) || Math.abs(rowFreq - targetFreq) > 0.005) continue;
      const rowLat = parseFloat(cols[latIdx]?.replace(/["']/g, ''));
      const rowLon = parseFloat(cols[lonIdx]?.replace(/["']/g, ''));
      if (isNaN(rowLat) || isNaN(rowLon)) continue;
      if (haversine(lat, lon, rowLat, rowLon) > 50) continue;
      matching.push(line);
    }
    if (!matching.length) return null;
    return `Coordinator CSV: ${url}\n${lines[0]}\n${matching.join('\n')}`;
  } catch { return null; }
}

// ── RB pre-fetch functions ────────────────────────────────────────────────────

async function prefetchCallsign(callsign) {
  console.time(`[eQRA timing] A: callsign prefetch (${callsign})`);
  try {
    const listHtml = await rbFetch(`${RB_BASE}/callResult.php?call=${encodeURIComponent(callsign)}`);
    const detailUrls = extractDetailUrls(listHtml);
    if (!detailUrls.length) return null;
    const results = await Promise.allSettled(detailUrls.slice(0, 6).map(fetchDetailText));
    const texts = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    return texts.length ? texts.join('\n\n---\n\n') : null;
  } finally {
    console.timeEnd(`[eQRA timing] A: callsign prefetch (${callsign})`);
  }
}

async function prefetchFreqLocation(ai, freq, zip, rawQuery) {
  const locationText = rawQuery.replace(freq, '').replace(/\s+/g, ' ').trim();
  let knownCoords = parseCoords(locationText);

  // P-2: ZIP fast-path — Census API (~200ms) replaces Gemini geocode for ZIP queries
  if (!knownCoords && zip) {
    console.time(`[eQRA timing] A-zip: Census geocode (${zip})`);
    knownCoords = await geocodeZip(zip);
    console.timeEnd(`[eQRA timing] A-zip: Census geocode (${zip})`);
    if (knownCoords) console.log(`[eQRA timing] A-zip: resolved ${zip} → ${knownCoords.lat}, ${knownCoords.lon}`);
  }

  console.time(`[eQRA timing] A: county-find (${knownCoords ? 'coords' : locationText})`);
  const geo = await resolveLocationFull(ai, locationText, knownCoords);
  console.timeEnd(`[eQRA timing] A: county-find (${knownCoords ? 'coords' : locationText})`);
  if (!geo) return null;

  const freqNorm = parseFloat(freq).toFixed(4);
  const rowRe = new RegExp(
    `href="(details\\.php\\?state_id=\\d+&(?:amp;)?ID=\\d+)"[^>]*>[^<]*${freqNorm.replace('.', '\\.')}[^<]*</a>`,
    'gi'
  );

  console.time(`[eQRA timing] B: county fetches (${geo.counties.length} counties)`);
  const countyResults = await Promise.allSettled(
    geo.counties.map(({ county, fips }) =>
      rbFetch(`${RB_BASE}/location_search.php?type=county&state_id=${fips}&loc=${county.replace(/ /g, '+')}`)
    )
  );
  console.timeEnd(`[eQRA timing] B: county fetches (${geo.counties.length} counties)`);

  const seen = new Set();
  const detailUrls = [];
  for (const r of countyResults) {
    if (r.status !== 'fulfilled') continue;
    for (const m of r.value.matchAll(rowRe)) {
      const url = `${RB_BASE}/${m[1].replace(/&amp;/g, '&')}`;
      const rbId = url.match(/ID=(\d+)/)?.[1];
      if (rbId && !seen.has(rbId)) {
        seen.add(rbId);
        detailUrls.push(url);
      }
    }
  }
  const scopeHeader = buildScopeHeader(freq, geo.counties);

  if (!detailUrls.length) {
    const stateFips = new Set(geo.counties.map(c => c.fips));
    let csvText = null;
    if (stateFips.has('12'))
      csvText = await fetchCoordinatorCsv(
        'https://plots.fasma.org/listings/FASMA-All-Coordinated-Repeaters.csv',
        freq, geo.lat, geo.lon
      );
    else if (stateFips.has('27'))
      csvText = await fetchCoordinatorCsv('https://www.mnrepeaters.org/export.csv', freq, geo.lat, geo.lon);
    if (!csvText) return { text: null, scopeHeader };
    return { text: csvText, scopeHeader };
  }

  console.time(`[eQRA timing] C: detail fetches (${Math.min(detailUrls.length, 8)} pages)`);
  const detailResults = await Promise.allSettled(detailUrls.slice(0, 8).map(fetchDetailText));
  console.timeEnd(`[eQRA timing] C: detail fetches (${Math.min(detailUrls.length, 8)} pages)`);

  const texts = detailResults.filter(r => r.status === 'fulfilled').map(r => r.value);
  if (!texts.length) return { text: null, scopeHeader };
  return { text: texts.join('\n\n---\n\n'), scopeHeader };
}

// ── Gemini result parser ──────────────────────────────────────────────────────

function parseGeminiResult(result) {
  const parts = result.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter(p => p.text && !p.thought).map(p => p.text).join('');
  let raw = (text || result.text || '')
    .replace(/\[[^\]]{0,100}\]/g, '')
    .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰`]/g, '');
  const cardStart = raw.search(/[★◉]|NO REPEATER DATA/);
  if (cardStart > 0) raw = raw.slice(cardStart);
  return raw.split('===NEW STATION===').map(s => s.trim()).filter(s => s.length > 0);
}

// ── Friendly error messages ───────────────────────────────────────────────────

function friendlyError(err) {
  const msg = err?.message ?? '';
  const status = err?.status ?? 0;
  if (status === 429 || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return { status: 429, message: 'Service is busy — please wait a moment and try again.' };
  }
  if (status === 401 || msg.includes('401') || msg.includes('API_KEY')) {
    return { status: 401, message: 'API configuration error — please contact the administrator.' };
  }
  if (status === 503 || msg.includes('503')) {
    return { status: 503, message: "QRX — Google's AI servers are overloaded right now. This is on Google's end, not eQRA. Please try again in a few minutes." };
  }
  if (msg.includes('UND_ERR_SOCKET') || msg.includes('fetch failed') || msg.includes('Assertion failed')) {
    return { status: 503, message: 'Network error — please try again.' };
  }
  return { status: 500, message: 'Lookup failed — please try again.' };
}

// ── Request handler ───────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, limitReached } = req.body ?? {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query is required' });
  }

  const BYPASS_SECRET = process.env.BYPASS_SECRET ?? '';
  const DAILY_LIMIT_VAL = parseInt(process.env.DAILY_LIMIT ?? '1', 10);

  const words = query.trim().split(/\s+/);
  const isPrivileged = BYPASS_SECRET && words[0].toLowerCase() === BYPASS_SECRET.toLowerCase();
  const actualQuery = isPrivileged ? words.slice(1).join(' ').trim() : query.trim();

  if (!actualQuery) {
    return res.status(400).json({ error: 'query is required' });
  }

  if (limitReached && !isPrivileged) {
    return res.status(429).json({ error: 'Daily search limit reached — only 1 free search per day is offered due to AI costs. Resets at midnight. 73!' });
  }

  console.time('[eQRA timing] E: total handler');
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Pre-fetch RepeaterBook data when query type is identifiable
    const qtype = detectQuery(actualQuery);
    let rbData = null;
    let scopeHeader = null;

    if (qtype.type === 'callsign') {
      rbData = await prefetchCallsign(qtype.callsign).catch(() => null);
    } else if (qtype.type === 'freq_location') {
      const result = await prefetchFreqLocation(ai, qtype.freq, qtype.zip, actualQuery).catch(() => null);
      if (result) { rbData = result.text; scopeHeader = result.scopeHeader; }
    }

    const userMessage = rbData
      ? `RepeaterBook data for "${actualQuery}":\n\n${rbData}\n\nFill in the station card(s) using this data. Use Google Search to supplement missing fields (coordinates, grid square, EchoLink/AllStar nodes, club website, radio nets, emergency info).`
      : `Find the ham radio repeater station(s) for this query and fill in the station card: "${actualQuery}"`;

    let result;
    const geminiStart = Date.now();
    console.time('[eQRA timing] D: Gemini generateContent');
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userMessage,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            tools: [{ googleSearch: {} }, { urlContext: {} }],
          },
        });
        break;
      } catch (err) {
        const isNetworkErr = err?.cause?.code === 'UND_ERR_SOCKET' ||
          (err?.message ?? '').includes('fetch failed') ||
          (err?.message ?? '').includes('UND_ERR_SOCKET');
        if (attempt === 2 || (err?.status !== 503 && !isNetworkErr)) throw err;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    console.timeEnd('[eQRA timing] D: Gemini generateContent');

    const geminiMs = Date.now() - geminiStart;
    let stations = parseGeminiResult(result);

    // Silent failure guard: sub-2s response + no cards + RB data was provided = Gemini bailed silently
    if (stations.length === 0 && rbData && geminiMs < 2000) {
      console.warn(`[eQRA] Silent failure detected (${geminiMs}ms, RB data present) — retrying`);
      console.time('[eQRA timing] D-retry: Gemini generateContent');
      try {
        result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userMessage,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            tools: [{ googleSearch: {} }, { urlContext: {} }],
          },
        });
        stations = parseGeminiResult(result);
      } catch (retryErr) {
        console.warn('[eQRA] Silent failure retry failed:', retryErr.message);
      } finally {
        console.timeEnd('[eQRA timing] D-retry: Gemini generateContent');
      }
    }

    if (stations.length === 0) {
      let msg = 'No repeater data found — try a callsign, frequency, zip code, or area name.';
      if (scopeHeader) {
        const scope = scopeHeader.replace(/^\[Search:\s*/, '').split('\n')[0].trim();
        msg = `Nothing found on ${scope}. The frequency may not be coordinated in this area — try a nearby city or verify it's in active use.`;
      }
      return res.status(500).json({ error: msg });
    }

    // Prepend scope header to first card (Change 6) — done in Node.js to avoid Gemini output-processing issues
    if (scopeHeader) stations[0] = scopeHeader + '\n\n' + stations[0];

    console.timeEnd('[eQRA timing] E: total handler');
    return res.status(200).json({ stations, bypassed: isPrivileged, dailyLimit: DAILY_LIMIT_VAL });

  } catch (err) {
    console.timeEnd('[eQRA timing] E: total handler');
    console.error('[eQRA lookup error]', err);
    const { status, message } = friendlyError(err);
    return res.status(status).json({ error: message });
  }
}
