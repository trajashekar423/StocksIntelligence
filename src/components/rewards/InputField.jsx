export default function InputField({ label, required, error, suffix, children }) {
  return (
    <div className="mf-field">
      {label && (
        <label className="mf-label">
          {label}
          {required && <span className="mf-required"> *</span>}
        </label>
      )}
      {suffix ? (
        <div className="mf-input-suffix-wrap">
          {children}
          <span className="mf-input-suffix">{suffix}</span>
        </div>
      ) : children}
      {error && <span className="mf-error">{error}</span>}
    </div>
  );
}
