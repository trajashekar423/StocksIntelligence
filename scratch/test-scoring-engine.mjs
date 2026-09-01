async function testScoringEngine() {
  const mockStocks = [
    { symbol: 'BODALCHEM', price: 118.89, previousClose: 100.4, open: 106.5, dayHigh: 119.0, dayLow: 106.0, volume: 3500000 },
    { symbol: 'CORDSCABLE', price: 290.44, previousClose: 251.2, open: 260.0, dayHigh: 292.8, dayLow: 251.98, volume: 1800000 },
    { symbol: 'PAR', price: 117.0, previousClose: 100.0, open: 105.0, dayHigh: 119.0, dayLow: 100.26, volume: 1200000 },
    { symbol: 'YESBANK', price: 22.83, previousClose: 22.4, open: 22.5, dayHigh: 23.1, dayLow: 22.3, volume: 45000000 },
    { symbol: 'SHIPROCKET', price: 139.8, previousClose: 135.0, open: 136.0, dayHigh: 141.0, dayLow: 135.0, volume: 800000 },
  ];

  for (const s of mockStocks) {
    const changePercent = ((s.price - s.previousClose) / s.previousClose) * 100;
    const vwap = (s.open + 2 * s.dayHigh + s.dayLow + 2 * s.price) / 6;
    const aboveVwap = s.price > vwap;
    const volumeRatio = s.volume >= 1000000 ? 2.5 : 1.6;
    const abovePDH = s.price > s.previousClose * 1.01;
    const breakoutConfirmed = abovePDH && aboveVwap && volumeRatio >= 1.5;
    const bullishTrend = s.price > s.open;

    let score = 0;
    if (changePercent >= 2) score += 20;
    else if (changePercent > 0) score += 10;

    if (volumeRatio >= 2) score += 20;
    else if (volumeRatio >= 1.5) score += 16;
    else if (volumeRatio >= 1.2) score += 10;

    if (aboveVwap) score += 15;
    if (breakoutConfirmed) score += 15;
    else score += 8;

    if (bullishTrend) score += 10;
    if (s.volume >= 100000) score += 10;
    score += 5; // market

    score = Math.min(100, Math.max(0, score));

    const risk = score >= 75 && aboveVwap ? 'Low' : score >= 60 ? 'Medium' : 'High';
    const rec = score >= 70 ? 'Buy' : score >= 55 ? 'Watch' : 'Avoid';

    console.log(`${s.symbol}: Change: +${changePercent.toFixed(2)}%, Score: ${score}/100, Risk: ${risk}, Rec: ${rec}`);
  }
}

testScoringEngine();

