import { useState } from 'react';

export default function BrandingSettings() {
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [primary, setPrimary] = useState('#1d4ed8');
  const [secondary, setSecondary] = useState('#3b82f6');

  function handleLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="st-sections">
      <div className="st-card">
        <div className="st-card-header">Branding</div>
        <div className="st-card-body">
          <div className="st-field">
            <label className="st-label">Upload Logo</label>
            <div className="st-logo-upload">
              {preview
                ? <img src={preview} alt="logo preview" className="st-logo-preview" />
                : <span className="st-logo-placeholder">No logo uploaded</span>}
              <label className="rn-btn-primary st-upload-btn">
                Choose File
                <input type="file" accept="image/*" hidden onChange={handleLogo} />
              </label>
            </div>
            {logo && <p className="st-file-name">{logo.name}</p>}
          </div>

         
         
        </div>
      </div>

      <div className="st-save-row">
        <button className="rn-btn-primary">Save Changes</button>
      </div>
    </div>
  );
}
