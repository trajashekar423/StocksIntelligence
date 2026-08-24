'use client';

import { useState, useEffect } from 'react';

export default function RewardFormModal({ isEditMode, initialData, activeStores = [], onSubmit, onClose, submitting }) {
  const [title, setTitle] = useState(initialData?.title || initialData?.name || '');
  const [points, setPoints] = useState(initialData?.points_required || initialData?.points || 100);
  const [description, setDescription] = useState(initialData?.description || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...initialData,
      id: initialData?.id ?? initialData?.reward_id ?? initialData?.catalog_id,
      title,
      name: title,
      points_required: Number(points),
      description,
      business_ids: activeStores.map((s) => s.business_id || s.id),
      program_id: initialData?.program_id || 1,
    });
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 shadow">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">{isEditMode ? 'Edit Reward' : 'Create New Reward'}</h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={submitting} />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label small fw-semibold">Reward Title</label>
                <input
                  className="form-control"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Free Coffee"
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Points Required</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  min="1"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about this reward..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Reward'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

