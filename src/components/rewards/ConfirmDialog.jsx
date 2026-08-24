'use client';

export default function ConfirmDialog({ message, onConfirm, onCancel, submitting }) {
  return (
    <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content rounded-4 shadow p-2">
          <div className="modal-body text-center p-3">
            <p className="mb-4">{message}</p>
            <div className="d-flex justify-content-center gap-2">
              <button type="button" className="btn btn-sm btn-light" onClick={onCancel} disabled={submitting}>
                Cancel
              </button>
              <button type="button" className="btn btn-sm btn-danger" onClick={onConfirm} disabled={submitting}>
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

