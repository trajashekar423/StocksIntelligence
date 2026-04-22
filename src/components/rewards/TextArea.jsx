export default function TextArea({ label, error, ...props }) {
  return (
    <div className="mf-field">
      {label && <label className="mf-label">{label}</label>}
      <textarea className={`mf-input mf-textarea${error ? ' mf-input--error' : ''}`} {...props} />
      {error && <span className="mf-error">{error}</span>}
    </div>
  );
}
