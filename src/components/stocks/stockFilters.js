export const INDUSTRY_GROUPS = {
  'basic-industry': {
    label: 'Basic Industry',
    symbols: [
      'BASF',
      'CHAMBLFERT',
      'DEEPAKNTR',
      'GNFC',
      'NOCIL',
      'PIIND',
      'SRF',
      'UPL',
    ],
    keywords: ['CHEMICAL', 'FERTILIZER', 'INDUSTRIAL', 'BASIC INDUSTRY'],
  },
  'personal-care': {
    label: 'Personal Care',
    symbols: [
      'HINDUNILVR',
      'DABUR',
      'MARICO',
      'GODREJCP',
      'ITC',
      'COLPAL',
      'NESTLEIND',
      'VBL',
      'RADICO',
      'EMAMILTD',
    ],
    keywords: ['PERSONAL CARE', 'PERSONAL PRODUCTS', 'CONSUMER CARE', 'COSMETICS', 'FMCG'],
  },
};

export function filterStocksByGroup(rows = [], groupKey = 'personal-care') {
  const group = INDUSTRY_GROUPS[groupKey] || { symbols: [], keywords: [] };
  const symbolSet = new Set((group.symbols || []).map((symbol) => String(symbol).trim().toUpperCase()));
  const keywords = (group.keywords || []).map((keyword) => String(keyword).trim().toUpperCase());

  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const symbol = String(row?.symbol || '').trim().toUpperCase();
    const companyName = String(row?.companyName || '').trim().toUpperCase();

    if (!symbol && !companyName) return false;
    if (symbolSet.has(symbol)) return true;

    return keywords.some((keyword) => companyName.includes(keyword));
  });
}
