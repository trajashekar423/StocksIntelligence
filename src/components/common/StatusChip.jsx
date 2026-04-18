const CONFIG = {
  EARNED:   { label: 'Earned',   cls: 'tx-chip--earned'   },
  REDEEMED: { label: 'Redeemed', cls: 'tx-chip--redeemed' },
};

export default function StatusChip({ type }) {
  const { label, cls } = CONFIG[type] ?? { label: type, cls: '' };
  return <span className={`tx-chip ${cls}`}>{label}</span>;
}
