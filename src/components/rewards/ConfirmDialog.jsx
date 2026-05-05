export default function ConfirmDialog({ message, onConfirm, onCancel, submitting }) {
  return (
    <div className="rw-overlay" onClick={onCancel}>
      <div className="rw-confirm" onClick={(e) => e.stopPropagation()}>
        {/* Icon */}
        <div className="rw-confirm-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>

        <h6 className="rw-confirm-title">Delete Reward</h6>
        <p className="rw-confirm-msg">{message}</p>

        <div className="rw-confirm-actions">
          <button className="rw-btn-ghost" onClick={onCancel} disabled={submitting}>Cancel</button>
          <button className="rw-btn-danger" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
