export default function FilterOptionCard({ title, subtitle, selected, onClick }) {
  return (
    <button
      type="button"
      className={`fm-option-card ${selected ? 'fm-option-card--selected' : ''}`}
      onClick={onClick}
    >
      <span className="fm-option-title">{title}</span>
      {subtitle && <span className="fm-option-sub">{subtitle}</span>}
    </button>
  );
}
