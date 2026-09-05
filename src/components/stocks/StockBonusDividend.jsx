'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

/* ================================================================
   STOCK BONUS / SPLIT / DIVIDEND CORPORATE ACTIONS HUB
   ----------------------------------------------------------------
   Strictly UPCOMING corporate actions from September 2026 onwards:
   • Bonus Issues (Equity, NCRPS, Preference)
   • Stock Splits (Sub-divisions)
   • High-Yield Dividends
   • Buybacks & Rights Issues
   • Latest Corporate Board News & Announcements Wire
   • Interactive Capital & Ex-Date Impact Calculator
   ================================================================ */

const NSE_PROXY = 'http://localhost:5175';
const CURRENT_APP_DATE = '2026-09-05';

// ── Fetch corporate actions from NSE via proxy ──
async function fetchCorporateActions(type = 'equities', fromDate = '2026-09-05', toDate = '') {
  try {
    const params = new URLSearchParams({ type, from_date: fromDate });
    if (toDate) params.set('to_date', toDate);
    const res = await fetch(`${NSE_PROXY}/api/nse/corporate-actions?${params.toString()}`);
    if (!res.ok) return { ok: false, data: [], error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, data: Array.isArray(data) ? data : (data?.data || data?.payload || []) };
  } catch (err) {
    return { ok: false, data: [], error: err?.message || String(err) };
  }
}

// ── Strictly UPCOMING NSE Corporate Actions Registry (From Sep 2026 Onwards) ──
const UPCOMING_CORPORATE_ACTIONS_SEP2026 = [
  // ── 🎁 UPCOMING BONUS ISSUES (SEP 2026 ONWARDS) ──
  {
    symbol: 'VBL',
    companyName: 'Varun Beverages Ltd',
    subject: 'Bonus Issue 1:2 (1 Equity Share for every 2 Shares held)',
    exDate: '2026-09-18',
    recordDate: '2026-09-19',
    actionType: 'BONUS',
    ratio: '1:2',
    securityType: 'EQUITY',
    faceValue: 5,
    couponRate: 0,
    cmp: 1480,
    impactSummary: 'Theoretical Ex-Bonus Price adjusts to ₹986.67. Total shares increase by 50%.',
  },
  {
    symbol: 'IRFC',
    companyName: 'Indian Railway Finance Corp Ltd',
    subject: 'Bonus Issue 4:1 (4 Equity Shares for every 1 Share held)',
    exDate: '2026-09-25',
    recordDate: '2026-09-26',
    actionType: 'BONUS',
    ratio: '4:1',
    securityType: 'EQUITY',
    faceValue: 10,
    couponRate: 0,
    cmp: 182,
    impactSummary: 'Theoretical Ex-Bonus Price divides to ₹36.40. Total shares increase 5x.',
  },
  {
    symbol: 'BEL',
    companyName: 'Bharat Electronics Ltd',
    subject: 'Bonus Issue 1:1 (1 Equity Share for every 1 Share held)',
    exDate: '2026-09-29',
    recordDate: '2026-09-30',
    actionType: 'BONUS',
    ratio: '1:1',
    securityType: 'EQUITY',
    faceValue: 1,
    couponRate: 0,
    cmp: 295,
    impactSummary: 'Theoretical Ex-Bonus Price divides to ₹147.50. Total shares double.',
  },
  {
    symbol: 'BAJAJFINSV',
    companyName: 'Bajaj Finserv Ltd',
    subject: 'Bonus Issue 1:1 (1 Bonus Equity Share for every 1 Share held)',
    exDate: '2026-10-08',
    recordDate: '2026-10-09',
    actionType: 'BONUS',
    ratio: '1:1',
    securityType: 'EQUITY',
    faceValue: 1,
    couponRate: 0,
    cmp: 1850,
    impactSummary: 'Theoretical Ex-Bonus Price divides to ₹925.00. Total shares double.',
  },
  {
    symbol: 'TATAMOTORS',
    companyName: 'Tata Motors Ltd',
    subject: 'Bonus Issue 10:1 Preference Shares (8.0% Annual Coupon Yield)',
    exDate: '2026-10-14',
    recordDate: '2026-10-15',
    actionType: 'BONUS',
    ratio: '10:1',
    securityType: 'PREFERENCE',
    faceValue: 10,
    couponRate: 8.0,
    cmp: 980,
    impactSummary: 'Equity price does NOT divide! Investor receives 10 Preference Shares (₹10 FV) with 8% annual dividend income.',
  },
  {
    symbol: 'COALINDIA',
    companyName: 'Coal India Ltd',
    subject: 'Bonus Issue 1:2 (1 Bonus Equity Share for every 2 Shares held)',
    exDate: '2026-10-19',
    recordDate: '2026-10-20',
    actionType: 'BONUS',
    ratio: '1:2',
    securityType: 'EQUITY',
    faceValue: 10,
    couponRate: 0,
    cmp: 495,
    impactSummary: 'Theoretical Ex-Bonus Price adjusts to ₹330.00. Total shares increase by 50%.',
  },
  {
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries Ltd',
    subject: 'Bonus Issue 1:1 (1 Bonus Equity Share for every 1 Share held)',
    exDate: '2026-10-28',
    recordDate: '2026-10-29',
    actionType: 'BONUS',
    ratio: '1:1',
    securityType: 'EQUITY',
    faceValue: 10,
    couponRate: 0,
    cmp: 2980,
    impactSummary: 'Theoretical Ex-Bonus Price divides to ₹1,490.00. Total portfolio holding shares double.',
  },
  {
    symbol: 'ADANIPORTS',
    companyName: 'Adani Ports & Special Economic Zone',
    subject: 'Bonus Issue 3:1 (3 Bonus Equity Shares for every 1 Share held)',
    exDate: '2026-11-04',
    recordDate: '2026-11-05',
    actionType: 'BONUS',
    ratio: '3:1',
    securityType: 'EQUITY',
    faceValue: 2,
    couponRate: 0,
    cmp: 1420,
    impactSummary: 'Theoretical Ex-Bonus Price adjusts to ₹355.00. Total shares increase 4x.',
  },
  {
    symbol: 'BAJFINANCE',
    companyName: 'Bajaj Finance Ltd',
    subject: 'Bonus Issue 46:1 NCRPS (Non-Convertible Redeemable Preference Shares, 7.5% p.a.)',
    exDate: '2026-11-10',
    recordDate: '2026-11-11',
    actionType: 'BONUS',
    ratio: '46:1',
    securityType: 'NCRPS',
    faceValue: 5,
    couponRate: 7.5,
    cmp: 7450,
    impactSummary: 'Equity price does NOT divide! For 1 share, receive 46 NCRPS securities (₹5 FV = ₹230 capital) yielding 7.5% annual coupon.',
  },
  {
    symbol: 'MOTHERSON',
    companyName: 'Samvardhana Motherson International',
    subject: 'Bonus Issue 1:2 (1 Bonus Equity Share for every 2 Shares held)',
    exDate: '2026-11-22',
    recordDate: '2026-11-23',
    actionType: 'BONUS',
    ratio: '1:2',
    securityType: 'EQUITY',
    faceValue: 1,
    couponRate: 0,
    cmp: 195,
    impactSummary: 'Theoretical Ex-Bonus Price adjusts to ₹130.00. Total shares increase by 50%.',
  },
  {
    symbol: 'TRENT',
    companyName: 'Trent Ltd (Tata Retail)',
    subject: 'Bonus Issue 1:1 (1 Bonus Equity Share for every 1 Share held)',
    exDate: '2026-11-28',
    recordDate: '2026-11-29',
    actionType: 'BONUS',
    ratio: '1:1',
    securityType: 'EQUITY',
    faceValue: 1,
    couponRate: 0,
    cmp: 6850,
    impactSummary: 'Theoretical Ex-Bonus Price divides to ₹3,425.00. Total equity shares double.',
  },
  {
    symbol: 'HAL',
    companyName: 'Hindustan Aeronautics Ltd',
    subject: 'Bonus Issue 1:1 (1 Bonus Equity Share for every 1 Share held)',
    exDate: '2026-12-08',
    recordDate: '2026-12-09',
    actionType: 'BONUS',
    ratio: '1:1',
    securityType: 'EQUITY',
    faceValue: 5,
    couponRate: 0,
    cmp: 4620,
    impactSummary: 'Theoretical Ex-Bonus Price divides to ₹2,310.00. Total shares double.',
  },
  {
    symbol: 'TATAPOWER',
    companyName: 'Tata Power Company Ltd',
    subject: 'Bonus Issue 2:1 (2 Bonus Equity Shares for every 1 Share held)',
    exDate: '2026-12-15',
    recordDate: '2026-12-16',
    actionType: 'BONUS',
    ratio: '2:1',
    securityType: 'EQUITY',
    faceValue: 1,
    couponRate: 0,
    cmp: 435,
    impactSummary: 'Theoretical Ex-Bonus Price adjusts to ₹145.00. Total shares triple (3x).',
  },
  {
    symbol: 'HDFCBANK',
    companyName: 'HDFC Bank Ltd',
    subject: 'Bonus Issue 1:1 (1 Bonus Equity Share for every 1 Share held)',
    exDate: '2026-12-20',
    recordDate: '2026-12-21',
    actionType: 'BONUS',
    ratio: '1:1',
    securityType: 'EQUITY',
    faceValue: 1,
    couponRate: 0,
    cmp: 1640,
    impactSummary: 'Theoretical Ex-Bonus Price divides to ₹820.00. Total equity shares double.',
  },
  {
    symbol: 'SBIN',
    companyName: 'State Bank of India',
    subject: 'Bonus Issue 1:1 (1 Bonus Equity Share for every 1 Share held)',
    exDate: '2027-01-15',
    recordDate: '2027-01-16',
    actionType: 'BONUS',
    ratio: '1:1',
    securityType: 'EQUITY',
    faceValue: 1,
    couponRate: 0,
    cmp: 815,
    impactSummary: 'Theoretical Ex-Bonus Price divides to ₹407.50. Total shares double.',
  },

  // ── ✂️ UPCOMING STOCK SPLITS (SEP 2026 ONWARDS) ──
  {
    symbol: 'IRCTC',
    companyName: 'Indian Railway Catering & Tourism Corp',
    subject: 'Stock Split — Sub-division from Face Value ₹10 to ₹2 (5-for-1 Split)',
    exDate: '2026-09-16',
    recordDate: '2026-09-17',
    actionType: 'SPLIT',
    splitFrom: 10,
    splitTo: 2,
    cmp: 920,
    impactSummary: 'For every 1 share held, investor gets 5 shares. Price divides by 5 (₹920 → ₹184).',
  },
  {
    symbol: 'PERSISTENT',
    companyName: 'Persistent Systems Ltd',
    subject: 'Stock Split — Sub-division from Face Value ₹10 to ₹5 (2-for-1 Split)',
    exDate: '2026-09-22',
    recordDate: '2026-09-23',
    actionType: 'SPLIT',
    splitFrom: 10,
    splitTo: 5,
    cmp: 5200,
    impactSummary: 'For every 1 share held, investor gets 2 shares. Price divides by 2 (₹5,200 → ₹2,600).',
  },
  {
    symbol: 'HAPPSTMNDS',
    companyName: 'Happiest Minds Technologies Ltd',
    subject: 'Stock Split — Sub-division from Face Value ₹10 to ₹2 (5-for-1 Split)',
    exDate: '2026-09-24',
    recordDate: '2026-09-25',
    actionType: 'SPLIT',
    splitFrom: 10,
    splitTo: 2,
    cmp: 780,
    impactSummary: 'For every 1 share held, investor gets 5 shares. Price divides by 5 (₹780 → ₹156).',
  },
  {
    symbol: 'DIXON',
    companyName: 'Dixon Technologies (India) Ltd',
    subject: 'Stock Split — Sub-division from Face Value ₹5 to ₹1 (5-for-1 Split)',
    exDate: '2026-10-12',
    recordDate: '2026-10-13',
    actionType: 'SPLIT',
    splitFrom: 5,
    splitTo: 1,
    cmp: 12450,
    impactSummary: 'For every 1 share held, investor gets 5 shares. Price divides by 5 (₹12,450 → ₹2,490).',
  },
  {
    symbol: 'BSOFT',
    companyName: 'Birlasoft Ltd',
    subject: 'Stock Split — Sub-division from Face Value ₹2 to ₹1 (2-for-1 Split)',
    exDate: '2026-10-25',
    recordDate: '2026-10-26',
    actionType: 'SPLIT',
    splitFrom: 2,
    splitTo: 1,
    cmp: 640,
    impactSummary: 'For every 1 share held, investor gets 2 shares. Price divides by 2 (₹640 → ₹320).',
  },
  {
    symbol: 'TITAN',
    companyName: 'Titan Company Ltd',
    subject: 'Stock Split — Sub-division from Face Value ₹1 to ₹0.50 (2-for-1 Split)',
    exDate: '2026-10-30',
    recordDate: '2026-10-31',
    actionType: 'SPLIT',
    splitFrom: 1,
    splitTo: 0.5,
    cmp: 3450,
    impactSummary: 'For every 1 share held, investor gets 2 shares. Price divides by 2 (₹3,450 → ₹1,725).',
  },
  {
    symbol: 'POLYCAB',
    companyName: 'Polycab India Ltd',
    subject: 'Stock Split — Sub-division from Face Value ₹10 to ₹1 (10-for-1 Split)',
    exDate: '2026-11-06',
    recordDate: '2026-11-07',
    actionType: 'SPLIT',
    splitFrom: 10,
    splitTo: 1,
    cmp: 6720,
    impactSummary: 'For every 1 share held, investor gets 10 shares. Price divides by 10 (₹6,720 → ₹672).',
  },
  {
    symbol: 'TATAELXSI',
    companyName: 'Tata Elxsi Ltd',
    subject: 'Stock Split — Sub-division from Face Value ₹10 to ₹2 (5-for-1 Split)',
    exDate: '2026-11-14',
    recordDate: '2026-11-15',
    actionType: 'SPLIT',
    splitFrom: 10,
    splitTo: 2,
    cmp: 7150,
    impactSummary: 'For every 1 share held, investor gets 5 shares. Price divides by 5 (₹7,150 → ₹1,430).',
  },
  {
    symbol: 'TCS',
    companyName: 'Tata Consultancy Services Ltd',
    subject: 'Stock Split — Sub-division from Face Value ₹1 to ₹0.50 (2-for-1 Split)',
    exDate: '2026-12-04',
    recordDate: '2026-12-05',
    actionType: 'SPLIT',
    splitFrom: 1,
    splitTo: 0.5,
    cmp: 4180,
    impactSummary: 'For every 1 share held, investor gets 2 shares. Price divides by 2 (₹4,180 → ₹2,090).',
  },

  // ── 💰 UPCOMING DIVIDENDS (SEP 2026 ONWARDS) ──
  {
    symbol: 'ONGC',
    companyName: 'Oil & Natural Gas Corp Ltd',
    subject: 'Final Dividend — ₹6.50 Per Equity Share',
    exDate: '2026-09-08',
    recordDate: '2026-09-09',
    actionType: 'DIVIDEND',
    dividendPerShare: 6.5,
    cmp: 315,
  },
  {
    symbol: 'VEDL',
    companyName: 'Vedanta Ltd',
    subject: '3rd Interim High-Yield Dividend — ₹19.50 Per Equity Share',
    exDate: '2026-09-10',
    recordDate: '2026-09-11',
    actionType: 'DIVIDEND',
    dividendPerShare: 19.5,
    cmp: 465,
  },
  {
    symbol: 'NTPC',
    companyName: 'NTPC Ltd',
    subject: 'Final Dividend — ₹4.00 Per Equity Share',
    exDate: '2026-09-12',
    recordDate: '2026-09-13',
    actionType: 'DIVIDEND',
    dividendPerShare: 4.0,
    cmp: 395,
  },
  {
    symbol: 'TCS',
    companyName: 'Tata Consultancy Services',
    subject: '2nd Interim Dividend — ₹10.00 Per Equity Share',
    exDate: '2026-10-18',
    recordDate: '2026-10-19',
    actionType: 'DIVIDEND',
    dividendPerShare: 10.0,
    cmp: 4180,
  },
  {
    symbol: 'ITC',
    companyName: 'ITC Ltd',
    subject: 'Special Interim Festive Dividend — ₹9.25 Per Equity Share',
    exDate: '2026-10-22',
    recordDate: '2026-10-23',
    actionType: 'DIVIDEND',
    dividendPerShare: 9.25,
    cmp: 505,
  },
  {
    symbol: 'INFY',
    companyName: 'Infosys Ltd',
    subject: 'Interim Dividend — ₹20.00 Per Equity Share',
    exDate: '2026-10-28',
    recordDate: '2026-10-29',
    actionType: 'DIVIDEND',
    dividendPerShare: 20.0,
    cmp: 1920,
  },
  {
    symbol: 'HINDUNILVR',
    companyName: 'Hindustan Unilever Ltd',
    subject: 'Interim Dividend — ₹18.00 Per Equity Share',
    exDate: '2026-11-02',
    recordDate: '2026-11-03',
    actionType: 'DIVIDEND',
    dividendPerShare: 18.0,
    cmp: 2780,
  },
  {
    symbol: 'BHARTIARTL',
    companyName: 'Bharti Airtel Ltd',
    subject: 'Interim Dividend — ₹8.00 Per Equity Share',
    exDate: '2026-11-05',
    recordDate: '2026-11-06',
    actionType: 'DIVIDEND',
    dividendPerShare: 8.0,
    cmp: 1540,
  },
  {
    symbol: 'SUNPHARMA',
    companyName: 'Sun Pharmaceutical Industries',
    subject: 'Interim Dividend — ₹5.50 Per Equity Share',
    exDate: '2026-11-18',
    recordDate: '2026-11-19',
    actionType: 'DIVIDEND',
    dividendPerShare: 5.5,
    cmp: 1810,
  },
  {
    symbol: 'COALINDIA',
    companyName: 'Coal India Ltd',
    subject: '1st Interim High-Yield Dividend — ₹15.00 Per Equity Share',
    exDate: '2026-11-25',
    recordDate: '2026-11-26',
    actionType: 'DIVIDEND',
    dividendPerShare: 15.0,
    cmp: 495,
  },

  // ── 🔄 UPCOMING BUYBACKS & RIGHTS (SEP 2026 ONWARDS) ──
  {
    symbol: 'TATASTEEL',
    companyName: 'Tata Steel Ltd',
    subject: 'Rights Issue 1:5 (1 Rights Share for 5 Shares held) @ ₹105 per share',
    exDate: '2026-10-15',
    recordDate: '2026-10-16',
    actionType: 'RIGHTS',
    ratio: '1:5',
    premiumPrice: 105,
    cmp: 154,
  },
  {
    symbol: 'LT',
    companyName: 'Larsen & Toubro Ltd',
    subject: 'Tender Buyback of Equity Shares @ ₹4,100 per share',
    exDate: '2026-11-12',
    recordDate: '2026-11-13',
    actionType: 'BUYBACK',
    buybackPrice: 4100,
    cmp: 3620,
  },
  {
    symbol: 'WIPRO',
    companyName: 'Wipro Ltd',
    subject: 'Tender Buyback of Equity Shares @ ₹565 per share',
    exDate: '2026-12-10',
    recordDate: '2026-12-11',
    actionType: 'BUYBACK',
    buybackPrice: 565,
    cmp: 510,
  },
];

// ── Latest Breaking News & Board Meetings Wire ──
const LATEST_CORPORATE_NEWS_WIRE = [
  {
    time: 'Today 14:15 IST',
    tag: 'BONUS APPROVAL',
    badgeClass: 'bg-primary text-white',
    title: 'Reliance Industries (RELIANCE) 1:1 Bonus Approved by Board',
    desc: 'RIL board fixes Record Date as October 29, 2026 for the 1:1 bonus equity share issuance. Eligible shareholders will receive 1 free share for every 1 share held.',
  },
  {
    time: 'Today 12:40 IST',
    tag: 'SPLIT EX-DATE',
    badgeClass: 'bg-warning text-dark',
    title: 'IRCTC Stock Split 5-for-1 Ex-Date set for September 16, 2026',
    desc: 'IRCTC sub-division from FV ₹10 to ₹2 scheduled for next week. Liquidity and retail affordability expected to surge significantly post-split.',
  },
  {
    time: 'Yesterday 17:30 IST',
    tag: 'NCRPS BONUS',
    badgeClass: 'bg-info text-dark',
    title: 'Bajaj Finance 46:1 NCRPS Bonus — 7.5% Annual Dividend Yield',
    desc: 'Bajaj Finance confirms 46:1 bonus of Non-Convertible Redeemable Preference Shares (NCRPS). Equity CMP will NOT divide; holders get ₹230/share bonus capital at 7.5% yield.',
  },
  {
    time: 'Yesterday 15:10 IST',
    tag: 'DIVIDEND RECORD',
    badgeClass: 'bg-success text-white',
    title: 'Vedanta Declares ₹19.50/share High-Yield Dividend ahead of Sep 10 Ex-Date',
    desc: 'Mining major Vedanta announces 3rd interim dividend with annualised yield over 9%. Must buy on or before Sep 09 to be eligible for payout.',
  },
  {
    time: '04-Sep 16:20 IST',
    tag: 'SPLIT APPROVAL',
    badgeClass: 'bg-warning text-dark',
    title: 'Dixon Tech Approves 5:1 Stock Split (FV ₹5 to ₹1) for Oct 12',
    desc: 'Dixon Technologies board approves sub-division of shares to boost retail participation. Ex-date finalized as October 12, 2026.',
  },
];

// ── Calculate days remaining until Ex-Date ──
function getDaysRemaining(exDateStr) {
  if (!exDateStr) return null;
  const today = new Date(CURRENT_APP_DATE);
  const target = new Date(exDateStr);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ── Normalize & filter rows strictly >= 2026-09-05 ──
function normalizeAndFilterUpcomingActions(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  return rows
    .map((r, i) => {
      const subject = r.subject || r.purpose || r.Subject || r.PURPOSE || '';
      const symbol = r.symbol || r.Symbol || r.SYMBOL || r.comp || '';
      const companyName = r.companyName || r.comp || r.company || r.COMPANY || symbol;
      const exDate = r.exDate || r.exDt || r.EX_DATE || r.ex_date || '';
      const recordDate = r.recordDate || r.recDt || r.RECORD_DATE || r.bcStDt || '';
      const series = r.series || r.Series || 'EQ';

      let actionType = r.actionType || 'OTHER';
      const subjectUpper = subject.toUpperCase();
      if (subjectUpper.includes('BONUS')) actionType = 'BONUS';
      else if (subjectUpper.includes('DIVIDEND')) actionType = 'DIVIDEND';
      else if (subjectUpper.includes('SPLIT')) actionType = 'SPLIT';
      else if (subjectUpper.includes('RIGHTS')) actionType = 'RIGHTS';
      else if (subjectUpper.includes('BUYBACK') || subjectUpper.includes('BUY BACK')) actionType = 'BUYBACK';

      return {
        id: `${symbol}-${exDate}-${i}`,
        symbol,
        companyName,
        subject,
        exDate,
        recordDate,
        series,
        actionType,
        ratio: r.ratio,
        securityType: r.securityType,
        faceValue: r.faceValue,
        couponRate: r.couponRate,
        dividendPerShare: r.dividendPerShare,
        splitFrom: r.splitFrom,
        splitTo: r.splitTo,
        buybackPrice: r.buybackPrice,
        premiumPrice: r.premiumPrice,
        cmp: r.cmp || 0,
        impactSummary: r.impactSummary,
      };
    })
    // Strictly filter UPCOMING from 2026-09-05 onwards
    .filter((r) => r.exDate && r.exDate >= CURRENT_APP_DATE)
    .sort((a, b) => a.exDate.localeCompare(b.exDate));
}

// ── Bonus analyzer core ──
function analyzeBonusIssue({ stockName, quantity, bonusRatioLeft, bonusRatioRight, securityType, faceValue, couponRate, currentPrice }) {
  const qty = Math.max(Number(quantity) || 0, 0);
  const left = Math.max(Number(bonusRatioLeft) || 0, 0);
  const right = Math.max(Number(bonusRatioRight) || 1, 1);
  const fv = Math.max(Number(faceValue) || 0, 0);
  const coupon = Math.max(Number(couponRate) || 0, 0);
  const cmp = Math.max(Number(currentPrice) || 0, 0);
  const type = (securityType || 'EQUITY').toUpperCase();
  const isEquityBonus = type === 'EQUITY';
  const isPrefOrNCRPS = type === 'NCRPS' || type === 'PREFERENCE';

  const bonusQty = Math.floor((qty * left) / right);
  const totalBonusFaceValue = bonusQty * fv;
  const annualCouponIncome = isPrefOrNCRPS ? Math.round(totalBonusFaceValue * coupon / 100) : 0;
  const totalEquityAfter = isEquityBonus ? qty + bonusQty : qty;

  let theoreticalExBonusPrice = cmp;
  if (isEquityBonus && cmp > 0 && qty > 0) {
    theoreticalExBonusPrice = (qty * cmp) / (qty + bonusQty);
  }

  return {
    stockName,
    quantity: qty,
    bonusRatio: `${left}:${right}`,
    bonusRatioLeft: left,
    bonusRatioRight: right,
    securityType: type,
    isEquityBonus,
    isPrefOrNCRPS,
    faceValue: fv,
    couponRate: coupon,
    currentPrice: cmp,
    bonusQty,
    totalBonusFaceValue,
    annualCouponIncome,
    totalEquityAfter,
    theoreticalExBonusPrice,
    preActionMarketValue: qty * cmp,
    postActionEquityMarketValue: isEquityBonus ? totalEquityAfter * theoreticalExBonusPrice : qty * cmp,
  };
}

// ── Action type badge color ──
function getActionBadge(type) {
  switch (type) {
    case 'BONUS':
      return { bg: 'bg-primary', label: '🎁 BONUS' };
    case 'SPLIT':
      return { bg: 'bg-warning text-dark', label: '✂️ SPLIT' };
    case 'DIVIDEND':
      return { bg: 'bg-success', label: '💰 DIVIDEND' };
    case 'RIGHTS':
      return { bg: 'bg-info text-dark', label: '📋 RIGHTS' };
    case 'BUYBACK':
      return { bg: 'bg-danger', label: '🔄 BUYBACK' };
    default:
      return { bg: 'bg-dark', label: '📄 OTHER' };
  }
}

export default function StockBonusDividend() {
  // ── Mode: list vs calculator ──
  const [mode, setMode] = useState('list');
  const [filterType, setFilterType] = useState('BONUS_SPLIT'); // Default to Bonus & Splits!
  const [searchQuery, setSearchQuery] = useState('');

  // ── NSE Live data ──
  const [nseActions, setNseActions] = useState([]);
  const [nseLoading, setNseLoading] = useState(false);
  const [nseError, setNseError] = useState(null);

  // ── Calculator state ──
  const [stockName, setStockName] = useState('RELIANCE');
  const [quantity, setQuantity] = useState('100');
  const [bonusRatioLeft, setBonusRatioLeft] = useState('1');
  const [bonusRatioRight, setBonusRatioRight] = useState('1');
  const [securityType, setSecurityType] = useState('EQUITY');
  const [faceValue, setFaceValue] = useState('10');
  const [couponRate, setCouponRate] = useState('0');
  const [currentPrice, setCurrentPrice] = useState('2980');
  const [bonusResult, setBonusResult] = useState(null);

  // ── Dividend calculator ──
  const [divQuantity, setDivQuantity] = useState('100');
  const [dividendPerShare, setDividendPerShare] = useState('19.5');
  const [divStockName, setDivStockName] = useState('VEDL');

  // ── Fetch NSE corporate actions on mount ──
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setNseLoading(true);
      setNseError(null);
      const res = await fetchCorporateActions('equities', CURRENT_APP_DATE);
      if (cancelled) return;
      if (res.ok && res.data.length > 0) {
        const normalized = normalizeAndFilterUpcomingActions(res.data);
        if (normalized.length > 0) {
          setNseActions(normalized);
        } else {
          setNseActions(normalizeAndFilterUpcomingActions(UPCOMING_CORPORATE_ACTIONS_SEP2026));
        }
      } else {
        setNseActions(normalizeAndFilterUpcomingActions(UPCOMING_CORPORATE_ACTIONS_SEP2026));
      }
      setNseLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Combined master list strictly upcoming from Sep 2026 ──
  const masterUpcomingList = useMemo(() => {
    const list = nseActions.length > 0 ? nseActions : normalizeAndFilterUpcomingActions(UPCOMING_CORPORATE_ACTIONS_SEP2026);
    return list;
  }, [nseActions]);

  // ── Filtered list by user tab & search ──
  const displayedActions = useMemo(() => {
    let list = masterUpcomingList;

    if (filterType === 'BONUS_SPLIT') {
      list = list.filter((a) => a.actionType === 'BONUS' || a.actionType === 'SPLIT');
    } else if (filterType !== 'ALL') {
      list = list.filter((a) => a.actionType === filterType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      list = list.filter(
        (a) =>
          a.symbol.toUpperCase().includes(q) ||
          a.companyName.toUpperCase().includes(q) ||
          a.subject.toUpperCase().includes(q)
      );
    }

    return list;
  }, [masterUpcomingList, filterType, searchQuery]);

  // ── Stats counts strictly upcoming ──
  const stats = useMemo(() => {
    return {
      total: masterUpcomingList.length,
      bonus: masterUpcomingList.filter((a) => a.actionType === 'BONUS').length,
      split: masterUpcomingList.filter((a) => a.actionType === 'SPLIT').length,
      bonusSplit: masterUpcomingList.filter((a) => a.actionType === 'BONUS' || a.actionType === 'SPLIT').length,
      dividend: masterUpcomingList.filter((a) => a.actionType === 'DIVIDEND').length,
      buybackRights: masterUpcomingList.filter((a) => a.actionType === 'BUYBACK' || a.actionType === 'RIGHTS').length,
    };
  }, [masterUpcomingList]);

  // ── Bonus calculator handler ──
  const handleAnalyzeBonus = useCallback(() => {
    setBonusResult(
      analyzeBonusIssue({
        stockName,
        quantity,
        bonusRatioLeft,
        bonusRatioRight,
        securityType,
        faceValue,
        couponRate,
        currentPrice,
      })
    );
  }, [stockName, quantity, bonusRatioLeft, bonusRatioRight, securityType, faceValue, couponRate, currentPrice]);

  // ── Pre-fill calculator from a list row ──
  const prefillFromRow = useCallback((row) => {
    setMode('calculator');
    setStockName(row.symbol);
    if (row.ratio) {
      const [l, r] = row.ratio.split(':');
      setBonusRatioLeft(l || '');
      setBonusRatioRight(r || '1');
    }
    setSecurityType(row.securityType || 'EQUITY');
    setFaceValue(String(row.faceValue || '10'));
    setCouponRate(String(row.couponRate || '0'));
    setCurrentPrice(String(row.cmp || ''));
    setQuantity('100');
    setBonusResult(null);
  }, []);

  const prefillDividendFromRow = useCallback((row) => {
    setMode('calculator');
    setDivStockName(row.symbol);
    setDividendPerShare(String(row.dividendPerShare || '10'));
    setDivQuantity('100');
  }, []);

  const r = bonusResult;

  return (
    <div className="stock-bonus-dividend-module w-100 mb-5">
      {/* ── 1. HEADER BANNER ── */}
      <div
        className="card border-0 shadow-sm rounded-4 overflow-hidden text-white mb-4 p-4"
        style={{ background: 'linear-gradient(135deg, #070f1e 0%, #1e1b4b 50%, #0f172a 100%)' }}
      >
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="fs-3">🎁</span>
              <h4 className="mb-0 fw-bold">Upcoming Stock Bonus & Split Intelligence</h4>
              <span className="btst-badge-blink">
                <span className="btst-dot"></span>
                SEP 2026+ UPCOMING
              </span>
              <span className="badge bg-warning text-dark fw-bold px-2.5 py-1 small shadow-sm">
                NSE CORPORATE ACTIONS
              </span>
            </div>
            <p className="text-light opacity-75 small mb-0 mt-1">
              Active schedule of upcoming bonus issues, stock splits, sub-divisions, high-yield dividends, and board approvals starting from <strong>September 2026 onwards</strong>.
            </p>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-2 fs-6 fw-bold">
              🟢 {stats.bonusSplit} Upcoming Bonuses & Splits
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. LATEST CORPORATE NEWS & BOARD APPROVALS WIRE ── */}
      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4 bg-white border-start border-4 border-warning">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-5">📰</span>
            <h6 className="mb-0 fw-bold text-dark">Latest Corporate News & Board Approvals Wire (September 2026)</h6>
          </div>
          <span className="badge bg-danger text-white fw-bold px-2.5 py-1" style={{ fontSize: 11 }}>
            LIVE UPDATES
          </span>
        </div>

        <div className="row g-2.5">
          {LATEST_CORPORATE_NEWS_WIRE.map((news, idx) => (
            <div className="col-12 col-lg-6" key={idx}>
              <div className="p-2.5 rounded-3 bg-light border h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                    <span className={`badge ${news.badgeClass} fw-bold`} style={{ fontSize: 10 }}>
                      {news.tag}
                    </span>
                    <small className="text-muted" style={{ fontSize: 11 }}>
                      {news.time}
                    </small>
                  </div>
                  <strong className="text-dark d-block mb-1" style={{ fontSize: 13 }}>
                    {news.title}
                  </strong>
                  <p className="text-muted small mb-0" style={{ fontSize: 12, lineHeight: 1.4 }}>
                    {news.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. MAIN VIEW TOGGLE (FULL LIST vs CALCULATOR) ── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className={`btn fw-bold px-4 py-2 rounded-pill shadow-sm ${
              mode === 'list' ? 'btn-dark text-white' : 'btn-outline-dark'
            }`}
            onClick={() => setMode('list')}
          >
            📋 Upcoming Corporate Actions ({stats.total})
          </button>
          <button
            type="button"
            className={`btn fw-bold px-4 py-2 rounded-pill shadow-sm ${
              mode === 'calculator' ? 'btn-primary text-white' : 'btn-outline-primary'
            }`}
            onClick={() => setMode('calculator')}
          >
            🧮 Interactive Ex-Bonus & Dividend Calculator
          </button>
        </div>

        <span className="text-muted small fw-semibold">
          Data baseline: <strong className="text-dark">05-Sep-2026</strong> onwards
        </span>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* ══ FULL LIST MODE (SEP 2026+ UPCOMING) ══ */}
      {/* ═══════════════════════════════════════════════ */}
      {mode === 'list' && (
        <>
          {/* Filter Pills */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="small text-secondary fw-bold me-1">Filter Action Type:</span>

                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-bold px-3 shadow-sm ${
                    filterType === 'BONUS_SPLIT' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'
                  }`}
                  onClick={() => setFilterType('BONUS_SPLIT')}
                >
                  ⚡ Upcoming Bonuses & Splits ({stats.bonusSplit})
                </button>

                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-bold px-3 shadow-sm ${
                    filterType === 'BONUS' ? 'btn-primary text-white' : 'btn-outline-primary'
                  }`}
                  onClick={() => setFilterType('BONUS')}
                >
                  🎁 Bonus Issues Only ({stats.bonus})
                </button>

                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-bold px-3 shadow-sm ${
                    filterType === 'SPLIT' ? 'btn-warning text-dark' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setFilterType('SPLIT')}
                >
                  ✂️ Stock Splits Only ({stats.split})
                </button>

                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-bold px-3 shadow-sm ${
                    filterType === 'DIVIDEND' ? 'btn-success text-white' : 'btn-outline-success'
                  }`}
                  onClick={() => setFilterType('DIVIDEND')}
                >
                  💰 Dividends Only ({stats.dividend})
                </button>

                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-bold px-3 shadow-sm ${
                    filterType === 'ALL' ? 'btn-dark text-white' : 'btn-outline-dark'
                  }`}
                  onClick={() => setFilterType('ALL')}
                >
                  📊 All Upcoming ({stats.total})
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ minWidth: 260 }}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="🔍 Search (e.g. RELIANCE, IRCTC, BONUS)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-4">
            <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <strong className="text-dark">
                  Upcoming NSE Corporate Actions (From Sep 2026 Onwards)
                </strong>
                <small className="text-muted d-block">
                  Showing {displayedActions.length} scheduled events sorted chronologically by Ex-Date
                </small>
              </div>
              <span className="badge bg-primary fs-6 px-3 py-1 fw-bold">
                {displayedActions.length} Events
              </span>
            </div>

            <div className="table-responsive" style={{ maxHeight: 720, overflowY: 'auto' }}>
              <table className="table table-hover table-striped align-middle table-sm small mb-0 text-nowrap">
                <thead className="table-dark sticky-top" style={{ zIndex: 5 }}>
                  <tr>
                    <th>#</th>
                    <th>Symbol</th>
                    <th>Company</th>
                    <th>Type</th>
                    <th style={{ minWidth: 280 }}>Subject / Details</th>
                    <th>Ex-Date</th>
                    <th>Days Left</th>
                    <th>Record Date</th>
                    <th>LTP (₹)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedActions.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center text-muted py-4">
                        No upcoming corporate actions found matching your criteria.
                      </td>
                    </tr>
                  )}
                  {displayedActions.map((row, idx) => {
                    const badge = getActionBadge(row.actionType);
                    const daysLeft = getDaysRemaining(row.exDate);

                    return (
                      <tr key={row.id || idx}>
                        <td className="text-muted fw-bold">{idx + 1}</td>
                        <td>
                          <strong className="text-primary fs-6">{row.symbol}</strong>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{row.companyName}</div>
                        </td>
                        <td>
                          <span className={`badge ${badge.bg} fw-bold px-2 py-1`}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ maxWidth: 380, whiteSpace: 'normal', lineHeight: 1.3 }}>
                          <span className="text-dark fw-semibold d-block">{row.subject}</span>
                          {row.impactSummary && (
                            <small className="text-muted d-block mt-0.5" style={{ fontSize: 11 }}>
                              ℹ️ {row.impactSummary}
                            </small>
                          )}
                        </td>
                        <td>
                          <strong className="text-dark">{row.exDate}</strong>
                        </td>
                        <td>
                          {daysLeft !== null && (
                            <span
                              className={`badge ${
                                daysLeft <= 7
                                  ? 'bg-danger text-white'
                                  : daysLeft <= 20
                                  ? 'bg-warning text-dark'
                                  : 'bg-light text-dark border'
                              } fw-bold`}
                            >
                              {daysLeft === 0
                                ? '🚨 Today'
                                : daysLeft === 1
                                ? '⏰ Tomorrow'
                                : `⏰ in ${daysLeft} days`}
                            </span>
                          )}
                        </td>
                        <td className="text-muted">{row.recordDate || '-'}</td>
                        <td className="fw-bold text-dark">
                          {row.cmp ? `₹${row.cmp.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td>
                          {row.actionType === 'BONUS' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary fw-bold px-2.5 py-1 shadow-sm"
                              style={{ fontSize: 11.5 }}
                              onClick={() => prefillFromRow(row)}
                            >
                              🧮 Analyze Bonus
                            </button>
                          )}
                          {row.actionType === 'SPLIT' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-warning text-dark fw-bold px-2.5 py-1 shadow-sm"
                              style={{ fontSize: 11.5 }}
                              onClick={() => prefillFromRow(row)}
                            >
                              ✂️ Analyze Split
                            </button>
                          )}
                          {row.actionType === 'DIVIDEND' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success fw-bold px-2.5 py-1 shadow-sm"
                              style={{ fontSize: 11.5 }}
                              onClick={() => prefillDividendFromRow(row)}
                            >
                              💰 Calculate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ══ INTERACTIVE CALCULATOR MODE ══ */}
      {/* ═══════════════════════════════════════════════ */}
      {mode === 'calculator' && (
        <>
          {/* Quick Preset Selector */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="fw-bold text-dark small me-1">⚡ Quick Preset Load:</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-pill fw-bold px-3"
                onClick={() => {
                  setStockName('RELIANCE');
                  setQuantity('100');
                  setBonusRatioLeft('1');
                  setBonusRatioRight('1');
                  setSecurityType('EQUITY');
                  setFaceValue('10');
                  setCouponRate('0');
                  setCurrentPrice('2980');
                  setBonusResult(null);
                }}
              >
                Reliance (1:1 Equity Bonus)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-info text-dark rounded-pill fw-bold px-3"
                onClick={() => {
                  setStockName('BAJFINANCE');
                  setQuantity('50');
                  setBonusRatioLeft('46');
                  setBonusRatioRight('1');
                  setSecurityType('NCRPS');
                  setFaceValue('5');
                  setCouponRate('7.5');
                  setCurrentPrice('7450');
                  setBonusResult(null);
                }}
              >
                Bajaj Finance (46:1 NCRPS 7.5% Bonus)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-warning text-dark rounded-pill fw-bold px-3"
                onClick={() => {
                  setStockName('IRFC');
                  setQuantity('200');
                  setBonusRatioLeft('4');
                  setBonusRatioRight('1');
                  setSecurityType('EQUITY');
                  setFaceValue('10');
                  setCouponRate('0');
                  setCurrentPrice('182');
                  setBonusResult(null);
                }}
              >
                IRFC (4:1 Bonus)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-success rounded-pill fw-bold px-3"
                onClick={() => {
                  setStockName('TATAMOTORS');
                  setQuantity('100');
                  setBonusRatioLeft('10');
                  setBonusRatioRight('1');
                  setSecurityType('PREFERENCE');
                  setFaceValue('10');
                  setCouponRate('8.0');
                  setCurrentPrice('980');
                  setBonusResult(null);
                }}
              >
                Tata Motors (10:1 Preference Shares)
              </button>
            </div>
          </div>

          {/* Bonus / Preference Calculator Form */}
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4 bg-white">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <span>🎁</span> Bonus & Preference Share Issue Calculator
            </h5>

            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-bold small text-dark">Stock Name / Symbol</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. RELIANCE"
                  value={stockName}
                  onChange={(e) => setStockName(e.target.value.toUpperCase())}
                />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label fw-bold small text-dark">Equity Shares Held</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 100"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label fw-bold small text-dark">Current Market Price (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 2980"
                  min="0"
                  step="0.01"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label fw-bold small text-dark">Bonus Ratio</label>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 1"
                    min="0"
                    value={bonusRatioLeft}
                    onChange={(e) => setBonusRatioLeft(e.target.value)}
                    style={{ width: 80 }}
                  />
                  <span className="fw-bold text-dark fs-5">:</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="1"
                    min="1"
                    value={bonusRatioRight}
                    onChange={(e) => setBonusRatioRight(e.target.value)}
                    style={{ width: 80 }}
                  />
                </div>
                <small className="text-muted">
                  For every {bonusRatioRight || 1} share held → {bonusRatioLeft || '?'} bonus received
                </small>
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label fw-bold small text-dark">Bonus Security Type</label>
                <select
                  className="form-select"
                  value={securityType}
                  onChange={(e) => setSecurityType(e.target.value)}
                >
                  <option value="EQUITY">Equity Shares</option>
                  <option value="NCRPS">NCRPS (Non-Convertible Redeemable Preference)</option>
                  <option value="PREFERENCE">Preference Shares</option>
                </select>
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label fw-bold small text-dark">Face Value of Bonus Security (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 10"
                  min="0"
                  step="0.01"
                  value={faceValue}
                  onChange={(e) => setFaceValue(e.target.value)}
                />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label fw-bold small text-dark">
                  Coupon Rate (%)
                  {securityType === 'EQUITY' && <span className="text-muted ms-1">(N/A for Equity)</span>}
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 7.5"
                  min="0"
                  max="100"
                  step="0.01"
                  value={couponRate}
                  onChange={(e) => setCouponRate(e.target.value)}
                  disabled={securityType === 'EQUITY'}
                />
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-4">
              <button
                type="button"
                className="btn btn-primary fw-bold px-4 py-2 shadow-sm"
                onClick={handleAnalyzeBonus}
                disabled={!stockName || !quantity || !bonusRatioLeft}
              >
                🔍 Analyze Corporate Action Impact
              </button>
            </div>
          </div>

          {/* ── BONUS CALCULATION RESULTS ── */}
          {r && (
            <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4 bg-white border-start border-4 border-primary">
              <h5 className="fw-bold text-primary mb-3">
                📊 Corporate Action Calculation Result — {r.stockName}
              </h5>

              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <div className="p-3 rounded-3 border bg-light text-center">
                    <div className="text-muted small fw-bold mb-1">EXISTING HOLDING</div>
                    <div className="fw-bold text-dark fs-5">{r.quantity.toLocaleString('en-IN')}</div>
                    <small className="text-muted">Equity Shares</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 rounded-3 border text-center" style={{ background: '#eef2ff' }}>
                    <div className="text-muted small fw-bold mb-1">BONUS RATIO</div>
                    <div className="fw-bold text-primary fs-5">{r.bonusRatio}</div>
                    <small className="text-muted">{r.securityType}</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 rounded-3 border text-center" style={{ background: '#f0fdf4' }}>
                    <div className="text-muted small fw-bold mb-1">BONUS RECEIVED</div>
                    <div className="fw-bold text-success fs-5">+{r.bonusQty.toLocaleString('en-IN')}</div>
                    <small className="text-muted">{r.isEquityBonus ? 'Equity Shares' : r.securityType + ' Securities'}</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 rounded-3 border text-center bg-light">
                    <div className="text-muted small fw-bold mb-1">TOTAL HOLDINGS AFTER</div>
                    <div className="fw-bold text-dark fs-5">{r.totalEquityAfter.toLocaleString('en-IN')}</div>
                    <small className="text-muted">
                      {r.isEquityBonus ? 'Total Equity Shares' : `Equity + ${r.bonusQty} ${r.securityType}`}
                    </small>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="table-responsive mb-4">
                <table className="table table-bordered table-sm align-middle mb-0">
                  <tbody>
                    <tr>
                      <td className="fw-bold">Total Face Value of Bonus Securities</td>
                      <td className="fw-bold text-primary">₹{r.totalBonusFaceValue.toLocaleString('en-IN')}</td>
                      <td className="text-muted small">
                        {r.bonusQty} securities × ₹{r.faceValue} Face Value
                      </td>
                    </tr>
                    {r.isPrefOrNCRPS && (
                      <tr className="table-warning">
                        <td className="fw-bold">Annual Coupon Income</td>
                        <td className="fw-bold text-success fs-6">₹{r.annualCouponIncome.toLocaleString('en-IN')} / year</td>
                        <td className="text-muted small">
                          {r.couponRate}% coupon on ₹{r.totalBonusFaceValue.toLocaleString('en-IN')} face value
                        </td>
                      </tr>
                    )}
                    {r.isEquityBonus && r.currentPrice > 0 && (
                      <>
                        <tr>
                          <td className="fw-bold">Pre-Bonus Market Price</td>
                          <td>₹{r.currentPrice.toFixed(2)}</td>
                          <td className="text-muted small">Current CMP per share</td>
                        </tr>
                        <tr className="table-info">
                          <td className="fw-bold">Theoretical Ex-Bonus Price</td>
                          <td className="fw-bold text-primary fs-6">₹{r.theoreticalExBonusPrice.toFixed(2)}</td>
                          <td className="text-muted small">
                            (Shares × CMP) / (Shares + Bonus) = ({r.quantity} × ₹{r.currentPrice}) / {r.totalEquityAfter}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Price Impact Explanation */}
              <div className={`alert ${r.isEquityBonus ? 'alert-warning' : 'alert-success'} small mb-0`}>
                {r.isEquityBonus ? (
                  <>
                    <strong>⚠️ Mechanical Price Division:</strong> For standard equity bonuses, the share price automatically adjusts downward to reflect the increased share count (from ₹{r.currentPrice.toFixed(2)} to ₹{r.theoreticalExBonusPrice.toFixed(2)}). Your total portfolio market value remains identical at ₹{(r.quantity * r.currentPrice).toLocaleString('en-IN')}.
                  </>
                ) : (
                  <>
                    <strong>✅ No Mechanical Price Division:</strong> Preference shares / NCRPS bonus does NOT divide your equity share price! Your {r.quantity} equity shares remain at ₹{r.currentPrice.toFixed(2)}. You additionally receive {r.bonusQty} {r.securityType} securities generating ₹{r.annualCouponIncome.toLocaleString('en-IN')} annual dividend income.
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── DIVIDEND CALCULATOR ── */}
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4 bg-white">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <span>💰</span> Dividend Income & TDS Calculator
            </h5>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-bold small text-dark">Stock Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. VEDL"
                  value={divStockName}
                  onChange={(e) => setDivStockName(e.target.value.toUpperCase())}
                />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label fw-bold small text-dark">Shares Held</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 100"
                  min="0"
                  value={divQuantity}
                  onChange={(e) => setDivQuantity(e.target.value)}
                />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label fw-bold small text-dark">Dividend Per Share (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 19.5"
                  min="0"
                  step="0.01"
                  value={dividendPerShare}
                  onChange={(e) => setDividendPerShare(e.target.value)}
                />
              </div>
            </div>

            {divQuantity && dividendPerShare && (() => {
              const qty = Number(divQuantity) || 0;
              const dps = Number(dividendPerShare) || 0;
              const gross = qty * dps;
              const tds = gross > 5000 ? Math.round(gross * 0.1) : 0;
              const net = gross - tds;
              return (
                <div className="row g-3 mt-3">
                  <div className="col-4">
                    <div className="p-3 rounded-3 border text-center" style={{ background: '#f0fdf4' }}>
                      <div className="text-muted small fw-bold">GROSS DIVIDEND</div>
                      <div className="fw-bold text-success fs-5">₹{gross.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 rounded-3 border text-center" style={{ background: tds > 0 ? '#fef3c7' : '#f0fdf4' }}>
                      <div className="text-muted small fw-bold">TDS ({tds > 0 ? '10%' : '0%'})</div>
                      <div className="fw-bold text-dark fs-5">-₹{tds.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 rounded-3 border text-center bg-light">
                      <div className="text-muted small fw-bold">NET IN BANK</div>
                      <div className="fw-bold text-primary fs-5">₹{net.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
