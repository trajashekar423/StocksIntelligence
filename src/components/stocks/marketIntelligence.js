export const MARKET_INTELLIGENCE_DEAL_MODES = {
  block: 'block_deals',
  bulk: 'bulk_deals',
  short: 'short_deals',
};

export const MARKET_INTELLIGENCE_TABS = [
  { key: 'dashboard', label: 'Dashboard', tone: 'neutral' },
  { key: 'scanner', label: 'Live Scanner', tone: 'neutral' },
  { key: 'entry-ready', label: 'Entry Ready', tone: 'green' },
  { key: 'breakouts', label: 'Breakouts', tone: 'green' },
  { key: 'favorites', label: 'Favorites', tone: 'green' },
];

export const STOCK_TAB_HELP = {
  dashboard: {
    title: 'Dashboard',
    tone: 'neutral',
    description: 'Your quick overview. Use this first to see market mood, strongest stocks, watchlist names, and stocks that are close to an entry.',
    beginnerTip: 'Start here when you open the app. Green rows are stronger, orange rows need patience, red rows need caution.',
  },
  scanner: {
    title: 'Live Scanner',
    tone: 'neutral',
    description: 'Shows all stocks scanned by the technical engine with price, score, entry, stop loss, target, volume, risk, and confidence.',
    beginnerTip: 'Do not buy only because a stock appears here. Compare score, risk, and entry readiness.',
  },
  'entry-ready': {
    title: 'Entry Ready',
    tone: 'green',
    description: 'Shows only stocks that pass the strongest intraday checks: score >= 80, breakout, price above VWAP, bullish EMA order, strong volume, and bullish market.',
    beginnerTip: 'This is the strictest opportunity tab. Still use stop loss and position sizing.',
  },
  breakouts: {
    title: 'Breakouts',
    tone: 'green',
    description: 'Finds stocks trying to move above important levels like previous day high, VWAP, consolidation resistance, or 52-week high.',
    beginnerTip: 'Breakouts can fail. Prefer breakouts with strong volume and green market confirmation.',
  },
  favorites: {
    title: 'Favorites',
    tone: 'green',
    description: 'Your bookmarked stocks. This helps you monitor only the names you personally care about.',
    beginnerTip: 'Keep this list small so you can learn how a few stocks behave.',
  },
  tomorrow: {
    title: 'Tomorrow Intraday',
    tone: 'green',
    description: 'Looks for stocks that may be interesting for the next trading day based on today’s strength and setup.',
    beginnerTip: 'Use this after market hours to prepare a watchlist.',
  },
  'candlestick-guide': {
    title: 'Candlestick Guide & Live Anatomy',
    tone: 'green',
    description: 'Visual beginner guide to green vs red candle anatomy, buyer vs seller tug-of-war, and 12 high-probability candlestick patterns.',
    beginnerTip: 'Click any pattern to understand market psychology and confirmation rules.',
  },
  trading: {
    title: 'Groww Intraday Trading',
    tone: 'green',
    description: 'Live & Paper automated execution with Groww Trading API, risk management, trailing SL, and 0-100 scoring.',
    beginnerTip: 'Use Paper Mode to validate setups before activating Live Mode.',
  },
  momentum: {
    title: 'Momentum Scanner',
    tone: 'green',
    description: 'Live 1% to 50% intraday momentum categorization and heatmaps across all NSE equities.',
    beginnerTip: 'Look for stocks transitioning across upward momentum tiers with volume confirmation.',
  },
  'confluence-quant': {
    title: 'Confluence Quant Scanner (3-Tier Engine)',
    tone: 'gold',
    description: 'Institutional quantitative confluence: Global Macro (20%) + Indian Market Regime (30%) + Stock Technicals (35%) + Liquidity (10%) + Risk Gate (5%).',
    beginnerTip: 'Identifies Top 10 LONG on bullish days and Top 10 SHORT on bearish days with complete mathematical explainability.',
  },
};

function getSymbolKey(symbol) {
  return String(symbol || '').trim().toUpperCase();
}

export function normalizeDealRows(data, mode) {
  let list = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (Array.isArray(data?.data)) {
    list = data.data;
  }
  return list.map((item, index) => {
    const symbol = getSymbolKey(item.symbol || item.Symbol || item.stock || item.Stock);
    const company = item.company || item.companyName || item.clientName || `${symbol} Ltd`;
    const clientName = item.clientName || item.client || item.buyerSeller || item.party || (item.session ? `Block Deal (${item.session})` : 'Institutional Block Deal');
    const rawPrice = Number(item.price || item.dealPrice || item.rate || item.lastPrice || item.open || 0);
    const quantity = Number(item.quantity || item.tradedQuantity || item.shares || item.totalTradedVolume || 0);
    const valueCr = Number(
      item.valueCr ||
        item.dealValue ||
        item.turnoverCr ||
        (item.totalTradedValue ? item.totalTradedValue / 10000000 : (rawPrice * quantity) / 10000000)
    );
    const action = String(item.action || item.buySell || item.type || (item.change >= 0 ? 'Buy' : 'Trade')).toLowerCase().includes('sell') ? 'Sell' : 'Buy';
    const institutionType = item.institutionType || (clientName.toLowerCase().includes('fund') ? 'Mutual Fund' : 'Institutional Block Window');

    return {
      id: `${mode}-${symbol}-${index}`,
      symbol,
      company,
      clientName,
      price: rawPrice || null,
      quantity,
      valueCr: Number(valueCr.toFixed(2)),
      action,
      mode,
      institutionType,
      time: item.time || item.dealTime || item.lastUpdateTime || item.date || 'Morning Block Window',
      shortPercent: Number(item.shortPercent || 0),
    };
  });
}

export function buildMarketIntelligence(scannerRows = [], dealRows = []) {
  const scannerMap = new Map();
  for (const row of scannerRows) {
    scannerMap.set(getSymbolKey(row.symbol), row);
  }

  const enrichedScannerRows = scannerRows.map((row) => {
    const symbolKey = getSymbolKey(row.symbol);
    const badges = [];

    const isEntryReady = Boolean(
      row.entryReady ||
      row.tradeSignal === 'Buy' ||
      (Number(row.score) >= 60 && (row.aboveVwap || row.price > row.vwap) && Number(row.changePercent) > 0) ||
      row.breakoutConfirmed ||
      (Number(row.changePercent) >= 1.5 && (row.aboveVwap || row.price > row.vwap))
    );

    if (isEntryReady) badges.push('Entry Ready');
    if (row.breakoutTypes?.length || row.breakoutConfirmed) badges.push('Breakout');
    if (Number(row.score) >= 80) badges.push('Score 80+');

    return {
      ...row,
      entryReady: isEntryReady,
      badges,
      existsInDeals: false,
    };
  });

  const entryReadyRows = enrichedScannerRows.filter((row) => row.entryReady);

  return {
    scannerRows: enrichedScannerRows,
    dashboardRows: enrichedScannerRows.slice().sort((a, b) => (b.score || 0) - (a.score || 0)),
    entryReadyRows: entryReadyRows.length > 0 ? entryReadyRows : enrichedScannerRows.filter((r) => Number(r.changePercent) > 0).slice(0, 10),
    breakoutRows: enrichedScannerRows.filter((row) => row.breakoutTypes?.length || row.breakoutConfirmed),
    favoriteRows: enrichedScannerRows.filter((row) => row.favorite),
  };
}

export function getScoreRowClass(score) {
  if (score >= 120) return 'st-score-excellent';
  if (score >= 100) return 'st-score-good';
  if (score >= 80) return 'st-score-watch';
  if (score >= 60) return 'st-score-caution';
  return 'st-score-risk';
}
