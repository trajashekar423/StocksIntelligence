'use client';

import { useState } from 'react';

export default function PasswordSettings() {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');

  return (
    <div className="card border-0 shadow-sm p-4">
      <h6 className="fw-bold mb-3">Change Password</h6>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="mb-3">
          <label className="form-label small fw-semibold">Current Password</label>
          <input
            type="password"
            className="form-control"
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label small fw-semibold">New Password</label>
          <input
            type="password"
            className="form-control"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-sm btn-primary">Update Password</button>
      </form>
    </div>
  );
}

