import { useState, useEffect, useMemo } from 'react';
import { RiSearchLine } from 'react-icons/ri';
import { getTransactions, exportTransactions } from '../services/transactionsService';
import TransactionsTable from '../components/transactions/TransactionsTable';
import ExportButton      from '../components/common/ExportButton';

const FILTER_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'EARNED', label: 'Earned' },
  { value: 'REDEEMED', label: 'Redeemed' },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [activeType,   setActiveType]   = useState('ALL');
  const [store,        setStore]        = useState('All Stores');
  const [txError,      setTxError]      = useState(false);

  useEffect(() => {
    getTransactions()
      .then(setTransactions)
      .catch(() => setTxError(true));
  }, []);

  const stores = useMemo(() => {
    const uniqueStores = [...new Set(transactions.map((t) => t.location).filter(Boolean))];
    return ['All Stores', ...uniqueStores];
  }, [transactions]);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return transactions.filter((transaction) => {
      if (activeType !== 'ALL' && transaction.type !== activeType) return false;
      if (store !== 'All Stores' && transaction.location !== store) return false;

      if (!query) return true;

      return [
        transaction.customerName,
        transaction.phone,
        transaction.description,
        transaction.location,
      ].some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [transactions, searchTerm, activeType, store]);

  const hasActiveFilters = Boolean(searchTerm.trim()) || activeType !== 'ALL' || store !== 'All Stores';

  return (
    <div className="tx-page">
      <div className="tx-page-header">
        <div>
          <h5 className="pg-title">Transactions</h5>
          <p className="pg-sub">Full history of points earned and redeemed.</p>
        </div>
        <div className="tx-actions tx-actions--top">
          <ExportButton onClick={() => exportTransactions(filtered)} />
        </div>
      </div>

      {txError && (
        <div className="rw-error-banner">
          Failed to load transactions.
          <button onClick={() => setTxError(false)} aria-label="Dismiss">x</button>
        </div>
      )}

      <div className="tx-toolbar">
        <div className="tx-toolbar-left">
          <div className="tx-search">
            <RiSearchLine size={18} className="tx-search-icon" />
            <input
              type="search"
              className="tx-search-input"
              placeholder="Search customer or description..."
              aria-label="Search customer or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="tx-segment" aria-label="Transaction type filter">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`tx-segment-btn ${activeType === tab.value ? 'tx-segment-btn--active' : ''}`}
                onClick={() => setActiveType(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label className="tx-store-filter">
            <span>Store:</span>
            <select
              className="tx-store-select"
              value={store}
              onChange={(e) => setStore(e.target.value)}
            >
              {stores.map((s) => (
                <option key={s} value={s}>
                  {s === 'All Stores' ? 'All stores' : s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="tx-toolbar-right">
          <span className="tx-result-count">{filtered.length} transactions</span>
        </div>
      </div>

      <div className="pg-card">
        <div className="pg-card-header">
          <span className="pg-card-title">
            Transactions
            <span className="tx-count">{filtered.length}</span>
          </span>
          {hasActiveFilters && (
            <span className="tx-active-filter-badge">Filters active</span>
          )}
        </div>
        <TransactionsTable transactions={filtered} />
      </div>
    </div>
  );
}
