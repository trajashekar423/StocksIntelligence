export default function ToggleSwitch({ label, checked, onChange }) {
  return (
    <div className="mf-toggle-row">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`mf-toggle${checked ? ' mf-toggle--on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="mf-toggle-thumb" />
      </button>
      <span className="mf-toggle-label">{label}</span>
    </div>
  );
}
