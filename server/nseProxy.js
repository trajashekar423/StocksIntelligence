import http from 'node:http';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.NSE_PROXY_PORT || 5175);
const NSE_ORIGIN = 'https://www.nseindia.com';

const ROUTES = {
  '/api/nse/top-ten': '/api/live-analysis-variations?index=gainers',
  '/api/nse/most-active': '/api/live-analysis-most-active-securities?index=volume',
  '/api/nse/universe': '/content/equities/EQUITY_L.csv',
  '/api/nse/market-status': '/api/marketStatus',
  '/api/nse/all-indices': '/api/allIndices',
};

const QUOTE_ROUTE_PREFIX = '/api/nse/quote/';
const QUOTE_EQUITY_ROUTE = '/api/nse/quote-equity';
const LARGE_DEAL_ROUTE = '/api/nse/large-deals';

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

let cookie = '';

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'no-store',
  });
  res.end(body);
}

function sendFallbackJson(res, fallbackName, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(200, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'no-store',
    'x-fallback': fallbackName,
  });
  res.end(body);
}

function readLocalUniverse() {
  const local = path.resolve(process.cwd(), 'server', 'data', 'all-securities.json');
  if (!fs.existsSync(local)) return null;
  return JSON.parse(fs.readFileSync(local, 'utf8'));
}

function readLocalQuote(symbol) {
  if (!symbol) return null;
  const localQuote = path.resolve(process.cwd(), 'server', 'data', 'quotes', `${symbol}.json`);
  if (!fs.existsSync(localQuote)) return null;
  return JSON.parse(fs.readFileSync(localQuote, 'utf8'));
}

function updateCookie(headers) {
  const setCookie = headers.getSetCookie?.() || [];
  if (setCookie.length) {
    cookie = setCookie.map((item) => item.split(';')[0]).join('; ');
  }
}

async function ensureCookie() {
  if (cookie) return;

  const res = await fetch(NSE_ORIGIN, {
    headers: COMMON_HEADERS,
  });
  updateCookie(res.headers);
}

async function fetchNse(path) {
  await ensureCookie();

  let res = await fetch(`${NSE_ORIGIN}${path}`, {
    headers: {
      ...COMMON_HEADERS,
      cookie,
      referer: `${NSE_ORIGIN}/`,
      origin: NSE_ORIGIN,
    },
  });

  if (res.status === 401 || res.status === 403) {
    // Try a single retry with a fresh cookie and slightly different headers
    cookie = '';
    await ensureCookie();
    res = await fetch(`${NSE_ORIGIN}${path}`, {
      headers: {
        ...COMMON_HEADERS,
        cookie,
        referer: `${NSE_ORIGIN}/`,
        origin: NSE_ORIGIN,
        'x-requested-with': 'XMLHttpRequest',
      },
    });
  }

  updateCookie(res.headers);
  return res;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization',
    });
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  let nsePath = ROUTES[url.pathname];

  if (!nsePath && url.pathname === QUOTE_EQUITY_ROUTE) {
    const symbol = url.searchParams.get('symbol');
    const section = url.searchParams.get('section');
    const query = new URLSearchParams();
    if (symbol) query.set('symbol', symbol);
    if (section) query.set('section', section);
    nsePath = `/api/quote-equity${query.toString() ? `?${query.toString()}` : ''}`;
  }

  if (!nsePath && url.pathname === '/api/nse/get-quote') {
    const symbol = url.searchParams.get('symbol');
    if (symbol) {
      nsePath = `/api/NextApi/apiClient/GetQuoteApi?functionName=getSymbolData&marketType=N&series=EQ&symbol=${encodeURIComponent(symbol)}`;
    }
  }

  if (!nsePath && url.pathname === '/api/nse/chart-databyindex') {
    const index = url.searchParams.get('index');
    if (index) {
      nsePath = `/api/chart-databyindex?index=${encodeURIComponent(index)}`;
    }
  }

  if (!nsePath && url.pathname === '/api/nse/candles') {
    const symbol = (url.searchParams.get('symbol') || '').trim().toUpperCase().replace(/:.*$/, '');
    if (symbol) {
      nsePath = `/api/chart-databyindex?index=EQN:${encodeURIComponent(symbol)}`;
    }
  }

  if (!nsePath && url.pathname.startsWith('/api/nse/intraday/')) {
    const symbol = url.pathname.replace('/api/nse/intraday/', '').trim().toUpperCase().replace(/:.*$/, '');
    if (symbol) {
      nsePath = `/api/chart-databyindex?index=EQN:${encodeURIComponent(symbol)}`;
    }
  }

  if (!nsePath && (url.pathname === LARGE_DEAL_ROUTE || url.pathname === '/api/snapshot-capital-market-largedeal')) {
    const mode = url.searchParams.get('mode');
    const query = new URLSearchParams();
    if (mode) query.set('mode', mode);
    nsePath = `/api/snapshot-capital-market-largedeal${query.toString() ? `?${query.toString()}` : ''}`;
  }

  if (!nsePath && url.pathname.startsWith(QUOTE_ROUTE_PREFIX)) {
    const symbol = decodeURIComponent(url.pathname.slice(QUOTE_ROUTE_PREFIX.length)).trim();
    if (symbol) {
      nsePath = `/get-quote/equity/${symbol}`;
    }
  }

  if (!nsePath) {
    sendJson(res, 404, { error: 'Unknown NSE proxy route', path: url.pathname });
    return;
  }

  try {
    const upstream = await fetchNse(nsePath);
    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    const body = await upstream.arrayBuffer();

    // Handle blocked or missing resources with local fallbacks for better dev experience
    if ((upstream.status === 403 || upstream.status === 404) && nsePath === ROUTES['/api/nse/universe']) {
      // try serve local cached universe
      const data = readLocalUniverse();
      if (data) {
        sendFallbackJson(res, 'cached-universe', data);
        return;
      }
    }

    // fallback for quote-equity when upstream blocks - look for server/data/quotes/<symbol>.json
    if (upstream.status === 403 && nsePath.startsWith('/api/quote-equity')) {
      const urlObj = new URL(`${req.url}`, `http://${req.headers.host}`);
      const symbol = urlObj.searchParams.get('symbol');
      if (symbol) {
        const data = readLocalQuote(symbol);
        if (data) {
          sendFallbackJson(res, 'cached-quote', data);
          return;
        }

        sendFallbackJson(res, 'nse-quote-blocked', {
          symbol,
          unavailable: true,
          error: 'NSE blocked quote-equity for this symbol.',
        });
        return;
      }
    }

    if ((upstream.status === 403 || upstream.status === 404) && nsePath.startsWith('/api/snapshot-capital-market-largedeal')) {
      sendFallbackJson(res, 'nse-large-deals-unavailable', {
        data: [],
        unavailable: true,
        error: 'NSE large-deal snapshot is unavailable.',
      });
      return;
    }

    res.writeHead(upstream.status, {
      'content-type': contentType,
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
    });
    res.end(Buffer.from(body));
  } catch (error) {
    if (nsePath === ROUTES['/api/nse/universe']) {
      const data = readLocalUniverse();
      if (data) {
        sendFallbackJson(res, 'cached-universe', data);
        return;
      }
    }

    if (nsePath?.startsWith('/api/quote-equity')) {
      const symbol = url.searchParams.get('symbol');
      const data = readLocalQuote(symbol);
      if (data) {
        sendFallbackJson(res, 'cached-quote', data);
        return;
      }

      sendFallbackJson(res, 'nse-quote-blocked', {
        symbol,
        unavailable: true,
        error: error?.message || 'NSE quote-equity is unavailable.',
      });
      return;
    }

    if (nsePath?.startsWith('/api/snapshot-capital-market-largedeal')) {
      sendFallbackJson(res, 'nse-large-deals-unavailable', {
        data: [],
        unavailable: true,
        error: error?.message || 'NSE large-deal snapshot is unavailable.',
      });
      return;
    }

    sendJson(res, 502, {
      error: 'Failed to fetch NSE data',
      detail: error?.message || String(error),
    });
  }
});

server.listen(PORT, () => {
  console.log(`NSE proxy listening at http://localhost:${PORT}`);
});
