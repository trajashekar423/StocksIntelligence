import { MARKET_INTELLIGENCE_TABS } from './marketIntelligence';

export default function TopIntraday({ activeTab, onChange }) {
  const tabs = [
    ...MARKET_INTELLIGENCE_TABS,
    { key: 'tomorrow', label: 'Tomorrow Intraday', tone: 'green' },
    { key: 'avoid', label: 'Avoid Today', tone: 'red' },
    { key: 'top', label: 'Top Gainers', tone: 'green' },
    { key: 'most', label: 'MOST ACTIVE', tone: 'orange' },
    { key: 'mystocks', label: 'MyStocks', tone: 'green' },
    // { key: 'cupid', label: 'CUPID', tone: 'neutral' },
    // { key: 'basic-industry', label: 'Basic Industry', tone: 'neutral' },
    // { key: 'personal-care', label: 'Personal Care', tone: 'neutral' },
    { key: 'momentum', label: '🚀 Momentum Scanner', tone: 'green' },
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
