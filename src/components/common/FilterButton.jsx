import { RiEqualizerLine } from 'react-icons/ri';

export default function FilterButton({ onClick }) {
  return (
    <button className="tx-btn tx-btn--ghost" onClick={onClick}>
      <RiEqualizerLine size={15} />
      Filter
    </button>
  );
}
