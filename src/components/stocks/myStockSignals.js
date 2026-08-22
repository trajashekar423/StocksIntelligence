export function buildMyStockSignal(stock = {}) {
  const price = Number(stock.price ?? 0);
  const previousClose = Number(stock.previousClose ?? stock.prevClose ?? 0);
  const pctChange = previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : 0;

  if (pctChange >= 5) {
    return {
      status: 'Buy',
      sentiment: 'Strong Bullish',
      marketDirection: 'Rapidly Rising',
      investorMood: 'Very Confident',
      keyAction: 'Aggressive Buying',
      goodForIntraday: 'Yes',
    };
  }

  if (pctChange >= 1) {
    return {
      status: 'Buy',
      sentiment: 'Bullish',
      marketDirection: 'Rising',
      investorMood: 'Optimistic',
      keyAction: 'Buying / Holding',
      goodForIntraday: 'Yes',
    };
  }

  if (pctChange <= -5) {
    return {
      status: 'Sell',
      sentiment: 'Bearish',
      marketDirection: 'Falling',
      investorMood: 'Pessimistic',
      keyAction: 'Selling / Hedging',
      goodForIntraday: 'No',
    };
  }

  if (pctChange <= -1) {
    return {
      status: 'Sell',
      sentiment: 'Bearish',
      marketDirection: 'Falling',
      investorMood: 'Cautious',
      keyAction: 'Reduce Risk',
      goodForIntraday: 'No',
    };
  }

  return {
    status: 'Hold',
    sentiment: 'Neutral',
    marketDirection: 'Sideways',
    investorMood: 'Balanced',
    keyAction: 'Wait & Watch',
    goodForIntraday: 'No',
  };
}
