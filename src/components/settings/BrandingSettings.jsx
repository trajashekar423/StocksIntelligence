'use client';

export default function BrandingSettings() {
  return (
    <div className="card border-0 shadow-sm p-4 mt-3">
      <h6 className="fw-bold mb-3">Branding & Logo</h6>
      <p className="text-muted small">Customize merchant portal brand identity and color themes.</p>
      <div className="d-flex align-items-center gap-3">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
          style={{ width: 48, height: 48, background: '#ff6a3d' }}
        >
          R
        </div>
        <button type="button" className="btn btn-sm btn-outline-secondary">Upload New Logo</button>
      </div>
    </div>
  );
}

