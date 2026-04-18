import TransactionRow from './TransactionRow';

const COLUMNS = ['Date & Time', 'Customer', 'Type', 'Description', 'Points', 'Location'];

export default function TransactionsTable({ transactions }) {
  return (
    <div className="tx-table-wrap">
      <table className="tx-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th className="tx-th" key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.length ? (
            transactions.map((t) => <TransactionRow key={t.id} transaction={t} />)
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
  );
}
