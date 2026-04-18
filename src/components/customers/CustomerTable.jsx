import CustomerRow from './CustomerRow';

const COLUMNS = ['Customer', 'Contact', 'Points', 'Last Visit', 'Status', 'Actions'];

export default function CustomerTable({ customers }) {
  return (
    <div className="cm-table-wrap">
      <table className="cm-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th className="cm-th" key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {customers.length ? (
            customers.map((c) => <CustomerRow key={c.id} customer={c} />)
          ) : (
            <tr>
              <td colSpan={COLUMNS.length} className="cm-empty">
                No customers match your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
