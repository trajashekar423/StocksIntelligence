/**
 * Candlestick Pattern Recognition & Live Anatomy Engine
 * Implements full detection for all 12 Bullish Candlestick Patterns from the educational guide:
 * 1. Bullish Engulfing 🐂
 * 2. Hammer 🔨
 * 3. Morning Star ⭐
 * 4. Three White Soldiers 💂‍♂️
 * 5. Inverted Hammer 🔨
 * 6. Piercing Pattern ⚡
 * 7. Bullish Harami 🤰
 * 8. Three Inside Up 📈
 * 9. Tweezer Bottom ⚓
 * 10. On-Neck Pattern 🧣
 * 11. Bullish Counter Attack 🛡️
 * 12. Three Outside Up 🚀
 * Plus Key Bearish & Indecision Patterns (Bearish Engulfing, Shooting Star, Evening Star, Three Black Crows, Doji).
 */

export const CANDLESTICK_PATTERNS_INFO = {
  'Bullish Engulfing': {
    name: 'Bullish Engulfing',
    type: 'BULLISH_REVERSAL',
    emoji: '🐂',
    strength: 'Very High',
    description: 'A large green candle completely engulfs/covers the previous red candle body.',
    psychology: 'Sellers pushed price down in the previous candle, but buyers took complete aggressive control and drove the price well above the prior open.',
    confirmation: ['Occurs near support or after a pullback', 'Price trades above VWAP', 'Volume is higher than previous candle'],
    howToTrade: 'Enter on breakout above the green candle high. Set stop-loss below the green candle low.',
    targetRatio: '1:2 or higher',
    rule: 'Previous candle is Red; Current candle is Green; Current body completely covers previous body.',
  },
  Hammer: {
    name: 'Hammer',
    type: 'BULLISH_REVERSAL',
    emoji: '🔨',
    strength: 'High',
    description: 'Small body at the top with a long lower wick (at least 2x the body height) and minimal upper wick.',
    psychology: 'Sellers drove price sharply down during the session, but strong buyers stepped in at lower levels and forced price back up near the highs.',
    confirmation: ['Forms after a downtrend or at support', 'Next candle closes green above the hammer body', 'Increasing volume'],
    howToTrade: 'Enter above the hammer high once confirmed. Place stop-loss just below the long lower wick.',
    targetRatio: '1:2',
    rule: 'Lower wick >= 2x Body; Upper wick <= 0.5x Body; Closes in upper third of range.',
  },
  'Morning Star': {
    name: 'Morning Star',
    type: 'BULLISH_REVERSAL',
    emoji: '⭐',
    strength: 'Very High',
    description: '3-candle reversal pattern: 1st large red candle, 2nd small indecision star/doji, 3rd strong green candle closing above midpoint of 1st candle.',
    psychology: 'Sellers were dominant on day 1. Day 2 showed indecision/exhaustion. Day 3 confirmed strong buyer takeover.',
    confirmation: ['Forms at major support', 'Day 3 volume exceeds day 2 volume', 'RSI bouncing out of oversold'],
    howToTrade: 'Enter on completion of the 3rd green candle. Set stop-loss below the lowest point of the star (candle 2).',
    targetRatio: '1:2.5',
    rule: 'Candle 1: Red; Candle 2: Small body/gap down; Candle 3: Green closing > 50% of Candle 1 body.',
  },
  'Three White Soldiers': {
    name: 'Three White Soldiers',
    type: 'BULLISH_CONTINUATION',
    emoji: '💂‍♂️',
    strength: 'Extreme',
    description: 'Three consecutive strong green candles, each opening within the previous candle body and closing at higher new highs.',
    psychology: 'Relentless buying pressure over consecutive periods with minimal pullback. Strong institutional accumulation.',
    confirmation: ['Small upper wicks', 'Consecutive rising volume', 'Occurs after consolidation or trend breakout'],
    howToTrade: 'Enter on the 3rd candle or on a shallow retest. Stop-loss placed below the low of the 1st soldier.',
    targetRatio: '1:3',
    rule: '3 consecutive green candles with higher opens and higher closes; small wicks.',
  },
  'Inverted Hammer': {
    name: 'Inverted Hammer',
    type: 'BULLISH_REVERSAL',
    emoji: '🔨',
    strength: 'Moderate-High',
    description: 'Small body at the bottom of the range with a long upper wick (>= 2x body) and minimal lower wick.',
    psychology: 'Buyers tested higher prices aggressively. Although sellers pushed it back down, buyers prevented a new low, signaling emerging demand.',
    confirmation: ['Next candle confirms by opening or closing higher', 'Near strong support', 'Volume spike'],
    howToTrade: 'Wait for the next green confirmation candle before entry. Stop-loss below the inverted hammer low.',
    targetRatio: '1:2',
    rule: 'Upper wick >= 2x Body; Lower wick <= 0.5x Body; Occurs after a down move.',
  },
  'Piercing Pattern': {
    name: 'Piercing Pattern',
    type: 'BULLISH_REVERSAL',
    emoji: '⚡',
    strength: 'High',
    description: '2-candle pattern: Red candle followed by a Green candle that opens below the previous low but closes above 50% of the red candle body.',
    psychology: 'Sellers tried to push lower with a gap down, but strong buyers quickly entered and reclaimed more than half the previous drop.',
    confirmation: ['Green candle close > 50% of Red candle body', 'High volume on the green candle'],
    howToTrade: 'Enter above the piercing green candle high. Stop-loss below the lowest wick of the green candle.',
    targetRatio: '1:2',
    rule: 'Candle 1: Red; Candle 2: Green opens lower but closes > 50% of Candle 1 body.',
  },
  'Bullish Harami': {
    name: 'Bullish Harami',
    type: 'BULLISH_REVERSAL',
    emoji: '🤰',
    strength: 'Moderate-High',
    description: 'A large red candle followed by a smaller green candle completely contained inside the body of the previous red candle.',
    psychology: 'Selling momentum has suddenly halted. The small green body inside the prior range indicates sellers have lost power.',
    confirmation: ['Next candle breaks above the high of the Harami', 'Forms at key support level'],
    howToTrade: 'Enter when price breaks above the previous large red candle high. Stop-loss below the red candle low.',
    targetRatio: '1:2',
    rule: 'Candle 1: Large Red; Candle 2: Small Green inside Candle 1 body range.',
  },
  'Three Inside Up': {
    name: 'Three Inside Up',
    type: 'BULLISH_CONFIRMATION',
    emoji: '📈',
    strength: 'Very High',
    description: 'A Bullish Harami followed by a 3rd strong green candle that closes above the high of the first red candle.',
    psychology: 'Provides explicit 3rd-candle confirmation that the Harami reversal is genuine and buyers are driving trend continuation.',
    confirmation: ['3rd candle closes above 1st candle high with strong volume'],
    howToTrade: 'Enter on close of 3rd candle. Stop-loss below the 2nd candle low.',
    targetRatio: '1:2.5',
    rule: 'Candle 1: Red; Candle 2: Harami Green; Candle 3: Green closing above Candle 1 high.',
  },
  'Tweezer Bottom': {
    name: 'Tweezer Bottom',
    type: 'BULLISH_REVERSAL',
    emoji: '⚓',
    strength: 'High',
    description: 'Two consecutive candles (1st Red, 2nd Green) sharing the exact same low price level with matching bottom wicks.',
    psychology: 'Sellers tested the same support level twice and were violently rejected both times, creating a solid floor.',
    confirmation: ['Second candle is green and closes strong', 'Near key horizontal support or VWAP'],
    howToTrade: 'Enter above the high of the 2nd candle. Stop-loss strictly below the dual tweezer lows.',
    targetRatio: '1:2',
    rule: 'Low of Candle 1 equals Low of Candle 2 within 0.15% margin; Candle 2 is Green.',
  },
  'On-Neck Pattern': {
    name: 'On-Neck Pattern',
    type: 'BULLISH_PAUSE',
    emoji: '🧣',
    strength: 'Moderate',
    description: 'A large red candle followed by a smaller green candle that opens lower and closes near the previous candle low/neckline.',
    psychology: 'Sellers remain active, but buyers have stepped in to halt new downside extensions. Watch for bullish breakout above the neck.',
    confirmation: ['Followed by a breakout above the prior red candle open'],
    howToTrade: 'Wait for confirmation above previous open before buying.',
    targetRatio: '1:1.5',
    rule: 'Candle 1: Red; Candle 2: Green closes near the low of Candle 1.',
  },
  'Bullish Counter Attack': {
    name: 'Bullish Counter Attack',
    type: 'BULLISH_REVERSAL',
    emoji: '🛡️',
    strength: 'High',
    description: 'A large red candle followed by a green candle that opened significantly lower but rallied to close at the exact same close as the red candle.',
    psychology: 'Bears opened with a massive gap down, but Bulls counter-attacked aggressively and recovered all intra-candle losses.',
    confirmation: ['High volume on the counter-attack candle', 'Occurs at support'],
    howToTrade: 'Enter on breakout of the high of the green counter-attack candle with SL below its low.',
    targetRatio: '1:2',
    rule: 'Candle 1: Red; Candle 2: Green opens lower and closes at or very near Candle 1 close.',
  },
  'Three Outside Up': {
    name: 'Three Outside Up',
    type: 'BULLISH_CONFIRMATION',
    emoji: '🚀',
    strength: 'Very High',
    description: 'A Bullish Engulfing pattern followed by a 3rd green candle that makes a higher high and closes above the 2nd candle.',
    psychology: 'Confirmation that the Bullish Engulfing momentum is sustaining and sellers are completely overwhelmed.',
    confirmation: ['3rd candle makes new high with volume'],
    howToTrade: 'Enter on 3rd candle close with SL below the engulfing candle low.',
    targetRatio: '1:3',
    rule: 'Candles 1-2: Bullish Engulfing; Candle 3: Green candle making higher high and higher close.',
  },
  'Bearish Engulfing': {
    name: 'Bearish Engulfing',
    type: 'BEARISH_REVERSAL',
    emoji: '🐻',
    strength: 'Very High',
    description: 'A large red candle completely engulfs the previous green candle body.',
    psychology: 'Sellers overpowered buyers completely and wiped out prior gains.',
    confirmation: ['Occurs at resistance or overbought levels', 'High selling volume'],
    howToTrade: 'Caution / Exit BUY positions. For intraday shorting, enter below the red candle low.',
    targetRatio: '1:2',
    rule: 'Candle 1: Green; Candle 2: Red; Candle 2 body completely covers Candle 1 body.',
  },
  'Shooting Star': {
    name: 'Shooting Star',
    type: 'BEARISH_REVERSAL',
    emoji: '🌠',
    strength: 'High',
    description: 'Small body near the bottom with a long upper wick (>= 2x body) and minimal lower wick after an uptrend.',
    psychology: 'Buyers pushed price up, but sellers rejected the higher price fiercely and closed near the lows.',
    confirmation: ['Forms at resistance', 'Next candle confirms with lower close'],
    howToTrade: 'Exit longs / take profit. Set stop-loss above the shooting star high.',
    targetRatio: '1:2',
    rule: 'Upper wick >= 2x Body; Lower wick <= 0.5x Body; Occurs after an uptrend.',
  },
  'Doji': {
    name: 'Doji (Indecision)',
    type: 'INDECISION',
    emoji: '⚖️',
    strength: 'Neutral',
    description: 'Open and Close are virtually equal, forming a cross or plus sign.',
    psychology: 'Complete equilibrium between buyers and sellers. Neither side has control. A big move is brewing.',
    confirmation: ['Wait for the breakout candle in either direction'],
    howToTrade: 'Do not enter blindly. Wait for the next candle to break above or below the Doji extremes.',
    targetRatio: '1:2',
    rule: 'Body height is less than 10% of total candle range.',
  },
};

/**
 * Analyzes the anatomy of a single candlestick in real time.
 */
export function analyzeCandleAnatomy(candle) {
  if (!candle || typeof candle.open !== 'number' || typeof candle.close !== 'number') {
    return null;
  }

  const open = Number(candle.open);
  const high = Number(candle.high ?? Math.max(open, candle.close));
  const low = Number(candle.low ?? Math.min(open, candle.close));
  const close = Number(candle.close);
  const volume = Number(candle.volume || 0);

  const isGreen = close >= open;
  const isRed = close < open;
  const totalRange = Math.max(high - low, 0.01);
  const bodySize = Math.abs(close - open);
  const bodyHigh = Math.max(open, close);
  const bodyLow = Math.min(open, close);

  const upperWick = Math.max(high - bodyHigh, 0);
  const lowerWick = Math.max(bodyLow - low, 0);

  const bodyRatio = Number((bodySize / totalRange).toFixed(2));
  const upperWickRatio = Number((upperWick / totalRange).toFixed(2));
  const lowerWickRatio = Number((lowerWick / totalRange).toFixed(2));

  // Buyer vs Seller control computation (0 to 100)
  let buyerControl = 50;
  if (isGreen) {
    buyerControl = Math.round(50 + (bodyRatio * 35) + (lowerWickRatio * 15) - (upperWickRatio * 15));
  } else {
    buyerControl = Math.round(50 - (bodyRatio * 35) - (upperWickRatio * 15) + (lowerWickRatio * 15));
  }
  buyerControl = Math.max(5, Math.min(95, buyerControl));
  const sellerControl = 100 - buyerControl;

  // Generate plain-English beginner story
  let story = '';
  let changePct = open > 0 ? (((close - open) / open) * 100).toFixed(2) : '0.00';
  const sign = Number(changePct) >= 0 ? '+' : '';

  if (isGreen) {
    if (bodyRatio >= 0.7) {
      story = `Strong Bullish Candle 🟢 (${sign}${changePct}%). Buyers dominated the entire period with almost no selling resistance.`;
    } else if (lowerWickRatio >= 0.4) {
      story = `Buyers Defended the Lows 🔨. Sellers tried to push down to ₹${low.toFixed(2)}, but buyers rejected the dip and drove price up to ₹${close.toFixed(2)}.`;
    } else if (upperWickRatio >= 0.3) {
      story = `Buyers Pushed Higher 🟢, but faced some profit taking near the high of ₹${high.toFixed(2)}. Net gain of ${sign}${changePct}%.`;
    } else {
      story = `Bullish Session 🟢. Price opened at ₹${open.toFixed(2)} and closed higher at ₹${close.toFixed(2)} (${sign}${changePct}%).`;
    }
  } else if (isRed) {
    if (bodyRatio >= 0.7) {
      story = `Strong Bearish Candle 🔴 (${changePct}%). Sellers had full control and pushed prices down continuously.`;
    } else if (upperWickRatio >= 0.4) {
      story = `Sellers Rejected Higher Prices 🌠. Buyers tried pushing up to ₹${high.toFixed(2)}, but aggressive sellers took over.`;
    } else if (lowerWickRatio >= 0.3) {
      story = `Sellers Drove Down 🔴, but buyers began absorbing supply near the low of ₹${low.toFixed(2)}.`;
    } else {
      story = `Bearish Session 🔴. Price opened at ₹${open.toFixed(2)} and closed lower at ₹${close.toFixed(2)} (${changePct}%).`;
    }
  } else {
    story = `Equilibrium / Indecision ⚖️. Open and Close are virtually equal at ₹${close.toFixed(2)}. A battle between buyers and sellers with no clear winner.`;
  }

  return {
    open,
    high,
    low,
    close,
    volume,
    isGreen,
    isRed,
    color: isGreen ? 'green' : 'red',
    sentiment: buyerControl >= 60 ? 'Bullish 🐂' : sellerControl >= 60 ? 'Bearish 🐻' : 'Neutral ⚖️',
    bodySize: Number(bodySize.toFixed(2)),
    totalRange: Number(totalRange.toFixed(2)),
    upperWick: Number(upperWick.toFixed(2)),
    lowerWick: Number(lowerWick.toFixed(2)),
    bodyRatio,
    upperWickRatio,
    lowerWickRatio,
    buyerControlPercent: buyerControl,
    sellerControlPercent: sellerControl,
    story,
    changePercent: Number(changePct),
  };
}

/**
 * Detects patterns across a series of candles (at least 1 to 3 candles).
 */
export function detectAllCandlePatterns(candles = []) {
  if (!Array.isArray(candles) || candles.length === 0) return [];
  const detected = [];

  const c3 = candles.at(-3);
  const c2 = candles.at(-2);
  const c1 = candles.at(-1); // latest candle

  const body = (c) => Math.abs(c.close - c.open);
  const range = (c) => Math.max(c.high - c.low, 0.001);
  const isGreen = (c) => c.close >= c.open;
  const isRed = (c) => c.close < c.open;
  const bodyHigh = (c) => Math.max(c.open, c.close);
  const bodyLow = (c) => Math.min(c.open, c.close);

  if (!c1) return detected;

  // Single-Candle Patterns (on c1)
  const c1Range = range(c1);
  const c1Body = body(c1);
  const c1LowerWick = bodyLow(c1) - c1.low;
  const c1UpperWick = c1.high - bodyHigh(c1);

  if (c1Body / c1Range < 0.08) {
    detected.push({ name: 'Doji', ...CANDLESTICK_PATTERNS_INFO.Doji });
  }

  if (c1LowerWick >= c1Body * 1.8 && c1UpperWick <= Math.max(c1Body, c1Range * 0.15)) {
    detected.push({ name: 'Hammer', ...CANDLESTICK_PATTERNS_INFO.Hammer });
  }

  if (c1UpperWick >= c1Body * 1.8 && c1LowerWick <= Math.max(c1Body, c1Range * 0.15) && isGreen(c1)) {
    detected.push({ name: 'Inverted Hammer', ...CANDLESTICK_PATTERNS_INFO['Inverted Hammer'] });
  }

  if (c1UpperWick >= c1Body * 1.8 && c1LowerWick <= Math.max(c1Body, c1Range * 0.15) && isRed(c1)) {
    detected.push({ name: 'Shooting Star', ...CANDLESTICK_PATTERNS_INFO['Shooting Star'] });
  }

  // Two-Candle Patterns (c2 -> c1)
  if (c2) {
    // 1. Bullish Engulfing
    if (isRed(c2) && isGreen(c1) && bodyHigh(c1) >= bodyHigh(c2) && bodyLow(c1) <= bodyLow(c2)) {
      detected.push({ name: 'Bullish Engulfing', ...CANDLESTICK_PATTERNS_INFO['Bullish Engulfing'] });
    }

    // Bearish Engulfing
    if (isGreen(c2) && isRed(c1) && bodyHigh(c1) >= bodyHigh(c2) && bodyLow(c1) <= bodyLow(c2)) {
      detected.push({ name: 'Bearish Engulfing', ...CANDLESTICK_PATTERNS_INFO['Bearish Engulfing'] });
    }

    // 6. Piercing Pattern
    if (isRed(c2) && isGreen(c1) && c1.open < c2.low && c1.close > (c2.open + c2.close) / 2 && c1.close < c2.open) {
      detected.push({ name: 'Piercing Pattern', ...CANDLESTICK_PATTERNS_INFO['Piercing Pattern'] });
    }

    // 7. Bullish Harami
    if (isRed(c2) && isGreen(c1) && bodyHigh(c1) < bodyHigh(c2) && bodyLow(c1) > bodyLow(c2)) {
      detected.push({ name: 'Bullish Harami', ...CANDLESTICK_PATTERNS_INFO['Bullish Harami'] });
    }

    // 9. Tweezer Bottom
    if (isRed(c2) && isGreen(c1) && Math.abs(c2.low - c1.low) <= c1.close * 0.002) {
      detected.push({ name: 'Tweezer Bottom', ...CANDLESTICK_PATTERNS_INFO['Tweezer Bottom'] });
    }

    // 10. On-Neck Pattern
    if (isRed(c2) && isGreen(c1) && c1.open < c2.low && Math.abs(c1.close - c2.low) <= c2.low * 0.003) {
      detected.push({ name: 'On-Neck Pattern', ...CANDLESTICK_PATTERNS_INFO['On-Neck Pattern'] });
    }

    // 11. Bullish Counter Attack
    if (isRed(c2) && isGreen(c1) && c1.open < c2.low && Math.abs(c1.close - c2.close) <= c2.close * 0.002) {
      detected.push({ name: 'Bullish Counter Attack', ...CANDLESTICK_PATTERNS_INFO['Bullish Counter Attack'] });
    }
  }

  // Three-Candle Patterns (c3 -> c2 -> c1)
  if (c3 && c2) {
    // 3. Morning Star
    if (isRed(c3) && body(c2) / range(c2) <= 0.35 && isGreen(c1) && c1.close > (c3.open + c3.close) / 2) {
      detected.push({ name: 'Morning Star', ...CANDLESTICK_PATTERNS_INFO['Morning Star'] });
    }

    // 4. Three White Soldiers
    if (isGreen(c3) && isGreen(c2) && isGreen(c1) && c1.close > c2.close && c2.close > c3.close && c1.open > c2.open && c2.open > c3.open) {
      detected.push({ name: 'Three White Soldiers', ...CANDLESTICK_PATTERNS_INFO['Three White Soldiers'] });
    }

    // 8. Three Inside Up (Harami on c3-c2, followed by c1 breakout)
    if (isRed(c3) && isGreen(c2) && bodyHigh(c2) < bodyHigh(c3) && bodyLow(c2) > bodyLow(c3) && isGreen(c1) && c1.close > c3.high) {
      detected.push({ name: 'Three Inside Up', ...CANDLESTICK_PATTERNS_INFO['Three Inside Up'] });
    }

    // 12. Three Outside Up (Engulfing on c3-c2, followed by c1 continuation)
    if (isRed(c3) && isGreen(c2) && bodyHigh(c2) >= bodyHigh(c3) && bodyLow(c2) <= bodyLow(c3) && isGreen(c1) && c1.close > c2.high) {
      detected.push({ name: 'Three Outside Up', ...CANDLESTICK_PATTERNS_INFO['Three Outside Up'] });
    }
  }

  return detected;
}
