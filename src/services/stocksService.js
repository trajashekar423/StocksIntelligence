function formatError(status, text) {
  return {
    ok: false,
    status,
    error: text || `Request failed with status ${status}`,
  };
}

function normalizeTopTen(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.allSec?.data)) return data.allSec.data;
  if (Array.isArray(data?.FOSec?.data)) return data.FOSec.data;
  if (Array.isArray(data?.data)) return data.data;
  return data;
}

function normalizeMostActive(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return data;
}

function normalizeUniverse(data) {
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (typeof item === 'string') return { symbol: item, companyName: item };
      return {
        symbol: item.SYMBOL || item.Symbol || item.symbol || '',
        companyName: item['NAME OF COMPANY'] || item['Name of Company'] || item.companyName || item.NAMEDESC || '',
      };
    }).filter((item) => item.symbol);
  }

  return [];
}

export async function fetchTopTen() {
  const endpoint = '/api/nse/top-ten';
  const res = await fetch(endpoint);
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (res.ok) {
    if (ct.includes('application/json')) {
      const text = await res.text();
      if (!text || !text.trim()) return { ok: true, data: normalizeTopTen(null) };
      try {
        const parsed = JSON.parse(text);
        return { ok: true, data: normalizeTopTen(parsed) };
      } catch (err) {
        return { ok: true, data: normalizeTopTen(text) };
      }
    }

    const text = await res.text();
    return { ok: true, data: text || 'No Top Ten data returned.' };
  }
  const text = await res.text();
  return formatError(res.status, text);
}

export async function fetchMostActive() {
  const endpoint = '/api/nse/most-active';
  const res = await fetch(endpoint);
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (res.ok) {
    if (ct.includes('application/json')) {
      const text = await res.text();
      if (!text || !text.trim()) return { ok: true, data: normalizeMostActive(null) };
      try {
        const parsed = JSON.parse(text);
        return { ok: true, data: normalizeMostActive(parsed) };
      } catch (err) {
        return { ok: true, data: normalizeMostActive(text) };
      }
    }

    const text = await res.text();
    return { ok: true, data: text || 'No Most Active data returned.' };
  }
  const text = await res.text();
  return formatError(res.status, text);
}

export async function fetchMarketStatus() {
  const endpoint = '/api/nse/market-status';
  const res = await fetch(endpoint);
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (res.ok) {
    if (ct.includes('application/json')) {
      const text = await res.text();
      if (!text || !text.trim()) return { ok: true, data: null };
      try {
        return { ok: true, data: JSON.parse(text) };
      } catch (err) {
        return { ok: true, data: text };
      }
    }

    return { ok: true, data: await res.text() };
  }
  const text = await res.text();
  return formatError(res.status, text);
}

export async function fetchAllIndices() {
  const endpoint = '/api/nse/all-indices';
  const res = await fetch(endpoint);
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (res.ok) {
    if (ct.includes('application/json')) {
      const text = await res.text();
      if (!text || !text.trim()) return { ok: true, data: null };
      try {
        return { ok: true, data: JSON.parse(text) };
      } catch (err) {
        return { ok: true, data: text };
      }
    }

    return { ok: true, data: await res.text() };
  }
  const text = await res.text();
  return formatError(res.status, text);
}

export async function fetchStockQuote(symbol, section) {
  const params = new URLSearchParams({ symbol });
  if (section) params.set('section', section);
  const endpoint = `/api/nse/quote-equity?${params.toString()}`;
  const res = await fetch(endpoint);
  const ct = (res.headers.get('content-type') || '').toLowerCase();

  if (!res.ok) {
    const text = await res.text();
    return formatError(res.status, text);
  }

  const fallback = res.headers.get('x-fallback');

  if (ct.includes('application/json')) {
    const text = await res.text();
    if (!text || !text.trim()) return { ok: true, data: null };
    try {
      const parsed = JSON.parse(text);
      return {
        ok: fallback !== 'nse-quote-blocked',
        data: parsed,
        fallback,
      };
    } catch (err) {
      return { ok: true, data: text };
    }
  }

  const text = await res.text();
  return { ok: true, data: text || null };
}

export async function fetchNseGetQuote(symbol) {
  const params = new URLSearchParams({ symbol });
  const endpoint = `/api/nse/get-quote?${params.toString()}`;
  try {
    const res = await fetch(endpoint);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok) {
      const text = await res.text();
      return formatError(res.status, text);
    }

    if (ct.includes('application/json')) {
      const text = await res.text();
      if (!text || !text.trim()) return { ok: true, data: null };
      try {
        return { ok: true, data: JSON.parse(text) };
      } catch (err) {
        return { ok: true, data: text };
      }
    }

    const text = await res.text();
    return { ok: true, data: text || null };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export async function fetchChartDataByIndex(index) {
  try {
    const endpoint = `/api/nse/chart-databyindex?index=${encodeURIComponent(index)}`;
    const res = await fetch(endpoint);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok) {
      const text = await res.text();
      return formatError(res.status, text);
    }

    if (ct.includes('application/json')) {
      const text = await res.text();
      try {
        return { ok: true, data: JSON.parse(text) };
      } catch (err) {
        return { ok: true, data: text };
      }
    }

    const text = await res.text();
    return { ok: true, data: text || null };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export async function fetchUniverse() {
  const endpoint = '/api/nse/universe';
  try {
    const res = await fetch(endpoint);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok) return { ok: false, status: res.status, error: await res.text() };

    const text = await res.text();
    if (!text) return { ok: true, data: [] };

    if (ct.includes('application/json')) {
      try {
        return { ok: true, data: normalizeUniverse(JSON.parse(text)) };
      } catch (err) {
        return { ok: true, data: [] };
      }
    }

    // CSV from NSE: first line headers, subsequent lines SYMBOL,NAME OF COMPANY,SERIES, etc.
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return { ok: true, data: [] };

    const headers = lines[0].split(',').map((h) => h.replace(/\"/g, '').trim());
    const rows = lines.slice(1).map((line) => {
      const parts = line.split(',');
      const obj = {};
      for (let i = 0; i < headers.length; i++) {
        obj[headers[i]] = (parts[i] || '').replace(/\"/g, '').trim();
      }
      return obj;
    });

    // Filter equities only (Series EQ) and exclude indices/ETFs by series if present
    const equities = rows.filter((r) => {
      const series = (r.Series || r.series || '').toUpperCase();
      const symbol = (r.SYMBOL || r.Symbol || r.symbol || '').toString().trim();
      if (!symbol) return false;
      if (series && series !== 'EQ') return false;
      // exclude typical non-equity suffixes
      if (/ETF|BE|MF|INDEX|INI|IND|GIFT/.test(symbol)) return false;
      return true;
    }).map((r) => ({ symbol: r.SYMBOL || r.Symbol || r.symbol, companyName: r['NAME OF COMPANY'] || r['Name of Company'] || r.NAMEDESC || '' }));

    // Deduplicate symbols
    const seen = new Set();
    const uniq = [];
    equities.forEach((e) => {
      const s = (e.symbol || '').toString().trim();
      if (!s) return;
      if (seen.has(s)) return;
      seen.add(s);
      uniq.push(e);
    });

    return { ok: true, data: uniq };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

export async function fetchLargeDeals(mode) {
  try {
    const params = new URLSearchParams({ mode });
    const endpoint = `/api/nse/large-deals?${params.toString()}`;
    const res = await fetch(endpoint);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok) {
      const text = await res.text();
      return formatError(res.status, text);
    }

    if (ct.includes('application/json')) {
      const text = await res.text();
      if (!text || !text.trim()) return { ok: true, data: [] };
      try {
        return { ok: true, data: JSON.parse(text) };
      } catch (err) {
        return { ok: true, data: [] };
      }
    }

    return { ok: true, data: await res.text() };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export async function fetchStockCandles(symbol) {
  const sym = String(symbol || '').trim().toUpperCase().replace(/:.*$/, '');
  if (!sym) return { ok: false, error: 'No symbol provided', data: [] };
  try {
    const endpoint = `/api/nse/candles?symbol=${encodeURIComponent(sym)}`;
    const res = await fetch(endpoint);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, status: res.status, error: text, symbol: sym, data: [] };
    }
    if (ct.includes('application/json')) {
      const text = await res.text();
      if (!text || !text.trim()) return { ok: true, symbol: sym, data: [] };
      try {
        return { ok: true, symbol: sym, data: JSON.parse(text) };
      } catch {
        return { ok: true, symbol: sym, data: [] };
      }
    }
    return { ok: true, symbol: sym, data: [] };
  } catch (err) {
    return { ok: false, symbol: sym, error: err?.message || String(err), data: [] };
  }
}

export async function fetchScannerMarketData() {
  // Combine top-ten and most-active feeds into a single market data array
  try {
    const [topRes, mostRes] = await Promise.all([fetchTopTen(), fetchMostActive()]);
    const top = Array.isArray(topRes?.data) ? topRes.data : [];
    const most = Array.isArray(mostRes?.data) ? mostRes.data : [];
    const merged = [...top, ...most];
    const ok = Boolean(topRes?.ok || mostRes?.ok);
    return { ok, data: merged };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}
