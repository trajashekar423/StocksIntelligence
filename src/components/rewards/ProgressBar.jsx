export default function ProgressBar({ value }) {
  return (
    <div className="rw-progress-wrap">
      <div className="rw-progress-bar">
        <div className="rw-progress-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="rw-progress-label">{value}%</span>
    </div>
  );
}
