import RewardCard from './RewardCard';

export default function RewardsTable({ rewards, onEdit, onDelete }) {
  if (!rewards.length) {
    return <div className="rw-empty">No rewards found.</div>;
  }
  return (
    <div className="rw-card-list">
      {rewards.map((r) => (
        <RewardCard key={r.id} reward={r} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
