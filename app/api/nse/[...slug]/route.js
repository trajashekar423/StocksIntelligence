import fs from 'node:fs';
import path from 'node:path';

const NSE_ORIGIN = 'https://www.nseindia.com';

const ROUTES_MAP = {
  'top-ten': '/api/live-analysis-variations?index=gainers',
  'most-active': '/api/live-analysis-most-active-securities?index=volume',
  'universe': '/content/equities/EQUITY_L.csv',
  'market-status': '/api/marketStatus',
  'all-indices': '/api/allIndices',
  'scanner-market-data': '/api/live-analysis-most-active-securities?index=volume',
};

const COMMON_HEADERS = {
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="124", "Google Chrome";v="124"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-user': '?1',
  'sec-fetch-dest': 'document',
  'x-requested-with': 'XMLHttpRequest',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'content-type,authorization',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

let cachedCookie = '';

function updateCookie(headers) {
  const setCookie = headers.getSetCookie?.() || [];
  if (setCookie.length) {
    cachedCookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  }
}

async function ensureCookie() {
  if (cachedCookie) return;
  try {
    const res = await fetch(NSE_ORIGIN, { headers: COMMON_HEADERS });
    updateCookie(res.headers);
  } catch {
    // ignore
  }
}

async function fetchNse(nsePath) {
  await ensureCookie();
  let res = await fetch(`${NSE_ORIGIN}${nsePath}`, {
    headers: {
      ...COMMON_HEADERS,
      cookie: cachedCookie,
      referer: `${NSE_ORIGIN}/`,
      origin: NSE_ORIGIN,
    },
  });

  if (res.status === 401 || res.status === 403) {
    cachedCookie = '';
    await ensureCookie();
    res = await fetch(`${NSE_ORIGIN}${nsePath}`, {
      headers: {
        ...COMMON_HEADERS,
        cookie: cachedCookie,
        referer: `${NSE_ORIGIN}/`,
        origin: NSE_ORIGIN,
        'x-requested-with': 'XMLHttpRequest',
      },
    });
  }

  updateCookie(res.headers);
  return res;
}

function jsonResponse(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extra,
    },
  });
}

function readLocalUniverse() {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'server', 'data', 'all-securities.json'),
      path.resolve(process.cwd(), 'data', 'all-securities.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch {
    // ignore
  }
  return null;
}

function readLocalQuote(symbol) {
  if (!symbol) return null;
  try {
    const p = path.resolve(process.cwd(), 'server', 'data', 'quotes', `${symbol}.json`);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    // ignore
  }
  return null;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(req, { params }) {
  const resolvedParams = await params;
  const slug = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug : [];
  const routeKey = slug.join('/');
  const url = new URL(req.url);

  let nsePath = ROUTES_MAP[routeKey];

  if (!nsePath && routeKey === 'quote-equity') {
    const symbol = url.searchParams.get('symbol');
    const section = url.searchParams.get('section');
    const q = new URLSearchParams();
    if (symbol) q.set('symbol', symbol);
    if (section) q.set('section', section);
    nsePath = `/api/quote-equity?${q.toString()}`;
  }

  if (!nsePath && routeKey === 'get-quote') {
    const symbol = url.searchParams.get('symbol');
    if (symbol) {
      nsePath = `/api/NextApi/apiClient/GetQuoteApi?functionName=getSymbolData&marketType=N&series=EQ&symbol=${encodeURIComponent(symbol)}`;
    }
  }

  if (!nsePath && routeKey === 'equity-stock-indices') {
    const index = url.searchParams.get('index') || 'NIFTY 500';
    nsePath = `/api/equity-stockIndices?index=${encodeURIComponent(index)}`;
  }

  if (!nsePath && routeKey === 'chart-databyindex') {
    const index = url.searchParams.get('index');
    if (index) {
      nsePath = `/api/chart-databyindex?index=${encodeURIComponent(index)}`;
    }
  }

  if (!nsePath && routeKey === 'candles') {
    const symbol = (url.searchParams.get('symbol') || '').trim().toUpperCase().replace(/:.*$/, '');
    if (symbol) {
      nsePath = `/api/chart-databyindex?index=EQN:${encodeURIComponent(symbol)}`;
    }
  }

  if (!nsePath && (routeKey.startsWith('intraday/') || (slug[0] === 'intraday' && slug[1]))) {
    const symbol = (slug[1] || '').trim().toUpperCase().replace(/:.*$/, '');
    if (symbol) {
      nsePath = `/api/chart-databyindex?index=EQN:${encodeURIComponent(symbol)}`;
    }
  }

  if (!nsePath && (routeKey.startsWith('quote/') || (slug[0] === 'quote' && slug[1]))) {
    const symbol = (slug[1] || '').trim().toUpperCase();
    if (symbol) {
      nsePath = `/get-quote/equity/${encodeURIComponent(symbol)}`;
    }
  }

  if (!nsePath && (routeKey === 'large-deals' || routeKey === 'snapshot-capital-market-largedeal')) {
    const mode = url.searchParams.get('mode');
    nsePath = `/api/snapshot-capital-market-largedeal${mode ? `?mode=${mode}` : ''}`;
  }

  if (!nsePath) {
    return jsonResponse({ error: 'Unknown NSE proxy route', path: routeKey }, 404);
  }

  try {
    const upstream = await fetchNse(nsePath);
    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';

    // Fallbacks
    if ((upstream.status === 403 || upstream.status === 404) && routeKey === 'universe') {
      const data = readLocalUniverse();
      if (data) return jsonResponse(data, 200, { 'x-fallback': 'cached-universe' });
    }

    if (upstream.status === 403 && nsePath.startsWith('/api/quote-equity')) {
      const symbol = url.searchParams.get('symbol');
      const data = readLocalQuote(symbol);
      if (data) return jsonResponse(data, 200, { 'x-fallback': 'cached-quote' });
      return jsonResponse({ symbol, unavailable: true, error: 'NSE blocked quote-equity.' }, 200, {
        'x-fallback': 'nse-quote-blocked',
      });
    }

    if ((upstream.status === 403 || upstream.status === 404) && nsePath.includes('snapshot-capital-market-largedeal')) {
      return jsonResponse(
        { data: [], unavailable: true, error: 'NSE large-deal snapshot unavailable.' },
        200,
        { 'x-fallback': 'nse-large-deals-unavailable' }
      );
    }

    if ((upstream.status === 403 || upstream.status === 404) && nsePath.includes('/api/equity-stockIndices')) {
      return jsonResponse(
        { data: [], unavailable: true, error: 'NSE equity-stockIndices basket unavailable.' },
        200,
        { 'x-fallback': 'nse-equity-stock-indices-unavailable' }
      );
    }

    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    if (routeKey === 'universe') {
      const data = readLocalUniverse();
      if (data) return jsonResponse(data, 200, { 'x-fallback': 'cached-universe' });
    }
    if (nsePath?.includes('snapshot-capital-market-largedeal')) {
      return jsonResponse({ data: [], unavailable: true, error: err?.message }, 200);
    }
    if (nsePath?.includes('/api/equity-stockIndices')) {
      return jsonResponse({ data: [], unavailable: true, error: err?.message }, 200);
    }
    return jsonResponse({ error: 'Failed to fetch NSE data', detail: err?.message }, 502);
  }
}
