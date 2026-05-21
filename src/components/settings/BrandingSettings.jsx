import { useState } from 'react';

export default function BrandingSettings() {
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);

  function handleLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="st-sections st-sections--flat">
      <div className="st-card st-account-card">
        <div className="st-card-header">Brand image</div>
        <div className="st-card-body">
          <div className="st-field">
            <div className="st-logo-upload">
              {preview
                ? <img src={preview} alt="Brand preview" className="st-logo-preview" />
                : <span className="st-logo-placeholder">No image uploaded</span>}
              <label className="rn-btn-primary st-upload-btn">
                Change image
                <input type="file" accept="image/*" hidden onChange={handleLogo} />
              </label>
            </div>
            {logo && <p className="st-file-name">{logo.name}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
