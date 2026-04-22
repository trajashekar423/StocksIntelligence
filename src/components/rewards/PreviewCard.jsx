export default function PreviewCard({ title, description, points }) {
  const displayTitle = title?.trim() || 'Reward Name';
  const displayDesc = description?.trim() || 'Reward description will appear here.';
  const displayPoints = Number(points) > 0 ? points : '--';

  return (
    <div className="mf-preview-card">
      <div className="mf-preview-top">
        <div className="mf-preview-info">
          <span className="mf-preview-name">{displayTitle}</span>
          <span className="mf-preview-desc">{displayDesc}</span>
        </div>
        <div className="mf-preview-pts">
          <svg width="14" height="14" fill="#F59E0B" viewBox="0 0 24 24" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>{displayPoints}</span>
          <span className="mf-preview-pts-label">pts</span>
        </div>
      </div>
      <button className="mf-preview-redeem" disabled>Redeem Reward</button>
    </div>
  );
}
