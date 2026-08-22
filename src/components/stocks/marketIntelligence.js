const DEAL_MODES = {
  block: 'block_deals',
  bulk: 'bulk_deals',
  short: 'short_deals',
};

export const MARKET_INTELLIGENCE_TABS = [
  { key: 'dashboard', label: 'Dashboard', tone: 'neutral' },
  { key: 'scanner', label: 'Live Scanner', tone: 'neutral' },
  { key: 'entry-ready', label: 'Entry Ready', tone: 'green' },
  { key: 'breakouts', label: 'Breakouts', tone: 'green' },
  { key: 'block-deals', label: 'Block Deals', tone: 'orange' },
  { key: 'bulk-deals', label: 'Bulk Deals', tone: 'orange' },
  { key: 'short-deals', label: 'Short Deals', tone: 'red' },
  { key: 'volume-spike', label: 'Volume Spike', tone: 'orange' },
  { key: 'order-book', label: 'Order Book', tone: 'neutral' },
  { key: 'institutional', label: 'Institutional Activity', tone: 'orange' },
  { key: 'favorites', label: 'Favorites', tone: 'green' },
  { key: 'alerts', label: 'Alerts', tone: 'red' },
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
    beginnerTip: 'Do not buy only because a stock appears here. Compare score, risk, volume spike, and entry readiness.',
  },
  'entry-ready': {
    title: 'Entry Ready',
    tone: 'green',
    description: 'Shows only stocks that pass the strongest intraday checks: score 100, breakout, price above VWAP, bullish EMA order, buy ratio above 2, strong volume, and bullish market.',
    beginnerTip: 'This is the strictest opportunity tab. Still use stop loss and position sizing.',
  },
  breakouts: {
    title: 'Breakouts',
    tone: 'green',
    description: 'Finds stocks trying to move above important levels like previous day high, VWAP, consolidation resistance, or 52-week high.',
    beginnerTip: 'Breakouts can fail. Prefer breakouts with volume spike and green market confirmation.',
  },
  'block-deals': {
    title: 'Block Deals',
    tone: 'orange',
    description: 'Large negotiated trades between big participants. These show institutional interest, but they are confidence clues, not direct buy signals.',
    beginnerTip: 'A block buy can support confidence. A block sell means check risk before acting.',
  },
  'bulk-deals': {
    title: 'Bulk Deals',
    tone: 'orange',
    description: 'Large exchange trades by buyers or sellers. Useful for spotting unusual accumulation or distribution.',
    beginnerTip: 'Look for repeated large buyers with a strong scanner score.',
  },
  'short-deals': {
    title: 'Short Deals',
    tone: 'red',
    description: 'Shows short selling activity. High short interest can mean pressure, while short covering can create sharp upside moves.',
    beginnerTip: 'Treat this as risk information first, not as a beginner buy list.',
  },
  'volume-spike': {
    title: 'Volume Spike',
    tone: 'orange',
    description: 'Shows stocks trading much higher volume than normal: 1.5x, 2x, or 3x. Volume confirms whether a move has participation.',
    beginnerTip: 'Volume without price strength can be noisy. Prefer volume plus trend plus VWAP strength.',
  },
  'order-book': {
    title: 'Order Book',
    tone: 'neutral',
    description: 'Compares buy quantity and sell quantity to show whether buyers or sellers are stronger near the current price.',
    beginnerTip: 'Strong Buyers is supportive, but the order book can change quickly.',
  },
  institutional: {
    title: 'Institutional Activity',
    tone: 'orange',
    description: 'Combines block deals, bulk deals, short activity, and other institutional clues into one place.',
    beginnerTip: 'Use this to confirm scanner ideas, not to replace technical checks.',
  },
  favorites: {
    title: 'Favorites',
    tone: 'green',
    description: 'Your bookmarked stocks. This helps you monitor only the names you personally care about.',
    beginnerTip: 'Keep this list small so you can learn how a few stocks behave.',
  },
  alerts: {
    title: 'Alerts',
    tone: 'red',
    description: 'Important events such as new breakout, score crossing 100, entry ready, stop loss hit, or target hit.',
    beginnerTip: 'Alerts are reminders to review the chart and plan. They are not automatic trading instructions.',
  },
  tomorrow: {
    title: 'Tomorrow Intraday',
    tone: 'green',
    description: 'Looks for stocks that may be interesting for the next trading day based on today’s strength and setup.',
    beginnerTip: 'Use this after market hours to prepare a watchlist.',
  },
  avoid: {
    title: 'Avoid Today',
    tone: 'red',
    description: 'Lists stocks with weak momentum, low volume, below-VWAP behavior, poor liquidity, or overbought risk.',
    beginnerTip: 'This tab protects you from forcing trades in bad conditions.',
  },
  top: {
    title: 'Top Gainers',
    tone: 'green',
    description: 'Stocks up the most today. Useful for finding strength, but some may already be too extended.',
    beginnerTip: 'A top gainer is not always a good entry. Check risk and volume.',
  },
  most: {
    title: 'Most Active',
    tone: 'orange',
    description: 'Stocks with the highest trading activity. Useful for liquidity and intraday movement.',
    beginnerTip: 'High activity means attention, not always direction.',
  },
  mystocks: {
    title: 'MyStocks',
    tone: 'green',
    description: 'Your selected symbols with live quote status and simple sentiment.',
    beginnerTip: 'Use this as your personal learning list.',
  },
  cupid: {
    title: 'CUPID Chart Data',
    tone: 'neutral',
    description: 'Raw chart/API data for CUPID, useful for checking candles and API response shape.',
    beginnerTip: 'This is more of a data/debug tab than a trading decision tab.',
  },
  'basic-industry': {
    title: 'Basic Industry',
    tone: 'neutral',
    description: 'Filters scanner results to basic-industry stocks only.',
    beginnerTip: 'Sector tabs help you compare stocks from the same business group.',
  },
  'personal-care': {
    title: 'Personal Care',
    tone: 'neutral',
    description: 'Filters scanner results to personal-care stocks only.',
    beginnerTip: 'Use this to study sector-specific movement.',
  },
};

export const MARKET_INTELLIGENCE_DEAL_MODES = DEAL_MODES;

export function getSymbolKey(value) {
  return String(value || '').trim().toUpperCase();
}

function firstValue(row, keys) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== '') {
      return row[key];
    }
  }

  return '';
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value).replace(/,/g, '').replace(/%/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.payload)) return payload.payload;
  if (Array.isArray(payload?.largeDealsData)) return payload.largeDealsData;
  if (Array.isArray(payload?.blockDeals)) return payload.blockDeals;
  if (Array.isArray(payload?.bulkDeals)) return payload.bulkDeals;
  if (Array.isArray(payload?.shortDeals)) return payload.shortDeals;
  return [];
}

function classifyInstitution(row) {
  const text = [
    row.buyer,
    row.seller,
    row.clientName,
    row.institution,
    row.name,
  ].join(' ').toUpperCase();

  if (/\bFII\b|FOREIGN/.test(text)) return 'FII';
  if (/\bDII\b|DOMESTIC/.test(text)) return 'DII';
  if (/PROMOTER/.test(text)) return 'Promoter';
  if (/MUTUAL|MF\b|FUND/.test(text)) return 'Mutual Fund';
  return '';
}

export function normalizeDealRows(payload, mode) {
  return getRows(payload).map((row, index) => {
    const symbol = getSymbolKey(firstValue(row, [
      'symbol',
      'Symbol',
      'SYMBOL',
      'securityName',
      'Security Name',
      'security',
    ]));
    const quantity = toNumber(firstValue(row, ['quantity', 'qty', 'Quantity', 'QTY', 'shares']));
    const price = toNumber(firstValue(row, ['price', 'dealPrice', 'Deal Price', 'PRICE']));
    const value = toNumber(firstValue(row, ['value', 'dealValue', 'Deal Value'])) || quantity * price;
    const buyer = firstValue(row, ['buyer', 'Buyer', 'buyClientName', 'clientName']);
    const seller = firstValue(row, ['seller', 'Seller', 'sellClientName']);
    const dealPercent = toNumber(firstValue(row, ['dealPercent', 'deal%', 'Deal %', 'percentage']));
    const shortPercent = toNumber(firstValue(row, ['shortPercent', 'short%', 'Short %']));

    return {
      id: `${mode}-${symbol || index}-${buyer}-${seller}`,
      raw: row,
      mode,
      symbol,
      company: firstValue(row, ['company', 'companyName', 'Company', 'securityName']) || symbol,
      buyer,
      seller,
      quantity,
      price,
      value,
      session: firstValue(row, ['session', 'Session', 'mktSession']),
      time: firstValue(row, ['time', 'Time', 'timestamp']),
      institutionType: classifyInstitution({ ...row, buyer, seller }),
      dealPercent,
      shortQuantity: quantity,
      shortPercent,
      action: mode === DEAL_MODES.short
        ? (shortPercent < 0 ? 'Covering' : 'Fresh Shorts')
        : (buyer ? 'Buy' : 'Sell'),
    };
  }).filter((row) => row.symbol);
}

function getScannerMap(rows) {
  return new Map(rows.map((row) => [getSymbolKey(row.symbol), row]));
}

function getDealMap(deals) {
  const map = new Map();
  for (const deal of deals) {
    const key = getSymbolKey(deal.symbol);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(deal);
  }
  return map;
}

export function isEntryReady(row, marketConfirmation) {
  const niftyBullish = marketConfirmation?.score >= 3 || marketConfirmation?.label?.toLowerCase().includes('bull');
  const ema50Ok = row.ema50 ? row.ema20 > row.ema50 : true;

  return row.score >= 100 &&
    row.breakoutConfirmed &&
    row.aboveVwap &&
    row.ema9 > row.ema20 &&
    ema50Ok &&
    row.buyRatio > 2 &&
    row.volumeRatio >= 2 &&
    niftyBullish;
}

export function detectBreakoutTypes(row) {
  const types = [];
  if (row.open && row.dayHigh && row.price >= row.dayHigh * 0.995 && row.price > row.open) types.push('Opening Range Breakout');
  if (row.abovePDH) types.push('Previous Day High Breakout');
  if (row.resistance && row.price > row.resistance && row.volumeRatio >= 1.5) types.push('Consolidation Breakout');
  if (row.weekHigh52 && row.price >= row.weekHigh52 * 0.995) types.push('52 Week High Breakout');
  if (row.aboveVwap && row.volumeRatio >= 1.2) types.push('VWAP Breakout');
  return types;
}

export function buildMarketIntelligence(scannerRows, intelligence, marketConfirmation, favorites = []) {
  const allDeals = [
    ...(intelligence.blockDeals || []),
    ...(intelligence.bulkDeals || []),
    ...(intelligence.shortDeals || []),
    ...(intelligence.insider || []),
    ...(intelligence.shareholding || []),
    ...(intelligence.announcements || []),
  ];
  const scannerMap = getScannerMap(scannerRows);
  const dealMap = getDealMap(allDeals);
  const favoriteSet = new Set(favorites.map(getSymbolKey));

  const enrichedScannerRows = scannerRows.map((row) => {
    const symbol = getSymbolKey(row.symbol);
    const deals = dealMap.get(symbol) || [];
    const institutionalConfidence = deals.length ? 10 : 0;
    const confidence = Math.min(100, Math.round((row.score || 0) + institutionalConfidence));
    const breakoutTypes = detectBreakoutTypes(row);
    const entryReady = isEntryReady(row, marketConfirmation);
    const badges = [];

    if (row.score >= 120 || row.score >= 100) badges.push('High Conviction');
    if (deals.some((deal) => deal.mode === DEAL_MODES.block)) badges.push('Block Deal');
    if (deals.some((deal) => deal.mode === DEAL_MODES.bulk)) badges.push('Bulk Deal');
    if (row.volumeRatio >= 3) badges.push('3x Volume');
    if (row.orderBookBias === 'Strong Buyers') badges.push('Strong Buyers');
    if (breakoutTypes.length) badges.push('Breakout');
    if (entryReady) badges.push('Entry Ready');
    if (deals.some((deal) => deal.institutionType === 'FII' && deal.action === 'Buy')) badges.push('FII Buying');
    if (deals.some((deal) => deal.institutionType === 'DII' && deal.action === 'Buy')) badges.push('DII Buying');
    if (row.risk === 'High' || row.risk === 'Very High') badges.push('High Risk');

    return {
      ...row,
      recommendation: row.tradeSignal || row.signal,
      confidence,
      institutionalConfidence,
      institutionalActivity: deals.length,
      institutionalDeals: deals,
      breakoutTypes,
      entryReady,
      favorite: favoriteSet.has(symbol),
      badges,
    };
  });

  const enrichedDealRows = allDeals.map((deal) => {
    const scanner = scannerMap.get(getSymbolKey(deal.symbol));
    const confidence = Math.min(100, Math.round((scanner?.score || 0) + (scanner ? 10 : 0)));
    const badges = [];

    if (deal.mode === DEAL_MODES.block) badges.push(deal.action === 'Buy' ? 'Block Buy' : 'Block Sell');
    if (deal.mode === DEAL_MODES.bulk) badges.push(deal.action === 'Buy' ? 'Large Buyer' : 'Large Seller');
    if (deal.institutionType) badges.push(deal.institutionType);
    if (deal.mode === DEAL_MODES.short && deal.shortPercent >= 3) badges.push('High Short Interest');
    if (deal.mode === DEAL_MODES.short && deal.action === 'Covering') badges.push('Short Covering');

    return {
      ...deal,
      scannerScore: scanner?.score ?? '',
      recommendation: scanner?.tradeSignal || scanner?.signal || '',
      confidence,
      existsInScanner: Boolean(scanner),
      badges,
    };
  });

  return {
    scannerRows: enrichedScannerRows,
    dealRows: enrichedDealRows,
    dashboardRows: enrichedScannerRows.slice().sort((a, b) => b.score - a.score),
    entryReadyRows: enrichedScannerRows.filter((row) => row.entryReady),
    breakoutRows: enrichedScannerRows.filter((row) => row.breakoutTypes.length),
    volumeSpikeRows: enrichedScannerRows.filter((row) => row.volumeRatio >= 1.5).sort((a, b) => b.volumeRatio - a.volumeRatio),
    orderBookRows: enrichedScannerRows.filter((row) => row.buyRatio || row.totalBuyQty || row.totalSellQty),
    favoriteRows: enrichedScannerRows.filter((row) => row.favorite),
    alerts: buildAlerts(enrichedScannerRows),
  };
}

function buildAlerts(rows) {
  const alerts = [];
  for (const row of rows) {
    if (row.breakoutTypes.length) alerts.push({ symbol: row.symbol, alert: 'New Breakout', detail: row.breakoutTypes.join(', '), score: row.score });
    if (row.score >= 100) alerts.push({ symbol: row.symbol, alert: 'Score crossed 100', detail: row.recommendation, score: row.score });
    if (row.score >= 120) alerts.push({ symbol: row.symbol, alert: 'Score crossed 120', detail: 'High conviction', score: row.score });
    if (row.entryReady) alerts.push({ symbol: row.symbol, alert: 'Entry Ready', detail: 'All entry filters confirmed', score: row.score });
    if (row.price && row.stopLoss && row.price <= row.stopLoss) alerts.push({ symbol: row.symbol, alert: 'Stop Loss Hit', detail: String(row.stopLoss), score: row.score });
    if (row.price && row.target1 && row.price >= row.target1) alerts.push({ symbol: row.symbol, alert: 'Target 1', detail: String(row.target1), score: row.score });
    if (row.price && row.target2 && row.price >= row.target2) alerts.push({ symbol: row.symbol, alert: 'Target 2', detail: String(row.target2), score: row.score });
    if (row.price && row.target3 && row.price >= row.target3) alerts.push({ symbol: row.symbol, alert: 'Target 3', detail: String(row.target3), score: row.score });
  }
  return alerts;
}

export function getScoreRowClass(score) {
  if (score >= 120) return 'st-score-excellent';
  if (score >= 100) return 'st-score-good';
  if (score >= 80) return 'st-score-watch';
  if (score >= 60) return 'st-score-caution';
  return 'st-score-risk';
}
