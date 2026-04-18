import { RiDownloadLine } from 'react-icons/ri';

export default function ExportButton({ onClick }) {
  return (
    <button className="tx-btn tx-btn--primary" onClick={onClick}>
      <RiDownloadLine size={15} />
      Export
    </button>
  );
}
