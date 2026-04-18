import RewardRow from './RewardRow';

const COLUMNS = ['Reward', 'Points Required', 'Redeemed', 'Popularity', 'Actions'];

export default function RewardsTable({ rewards, onEdit, onDelete }) {
  return (
    <div className="rw-table-wrap">
      <table className="rw-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th className="rw-th" key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rewards.length ? (
            rewards.map((r) => (
              <RewardRow key={r.id} reward={r} onEdit={onEdit} onDelete={onDelete} />
            ))
          ) : (
            <tr>
              <td colSpan={COLUMNS.length} className="rw-empty">No rewards found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
