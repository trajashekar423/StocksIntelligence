'use client';

import { MARKET_INTELLIGENCE_TABS } from './marketIntelligence';

export default function TopIntraday({ activeTab, onChange }) {
  const tabs = [
    ...MARKET_INTELLIGENCE_TABS,
    { key: 'practice-trading', label: '🎓 Practice Stock Market (Dummy Funds)', tone: 'gold' },
    { key: 'risk-monitor', label: '🛡️ Position Risk Monitor', tone: 'orange' },
    { key: 'nifty50', label: '🇮🇳 NIFTY50', tone: 'green' },
    { key: 'watchfornextday', label: '🔮 Watch For Next Day', tone: 'green' },
    { key: 'block-deals', label: '🏢 Block Deals', tone: 'green' },
    { key: 'bigshot-radar', label: '⭐ BigShot Radar (5x Vol & Mega Blocks)', tone: 'gold' },
    { key: 'confluence-quant', label: '🎯 Confluence Quant Scanner (Long/Short)', tone: 'gold' },
    { key: 'tomorrow', label: 'Tomorrow Intraday', tone: 'green' },
    { key: 'top', label: 'Top Gainers', tone: 'green' },
    { key: 'mystocks', label: '💼 My Portfolio', tone: 'green' },
    { key: 'candlestick-guide', label: '🕯️ Candlestick Guide', tone: 'green' },
    { key: 'trading', label: '⚡ Groww Intraday Trading', tone: 'green' },
    { key: 'momentum', label: '🚀 Momentum Scanner', tone: 'green' },
    { key: 'fno', label: '📊 F&O Options Engine', tone: 'orange' },
  ];

  return (
    <div className="st-tab-strip" role="tablist" aria-label="Stocks tabs">
      {tabs.map(({ key, label, tone = 'neutral' }) => (
        <button
          key={key}
          type="button"
          className={`st-tab-btn st-tab-btn--${tone} ${activeTab === key ? 'active' : ''}`}
          onClick={() => onChange?.(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
