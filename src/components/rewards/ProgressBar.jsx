function getBarColor(value) {
  if (value >= 80) return '#16a34a';
  if (value >= 60) return '#1d4ed8';
  if (value >= 40) return '#f97316';
  return '#9ca3af';
}

export default function ProgressBar({ value }) {
  return (
    <div className="rw-progress-wrap">
      <div className="rw-progress-bar">
        <div className="rw-progress-fill" style={{ width: `${value}%`, background: getBarColor(value) }} />
      </div>
      <span className="rw-progress-label">{value}%</span>
    </div>
  );
}
