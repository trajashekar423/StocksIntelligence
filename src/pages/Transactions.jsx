import { useState, useEffect, useMemo } from 'react';
import { getTransactions, exportTransactions } from '../services/transactionsService';
import { useTransactionFilters, applyFilters } from '../hooks/useTransactionFilters';
import TransactionsTable from '../components/transactions/TransactionsTable';
import FilterModal       from '../components/transactions/FilterModal';
import FilterButton      from '../components/common/FilterButton';
import ExportButton      from '../components/common/ExportButton';

const STORES = ['All Stores', 'Downtown', 'Uptown', 'Airport'];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [store,        setStore]        = useState('All Stores');
  const [modalOpen,    setModalOpen]    = useState(false);

  const { draft, applied, set, reset, apply, cancel, clearOne } = useTransactionFilters();

  useEffect(() => {
    getTransactions().then(setTransactions);
  }, []);

  const filtered = useMemo(() => {
    const byStore = store === 'All Stores'
      ? transactions
      : transactions.filter((t) => t.location === store);
    return applyFilters(byStore, applied);
  }, [transactions, store, applied]);

  const hasActiveFilters = applied.type !== 'ALL'
    || applied.dateRange !== 'ALL'
    || Number(applied.minPoints) !== 0
    || Number(applied.maxPoints) !== 999;

  return (
    <div className="tx-page">
      <div className="tx-page-header">
        <div>
          <h5 className="pg-title">Transaction History</h5>
          <p className="pg-sub">Full history of points earned and redeemed.</p>
        </div>
        <div className="tx-actions">
          <select
            className="tx-store-select"
            value={store}
            onChange={(e) => setStore(e.target.value)}
          >
            {STORES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="tx-filter-wrap">
            <FilterButton onClick={() => setModalOpen(true)} />
            {hasActiveFilters && <span className="tx-filter-dot" />}
          </div>
          <ExportButton onClick={() => exportTransactions(filtered)} />
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

      <FilterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        draft={draft}
        set={set}
        reset={reset}
        apply={apply}
        cancel={cancel}
        clearOne={clearOne}
      />
    </div>
  );
}
