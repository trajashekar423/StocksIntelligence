'use client';

import { getNSEDateTime } from '../../utils/nseTime.js';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  fetchMostActive,
  fetchStockQuote,
  fetchNseGetQuote,
  fetchChartDataByIndex,
  fetchLargeDeals,
  fetchTopTen as fetchTopTenStocks,
  fetchUniverse,
  fetchScannerMarketData,
} from '../../services/stocksService';

import { filterStocksByGroup } from './stockFilters';
import StatusChip from './StatusChip';
import TopIntraday from './topintraday';
import MarketIntelligenceTable from './MarketIntelligenceTable';
import {
  MARKET_INTELLIGENCE_DEAL_MODES,
  STOCK_TAB_HELP,
  buildMarketIntelligence,
  normalizeDealRows,
} from './marketIntelligence';
import { buildMyStockSignal } from './myStockSignals';
import {
  buildTomorrowScanner,
  renderTomorrowSetup,
} from './tomorrowScanner';
import MomentumScanner from './MomentumScanner.jsx';

const UNAVAILABLE = 'Unavailable';

const MY_STOCKS = [
  'CUPID',
  'MOREPENLAB',
  'MILKYMIST',
  'ATHERENERG',
];

/* ============================================================
   BASIC HELPERS
   ============================================================ */

function toNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(
    String(value).replace(/,/g, '')
  );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatMoney(value) {
  const amount = toNumber(value);

  if (!amount) {
    return UNAVAILABLE;
  }

  return `₹${amount.toFixed(2)}`;
}

function formatPercent(value) {
  const pct = toNumber(value);

  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}

function formatNumber(value, digits = 2) {
  const num = toNumber(value);

  if (!num) {
    return UNAVAILABLE;
  }

  return num.toLocaleString('en-IN', {
    maximumFractionDigits: digits,
  });
}

function getRows(data) {
  if (!data || typeof data !== 'object') {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (Array.isArray(data.payload)) {
    return data.payload;
  }

  return [];
}

function getSymbol(row) {
  return (
    row?.symbol ||
    row?.Symbol ||
    row?.SYMBOL ||
    row?.identifier ||
    row?.trading_symbol ||
    ''
  );
}

function getPrice(row) {
  return toNumber(
    row?.price ??
      row?.lastPrice ??
      row?.ltp ??
      row?.last_price ??
      row?.close ??
      row?.close_price
  );
}

function getChangePercent(row) {
  return toNumber(
    row?.changePercent ??
      row?.pChange ??
      row?.perChange ??
      row?.net_price ??
      row?.change_percentage
  );
}

function getVolume(row) {
  return toNumber(
    row?.volume ??
      row?.totalTradedVolume ??
      row?.quantityTraded ??
      row?.trade_quantity ??
      row?.tradedQuantity
  );
}

function getTurnover(row) {
  return toNumber(
    row?.turnover ??
      row?.totalTradedValue ??
      row?.value
  );
}

/* ============================================================
   INDICATORS
   ============================================================ */

function calculateVWAP(candles) {
  if (!Array.isArray(candles) || !candles.length) {
    return null;
  }

  let cumulativePV = 0;
  let cumulativeVolume = 0;

  for (const candle of candles) {
    const high = toNumber(candle.high);
    const low = toNumber(candle.low);
    const close = toNumber(candle.close);
    const volume = toNumber(candle.volume);

    if (
      !high ||
      !low ||
      !close ||
      !volume
    ) {
      continue;
    }

    const typicalPrice =
      (high + low + close) / 3;

    cumulativePV +=
      typicalPrice * volume;

    cumulativeVolume += volume;
  }

  if (!cumulativeVolume) {
    return null;
  }

  return cumulativePV / cumulativeVolume;
}

function calculateAverageVolume(
  candles,
  periods = 20
) {
  if (!Array.isArray(candles)) {
    return null;
  }

  const volumes = candles
    .slice(-periods)
    .map((candle) =>
      toNumber(candle.volume)
    )
    .filter((volume) => volume > 0);

  if (!volumes.length) {
    return null;
  }

  return (
    volumes.reduce(
      (sum, volume) => sum + volume,
      0
    ) / volumes.length
  );
}

function calculateEMA(values, period) {
  if (
    !Array.isArray(values) ||
    values.length < period
  ) {
    return null;
  }

  const multiplier =
    2 / (period + 1);

  let ema =
    values
      .slice(0, period)
      .reduce(
        (sum, value) => sum + value,
        0
      ) / period;

  for (
    let index = period;
    index < values.length;
    index += 1
  ) {
    ema =
      (values[index] - ema) *
        multiplier +
      ema;
  }

  return ema;
}

function calculateRSI(
  closes,
  period = 14
) {
  if (
    !Array.isArray(closes) ||
    closes.length <= period
  ) {
    return null;
  }

  let gains = 0;
  let losses = 0;

  for (
    let index = 1;
    index <= period;
    index += 1
  ) {
    const change =
      closes[index] -
      closes[index - 1];

    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let averageGain =
    gains / period;

  let averageLoss =
    losses / period;

  for (
    let index = period + 1;
    index < closes.length;
    index += 1
  ) {
    const change =
      closes[index] -
      closes[index - 1];

    const gain =
      Math.max(change, 0);

    const loss =
      Math.max(-change, 0);

    averageGain =
      ((averageGain *
        (period - 1)) +
        gain) /
      period;

    averageLoss =
      ((averageLoss *
        (period - 1)) +
        loss) /
      period;
  }

  if (averageLoss === 0) {
    return 100;
  }

  const rs =
    averageGain / averageLoss;

  return (
    100 -
    100 / (1 + rs)
  );
}

function calculateSupportResistance(
  candles
) {
  if (
    !Array.isArray(candles) ||
    !candles.length
  ) {
    return {
      support: null,
      resistance: null,
    };
  }

  const recent = candles.slice(-20);

  const highs = recent
    .map((candle) =>
      toNumber(candle.high)
    )
    .filter(Boolean);

  const lows = recent
    .map((candle) =>
      toNumber(candle.low)
    )
    .filter(Boolean);

  return {
    support: lows.length
      ? Math.min(...lows)
      : null,

    resistance: highs.length
      ? Math.max(...highs)
      : null,
  };
}

function calculatePreviousDayLevels(
  previousDayCandles
) {
  if (
    !Array.isArray(previousDayCandles) ||
    !previousDayCandles.length
  ) {
    return {
      previousDayHigh: null,
      previousDayLow: null,
    };
  }

  const highs =
    previousDayCandles
      .map((candle) =>
        toNumber(candle.high)
      )
      .filter(Boolean);

  const lows =
    previousDayCandles
      .map((candle) =>
        toNumber(candle.low)
      )
      .filter(Boolean);

  return {
    previousDayHigh:
      highs.length
        ? Math.max(...highs)
        : null,

    previousDayLow:
      lows.length
        ? Math.min(...lows)
        : null,
  };
}

/* ============================================================
   MARKET CONFIRMATION
   ============================================================ */

function getMarketConfirmation(
  universe
) {
  const changedRows =
    universe.filter(
      (row) =>
        getChangePercent(row) !== 0
    );

  const advancing =
    changedRows.filter(
      (row) =>
        getChangePercent(row) > 0
    ).length;

  const declining =
    changedRows.filter(
      (row) =>
        getChangePercent(row) < 0
    ).length;

  const breadth =
    changedRows.length
      ? advancing /
        changedRows.length
      : 0;

  if (breadth >= 0.65) {
    return {
      label: 'Bullish breadth',
      score: 5,
      advancing,
      declining,
    };
  }

  if (breadth >= 0.55) {
    return {
      label: 'Mild bullish breadth',
      score: 4,
      advancing,
      declining,
    };
  }

  if (breadth >= 0.45) {
    return {
      label: 'Neutral breadth',
      score: 2,
      advancing,
      declining,
    };
  }

  if (changedRows.length) {
    return {
      label: 'Weak breadth',
      score: 0,
      advancing,
      declining,
    };
  }

  return {
    label: 'Market confirmation unavailable',
    score: 0,
    advancing,
    declining,
  };
}

/* ============================================================
   SIGNAL
   ============================================================ */

function getSignal(score) {
  if (score >= 90) {
    return 'Strong Bullish';
  }

  if (score >= 80) {
    return 'Bullish';
  }

  if (score >= 70) {
    return 'Watchlist';
  }

  return 'Ignore';
}

/* ============================================================
   NORMALIZE MARKET DATA
   ============================================================ */

function normalizeMarketRow(row) {
  const symbol =
    getSymbol(row);

  const price =
    getPrice(row);

  const volume =
    getVolume(row);

  const changePercent =
    getChangePercent(row);

  const candles =
    Array.isArray(row?.candles)
      ? row.candles
      : [];

  const previousDayCandles =
    Array.isArray(
      row?.previousDayCandles
    )
      ? row.previousDayCandles
      : [];

  const closes =
    candles
      .map((candle) =>
        toNumber(
          candle.close
        )
      )
      .filter(Boolean);

  const vwap =
    row?.vwap ??
    calculateVWAP(candles);

  const averageVolume =
    row?.averageVolume ??
    calculateAverageVolume(
      row?.dailyCandles ||
        candles,
      20
    );

  const volumeRatio =
    row?.volumeRatio ??
    (
      averageVolume > 0
        ? volume /
          averageVolume
        : null
    );

  const ema9 =
    row?.ema9 ??
    calculateEMA(
      closes,
      9
    );

  const ema20 =
    row?.ema20 ??
    calculateEMA(
      closes,
      20
    );

  const ema50 =
    row?.ema50 ??
    calculateEMA(
      closes,
      50
    );

  const rsi =
    row?.rsi ??
    calculateRSI(
      closes,
      14
    );

  const levels =
    calculateSupportResistance(
      candles
    );

  const previousLevels =
    calculatePreviousDayLevels(
      previousDayCandles
    );

  const previousDayHigh =
    toNumber(
      row?.previousDayHigh ??
        previousLevels.previousDayHigh
    );

  const previousDayLow =
    toNumber(
      row?.previousDayLow ??
        previousLevels.previousDayLow
    );

  const support =
    toNumber(
      row?.support ??
        levels.support
    );

  const resistance =
    toNumber(
      row?.resistance ??
        levels.resistance
    );

  const open =
    toNumber(
      row?.open ??
        row?.open_price
    );

  const dayHigh =
    toNumber(
      row?.dayHigh ??
        row?.high_price ??
        row?.high
    );

  const dayLow =
    toNumber(
      row?.dayLow ??
        row?.low_price ??
        row?.low
      );

  const totalBuyQty =
    toNumber(
      row?.totalBuyQty ??
        row?.totalBuyQuantity ??
        row?.buyQty
    );

  const totalSellQty =
    toNumber(
      row?.totalSellQty ??
        row?.totalSellQuantity ??
        row?.sellQty
    );

  const bidQty =
    toNumber(
      row?.bidQty ??
        row?.marketDepth?.bids?.[0]?.qty
    );

  const askQty =
    toNumber(
      row?.askQty ??
        row?.marketDepth?.asks?.[0]?.qty
    );

  return {
    ...row,

    symbol,

    price,

    previousClose:
      toNumber(
        row?.previousClose ??
          row?.prev_price ??
          row?.previous_close
      ),

    open,

    dayHigh,

    dayLow,

    changePercent,

    volume,

    averageVolume,

    volumeRatio,

    vwap,

    previousDayHigh,

    previousDayLow,

    ema9,

    ema20,

    ema50,

    rsi,

    support,

    resistance,

    companyName:
      row?.companyName ||
      row?.securityInfo?.companyName ||
      symbol,

    totalBuyQty,

    totalSellQty,

    bidQty,

    askQty,

    marketDepth:
      row?.marketDepth || null,
  };
}

/* ============================================================
   SCORING
   ============================================================ */

function buildScanner(
  marketRows,
  capital,
  universeList = []
) {
  const normalizedAll =
    marketRows
      .map(normalizeMarketRow)
      .filter((row) => row.symbol);

  // Deduplicate by symbol (preserve first occurrence)
  const seen = new Set();
  const normalized = normalizedAll.filter((r) => {
    const sym = String(r.symbol).toUpperCase();
    if (seen.has(sym)) return false;
    seen.add(sym);
    return true;
  });

  const marketConfirmation =
    getMarketConfirmation(
      normalized
    );

  const marketScore =
    marketConfirmation.score;

  const scanned =
    normalized.map((row) => {
      const {
        symbol,
        price,
        previousClose,
        open,
        dayHigh,
        dayLow,
        changePercent,
        volume,
        averageVolume,
        volumeRatio,
        vwap,
        previousDayHigh,
        previousDayLow,
        ema9,
        ema20,
        ema50,
        rsi,
        support,
        resistance,
        totalBuyQty,
        totalSellQty,
        bidQty,
        askQty,
      } = row;

      const aboveVwap =
        vwap !== null &&
        price > vwap;

      const abovePDH =
        previousDayHigh > 0 &&
        price > previousDayHigh;

      const nearPDH =
        previousDayHigh > 0 &&
        price >=
          previousDayHigh *
            0.995;

      const bullishEMA =
        ema9 !== null &&
        ema20 !== null &&
        price > ema9 &&
        ema9 > ema20;

      const buyRatio =
        totalSellQty > 0
          ? totalBuyQty / totalSellQty
          : totalBuyQty > 0
            ? Infinity
            : 0;

      const orderBookBias =
        buyRatio > 2
          ? 'Strong Buyers'
          : buyRatio < 0.8
            ? 'Strong Sellers'
            : 'Balanced';

      const bullishRSI =
        rsi !== null &&
        rsi >= 55 &&
        rsi <= 75;

      const momentum =
        changePercent >= 2 &&
        changePercent <= 12;

      const strongVolume =
        volumeRatio !== null &&
        volumeRatio >= 1.5;

      const breakoutConfirmed =
        abovePDH &&
        aboveVwap &&
        strongVolume;

      const bullishTrend =
        price > open &&
        bullishEMA;

      /* --------------------------------------------------------
         SCORE
         -------------------------------------------------------- */

      let score = 0;

      /* Momentum - 20 */
      if (momentum) {
        score += 20;
      } else if (
        changePercent > 0
      ) {
        score += 10;
      }

      /* Volume - 20 */
      if (
        volumeRatio !== null
      ) {
        if (
          volumeRatio >= 2
        ) {
          score += 20;
        } else if (
          volumeRatio >= 1.5
        ) {
          score += 16;
        } else if (
          volumeRatio >= 1.2
        ) {
          score += 10;
        }
      }

      /* VWAP - 15 */
      if (aboveVwap) {
        score += 15;
      }

      /* Breakout - 15 */
      if (breakoutConfirmed) {
        score += 15;
      } else if (nearPDH) {
        score += 8;
      }

      /* Trend - 10 */
      if (bullishTrend) {
        score += 10;
      } else if (
        price > open
      ) {
        score += 5;
      }

      /* Liquidity - 10 */
      if (
        volume >= 100000
      ) {
        score += 10;
      } else if (
        volume >= 50000
      ) {
        score += 5;
      }

      /* RSI confirmation */
      if (bullishRSI) {
        score += 2;
      }

      /* Market - 5 */
      if (
        marketScore >= 4
      ) {
        score += 5;
      } else if (
        marketScore >= 3
      ) {
        score += 3;
      }

      /* --------------------------------------------------------
         PENALTIES
         -------------------------------------------------------- */

      if (
        changePercent >=
        19.5
      ) {
        score -= 15;
      }

      if (
        volumeRatio !== null &&
        volumeRatio < 0.8
      ) {
        score -= 10;
      }

      if (
        rsi !== null &&
        rsi > 80
      ) {
        score -= 8;
      }

      if (
        price <= vwap &&
        vwap !== null
      ) {
        score -= 5;
      }

      score = Math.round(
        Math.max(
          0,
          Math.min(100, score)
        )
      );

      /* --------------------------------------------------------
         ENTRY / SL / TARGET
         -------------------------------------------------------- */

      const breakoutLevel =
        previousDayHigh ||
        resistance ||
        price;

      const entryLow =
        price >=
        breakoutLevel
          ? price
          : breakoutLevel;

      const entryHigh =
        entryLow * 1.003;

      const stopBase =
        support ||
        previousDayLow ||
        dayLow ||
        price * 0.985;

      const stopLoss =
        Math.min(
          stopBase,
          entryLow * 0.99
        );

      const riskPerShare =
        Math.max(
          entryLow -
            stopLoss,
          0
        );

      const maxRiskAmount =
        toNumber(capital) *
        0.01;

      const positionSize =
        riskPerShare > 0
          ? Math.floor(
              maxRiskAmount /
                riskPerShare
            )
          : 0;

      const target1 =
        entryLow +
        riskPerShare * 1.5;

      const target2 =
        entryLow +
        riskPerShare * 2.5;

      const target3 =
        entryLow +
        riskPerShare * 3.5;

      const rr =
        riskPerShare > 0
          ? (
              (target1 -
                entryLow) /
              riskPerShare
            ).toFixed(2)
          : UNAVAILABLE;

      const risk =
        score >= 90 && volumeRatio >= 2 && aboveVwap
          ? 'Low'
          : score >= 75 && volumeRatio >= 1.5
            ? 'Medium'
            : score >= 60
              ? 'High'
              : 'Very High';

      const confidence =
        Math.max(
          0,
          Math.min(
            100,
            Math.round(
              score +
                (breakoutConfirmed ? 5 : 0) +
                (orderBookBias === 'Strong Buyers' ? 5 : 0)
            )
          )
        );

      /* --------------------------------------------------------
         TRADE SIGNAL
         -------------------------------------------------------- */

      let tradeSignal = '';

      if (
        score >= 80 &&
        price > previousClose &&
        aboveVwap
      ) {
        tradeSignal = 'Buy';
      }

      /* --------------------------------------------------------
         BREAKOUT
         -------------------------------------------------------- */

      let breakoutStatus =
        'NO BREAKOUT';

      if (
        breakoutConfirmed
      ) {
        breakoutStatus =
          'BREAKOUT CONFIRMED';
      } else if (
        nearPDH
      ) {
        breakoutStatus =
          'BREAKOUT WATCH';
      }

      /* --------------------------------------------------------
         AVOID
         -------------------------------------------------------- */

      const avoidReasons = [];

      if (!price) {
        avoidReasons.push(
          'No price'
        );
      }

      if (!volume) {
        avoidReasons.push(
          'No volume'
        );
      }

      if (
        changePercent <= 0
      ) {
        avoidReasons.push(
          'Weak momentum'
        );
      }

      if (
        vwap !== null &&
        price <= vwap
      ) {
        avoidReasons.push(
          'Below VWAP'
        );
      }

      if (
        volumeRatio !== null &&
        volumeRatio < 0.8
      ) {
        avoidReasons.push(
          'Low volume'
        );
      }

      if (
        volume < 50000
      ) {
        avoidReasons.push(
          'Poor liquidity'
        );
      }

      if (
        rsi !== null &&
        rsi > 80
      ) {
        avoidReasons.push(
          'Overbought'
        );
      }

      if (
        nearPDH &&
        !aboveVwap
      ) {
        avoidReasons.push(
          'False breakout risk'
        );
      }

      return {
        ...row,

        score,

        signal:
          getSignal(score),

        tradeSignal,

        breakoutStatus,

        entryLow,

        entryHigh,

        stopLoss,

        target1,

        target2,

        target3,

        rr,

        riskPerShare,

        maxRiskAmount,

        positionSize,

        avoidReasons,

        aboveVwap,

        abovePDH,

        nearPDH,

        breakoutConfirmed,

        bullishEMA,

        ema50,

        buyRatio,

        totalBuyQty,

        totalSellQty,

        bidQty,

        askQty,

        orderBookBias,

        risk,

        confidence,

        bullishRSI,

        bullishTrend,
      };
    });

  /* ----------------------------------------------------------
     VALID STOCKS
     ---------------------------------------------------------- */

  const validScanned =
    scanned.filter(
      (row) => {
        if (
          !row.price ||
          !row.volume
        ) {
          return false;
        }

        if (
          row.changePercent >=
            19.5 ||
          row.changePercent <=
            -19.5
        ) {
          return false;
        }

        if (
          row.volume < 1000
        ) {
          return false;
        }

        return true;
      }
    );

  /* ----------------------------------------------------------
     TOP 10
     ---------------------------------------------------------- */

  const bullish =
    validScanned
      .filter(
        (row) =>
          row.score >= 70
      )
      .sort(
        (a, b) =>
          b.score -
            a.score ||
          (b.volume || 0) -
            (a.volume || 0) ||
          b.changePercent -
            a.changePercent
      )
      .slice(0, 10);

  /* ----------------------------------------------------------
     AVOID
     ---------------------------------------------------------- */

  const avoid =
    scanned
      .filter(
        (row) =>
          row.avoidReasons.length
      )
      .sort(
        (a, b) =>
          b.avoidReasons.length -
            a.avoidReasons.length ||
          a.score -
            b.score
      )
      .slice(0, 10);

  return {
    bullish,

    avoid,

    scanned,

    marketConfirmation,

    marketScore,

    universeCount:
      universeList.length ||
      scanned.length,

    validCount:
      validScanned.length,

    limitedData: false,
  };
}

/* ============================================================
   SIGNAL BADGE
   ============================================================ */

function SignalBadge({
  signal,
}) {
  const className =
    signal === 'Strong Bullish'
      ? 'text-bg-success'
      : signal === 'Bullish'
        ? 'text-bg-primary'
        : signal === 'Watchlist'
          ? 'text-bg-warning'
          : 'text-bg-secondary';

  return (
    <span
      className={`badge ${className}`}
    >
      {signal}
    </span>
  );
}

/* ============================================================
   SCANNER TABLE
   ============================================================ */

function ScannerTable({
  rows,
}) {
  if (!rows.length) {
    return (
      <div className="alert alert-warning">
        No bullish intraday stocks
        match the scanner.
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped table-bordered table-sm align-middle">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Symbol</th>
            <th className="text-end">
              Price
            </th>
            <th className="text-end">
              Change %
            </th>
            <th className="text-end">
              Volume Ratio
            </th>
            <th className="text-end">
              VWAP
            </th>
            <th className="text-end">
              PDH
            </th>
            <th className="text-end">
              RSI
            </th>
            <th className="text-end">
              EMA 20
            </th>
            <th className="text-end">
              Score
            </th>
            <th>
              Signal
            </th>
            <th>
              Trade
            </th>
            <th>
              Breakout
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map(
            (row, index) => (
              <tr
                key={`${row.symbol || row.Symbol || 'r'}-${index}`}
              >
                <td>
                  {index + 1}
                </td>

                <td>
                  <strong>
                    {row.symbol}
                  </strong>

                  <div className="small text-muted">
                    {
                      row.companyName
                    }
                  </div>
                </td>

                <td className="text-end">
                  {formatMoney(
                    row.price
                  )}
                </td>

                <td className="text-end">
                  {formatPercent(
                    row.changePercent
                  )}
                </td>

                <td className="text-end">
                  {typeof row.volumeRatio ===
                  'number'
                    ? `${row.volumeRatio.toFixed(
                        2
                      )}x`
                    : UNAVAILABLE}
                </td>

                <td className="text-end">
                  {formatMoney(
                    row.vwap
                  )}
                </td>

                <td className="text-end">
                  {formatMoney(
                    row.previousDayHigh
                  )}
                </td>

                <td className="text-end">
                  {row.rsi
                    ? row.rsi.toFixed(
                        1
                      )
                    : UNAVAILABLE}
                </td>

                <td className="text-end">
                  {formatMoney(
                    row.ema20
                  )}
                </td>

                <td className="text-end">
                  <strong>
                    {row.score}
                  </strong>
                </td>

                <td>
                  <SignalBadge
                    signal={
                      row.signal
                    }
                  />
                </td>

                <td>
                  {row.tradeSignal ? (
                    <span
                      className={`badge ${
                        row.tradeSignal ===
                        'Buy'
                          ? 'text-bg-success'
                          : 'text-bg-danger'
                      }`}
                    >
                      {
                        row.tradeSignal
                      }
                    </span>
                  ) : null}
                </td>

                <td>
                  {
                    row.breakoutStatus
                  }
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   ENTRY SETUPS
   ============================================================ */

function EntrySetups({
  rows,
}) {
  const selected =
    rows.filter(
      (row) =>
        row.score >= 80
    );

  if (!selected.length) {
    return (
      <div className="text-muted">
        No score above 80 yet.
        Wait for stronger
        confirmation.
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-bordered table-sm align-middle">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>
              Entry Zone
            </th>
            <th>
              Stop-loss
            </th>
            <th>
              Target 1
            </th>
            <th>
              Target 2
            </th>
            <th>R/R</th>
            <th>
              Position Size
            </th>
            <th>
              1% Risk
            </th>
          </tr>
        </thead>

        <tbody>
          {selected.map(
            (row, index) => (
              <tr
                key={`${row.symbol || row.Symbol || 'r'}-${index}`}
              >
                <td>
                  <strong>
                    {row.symbol}
                  </strong>
                </td>

                <td>
                  {formatMoney(
                    row.entryLow
                  )}{' '}
                  -{' '}
                  {formatMoney(
                    row.entryHigh
                  )}
                </td>

                <td>
                  {formatMoney(
                    row.stopLoss
                  )}
                </td>

                <td>
                  {formatMoney(
                    row.target1
                  )}
                </td>

                <td>
                  {formatMoney(
                    row.target2
                  )}
                </td>

                <td>
                  {row.rr}:1
                </td>

                <td>
                  {formatNumber(
                    row.positionSize,
                    0
                  )}{' '}
                  shares
                </td>

                <td>
                  {formatMoney(
                    row.maxRiskAmount
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   AVOID TABLE
   ============================================================ */

function AvoidTable({
  rows,
}) {
  if (!rows.length) {
    return (
      <div className="text-muted">
        No avoid candidates.
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-bordered table-sm align-middle">
        <thead>
          <tr>
            <th>Symbol</th>
            <th className="text-end">
              Price
            </th>
            <th className="text-end">
              Change %
            </th>
            <th className="text-end">
              Volume Ratio
            </th>
            <th>
              Signal
            </th>
            <th>
              Reasons
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map(
            (row, index) => (
              <tr
                key={`${row.symbol || row.Symbol || 'r'}-${index}`}
              >
                <td>
                  <strong>
                    {row.symbol}
                  </strong>
                </td>

                <td className="text-end">
                  {formatMoney(
                    row.price
                  )}
                </td>

                <td className="text-end">
                  {formatPercent(
                    row.changePercent
                  )}
                </td>

                <td className="text-end">
                  {typeof row.volumeRatio ===
                  'number'
                    ? `${row.volumeRatio.toFixed(
                        2
                      )}x`
                    : UNAVAILABLE}
                </td>

                <td>
                  <SignalBadge
                    signal={
                      row.signal
                    }
                  />
                </td>

                <td>
                  {row.avoidReasons.join(
                    ', '
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   MOST ACTIVE
   ============================================================ */

function MostActiveTable({
  rows,
}) {
  if (!rows.length) {
    return (
      <div className="alert alert-warning">
        No valid intraday
        activity data.
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped table-bordered table-sm align-middle">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Symbol</th>
            <th>Price</th>
            <th>Change %</th>
            <th>Volume</th>
            <th>Volume Ratio</th>
            <th>VWAP</th>
            <th>Score</th>
          </tr>
        </thead>

        <tbody>
          {rows.map(
            (row, index) => (
              <tr
                key={`${row.symbol || row.Symbol || 'r'}-${index}`}
              >
                <td>
                  {index + 1}
                </td>

                <td>
                  <strong>
                    {row.symbol}
                  </strong>
                </td>

                <td>
                  {formatMoney(
                    row.price
                  )}
                </td>

                <td>
                  {formatPercent(
                    row.changePercent
                  )}
                </td>

                <td>
                  {formatNumber(
                    row.volume,
                    0
                  )}
                </td>

                <td>
                  {typeof row.volumeRatio ===
                  'number'
                    ? `${row.volumeRatio.toFixed(
                        2
                      )}x`
                    : UNAVAILABLE}
                </td>

                <td>
                  {formatMoney(
                    row.vwap
                  )}
                </td>

                <td>
                  <strong>
                    {row.score}
                  </strong>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   GENERIC TABLE
   ============================================================ */

function TableView({
  data,
}) {
  const rows =
    getRows(data);

  if (
    typeof data ===
    'string'
  ) {
    return (
      <pre
        className="border rounded p-3 bg-light"
        style={{
          whiteSpace:
            'pre-wrap',
        }}
      >
        {data}
      </pre>
    );
  }

  if (!rows.length) {
    return (
      <div className="text-muted">
        No data
      </div>
    );
  }

  const columns =
    Array.from(
      new Set(
        rows.flatMap(
          (row) =>
            Object.keys(
              row || {}
            )
        )
      )
    );

  return (
    <div className="table-responsive">
      <table className="table table-striped table-bordered table-sm">
        <thead>
          <tr>
            {columns.map(
              (column) => (
                <th
                  key={column}
                >
                  {column}
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody>
          {rows.map(
            (row, index) => (
              <tr
                key={`${row.symbol || row.Symbol || 'r'}-${index}`}
              >
                {columns.map(
                  (column) => (
                    <td
                      key={
                        column
                      }
                    >
                      {String(
                        row?.[
                          column
                        ] ?? ''
                      )}
                    </td>
                  )
                )}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

const LIVE_SCANNER_COLUMNS = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'price', label: 'LTP' },
  { key: 'score', label: 'Score' },
  { key: 'recommendation', label: 'Recommendation' },
  { key: 'entryLow', label: 'Entry' },
  { key: 'stopLoss', label: 'Stop Loss' },
  { key: 'target1', label: 'Target' },
  { key: 'buyRatio', label: 'Buy Ratio' },
  { key: 'volumeRatio', label: 'Volume Spike' },
  { key: 'risk', label: 'Risk' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'badges', label: 'Badges' },
];

const BREAKOUT_COLUMNS = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'price', label: 'LTP' },
  { key: 'breakoutTypes', label: 'Breakout Type' },
  { key: 'score', label: 'Score' },
  { key: 'recommendation', label: 'Recommendation' },
  { key: 'volumeRatio', label: 'Volume' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'badges', label: 'Badges' },
];

const DEAL_COLUMNS = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'company', label: 'Company' },
  { key: 'buyer', label: 'Buyer' },
  { key: 'seller', label: 'Seller' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'price', label: 'Deal Price' },
  { key: 'value', label: 'Deal Value' },
  { key: 'session', label: 'Session' },
  { key: 'time', label: 'Time' },
  { key: 'institutionType', label: 'Institution Type' },
  { key: 'scannerScore', label: 'Scanner Score' },
  { key: 'recommendation', label: 'Recommendation' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'badges', label: 'Badges' },
];

const SHORT_COLUMNS = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'company', label: 'Company' },
  { key: 'shortQuantity', label: 'Short Quantity' },
  { key: 'shortPercent', label: 'Short %' },
  { key: 'action', label: 'Covering/Fresh Shorts' },
  { key: 'scannerScore', label: 'Scanner Score' },
  { key: 'recommendation', label: 'Recommendation' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'badges', label: 'Badges' },
];

const ORDER_BOOK_COLUMNS = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'totalBuyQty', label: 'Buy Qty' },
  { key: 'totalSellQty', label: 'Sell Qty' },
  { key: 'buyRatio', label: 'Buy Ratio' },
  { key: 'bidQty', label: 'Bid Qty' },
  { key: 'askQty', label: 'Ask Qty' },
  { key: 'orderBookBias', label: 'Market Depth' },
  { key: 'score', label: 'Score' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'badges', label: 'Badges' },
];

const ALERT_COLUMNS = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'alert', label: 'Alert' },
  { key: 'detail', label: 'Detail' },
  { key: 'score', label: 'Score' },
];

/* ============================================================
   COMPONENT
   ============================================================ */

export default function Stocks() {
  const [
    marketData,
    setMarketData,
  ] = useState([]);

  const [
    topTen,
    setTopTen,
  ] = useState([]);

  const [
    mostActive,
    setMostActive,
  ] = useState([]);

  const [
    myStocks,
    setMyStocks,
  ] = useState([]);

  const [
    universeList,
    setUniverseList,
  ] = useState([]);

  const [
    universeStatus,
    setUniverseStatus,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);

  const [
    live,
    setLive,
  ] = useState(true);

  const [
    intervalMs,
    setIntervalMs,
  ] = useState(5000);

  const [
    capital,
    setCapital,
  ] = useState(100000);

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(null);

  const [
    activeTab,
    setActiveTab,
  ] = useState('dashboard');

  const [
    marketIntelligenceData,
    setMarketIntelligenceData,
  ] = useState({
    blockDeals: [],
    bulkDeals: [],
    shortDeals: [],
    insider: [],
    shareholding: [],
    announcements: [],
  });

  const [
    marketIntelligenceStatus,
    setMarketIntelligenceStatus,
  ] = useState({});

  const [
    selectedStock,
    setSelectedStock,
  ] = useState(null);

  const [
    topStatus,
    setTopStatus,
  ] = useState(null);

  const [
    mostStatus,
    setMostStatus,
  ] = useState(null);

  const intervalRef =
    useRef(null);

  /* ==========================================================
     SCANNER
     ========================================================== */

  const scanner =
    useMemo(
      () =>
        buildScanner(
          marketData,
          capital,
          universeList
        ),
      [
        marketData,
        capital,
        universeList,
      ]
    );

  const marketIntelligence =
    useMemo(
      () =>
        buildMarketIntelligence(
          scanner.scanned || [],
          marketIntelligenceData,
          scanner.marketConfirmation,
          MY_STOCKS
        ),
      [
        scanner.scanned,
        scanner.marketConfirmation,
        marketIntelligenceData,
      ]
    );

  /* ==========================================================
     TOMORROW
     ========================================================== */

  const tomorrowScanner =
    useMemo(
      () =>
        buildTomorrowScanner(
          scanner.scanned || [],
          {
            marketBullish:
              scanner
                .marketConfirmation
                ?.score >= 3,

            marketSummary:
              scanner
                .marketConfirmation
                ?.label ||
              'N/A',

            live,
          }
        ),
      [
        scanner.scanned,
        scanner.marketConfirmation,
        live,
      ]
    );

  const momentumIndustryScoreMap = useMemo(() => {
    const map = new Map();
    scanner.scanned.forEach((row) => {
      const ind = row.industry || row.sector || 'Unclassified';
      if (!map.has(ind)) map.set(ind, row.score || 45);
    });
    return map;
  }, [scanner.scanned]);

  /* ==========================================================
     MOMENTUM SCANNER CANDIDATE PRE-FILTER (Stage 2)
     ----------------------------------------------------------
     The NSE universe is ~1800+ equities. Fetching intraday
     candles for every universe symbol on every refresh is slow
     and risks NSE rate limiting. Apply a cheap, symbol-agnostic
     liquidity filter BEFORE the candle-fetch stage, mirroring:
       ALL UNIVERSE -> CHEAP FILTER -> CANDIDATES -> CANDLES
     No symbol is special-cased here — the same rule runs for
     every row, so any qualifying universe stock can become a
     candidate (not just NSE Top Ten / Most Active names).
     ========================================================== */

  const momentumCandidateRows = useMemo(() => {
    const MAX_CANDIDATES = 300;
    const MIN_PRICE = 2;
    const MIN_TRADED_VALUE = 500000; // ~₹5L notional traded value floor

    const candidates = (scanner.scanned || []).filter((row) => {
      const price = toNumber(row.price);
      const volume = toNumber(row.volume);
      if (!price || price < MIN_PRICE || !volume) return false;
      return price * volume >= MIN_TRADED_VALUE;
    });

    return candidates
      .sort((a, b) => (toNumber(b.price) * toNumber(b.volume)) - (toNumber(a.price) * toNumber(a.volume)))
      .slice(0, MAX_CANDIDATES);
  }, [scanner.scanned]);

  /* ==========================================================
     SEARCH
     ========================================================== */

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const [
    lookupResult,
    setLookupResult,
  ] = useState(null);

  const [cupidChart, setCupidChart] = useState(null);
  const [cupidLoading, setCupidLoading] = useState(false);
  const [cupidError, setCupidError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCupid() {
      if (activeTab !== 'cupid') return;
      setCupidLoading(true);
      setCupidError(null);
      try {
        const res = await fetchChartDataByIndex('EQN:CUPID');
        if (cancelled) return;
        if (!res.ok) throw new Error(res.error || 'Failed to fetch chart data');
        setCupidChart(res.data);
      } catch (err) {
        if (!cancelled) setCupidError(err.message || String(err));
      } finally {
        if (!cancelled) setCupidLoading(false);
      }
    }

    loadCupid();
    return () => { cancelled = true; };
  }, [activeTab]);

  useEffect(() => {
    const tabModes = {
      'block-deals': ['blockDeals'],
      'bulk-deals': ['bulkDeals'],
      'short-deals': ['shortDeals'],
      institutional: ['blockDeals', 'bulkDeals', 'shortDeals'],
      dashboard: ['blockDeals', 'bulkDeals', 'shortDeals'],
      scanner: ['blockDeals', 'bulkDeals', 'shortDeals'],
    };
    const modeByKey = {
      blockDeals: MARKET_INTELLIGENCE_DEAL_MODES.block,
      bulkDeals: MARKET_INTELLIGENCE_DEAL_MODES.bulk,
      shortDeals: MARKET_INTELLIGENCE_DEAL_MODES.short,
    };
    const keys = tabModes[activeTab] || [];
    if (!keys.length) return undefined;

    let cancelled = false;

    async function loadMarketIntelligence() {
      setMarketIntelligenceStatus((current) => ({
        ...current,
        loading: true,
        error: null,
      }));

      const entries = await Promise.all(
        keys.map(async (key) => {
          const response = await fetchLargeDeals(modeByKey[key]);
          return [
            key,
            response?.ok
              ? normalizeDealRows(response.data, modeByKey[key])
              : [],
            response,
          ];
        })
      );

      if (cancelled) return;

      setMarketIntelligenceData((current) => {
        const next = { ...current };
        for (const [key, rows] of entries) {
          next[key] = rows;
        }
        return next;
      });

      setMarketIntelligenceStatus({
        loading: false,
        error: entries.find(([, , response]) => !response?.ok)?.[2]?.error || null,
      });
    }

    loadMarketIntelligence();
    const timer = live ? setInterval(loadMarketIntelligence, 5000) : null;

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [activeTab, live]);

  function handleSearch(
    event
  ) {
    event?.preventDefault?.();

    const query =
      String(
        searchQuery || ''
      )
        .trim()
        .toUpperCase();

    if (!query) {
      setLookupResult(
        null
      );
      return;
    }

    const matches =
      scanner.scanned.filter(
        (row) => {
          const symbol =
            String(
              row.symbol ||
                ''
            ).toUpperCase();

          const company =
            String(
              row.companyName ||
                ''
            ).toUpperCase();

          return (
            symbol ===
              query ||
            symbol.includes(
              query
            ) ||
            company.includes(
              query
            )
          );
        }
      );

    setLookupResult(
      matches.length
        ? matches
        : null
    );
  }

  /* ==========================================================
     REFRESH
     ========================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function refresh() {
      if (cancelled) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [
          topRes,
          mostRes,
          uniRes,
          scannerRes,
          ...myStockRes
        ] =
          await Promise.all([
            fetchTopTenStocks(),
            fetchMostActive(),
            fetchUniverse(),
            fetchScannerMarketData(),
            ...MY_STOCKS.map((symbol) => (symbol === 'ATHERENERG' ? fetchNseGetQuote(symbol) : fetchStockQuote(symbol))),
          ]);

        if (cancelled) {
          return;
        }

        setTopTen(
          topRes?.data ?? []
        );

        setMostActive(
          mostRes?.data ?? []
        );

        setUniverseList(
          uniRes?.data ?? []
        );

        /*
         * IMPORTANT:
         * Scanner now uses the dedicated
         * market-data endpoint.
         */
        setMarketData(
          scannerRes?.data ??
            scannerRes?.payload ??
            []
        );

        setUniverseStatus(
          Boolean(
            uniRes?.ok
          )
        );

        setTopStatus(
          Boolean(
            topRes?.ok
          )
        );

        setMostStatus(
          Boolean(
            mostRes?.ok
          )
        );

        const myResults =
          myStockRes.map(
            (
              result,
              index
            ) => {
              const symbol =
                MY_STOCKS[
                  index
                ];

              const payload =
                result?.data;

              const priceInfo =
                payload?.priceInfo ||
                payload
                  ?.data
                  ?.priceInfo ||
                {};

              const securityInfo =
                payload?.securityInfo ||
                payload
                  ?.data
                  ?.securityInfo ||
                {};

              const quote =
                payload?.data ||
                payload ||
                {};

              const price =
                toNumber(
                  priceInfo.lastPrice ??
                    quote.lastPrice ??
                    quote.price
                );

              const previousClose =
                toNumber(
                  priceInfo.previousClose ??
                    quote.previousClose ??
                    quote.prevClose
                );

              const pChange =
                toNumber(
                  priceInfo.pChange ??
                    quote.pChange ??
                    (
                      previousClose
                        ? (
                            (
                              price -
                              previousClose
                            ) /
                            previousClose
                          ) *
                          100
                        : 0
                    )
                );

              const summary =
                buildMyStockSignal({
                  price,
                  previousClose,
                  pChange,
                });

              return {
                symbol,

                companyName:
                  securityInfo.companyName ||
                  securityInfo.company ||
                  symbol,

                price,

                change:
                  price -
                  previousClose,

                pChange,

                previousClose,

                dayHigh:
                  toNumber(
                    priceInfo
                      ?.intraDayHighLow
                      ?.max ??
                      quote.dayHigh
                  ),

                dayLow:
                  toNumber(
                    priceInfo
                      ?.intraDayHighLow
                      ?.min ??
                      quote.dayLow
                  ),

                status:
                  result?.ok
                    ? 'Live'
                    : 'Unavailable',

                ...summary,
              };
            }
          );

        setMyStocks(
          myResults
        );

        setLastUpdated(
          new Date()
        );

        if (
          !scannerRes?.ok
        ) {
          setError(
            'Groww scanner market data is unavailable. Check your API subscription/token/backend.'
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ||
              'Failed to refresh stock scanner.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    refresh();

    if (live) {
      intervalRef.current =
        setInterval(
          refresh,
          intervalMs
        );
    }

    return () => {
      cancelled = true;

      if (
        intervalRef.current
      ) {
        clearInterval(
          intervalRef.current
        );
      }
    };
  }, [
    live,
    intervalMs,
  ]);

  /* ==========================================================
     STATUS
     ========================================================== */

  const marketText =
    `${scanner.marketConfirmation.label} ` +
    `(${scanner.marketConfirmation.advancing} up / ` +
    `${scanner.marketConfirmation.declining} down)`;

  const dataQuality =
    scanner.bullish.length >= 10
      ? {
          label: 'Live',
          emoji: '🟢',
        }
      : scanner.bullish.length > 0
        ? {
            label: 'Limited',
            emoji: '🟡',
          }
        : {
            label: 'Unavailable',
            emoji: '🔴',
          };

  const activeTabHelp =
    STOCK_TAB_HELP[activeTab] ||
    STOCK_TAB_HELP.dashboard;

  const dashboardHighConvictionRows =
    marketIntelligence.dashboardRows
      .filter((row) => row.score >= 80)
      .slice(0, 25);

  const dashboardStrongestRows =
    dashboardHighConvictionRows.length
      ? dashboardHighConvictionRows
      : marketIntelligence.dashboardRows
          .filter((row) => row.price && row.volume)
          .slice(0, 25);

  const dashboardWatchlistRows =
    marketIntelligence.scannerRows
      .filter((row) => row.score >= 60 && row.score < 100)
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);

  const dashboardOverviewTitle =
    dashboardHighConvictionRows.length
      ? 'High Conviction Buys'
      : 'Strongest Available Stocks';

  const dashboardOverviewEmpty =
    marketIntelligence.scannerRows.length
      ? 'No stocks passed the dashboard filters right now. Check Live Scanner for all scanned rows.'
      : 'No scanner rows loaded. Check NSE proxy/API status and whether the market-data endpoints returned rows.';

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="p-3">
      {/* HEADER */}

      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h3 className="mb-1">
            TOP 10 NSE INTRADAY STOCKS TODAY
          </h3>

          <p className="text-muted mb-0">
            NSE intraday scanner using
            market data, volume, VWAP,
            PDH, EMA, RSI and breakout
            confirmation.
          </p>
        </div>

        <div className="text-end small">
          <div>
            <strong>
              {marketText}
            </strong>
          </div>

          <div className="text-muted">
            Universe:{' '}
            {scanner.universeCount}{' '}
            · Valid:{' '}
            {scanner.validCount}{' '}
            · Bullish:{' '}
            {scanner.bullish.length}
          </div>

          <div className="text-muted">
            Market score:{' '}
            {scanner.marketScore}
            /5 · Data:{' '}
            {dataQuality.emoji}{' '}
            {dataQuality.label}
          </div>

          <div className="text-muted">
            {lastUpdated
              ? `Last: ${getNSEDateTime(lastUpdated).shortTime} IST`
              : ''}
          </div>
        </div>
      </div>

      {/* CONTROLS */}

      <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
        <TopIntraday
          activeTab={
            activeTab
          }
          onChange={
            setActiveTab
          }
        />

        <button
          className={`btn btn-sm ${
            live
              ? 'btn-danger'
              : 'btn-success'
          }`}
          onClick={() =>
            setLive(
              (value) =>
                !value
            )
          }
        >
          {live
            ? 'Pause Live'
            : 'Resume Live'}
        </button>

        <label className="small text-muted d-flex align-items-center gap-2">
          Interval

          <select
            className="form-select form-select-sm"
            value={String(
              intervalMs
            )}
            onChange={(event) =>
              setIntervalMs(
                Number(
                  event.target
                    .value
                )
              )
            }
            style={{
              width: 110,
            }}
          >
            <option value={5000}>
              5s
            </option>

            <option value={10000}>
              10s
            </option>

            <option value={30000}>
              30s
            </option>

            <option value={60000}>
              60s
            </option>
          </select>
        </label>

        <label className="small text-muted d-flex align-items-center gap-2">
          Capital

          <input
            className="form-control form-control-sm"
            min="0"
            type="number"
            value={capital}
            onChange={(event) =>
              setCapital(
                Number(
                  event.target
                    .value
                )
              )
            }
            style={{
              width: 130,
            }}
          />
        </label>

        <div className="d-flex align-items-center gap-2 small">
          <span className="text-muted">
            Gainers:
          </span>

          <StatusChip
            ok={topStatus}
          />

          <span className="text-muted ms-2">
            Volume:
          </span>

          <StatusChip
            ok={mostStatus}
          />
        </div>
      </div>

      <div className={`st-tab-help st-tab-help--${activeTabHelp.tone}`}>
        <div>
          <div className="st-tab-help-title">
            {activeTabHelp.title}
          </div>

          <div className="st-tab-help-description">
            {activeTabHelp.description}
          </div>

          <div className="st-tab-help-tip">
            Beginner tip: {activeTabHelp.beginnerTip}
          </div>
        </div>

        <div className="st-color-legend" aria-label="Score color legend">
          <span className="st-legend-item st-legend-green">100+ Strong</span>
          <span className="st-legend-item st-legend-orange">60-99 Watch</span>
          <span className="st-legend-item st-legend-red">Below 60 Risk</span>
        </div>
      </div>

      {/* STATUS */}

      {loading && (
        <div className="alert alert-info">
          Refreshing Groww/NSE
          scanner...
        </div>
      )}

      {error && (
        <div className="alert alert-warning">
          {error}
        </div>
      )}

      {scanner.validCount <
        10 && (
        <div className="alert alert-warning">
          Only{' '}
          {scanner.validCount}{' '}
          valid stocks are
          currently available.
        </div>
      )}

      {/* SCANNER */}

      {activeTab ===
        'dashboard' && (
        <>
          <MarketIntelligenceTable
            title={dashboardOverviewTitle}
            rows={dashboardStrongestRows}
            columns={LIVE_SCANNER_COLUMNS}
            loading={loading || marketIntelligenceStatus.loading}
            error={marketIntelligenceStatus.error}
            noDataMessage={dashboardOverviewEmpty}
            onRowClick={setSelectedStock}
          />

          {!dashboardHighConvictionRows.length && dashboardStrongestRows.length > 0 && (
            <div className="alert alert-info mt-2 mb-0">
              No high-conviction buys right now. Showing the strongest available scanner rows instead.
            </div>
          )}

          <div className="row g-3 mt-2">
            <div className="col-12 col-xl-6">
              <MarketIntelligenceTable
                title="Entry Ready"
                rows={marketIntelligence.entryReadyRows}
                columns={LIVE_SCANNER_COLUMNS}
                loading={loading}
                noDataMessage="No entry-ready stocks right now. This is normal when breakout, VWAP, EMA, volume, buy-ratio, or market confirmation filters are not all aligned."
                onRowClick={setSelectedStock}
              />
            </div>

            <div className="col-12 col-xl-6">
              <MarketIntelligenceTable
                title="Watchlist"
                rows={dashboardWatchlistRows}
                columns={LIVE_SCANNER_COLUMNS}
                loading={loading}
                noDataMessage="No watchlist stocks right now. Scanner rows may be unavailable, or all current scores are below 60."
                onRowClick={setSelectedStock}
              />
            </div>
          </div>
        </>
      )}

      {activeTab ===
        'scanner' && (
        <>
          <div className="mb-3">
            <form
              onSubmit={
                handleSearch
              }
              className="d-flex gap-2"
            >
              <input
                className="form-control form-control-sm"
                placeholder="Search symbol (e.g. CUPID)"
                value={
                  searchQuery
                }
                onChange={(event) =>
                  setSearchQuery(
                    event.target
                      .value
                  )
                }
              />

              <button
                className="btn btn-sm btn-primary"
                type="submit"
              >
                Lookup
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setSearchQuery(
                    ''
                  );
                  setLookupResult(
                    null
                  );
                }}
              >
                Clear
              </button>
            </form>
          </div>

          {lookupResult && (
            <div className="mb-3">
              <h6>
                Lookup results (
                {
                  lookupResult.length
                }
                )
              </h6>

              <ScannerTable
                rows={
                  lookupResult
                }
              />
            </div>
          )}

          <MarketIntelligenceTable
            title="Live Scanner"
            rows={marketIntelligence.scannerRows}
            columns={LIVE_SCANNER_COLUMNS}
            loading={loading}
            onRowClick={setSelectedStock}
          />

          <div className="row g-3 mt-2">
            <div className="col-12 col-xl-8">
              <h5>
                Entry Setup
              </h5>

              <EntrySetups
                rows={
                  scanner.bullish
                }
              />
            </div>

            <div className="col-12 col-xl-4">
              <h5>
                Scanner Notes
              </h5>

              <ul className="small text-muted">
                <li>
                  Momentum: 20
                </li>

                <li>
                  Volume Ratio: 20
                </li>

                <li>
                  VWAP: 15
                </li>

                <li>
                  PDH breakout: 15
                </li>

                <li>
                  Trend: 10
                </li>

                <li>
                  Liquidity: 10
                </li>

                <li>
                  Market confirmation: 5
                </li>

                <li>
                  RSI confirmation
                  is used as an
                  additional filter.
                </li>

                <li>
                  No buy orders are
                  placed by this
                  scanner.
                </li>
              </ul>
            </div>
          </div>
        </>
      )}

      {activeTab ===
        'entry-ready' && (
        <MarketIntelligenceTable
          title="Entry Ready"
          rows={marketIntelligence.entryReadyRows}
          columns={LIVE_SCANNER_COLUMNS}
          loading={loading}
          onRowClick={setSelectedStock}
        />
      )}

      {activeTab ===
        'breakouts' && (
        <MarketIntelligenceTable
          title="Breakouts"
          rows={marketIntelligence.breakoutRows}
          columns={BREAKOUT_COLUMNS}
          loading={loading}
          onRowClick={setSelectedStock}
        />
      )}

      {activeTab ===
        'block-deals' && (
        <MarketIntelligenceTable
          title="Block Deals"
          rows={marketIntelligence.dealRows.filter((row) => row.mode === MARKET_INTELLIGENCE_DEAL_MODES.block)}
          columns={DEAL_COLUMNS}
          loading={marketIntelligenceStatus.loading}
          error={marketIntelligenceStatus.error}
          onRowClick={setSelectedStock}
        />
      )}

      {activeTab ===
        'bulk-deals' && (
        <MarketIntelligenceTable
          title="Bulk Deals"
          rows={marketIntelligence.dealRows.filter((row) => row.mode === MARKET_INTELLIGENCE_DEAL_MODES.bulk)}
          columns={DEAL_COLUMNS}
          loading={marketIntelligenceStatus.loading}
          error={marketIntelligenceStatus.error}
          onRowClick={setSelectedStock}
        />
      )}

      {activeTab ===
        'short-deals' && (
        <MarketIntelligenceTable
          title="Short Deals"
          rows={marketIntelligence.dealRows.filter((row) => row.mode === MARKET_INTELLIGENCE_DEAL_MODES.short)}
          columns={SHORT_COLUMNS}
          loading={marketIntelligenceStatus.loading}
          error={marketIntelligenceStatus.error}
          onRowClick={setSelectedStock}
        />
      )}

      {activeTab ===
        'volume-spike' && (
        <MarketIntelligenceTable
          title="Volume Spike"
          rows={marketIntelligence.volumeSpikeRows}
          columns={LIVE_SCANNER_COLUMNS}
          loading={loading}
          onRowClick={setSelectedStock}
        />
      )}

      {activeTab ===
        'order-book' && (
        <MarketIntelligenceTable
          title="Order Book"
          rows={marketIntelligence.orderBookRows}
          columns={ORDER_BOOK_COLUMNS}
          loading={loading}
          onRowClick={setSelectedStock}
        />
      )}

      {activeTab ===
        'institutional' && (
        <MarketIntelligenceTable
          title="Institutional Activity"
          rows={marketIntelligence.dealRows}
          columns={DEAL_COLUMNS}
          loading={marketIntelligenceStatus.loading}
          error={marketIntelligenceStatus.error}
          onRowClick={setSelectedStock}
        />
      )}

      {activeTab ===
        'favorites' && (
        <MarketIntelligenceTable
          title="Favorites"
          rows={marketIntelligence.favoriteRows}
          columns={LIVE_SCANNER_COLUMNS}
          loading={loading}
          onRowClick={setSelectedStock}
        />
      )}

      {activeTab ===
        'alerts' && (
        <MarketIntelligenceTable
          title="Alerts"
          rows={marketIntelligence.alerts}
          columns={ALERT_COLUMNS}
          loading={loading}
          onRowClick={setSelectedStock}
        />
      )}

      {/* AVOID */}

      {activeTab ===
        'avoid' && (
        <>
          <h5>
            Avoid Today
          </h5>

          <AvoidTable
            rows={
              scanner.avoid
            }
          />
        </>
      )}

      {/* TOP GAINERS */}

      {activeTab ===
        'top' && (
        <TableView
          data={topTen}
        />
      )}

      {/* MOST ACTIVE */}

      {activeTab ===
        'most' && (
        <>
          <h5>
            MOST ACTIVE INTRADAY
          </h5>

          <MostActiveTable
            rows={scanner.scanned
              .slice()
              .sort(
                (a, b) =>
                  b.volume -
                  a.volume
              )
              .slice(
                0,
                10
              )}
          />
        </>
      )}

      {/* TOMORROW */}

      {activeTab ===
        'tomorrow' && (
        <>
          <h3>
            TOP 10 NSE STOCKS
            FOR TOMORROW
            INTRADAY
          </h3>

          <div className="small text-muted mb-3">
            Data Time:{' '}
            {lastUpdated
              ? lastUpdated.toLocaleString()
              : 'N/A'}
          </div>

          <div className="table-responsive mb-4">
            <table className="table table-striped table-bordered table-sm align-middle">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th>Close</th>
                  <th>Change %</th>
                  <th>Rel Vol</th>
                  <th>Trend</th>
                  <th>Support</th>
                  <th>Resistance</th>
                  <th>Breakout</th>
                  <th>R/R</th>
                  <th>Score</th>
                  <th>Signal</th>
                </tr>
              </thead>

              <tbody>
                {tomorrowScanner.top10.map(
                  (row) => (
                    <tr
                      key={
                        row.symbol
                      }
                    >
                      <td>
                        {row.rank}
                      </td>

                      <td>
                        <strong>
                          {
                            row.symbol
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          row.companyName
                        }
                      </td>

                      <td>
                        {formatMoney(
                          row.price
                        )}
                      </td>

                      <td>
                        {row.changePercent
                          ? `${row.changePercent.toFixed(
                              2
                            )}%`
                          : 'N/A'}
                      </td>

                      <td>
                        {row.relativeVolume
                          ? `${row.relativeVolume.toFixed(
                              2
                            )}x`
                          : 'N/A'}
                      </td>

                      <td>
                        {
                          row.trend
                        }
                      </td>

                      <td>
                        {row.supportLevel
                          ? formatMoney(
                              row.supportLevel
                            )
                          : 'N/A'}
                      </td>

                      <td>
                        {row.resistanceLevel
                          ? formatMoney(
                              row.resistanceLevel
                            )
                          : 'N/A'}
                      </td>

                      <td>
                        {
                          row.breakoutLabel
                        }
                      </td>

                      <td>
                        {row.riskReward
                          ? `${row.riskReward}:1`
                          : 'N/A'}
                      </td>

                      <td>
                        <strong>
                          {row.score}
                        </strong>
                      </td>

                      <td>
                        {
                          row.signal
                        }
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {tomorrowScanner.top10.length >
            0 && (
            <>
              <h5>
                Trade Setup
              </h5>

              <div className="table-responsive">
                <table className="table table-bordered table-sm">
                  <thead>
                    <tr>
                      <th>
                        Symbol
                      </th>
                      <th>
                        Entry
                      </th>
                      <th>
                        Stop Loss
                      </th>
                      <th>
                        Target 1
                      </th>
                      <th>
                        Target 2
                      </th>
                      <th>
                        Target 3
                      </th>
                      <th>
                        Risk/Reward
                      </th>
                      <th>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {tomorrowScanner.top10.map(
                      (row) => {
                        const setup =
                          renderTomorrowSetup(
                            row
                          );

                        return (
                          <tr
                            key={
                              row.symbol
                            }
                          >
                            <td>
                              <strong>
                                {
                                  row.symbol
                                }
                              </strong>
                            </td>

                            <td>
                              {
                                setup.entry
                              }
                            </td>

                            <td>
                              {
                                setup.stopLoss
                              }
                            </td>

                            <td>
                              {
                                setup.target1
                              }
                            </td>

                            <td>
                              {
                                setup.target2
                              }
                            </td>

                            <td>
                              {
                                setup.target3
                              }
                            </td>

                            <td>
                              {
                                setup.riskReward
                              }
                            </td>

                            <td>
                              {
                                row.tradeSetup
                              }
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* MY STOCKS */}

      {activeTab ===
        'mystocks' && (
        <>
          <h5>
            MyStocks
          </h5>

          <div className="table-responsive">
            <table className="table table-striped table-bordered table-sm">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th>Price</th>
                  <th>Change</th>
                  <th>% Change</th>
                  <th>Prev Close</th>
                  <th>Day High</th>
                  <th>Day Low</th>
                  <th>Status</th>
                  <th>Sentiment</th>
                  <th>Market</th>
                  <th>Action</th>
                  <th>Intraday</th>
                </tr>
              </thead>

              <tbody>
                {myStocks.map(
                  (row) => (
                    <tr
                      key={
                        row.symbol
                      }
                    >
                      <td>
                        <strong>
                          {
                            row.symbol
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          row.companyName
                        }
                      </td>

                      <td>
                        {formatMoney(
                          row.price
                        )}
                      </td>

                      <td>
                        {formatMoney(
                          row.change
                        )}
                      </td>

                      <td>
                        {formatPercent(
                          row.pChange
                        )}
                      </td>

                      <td>
                        {formatMoney(
                          row.previousClose
                        )}
                      </td>

                      <td>
                        {formatMoney(
                          row.dayHigh
                        )}
                      </td>

                      <td>
                        {formatMoney(
                          row.dayLow
                        )}
                      </td>

                      <td>
                        {
                          row.status
                        }
                      </td>

                      <td>
                        {
                          row.sentiment
                        }
                      </td>

                      <td>
                        {
                          row.marketDirection
                        }
                      </td>

                      <td>
                        {
                          row.keyAction
                        }
                      </td>

                      <td>
                        {
                          row.goodForIntraday
                        }
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* GROUPS */}

      {activeTab === 'cupid' && (
        <>
          <h5>CUPID — Chart Data (API)</h5>

          <div className="small text-muted mb-3">
            The NSE chart API returns time-series chart information for the given index or symbol
            (OHLC, volumes, timestamps and derived series). It is useful for plotting price
            history, computing indicators and backtesting intraday setups. Below is the raw
            payload mapped into a table where possible.
          </div>

          {cupidLoading ? (
            <div className="text-muted">Loading chart data...</div>
          ) : cupidError ? (
            <div className="alert alert-warning">{cupidError}</div>
          ) : cupidChart ? (
            <div>
              <TableView data={cupidChart.data ?? cupidChart} />
            </div>
          ) : (
            <div className="text-muted">No chart data available.</div>
          )}
        </>
      )}

      {(
        activeTab ===
          'basic-industry' ||
        activeTab ===
          'personal-care'
      ) && (
        <>
          {(() => {
            const groupKey =
              activeTab ===
              'basic-industry'
                ? 'basic-industry'
                : 'personal-care';

            const rows =
              filterStocksByGroup(
                scanner.scanned,
                groupKey
              );

            const title =
              activeTab ===
              'basic-industry'
                ? 'Basic Industry stock watchlist'
                : 'Personal Care stock watchlist';

            return (
              <>
                <h5>
                  {title}
                </h5>

                {rows.length ? (
                  <ScannerTable
                    rows={
                      rows
                    }
                  />
                ) : (
                  <div className="alert alert-warning">
                    No stocks matched
                    this filter.
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}

      {activeTab === 'momentum' && (
        <MomentumScanner
          scannerRows={momentumCandidateRows}
          marketScore={scanner.marketConfirmation?.score ?? 50}
          industryScoreMap={momentumIndustryScoreMap}
          lastUpdated={lastUpdated}
        />
      )}

      {selectedStock && (
        <div className="modal d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedStock.symbol || 'Stock'} Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setSelectedStock(null)}
                />
              </div>

              <div className="modal-body">
                <div className="row g-2 small">
                  {Object.entries(selectedStock)
                    .filter(([key]) => key !== 'raw' && key !== 'institutionalDeals' && key !== 'marketDepth')
                    .map(([key, value]) => (
                      <div className="col-12 col-md-6" key={key}>
                        <strong>{key}</strong>: {Array.isArray(value) ? value.join(', ') : String(value ?? '')}
                      </div>
                    ))}
                </div>

                {selectedStock.institutionalDeals?.length ? (
                  <div className="mt-3">
                    <h6>Institution Activity</h6>
                    <TableView data={selectedStock.institutionalDeals} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
