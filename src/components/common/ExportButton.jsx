'use client';

import { FiDownload } from 'react-icons/fi';

export default function ExportButton({ onClick, label = 'Export CSV' }) {
  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
      onClick={onClick}
    >
      <FiDownload size={14} />
      <span>{label}</span>
    </button>
  );
}

