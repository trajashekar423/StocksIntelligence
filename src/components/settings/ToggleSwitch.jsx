export default function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={`st-toggle ${checked ? 'st-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="st-toggle-thumb" />
    </button>
  );
}
