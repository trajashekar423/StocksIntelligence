import fs from 'node:fs';
import path from 'node:path';

const NSE_ORIGIN = 'https://www.nseindia.com';

const ROUTES = {
  '/api/nse/top-ten': '/api/live-analysis-variations?index=gainers',
  '/api/nse/most-active': '/api/live-analysis-most-active-securities?index=volume',
  '/api/nse/universe': '/content/equities/EQUITY_L.csv',
  '/api/nse/market-status': '/api/marketStatus',
  '/api/nse/all-indices': '/api/allIndices',
  '/api/nse/scanner-market-data': '/api/live-analysis-most-active-securities?index=volume',
};

const COMMON_HEADERS = {
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-dest': 'document',
  'x-requested-with': 'XMLHttpRequest',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
  'Cache-Control': 'no-store',
};

let cachedCookie = '';

async function ensureCookie() {
  if (cachedCookie) return;
  try {
    const res = await fetch(NSE_ORIGIN, { headers: COMMON_HEADERS });
    const setCookie = res.headers.getSetCookie?.() || [];
    if (setCookie.length) {
      cachedCookie = setCookie.map((c) => c.split(';')[0]).join('; ');
    }
  } catch {
    // ignore
  }
}

async function fetchNse(nsePath) {
  await ensureCookie();
  const res = await fetch(`${NSE_ORIGIN}${nsePath}`, {
    headers: { ...COMMON_HEADERS, cookie: cachedCookie, referer: `${NSE_ORIGIN}/`, origin: NSE_ORIGIN },
  });
  // refresh cookie
  const setCookie = res.headers.getSetCookie?.() || [];
  if (setCookie.length) cachedCookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  // retry once on auth failure
  if (res.status === 401 || res.status === 403) {
    cachedCookie = '';
    await ensureCookie();
    return fetch(`${NSE_ORIGIN}${nsePath}`, {
      headers: { ...COMMON_HEADERS, cookie: cachedCookie, referer: `${NSE_ORIGIN}/`, origin: NSE_ORIGIN },
    });
  }
  return res;
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS, ...extra },
  });
}

function readLocalUniverse() {
  try {
    const p = path.resolve(process.cwd(), 'server', 'data', 'all-securities.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch { /* ignore */ }
  return null;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url = new URL(req.url);
  const pathname = url.pathname;

  // Strip /api/nse prefix to get the sub-path
  // Vercel routes: /api/nse/[...path] → this file receives full URL
  let nsePath = ROUTES[pathname];

  // quote-equity
  if (!nsePath && pathname === '/api/nse/quote-equity') {
    const symbol = url.searchParams.get('symbol');
    const section = url.searchParams.get('section');
    const q = new URLSearchParams();
    if (symbol) q.set('symbol', symbol);
    if (section) q.set('section', section);
    nsePath = `/api/quote-equity?${q.toString()}`;
  }

  // get-quote (ATHERENERG style)
  if (!nsePath && pathname === '/api/nse/get-quote') {
    const symbol = url.searchParams.get('symbol');
    if (symbol) nsePath = `/api/NextApi/apiClient/GetQuoteApi?functionName=getSymbolData&marketType=N&series=EQ&symbol=${encodeURIComponent(symbol)}`;
  }

  // chart-databyindex
  if (!nsePath && pathname === '/api/nse/chart-databyindex') {
    const index = url.searchParams.get('index');
    if (index) nsePath = `/api/chart-databyindex?index=${encodeURIComponent(index)}`;
  }

  // candles — intraday OHLCV for any NSE equity symbol
  if (!nsePath && pathname === '/api/nse/candles') {
    const symbol = (url.searchParams.get('symbol') || '').trim().toUpperCase().replace(/:.*$/, '');
    if (symbol) nsePath = `/api/chart-databyindex?index=EQN:${encodeURIComponent(symbol)}`;
  }

  // intraday — normalized alias: /api/nse/intraday/SYMBOL
  if (!nsePath && pathname.startsWith('/api/nse/intraday/')) {
    const symbol = pathname.replace('/api/nse/intraday/', '').trim().toUpperCase().replace(/:.*$/, '');
    if (symbol) nsePath = `/api/chart-databyindex?index=EQN:${encodeURIComponent(symbol)}`;
  }

  // large-deals
  if (!nsePath && pathname === '/api/nse/large-deals') {
    const mode = url.searchParams.get('mode');
    nsePath = `/api/snapshot-capital-market-largedeal${mode ? `?mode=${mode}` : ''}`;
  }

  if (!nsePath) {
    return json({ error: 'Unknown NSE proxy route', path: pathname }, 404);
  }

  try {
    const upstream = await fetchNse(nsePath);
    const ct = upstream.headers.get('content-type') || 'application/json';

    // Fallbacks for blocked/unavailable endpoints
    if ((upstream.status === 403 || upstream.status === 404) && nsePath === ROUTES['/api/nse/universe']) {
      const data = readLocalUniverse();
      if (data) return json(data, 200, { 'x-fallback': 'cached-universe' });
    }

    if ((upstream.status === 403 || upstream.status === 404) && nsePath.includes('snapshot-capital-market-largedeal')) {
      return json({ data: [], unavailable: true, error: 'NSE large-deal snapshot unavailable.' }, 200, { 'x-fallback': 'nse-large-deals-unavailable' });
    }

    if (upstream.status === 403 && nsePath.startsWith('/api/quote-equity')) {
      const symbol = url.searchParams.get('symbol');
      return json({ symbol, unavailable: true, error: 'NSE blocked quote-equity.' }, 200, { 'x-fallback': 'nse-quote-blocked' });
    }

    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': ct, ...CORS },
    });
  } catch (err) {
    // Fallbacks on network error
    if (nsePath === ROUTES['/api/nse/universe']) {
      const data = readLocalUniverse();
      if (data) return json(data, 200, { 'x-fallback': 'cached-universe' });
    }
    if (nsePath?.includes('snapshot-capital-market-largedeal')) {
      return json({ data: [], unavailable: true, error: err?.message }, 200);
    }
    return json({ error: 'Failed to fetch NSE data', detail: err?.message }, 502);
  }
}
