export default function SelectionCard({ icon, label, description, selected, onClick }) {
  return (
    <button
      type="button"
      className={`mf-sel-card${selected ? ' mf-sel-card--active' : ''}`}
      onClick={onClick}
    >
      <span className="mf-sel-icon">{icon}</span>
      <span className="mf-sel-label">{label}</span>
      {description && <span className="mf-sel-desc">{description}</span>}
    </button>
  );
}
