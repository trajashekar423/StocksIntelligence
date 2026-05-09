import { useState } from 'react';
import TransactionRow, { EditPointsModal, HistoryModal } from './TransactionRow';

const COLUMNS = ['Customer', 'Type', 'Points', 'Description', 'Store', 'Date & Time', 'History', 'Actions'];

export default function TransactionsTable({ transactions, onSavePoints }) {
  const [historyDetails, setHistoryDetails] = useState(null);
  const [editTransaction, setEditTransaction] = useState(null);

  return (
    <>
      <div className="tx-table-wrap">
        <table className="tx-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th className="tx-th" key={col} scope="col">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.length ? (
              transactions.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  onOpenHistory={(transaction, history) => setHistoryDetails({ transaction, history })}
                  onEditPoints={setEditTransaction}
                />
              ))
            ) : (
              <tr>
                <td colSpan={COLUMNS.length} className="tx-empty">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {historyDetails && (
        <HistoryModal
          transaction={historyDetails.transaction}
          history={historyDetails.history}
          onClose={() => setHistoryDetails(null)}
        />
      )}

      {editTransaction && (
        <EditPointsModal
          transaction={editTransaction}
          onClose={() => setEditTransaction(null)}
          onSave={(payload) => {
            onSavePoints(payload);
            setEditTransaction(null);
          }}
        />
      )}
    </>
  );
}
