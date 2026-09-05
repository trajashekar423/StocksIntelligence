'use client';

import { useState, useMemo, useCallback } from 'react';

/* ================================================================
   STOCK BONUS / DIVIDEND ANALYZER
   ----------------------------------------------------------------
   Interactive calculator for Indian stock corporate actions:
   • Equity bonus shares
   • Preference shares / NCRPS bonus
   • Dividend income calculation
   ================================================================ */

// ── Preset examples for quick demo ──
const PRESET_EXAMPLES = [
  {
    label: 'Equity Bonus (1:1)',
    stockName: 'RELIANCE',
    quantity: 100,
    bonusRatioLeft: 1,
    bonusRatioRight: 1,
    securityType: 'EQUITY',
    faceValue: 10,
    couponRate: 0,
    recordDate: '',
    currentPrice: 1280,
  },
  {
    label: 'NCRPS Bonus (46:1)',
    stockName: 'BAJAJ FINANCE',
    quantity: 50,
    bonusRatioLeft: 46,
    bonusRatioRight: 1,
    securityType: 'NCRPS',
    faceValue: 5,
    couponRate: 7.5,
    recordDate: '',
    currentPrice: 7850,
  },
  {
    label: 'Preference Share Bonus (10:1)',
    stockName: 'TATA MOTORS',
    quantity: 200,
    bonusRatioLeft: 10,
    bonusRatioRight: 1,
    securityType: 'PREFERENCE',
    faceValue: 10,
    couponRate: 8,
    recordDate: '',
    currentPrice: 620,
  },
  {
    label: 'Equity Bonus (2:1)',
    stockName: 'INFOSYS',
    quantity: 150,
    bonusRatioLeft: 2,
    bonusRatioRight: 1,
    securityType: 'EQUITY',
    faceValue: 5,
    couponRate: 0,
    recordDate: '',
    currentPrice: 1550,
  },
];

// ── Core analyzer ──
function analyzeBonusIssue({
  stockName,
  quantity,
  bonusRatioLeft,
  bonusRatioRight,
  securityType,
  faceValue,
  couponRate,
  currentPrice,
  recordDate,
}) {
  const qty = Math.max(Number(quantity) || 0, 0);
  const left = Math.max(Number(bonusRatioLeft) || 0, 0);
  const right = Math.max(Number(bonusRatioRight) || 1, 1);
  const fv = Math.max(Number(faceValue) || 0, 0);
  const coupon = Math.max(Number(couponRate) || 0, 0);
  const cmp = Math.max(Number(currentPrice) || 0, 0);
  const type = (securityType || 'EQUITY').toUpperCase();

  const isEquityBonus = type === 'EQUITY';
  const isPrefOrNCRPS = type === 'NCRPS' || type === 'PREFERENCE' || type === 'PREF';

  // Bonus securities received
  const bonusQty = Math.floor((qty * left) / right);
  const totalBonusFaceValue = bonusQty * fv;
  const annualCouponIncome = isPrefOrNCRPS ? Math.round(totalBonusFaceValue * coupon / 100) : 0;

  // Holdings after bonus
  const totalEquityAfter = isEquityBonus ? qty + bonusQty : qty;
  const totalBonusSecurities = bonusQty;

  // Theoretical ex-bonus price
  let theoreticalExBonusPrice = cmp;
  let priceImpactExplanation = '';

  if (isEquityBonus && cmp > 0 && qty > 0) {
    // For equity bonus, total shares increase → price adjusts proportionally
    // Old value = qty × CMP = New shares × Ex-bonus price
    // Ex-bonus price = (qty × CMP) / (qty + bonusQty)
    theoreticalExBonusPrice = (qty * cmp) / (qty + bonusQty);
    priceImpactExplanation =
      `YES — Equity bonus increases total shares. The theoretical ex-bonus price adjusts downward.\n` +
      `Formula: Ex-Bonus Price = (Shares × CMP) / (Shares + Bonus) = (${qty} × ₹${cmp.toFixed(2)}) / ${qty + bonusQty} = ₹${theoreticalExBonusPrice.toFixed(2)}\n` +
      `Your total market value remains the same: ${qty + bonusQty} shares × ₹${theoreticalExBonusPrice.toFixed(2)} = ₹${((qty + bonusQty) * theoreticalExBonusPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  } else if (isPrefOrNCRPS) {
    priceImpactExplanation =
      `NO — Preference share / NCRPS bonus does NOT mechanically divide the equity share price.\n` +
      `Your ${qty} equity shares remain priced at ₹${cmp.toFixed(2)} each.\n` +
      `The ${bonusQty} bonus ${type} securities are a separate instrument with face value ₹${fv} each and ${coupon}% annual coupon.\n` +
      `You receive coupon income of ₹${annualCouponIncome.toLocaleString('en-IN')} per year on top of your equity holdings.`;
  }

  // Market value calculations
  const preActionMarketValue = qty * cmp;
  const postActionEquityMarketValue = isEquityBonus
    ? totalEquityAfter * theoreticalExBonusPrice
    : qty * cmp;
  const bonusSecuritiesValue = isPrefOrNCRPS ? totalBonusFaceValue : bonusQty * theoreticalExBonusPrice;

  return {
    stockName: stockName || 'N/A',
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
    recordDate: recordDate || 'Not specified',
    bonusQty,
    totalBonusFaceValue,
    annualCouponIncome,
    totalEquityAfter,
    totalBonusSecurities,
    theoreticalExBonusPrice,
    priceImpactExplanation,
    preActionMarketValue,
    postActionEquityMarketValue,
    bonusSecuritiesValue,
  };
}

// ── Dividend Calculator ──
function calculateDividend({ quantity, dividendPerShare, dividendType }) {
  const qty = Number(quantity) || 0;
  const dps = Number(dividendPerShare) || 0;
  const grossDividend = qty * dps;
  const tdsRate = dividendType === 'SPECIAL' ? 10 : (grossDividend > 5000 ? 10 : 0);
  const tdsAmount = Math.round(grossDividend * tdsRate / 100);
  const netDividend = grossDividend - tdsAmount;

  return {
    quantity: qty,
    dividendPerShare: dps,
    grossDividend,
    tdsRate,
    tdsAmount,
    netDividend,
    dividendType: dividendType || 'INTERIM',
  };
}

export default function StockBonusDividend() {
  // ── Active mode: bonus vs dividend ──
  const [mode, setMode] = useState('bonus');

  // ── Bonus form state ──
  const [stockName, setStockName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [bonusRatioLeft, setBonusRatioLeft] = useState('');
  const [bonusRatioRight, setBonusRatioRight] = useState('1');
  const [securityType, setSecurityType] = useState('EQUITY');
  const [faceValue, setFaceValue] = useState('');
  const [couponRate, setCouponRate] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');

  // ── Dividend form state ──
  const [divQuantity, setDivQuantity] = useState('');
  const [dividendPerShare, setDividendPerShare] = useState('');
  const [dividendType, setDividendType] = useState('INTERIM');
  const [divStockName, setDivStockName] = useState('');

  // ── Analysis results ──
  const [bonusResult, setBonusResult] = useState(null);
  const [dividendResult, setDividendResult] = useState(null);

  // ── History log ──
  const [history, setHistory] = useState([]);

  const handleAnalyzeBonus = useCallback(() => {
    const result = analyzeBonusIssue({
      stockName,
      quantity,
      bonusRatioLeft,
      bonusRatioRight,
      securityType,
      faceValue,
      couponRate,
      currentPrice,
      recordDate,
    });
    setBonusResult(result);
    setHistory((prev) => [{ type: 'BONUS', ...result, timestamp: new Date().toLocaleString('en-IN') }, ...prev].slice(0, 20));
  }, [stockName, quantity, bonusRatioLeft, bonusRatioRight, securityType, faceValue, couponRate, currentPrice, recordDate]);

  const handleCalculateDividend = useCallback(() => {
    const result = calculateDividend({
      quantity: divQuantity,
      dividendPerShare,
      dividendType,
    });
    setDividendResult(result);
    setHistory((prev) => [{ type: 'DIVIDEND', stockName: divStockName, ...result, timestamp: new Date().toLocaleString('en-IN') }, ...prev].slice(0, 20));
  }, [divQuantity, dividendPerShare, dividendType, divStockName]);

  const loadPreset = useCallback((preset) => {
    setStockName(preset.stockName);
    setQuantity(String(preset.quantity));
    setBonusRatioLeft(String(preset.bonusRatioLeft));
    setBonusRatioRight(String(preset.bonusRatioRight));
    setSecurityType(preset.securityType);
    setFaceValue(String(preset.faceValue));
    setCouponRate(String(preset.couponRate));
    setCurrentPrice(String(preset.currentPrice));
    setRecordDate(preset.recordDate || '');
    setBonusResult(null);
  }, []);

  const clearBonusForm = useCallback(() => {
    setStockName('');
    setQuantity('');
    setBonusRatioLeft('');
    setBonusRatioRight('1');
    setSecurityType('EQUITY');
    setFaceValue('');
    setCouponRate('');
    setRecordDate('');
    setCurrentPrice('');
    setBonusResult(null);
  }, []);

  const r = bonusResult;
  const d = dividendResult;

  return (
    <div className="stock-bonus-dividend-module w-100 mb-5">
      {/* ── HEADER ── */}
      <div
        className="card border-0 shadow-sm rounded-4 overflow-hidden text-white mb-4 p-4"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 50%, #203a43 100%)' }}
      >
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="fs-3">🎁</span>
              <h4 className="mb-0 fw-bold">Stock Bonus & Dividend Analyzer</h4>
              <span className="badge bg-warning text-dark fw-bold px-2 py-1 small">INDIAN MARKETS</span>
            </div>
            <p className="text-light opacity-75 small mb-0 mt-1">
              Calculate exact bonus shares, NCRPS/preference share income, theoretical ex-bonus price, and dividend payouts with TDS.
            </p>
          </div>
        </div>
      </div>

      {/* ── MODE TOGGLE: BONUS vs DIVIDEND ── */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <button
          type="button"
          className={`btn fw-bold px-4 py-2 rounded-pill shadow-sm ${mode === 'bonus' ? 'btn-primary text-white' : 'btn-outline-primary'}`}
          onClick={() => setMode('bonus')}
        >
          🎁 Bonus Issue Analyzer
        </button>
        <button
          type="button"
          className={`btn fw-bold px-4 py-2 rounded-pill shadow-sm ${mode === 'dividend' ? 'btn-success text-white' : 'btn-outline-success'}`}
          onClick={() => setMode('dividend')}
        >
          💰 Dividend Calculator
        </button>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* ══ BONUS ISSUE ANALYZER ══ */}
      {/* ═══════════════════════════════════════════════ */}
      {mode === 'bonus' && (
        <>
          {/* Quick Preset Examples */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span className="fw-bold text-dark small">⚡ Quick Examples:</span>
              {PRESET_EXAMPLES.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="btn btn-sm btn-outline-primary rounded-pill fw-semibold px-3"
                  onClick={() => loadPreset(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4 bg-white">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <span>📝</span> Bonus Issue Input
            </h5>

            <div className="row g-3">
              {/* Stock Name */}
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

              {/* Current Shares */}
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

              {/* Current Market Price */}
              <div className="col-6 col-md-4">
                <label className="form-label fw-bold small text-dark">Current Market Price (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 1280"
                  min="0"
                  step="0.01"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                />
              </div>

              {/* Bonus Ratio */}
              <div className="col-6 col-md-3">
                <label className="form-label fw-bold small text-dark">Bonus Ratio</label>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 46"
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
                <small className="text-muted">For every {bonusRatioRight || 1} share → {bonusRatioLeft || '?'} bonus</small>
              </div>

              {/* Security Type */}
              <div className="col-6 col-md-3">
                <label className="form-label fw-bold small text-dark">Bonus Security Type</label>
                <select
                  className="form-select"
                  value={securityType}
                  onChange={(e) => setSecurityType(e.target.value)}
                >
                  <option value="EQUITY">Equity Shares</option>
                  <option value="NCRPS">NCRPS (Non-Convertible Redeemable Preference Shares)</option>
                  <option value="PREFERENCE">Preference Shares</option>
                </select>
              </div>

              {/* Face Value */}
              <div className="col-6 col-md-3">
                <label className="form-label fw-bold small text-dark">Face Value of Bonus Security (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 5"
                  min="0"
                  step="0.01"
                  value={faceValue}
                  onChange={(e) => setFaceValue(e.target.value)}
                />
              </div>

              {/* Coupon Rate */}
              <div className="col-6 col-md-3">
                <label className="form-label fw-bold small text-dark">
                  Coupon Rate (%)
                  {securityType === 'EQUITY' && <span className="text-muted ms-1">(N/A for equity)</span>}
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

              {/* Record Date */}
              <div className="col-6 col-md-3">
                <label className="form-label fw-bold small text-dark">Record Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex flex-wrap gap-2 mt-4">
              <button
                type="button"
                className="btn btn-primary fw-bold px-4 py-2 shadow-sm"
                onClick={handleAnalyzeBonus}
                disabled={!stockName || !quantity || !bonusRatioLeft}
              >
                🔍 Analyze Bonus Issue
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary fw-bold px-4 py-2"
                onClick={clearBonusForm}
              >
                🗑️ Clear
              </button>
            </div>
          </div>

          {/* ── BONUS RESULT ── */}
          {r && (
            <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4 bg-white border-start border-4 border-primary">
              <h5 className="fw-bold text-primary mb-3 d-flex align-items-center gap-2">
                <span>📊</span> Bonus Analysis Result — {r.stockName}
              </h5>

              {/* Summary Cards */}
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <div className="p-3 rounded-3 border bg-light text-center">
                    <div className="text-muted small fw-bold mb-1">STOCK</div>
                    <div className="fw-bold text-dark fs-5">{r.stockName}</div>
                    <small className="text-muted">CMP: ₹{r.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 rounded-3 border bg-light text-center">
                    <div className="text-muted small fw-bold mb-1">YOUR HOLDING</div>
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
                    <div className="fw-bold text-success fs-5">{r.bonusQty.toLocaleString('en-IN')}</div>
                    <small className="text-muted">{r.isEquityBonus ? 'Equity Shares' : r.securityType + ' Securities'}</small>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Table */}
              <div className="table-responsive mb-4">
                <table className="table table-bordered table-sm align-middle mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Parameter</th>
                      <th>Value</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="fw-bold">Existing Equity Shares</td>
                      <td className="fw-bold text-dark">{r.quantity.toLocaleString('en-IN')}</td>
                      <td className="text-muted small">Your current holding</td>
                    </tr>
                    <tr className="table-success">
                      <td className="fw-bold">Bonus Securities Received</td>
                      <td className="fw-bold text-success fs-6">+{r.bonusQty.toLocaleString('en-IN')} {r.isEquityBonus ? 'Equity Shares' : r.securityType}</td>
                      <td className="text-muted small">{r.bonusRatio} → For every {r.bonusRatioRight} share, receive {r.bonusRatioLeft} bonus {r.securityType.toLowerCase()}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Face Value per Bonus Security</td>
                      <td>₹{r.faceValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="text-muted small">Par / nominal value</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Total Face Value of Bonus</td>
                      <td className="fw-bold text-primary">₹{r.totalBonusFaceValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="text-muted small">{r.bonusQty} × ₹{r.faceValue} = ₹{r.totalBonusFaceValue.toLocaleString('en-IN')}</td>
                    </tr>
                    {r.isPrefOrNCRPS && (
                      <tr className="table-warning">
                        <td className="fw-bold">Annual Coupon Income</td>
                        <td className="fw-bold text-success fs-6">₹{r.annualCouponIncome.toLocaleString('en-IN')}</td>
                        <td className="text-muted small">{r.couponRate}% of ₹{r.totalBonusFaceValue.toLocaleString('en-IN')} face value per year</td>
                      </tr>
                    )}
                    <tr className="table-info">
                      <td className="fw-bold">After Bonus — Total Holdings</td>
                      <td className="fw-bold text-dark fs-6">
                        {r.totalEquityAfter.toLocaleString('en-IN')} Equity Shares
                        {r.isPrefOrNCRPS && <> + {r.totalBonusSecurities.toLocaleString('en-IN')} {r.securityType}</>}
                      </td>
                      <td className="text-muted small">
                        {r.isEquityBonus
                          ? `${r.quantity} original + ${r.bonusQty} bonus = ${r.totalEquityAfter} total equity`
                          : `${r.quantity} equity shares + ${r.bonusQty} bonus ${r.securityType} securities`
                        }
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Record Date</td>
                      <td>{r.recordDate || 'Not specified'}</td>
                      <td className="text-muted small">Must hold shares on this date to qualify</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Price Impact Section */}
              <div
                className="p-3 rounded-3 mb-4 border"
                style={{
                  background: r.isEquityBonus
                    ? 'linear-gradient(135deg, #fef3c7, #fff7ed)'
                    : 'linear-gradient(135deg, #d1fae5, #ecfdf5)',
                }}
              >
                <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                  <span>{r.isEquityBonus ? '📉' : '✅'}</span>
                  Price Impact on Equity Share
                </h6>

                {r.isEquityBonus ? (
                  <div>
                    <div className="row g-3 mb-2">
                      <div className="col-6 col-md-3">
                        <div className="p-2 rounded bg-white border text-center">
                          <div className="text-muted small">Pre-Bonus Price</div>
                          <div className="fw-bold text-dark fs-6">₹{r.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="p-2 rounded bg-white border text-center">
                          <div className="text-muted small">Theoretical Ex-Bonus Price</div>
                          <div className="fw-bold text-primary fs-6">₹{r.theoreticalExBonusPrice.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="p-2 rounded bg-white border text-center">
                          <div className="text-muted small">Pre-Bonus Value</div>
                          <div className="fw-bold text-dark">₹{r.preActionMarketValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="p-2 rounded bg-white border text-center">
                          <div className="text-muted small">Post-Bonus Value</div>
                          <div className="fw-bold text-success">₹{r.postActionEquityMarketValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                    </div>
                    <div className="alert alert-warning mb-0 small">
                      <strong>⚠️ Price will adjust:</strong> The equity price mechanically divides because total shares increase.
                      Your total portfolio value stays the same — you just own more shares at a lower price per share.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="row g-3 mb-2">
                      <div className="col-6 col-md-4">
                        <div className="p-2 rounded bg-white border text-center">
                          <div className="text-muted small">Equity Price (Unchanged)</div>
                          <div className="fw-bold text-dark fs-6">₹{r.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                      <div className="col-6 col-md-4">
                        <div className="p-2 rounded bg-white border text-center">
                          <div className="text-muted small">Equity Portfolio Value</div>
                          <div className="fw-bold text-dark">₹{r.preActionMarketValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <div className="p-2 rounded bg-white border text-center">
                          <div className="text-muted small">+ Bonus {r.securityType} Face Value</div>
                          <div className="fw-bold text-success">₹{r.totalBonusFaceValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                    </div>
                    <div className="alert alert-success mb-0 small">
                      <strong>✅ Price does NOT adjust:</strong> Preference/NCRPS bonus is a separate security class.
                      Your equity shares remain at ₹{r.currentPrice.toFixed(2)} each. You additionally receive ₹{r.annualCouponIncome.toLocaleString('en-IN')} annual coupon income.
                    </div>
                  </div>
                )}
              </div>

              {/* Investor Example */}
              <div className="p-3 rounded-3 border bg-light">
                <h6 className="fw-bold text-dark mb-2">📋 Investor Example Summary</h6>
                <div className="small text-dark" style={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                  <strong>Stock:</strong> {r.stockName}{'\n'}
                  <strong>Holding:</strong> {r.quantity.toLocaleString('en-IN')} equity shares @ ₹{r.currentPrice.toFixed(2)}{'\n'}
                  <strong>Bonus:</strong> {r.bonusRatio} → {r.securityType}{'\n'}
                  <strong>Investor Receives:</strong> {r.bonusQty.toLocaleString('en-IN')} bonus {r.isEquityBonus ? 'equity shares' : r.securityType + ' securities'}{'\n'}
                  <strong>Face Value:</strong> ₹{r.totalBonusFaceValue.toLocaleString('en-IN')}{'\n'}
                  {r.isPrefOrNCRPS && <><strong>Annual Coupon Income:</strong> ₹{r.annualCouponIncome.toLocaleString('en-IN')} ({r.couponRate}% p.a.){'\n'}</>}
                  <strong>After Bonus:</strong> {r.totalEquityAfter.toLocaleString('en-IN')} equity shares{r.isPrefOrNCRPS ? ` + ${r.totalBonusSecurities.toLocaleString('en-IN')} ${r.securityType} securities` : ''}{'\n'}
                  {r.isEquityBonus && <><strong>Theoretical Ex-Bonus Price:</strong> ₹{r.theoreticalExBonusPrice.toFixed(2)} (from ₹{r.currentPrice.toFixed(2)}){'\n'}</>}
                  <strong>Price Impact:</strong> {r.isEquityBonus ? 'YES — Price adjusts downward proportionally' : 'NO — Equity price remains unchanged'}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ══ DIVIDEND CALCULATOR ══ */}
      {/* ═══════════════════════════════════════════════ */}
      {mode === 'dividend' && (
        <>
          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4 bg-white">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <span>💰</span> Dividend Income Calculator
            </h5>

            <div className="row g-3">
              <div className="col-12 col-md-3">
                <label className="form-label fw-bold small text-dark">Stock Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. TCS"
                  value={divStockName}
                  onChange={(e) => setDivStockName(e.target.value.toUpperCase())}
                />
              </div>
              <div className="col-6 col-md-3">
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
              <div className="col-6 col-md-3">
                <label className="form-label fw-bold small text-dark">Dividend Per Share (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 28"
                  min="0"
                  step="0.01"
                  value={dividendPerShare}
                  onChange={(e) => setDividendPerShare(e.target.value)}
                />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label fw-bold small text-dark">Dividend Type</label>
                <select
                  className="form-select"
                  value={dividendType}
                  onChange={(e) => setDividendType(e.target.value)}
                >
                  <option value="INTERIM">Interim Dividend</option>
                  <option value="FINAL">Final Dividend</option>
                  <option value="SPECIAL">Special Dividend</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <button
                type="button"
                className="btn btn-success fw-bold px-4 py-2 shadow-sm"
                onClick={handleCalculateDividend}
                disabled={!divQuantity || !dividendPerShare}
              >
                💰 Calculate Dividend
              </button>
            </div>
          </div>

          {/* Dividend Result */}
          {d && (
            <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4 bg-white border-start border-4 border-success">
              <h5 className="fw-bold text-success mb-3">💰 Dividend Result — {divStockName || 'Stock'}</h5>
              <div className="row g-3 mb-3">
                <div className="col-6 col-md-3">
                  <div className="p-3 rounded-3 border bg-light text-center">
                    <div className="text-muted small fw-bold mb-1">SHARES</div>
                    <div className="fw-bold text-dark fs-5">{d.quantity.toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 rounded-3 border bg-light text-center">
                    <div className="text-muted small fw-bold mb-1">DIVIDEND/SHARE</div>
                    <div className="fw-bold text-dark fs-5">₹{d.dividendPerShare.toFixed(2)}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 rounded-3 border text-center" style={{ background: '#f0fdf4' }}>
                    <div className="text-muted small fw-bold mb-1">GROSS DIVIDEND</div>
                    <div className="fw-bold text-success fs-5">₹{d.grossDividend.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 rounded-3 border text-center" style={{ background: d.tdsAmount > 0 ? '#fef3c7' : '#f0fdf4' }}>
                    <div className="text-muted small fw-bold mb-1">NET DIVIDEND (After TDS)</div>
                    <div className="fw-bold text-dark fs-5">₹{d.netDividend.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>

              {d.tdsAmount > 0 && (
                <div className="alert alert-warning small mb-0">
                  <strong>⚠️ TDS Deduction:</strong> {d.tdsRate}% TDS = ₹{d.tdsAmount.toLocaleString('en-IN')} deducted at source
                  (applicable when dividend exceeds ₹5,000 in a financial year or for special dividends).
                  You can claim this as a credit when filing your ITR.
                </div>
              )}
              {d.tdsAmount === 0 && (
                <div className="alert alert-success small mb-0">
                  <strong>✅ No TDS:</strong> Dividend is below ₹5,000 threshold — full amount credited to your bank account.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── HISTORY LOG ── */}
      {history.length > 0 && (
        <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="fw-bold text-dark mb-0">📜 Calculation History ({history.length})</h6>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => setHistory([])}
            >
              Clear History
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-sm table-striped align-middle small mb-0">
              <thead className="table-light">
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Stock</th>
                  <th>Details</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td className="text-muted">{h.timestamp}</td>
                    <td>
                      <span className={`badge ${h.type === 'BONUS' ? 'bg-primary' : 'bg-success'} text-white`}>
                        {h.type}
                      </span>
                    </td>
                    <td className="fw-bold">{h.stockName}</td>
                    <td>
                      {h.type === 'BONUS'
                        ? `${h.quantity} shares, ${h.bonusRatio} ${h.securityType}`
                        : `${h.quantity} shares × ₹${h.dividendPerShare}`
                      }
                    </td>
                    <td className="fw-bold text-success">
                      {h.type === 'BONUS'
                        ? `+${h.bonusQty} bonus securities`
                        : `₹${h.netDividend?.toLocaleString('en-IN')}`
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
